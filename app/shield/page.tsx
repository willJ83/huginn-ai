import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canUseFeature } from "@/lib/billing";
import AppHeader from "@/app/components/AppHeader";
import ShieldScanner from "./ShieldScanner";

export const metadata = {
  title: "Huginn Shield — Contract Scanner",
  description: "Scan contracts from your phone before you sign. Powered by Huginn AI.",
};

export default async function ShieldPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/shield");

  const usage = await canUseFeature(session.user.id, "huginn_analysis");

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full">
        {/* Shield branding */}
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden="true">🛡️</span>
            <h1 className="text-3xl font-bold text-white tracking-tight">Huginn Shield</h1>
          </div>
          <p className="text-slate-300 text-base mt-1">
            Know what you&apos;re signing — before you sign it.
          </p>

          <div className="mt-4 w-full rounded-xl bg-slate-800 px-5 py-4 text-left">
            <p className="text-slate-300 text-sm mb-3">
              Huginn Shield goes beyond basic risk scoring to analyze:
            </p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">🏛️</span>
                <span><span className="text-white font-medium">Jurisdiction &amp; Governing Law</span> — flags contracts that force you into out-of-state courts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">📋</span>
                {/* Florida §559.9613 checklist only runs when FL is selected */}
                <span><span className="text-white font-medium">50-State Jurisdiction Coverage</span> — analyzes governing law clauses across all 50 states; checks F.S. §559.9613 disclosures when Florida is selected. More states added over time.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">💬</span>
                <span><span className="text-white font-medium">Plain-English Warnings</span> — tells you exactly what to negotiate or walk away from</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Clean high-contrast Deep Scan Pro box for dark Shield page */}
        <div className="mt-6 w-full rounded-2xl border border-blue-400 bg-slate-800 p-5 text-left">
          <div className="flex items-center gap-2 font-semibold text-blue-400">
            INCLUDES HUGINN SHIELD DEEP SCAN
          </div>
          <p className="mt-3 text-slate-200 text-[15px] leading-relaxed">
            Deep Scan delivers advanced jurisdiction and governing-law analysis across all 50 states.
            When Florida is selected, it also automatically checks required disclosures under F.S. §559.9613.
          </p>
          <p className="mt-4 text-xs text-blue-400 font-medium">
            Free and Starter users get 2 free Deep Scans as a trial.
          </p>
        </div>

        <ShieldScanner usageInfo={usage} />
      </main>
    </div>
  );
}
