"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, LockKeyhole } from "lucide-react";

export default function LoginPage() {
  return <Suspense fallback={<main className="login-shell" />}><LoginForm /></Suspense>;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false, redirectTo: searchParams.get("callbackUrl") || "/admin" });
    setLoading(false);
    if (!result || result.error) {
      setError("Invalid platform administrator credentials.");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/admin");
    router.refresh();
  }

  return <main className="login-shell"><div className="login-frame"><div className="login-brand"><span className="brand-mark"><Heart size={15} fill="currentColor" /></span>kindred</div><form className="login-card" onSubmit={submit}><div className="login-icon"><LockKeyhole size={19} /></div><p className="login-kicker">Platform workspace</p><h1>Welcome back</h1><p className="login-copy">Sign in to manage your Kindred experience.</p><label className="login-field">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="login-field">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="login-error" role="alert">{error}</p>}<button className="primary-admin-button login-submit" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button></form></div></main>;
}