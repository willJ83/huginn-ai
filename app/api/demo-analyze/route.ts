import { NextResponse } from "next/server";
import { getProModel, parseGeminiJSON } from "@/lib/gemini";
import { runDeterministicExtraction } from "../../lib/riskEngine";
import { HUGINN_V2_PROMPT, DEMO_JURISDICTION_PROMPT } from "../../lib/huginnPrompt";
import { DEMO_CONTRACTS, type DemoContractId } from "@/lib/demoContracts";
import { extractJurisdictionFromText } from "@/lib/jurisdictionExtractor";

interface ClauseEntry {
  status: "found" | "missing";
  text?: string;
  location?: string;
}

interface AnalysisIssue {
  id: string;
  label: string;
  severity: string;
  clauseReference?: string;
  message?: string;
  explanation?: string;
  recommendation?: string;
  matches?: string[];
}

interface AnalysisMissingProtection {
  label: string;
  severity: string;
  explanation?: string;
  recommendation?: string;
}

interface AnalysisDeadline {
  label: string;
  value?: string;
  description?: string;
}

interface AnalysisResult {
  riskScore: number;
  summary: string;
  issues: AnalysisIssue[];
  missingProtections: AnalysisMissingProtection[];
  deadlines: AnalysisDeadline[];
}

interface DemoJurisdictionResult {
  jurisdictionAnalysis: string[];
  jurisdictionDeepScan: string[];
  jurisdictionComparisonNote?: string;
}

function deriveRiskLevel(score: number): string {
  if (score >= 80) return "low";
  if (score >= 50) return "medium";
  return "high";
}

async function runAnalysisPipeline(
  contractText: string
): Promise<{ result: AnalysisResult; contractType: string } | null> {
  try {
    // Stage 1 — classify
    const classifyModel = getProModel(undefined, 512);
    const classifyResult = await classifyModel.generateContent(
      `Identify the contract type from this list: Master Service Agreement, Statement of Work, NDA, SLA, Independent Contractor Agreement, Licensing Agreement, SaaS Subscription Agreement, Terms of Service, Data Processing Agreement, Vendor Agreement, Purchase Agreement, Partnership Agreement, Employment Agreement, Consulting Agreement, Marketing Services Agreement, Software Development Agreement, Maintenance & Support Agreement, Reseller Agreement, Franchise Agreement, Amendment/Addendum. Return JSON only: { "type": string, "confidence": string, "rationale": string }\n\nContract text:\n${contractText}`
    );
    let contractType = { type: "Unknown", confidence: "low", rationale: "" };
    const parsedClassify = parseGeminiJSON<typeof contractType>(classifyResult.response.text());
    if (parsedClassify) contractType = parsedClassify;

    // Stage 2 — extract
    const extractModel = getProModel(undefined, 4096);
    const extractResult = await extractModel.generateContent(
      `This is a ${contractType.type}. Extract all clauses present and flag any missing. Categories: confidentiality, indemnification, limitation_of_liability, ip_ownership, payment_terms, termination, renewal, governing_law, warranties, data_protection, service_levels, deliverables, non_compete, non_solicit, insurance, dispute_resolution, audit_rights, royalties, support. For each: status (found/missing), exact text, location in document. Return JSON only.\n\nContract text:\n${contractText}`
    );
    let extractedClauses: Record<string, ClauseEntry> = {};
    const parsedExtract = parseGeminiJSON<Record<string, ClauseEntry>>(extractResult.response.text());
    if (parsedExtract) extractedClauses = parsedExtract;

    // Stage 3 — analyze
    const deterministicResult = runDeterministicExtraction({
      text: contractText,
      template: "compliance_checker",
      config: {},
    });
    const deterministicInput = "error" in deterministicResult ? {} : deterministicResult;

    const analyzeModel = getProModel(HUGINN_V2_PROMPT, 8192);
    const analyzeResult = await analyzeModel.generateContent(
      `Contract Type: ${contractType.type} (Confidence: ${contractType.confidence})\nRationale: ${contractType.rationale}\n\nExtracted Clauses:\n${JSON.stringify(extractedClauses, null, 2)}\n\nDeterministic Findings:\n${JSON.stringify(deterministicInput, null, 2)}\n\nFull contract text:\n${contractText}`
    );

    const parsed = parseGeminiJSON<AnalysisResult>(analyzeResult.response.text());
    if (!parsed || typeof parsed.riskScore !== "number" || !parsed.summary) return null;

    return { result: parsed, contractType: contractType.type };
  } catch {
    return null;
  }
}

async function runDemoJurisdictionStage(
  contractText: string,
  jurisdiction: string
): Promise<DemoJurisdictionResult | null> {
  try {
    const model = getProModel(DEMO_JURISDICTION_PROMPT, 2048);
    const result = await model.generateContent(
      `Governing law jurisdiction detected in this contract: ${jurisdiction}\n\nFull contract text:\n${contractText}`
    );
    return parseGeminiJSON<DemoJurisdictionResult>(result.response.text());
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { contractId } = body as { contractId?: DemoContractId };

    if (!contractId || !DEMO_CONTRACTS[contractId]) {
      return NextResponse.json(
        { ok: false, error: "Invalid demo contract ID. Use 'demo1' or 'demo2'." },
        { status: 400 }
      );
    }

    const contract = DEMO_CONTRACTS[contractId];
    const contractText = contract.text;

    // Auto-extract jurisdiction
    const extracted = extractJurisdictionFromText(contractText);
    const jurisdiction = extracted.jurisdiction ?? contract.state;
    const jurisdictionConfidence = extracted.confidence;

    // Run analysis pipeline
    const pipelineResult = await runAnalysisPipeline(contractText);

    let finalIssues: AnalysisIssue[];
    let finalRiskScore: number;
    let finalSummary: string;
    let finalDeadlines: AnalysisDeadline[];
    let finalRiskLevel: string;

    if (pipelineResult) {
      const { result } = pipelineResult;
      const missingAsIssues = (result.missingProtections ?? []).map(
        (mp, i): AnalysisIssue => ({
          id: `missing-${i}`,
          label: mp.label,
          severity: "missing",
          explanation: mp.explanation,
          recommendation: mp.recommendation,
          matches: [],
        })
      );
      finalIssues = [...(result.issues ?? []), ...missingAsIssues];
      finalRiskScore = result.riskScore;
      finalSummary = result.summary;
      finalDeadlines = result.deadlines ?? [];
      finalRiskLevel = deriveRiskLevel(result.riskScore);
    } else {
      // Fallback if Gemini fails
      finalIssues = [];
      finalRiskScore = 50;
      finalSummary = "Analysis could not be completed. Please try again.";
      finalDeadlines = [];
      finalRiskLevel = "medium";
    }

    // Run jurisdiction deep scan
    let jurisdictionAnalysis: string[] = [];
    let jurisdictionDeepScan: string[] = [];
    let jurisdictionComparisonNote: string | undefined;

    if (jurisdiction) {
      const jurisdictionResult = await runDemoJurisdictionStage(contractText, jurisdiction);
      if (jurisdictionResult) {
        jurisdictionAnalysis = jurisdictionResult.jurisdictionAnalysis ?? [];
        jurisdictionDeepScan = jurisdictionResult.jurisdictionDeepScan ?? [];
        jurisdictionComparisonNote = jurisdictionResult.jurisdictionComparisonNote;
      }
    }

    // Fallback jurisdiction content if LLM call failed
    if (jurisdictionAnalysis.length === 0) {
      jurisdictionAnalysis = jurisdiction
        ? [
            `Governing law detected: ${jurisdiction}.`,
            "Jurisdiction analysis could not be fully completed — try again for detailed findings.",
          ]
        : [
            "No governing law clause detected in this contract.",
            "Analysis based on general U.S. commercial standards.",
            "Specify jurisdiction for more accurate risk detection.",
          ];
    }
    if (jurisdictionDeepScan.length === 0 && jurisdiction) {
      jurisdictionDeepScan = [
        `State-specific deep scan for ${jurisdiction} could not be completed — please retry.`,
      ];
    }

    return NextResponse.json({
      ok: true,
      demoName: contract.name,
      demoId: contractId,
      riskScore: finalRiskScore,
      riskLevel: finalRiskLevel,
      summary: finalSummary,
      issues: finalIssues,
      deadlines: finalDeadlines,
      jurisdiction,
      jurisdictionConfidence,
      jurisdictionAnalysis,
      jurisdictionDeepScan,
      ...(jurisdictionComparisonNote ? { jurisdictionComparisonNote } : {}),
    });
  } catch (error) {
    console.error("DEMO ANALYZE ERROR:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { ok: false, error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
