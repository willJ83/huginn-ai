import { promptTemplates } from "./promptTemplates";

type TemplateType =
  | "compliance_checker"
  | "deadline_monitor"
  | "deadline_obligation_extractor"
  | "discrepancy_finder";

export function buildAnalysisPrompt(
  template: TemplateType,
  deterministicResult: any
) {
  const basePrompt = promptTemplates[template];

  return `
${basePrompt}

Deterministic Findings:
${JSON.stringify(deterministicResult, null, 2)}
`;
}