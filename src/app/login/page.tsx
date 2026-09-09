"use client";

import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return <Suspense fallback={<main style={{ minHeight: "100vh" }} />}><LoginForm /></Suspense>;
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

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f4f5f1", color: "#1e2924", fontFamily: "Arial, sans-serif" }}><form onSubmit={submit} style={{ width: "min(100%, 390px)", padding: 32, background: "#fffdf8", border: "1px solid #d5ddcf", borderRadius: 18, boxShadow: "8px 8px 0 #1e2924" }}><h1 style={{ marginTop: 0, fontFamily: "Georgia, serif" }}>Kindred</h1><p>Platform Admin sign in</p><label style={{ display: "grid", gap: 6, marginTop: 20 }}>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label style={{ display: "grid", gap: 6, marginTop: 14 }}>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p role="alert" style={{ color: "#b42318" }}>{error}</p>}<button type="submit" disabled={loading} style={{ width: "100%", marginTop: 22, padding: "12px 16px", border: 0, borderRadius: 8, background: "#1e2924", color: "#fffdf8", cursor: "pointer" }}>{loading ? "Signing in..." : "Sign in"}</button></form></main>;
}