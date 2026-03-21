import { FirstWorkingReport } from "./reportSchema";

export function buildFirstWorkingReport(
  template: string,
  deterministicResult: any,
  aiResponse?: string
): FirstWorkingReport {
  switch (template) {
    case "compliance_checker":
      return buildComplianceReport(deterministicResult, aiResponse);

    case "deadline_monitor":
    case "deadline_obligation_extractor":
      return buildDeadlineReport(deterministicResult, aiResponse);

    case "discrepancy_finder":
      return buildDiscrepancyReport(deterministicResult, aiResponse);

    default:
      return {
        reportTitle: "Huginn AI Report",
        analysisType: "Unknown Analysis",
        overallStatus: "review",
        executiveSummary: "No report builder is available for this template.",
        keyFindings: [],
        recommendedAction: "Review the analysis configuration and try again.",
      };
  }
}

function buildComplianceReport(
  result: any,
  aiResponse?: string
): FirstWorkingReport {
  const foundRequired = result?.findings?.foundRequired || [];
  const missingRequired = result?.findings?.missingRequired || [];
  const forbiddenFound = result?.findings?.forbiddenFound || [];
  const requiredEvidence = result?.findings?.requiredEvidence || [];
  const forbiddenEvidence = result?.findings?.forbiddenEvidence || [];

  const keyFindings: string[] = [];

  if (foundRequired.length > 0) {
    keyFindings.push(`Found required terms: ${foundRequired.join(", ")}`);
  } else {
    keyFindings.push("No required terms were found.");
  }

  if (missingRequired.length > 0) {
    keyFindings.push(`Missing required terms: ${missingRequired.join(", ")}`);
  } else {
    keyFindings.push("No required terms are missing.");
  }

  if (forbiddenFound.length > 0) {
    keyFindings.push(`Forbidden terms detected: ${forbiddenFound.join(", ")}`);
  } else {
    keyFindings.push("No forbidden terms were detected.");
  }

  requiredEvidence.forEach((item: any) => {
    if (item.snippets?.length > 0) {
      keyFindings.push(
        `Evidence for "${item.term}": ${item.snippets.join(" | ")}`
      );
    }
  });

  forbiddenEvidence.forEach((item: any) => {
    if (item.snippets?.length > 0) {
      keyFindings.push(
        `Evidence for forbidden term "${item.term}": ${item.snippets.join(" | ")}`
      );
    }
  });

  return {
    reportTitle: "Huginn AI Compliance Report",
    analysisType: "Compliance Checker",
    overallStatus: result?.summary?.status || "review",
    executiveSummary:
      extractSummary(aiResponse) ||
      "This compliance check reviewed required and forbidden terms in the document.",
    keyFindings,
    recommendedAction:
      extractRecommendedAction(aiResponse) ||
      "Review any missing required terms and confirm whether document wording meets the expected standard.",
  };
}

function buildDeadlineReport(
  result: any,
  aiResponse?: string
): FirstWorkingReport {
  const findings = result?.findings || [];
  const overdue = findings.filter((item: any) => item.status === "overdue");
  const dueSoon = findings.filter((item: any) => item.status === "due_soon");
  const future = findings.filter((item: any) => item.status === "future");

  const keyFindings: string[] = [
    `Total dates found: ${findings.length}`,
    `Overdue dates: ${overdue.length}`,
    `Due soon dates: ${dueSoon.length}`,
    `Future dates: ${future.length}`,
  ];

  findings.forEach((item: any) => {
    keyFindings.push(
      `Date ${item.rawDate} (${item.status}, ${item.daysUntil} days): ${
        item.snippets?.join(" | ") || "No evidence snippet available."
      }`
    );
  });

  return {
    reportTitle: "Huginn AI Deadline Report",
    analysisType: "Deadline Monitor",
    overallStatus: result?.summary?.status || "ok",
    executiveSummary:
      extractSummary(aiResponse) ||
      "This deadline review identified dates in the document and classified them by urgency.",
    keyFindings,
    recommendedAction:
      extractRecommendedAction(aiResponse) ||
      "Review overdue or near-term dates first and confirm the timeline is acceptable.",
  };
}

function buildDiscrepancyReport(
  result: any,
  aiResponse?: string
): FirstWorkingReport {
  const amounts = result?.findings?.amounts || [];
  const comparison = result?.findings?.comparison;

  const keyFindings: string[] = [`Amounts found: ${amounts.length}`];

  if (amounts.length > 0) {
    keyFindings.push(
      `Detected amounts: ${amounts.map((item: any) => item.raw).join(", ")}`
    );

    amounts.forEach((item: any) => {
      if (item.snippets?.length > 0) {
        keyFindings.push(
          `Evidence for amount ${item.raw}: ${item.snippets.join(" | ")}`
        );
      }
    });
  }

  if (comparison) {
    keyFindings.push(`Subtotal: ${comparison.subtotal}`);
    keyFindings.push(`Tax: ${comparison.tax}`);
    keyFindings.push(`Total: ${comparison.total}`);
    keyFindings.push(`Expected Total: ${comparison.expectedTotal}`);
    keyFindings.push(`Difference: ${comparison.difference}`);
    keyFindings.push(
      `Discrepancy Found: ${comparison.discrepancyFound ? "Yes" : "No"}`
    );

    if (comparison.evidence?.subtotalSnippets?.length > 0) {
      keyFindings.push(
        `Subtotal evidence: ${comparison.evidence.subtotalSnippets.join(" | ")}`
      );
    }

    if (comparison.evidence?.taxSnippets?.length > 0) {
      keyFindings.push(
        `Tax evidence: ${comparison.evidence.taxSnippets.join(" | ")}`
      );
    }

    if (comparison.evidence?.totalSnippets?.length > 0) {
      keyFindings.push(
        `Total evidence: ${comparison.evidence.totalSnippets.join(" | ")}`
      );
    }
  } else {
    keyFindings.push("No subtotal/tax/total comparison was available.");
  }

  return {
    reportTitle: "Huginn AI Discrepancy Report",
    analysisType: "Discrepancy Finder",
    overallStatus: result?.summary?.status || "ok",
    executiveSummary:
      extractSummary(aiResponse) ||
      "This discrepancy review checked financial amounts and compared totals where possible.",
    keyFindings,
    recommendedAction:
      extractRecommendedAction(aiResponse) ||
      "Review the totals and supporting calculations if a discrepancy was detected.",
  };
}

function extractSummary(aiResponse?: string): string {
  if (!aiResponse) return "";

  const match = aiResponse.match(
    /Summary:\s*([\s\S]*?)(?:Explanation:|Recommended Action:|$)/i
  );
  return match?.[1]?.trim() || "";
}

function extractRecommendedAction(aiResponse?: string): string {
  if (!aiResponse) return "";

  const match = aiResponse.match(/Recommended Action:\s*([\s\S]*?)$/i);
  return match?.[1]?.trim() || "";
}