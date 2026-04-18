export type DemoContractId = "demo1" | "demo2";

export interface DemoContract {
  id: DemoContractId;
  name: string;
  state: string;
  stateCode: string;
  fileName: string;
  description: string;
  text: string;
}

export const DEMO_CONTRACT_1: DemoContract = {
  id: "demo1",
  name: "California Independent Contractor Agreement",
  state: "California",
  stateCode: "CA",
  fileName: "ca-independent-contractor-agreement.txt",
  description: "Software development contract with a California-based contractor. Contains non-compete, broad IP assignment, and out-of-state arbitration.",
  text: `INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement ("Agreement") is entered into between Apex Software Inc., a Delaware corporation with its principal place of business in San Jose, California ("Company"), and the undersigned independent contractor ("Contractor") as of April 1, 2026.

1. Services
Contractor agrees to provide software engineering and development services as directed by Company, including designing, building, testing, and maintaining software applications. The scope of work, deadlines, and specific deliverables shall be communicated by Company via written task assignments, and may be modified by Company at any time upon written notice. Contractor shall use commercially reasonable efforts to meet all stated deadlines.

2. Compensation and Payment
Company shall pay Contractor a rate of $85 per hour for all hours worked and pre-approved by Company. Invoices shall be submitted by Contractor no more frequently than monthly. Company shall pay each invoice within sixty (60) calendar days of the invoice date ("Net-60"). No interest or late fees shall accrue on any invoice regardless of delay. Company reserves the right to dispute any line item on an invoice, which shall restart the payment clock upon written resolution of the dispute. No payment shall be due for work that does not meet Company's acceptance criteria, as determined by Company in its sole discretion.

3. Intellectual Property — Work for Hire and Assignment
(a) All work product, software code, designs, documentation, concepts, inventions, and other creative output produced by Contractor under this Agreement shall be considered "works made for hire" and shall be the sole and exclusive property of Company from the moment of creation.
(b) To the extent any work product does not qualify as work made for hire, Contractor hereby irrevocably assigns to Company all right, title, and interest in and to such work product, including all intellectual property rights therein.
(c) This assignment extends to and includes all software libraries, frameworks, development tools, methodologies, and code templates that Contractor employs in the performance of services under this Agreement, whether developed before or during the term of this Agreement, to the extent they are incorporated into any deliverable.
(d) Contractor waives all moral rights in the work product to the fullest extent permitted by law.
(e) Contractor agrees to execute any additional documents necessary to effectuate Company's ownership of the work product.

4. Non-Competition
In consideration of access to Company's Confidential Information and the compensation paid under this Agreement, Contractor agrees that during the term of this Agreement and for a period of two (2) years following its termination or expiration for any reason:
(a) Contractor shall not, directly or indirectly, provide software development services, consulting, or employment to any company or individual that competes with Company's business in the development, marketing, or sale of enterprise software applications anywhere in the State of California or any state in which Company has customers;
(b) Contractor shall not solicit, induce, or hire any employee, contractor, or consultant of Company;
(c) Contractor shall not engage in any business activity that is competitive with, or adverse to, Company's business interests.
Contractor acknowledges that these restrictions are reasonable and necessary to protect Company's legitimate business interests.

5. Confidentiality
Contractor agrees to hold in strict confidence all non-public information concerning Company's business, products, customers, suppliers, technology, and operations ("Confidential Information"). Contractor shall use Confidential Information only to perform services under this Agreement. These obligations shall survive termination of this Agreement without limit in time. Contractor may not disclose Confidential Information even if compelled by court order, without first notifying Company and giving Company an opportunity to seek a protective order.

6. Indemnification
Contractor shall defend, indemnify, and hold harmless Company, its officers, directors, employees, and affiliates from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys' fees and court costs) arising out of or related to: (a) Contractor's performance of services under this Agreement; (b) any negligence, errors, omissions, or willful misconduct by Contractor; (c) any claim that Contractor's work product infringes any third-party intellectual property rights; or (d) any misclassification of Contractor as an independent contractor rather than an employee. There is no limit on the amount of Contractor's indemnification obligation.

7. Termination
Company may terminate this Agreement at any time, with or without cause, upon three (3) days' written notice to Contractor. Contractor may terminate this Agreement upon thirty (30) days' written notice to Company. Upon any termination by Company without cause, Contractor shall be entitled only to compensation for hours actually worked and accepted prior to the termination notice date. No kill fee or cancellation compensation is owed.

8. Dispute Resolution
This Agreement shall be governed by the laws of the State of California, without regard to its conflict-of-law principles. Any dispute, claim, or controversy arising out of or relating to this Agreement shall be submitted exclusively to binding arbitration administered by JAMS under its Commercial Arbitration Rules, with proceedings conducted in Wilmington, Delaware. Each party shall bear its own arbitration costs. The arbitrator may not award punitive or exemplary damages. Judgment on the arbitration award may be entered in any court of competent jurisdiction. Contractor waives any right to a jury trial.

9. Independent Contractor Status
Contractor is an independent contractor and not an employee, agent, partner, or joint venturer of Company. Company shall not withhold taxes or provide employee benefits. Contractor is solely responsible for all taxes on compensation received under this Agreement.

10. Entire Agreement
This Agreement constitutes the entire agreement between the parties regarding its subject matter and supersedes all prior discussions. Amendments must be in writing and signed by both parties.

CONTRACTOR SIGNATURE: _________________________ Date: ______________
COMPANY SIGNATURE: ___________________________ Date: ______________
`,
};

export const DEMO_CONTRACT_2: DemoContract = {
  id: "demo2",
  name: "Texas Commercial Services Agreement",
  state: "Texas",
  stateCode: "TX",
  fileName: "tx-commercial-services-agreement.txt",
  description: "Business services and consulting agreement governed by Texas law. Contains auto-renewal trap, broad indemnification, and a conditionally enforceable non-compete.",
  text: `COMMERCIAL SERVICES AGREEMENT

This Commercial Services Agreement ("Agreement") is entered into between Lone Star Ventures LLC, a Texas limited liability company ("Client"), and the undersigned service provider ("Provider") as of April 1, 2026.

1. Services
Provider agrees to furnish marketing strategy, business development, and consulting services as described in Schedule A attached hereto. Provider shall designate a primary contact person and shall perform all services in a professional manner consistent with industry standards. Client may provide reasonable direction on priorities and methods, but Provider retains discretion over the means and methods of performing services.

2. Compensation and Payment
Client shall pay Provider a monthly retainer of $8,500, due on the first business day of each month in advance. Invoices not paid within fifteen (15) calendar days of the due date shall accrue a late fee of two percent (2%) per month from the due date until paid in full, compounded monthly. If any invoice remains unpaid for more than thirty (30) days, Client shall pay all costs of collection, including reasonable attorneys' fees. Client shall also pay a $250 administrative fee for each returned or rejected payment.

3. Term and Automatic Renewal
This Agreement commences on April 1, 2026 and shall continue for a period of one (1) year. After the initial term, this Agreement shall automatically renew for successive one-year terms unless one party provides written notice of non-renewal to the other party at least sixty (60) days before the end of the then-current term. Notice of non-renewal must be sent via certified mail to the registered address of the other party; electronic notice shall not be sufficient. If Client fails to provide timely non-renewal notice, Client acknowledges that Client shall be bound for the full next term and no refund shall be issued.

4. Non-Competition and Non-Solicitation
(a) In consideration of access to Client's Confidential Information and trade secrets, Provider agrees that during the term of this Agreement and for a period of one (1) year following termination for any reason, Provider shall not, without Client's prior written consent, directly or indirectly provide substantially similar consulting or marketing services to any business that directly competes with Client's business anywhere in the State of Texas.
(b) Provider further agrees that for a period of two (2) years following termination, Provider shall not solicit or hire any of Client's employees, contractors, or customers who became known to Provider through Provider's work under this Agreement.
(c) Provider acknowledges that Client's business operates throughout the State of Texas and that the geographic scope of this restriction is reasonable.
(d) Provider acknowledges that a violation of this section would cause Client irreparable harm, and Client shall be entitled to injunctive relief in addition to any other available remedies.

5. Intellectual Property
All deliverables, reports, analyses, creative work, and other materials produced by Provider specifically for Client under this Agreement ("Deliverables") shall be the exclusive property of Client upon full payment of the applicable retainer. Provider retains all background intellectual property, proprietary tools, and pre-existing frameworks used to develop the Deliverables, but grants Client a perpetual, royalty-free license to use such background IP as incorporated in the Deliverables.

6. Indemnification
Provider shall defend, indemnify, and hold harmless Client, its members, managers, officers, employees, and successors from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising from or related to: (a) any act or omission of Provider in performing services under this Agreement; (b) any claim that Provider's Deliverables infringe any third-party intellectual property rights; (c) any failure by Provider to comply with applicable law; or (d) any claim by a third party arising from Provider's conduct during the term of this Agreement. Provider's indemnification obligation shall not be limited to the fees paid under this Agreement and shall have no maximum cap.

7. Confidentiality
Each party agrees to hold in confidence all non-public business information, technical data, and trade secrets disclosed by the other party that are designated confidential or that reasonably should be understood to be confidential. These obligations survive termination for a period of five (5) years. Provider's confidentiality obligations extend to all information regarding Client's customers, financial data, and strategic plans.

8. Personal Guarantee
If Provider is a business entity, the individual who signs this Agreement on behalf of Provider ("Guarantor") personally and unconditionally guarantees Provider's obligations under this Agreement, including all payment, indemnification, and restrictive covenant obligations. Guarantor acknowledges that Client may enforce this guarantee directly against Guarantor without first proceeding against Provider.

9. Limitation of Liability
CLIENT SHALL NOT BE LIABLE TO PROVIDER FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. CLIENT'S TOTAL LIABILITY TO PROVIDER UNDER THIS AGREEMENT SHALL NOT EXCEED THE FEES PAID IN THE ONE (1) MONTH IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. THERE IS NO CORRESPONDING LIMITATION ON PROVIDER'S LIABILITY TO CLIENT.

10. Governing Law and Dispute Resolution
This Agreement is governed by the laws of the State of Texas, without regard to its conflict-of-law principles. Any dispute arising under this Agreement shall be submitted to binding arbitration administered by the American Arbitration Association under its Commercial Rules, with proceedings conducted exclusively in Harris County (Houston), Texas. The prevailing party in any arbitration shall be entitled to recover its reasonable attorneys' fees and costs. Judgment on any arbitration award may be entered in any court of competent jurisdiction. Provider waives any right to a jury trial in any proceeding related to this Agreement.

11. Liquidated Damages for Early Termination
If Client terminates this Agreement for any reason other than Provider's material breach prior to the expiration of a term, Client shall pay Provider a termination fee equal to fifty percent (50%) of the remaining monthly retainer payments for the balance of the current term. The parties agree that this amount represents a reasonable estimate of damages and is not a penalty.

12. Amendment and Waiver
Client may amend the scope of services described in Schedule A at any time upon fifteen (15) days' written notice to Provider. Provider's continued performance following such notice shall constitute acceptance of the amended scope without additional compensation unless expressly agreed otherwise in writing.

13. Entire Agreement
This Agreement, together with Schedule A, constitutes the entire agreement between the parties and supersedes all prior discussions, representations, and agreements. Any amendment to this Agreement requires a written instrument signed by authorized representatives of both parties.

PROVIDER SIGNATURE: _________________________ Date: ______________
CLIENT SIGNATURE: ___________________________ Date: ______________
GUARANTOR SIGNATURE: _______________________ Date: ______________
`,
};

export const DEMO_CONTRACTS: Record<DemoContractId, DemoContract> = {
  demo1: DEMO_CONTRACT_1,
  demo2: DEMO_CONTRACT_2,
};
