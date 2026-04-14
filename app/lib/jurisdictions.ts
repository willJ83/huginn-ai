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

// California-specific addendum
const CALIFORNIA_ADDENDUM = `

CALIFORNIA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional California-specific checks and include any violations as issues:

1. NON-COMPETE & NON-SOLICIT (Bus. & Prof. Code § 16600):
   California has a near-total ban on non-compete agreements. Flag ANY non-compete clause as HIGH severity — it is void and unenforceable against California employees or independent contractors. Non-solicitation of employees is similarly void under § 16600. Non-solicitation of customers is enforceable only if narrowly tied to trade secret protection.

2. STAY-OR-PAY / TRAINING REPAYMENT (AB 692 / Bus. & Prof. Code § 16608):
   Flag any clause requiring an employee to repay training costs, signing bonuses, or other amounts if they resign — these "stay-or-pay" provisions are void in California unless compliant with § 16608 (limited to bona fide training programs, reasonable cost caps, and prorated forgiveness). Flag as HIGH if present.

3. USURY (California Constitution Art. XV § 1):
   The general usury limit for personal/consumer loans is 10% per annum. For commercial loans, the limit is the higher of 10% or the Federal Reserve discount rate plus 5%. Flag any interest rate, default rate, or fee structure that may exceed these limits. Flag as HIGH if a rate clearly exceeds 10% without an exempt lender.

4. CCPA / CPRA DATA PRIVACY (Civil Code § 1798.100 et seq.):
   If this contract involves collection, processing, or sharing of California residents' personal information: flag any absence of data processing terms, data subject rights provisions, or third-party sharing disclosures. Flag as HIGH if personal data is involved with no data protection clause.

5. CONSUMERS LEGAL REMEDIES ACT (CLRA — Civil Code § 1750):
   If this is a consumer-facing contract for goods or services: flag any clause that waives CLRA rights, attempts to shorten the statute of limitations, or requires arbitration of public injunction claims. Flag as HIGH.

6. ELECTRONIC SIGNATURES (UETA — Civil Code § 1633.1 et seq.):
   Flag any clause that purports to deny the validity of electronic signatures or that requires wet-ink signatures for a contract that could be executed electronically. Note if no e-signature clause is present where one would be expected.

Include all California-specific findings in your issues array with a clauseReference of "California Law" where applicable.
`.trim();

// Texas-specific addendum
const TEXAS_ADDENDUM = `

TEXAS JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Texas-specific checks and include any violations as issues:

1. NON-COMPETE (Bus. & Com. Code § 15.50):
   Texas enforces non-competes only if: (a) ancillary to or part of an otherwise enforceable agreement (e.g., confidentiality, trade secrets, or specialized training); (b) the limitations as to time, geographic area, and scope of activity are reasonable and no greater than necessary. Flag any non-compete that lacks a legitimate ancillary agreement, or that has an unreasonably broad time period (>2 years), geography (statewide or national), or activity scope. Flag as HIGH if unenforceable on its face.

2. HEALTHCARE NON-COMPETE (SB 1318 / Bus. & Com. Code § 15.501):
   For contracts involving physicians or other licensed healthcare professionals: additional restrictions apply. Any buyout provision must be at a reasonable price; the physician must retain the right to access patient records; the covenant must not prevent the physician from treating patients in acute need. Flag any healthcare non-compete lacking these protections as HIGH.

3. USURY (Finance Code § 302.001):
   The Texas constitutional and statutory usury limit is 10% per annum unless a higher rate is agreed in writing under § 306.001 (for commercial transactions, parties may agree to any rate; for consumer credit, separate Chapter 342 limits apply). Flag any interest or fee structure that appears to exceed 10% without a valid written agreement or exemption. Flag default rates above 18% as HIGH.

4. DECEPTIVE TRADE PRACTICES (DTPA — Bus. & Com. Code Ch. 17):
   If this is a consumer-facing contract: flag any clause that waives DTPA rights, attempts to disclaim DTPA liability, or requires consumers to waive the right to seek treble damages. Flag any "tie-in" statutes waiver. Waivers are void unless the consumer is represented by legal counsel and the contract explicitly states the waiver. Flag as HIGH if present.

5. TEXAS DATA PRIVACY (TDPSA — Bus. & Com. Code Ch. 541):
   If this contract involves processing personal data of Texas residents: flag any absence of data processing terms, opt-out rights, or third-party sharing disclosures required under TDPSA. Effective July 1, 2024. Flag as HIGH if personal data is involved with no data protection clause.

6. ELECTRONIC SIGNATURES (UETA — Bus. & Com. Code Ch. 322):
   Flag any clause that denies the legal effect of electronic records or signatures, or that imposes wet-ink signature requirements without legal basis. Note if no e-signature provision is present where one would be expected.

Include all Texas-specific findings in your issues array with a clauseReference of "Texas Law" where applicable.
`.trim();

// South Carolina-specific addendum
const SOUTH_CAROLINA_ADDENDUM = `

SOUTH CAROLINA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional South Carolina-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (SC Restrictive Covenants Act — § 41-8-10):
   South Carolina enforces non-compete and non-solicitation agreements only if they are: (a) in writing and signed by the employee; (b) supported by valuable consideration; (c) reasonably limited in time, geographic area, and scope of activity. Flag any non-compete lacking these elements, or with an unreasonable duration (>2–3 years), overbroad geography (statewide without justification), or unlimited activity scope. Flag as HIGH if facially unenforceable.

2. SOUTH CAROLINA UNFAIR TRADE PRACTICES ACT (SCUTPA — § 39-5-10):
   Flag any clause that attempts to waive SCUTPA rights, limit remedies for unfair or deceptive acts in commerce, or disclaim statutory liability. Note any mandatory arbitration clause that bars access to SCUTPA remedies. Flag as HIGH if SCUTPA rights are expressly waived.

3. USURY (§ 34-31-30):
   The general South Carolina usury cap is 8.75% per annum for written contracts (or 16% where no written agreement specifies a rate). Commercial loans and certain lender-borrower agreements may have different rates under specific statutory exemptions. Flag any interest rate, default rate, or fee structure that appears to exceed 16% without an applicable exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (§ 32-2-10):
   South Carolina's anti-indemnity statute voids indemnification clauses in construction contracts that purport to indemnify a party for its own negligence. Flag any broad indemnification clause in a construction, renovation, or contractor agreement that lacks a negligence carve-out or that requires one party to indemnify the other for the indemnitee's own fault. Flag as HIGH.

5. ELECTRONIC SIGNATURES (SC UETA — § 26-6-10):
   Flag any clause that denies the legal effect of electronic records or signatures, or that requires wet-ink signatures without legal basis. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (§ 39-1-90):
   South Carolina requires notification to affected residents within 45 days of discovering a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all South Carolina-specific findings in your issues array with a clauseReference of "South Carolina Law" where applicable.
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
  if (stateCode === "CA") return "\n\n" + CALIFORNIA_ADDENDUM;
  if (stateCode === "TX") return "\n\n" + TEXAS_ADDENDUM;
  if (stateCode === "SC") return "\n\n" + SOUTH_CAROLINA_ADDENDUM;
  const name = getStateName(stateCode);
  return "\n\n" + genericStateAddendum(name);
}
