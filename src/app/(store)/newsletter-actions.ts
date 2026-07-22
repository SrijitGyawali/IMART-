"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().email();

export async function subscribeNewsletter(
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = emailSchema.safeParse(email.trim().toLowerCase());
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: parsed.data });

  if (error) {
    // Already subscribed — treat as success
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: "Could not subscribe right now. Try again." };
  }

  return { ok: true };
}
