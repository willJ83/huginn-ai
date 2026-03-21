export type TemplateType =
  | "compliance_checker"
  | "deadline_monitor"
  | "deadline_obligation_extractor"
  | "discrepancy_finder";

export interface AnalyzeRequest {
  text: string;
  template: TemplateType;
  config?: any;
}

export function runDeterministicExtraction({
  text,
  template,
  config = {},
}: AnalyzeRequest) {
  switch (template) {
    case "compliance_checker":
      return runComplianceChecker(text, config);

    case "deadline_monitor":
      return runDeadlineMonitor(text, config);

    case "discrepancy_finder":
      return runDiscrepancyFinder(text, config);

    case "deadline_obligation_extractor":
      return runDeadlineMonitor(text, config);

    default:
      return {
        error: "Unknown template",
      };
  }
}

function runComplianceChecker(text: string, config: any) {
  const required = config.requiredKeywords || [];
  const forbidden = config.forbiddenKeywords || [];

  const lower = text.toLowerCase();

  const foundRequired = required.filter((k: string) =>
    lower.includes(k.toLowerCase())
  );

  const missingRequired = required.filter(
    (k: string) => !lower.includes(k.toLowerCase())
  );

  const forbiddenFound = forbidden.filter((k: string) =>
    lower.includes(k.toLowerCase())
  );

  const requiredEvidence = foundRequired.map((term: string) => ({
    term,
    snippets: findSnippetsForTerm(text, term),
  }));

  const forbiddenEvidence = forbiddenFound.map((term: string) => ({
    term,
    snippets: findSnippetsForTerm(text, term),
  }));

  return {
    template: "compliance_checker",
    summary: {
      status:
        missingRequired.length === 0 && forbiddenFound.length === 0
          ? "pass"
          : "review",
      requiredFound: foundRequired.length,
      requiredMissing: missingRequired.length,
      forbiddenFound: forbiddenFound.length,
    },
    findings: {
      foundRequired,
      missingRequired,
      forbiddenFound,
      requiredEvidence,
      forbiddenEvidence,
      checkedSnippets: getRelevantLines(text),
    },
  };
}

function runDeadlineMonitor(text: string, config: any) {
  const warningDays =
    typeof config.warningDays === "number" ? config.warningDays : 7;

  const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g;
  const matches = text.match(dateRegex) || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedDates = matches
    .map((rawDate) => {
      const parsed = parseSimpleDate(rawDate);
      if (!parsed) return null;

      const diffMs = parsed.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status = "future";
      if (daysUntil < 0) status = "overdue";
      else if (daysUntil <= warningDays) status = "due_soon";

      return {
        rawDate,
        isoDate: parsed.toISOString().split("T")[0],
        daysUntil,
        status,
        snippets: findSnippetsForTerm(text, rawDate),
      };
    })
    .filter(Boolean);

  const overdueCount = parsedDates.filter(
    (item: any) => item.status === "overdue"
  ).length;

  const dueSoonCount = parsedDates.filter(
    (item: any) => item.status === "due_soon"
  ).length;

  return {
    template: "deadline_monitor",
    summary: {
      status:
        overdueCount > 0 ? "urgent" : dueSoonCount > 0 ? "attention" : "ok",
      totalDatesFound: parsedDates.length,
      overdueCount,
      dueSoonCount,
      futureCount: parsedDates.filter((item: any) => item.status === "future")
        .length,
    },
    findings: parsedDates,
  };
}

function runDiscrepancyFinder(text: string, config: any) {
  const tolerance =
    typeof config.tolerance === "number" ? config.tolerance : 0.01;

  const moneyRegex = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
  const matches = text.match(moneyRegex) || [];

  const amounts = matches.map((raw) => ({
    raw,
    numeric: parseFloat(raw.replace(/\$/g, "").replace(/,/g, "")),
    snippets: findSnippetsForTerm(text, raw),
  }));

  const subtotalMatch = text.match(
    /subtotal[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
  const taxMatch = text.match(/tax[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  const totalMatch = text.match(
    /\btotal\b[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );

  const subtotal = subtotalMatch
    ? parseFloat(subtotalMatch[1].replace(/,/g, ""))
    : null;
  const tax = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, "")) : null;
  const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, "")) : null;

  let comparison = null;
  let discrepancyFound = false;

  if (subtotal !== null && tax !== null && total !== null) {
    const expected = subtotal + tax;
    const difference = Math.abs(expected - total);

    discrepancyFound = difference > tolerance;

    comparison = {
      subtotal,
      tax,
      total,
      expectedTotal: expected,
      difference: Number(difference.toFixed(2)),
      discrepancyFound,
      evidence: {
        subtotalSnippets: findSnippetsForTerm(
          text,
          `Subtotal: $${subtotal.toFixed(2)}`
        ).length
          ? findSnippetsForTerm(text, `Subtotal: $${subtotal.toFixed(2)}`)
          : findSnippetsForLabel(text, "subtotal"),
        taxSnippets: findSnippetsForTerm(text, `Tax: $${tax.toFixed(2)}`).length
          ? findSnippetsForTerm(text, `Tax: $${tax.toFixed(2)}`)
          : findSnippetsForLabel(text, "tax"),
        totalSnippets: findSnippetsForTerm(
          text,
          `Total: $${total.toFixed(2)}`
        ).length
          ? findSnippetsForTerm(text, `Total: $${total.toFixed(2)}`)
          : findSnippetsForLabel(text, "total"),
      },
    };
  }

  return {
    template: "discrepancy_finder",
    summary: {
      status: discrepancyFound ? "review" : "ok",
      amountsFound: amounts.length,
      comparisonAvailable: !!comparison,
      discrepancyFound,
    },
    findings: {
      amounts,
      comparison,
    },
  };
}

function parseSimpleDate(value: string): Date | null {
  const parts = value.split(/[\/\-]/);
  if (parts.length !== 3) return null;

  let month = parseInt(parts[0], 10);
  let day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);

  if (year < 100) {
    year += 2000;
  }

  const date = new Date(year, month - 1, day);

  if (
    isNaN(date.getTime()) ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getFullYear() !== year
  ) {
    return null;
  }

  return date;
}

function getRelevantLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findSnippetsForTerm(text: string, term: string): string[] {
  const lines = getRelevantLines(text);
  const lowerTerm = term.toLowerCase();

  return lines.filter((line) => line.toLowerCase().includes(lowerTerm));
}

function findSnippetsForLabel(text: string, label: string): string[] {
  const lines = getRelevantLines(text);
  const lowerLabel = label.toLowerCase();

  return lines.filter((line) => line.toLowerCase().includes(lowerLabel));
}