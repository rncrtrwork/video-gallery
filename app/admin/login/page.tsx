import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loginAction } from "./actions";

export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  if (await getSession()) redirect("/admin");
  const { error, next } = await searchParams;
  return (
    <main className="login-page">
      <form className="login-card" action={loginAction}>
        {next === "/user" && <input type="hidden" name="next" value="/user" />}
        <span className="brand">FRAME<span>VAULT</span></span>
        <div className="eyebrow">Private administration</div>
        <h1>Welcome back.</h1>
        <p className="subtle">Sign in to manage videos and homepage content.</p>
        {error && <div className="flash-error" role="alert">{error === "rate" ? "Too many sign-in attempts. Wait 15 minutes and try again." : "The email or password is incorrect."}</div>}
        <div className="form-group"><label htmlFor="email">Email</label><input className="form-control" id="email" name="email" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required /></div>
        <div className="form-group"><label htmlFor="password">Password</label><input className="form-control" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div>
        <button className="btn" type="submit">Sign in</button>
      </form>
    </main>
  );
}
