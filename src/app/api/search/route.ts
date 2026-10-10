import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const term = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  if (term.length < 2) return Response.json({ products: [] });
  const supabase = await createClient();
  const { data, error } = await supabase.from("products")
    .select("id, name, slug, price, images").eq("active", true)
    .ilike("name", `%${term.replace(/[%_\\]/g, "\\$&")}%`).order("name").limit(6);
  if (error) return Response.json({ error: "Search is unavailable. Try the full catalogue." }, { status: 503 });
  return Response.json({ products: data ?? [] });
}
