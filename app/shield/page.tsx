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
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">🛡️</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Huginn Shield</h1>
          </div>
          <p className="text-slate-400 text-sm text-center">
            Scan contracts from your phone — know what you&apos;re signing.
          </p>
        </div>

        <ShieldScanner usageInfo={usage} />
      </main>
    </div>
  );
}
