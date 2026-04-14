export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

export type StateCode = (typeof US_STATES)[number]["code"];

export function getStateName(code: string): string {
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}

// Florida-specific addendum — F.S. §559.9613 (Florida Consumer Finance Act)
// Requires specific written disclosures for consumer finance contracts
const FLORIDA_ADDENDUM = `

FLORIDA JURISDICTION ANALYSIS — F.S. §559.9613 & Consumer Protection

You MUST perform these additional Florida-specific checks and include any violations as issues:

1. CONSUMER FINANCE DISCLOSURES (F.S. §559.9613):
   This section applies ONLY to consumer finance contracts, loans, merchant cash advances, installment financing agreements, or credit arrangements. It does NOT apply to leases, service agreements, employment contracts, NDAs, or other non-financing instruments.
   If this contract IS a consumer finance arrangement: check for:
   - Written disclosure of the annual percentage rate (APR) and total finance charge before signing
   - Clear statement of the total amount financed and total repayment amount
   - Disclosure of all fees, penalties, and default terms in plain language
   - Identification of any collateral or security interest being granted
   Flag as HIGH severity if any required finance disclosure is absent from a consumer finance contract.
   If this contract is NOT a financing instrument, omit this section entirely — do not include a floridaChecklist.

2. FLORIDA CONSUMER COLLECTION PRACTICES ACT (F.S. §559.72):
   - Flag any clause that purports to allow collection methods prohibited under Florida law
   - Flag any wage assignment or wage garnishment provisions (restricted in Florida)
   - Flag any clause waiving the consumer's rights under Florida consumer protection statutes

3. FLORIDA DECEPTIVE AND UNFAIR TRADE PRACTICES ACT (FDUTPA — F.S. §501.201):
   - Flag any clause that attempts to waive FDUTPA rights or limit remedies available under Florida law
   - Flag any mandatory arbitration clause that bars Florida statutory remedies
   - Note if the governing law selects a non-Florida jurisdiction while the consumer is a Florida resident

4. HOME IMPROVEMENT / SERVICE CONTRACTS (F.S. §501.141, if applicable):
   - For home improvement contracts: flag if the written contract requirement is not met
   - Flag any clause requiring payment of more than 10% deposit before work begins without a required bond

5. GOVERNING LAW:
   - If the contract designates a non-Florida governing law clause but the consumer or services are in Florida, flag this as a HIGH risk — Florida courts may not enforce this choice against a Florida consumer for claims arising under Florida statutes.

Include all Florida-specific findings in your issues array with a clauseReference of "Florida Law" where applicable.
`.trim();

// Generic state addendum for all other states
function genericStateAddendum(stateName: string): string {
  return `

JURISDICTION NOTE — ${stateName.toUpperCase()}:
This contract is governed by, or involves parties in, ${stateName}. In addition to your standard analysis:
- Flag any governing law clause that selects a jurisdiction other than ${stateName} if one party is a ${stateName} resident or the services are performed there.
- Note any provisions that may conflict with ${stateName} consumer protection statutes.
- Flag mandatory arbitration clauses that would bar access to ${stateName} courts or remedies.
- Identify any unusually restrictive non-compete or non-solicit terms that may be unenforceable under ${stateName} law.
`.trim();
}

export function buildJurisdictionAddendum(stateCode?: string): string {
  if (!stateCode || stateCode === "none") return "";
  if (stateCode === "FL") return "\n\n" + FLORIDA_ADDENDUM;
  const name = getStateName(stateCode);
  return "\n\n" + genericStateAddendum(name);
}
