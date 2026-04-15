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

// North Carolina-specific addendum
const NORTH_CAROLINA_ADDENDUM = `

NORTH CAROLINA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional North Carolina-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (NC Common Law + Chapter 75, § 75-4):
   North Carolina enforces non-compete and non-solicitation agreements only if they are: (a) in writing; (b) part of an employment or business sale contract; (c) supported by adequate consideration; (d) reasonable in time (typically ≤2 years), geographic scope, and activity restrictions. Courts will blue-pencil but not rewrite overbroad covenants. Flag any non-compete lacking consideration, with duration exceeding 2 years, unreasonably broad geography, or unlimited activity scope. Flag as HIGH if facially unenforceable.

2. UNFAIR AND DECEPTIVE TRADE PRACTICES ACT (UDTPA — Chapter 75, §§ 75-1.1 et seq.):
   Flag any clause that waives UDTPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars access to UDTPA remedies or treble damages. Flag as HIGH if UDTPA rights are expressly waived.

3. USURY (Chapter 24, § 24-1):
   The general North Carolina usury cap is 8% per annum absent a written agreement specifying a higher rate; written contracts may agree to rates up to 16% for most commercial purposes. Flag any interest rate, default rate, or fee structure that exceeds 16% without a statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (Chapter 22B):
   North Carolina's anti-indemnity statute voids indemnification clauses in construction contracts that require one party to indemnify another for the indemnitee's own negligence or intentional acts. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (NC UETA — Chapter 66, Article 40, §§ 66-311 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or that mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Chapter 75, § 75-65):
   North Carolina requires prompt notification to affected residents following discovery of a security breach involving personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response procedures, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all North Carolina-specific findings in your issues array with a clauseReference of "North Carolina Law" where applicable.
`.trim();

// Idaho-specific addendum
const IDAHO_ADDENDUM = `

IDAHO JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Idaho-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Idaho Title 29, § 29-110):
   Idaho enforces non-compete and non-solicitation agreements only if they are: (a) in writing; (b) supported by adequate consideration; (c) reasonably limited in time, geographic area, and scope of activity. Idaho courts will not blue-pencil overbroad covenants — they are void in their entirety if unreasonable. Flag any non-compete lacking consideration, with duration exceeding 18 months without strong justification, overbroad geography, or unlimited activity scope. Flag as HIGH if facially unenforceable.

2. IDAHO CONSUMER PROTECTION ACT (Title 48, Chapter 6, §§ 48-601 et seq.):
   Flag any clause that waives consumer protection rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability under the ICPA. Note any mandatory arbitration clause that bars access to ICPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY / COMMERCIAL LENDING LIMITS (Title 28, Chapter 46, § 28-46-101 et seq.):
   Idaho does not impose a general usury cap for commercial loans agreed to in writing, but consumer credit transactions are governed by the Idaho Credit Code. Flag any interest rate, default rate, or fee structure that appears to violate applicable limits for the contract type. Flag as HIGH if the rate is clearly excessive relative to the transaction type or if no rate disclosure is present in a consumer credit agreement.

4. CONSTRUCTION ANTI-INDEMNITY (Title 29 + Title 44):
   Idaho's anti-indemnity provisions limit the enforceability of indemnification clauses in construction contracts that purport to indemnify a party for its own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Idaho UETA — Title 28, Chapter 50, §§ 28-50-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or that mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Title 28, Chapter 51, § 28-51-104):
   Idaho requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response procedures, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Idaho-specific findings in your issues array with a clauseReference of "Idaho Law" where applicable.
`.trim();

// Georgia-specific addendum
const GEORGIA_ADDENDUM = `

GEORGIA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Georgia-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Georgia Restrictive Covenants Act — O.C.G.A. § 13-8-50 et seq.):
   Georgia enforces non-compete and non-solicitation agreements only if they are: (a) in writing; (b) supported by adequate consideration; (c) reasonably limited in time (typically ≤2 years), geographic area, and scope of restricted activity. Unlike many states, Georgia courts may modify (blue-pencil) overbroad covenants rather than voiding them entirely. Flag any non-compete lacking consideration, with duration exceeding 2 years, unreasonably broad geography (national or global without justification), or undefined activity restrictions. Flag as HIGH if facially unenforceable.

2. FAIR BUSINESS PRACTICES ACT (O.C.G.A. § 10-1-390 et seq.):
   Flag any clause that waives FBPA rights, limits remedies for unfair or deceptive acts in consumer commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars access to FBPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (O.C.G.A. § 7-4-2 et seq.):
   The general Georgia usury cap for written contracts is 16% per annum; for loans above $3,000, parties may contract for any rate agreed in writing. Consumer loans are subject to separate Industrial Loan Act limits. Flag any interest rate, default rate, or fee structure that appears to exceed 16% without a statutory exemption or written agreement. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (O.C.G.A. § 13-8-2):
   Georgia's anti-indemnity provision renders void any clause in a construction contract that requires one party to indemnify another for the indemnitee's own negligence or wrongful acts. Flag any broad indemnification clause in a construction or contractor agreement that lacks a negligence carve-out or purports to cover the indemnitee's own fault. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Georgia UETA — O.C.G.A. § 10-12-1 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or that mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (O.C.G.A. § 10-1-912):
   Georgia requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response procedures, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Georgia-specific findings in your issues array with a clauseReference of "Georgia Law" where applicable.
`.trim();

// Washington-specific addendum
const WASHINGTON_ADDENDUM = `

WASHINGTON JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Washington-specific checks and include any violations as issues:

1. NON-COMPETE / NONCOMPETITION AGREEMENTS (RCW 49.62):
   Washington's Noncompetition Agreements Act makes non-competes enforceable only if: (a) the employee earns above the statutory earnings threshold (currently ~$100,000/year for employees, ~$250,000/year for independent contractors); (b) the employer provides written notice of the covenant at least ten business days before the start date or before a promotion; (c) the covenant is reasonable in duration (courts presumptively disfavor terms exceeding 18 months) and scope. Flag any non-compete lacking proper advance notice, below the earnings threshold, or with an unreasonable duration or scope. Flag as HIGH if the earner is below the threshold or notice was not given.

2. CONSUMER PROTECTION ACT (RCW 19.86):
   Flag any clause that waives CPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CPA remedies or treble damages. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (RCW 19.52):
   Washington's general usury cap is 12% per annum unless a higher rate is agreed in writing or falls within a statutory exemption. Flag any interest rate, default rate, or fee structure that exceeds 12% without a written agreement or applicable exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (RCW 4.24.360):
   Washington voids indemnification clauses in construction contracts that require one party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Washington UETA — RCW 1.80):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (RCW 19.255.010):
   Washington requires notification to affected residents without unreasonable delay following discovery of a breach. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response procedures, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Washington-specific findings in your issues array with a clauseReference of "Washington Law" where applicable.
`.trim();

// Utah-specific addendum
const UTAH_ADDENDUM = `

UTAH JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Utah-specific checks and include any violations as issues:

1. NON-COMPETE / POST-EMPLOYMENT RESTRICTIONS (Utah Post-Employment Restrictions Act — Utah Code § 34-51-101 et seq.):
   Utah restricts post-employment non-compete agreements with former employees to a maximum duration of one year. Flag any non-compete exceeding one year. Non-solicitation covenants may have different treatment. Adequate consideration is required. Flag as HIGH if duration exceeds one year or consideration is absent.

2. CONSUMER SALES PRACTICES ACT (Utah Code § 13-11-1 et seq.):
   Flag any clause that waives CSPA rights, limits remedies for deceptive acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars CSPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Utah Code § 15-1-1):
   Utah's general interest rate limit is 10% per annum in the absence of a written agreement specifying a rate; parties to a written contract may agree to any rate. Flag any consumer credit agreement where the rate is not clearly disclosed or exceeds applicable limits for that transaction type. Flag as HIGH if a consumer rate appears clearly excessive without disclosure.

4. CONSTRUCTION ANTI-INDEMNITY (Utah Code § 13-8-1 et seq.):
   Utah voids indemnification clauses in construction contracts that purport to indemnify a party for its own negligence or willful misconduct. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Utah UETA — Utah Code § 46-4-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Utah Code § 13-44-101 et seq.):
   Utah requires notification to affected individuals without unreasonable delay following discovery of a breach of personal data. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Utah-specific findings in your issues array with a clauseReference of "Utah Law" where applicable.
`.trim();

// Arizona-specific addendum
const ARIZONA_ADDENDUM = `

ARIZONA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Arizona-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (A.R.S. § 44-521 et seq.):
   Arizona enforces non-compete and non-solicitation agreements if they are ancillary to a legitimate employment or business relationship and reasonable in time, geographic area, and type of restricted activity. Courts apply a reasonableness standard and may blue-pencil overbroad covenants. Flag any non-compete lacking consideration, with unreasonable duration (>2 years without strong justification), overbroad geography, or overly broad activity restrictions. Flag as HIGH if facially unenforceable.

2. CONSUMER FRAUD ACT (A.R.S. § 44-1521 et seq.):
   Flag any clause that waives Consumer Fraud Act rights, limits remedies for deceptive or unfair practices in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars CFA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (A.R.S. § 44-1201 et seq.):
   Arizona's general usury cap is 10% per annum unless a different rate is agreed to in writing or falls within a statutory exemption. Flag any interest rate, default rate, or fee structure that exceeds 10% without a written agreement. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (A.R.S. § 32-1159):
   Arizona voids indemnification clauses in construction contracts that require one party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Arizona UETA — A.R.S. § 44-7001 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (A.R.S. § 44-7501):
   Arizona requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response procedures, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Arizona-specific findings in your issues array with a clauseReference of "Arizona Law" where applicable.
`.trim();

// Tennessee-specific addendum
const TENNESSEE_ADDENDUM = `

TENNESSEE JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Tennessee-specific checks and include any violations as issues:

1. NON-COMPETE (Tennessee Non-Compete Act — Tenn. Code Ann. § 47-25-1501 et seq.):
   Tennessee enforces non-compete agreements only when: (a) supported by adequate consideration (including continued employment for existing employees); (b) the employer has a legitimate business interest to protect (trade secrets, customer relationships, specialized training); (c) the restrictions are reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Flag any non-compete lacking a legitimate business interest, with duration exceeding 2 years, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER PROTECTION ACT (Tenn. Code Ann. § 47-18-101 et seq.):
   Flag any clause that waives TCPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars TCPA remedies or treble damages. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Tenn. Code Ann. § 47-14-101 et seq.):
   Tennessee's general usury limit is 10% per annum; written agreements between sophisticated parties may set a different rate within statutory limits. Flag any interest rate, default rate, or fee structure that appears to exceed applicable limits without a valid written agreement or exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (Tenn. Code Ann. § 62-6-123):
   Tennessee voids indemnification clauses in construction contracts that require a contractor or subcontractor to indemnify another party for that party's own negligence or intentional acts. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Tennessee UETA — Tenn. Code Ann. § 47-10-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Tenn. Code Ann. § 47-18-2107):
   Tennessee requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response procedures, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Tennessee-specific findings in your issues array with a clauseReference of "Tennessee Law" where applicable.
`.trim();

// Illinois-specific addendum
const ILLINOIS_ADDENDUM = `

ILLINOIS JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Illinois-specific checks and include any violations as issues:

1. NON-COMPETE (Illinois Freedom to Work Act — 820 ILCS 90):
   Illinois enforces non-compete and non-solicitation agreements only if: (a) the employee earns above the statutory earnings threshold (currently $75,000/year for non-competes, $45,000/year for non-solicitation); (b) the employer provides at least 14 days of advance notice and opportunity to review before the employee is required to sign; (c) the covenant is ancillary to a legitimate business interest; (d) the restrictions are reasonable in scope and duration. Flag any non-compete where the earner is below threshold, advance notice was not given, or restrictions are unreasonably broad. Flag as HIGH if the earnings threshold is not met.

2. CONSUMER FRAUD AND DECEPTIVE BUSINESS PRACTICES ACT (815 ILCS 505/1 et seq.):
   Flag any clause that waives ICFA rights, limits remedies for unfair or deceptive acts, or disclaims statutory liability. Note any mandatory arbitration clause that bars ICFA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (815 ILCS 205):
   Illinois's general usury cap is 9% per annum for written contracts (5% for unwritten obligations); commercial loans between businesses may set a different rate by written agreement. Flag any interest rate, default rate, or fee structure that exceeds 9% without a valid written agreement or statutory exemption. Flag as HIGH if clearly usurious for a consumer transaction.

4. CONSTRUCTION ANTI-INDEMNITY (740 ILCS 35):
   Illinois voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Illinois UETA — 5 ILCS 175):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (815 ILCS 530):
   Illinois requires notification to affected residents in the most expedient time possible, and no later than 45 days after discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Illinois-specific findings in your issues array with a clauseReference of "Illinois Law" where applicable.
`.trim();

// Colorado-specific addendum
const COLORADO_ADDENDUM = `

COLORADO JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Colorado-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (C.R.S. § 8-2-113):
   Colorado significantly restricts non-compete agreements. As of 2022, non-competes are enforceable only for workers earning above the threshold set by the Colorado Department of Labor (~$123,750/year for 2024) and only to protect trade secrets or proprietary information. Non-solicitation of employees requires a lower but still applicable earnings threshold. Advance notice of at least 14 days before the start date is required. Flag any non-compete where the earner is below threshold, no advance notice was given, or the restriction is not tied to trade secret protection. Flag as HIGH if facially unenforceable.

2. CONSUMER PROTECTION ACT (C.R.S. § 6-1-101 et seq.):
   Flag any clause that waives CCPA rights, limits remedies for unfair or deceptive trade practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars CCPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (C.R.S. § 5-12-101 et seq.):
   Colorado's general legal rate of interest is 8% per annum in the absence of an agreement; parties may agree to a higher rate in writing. Consumer credit transactions are separately governed by the Colorado Uniform Consumer Credit Code. Flag any rate appearing to exceed applicable limits without a written agreement or statutory exemption. Flag as HIGH if clearly usurious for the contract type.

4. CONSTRUCTION ANTI-INDEMNITY (C.R.S. § 13-21-111.5):
   Colorado limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause lacking a proportional negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Colorado UETA — C.R.S. § 24-71.5-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (C.R.S. § 6-1-716):
   Colorado requires notification to affected residents without unreasonable delay and no later than 30 days after discovery of a breach. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Colorado-specific findings in your issues array with a clauseReference of "Colorado Law" where applicable.
`.trim();

// Nevada-specific addendum
const NEVADA_ADDENDUM = `

NEVADA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Nevada-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (NRS § 613.195 et seq.):
   Nevada enforces non-compete agreements only if: (a) supported by valuable consideration; (b) the employer has a legitimate protectable interest; (c) the restriction is reasonable in scope, duration, and geographic area. Courts may blue-pencil overbroad covenants. Non-competes against low-wage workers (below $16.50/hour) are void. Flag any non-compete lacking consideration, applied to a low-wage worker, or with unreasonably broad restrictions. Flag as HIGH if the worker is below the wage threshold.

2. DECEPTIVE TRADE PRACTICES ACT (NRS § 598.0903 et seq.):
   Flag any clause that waives Nevada DTPA rights, limits remedies for deceptive or unfair practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars DTPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (NRS § 99.010 et seq.):
   Nevada's general usury cap is 12% per annum unless a higher rate is agreed in writing or falls within a statutory exemption (licensed lenders and commercial transactions may agree to higher rates). Flag any interest rate, default rate, or fee structure that exceeds 12% without a written agreement or exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (NRS § 616B.609):
   Nevada limits indemnification in construction contracts — clauses that purport to indemnify a party for its own sole negligence are void. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Nevada UETA — NRS § 719.010 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (NRS § 603A.220):
   Nevada requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Nevada-specific findings in your issues array with a clauseReference of "Nevada Law" where applicable.
`.trim();

// Virginia-specific addendum
const VIRGINIA_ADDENDUM = `

VIRGINIA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Virginia-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Va. Code § 40.1-28.7:7 et seq.):
   Virginia restricts non-compete agreements against low-wage workers (those earning wages at or below the average weekly wage). For higher earners, non-competes must be narrowly tailored to protect legitimate business interests and reasonable in duration, geographic scope, and activity scope. Courts apply a strict "no broader than necessary" standard and will not blue-pencil — an overbroad covenant is void entirely. Flag any non-compete applied to a low-wage worker, or that is overbroad in scope, geography, or duration. Flag as HIGH if applied to a worker earning at or below the average weekly wage.

2. CONSUMER PROTECTION ACT (Va. Code § 59.1-196 et seq.):
   Flag any clause that waives VCPA rights, limits remedies for unfair or deceptive acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars VCPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Va. Code § 6.2-301 et seq.):
   Virginia's general usury cap is 12% per annum; written contracts may specify a different rate. Consumer credit is separately regulated under the Consumer Finance Act. Flag any interest rate, default rate, or fee structure that exceeds 12% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (Va. Code § 11-4.1):
   Virginia voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional misconduct. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Virginia UETA — Va. Code § 59.1-479 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Va. Code § 18.2-186.6):
   Virginia requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Virginia-specific findings in your issues array with a clauseReference of "Virginia Law" where applicable.
`.trim();

// Pennsylvania-specific addendum
const PENNSYLVANIA_ADDENDUM = `

PENNSYLVANIA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Pennsylvania-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Pennsylvania common law + 43 P.S. § 206 et seq.):
   Pennsylvania enforces non-compete agreements under a common law reasonableness standard. The covenant must be: (a) ancillary to an employment or business sale agreement; (b) supported by adequate consideration (a new job offer is sufficient; continued employment for existing employees requires additional consideration); (c) reasonably limited in time (typically ≤2 years), geographic scope, and type of activity. Courts will not blue-pencil — an overbroad covenant is void entirely. Flag any non-compete lacking adequate consideration, exceeding 2 years, or with unreasonably broad geography or scope. Flag as HIGH if facially unenforceable.

2. UNFAIR TRADE PRACTICES AND CONSUMER PROTECTION LAW (73 P.S. § 201-1 et seq.):
   Flag any clause that waives UTPCPL rights, limits remedies for unfair or deceptive business practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars UTPCPL remedies or treble damages. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (41 P.S. § 301 et seq.):
   Pennsylvania's general legal interest rate is 6% per annum; parties may agree to a higher rate in writing under the Loan Interest and Protection Law. Consumer loans are separately regulated. Flag any interest rate, default rate, or fee structure that exceeds 6% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious for a consumer transaction.

4. CONSTRUCTION ANTI-INDEMNITY (68 P.S. § 491):
   Pennsylvania voids indemnification clauses in construction contracts that require a contractor to indemnify another party for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Pennsylvania UETA — 73 P.S. § 2260.101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (73 P.S. § 2301 et seq.):
   Pennsylvania requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Pennsylvania-specific findings in your issues array with a clauseReference of "Pennsylvania Law" where applicable.
`.trim();

// Oregon-specific addendum
const OREGON_ADDENDUM = `

OREGON JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Oregon-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (ORS § 653.295 et seq.):
   Oregon strictly limits non-compete agreements. They are enforceable only if: (a) the employee is exempt from overtime (i.e., earns above $100,533/year or the salary threshold); (b) the employer provides a bona fide advancement opportunity or the agreement is entered upon a new hire with advance written notice; (c) the employer has a protectable interest in trade secrets or competitively sensitive confidential information; (d) the duration does not exceed 12 months. Flag any non-compete exceeding 12 months, applied to a non-exempt employee, or lacking a legitimate business interest. Flag as HIGH if the duration exceeds 12 months or the employee is non-exempt.

2. UNLAWFUL TRADE PRACTICES ACT (ORS § 646.605 et seq.):
   Flag any clause that waives UTPA rights, limits remedies for unfair or deceptive trade practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars UTPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (ORS § 82.010 et seq.):
   Oregon's general usury cap is 9% per annum; parties may agree to a higher rate in writing. Consumer credit is separately regulated. Flag any interest rate, default rate, or fee structure that exceeds 9% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (ORS § 30.140):
   Oregon voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Oregon UETA — ORS § 84.001 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (ORS § 646A.600 et seq.):
   Oregon requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Oregon-specific findings in your issues array with a clauseReference of "Oregon Law" where applicable.
`.trim();

// Michigan-specific addendum
const MICHIGAN_ADDENDUM = `

MICHIGAN JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Michigan-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (MCL 445.774a):
   Michigan enforces non-compete agreements only if: (a) in writing; (b) reasonable as to duration, geographic area, and type of business or activity restricted; (c) protect an employer's reasonable competitive business interest. Courts may blue-pencil overbroad covenants. Flag any non-compete that is not tied to a legitimate competitive interest, has an unreasonable duration (>2 years without strong justification), overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. MICHIGAN CONSUMER PROTECTION ACT (MCL 445.901 et seq.):
   Flag any clause that waives MCPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars MCPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (MCL 438.31 et seq.):
   Michigan's general written interest rate limit is 7% per annum absent a statutory exception; the criminal usury threshold is 25%. Licensed lenders and certain commercial transactions may charge different rates. Flag any rate that appears to exceed applicable limits without a written agreement or exemption. Flag as HIGH if the rate approaches or exceeds the criminal threshold.

4. CONSTRUCTION ANTI-INDEMNITY (common law + MCL principles):
   Michigan common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Michigan UETA — MCL 450.831 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (MCL 445.72):
   Michigan requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Michigan-specific findings in your issues array with a clauseReference of "Michigan Law" where applicable.
`.trim();

// Ohio-specific addendum
const OHIO_ADDENDUM = `

OHIO JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Ohio-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (R.C. 1333.69):
   Ohio enforces non-compete agreements under a reasonableness standard: the restriction must be no greater than necessary to protect a legitimate business interest, must not impose undue hardship on the employee, and must not be injurious to the public. Courts will blue-pencil overbroad covenants. Flag any non-compete lacking a legitimate business interest, with unreasonable duration (>2 years), overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER SALES PRACTICES ACT (R.C. 1345.01 et seq.):
   Flag any clause that waives CSPA rights, limits remedies for deceptive or unconscionable acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars CSPA remedies or class actions. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (R.C. 1343.01 et seq.):
   Ohio's general usury cap is 8% per annum in the absence of a written agreement; parties may agree to a higher rate in writing. Flag any interest rate, default rate, or fee structure that exceeds 8% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (R.C. 2305.31):
   Ohio voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional misconduct. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Ohio UETA — R.C. 1306.01 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (R.C. 1349.19):
   Ohio requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Ohio-specific findings in your issues array with a clauseReference of "Ohio Law" where applicable.
`.trim();

// New York-specific addendum
const NEW_YORK_ADDENDUM = `

NEW YORK JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional New York-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (G.B.L. § 340 et seq.):
   New York enforces non-compete agreements under a strict common law reasonableness test: the restriction must be necessary to protect a legitimate interest (trade secrets, confidential information, or unique/extraordinary employee skills), must not impose undue hardship, and must not harm the public. New York courts will not blue-pencil — an overbroad covenant is void. Note that recent legislative activity has further restricted non-competes against lower-wage workers. Flag any non-compete lacking a legitimate interest, with unreasonable duration, overbroad geography, or unlimited activity scope. Flag as HIGH if applied to a non-senior employee without a clear protectable interest.

2. CONSUMER PROTECTION ACT (G.B.L. § 349 et seq.):
   Flag any clause that waives rights under G.B.L. § 349, limits remedies for deceptive acts or practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars § 349 remedies or class actions. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (G.B.L. § 5-501):
   New York's civil usury limit is 16% per annum; the criminal usury limit is 25%. Commercial loans above $2.5 million are exempt from civil usury. Flag any interest rate, default rate, or fee structure that appears to exceed 16% without an applicable exemption. Flag as HIGH if the rate approaches or exceeds the criminal threshold of 25%.

4. CONSTRUCTION ANTI-INDEMNITY (G.B.L. § 5-322.1):
   New York voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (New York E-Sign — E.C.L. § 304):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (G.B.L. § 899-aa):
   New York requires notification to affected residents without unreasonable delay following discovery of a breach of private information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all New York-specific findings in your issues array with a clauseReference of "New York Law" where applicable.
`.trim();

// Minnesota-specific addendum
const MINNESOTA_ADDENDUM = `

MINNESOTA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Minnesota-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Minn. Stat. § 325.01 et seq.):
   Minnesota significantly restricts non-compete agreements. As of 2023, non-compete agreements with employees and independent contractors are void and unenforceable (Minn. Stat. § 181.988), with narrow exceptions for agreements entered into in connection with the sale of a business. Flag any non-compete with an employee or independent contractor entered into after January 1, 2023 as void. Flag as HIGH.

2. CONSUMER FRAUD ACT (Minn. Stat. § 325F.68 et seq.):
   Flag any clause that waives Consumer Fraud Act rights, limits remedies for deceptive practices in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CFA remedies or private actions. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Minn. Stat. § 334.01 et seq.):
   Minnesota's general interest rate limit is 6% per annum absent a written agreement; commercial parties may agree to a higher rate in writing. Flag any rate exceeding applicable limits without a written agreement. Flag as HIGH if clearly usurious for the contract type.

4. CONSTRUCTION ANTI-INDEMNITY (Minn. Stat. § 337.01 et seq.):
   Minnesota voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Minnesota UETA — Minn. Stat. § 325L.01 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Minn. Stat. § 325E.61):
   Minnesota requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Minnesota-specific findings in your issues array with a clauseReference of "Minnesota Law" where applicable.
`.trim();

// Missouri-specific addendum
const MISSOURI_ADDENDUM = `

MISSOURI JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Missouri-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Mo. Rev. Stat. § 416.010 et seq.):
   Missouri enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest (trade secrets, customer relationships, specialized training), must be reasonable in time and scope, and must not impose undue hardship. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking a legitimate business interest, with unreasonable duration (>2 years), overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. MERCHANDISING PRACTICES ACT (Mo. Rev. Stat. § 407.010 et seq.):
   Flag any clause that waives MPA rights, limits remedies for deceptive practices in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars MPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Mo. Rev. Stat. § 408.030 et seq.):
   Missouri's general usury cap is 10% per annum in the absence of a written agreement; parties may agree to a higher rate in writing. Flag any interest rate, default rate, or fee structure that exceeds 10% without a written agreement. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (Mo. Rev. Stat. § 434.100):
   Missouri limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Missouri UETA — Mo. Rev. Stat. § 432.200 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Mo. Rev. Stat. § 407.1500):
   Missouri requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Missouri-specific findings in your issues array with a clauseReference of "Missouri Law" where applicable.
`.trim();

// Wisconsin-specific addendum
const WISCONSIN_ADDENDUM = `

WISCONSIN JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Wisconsin-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Wis. Stat. § 103.465):
   Wisconsin enforces non-compete agreements only if they are: (a) necessary to protect a legitimate interest; (b) supported by consideration; (c) reasonable in time (courts rarely enforce beyond 2 years), geographic scope, and type of restricted activity. Wisconsin courts apply strict construction against the employer — an overbroad covenant is void in its entirety, not blue-penciled. Flag any non-compete with an unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if the covenant is overbroad, as it will be entirely void.

2. DECEPTIVE TRADE PRACTICES (Wis. Stat. § 100.18 et seq.):
   Flag any clause that waives rights under § 100.18, limits remedies for deceptive representations in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars § 100.18 remedies or class actions. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Wis. Stat. § 138.01 et seq.):
   Wisconsin's general usury cap is 5% per annum in the absence of a written agreement; parties may agree to a higher rate in writing up to applicable maximums. Commercial loans have different treatment. Flag any interest rate, default rate, or fee structure that exceeds applicable limits without a written agreement. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (Wis. Stat. § 779.70):
   Wisconsin voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional acts. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Wisconsin UETA — Wis. Stat. § 711.01 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Wis. Stat. § 134.98):
   Wisconsin requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves personal data: flag any absence of breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Wisconsin-specific findings in your issues array with a clauseReference of "Wisconsin Law" where applicable.
`.trim();

// Louisiana-specific addendum
const LOUISIANA_ADDENDUM = `

LOUISIANA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Louisiana-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (La. R.S. 23:921):
   Louisiana strictly restricts non-compete agreements. They are enforceable only if: (a) in writing; (b) limited to a maximum duration of 2 years from termination; (c) restricted to specific parishes (counties) listed by name in the agreement — a statewide or regional geography is not sufficient; (d) limited to the specific types of businesses or services for which the employee worked. Courts will not blue-pencil — overbroad covenants are void entirely. Flag any non-compete lacking a specific list of parishes, exceeding 2 years, or with unlimited activity scope. Flag as HIGH if facially unenforceable.

2. LOUISIANA UNFAIR TRADE PRACTICES ACT (LUTPA — La. R.S. 51:1401 et seq.):
   Flag any clause that waives LUTPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars LUTPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (La. R.S. 9:3500 et seq.):
   Louisiana's general usury cap is 12% per annum unless otherwise agreed in writing or exempted by statute. Consumer credit transactions are separately governed by the Louisiana Consumer Credit Law. Flag any interest rate, default rate, or fee structure that exceeds 12% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (La. R.S. 9:2780):
   Louisiana voids indemnification clauses in construction contracts that purport to indemnify a party for its own negligence or intentional acts. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Louisiana UETA — La. R.S. 9:2601 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (La. R.S. 51:3071 et seq.):
   Louisiana requires notification to affected residents within 60 days of discovering a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Louisiana-specific findings in your issues array with a clauseReference of "Louisiana Law" where applicable.
`.trim();

// Indiana-specific addendum
const INDIANA_ADDENDUM = `

INDIANA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Indiana-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Indiana common law):
   Indiana enforces non-compete agreements under a common law reasonableness standard: the restriction must be reasonably necessary to protect a legitimate business interest (trade secrets, customer relationships, specialized training), must be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking a legitimate interest, with unreasonable duration or geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. DECEPTIVE CONSUMER SALES ACT (DCSA — Ind. Code § 24-5-0.5 et seq.):
   Flag any clause that waives DCSA rights, limits remedies for deceptive acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars DCSA remedies or class actions. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Ind. Code § 24-4.5 et seq. — Indiana Uniform Consumer Credit Code):
   Indiana's general statutory interest rate limit is 8% per annum for personal loans absent a specific agreement; commercial lending rates are generally governed by agreement. Consumer credit is regulated under the IUCCC. Flag any consumer credit agreement where the rate is not clearly disclosed, or where the stated rate appears to exceed applicable limits for the transaction type. Flag as HIGH if clearly usurious or no rate disclosure is present in a consumer credit agreement.

4. CONSTRUCTION ANTI-INDEMNITY (Ind. Code § 26-2-5):
   Indiana voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or willful misconduct. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Indiana UETA — Ind. Code § 26-2-8 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Ind. Code § 24-4.9 et seq.):
   Indiana requires notification to affected residents within 72 hours of discovering a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Indiana-specific findings in your issues array with a clauseReference of "Indiana Law" where applicable.
`.trim();

// Kentucky-specific addendum
const KENTUCKY_ADDENDUM = `

KENTUCKY JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Kentucky-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Kentucky common law):
   Kentucky enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest, must be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Adequate consideration is required — continued employment alone may be insufficient for existing employees absent other consideration. Courts may blue-pencil or refuse to enforce overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. KENTUCKY CONSUMER PROTECTION ACT (KCPA — KRS § 367.110 et seq.):
   Flag any clause that waives KCPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars KCPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (KRS § 360.010 et seq.):
   Kentucky's general legal interest rate is 8% per annum in the absence of a written agreement; parties may agree to a higher rate in writing. Consumer credit is separately regulated. Flag any interest rate, default rate, or fee structure that exceeds 8% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (KRS § 371.135):
   Kentucky voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional misconduct. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Kentucky UETA — KRS § 369.101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (KRS § 365.732):
   Kentucky requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Kentucky-specific findings in your issues array with a clauseReference of "Kentucky Law" where applicable.
`.trim();

// Maryland-specific addendum
const MARYLAND_ADDENDUM = `

MARYLAND JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Maryland-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (MD Code, Lab. & Empl. § 3-716 et seq. + common law):
   Maryland restricts non-compete agreements against lower-wage employees (those earning at or below 150% of the state minimum wage). For higher earners, non-competes must be reasonably necessary to protect a legitimate business interest and reasonable in time (typically ≤2 years), geographic scope, and activity. Courts may not blue-pencil — an overbroad covenant is void. Flag any non-compete applied to a lower-wage worker, lacking adequate consideration, with unreasonable scope, or without a clear legitimate business interest. Flag as HIGH if applied to a worker at or below the wage threshold.

2. MARYLAND CONSUMER PROTECTION ACT (MCPA — MD Code, Com. Law § 13-101 et seq.):
   Flag any clause that waives MCPA rights, limits remedies for unfair or deceptive trade practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars MCPA remedies or class actions. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (MD Code, Com. Law § 12-103 et seq.):
   Maryland's general legal interest rate is 6% per annum in the absence of a written agreement; written agreements may specify higher rates within statutory limits. Consumer loans are separately regulated. Flag any interest rate, default rate, or fee structure that exceeds applicable limits without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (MD Code, Real Prop. § 14-505):
   Maryland voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Maryland UETA — MD Code, Com. Law § 21-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (MD Code, Com. Law § 14-3501 et seq.):
   Maryland requires notification to affected residents within 45 days of discovering a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Maryland-specific findings in your issues array with a clauseReference of "Maryland Law" where applicable.
`.trim();

// Massachusetts-specific addendum
const MASSACHUSETTS_ADDENDUM = `

MASSACHUSETTS JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Massachusetts-specific checks and include any violations as issues:

1. NON-COMPETE (Massachusetts Noncompetition Agreement Act — M.G.L. c. 149, § 24L):
   Massachusetts strictly regulates non-compete agreements with employees. They are enforceable only if: (a) the employee earns above $75,000/year (indexed); (b) the employer provides written notice at least 10 business days before the start date or signing; (c) the agreement is supported by garden leave pay (at least 50% of base salary for the restricted period) or other mutually agreed consideration; (d) the duration does not exceed 12 months; (e) the geographic scope and activity restrictions are reasonable. Flag any non-compete lacking garden leave or equivalent consideration, exceeding 12 months, without proper advance notice, or applied to a non-exempt or low-wage worker. Flag as HIGH if any mandatory requirement is absent.

2. MASSACHUSETTS CONSUMER PROTECTION ACT (M.G.L. c. 93A):
   Flag any clause that waives c. 93A rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars c. 93A remedies or multiple damages. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (M.G.L. c. 107, § 3 et seq.):
   Massachusetts caps interest at 20% per annum for written consumer obligations; the default (no written rate) is 6%. Commercial parties may generally agree to higher rates. Flag any consumer credit agreement with a rate exceeding 20%, or any agreement with an interest rate or fee structure that appears to violate applicable limits. Flag as HIGH if clearly usurious for the contract type.

4. CONSTRUCTION ANTI-INDEMNITY (M.G.L. c. 149, § 29C):
   Massachusetts voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Massachusetts UETA — M.G.L. c. 110G):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (M.G.L. c. 93H):
   Massachusetts requires notification to affected residents within 30 days of discovering a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Massachusetts-specific findings in your issues array with a clauseReference of "Massachusetts Law" where applicable.
`.trim();

// Connecticut-specific addendum
const CONNECTICUT_ADDENDUM = `

CONNECTICUT JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Connecticut-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Connecticut common law + CGS § 20-14p for physicians):
   Connecticut enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest, must be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. For physicians, CGS § 20-14p imposes specific restrictions — physician non-competes may not exceed 1 year and must be limited to a 15-mile radius. Courts may blue-pencil overbroad covenants in general commercial contexts but will void physician non-competes that violate the statute. Flag any non-compete with unreasonable duration, overbroad geography, or lacking a legitimate business interest. For physicians: flag any duration exceeding 1 year or radius exceeding 15 miles as HIGH.

2. CONNECTICUT UNFAIR TRADE PRACTICES ACT (CUTPA — CGS § 42-110a et seq.):
   Flag any clause that waives CUTPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CUTPA remedies or punitive damages. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (CGS § 37-4 et seq.):
   Connecticut's general usury cap is 12% per annum unless a different rate is agreed in writing or falls within a statutory exemption. Consumer credit is separately regulated. Flag any interest rate, default rate, or fee structure that exceeds 12% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (CGS § 52-572k):
   Connecticut voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Connecticut UETA — CGS § 1-266 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (CGS § 36a-701b):
   Connecticut requires notification to affected residents within 90 days of discovering a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Connecticut-specific findings in your issues array with a clauseReference of "Connecticut Law" where applicable.
`.trim();

// New Mexico-specific addendum
const NEW_MEXICO_ADDENDUM = `

NEW MEXICO JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional New Mexico-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (N.M. Stat. Ann. § 47-9A-1 et seq.):
   New Mexico enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. UNFAIR PRACTICES ACT (N.M. Stat. Ann. § 57-12-1 et seq.):
   Flag any clause that waives UPA rights, limits remedies for unfair or deceptive trade practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars UPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (N.M. Stat. Ann. § 56-8-1 et seq.):
   New Mexico's general usury cap is 15% per annum for written consumer agreements absent a statutory exemption. Commercial lending rates are largely governed by agreement. Flag any interest rate, default rate, or fee structure that exceeds 15% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (N.M. Stat. Ann. § 56-7-1):
   New Mexico voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (New Mexico UETA — N.M. Stat. Ann. § 55-1-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (N.M. Stat. Ann. § 57-12C-1 et seq.):
   New Mexico requires notification to affected residents without unreasonable delay following discovery of a breach of personal identifying information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all New Mexico-specific findings in your issues array with a clauseReference of "New Mexico Law" where applicable.
`.trim();

// Kansas-specific addendum
const KANSAS_ADDENDUM = `

KANSAS JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Kansas-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (K.S.A. § 44-117 et seq.):
   Kansas enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER PROTECTION ACT (K.S.A. § 50-623 et seq.):
   Flag any clause that waives Kansas CPA rights, limits remedies for deceptive or unconscionable acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars CPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (K.S.A. § 16-201 et seq.):
   Kansas's general usury cap is 15% per annum; written contracts may specify a higher rate within statutory limits. Consumer credit transactions are separately regulated. Flag any interest rate, default rate, or fee structure that exceeds 15% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (K.S.A. § 16-121):
   Kansas voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Kansas UETA — K.S.A. § 16-1601 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (K.S.A. § 50-7a01 et seq.):
   Kansas requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Kansas-specific findings in your issues array with a clauseReference of "Kansas Law" where applicable.
`.trim();

// Nebraska-specific addendum
const NEBRASKA_ADDENDUM = `

NEBRASKA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Nebraska-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Neb. Rev. Stat. § 59-1601 et seq.):
   Nebraska enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER PROTECTION ACT (Neb. Rev. Stat. § 59-1601 et seq.):
   Flag any clause that waives Nebraska CPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Neb. Rev. Stat. § 45-101 et seq.):
   Nebraska's general usury cap is 16% per annum; parties may agree to a higher rate in writing within statutory limits. Commercial transactions may have different treatment. Flag any interest rate, default rate, or fee structure that exceeds 16% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law):
   Nebraska common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Nebraska UETA — Neb. Rev. Stat. § 86-701 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Neb. Rev. Stat. § 87-801 et seq.):
   Nebraska requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Nebraska-specific findings in your issues array with a clauseReference of "Nebraska Law" where applicable.
`.trim();

// West Virginia-specific addendum
const WEST_VIRGINIA_ADDENDUM = `

WEST VIRGINIA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional West Virginia-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (W. Va. Code § 47-18-1 et seq.):
   West Virginia enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER CREDIT AND PROTECTION ACT (W. Va. Code § 46A-1-101 et seq.):
   Flag any clause that waives CCPA rights, limits remedies for unfair or deceptive acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars CCPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (W. Va. Code § 47-6-1 et seq.):
   West Virginia's general legal interest rate is 8% per annum in the absence of a written agreement; parties may agree to a higher rate in writing within statutory limits. Flag any interest rate, default rate, or fee structure that exceeds 8% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law):
   West Virginia common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (West Virginia UETA — W. Va. Code § 39A-1-1 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (W. Va. Code § 46A-2A-101 et seq.):
   West Virginia requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all West Virginia-specific findings in your issues array with a clauseReference of "West Virginia Law" where applicable.
`.trim();

// Delaware-specific addendum
const DELAWARE_ADDENDUM = `

DELAWARE JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Delaware-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (6 Del. C. § 2701 et seq.):
   Delaware enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Delaware is a popular choice of law for commercial contracts; note that a Delaware choice of law clause may affect enforceability of covenants against employees in other states. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER FRAUD ACT (6 Del. C. § 2511 et seq.):
   Flag any clause that waives Delaware CFA rights, limits remedies for deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CFA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (6 Del. C. § 2301 et seq.):
   Delaware does not impose a general usury cap on loans made by licensed lenders or pursuant to written agreement; however, unlicensed consumer lending is capped at approximately 5% per month or the prevailing federal rate. Flag any interest rate, default rate, or fee structure that appears to exceed applicable limits for the contract and lender type. Flag as HIGH if clearly usurious for a consumer transaction.

4. CONSTRUCTION ANTI-INDEMNITY (6 Del. C. § 2704):
   Delaware voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Delaware UETA — 6 Del. C. § 12A-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (6 Del. C. § 12B-101 et seq.):
   Delaware requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Delaware-specific findings in your issues array with a clauseReference of "Delaware Law" where applicable.
`.trim();

// Rhode Island-specific addendum
const RHODE_ISLAND_ADDENDUM = `

RHODE ISLAND JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Rhode Island-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (R.I. Gen. Laws § 15-4-1 et seq.):
   Rhode Island enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. DECEPTIVE TRADE PRACTICES ACT (R.I. Gen. Laws § 6-13.1-1 et seq.):
   Flag any clause that waives Rhode Island DTPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars DTPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (R.I. Gen. Laws § 6-26-1 et seq.):
   Rhode Island's general usury cap is 21% per annum; parties may agree to a higher rate in writing within statutory limits. Consumer credit is separately regulated. Flag any interest rate, default rate, or fee structure that exceeds 21% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law):
   Rhode Island common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Rhode Island UETA — R.I. Gen. Laws § 11-18-1 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (R.I. Gen. Laws § 11-49.3-1 et seq.):
   Rhode Island requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Rhode Island-specific findings in your issues array with a clauseReference of "Rhode Island Law" where applicable.
`.trim();

// New Jersey-specific addendum
const NEW_JERSEY_ADDENDUM = `

NEW JERSEY JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional New Jersey-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (N.J.S.A. 56:10-1 et seq.):
   New Jersey enforces non-compete and non-solicitation agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest, must be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Pending legislation may further restrict non-competes. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER FRAUD ACT (N.J.S.A. 56:8-1 et seq.):
   Flag any clause that waives CFA rights, limits remedies for unfair or deceptive acts in consumer transactions, or disclaims statutory liability. Note any mandatory arbitration clause that bars CFA remedies or treble damages. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (N.J.S.A. 31:1-1 et seq.):
   New Jersey's general usury cap is 16% per annum for consumer loans (6% default absent a written rate). Commercial transactions may have higher rates by written agreement. Flag any interest rate, default rate, or fee structure that exceeds 16% without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (N.J.S.A. 2A:40-1 et seq.):
   New Jersey limits indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (New Jersey UETA — N.J.S.A. 12A:12-1 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (N.J.S.A. 56:8-163):
   New Jersey requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all New Jersey-specific findings in your issues array with a clauseReference of "New Jersey Law" where applicable.
`.trim();

// Alabama-specific addendum
const ALABAMA_ADDENDUM = `

ALABAMA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Alabama-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Ala. Code § 8-1-190 et seq.):
   Alabama enforces non-compete agreements only if: (a) in writing; (b) part of a contract for the protection of trade secrets or in connection with the sale of a business, employment, or a professional practice purchase; (c) reasonable in time (≤2 years for employment contexts), geographic scope, and type of restricted activity. Courts may reform overbroad covenants. Flag any non-compete lacking adequate consideration, exceeding 2 years, or with unreasonably broad geography or activity scope. Flag as HIGH if facially unenforceable.

2. DECEPTIVE TRADE PRACTICES ACT (Ala. Code § 8-19-1 et seq.):
   Flag any clause that waives Alabama DTPA rights, limits remedies for deceptive or unfair practices, or disclaims statutory liability. Note any mandatory arbitration clause that bars DTPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Ala. Code § 8-8-1 et seq.):
   Alabama's general legal interest rate is 8% per annum; written contracts may specify a higher rate. Commercial lending is largely governed by agreement. Flag any interest rate, default rate, or fee structure that exceeds applicable limits without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law + Ala. Code):
   Alabama common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Alabama UETA — Ala. Code § 8-1A-1 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Ala. Code § 8-19F-1 et seq.):
   Alabama requires notification to affected residents without unreasonable delay following discovery of a breach of sensitive personally identifying information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Alabama-specific findings in your issues array with a clauseReference of "Alabama Law" where applicable.
`.trim();

// Oklahoma-specific addendum
const OKLAHOMA_ADDENDUM = `

OKLAHOMA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Oklahoma-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (15 O.S. § 217 et seq.):
   Oklahoma has one of the strictest non-compete laws in the country — non-compete agreements are generally void and unenforceable unless they fall within narrow statutory exceptions (such as agreements incident to the sale of a business or dissolution of a partnership). Employment non-competes are generally void. Flag any employee non-compete as HIGH — it is likely void under Oklahoma law. Non-competes in connection with a business sale may be enforceable if reasonable in time and scope.

2. CONSUMER PROTECTION ACT (15 O.S. § 751 et seq.):
   Flag any clause that waives Oklahoma CPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (14A O.S. § 3-508 et seq.):
   Oklahoma's general usury cap is 10% per annum absent a written agreement or statutory exemption. Consumer credit is separately regulated under the Oklahoma Uniform Consumer Credit Code. Flag any interest rate, default rate, or fee structure that exceeds 10% without a written agreement or applicable exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law + 15 O.S.):
   Oklahoma common law and applicable statutes limit the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Oklahoma UETA — 12A O.S. § 15-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (24 O.S. § 161 et seq.):
   Oklahoma requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Oklahoma-specific findings in your issues array with a clauseReference of "Oklahoma Law" where applicable.
`.trim();

// Arkansas-specific addendum
const ARKANSAS_ADDENDUM = `

ARKANSAS JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Arkansas-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Ark. Code § 4-75-101 et seq.):
   Arkansas enforces non-compete agreements if they are: (a) in writing; (b) supported by adequate consideration; (c) reasonably necessary to protect a legitimate business interest; (d) reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. DECEPTIVE TRADE PRACTICES ACT (Ark. Code § 4-88-101 et seq.):
   Flag any clause that waives Arkansas DTPA rights, limits remedies for deceptive or unconscionable acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars DTPA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Ark. Code § 4-57-101 et seq.):
   Arkansas's general usury cap is 17% per annum (set by the Arkansas Constitution, Amendment 89); parties may agree to a higher rate by written contract up to the constitutional maximum. Flag any interest rate, default rate, or fee structure that exceeds 17% without a valid written agreement or exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law):
   Arkansas common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Arkansas UETA — Ark. Code § 4-8-101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Ark. Code § 4-110-101 et seq.):
   Arkansas requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Arkansas-specific findings in your issues array with a clauseReference of "Arkansas Law" where applicable.
`.trim();

// Mississippi-specific addendum
const MISSISSIPPI_ADDENDUM = `

MISSISSIPPI JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Mississippi-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Miss. Code § 15-3-1 et seq.):
   Mississippi enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER PROTECTION ACT (Miss. Code § 75-24-1 et seq.):
   Flag any clause that waives Mississippi CPA rights, limits remedies for unfair or deceptive acts in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CPA remedies or attorney fees. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Miss. Code § 75-17-1 et seq.):
   Mississippi's general legal interest rate is 8% per annum in the absence of a written agreement; parties may agree to a higher rate in writing within statutory limits. Flag any interest rate, default rate, or fee structure that exceeds applicable limits without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (Miss. Code § 31-5-41):
   Mississippi voids indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence or intentional wrongdoing. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Mississippi UETA — Miss. Code § 75-12-1 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Miss. Code § 75-24-29):
   Mississippi requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Mississippi-specific findings in your issues array with a clauseReference of "Mississippi Law" where applicable.
`.trim();

// Iowa-specific addendum
const IOWA_ADDENDUM = `

IOWA JURISDICTION ANALYSIS — Key Statutes

You MUST perform these additional Iowa-specific checks and include any violations as issues:

1. NON-COMPETE / RESTRICTIVE COVENANTS (Iowa Code § 537A.1 et seq.):
   Iowa enforces non-compete agreements under a common law reasonableness standard: the restriction must protect a legitimate business interest and be reasonable in time (typically ≤2 years), geographic scope, and type of restricted activity. Courts may blue-pencil overbroad covenants. Flag any non-compete lacking adequate consideration, with unreasonable duration, overbroad geography, or undefined activity scope. Flag as HIGH if facially unenforceable.

2. CONSUMER FRAUD ACT (Iowa Code § 714.16 et seq.):
   Flag any clause that waives Iowa Consumer Fraud Act rights, limits remedies for deceptive practices in commerce, or disclaims statutory liability. Note any mandatory arbitration clause that bars CFA remedies. Flag as HIGH if consumer protection rights are expressly waived.

3. USURY (Iowa Code § 535.1 et seq.):
   Iowa's general legal interest rate is 5% per annum in the absence of a written agreement; parties may agree to a higher rate in writing within statutory limits. Commercial lending rates are largely governed by agreement. Flag any interest rate, default rate, or fee structure that exceeds applicable limits without a written agreement or statutory exemption. Flag as HIGH if clearly usurious.

4. CONSTRUCTION ANTI-INDEMNITY (common law):
   Iowa common law limits the enforceability of indemnification clauses in construction contracts that require a party to indemnify another for the indemnitee's own negligence. Flag any broad indemnification clause in a construction or contractor agreement lacking a negligence carve-out. Flag as HIGH.

5. ELECTRONIC SIGNATURES (Iowa UETA — Iowa Code § 554D.101 et seq.):
   Flag any clause that denies the legal effect of electronic records or signatures without legal basis, or mandates wet-ink signatures unnecessarily. Note if no e-signature provision is present where one would be expected.

6. DATA BREACH NOTIFICATION (Iowa Code § 715C.1 et seq.):
   Iowa requires notification to affected residents without unreasonable delay following discovery of a breach of personal information. If this contract involves collection or processing of personal data: flag any absence of data breach notification obligations, response timelines, or incident management clauses. Flag as HIGH if personal data is involved with no data security or breach notification clause.

Include all Iowa-specific findings in your issues array with a clauseReference of "Iowa Law" where applicable.
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
  if (stateCode === "NC") return "\n\n" + NORTH_CAROLINA_ADDENDUM;
  if (stateCode === "ID") return "\n\n" + IDAHO_ADDENDUM;
  if (stateCode === "GA") return "\n\n" + GEORGIA_ADDENDUM;
  if (stateCode === "WA") return "\n\n" + WASHINGTON_ADDENDUM;
  if (stateCode === "UT") return "\n\n" + UTAH_ADDENDUM;
  if (stateCode === "AZ") return "\n\n" + ARIZONA_ADDENDUM;
  if (stateCode === "TN") return "\n\n" + TENNESSEE_ADDENDUM;
  if (stateCode === "IL") return "\n\n" + ILLINOIS_ADDENDUM;
  if (stateCode === "CO") return "\n\n" + COLORADO_ADDENDUM;
  if (stateCode === "NV") return "\n\n" + NEVADA_ADDENDUM;
  if (stateCode === "VA") return "\n\n" + VIRGINIA_ADDENDUM;
  if (stateCode === "PA") return "\n\n" + PENNSYLVANIA_ADDENDUM;
  if (stateCode === "OR") return "\n\n" + OREGON_ADDENDUM;
  if (stateCode === "MI") return "\n\n" + MICHIGAN_ADDENDUM;
  if (stateCode === "OH") return "\n\n" + OHIO_ADDENDUM;
  if (stateCode === "NY") return "\n\n" + NEW_YORK_ADDENDUM;
  if (stateCode === "MN") return "\n\n" + MINNESOTA_ADDENDUM;
  if (stateCode === "MO") return "\n\n" + MISSOURI_ADDENDUM;
  if (stateCode === "WI") return "\n\n" + WISCONSIN_ADDENDUM;
  if (stateCode === "LA") return "\n\n" + LOUISIANA_ADDENDUM;
  if (stateCode === "IN") return "\n\n" + INDIANA_ADDENDUM;
  if (stateCode === "KY") return "\n\n" + KENTUCKY_ADDENDUM;
  if (stateCode === "MD") return "\n\n" + MARYLAND_ADDENDUM;
  if (stateCode === "MA") return "\n\n" + MASSACHUSETTS_ADDENDUM;
  if (stateCode === "CT") return "\n\n" + CONNECTICUT_ADDENDUM;
  if (stateCode === "NM") return "\n\n" + NEW_MEXICO_ADDENDUM;
  if (stateCode === "KS") return "\n\n" + KANSAS_ADDENDUM;
  if (stateCode === "NE") return "\n\n" + NEBRASKA_ADDENDUM;
  if (stateCode === "WV") return "\n\n" + WEST_VIRGINIA_ADDENDUM;
  if (stateCode === "DE") return "\n\n" + DELAWARE_ADDENDUM;
  if (stateCode === "RI") return "\n\n" + RHODE_ISLAND_ADDENDUM;
  if (stateCode === "NJ") return "\n\n" + NEW_JERSEY_ADDENDUM;
  if (stateCode === "AL") return "\n\n" + ALABAMA_ADDENDUM;
  if (stateCode === "OK") return "\n\n" + OKLAHOMA_ADDENDUM;
  if (stateCode === "AR") return "\n\n" + ARKANSAS_ADDENDUM;
  if (stateCode === "MS") return "\n\n" + MISSISSIPPI_ADDENDUM;
  if (stateCode === "IA") return "\n\n" + IOWA_ADDENDUM;
  const name = getStateName(stateCode);
  return "\n\n" + genericStateAddendum(name);
}
