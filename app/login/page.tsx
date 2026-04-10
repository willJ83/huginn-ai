import Link from "next/link";
import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; next?: string }>;
}) {
  const params = await searchParams;
  const accountCreated = params.created === "1";
  const next = params.next ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900 dark:shadow-slate-950/50">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Welcome back</h1>
        <div className="mt-6">
          <LoginClient accountCreated={accountCreated} next={next} />
        </div>
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
