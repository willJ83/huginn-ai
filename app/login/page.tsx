import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  const accountCreated = params.created === "1";

  return <LoginClient accountCreated={accountCreated} />;
}
