export type ProductTemplate =
  | "compliance_checker"
  | "deadline_monitor"
  | "deadline_obligation_extractor"
  | "discrepancy_finder";

export type Severity = "low" | "medium" | "high";

export interface RequiredClauseConfig {
  id: string;
  label: string;
  severity: Severity;
  keywords: string[];
  message: string;
  explanation?: string;
  recommendation: string;
}

export interface ConfiguredIssue {
  id: string;
  label: string;
  severity: Severity;
  keywords?: string[];
  regexes?: RegExp[];
  message: string;
  explanation?: string;
  recommendation: string;
}

export interface DeadlinePattern {
  id: string;
  label: string;
  regexes: RegExp[];
}

export interface ProductConfig {
  id: ProductTemplate;
  label: string;
  description: string;
  documentTypes: string[];
  retrievalQueries?: string[];
  requiredKeywords?: string[];
  forbiddenKeywords?: string[];
  requiredClauses?: RequiredClauseConfig[];
  issues?: ConfiguredIssue[];
  deadlinePatterns?: DeadlinePattern[];
  scoring?: {
    low: number;
    medium: number;
    high: number;
    thresholds: {
      low: number;
      medium: number;
      high: number;
    };
  };
}

const DEFAULT_SCORING: NonNullable<ProductConfig["scoring"]> = {
  low: 5,
  medium: 15,
  high: 30,
  thresholds: {
    low: 20,
    medium: 50,
    high: 100,
  },
};

function createAnalyzerConfig(config: ProductConfig): ProductConfig {
  return {
    ...config,
    requiredKeywords: config.requiredKeywords || [],
    forbiddenKeywords: config.forbiddenKeywords || [],
    requiredClauses: config.requiredClauses || [],
    issues: config.issues || [],
    deadlinePatterns: config.deadlinePatterns || [],
    scoring: config.scoring || DEFAULT_SCORING,
  };
}

const ANALYZER_REGISTRY: Record<ProductTemplate, ProductConfig> = {
  compliance_checker: createAnalyzerConfig({
    id: "compliance_checker",
    label: "Compliance Checker",
    description:
      "Checks documents for required and forbidden compliance-related language.",
    documentTypes: ["contract", "service_agreement", "vendor_agreement", "policy"],
    retrievalQueries: [
      "governing law jurisdiction state law venue dispute applicable law",
      "termination renewal notice payment liability indemnification breach default",
      "confidentiality non-disclosure damages limitation liability remedies",
    ],
    requiredKeywords: [],
    forbiddenKeywords: [],
    requiredClauses: [
      {
        id: "confidentiality_clause",
        label: "Confidentiality Clause",
        severity: "medium",
        keywords: ["confidentiality", "confidential", "non-disclosure"],
        message: "No confidentiality clause was detected.",
        recommendation:
          "Add language protecting confidential or proprietary information shared between parties.",
      },
      {
        id: "liability_clause",
        label: "Liability Clause",
        severity: "medium",
        keywords: ["liability", "liable", "damages", "limitation of liability"],
        message: "No liability clause was detected.",
        recommendation:
          "Include language defining liability exposure and any limitations on damages.",
      },
      {
        id: "governing_law_clause",
        label: "Governing Law Clause",
        severity: "medium",
        keywords: ["governing law", "laws of", "jurisdiction", "venue"],
        message: "No governing law clause was detected.",
        explanation:
          "This contract does not specify which state or country governs disputes, which can create legal uncertainty during conflicts.",
        recommendation:
          "Add governing law and jurisdiction language so disputes have a clear legal framework.",
      },
    ],
    issues: [
      {
        id: "breach_clause",
        label: "Breach Clause",
        severity: "medium",
        keywords: ["breach", "default", "non-breaching party", "legal remedies"],
        regexes: [
          /if either party breaches[^.?!\n]*/gi,
          /non-breaching party[^.?!\n]*/gi,
        ],
        message:
          "A breach clause exists but may lack remediation timelines.",
        recommendation:
          "Ensure breach notice periods and cure periods are clearly defined.",
      },
      {
        id: "missing_reporting_procedure",
        label: "Missing Reporting Procedure",
        severity: "medium",
        keywords: [],
        regexes: [],
        message: "No clear reporting procedure was detected.",
        recommendation:
          "Add a reporting or escalation procedure so violations can be documented and addressed.",
      },
      {
        id: "missing_enforcement_language",
        label: "Missing Enforcement Language",
        severity: "medium",
        keywords: [],
        regexes: [],
        message: "No enforcement language was detected.",
        recommendation:
          "Include enforcement or corrective action language to clarify policy consequences.",
      },
    ],
    deadlinePatterns: [
      {
        id: "payment_deadline",
        label: "Payment Deadline",
        regexes: [
          /within\s+(\d+\s+days?\s+of\s+invoice)/gi,
          /payment\s+must\s+be\s+made\s+within\s+(\d+\s+days?)/gi,
        ],
      },
      {
        id: "effective_date",
        label: "Effective Date",
        regexes: [
          /effective\s+date[:\s]+([A-Za-z0-9,\/\- ]+)/gi,
          /begins\s+on\s+([A-Za-z0-9,\/\- ]+)/gi,
        ],
      },
      {
        id: "expiration_date",
        label: "Expiration Date",
        regexes: [
          /ends\s+on\s+([A-Za-z0-9,\/\- ]+)/gi,
          /expires?\s+on\s+([A-Za-z0-9,\/\- ]+)/gi,
        ],
      },
    ],
  }),

  deadline_monitor: createAnalyzerConfig({
    id: "deadline_monitor",
    label: "Deadline Monitor",
    description: "Extracts important dates, timelines, and timing obligations.",
    documentTypes: ["contract", "service_agreement", "invoice", "general"],
    retrievalQueries: [
      "deadline due date no later than within days business days",
      "effective date expiration date term renewal notice period",
      "payment invoice due net terms",
    ],
    requiredKeywords: [],
    forbiddenKeywords: [],
    requiredClauses: [],
    issues: [],
    deadlinePatterns: [
      {
        id: "date_reference",
        label: "Date Reference",
        regexes: [
          /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/g,
          /\b([A-Z][a-z]+ \d{1,2}, \d{4})\b/g,
        ],
      },
      {
        id: "deadline_window",
        label: "Deadline Window",
        regexes: [
          /within\s+(\d+\s+business\s+days?)/gi,
          /within\s+(\d+\s+days?)/gi,
          /no\s+later\s+than\s+([A-Za-z0-9,\/\- ]+)/gi,
        ],
      },
      {
        id: "term_length",
        label: "Term Length",
        regexes: [
          /term\s+of\s+(\d+\s+months?)/gi,
          /term\s+of\s+(\d+\s+years?)/gi,
        ],
      },
    ],
    scoring: {
      low: 0,
      medium: 5,
      high: 10,
      thresholds: {
        low: 10,
        medium: 25,
        high: 100,
      },
    },
  }),

  deadline_obligation_extractor: createAnalyzerConfig({
    id: "deadline_obligation_extractor",
    label: "Deadline & Obligation Extractor",
    description:
      "Extracts key deadlines, notice periods, payment terms, renewal dates, and service obligations from contracts.",
    documentTypes: [
      "contract",
      "service_agreement",
      "vendor_agreement",
      "employment_agreement",
      "nda",
    ],
    retrievalQueries: [
      "automatic renewal auto renew renewal term termination notice",
      "payment fee penalty late payment invoice due interest charges",
      "service obligations provider shall vendor shall contractor shall",
    ],
    requiredKeywords: [],
    forbiddenKeywords: [],
    requiredClauses: [],
    issues: [
      {
        id: "auto_renewal_detected",
        label: "Auto-Renewal Detected",
        severity: "medium",
        message:
          "This document appears to contain auto-renewal language that should be reviewed carefully.",
        recommendation:
          "Confirm the renewal window, notice period, and cancellation terms before relying on this agreement.",
        keywords: ["auto renew", "auto-renew", "automatic renewal", "automatically renews"],
        regexes: [],
      },
      {
        id: "termination_notice_detected",
        label: "Termination Notice Detected",
        severity: "low",
        message:
          "A termination notice obligation was detected in this document.",
        recommendation:
          "Track the notice period and align internal reminders before any cancellation deadline.",
        keywords: ["termination notice", "written notice", "notice period"],
        regexes: [],
      },
    ],
    deadlinePatterns: [
      {
        id: "payment_deadline",
        label: "Payment Deadline",
        regexes: [
          /\b(net\s*\d{1,3})\b/gi,
          /\bpayment due within (\d{1,3}\s+days)\b/gi,
          /\bwithin (\d{1,3}\s+days) of invoice\b/gi,
          /\b(\d{1,3}\s+days from invoice)\b/gi,
        ],
      },
      {
        id: "termination_notice",
        label: "Termination Notice",
        regexes: [
          /\b(\d{1,3}\s+days['’]?\s+notice)\b/gi,
          /\b(\d{1,3}\s+days?\s+prior written notice)\b/gi,
          /\b(with\s+\d{1,3}\s+days?\s+written notice)\b/gi,
          /\b(termination.*?\d{1,3}\s+days)\b/gi,
        ],
      },
      {
        id: "renewal_date",
        label: "Contract Renewal",
        regexes: [
          /\brenews?\s+on\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/g,
          /\brenewal date[:\s]+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/g,
          /\bterm renews? until ([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/g,
        ],
      },
      {
        id: "service_obligation",
        label: "Service Obligation",
        regexes: [
          /\b(provider shall .*?)(?:\.|\n)/gi,
          /\b(vendor shall .*?)(?:\.|\n)/gi,
          /\b(contractor shall .*?)(?:\.|\n)/gi,
          /\b(service provider shall .*?)(?:\.|\n)/gi,
        ],
      },
    ],
    scoring: {
      low: 5,
      medium: 15,
      high: 30,
      thresholds: {
        low: 35,
        medium: 70,
        high: 100,
      },
    },
  }),

  discrepancy_finder: createAnalyzerConfig({
    id: "discrepancy_finder",
    label: "Discrepancy Finder",
    description: "Finds conflicting or suspicious wording in documents.",
    documentTypes: ["contract", "service_agreement", "general"],
    retrievalQueries: [
      "conflict contradictory inconsisten termination for cause at any time",
      "payment terms invoice fees charges due penalties",
      "liability indemnity warranty disclaimer exclusions",
    ],
    requiredKeywords: [],
    forbiddenKeywords: [],
    requiredClauses: [],
    issues: [
      {
        id: "conflicting_termination_language",
        label: "Potential Termination Conflict",
        severity: "medium",
        keywords: ["terminate at any time", "for cause only", "written notice"],
        regexes: [
          /terminate\s+at\s+any\s+time/gi,
          /for\s+cause\s+only/gi,
        ],
        message: "Potentially conflicting termination language detected.",
        recommendation:
          "Review termination provisions for internal consistency and notice requirements.",
      },
      {
        id: "ambiguous_payment_language",
        label: "Ambiguous Payment Language",
        severity: "low",
        keywords: ["payment terms", "invoice", "fees", "charges"],
        regexes: [/payment\s+terms/gi, /invoice/gi, /fees?/gi],
        message: "Payment language may require clarification.",
        recommendation:
          "Confirm payment timing, fee structure, and consequences for late or missed payment.",
      },
    ],
    deadlinePatterns: [],
  }),
};

export function getProductConfig(
  template: ProductTemplate
): ProductConfig | null {
  return ANALYZER_REGISTRY[template] || null;
}

export function getAllProductConfigs(): ProductConfig[] {
  return Object.values(ANALYZER_REGISTRY);
}