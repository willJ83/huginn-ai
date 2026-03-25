export function splitIntoChunks(
  text: string,
  chunkSize = 1200,
  overlap = 200
): string[] {
  const normalized = (text || "").replace(/\r\n/g, "\n").trim();

  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length);
    const chunk = normalized.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start += chunkSize - overlap;
  }

  return chunks;
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function scoreChunk(chunk: string, query: string): number {
  const chunkTokens = tokenize(chunk);
  const queryTokens = Array.from(new Set(tokenize(query)));

  if (chunkTokens.length === 0 || queryTokens.length === 0) {
    return 0;
  }

  const chunkText = chunk.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    const occurrences = chunkTokens.filter((t) => t === token).length;
    score += occurrences;

    if (chunkText.includes(token)) {
      score += 2;
    }
  }

  if (chunkText.includes(query.toLowerCase())) {
    score += 5;
  }

  return score;
}

export function getTopRelevantChunks(
  text: string,
  query: string,
  topK = 4
): string[] {
  const chunks = splitIntoChunks(text);

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunk(chunk, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const uniqueChunks: string[] = [];

  for (const item of ranked) {
    if (!uniqueChunks.includes(item.chunk)) {
      uniqueChunks.push(item.chunk);
    }

    if (uniqueChunks.length >= topK) {
      break;
    }
  }

  return uniqueChunks;
}
