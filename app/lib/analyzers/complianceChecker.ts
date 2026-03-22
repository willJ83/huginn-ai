import { registerAnalyzer } from "../analyzerRegistry";

type RiskLevel = "low" | "medium" | "high";

type ComplianceIssue = {
  id: string;
  label: string;
  severity: RiskLevel;
  message: string;
  recommendation: string;
  matches: string[];
};

function pushIssueOnce(issues: ComplianceIssue[], issue: ComplianceIssue) {
  if (issues.some((existing) => existing.id === issue.id)) return;
  issues.push(issue);
}

function collectRegexMatches(text: string, patterns: RegExp[]): string[] {
  const hits = new Set<string>();

  patterns.forEach((pattern) => {
    const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    let match: RegExpExecArray | null = regex.exec(text);

    while (match) {
      const captured = (match[0] || "").trim();
      if (captured) hits.add(captured);
      match = regex.exec(text);
    }
  });

  return Array.from(hits).slice(0, 3);
}

function inferRiskLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function parseCurrencyAmount(rawAmount: string): number {
  const digits = rawAmount.replace(/[$,\s]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function runComplianceChecker(text: string, config: Record<string, any> = {}) {
  const required = Array.isArray(config.requiredKeywords)
    ? (config.requiredKeywords as string[])
    : [];
  const forbidden = Array.isArray(config.forbiddenKeywords)
    ? (config.forbiddenKeywords as string[])
    : [];

  const lower = text.toLowerCase();
  const normalized = normalizeForMatching(text);

  const missingRequiredKeywords = required.filter(
    (k: string) => !lower.includes(k.toLowerCase())
  );

  const forbiddenKeywordHits = forbidden.filter((k: string) =>
    lower.includes(k.toLowerCase())
  );

  const matchedKeywords = required.filter((k: string) =>
    lower.includes(k.toLowerCase())
  );

  const issues: ComplianceIssue[] = [];

  const hasGoverningLaw =
    normalized.includes("governing law") ||
    normalized.includes("laws of") ||
    normalized.includes("law of the state of");

  const hasUndefinedGoverningLaw =
    /governing law[^.\n]{0,120}(?:omitted|not specified|tbd|to be determined|intentionally omitted|\[[^\]]*\])/i.test(
      text
    ) ||
    (normalized.includes("governing law") &&
      includesAny(normalized, [
        "intentionally omitted",
        "not specified",
        "to be determined",
        "tbd",
      ]));

  if (hasUndefinedGoverningLaw) {
    pushIssueOnce(issues, {
      id: "missing_or_undefined_governing_law",
      label: "Missing or Undefined Governing Law",
      severity: "high",
      message:
        "A governing law heading appears present, but the clause content is missing, placeholder-based, or undefined.",
      recommendation:
        "Specify a clear governing law jurisdiction instead of placeholders or omitted text.",
      matches: collectRegexMatches(text, [
        /governing law[^.\n]{0,160}(?:omitted|not specified|tbd|to be determined|intentionally omitted|\[[^\]]*\])/i,
      ]),
    });
  }

  if (!hasGoverningLaw) {
    pushIssueOnce(issues, {
      id: "missing_governing_law",
      label: "Missing Governing Law",
      severity: "medium",
      message:
        'The document does not appear to include a "governing law" provision.',
      recommendation: "Consider adding a governing law clause.",
      matches: [],
    });
  }

  const lateContextRegex = /(late payment|late payments|late fee|penalt\w+|interest charge|delinquen\w+)/i;
  const percentNearLateRegex =
    /(?:late payment|late payments|late fee|penalt\w+|interest charge|delinquen\w+)[^.\n]{0,100}(\d{1,2}(?:\.\d+)?)\s*%|(\d{1,2}(?:\.\d+)?)\s*%[^.\n]{0,100}(?:late payment|late payments|late fee|penalt\w+|interest charge|delinquen\w+)/i;
  const latePenaltyMatch = percentNearLateRegex.exec(text);
  const latePenaltyPercent = latePenaltyMatch
    ? Number(latePenaltyMatch[1] || latePenaltyMatch[2])
    : null;

  if ((latePenaltyPercent !== null && latePenaltyPercent >= 8) || lateContextRegex.test(text)) {
    pushIssueOnce(issues, {
      id: "extreme_late_fee_or_penalty",
      label: "Extreme Late Fee / Penalty",
      severity:
        latePenaltyPercent !== null && latePenaltyPercent >= 8 ? "high" : "medium",
      message:
        latePenaltyPercent !== null
          ? `Late fee or penalty appears elevated at ${latePenaltyPercent}%.`
          : "Late fee/interest/penalty language appears potentially aggressive.",
      recommendation:
        "Reduce late fee/penalty to a commercially reasonable percentage and clarify calculation cadence.",
      matches: collectRegexMatches(text, [
        /(?:late payment|late payments|late fee|penalt\w+|interest charge|delinquen\w+)[^.\n]{0,150}/i,
        /(\d{1,2}(?:\.\d+)?)\s*%[^.\n]{0,100}(?:late payment|late fee|penalt\w+|interest)/i,
      ]),
    });
  }

  const hasAnyIndemnity = normalized.includes("indemnif");
  const hasCustomerIndemnity =
    /(client|customer|buyer|licensee|subscriber|user)[^.\n]{0,120}\bindemnif\w*/i.test(text) ||
    (includesAny(normalized, ["client", "customer", "buyer", "licensee", "subscriber", "user"]) &&
      hasAnyIndemnity);
  const hasProviderIndemnity = /(provider|company|vendor|licensor|supplier|service provider)[^.\n]{0,120}\bindemnif\w*/i.test(
    text
  );

  if (hasCustomerIndemnity && !hasProviderIndemnity) {
    pushIssueOnce(issues, {
      id: "one_sided_indemnity",
      label: "One-Sided Indemnity",
      severity: "high",
      message:
        "Indemnity appears to run one way and may leave the customer without reciprocal protection.",
      recommendation:
        "Add mutual indemnity language or clearly define reciprocal obligations and carve-outs.",
      matches: collectRegexMatches(text, [
        /(?:client|customer|buyer|licensee|subscriber|user)[^.\n]{0,160}\bindemnif\w*/gi,
        /\bindemnif\w*[^.\n]{0,120}(?:client|customer|buyer|licensee|subscriber|user)/gi,
      ]),
    });
  }

  const hasLiabilityDisclaimer =
    /(?:not be liable for any damages|no liability|disclaims all liability|liability is excluded|in no event shall[^.\n]{0,80}be liable)/i.test(
      text
    ) ||
    (normalized.includes("liability") && normalized.includes("excluded"));
  const lowLiabilityCapByPercent =
    /liability[^.\n]{0,160}(?:limited to|shall not exceed|capped at)[^.\n]{0,100}(?:10%|15%|20%|fees paid in the (?:prior|last)\s*(?:one|1)\s*month)/i.test(
      text
    );
  const liabilityCapAmountMatch =
    /liability[^.\n]{0,160}(?:limited to|shall not exceed|capped at)[^.\n]{0,60}(\$\s?\d[\d,]*)/i.exec(
      text
    );
  const liabilityCapAmount = liabilityCapAmountMatch
    ? parseCurrencyAmount(liabilityCapAmountMatch[1])
    : NaN;
  const lowLiabilityCapByAmount = Number.isFinite(liabilityCapAmount) && liabilityCapAmount <= 10000;

  if (hasLiabilityDisclaimer || lowLiabilityCapByPercent || lowLiabilityCapByAmount) {
    pushIssueOnce(issues, {
      id: "liability_cap_too_low",
      label: "Liability Cap Too Low",
      severity: "high",
      message:
        "Liability language appears overly restrictive and may not fairly allocate risk.",
      recommendation:
        "Raise liability caps and include balanced carve-outs for confidentiality, IP, and gross negligence.",
      matches: collectRegexMatches(text, [
        /(?:not be liable for any damages|no liability|disclaims all liability|liability is excluded|in no event shall[^.\n]{0,80}be liable)/i,
        /liability[^.\n]{0,160}(?:limited to|shall not exceed|capped at)[^.\n]{0,100}/i,
      ]),
    });
  }

  const providerControlledArbitration =
    /arbitration[^.\n]{0,180}(?:sole discretion|exclusive venue|as determined by|chosen by|selected by|determined solely by)[^.\n]{0,120}(?:provider|company|vendor|licensor|service provider)/i.test(
      text
    ) ||
    (normalized.includes("arbitration") &&
      includesAny(normalized, [
        "sole discretion",
        "exclusive venue",
        "chosen by provider",
        "determined solely by provider",
      ]));

  if (providerControlledArbitration) {
    pushIssueOnce(issues, {
      id: "provider_controlled_arbitration_venue",
      label: "Provider-Controlled Arbitration Venue",
      severity: "high",
      message:
        "Arbitration venue appears controlled by one party, which can create procedural unfairness.",
      recommendation:
        "Set a neutral venue or define balanced venue selection mechanics.",
      matches: collectRegexMatches(text, [
        /arbitration[^.\n]{0,160}(?:sole discretion|exclusive venue|as determined by|chosen by)[^.\n]{0,100}/i,
      ]),
    });
  }

  const terminationAnyTime =
    /terminate[^.\n]{0,100}at any time/i.test(text) ||
    normalized.includes("terminate at will") ||
    normalized.includes("termination at any time");
  const withoutNotice = /without notice/i.test(text);
  const hasNoticeWindow =
    /\b\d{1,3}\s*(?:day|days)\s+notice\b/i.test(text) ||
    /notice period[^.\n]{0,40}\b\d{1,3}\s*(?:day|days)\b/i.test(text);

  if (terminationAnyTime && (withoutNotice || !hasNoticeWindow)) {
    pushIssueOnce(issues, {
      id: "termination_any_time_no_notice",
      label: "Termination At Any Time / No Notice",
      severity: "high",
      message:
        "Termination rights appear broad and may allow abrupt cancellation without practical notice.",
      recommendation:
        "Require a reasonable notice period and cure opportunity before termination.",
      matches: collectRegexMatches(text, [
        /terminate[^.\n]{0,120}at any time/i,
        /without notice/i,
      ]),
    });
  } else if (terminationAnyTime) {
    pushIssueOnce(issues, {
      id: "termination_any_time",
      label: "Termination At Any Time",
      severity: "medium",
      message:
        "Termination at any time increases commercial uncertainty even with notice language.",
      recommendation:
        "Constrain termination triggers or add minimum commitment periods.",
      matches: collectRegexMatches(text, [/terminate[^.\n]{0,120}at any time/i]),
    });
  }

  const oneSidedIpOwnership =
    /(?:all\s+)?(?:intellectual property|ip|work product|deliverables?)[^.\n]{0,200}(?:owned by|shall belong to|vests in|exclusive property of)[^.\n]{0,120}(?:provider|company|vendor|licensor|service provider)/i.test(
      text
    ) ||
    (includesAny(normalized, ["intellectual property", "work product", "deliverables", "ip"]) &&
      includesAny(normalized, [
        "exclusive property of provider",
        "owned by provider",
        "belongs to provider",
        "vests in provider",
      ]));

  if (oneSidedIpOwnership) {
    pushIssueOnce(issues, {
      id: "ip_ownership_one_sided",
      label: "IP Ownership One-Sided",
      severity: "high",
      message:
        "IP ownership allocation appears one-sided in favor of the service provider.",
      recommendation:
        "Clarify ownership boundaries and grant fair, explicit license rights to each party.",
      matches: collectRegexMatches(text, [
        /(?:all\s+)?(?:intellectual property|ip|work product|deliverables?)[^.\n]{0,180}(?:owned by|shall belong to|vests in)[^.\n]{0,90}/i,
      ]),
    });
  }

  missingRequiredKeywords.forEach((k: string) => {
    pushIssueOnce(issues, {
      id: `missing_required_${k.toLowerCase().replace(/\W+/g, "_")}`,
      label: `Missing Required Clause: ${k}`,
      severity: "medium",
      message: `The required term "${k}" was not detected in this document.`,
      recommendation: `Add ${k} language to the contract.`,
      matches: [],
    });
  });

  forbiddenKeywordHits.forEach((k: string) => {
    pushIssueOnce(issues, {
      id: `forbidden_keyword_${k.toLowerCase().replace(/\W+/g, "_")}`,
      label: `Forbidden Clause Detected: ${k}`,
      severity: "high",
      message: `Forbidden term "${k}" was detected in the document.`,
      recommendation: `Remove or revise ${k}.`,
      matches: [k],
    });
  });

  let score = 0;

  issues.forEach((issue) => {
    if (issue.severity === "high") {
      score += 20;
    } else if (issue.severity === "medium") {
      score += 10;
    } else {
      score += 5;
    }
  });

  // Soften score stacking to keep 90-100 reserved for truly extreme contracts.
  const riskScore = Math.min(100, Math.round(score * 0.8));
  const riskLevel = inferRiskLevel(riskScore);

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
