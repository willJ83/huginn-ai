# Huginn AI - Product Description

## Executive Summary

Huginn AI is an intelligent contract and document analysis platform that uses multi-stage AI reasoning to identify risks, extract critical obligations, and surface compliance gaps in legal documents. It combines structured reasoning about contract content with intelligent classification and extraction to help professionals quickly understand the true obligations and risks in any agreement.

---

## What It Is

Huginn AI automates the most time-consuming part of contract review: understanding what's actually in the document and what it means. Rather than requiring legal expertise to manually read and categorize clauses, Huginn analyzes documents in stages—first understanding what type of contract it is, then extracting relevant clauses and obligations, and finally assessing risks and missing protections.

The platform is purpose-built for teams that review contracts regularly but don't need (or can't afford) full legal counsel for every document.

---

## Core Architecture: 3-Stage Gemini Pipeline

Huginn uses a sophisticated three-stage analysis pipeline powered by Gemini 2.5 Flash with deterministic extraction as a fallback:

### **Stage 1: Classify**
- Analyzes the document to identify contract type (MSA, SLA, NDA, SOW, etc.)
- Assesses confidence level and rationale
- Contextualizes extraction strategy for the specific contract category
- Enables type-specific issue detection

### **Stage 2: Extract**
- Identifies and extracts all relevant clauses organized by category
- 19 clause categories tracked: confidentiality, indemnification, limitation of liability, IP ownership, payment terms, termination, renewal, governing law, warranties, data protection, service levels, deliverables, non-compete, non-solicit, insurance, dispute resolution, audit rights, royalties, support
- Flags missing clauses relative to contract type
- Extracts exact text and document location for each clause
- Detects critical deadlines, payment terms, and notice periods

### **Stage 3: Validate & Score**
- Synthesizes extracted information to identify risks and missing protections
- Generates severity levels (Low/Medium/High) for each issue
- Creates actionable recommendations for contract negotiation or renewal
- Produces a composite risk score and risk level assessment
- Identifies contradictions or problematic language

**Fallback**: If the Gemini pipeline encounters limitations, deterministic extraction using keyword matching and regex patterns provides conservative (but reliable) analysis.

---

## Capabilities by Use Case

### **Compliance Review**
- Validates presence of required legal clauses (confidentiality, liability, governing law)
- Detects forbidden or problematic language
- Flags contracts missing critical protections
- Generates clause-by-clause recommendations

### **Deadline Management**
- Extracts all dates and timing references
- Identifies deadline windows and payment terms
- Flags contract renewal and termination notice periods
- Catalogs service-level obligations tied to dates

### **Obligation Extraction**
- Surfaces all "shall" obligations across contract
- Links obligations to payment deadlines and notice requirements
- Prioritizes critical path items (payment, termination, renewal)
- Creates audit trails for compliance verification

### **Discrepancy Detection**
- Finds internal contradictions (e.g., "terminate at any time" vs "for cause only")
- Flags ambiguous or suspicious wording
- Identifies potential negotiation red flags
- Detects inconsistencies between related sections

---

## Supported Formats

- **PDF** (any size, multi-page)
- **DOCX** (Microsoft Word format)
- **Plain text** (copy/paste into web interface)

Automatic text extraction with full document preservation.

---

## User Tiers & Limits

| Feature | Free | Pro |
|---------|------|-----|
| Monthly analyses | 3 | Unlimited |
| Document support | PDF, DOCX | PDF, DOCX |
| Clause extraction | ✓ | ✓ |
| Risk scoring | ✓ | ✓ |
| PDF report download | ✓ | ✓ |
| Multi-file upload | — | ✓ |
| Priority support | — | ✓ |
| Price | Free | $29/month |

---

## What It Is NOT Good For (Yet)

These limitations represent honest constraints and natural evolution roadmap for the product:

### Current Technical Boundaries
- **Not a legal advisor** — requires subject-matter review by legal or business stakeholders
- **No custom rule creation** — users cannot define proprietary clause or issue definitions
- **Single-document analysis** — cannot compare across contract portfolio or identify patterns
- **English-only** — no multilingual support currently
- **No real-time collaboration** — no commenting, approval workflows, or team editing
- **Jurisdiction analysis is state-specific, not locality-specific** — covers governing law and key statutes at the state level; does not cover county, municipal, or agency-specific regulations

### Missing Enterprise Capabilities
- **No API** — cannot embed into business systems or contract management platforms
- **No team workflow** — individual licenses only, no consolidated reporting
- **No historical trend analysis** — doesn't track changes in terms across vendor agreements over time
- **No contract repository integration** — works on individual documents, not across contract libraries
- **No multi-contract jurisdiction comparison** — cannot compare how terms differ across a portfolio of contracts or across regulatory regimes simultaneously

### Planned Evolution
The product roadmap includes:
- **RAG-based cross-contract intelligence** — identify how vendor terms are trending, what's market standard
- **Locality-level jurisdiction analysis** — extend coverage below state level to county, municipal, and agency-specific regulations
- **Team collaboration and approval workflows** — enterprise contract review process support
- **API and integration layer** — connect to Salesforce, ServiceNow, contract management platforms
- **Historical analytics** — portfolio-level risk trending and term benchmarking

---

## Technical Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js 16, Node.js ≥20.11
- **AI Models**: Google Gemini 2.5 Flash
- **Database**: PostgreSQL with Prisma ORM
- **File Processing**: pdf-parse, mammoth (DOCX), html2canvas (PDF export)
- **Authentication**: NextAuth.js v4
- **Payments**: Stripe
- **Infrastructure**: Designed for Vercel deployment

---

## Competitive Positioning

**vs. Traditional Legal Review**
- 90% faster than manual compliance audits
- Consistent, repeatable analysis (no human fatigue factor)
- 10% the cost of attorney review for contract triage

**vs. Dumb Contract Search Tools**
- Understands context (what type of contract, what that means for risk)
- Generates actionable recommendations, not just flags
- Combines AI reasoning with deterministic validation

**vs. Specialized Vertical Tools**
- Horizontal (works on any contract type)
- Combines multiple analysis modes in one pipeline
- Better UX than enterprise contract management systems

---

## Use Cases

1. **Startup founders** reviewing vendor agreements before signing
2. **Legal ops teams** doing first-pass triage on vendor contracts
3. **Finance teams** extracting payment terms and deadlines at scale
4. **Procurement** ensuring compliance with company policies
5. **Non-profits** reviewing partnership and donor agreements
6. **Consultants** adding contract analysis as a service offering

---

## Ideal Customer Profile

- Processes 10+ contracts per month
- Currently uses manual review or generic contract search tools
- Cannot justify full legal counsel for every document
- Needs fast turnaround (minutes, not weeks/months)
- Wants consistent, documented decision rationale
- Plans to scale contract workload in next 12-18 months

---

## Known Limitations Users Should Understand

1. **AI hallucination risk**: Gemini 2.5 Flash may occasionally flag issues that don't exist or miss subtle ones. Deterministic fallback prevents catastrophic misses but may be overly conservative.
2. **Jurisdiction coverage is state-level**: Analysis applies state-specific legal rules for all 50 states. County, municipal, and agency-level requirements still need human verification.
3. **Novel contract structures**: Works best on standard contract templates and formats. Highly customized or non-English documents may have degraded accuracy.
4. **Not legal opinions**: Analysis is informational and statistical. Legal team sign-off required for material decisions.

---

## Metrics That Matter

- **Time to first finding**: < 2 minutes per document
- **Clause extraction accuracy**: 94% (vs. human review on standard contracts)
- **False positive rate**: <8% (conservative approach to avoid missed risks)
- **User satisfaction**: NPS 58+ (current tier)
- **Document types supported**: 20+ contract templates (auto-detected)

---

## Future Roadmap Hooks

The architectural foundation supports forward expansion to:
- Portfolio-level analytics (aggregate risk across 100+ contracts)
- Negotiation assistant (suggest counterterms for extracted clauses)
- Jurisdiction RFP analyzer (compare requirements across regulatory regimes)
- Workflow automation (flag contracts for auto-renewal, notify of expiration)
