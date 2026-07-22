"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/(store)/newsletter-actions";

export function NewsletterForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (new FormData(form).get("email") as string) ?? "";

    startTransition(async () => {
      const result = await subscribeNewsletter(email);
      if (result.ok) {
        setStatus("done");
        setMessage("You're in! We'll only message you about real deals.");
        form.reset();
      } else {
        setStatus("error");
        setMessage(result.error ?? "Something went wrong");
      }
    });
  }

  if (status === "done") {
    return <p className="text-sm text-green-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="Your email"
        aria-label="Email for newsletter"
        className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="w-full text-xs text-red-600">{message}</p>
      )}
    </form>
  );
}
