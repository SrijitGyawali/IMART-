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

export interface ProductFilters {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  sort?: string;
  inStock?: boolean;
}

export async function getProducts(
  filtersOrCategorySlug?: string | ProductFilters
): Promise<Product[]> {
  const supabase = await createClient();
  const filters: ProductFilters =
    typeof filtersOrCategorySlug === "string"
      ? { categorySlug: filtersOrCategorySlug }
      : (filtersOrCategorySlug ?? {});

  // !inner is required for the dot-notation filter below to actually
  // constrain rows — but only request it for a relation we're filtering
  // on, otherwise products with no brand/category would be excluded
  // from every unfiltered listing.
  const categoryJoin = filters.categorySlug ? "categories!inner(slug)" : "";
  const brandJoin = filters.brandSlug ? "brands!inner(slug)" : "";
  const select = ["*", categoryJoin, brandJoin].filter(Boolean).join(", ");

  let query = supabase
    .from("products")
    .select(select)
    .eq("active", true);

  if (filters.sort === "price-low") query = query.order("price", { ascending: true });
  else if (filters.sort === "price-high") query = query.order("price", { ascending: false });
  else if (filters.sort === "name") query = query.order("name");
  else query = query.order("created_at", { ascending: false });
  if (filters.inStock) query = query.gt("stock", 0);

  if (filters.categorySlug) {
    query = query.eq("categories.slug", filters.categorySlug);
  }
  if (filters.brandSlug) {
    query = query.eq("brands.slug", filters.brandSlug);
  }
  if (filters.search) {
    const term = filters.search.trim().slice(0, 80);
    if (term) {
      // Quote the entire filter value so punctuation stays literal rather
      // than becoming PostgREST syntax. Escape ILIKE wildcard characters.
      const pattern = JSON.stringify(`%${term.replace(/[%_\\]/g, "\\$&")}%`);
      query = query.or(
        `name.ilike.${pattern},model.ilike.${pattern},description.ilike.${pattern}`
      );
    }
  }

  const { data } = await query;
  return (data ?? []) as unknown as Product[];
}

/** Sibling products sharing the same colour/storage variant group. */
export async function getProductGroupSiblings(
  groupId: string,
  excludeId?: string
): Promise<Product[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("product_group_id", groupId)
    .eq("active", true)
    .order("price");

  if (excludeId) query = query.neq("id", excludeId);

  const { data } = await query;
  return data ?? [];
}

/** Lightweight product list for the admin "link as variant" picker. */
export async function getAdminProductOptions(): Promise<
  Pick<Product, "id" | "name" | "color" | "storage">[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, color, storage")
    .order("name")
    .limit(500);
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
