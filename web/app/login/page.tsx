import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  return (
    <div className="auth-wrap">
      <LoginForm error={searchParams.error} message={searchParams.message} />
    </div>
  );
}
