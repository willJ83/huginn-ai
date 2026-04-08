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
                <span><span className="text-white font-medium">Florida-Specific Protections</span> — automatically checks for required disclosures under F.S. §559.9613</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">💬</span>
                <span><span className="text-white font-medium">Plain-English Warnings</span> — tells you exactly what to negotiate or walk away from</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              Deep Scan included with Pro ($29.99/mo). Free and Starter users get 2 free Deep Scans as a trial.
            </p>
          </div>
        </div>

        <ShieldScanner usageInfo={usage} />
      </main>
    </div>
  );
}
