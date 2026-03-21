import { registerAnalyzer } from "../analyzerRegistry";

type RiskLevel = "low" | "medium" | "high";

function runComplianceChecker(text: string, config: Record<string, any> = {}) {
  const required = Array.isArray(config.requiredKeywords)
    ? (config.requiredKeywords as string[])
    : [];
  const forbidden = Array.isArray(config.forbiddenKeywords)
    ? (config.forbiddenKeywords as string[])
    : [];

  const lower = text.toLowerCase();

  const missingRequiredKeywords = required.filter(
    (k: string) => !lower.includes(k.toLowerCase())
  );

  const forbiddenKeywordHits = forbidden.filter((k: string) =>
    lower.includes(k.toLowerCase())
  );

  const matchedKeywords = required.filter((k: string) =>
    lower.includes(k.toLowerCase())
  );

  const issues: Array<{
    id: string;
    label: string;
    severity: RiskLevel;
    message: string;
    recommendation: string;
    matches: string[];
  }> = [];

  if (!lower.includes("governing law")) {
    issues.push({
      id: "missing_governing_law",
      label: "Missing Governing Law",
      severity: "medium",
      message:
        'The document does not appear to include a "governing law" provision.',
      recommendation: "Consider adding a governing law clause.",
      matches: [],
    });
  }

  missingRequiredKeywords.forEach((k: string) => {
    issues.push({
      id: `missing_required_${k.toLowerCase().replace(/\W+/g, "_")}`,
      label: `Missing Required Clause: ${k}`,
      severity: "medium",
      message: `The required term "${k}" was not detected in this document.`,
      recommendation: `Add ${k} language to the contract.`,
      matches: [],
    });
  });

  forbiddenKeywordHits.forEach((k: string) => {
    issues.push({
      id: `forbidden_keyword_${k.toLowerCase().replace(/\W+/g, "_")}`,
      label: `Forbidden Clause Detected: ${k}`,
      severity: "high",
      message: `Forbidden term "${k}" was detected in the document.`,
      recommendation: `Remove or revise ${k}.`,
      matches: [k],
    });
  });

  const riskScore = Math.min(100, 10 + issues.length * 25);
  const riskLevel: RiskLevel =
    riskScore > 50 ? "high" : riskScore > 20 ? "medium" : "low";

  return {
    product: "compliance_checker",
    label: "Compliance Checker",
    description:
      "Checks contracts for compliance-related concerns and missing legal protections.",
    documentType: "contract",
    riskScore,
    riskLevel,
    summary:
      issues.length > 0
        ? `${issues.length} compliance issue${issues.length === 1 ? "" : "s"} detected.`
        : "No major compliance issues detected.",
    matchedKeywords,
    missingRequiredKeywords,
    forbiddenKeywordHits,
    issues,
    deadlines: [],
    metadata: {
      textLength: text.length,
      issueCount: issues.length,
      deadlineCount: 0,
    },
  };
}

registerAnalyzer({
  id: "compliance_checker",
  name: "Compliance Checker",
  description: "Checks contracts for compliance issues.",
  analyzer: runComplianceChecker,
});
