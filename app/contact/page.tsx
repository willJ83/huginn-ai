export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm md:p-12">
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="mt-4 text-slate-700">
          Need help with your account or a document analysis issue? Reach us at:
        </p>

        <a
          href="mailto:support@odenseyecreative.com"
          className="mt-6 inline-block text-lg font-semibold text-blue-600 hover:text-blue-700"
        >
          support@odenseyecreative.com
        </a>
      </div>
    </main>
  );
}
