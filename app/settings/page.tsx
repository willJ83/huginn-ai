import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AppHeader from "@/app/components/AppHeader";
import ChangePasswordForm from "./ChangePasswordForm";

export const metadata = {
  title: "Account Settings — Huginn AI",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 sm:py-16">
      <AppHeader />
      <div className="mx-auto max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
            Account Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.user.email}</p>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Change Password</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Changing your password will immediately sign out all other devices and browsers.
            You will stay logged in on this device.
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </main>
  );
}
