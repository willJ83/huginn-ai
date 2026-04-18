const US_STATES: Record<string, string> = {
  "alabama": "Alabama", "alaska": "Alaska", "arizona": "Arizona", "arkansas": "Arkansas",
  "california": "California", "colorado": "Colorado", "connecticut": "Connecticut",
  "delaware": "Delaware", "florida": "Florida", "georgia": "Georgia", "hawaii": "Hawaii",
  "idaho": "Idaho", "illinois": "Illinois", "indiana": "Indiana", "iowa": "Iowa",
  "kansas": "Kansas", "kentucky": "Kentucky", "louisiana": "Louisiana", "maine": "Maine",
  "maryland": "Maryland", "massachusetts": "Massachusetts", "michigan": "Michigan",
  "minnesota": "Minnesota", "mississippi": "Mississippi", "missouri": "Missouri",
  "montana": "Montana", "nebraska": "Nebraska", "nevada": "Nevada",
  "new hampshire": "New Hampshire", "new jersey": "New Jersey", "new mexico": "New Mexico",
  "new york": "New York", "north carolina": "North Carolina", "north dakota": "North Dakota",
  "ohio": "Ohio", "oklahoma": "Oklahoma", "oregon": "Oregon", "pennsylvania": "Pennsylvania",
  "rhode island": "Rhode Island", "south carolina": "South Carolina",
  "south dakota": "South Dakota", "tennessee": "Tennessee", "texas": "Texas", "utah": "Utah",
  "vermont": "Vermont", "virginia": "Virginia", "washington": "Washington",
  "west virginia": "West Virginia", "wisconsin": "Wisconsin", "wyoming": "Wyoming",
  "district of columbia": "District of Columbia", "washington dc": "District of Columbia",
};

function matchStateName(fragment: string): string | null {
  const lower = fragment.trim().toLowerCase().replace(/\s+/g, " ");
  if (US_STATES[lower]) return US_STATES[lower];
  // Partial: check if any state name is a substring of the fragment
  for (const [key, val] of Object.entries(US_STATES)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export interface ExtractedJurisdiction {
  jurisdiction: string | null;
  confidence: "high" | "medium" | "low";
}

export function extractJurisdictionFromText(text: string): ExtractedJurisdiction {
  // Pattern 1 (high confidence): explicit "governed by the laws of the State of X"
  const govLawPatterns = [
    /governed\s+by\s+(?:the\s+)?laws?\s+of\s+(?:the\s+)?(?:State\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /laws?\s+of\s+the\s+State\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /governing\s+law[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /this\s+agreement\s+(?:shall\s+be\s+)?(?:is\s+)?governed\s+by[^.]*?(?:State\s+of\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ];

  for (const pattern of govLawPatterns) {
    const m = text.match(pattern);
    if (m?.[1]) {
      const state = matchStateName(m[1]);
      if (state) return { jurisdiction: state, confidence: "high" };
    }
  }

  // Pattern 2 (medium confidence): venue/forum language
  const venuePatterns = [
    /(?:courts?|venue|jurisdiction)\s+(?:located\s+)?in\s+(?:[A-Z][a-z]+\s+(?:County|Parish),\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /proceedings?\s+(?:shall\s+be\s+)?(?:conducted\s+)?(?:exclusively\s+)?in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /arbitration\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ];

  for (const pattern of venuePatterns) {
    const m = text.match(pattern);
    if (m?.[1]) {
      const state = matchStateName(m[1]);
      if (state) return { jurisdiction: state, confidence: "medium" };
    }
  }

  // Pattern 3 (low confidence): "State of X" anywhere in the document
  const stateOfPattern = /\bState\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
  const stateMatches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = stateOfPattern.exec(text)) !== null) {
    const state = matchStateName(m[1]);
    if (state) stateMatches.push(state);
  }
  if (stateMatches.length > 0) {
    // Return the most frequently mentioned state
    const freq: Record<string, number> = {};
    for (const s of stateMatches) freq[s] = (freq[s] ?? 0) + 1;
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    return { jurisdiction: top, confidence: "low" };
  }

  return { jurisdiction: null, confidence: "low" };
}
