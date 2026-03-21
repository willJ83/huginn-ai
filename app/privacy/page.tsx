export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: March 14, 2026</p>

        <div className="mt-10 space-y-8 leading-7 text-slate-700">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
            <p className="mt-3">
              Huginn AI is a product of Odens Eye Creative. This Privacy Policy explains
              how we collect, use, and protect information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Information We Collect</h2>
            <p className="mt-3">
              We may collect account information such as your name, email address, and
              billing-related details. We may also process documents and text that you
              upload for analysis through the Huginn AI platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">How We Use Information</h2>
            <p className="mt-3">
              We use information to provide our services, process uploads, generate
              contract analysis results, improve platform functionality, maintain security,
              and manage subscriptions and customer support.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Document Uploads</h2>
            <p className="mt-3">
              Documents uploaded to Huginn AI are used for analysis and report generation.
              You should avoid uploading highly sensitive information unless you are
              comfortable doing so and authorized to share it. We take reasonable steps to
              protect uploaded data, but no system can be guaranteed 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Payments</h2>
            <p className="mt-3">
              Payments and subscription processing may be handled by third-party providers
              such as Stripe. We do not store full payment card details on our servers.
              Payment information is handled according to the policies of the payment
              processor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Data Retention</h2>
            <p className="mt-3">
              We retain information only as long as necessary to operate the service,
              comply with legal obligations, resolve disputes, and enforce agreements. We
              may delete uploaded content and related analysis data after a reasonable
              retention period or upon account deletion, subject to operational and legal
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Security</h2>
            <p className="mt-3">
              We use reasonable administrative, technical, and organizational safeguards to
              protect your information. However, no internet-based service is completely
              secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Your Choices</h2>
            <p className="mt-3">
              You may choose not to provide certain information, but doing so may limit
              your ability to use some features of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Changes to This Policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. Continued use of the
              service after changes become effective constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy, please contact Odens Eye
              Creative through your business support email.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
