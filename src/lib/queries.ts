import { createClient } from "@/lib/supabase/server";
import type { Brand, Category, Customer, Product, Sale, SaleItem, Supplier } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return data ?? [];
}

export async function getBrands(): Promise<Brand[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data ?? [];
}

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").order("name");
  return data ?? [];
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

export async function getProducts(categorySlug?: string): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, categories!inner(slug)")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (categorySlug) {
    query = query.eq("categories.slug", categorySlug);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return data;
}

// ---------- Admin: POS / Sales ----------

export async function getPosProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name");
  return data ?? [];
}

export async function getCustomerList(): Promise<Customer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("*")
    .order("name")
    .limit(500);
  return data ?? [];
}

export interface SaleFilters {
  status?: string;
  paymentMethod?: string;
  from?: string; // ISO date
  to?: string; // ISO date
}

export async function getSales(filters: SaleFilters = {}): Promise<Sale[]> {
  const supabase = await createClient();
  let query = supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(200);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.paymentMethod) query = query.eq("payment_method", filters.paymentMethod);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);

  const { data } = await query;
  return data ?? [];
}

export async function getSaleWithItems(
  id: string
): Promise<{ sale: Sale; items: SaleItem[] } | null> {
  const supabase = await createClient();
  const { data: sale } = await supabase.from("sales").select("*").eq("id", id).single();
  if (!sale) return null;

  const { data: items } = await supabase
    .from("sale_items")
    .select("*")
    .eq("sale_id", id)
    .order("id");

  return { sale, items: items ?? [] };
}

export interface SalesSummary {
  todayTotal: number;
  todayCount: number;
  monthTotal: number;
  monthProfit: number;
  monthCount: number;
}

export async function getSalesSummary(): Promise<SalesSummary> {
  const supabase = await createClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ data: todaySales }, { data: monthSales }, { data: monthItems }] = await Promise.all([
    supabase.from("sales").select("total").eq("status", "completed").gte("created_at", startOfToday),
    supabase.from("sales").select("total").eq("status", "completed").gte("created_at", startOfMonth),
    supabase
      .from("sale_items")
      .select("quantity, unit_price, cost_price, sales!inner(created_at, status)")
      .gte("sales.created_at", startOfMonth)
      .eq("sales.status", "completed"),
  ]);

  const todayTotal = (todaySales ?? []).reduce((sum, s) => sum + s.total, 0);
  const monthTotal = (monthSales ?? []).reduce((sum, s) => sum + s.total, 0);
  const monthProfit = (monthItems ?? []).reduce(
    (sum, i) => sum + (i.unit_price - i.cost_price) * i.quantity,
    0
  );

  return {
    todayTotal,
    todayCount: todaySales?.length ?? 0,
    monthTotal,
    monthProfit,
    monthCount: monthSales?.length ?? 0,
  };
}
