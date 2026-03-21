export type Analyzer = (text: string, config?: any) => any;

export interface AnalyzerDefinition {
  id: string;
  name: string;
  description: string;
  analyzer: Analyzer;
}

const registry: Record<string, AnalyzerDefinition> = {};

export function registerAnalyzer(def: AnalyzerDefinition) {
  registry[def.id] = def;
}

export function getAnalyzer(id: string): Analyzer | undefined {
  return registry[id]?.analyzer;
}

export function listAnalyzers(): AnalyzerDefinition[] {
  return Object.values(registry);
}
