export type ReportStatus = "pass" | "review" | "ok" | "urgent" | "attention";

export interface FirstWorkingReport {
  reportTitle: string;
  analysisType: string;
  overallStatus: string;
  executiveSummary: string;
  keyFindings: string[];
  recommendedAction: string;
}