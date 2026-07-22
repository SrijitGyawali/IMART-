"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    if (error) {
      setError("Wrong email or password");
      setPending(false);
      return;
    }

    router.push("/admin/orders");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-accent";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          iMart <span className="font-normal text-muted">admin</span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            autoComplete="email"
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            autoComplete="current-password"
            className={inputClass}
          />

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
