import { getAnalyzer } from "./analyzerRegistry";
import { getProductConfig, ProductTemplate, ProductConfig, Severity } from "./productConfigs";
import { getTopRelevantChunks } from "./retrieval";
import "./analyzers/complianceChecker";
import "./analyzers/deadlineExtractor";

export interface AnalyzeRequest {
  text: string;
  template: ProductTemplate;
  config?: Record<string, any>;
}

export interface DetectedIssue {
  id: string;
  label: string;
  severity: Severity;
  message: string;
  explanation?: string;
  recommendation: string;
  matches?: string[];
}

export interface DetectedDeadline {
  id: string;
  label: string;
  value: string;
}

export interface AnalysisResult {
  product: string;
  label: string;
  description: string;
  documentType: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  matchedKeywords: string[];
  missingRequiredKeywords: string[];
  forbiddenKeywordHits: string[];
  issues: DetectedIssue[];
  deadlines: DetectedDeadline[];
  metadata: {
    textLength: number;
    issueCount: number;
    deadlineCount: number;
  };
}

export function runDeterministicExtraction({
  text,
  template,
  config = {},
}: AnalyzeRequest): AnalysisResult | { error: string } {
  const productConfig = getProductConfig(template);

  if (!productConfig) {
    return {
      error: "Unknown template",
    };
  }

  const analysisText = buildRetrievalContext(text, productConfig, config);
  const analyzer = getAnalyzer(template);

  if (analyzer) {
    return analyzer(analysisText, config);
  }

  return analyzeWithConfig(analysisText, productConfig, config);
}

function buildRetrievalContext(
  fullText: string,
  productConfig: ProductConfig,
  runtimeConfig: Record<string, any>
): string {
  const normalizedFullText = normalizeText(fullText);

  if (!normalizedFullText) {
    return normalizedFullText;
  }

  const runtimeQueries = Array.isArray(runtimeConfig.retrievalQueries)
    ? (runtimeConfig.retrievalQueries as string[])
    : [];
  const configQueries = productConfig.retrievalQueries || [];
  const queries = uniqueStrings([...configQueries, ...runtimeQueries]);

  if (queries.length === 0) {
    return normalizedFullText;
  }

  try {
    const retrievedChunks: string[] = [];

    for (const query of queries) {
      const topChunks = getTopRelevantChunks(normalizedFullText, query, 4);
      for (const chunk of topChunks) {
        retrievedChunks.push(chunk);
      }
    }

    const uniqueChunks = uniqueStrings(retrievedChunks);
    const retrievedContext = uniqueChunks.join("\n\n").trim();

    // Safety fallback: if retrieval is too sparse, analyze full text instead.
    if (!retrievedContext || retrievedContext.length < 500) {
      return normalizedFullText;
    }

    return retrievedContext;
  } catch {
    return normalizedFullText;
  }
}

function analyzeWithConfig(
  text: string,
  productConfig: ProductConfig,
  runtimeConfig: Record<string, any> = {}
): AnalysisResult {
  const normalizedText = normalizeText(text);

  const effectiveRequiredKeywords = uniqueStrings([
    ...(productConfig.requiredKeywords || []),
    ...((runtimeConfig.requiredKeywords as string[]) || []),
  ]);

  const effectiveForbiddenKeywords = uniqueStrings([
    ...(productConfig.forbiddenKeywords || []),
    ...((runtimeConfig.forbiddenKeywords as string[]) || []),
  ]);

  const effectiveRequiredClauses = [
    ...(productConfig.requiredClauses || []),
    ...((runtimeConfig.requiredClauses as ProductConfig["requiredClauses"]) || []),
  ];

  const effectiveProductConfig: ProductConfig = {
    ...productConfig,
    requiredKeywords: effectiveRequiredKeywords,
    forbiddenKeywords: effectiveForbiddenKeywords,
    requiredClauses: effectiveRequiredClauses,
  };

  const matchedKeywords = findMatchedKeywords(
    normalizedText,
    effectiveRequiredKeywords
  );

  const missingRequiredKeywords = findMissingKeywords(
    normalizedText,
    effectiveRequiredKeywords
  );

  const forbiddenKeywordHits = findMatchedKeywords(
    normalizedText,
    effectiveForbiddenKeywords
  );

  const requiredClauseIssues = detectMissingRequiredClauses(
    normalizedText,
    effectiveProductConfig
  );

  const issueMatches = detectConfiguredIssues(
    normalizedText,
    effectiveProductConfig
  );

  const forbiddenIssues = forbiddenKeywordHits.map((keyword) => ({
    id: `forbidden_keyword_${slugify(keyword)}`,
    label: "Forbidden Keyword Detected",
    severity: "high" as Severity,
    message: `Forbidden keyword detected: "${keyword}".`,
    explanation:
      "This language appears on your forbidden list and may introduce legal or compliance risk if it remains in the contract.",
    recommendation:
      "Remove, rewrite, or escalate this language before relying on the document.",
    matches: extractClauseMatchesForKeyword(normalizedText, keyword),
  }));

  const missingKeywordIssues = missingRequiredKeywords.map((keyword) => ({
    id: `missing_required_keyword_${slugify(keyword)}`,
    label: "Missing Required Keyword",
    severity: "medium" as Severity,
    message: `The required term "${keyword}" was not detected in this document.`,
    explanation:
      "A required legal or policy term is missing, which can leave obligations or protections unclear.",
    recommendation:
      "Review whether this document should explicitly include this required language.",
    matches: [],
  }));

  const issues = dedupeIssues([
    ...requiredClauseIssues,
    ...issueMatches,
    ...forbiddenIssues,
    ...missingKeywordIssues,
  ]);

  const deadlines = extractDeadlines(normalizedText, effectiveProductConfig);

  const scoring = effectiveProductConfig.scoring ?? {
    low: 5,
    medium: 15,
    high: 30,
    thresholds: {
      low: 20,
      medium: 50,
      high: 100,
    },
  };

  const riskScore = calculateRiskScore(issues, scoring);
  const riskLevel = mapRiskLevel(riskScore, scoring.thresholds);
  const documentType = inferDocumentType(
    normalizedText,
    effectiveProductConfig,
    runtimeConfig
  );
  const summary = buildSummary({
    issues,
    riskLevel,
    riskScore,
  });

  return {
    product: effectiveProductConfig.id,
    label: effectiveProductConfig.label,
    description: effectiveProductConfig.description,
    documentType,
    riskScore,
    riskLevel,
    summary,
    matchedKeywords,
    missingRequiredKeywords,
    forbiddenKeywordHits,
    issues,
    deadlines,
    metadata: {
      textLength: text.length,
      issueCount: issues.length,
      deadlineCount: deadlines.length,
    },
  };
}

function normalizeText(text: string): string {
  return (text || "").replace(/\r\n/g, "\n").trim();
}

function normalizeForContains(text: string): string {
  return text.toLowerCase();
}

function findMatchedKeywords(text: string, keywords: string[]): string[] {
  const lower = normalizeForContains(text);
  return keywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function findMissingKeywords(text: string, keywords: string[]): string[] {
  const lower = normalizeForContains(text);
  return keywords.filter((keyword) => !lower.includes(keyword.toLowerCase()));
}

function detectMissingRequiredClauses(
  text: string,
  productConfig: ProductConfig
): DetectedIssue[] {
  const lower = normalizeForContains(text);
  const clauses = productConfig.requiredClauses || [];

  return clauses.flatMap((clause) => {
    const found = clause.keywords.some((keyword) =>
      lower.includes(keyword.toLowerCase())
    );

    if (found) {
      return [];
    }

    return [
      {
        id: clause.id,
        label: `Missing ${clause.label}`,
        severity: clause.severity,
        message: clause.message,
        explanation: clause.explanation || clause.message,
        recommendation: clause.recommendation,
        matches: [],
      },
    ];
  });
}

function detectConfiguredIssues(
  text: string,
  productConfig: ProductConfig
): DetectedIssue[] {
  const configuredIssues = productConfig.issues || [];

  return configuredIssues.flatMap((issue) => {
    const keywordClauseMatches = collectKeywordClauseMatches(
      text,
      issue.keywords || []
    );

    const regexMatches = collectRegexMatches(text, issue.regexes || []);
    const combinedMatches = uniqueStrings([
      ...keywordClauseMatches,
      ...regexMatches,
    ]);

    if (combinedMatches.length === 0) {
      return [];
    }

    return [
      {
        id: issue.id,
        label: issue.label,
        severity: issue.severity,
        message: issue.message,
        explanation: issue.explanation || issue.message,
        recommendation: issue.recommendation,
        matches: combinedMatches,
      },
    ];
  });
}

function collectKeywordClauseMatches(text: string, keywords: string[]): string[] {
  const matches: string[] = [];

  for (const keyword of keywords) {
    matches.push(...extractClauseMatchesForKeyword(text, keyword));
  }

  return uniqueStrings(matches);
}

function extractClauseMatchesForKeyword(text: string, keyword: string): string[] {
  if (!keyword.trim()) return [];

  const lowerText = normalizeForContains(text);
  const lowerKeyword = keyword.toLowerCase();
  const results: string[] = [];

  let startIndex = 0;
  while (true) {
    const matchIndex = lowerText.indexOf(lowerKeyword, startIndex);
    if (matchIndex === -1) break;

    const paragraph = extractContainingParagraph(text, matchIndex);
    if (paragraph) results.push(cleanMatchText(paragraph));

    startIndex = matchIndex + lowerKeyword.length;
  }

  return cleanMatches(results);
}

function cleanMatches(matches: string[]) {
  const unique = [...new Set(matches.map((m) => m.trim()))];

  // Remove tiny fragments
  const filtered = unique.filter((m) => m.length > 40);

  // Prefer the shortest meaningful clause
  filtered.sort((a, b) => a.length - b.length);

  return filtered.slice(0, 1);
}

function extractContainingParagraph(text: string, index: number): string {
  const normalized = text.replace(/\r\n/g, "\n");

  let start = normalized.lastIndexOf("\n\n", index);
  if (start === -1) {
    start = 0;
  } else {
    start += 2;
  }

  let end = normalized.indexOf("\n\n", index);
  if (end === -1) {
    end = normalized.length;
  }

  const paragraph = normalized.slice(start, end).trim();
  return paragraph;
}

function findSentenceBoundaryBackward(text: string, index: number): number {
  for (let i = index; i >= 0; i--) {
    const char = text[i];
    if (char === "." || char === "!" || char === "?" || char === "\n") {
      return i + 1;
    }
  }
  return 0;
}

function findSentenceBoundaryForward(text: string, index: number): number {
  for (let i = index; i < text.length; i++) {
    const char = text[i];
    if (char === "." || char === "!" || char === "?" || char === "\n") {
      return i + 1;
    }
  }

  return text.length;
}

function cleanMatchText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function collectRegexMatches(text: string, regexes: RegExp[]): string[] {
  const matches: string[] = [];

  for (const regex of regexes) {
    const safeRegex = cloneRegex(regex);
    let match: RegExpExecArray | null;

    while ((match = safeRegex.exec(text)) !== null) {
      if (match[1]) {
        matches.push(cleanMatchText(match[1]));
      } else if (match[0]) {
        matches.push(cleanMatchText(match[0]));
      }

      if (!safeRegex.global) {
        break;
      }
    }
  }

  return uniqueStrings(matches);
}

function extractDeadlines(
  text: string,
  productConfig: ProductConfig
): DetectedDeadline[] {
  const patterns = productConfig.deadlinePatterns || [];
  const deadlines: DetectedDeadline[] = [];

  for (const pattern of patterns) {
    for (const regex of pattern.regexes) {
      const safeRegex = cloneRegex(regex);
      let match: RegExpExecArray | null;

      while ((match = safeRegex.exec(text)) !== null) {
        const value = (match[2] || match[1] || match[0] || "").trim();

        if (value) {
          deadlines.push({
            id: pattern.id,
            label: pattern.label,
            value,
          });
        }

        if (!safeRegex.global) {
          break;
        }
      }
    }
  }

  return dedupeDeadlines(deadlines);
}

function calculateRiskScore(
  issues: DetectedIssue[],
  scoring: NonNullable<ProductConfig["scoring"]>
): number {
  const total = issues.reduce((sum, issue) => {
    return sum + scoring[issue.severity];
  }, 0);

  return Math.min(total, 100);
}

function mapRiskLevel(
  score: number,
  thresholds: NonNullable<ProductConfig["scoring"]>["thresholds"]
): "low" | "medium" | "high" {
  if (score <= thresholds.low) {
    return "low";
  }

  if (score <= thresholds.medium) {
    return "medium";
  }

  return "high";
}

function inferDocumentType(
  text: string,
  productConfig: ProductConfig,
  runtimeConfig: Record<string, any>
): string {
  if (
    typeof runtimeConfig.documentType === "string" &&
    runtimeConfig.documentType
  ) {
    return runtimeConfig.documentType;
  }

  const lower = normalizeForContains(text);

  const heuristics: Array<{ type: string; signals: string[] }> = [
    {
      type: "nda",
      signals: [
        "non-disclosure",
        "confidential information",
        "disclosing party",
        "receiving party",
      ],
    },
    {
      type: "employment_agreement",
      signals: [
        "employee",
        "employer",
        "employment",
        "position",
        "salary",
        "compensation",
      ],
    },
    {
      type: "vendor_agreement",
      signals: [
        "vendor",
        "supplier",
        "service levels",
        "purchase order",
        "deliverables",
      ],
    },
    {
      type: "service_agreement",
      signals: [
        "service agreement",
        "statement of work",
        "scope of work",
        "services rendered",
        "provider shall",
        "client shall",
      ],
    },
    {
      type: "contract",
      signals: [
        "agreement",
        "this agreement",
        "party",
        "parties",
        "term",
        "termination",
        "breach",
        "governing law",
        "liability",
      ],
    },
    {
      type: "invoice",
      signals: [
        "invoice",
        "amount due",
        "bill to",
        "payment due",
        "invoice number",
      ],
    },
    {
      type: "policy",
      signals: ["policy", "procedure", "compliance", "governance"],
    },
  ];

  for (const heuristic of heuristics) {
    const matchCount = heuristic.signals.filter((signal) =>
      lower.includes(signal)
    ).length;

    if (matchCount >= 2) {
      return heuristic.type;
    }
  }

  for (const heuristic of heuristics) {
    if (heuristic.signals.some((signal) => lower.includes(signal))) {
      return heuristic.type;
    }
  }

  return productConfig.documentTypes[0] || "general";
}

function buildSummary({
  issues,
  riskLevel,
  riskScore,
}: {
  issues: DetectedIssue[];
  riskLevel: "low" | "medium" | "high";
  riskScore: number;
}): string {
  const highIssues = issues.filter((issue) => issue.severity === "high");
  const mediumIssues = issues.filter((issue) => issue.severity === "medium");
  const lowIssues = issues.filter((issue) => issue.severity === "low");

  const orderedIssues = [...highIssues, ...mediumIssues, ...lowIssues];

  const issueSummaryLine =
    issues.length === 1 ? "1 issue detected:" : `${issues.length} issues detected:`;

  const issueLines = orderedIssues.map(
    (issue) => `- ${issue.label} (${issue.severity.toUpperCase()})`
  );

  return [
    `Risk Level: ${riskLevel.toUpperCase()}`,
    `Risk Score: ${riskScore}/100`,
    "",
    "Summary:",
    issueSummaryLine,
    ...issueLines,
  ].join("\n");
}

function dedupeIssues(issues: DetectedIssue[]): DetectedIssue[] {
  const map = new Map<string, DetectedIssue>();

  for (const issue of issues) {
    const existing = map.get(issue.id);

    if (!existing) {
      map.set(issue.id, {
        ...issue,
        matches: uniqueStrings(issue.matches || []),
      });
      continue;
    }

    map.set(issue.id, {
      ...existing,
      matches: uniqueStrings([
        ...(existing.matches || []),
        ...(issue.matches || []),
      ]),
    });
  }

  return Array.from(map.values());
}

function dedupeDeadlines(deadlines: DetectedDeadline[]): DetectedDeadline[] {
  const groupedByLabel = new Map<string, DetectedDeadline[]>();

  for (const deadline of deadlines) {
    const labelKey = deadline.label.toLowerCase().trim();
    const group = groupedByLabel.get(labelKey) || [];
    group.push(deadline);
    groupedByLabel.set(labelKey, group);
  }

  const result: DetectedDeadline[] = [];

  for (const [labelKey, group] of groupedByLabel.entries()) {
    const dedupedForLabel: DetectedDeadline[] = [];

    for (const deadline of group) {
      const normalizedValue = deadline.value.replace(/\s+/g, " ").trim().toLowerCase();
      let merged = false;

      for (const existing of dedupedForLabel) {
        const existingNormalized = existing.value.replace(/\s+/g, " ").trim().toLowerCase();

        const isEquivalent =
          existingNormalized === normalizedValue ||
          existingNormalized.includes(normalizedValue) ||
          normalizedValue.includes(existingNormalized);

        if (isEquivalent) {
          const keepCurrent = normalizedValue.length > existingNormalized.length;

          if (keepCurrent) {
            existing.value = deadline.value;
          }

          merged = true;
          break;
        }
      }

      if (!merged) {
        dedupedForLabel.push(deadline);
      }
    }

    result.push(...dedupedForLabel);
  }

  return result;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cloneRegex(regex: RegExp): RegExp {
  return new RegExp(regex.source, regex.flags);
}