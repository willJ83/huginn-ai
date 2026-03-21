import { registerAnalyzer } from "../analyzerRegistry";

function runDeadlineExtractor(text: string, config: Record<string, any> = {}) {
  const deadlines: Array<{ id: string; label: string; value: string }> = [];
  const issues: Array<{
    id: string;
    label: string;
    severity: "low" | "medium" | "high";
    message: string;
    recommendation: string;
    matches?: string[];
  }> = [];

  const patterns = [
    {
      id: "contract_renewal",
      label: "Contract Renewal Date",
      regex: /renewal(?: date)?[:\s]+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/gi,
    },
    {
      id: "termination_notice",
      label: "Termination Notice",
      regex: /termination notice(?: period)?[:\s]+(\d+\s+days?)/gi,
    },
    {
      id: "payment_due",
      label: "Payment Due",
      regex: /payment due[:\s]+(net\s+\d+|\d+\s+days?)/gi,
    },
    {
      id: "date_mention",
      label: "Date Mention",
      regex:
        /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},\s+\d{4}\b/gi,
    },
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.regex.exec(text)) !== null) {
      deadlines.push({
        id: `${pattern.id}_${deadlines.length + 1}`,
        label: pattern.label,
        value: match[1] ?? match[0],
      });
    }
  }

  return {
    product: "deadline_obligation_extractor",
    label: "Deadline & Obligation Extractor",
    description: "Extracts important contract deadlines and obligations.",
    documentType: "contract",
    riskScore: deadlines.length > 0 ? 12 : 5,
    riskLevel: "low" as const,
    summary:
      deadlines.length > 0
        ? `${deadlines.length} deadline${deadlines.length === 1 ? "" : "s"} extracted.`
        : "No deadlines extracted.",
    matchedKeywords: [],
    missingRequiredKeywords: [],
    forbiddenKeywordHits: [],
    issues,
    deadlines,
    metadata: {
      textLength: text.length,
      issueCount: issues.length,
      deadlineCount: deadlines.length,
    },
  };
}

registerAnalyzer({
  id: "deadline_monitor",
  name: "Deadline Monitor",
  description: "Monitors important contract deadlines.",
  analyzer: runDeadlineExtractor,
});

registerAnalyzer({
  id: "deadline_obligation_extractor",
  name: "Deadline & Obligation Extractor",
  description: "Extracts deadlines and obligations from contracts.",
  analyzer: runDeadlineExtractor,
});
