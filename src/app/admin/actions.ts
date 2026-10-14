"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { productSchema, supplierSchema, brandSchema } from "@/lib/validation";
import { randomUUID } from "crypto";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateOrderStatus(
  orderId: string,
  status: "new" | "confirmed" | "delivered" | "cancelled"
) {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: !error, error: error?.message };
}

interface SaveResult {
  ok: boolean;
  error?: string;
}

export async function saveProduct(
  productId: string | null,
  formData: FormData
): Promise<SaveResult> {
  await requireUser();
  const service = await createServiceClient();

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    description: formData.get("description") ?? "",
    category_id: formData.get("category_id") ?? "",
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    brand_id: formData.get("brand_id") ?? "",
    model: formData.get("model") ?? "",
    color: formData.get("color") ?? "",
    storage: formData.get("storage") ?? "",
    ram: formData.get("ram") ?? "",
    sku: formData.get("sku") ?? "",
    barcode: formData.get("barcode") ?? "",
    purchase_price: formData.get("purchase_price") || 0,
    min_stock: formData.get("min_stock") || 2,
    supplier_id: formData.get("supplier_id") ?? "",
    warranty_months: formData.get("warranty_months") || 0,
    imei_tracked: formData.get("imei_tracked") === "on",
    variant_of: formData.get("variant_of") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid product data",
    };
  }

  let productGroupId: string | null = null;
  if (parsed.data.variant_of) {
    const { data: target } = await service
      .from("products")
      .select("id, product_group_id")
      .eq("id", parsed.data.variant_of)
      .single();

    if (target) {
      productGroupId = target.product_group_id ?? randomUUID();
      if (!target.product_group_id) {
        await service
          .from("products")
          .update({ product_group_id: productGroupId })
          .eq("id", target.id);
      }
    }
  }

  let images: string[] = [];
  try {
    images = JSON.parse((formData.get("kept_images") as string) || "[]");
  } catch {
    images = [];
  }

  const files = formData
    .getAll("new_images")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: `${file.name} is over 5 MB` };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${parsed.data.slug}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const { error: uploadError } = await service.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    const { data } = service.storage.from("product-images").getPublicUrl(path);
    images.push(data.publicUrl);
  }

  const row = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    price: parsed.data.price,
    stock: parsed.data.stock,
    description: parsed.data.description,
    category_id: parsed.data.category_id || null,
    featured: parsed.data.featured,
    active: parsed.data.active,
    images,
    brand_id: parsed.data.brand_id || null,
    model: parsed.data.model,
    color: parsed.data.color,
    storage: parsed.data.storage,
    ram: parsed.data.ram,
    sku: parsed.data.sku || null,
    barcode: parsed.data.barcode || null,
    purchase_price: parsed.data.purchase_price,
    min_stock: parsed.data.min_stock,
    supplier_id: parsed.data.supplier_id || null,
    warranty_months: parsed.data.warranty_months,
    imei_tracked: parsed.data.imei_tracked,
    ...(productGroupId ? { product_group_id: productGroupId } : {}),
  };

  const { error } = productId
    ? await service.from("products").update(row).eq("id", productId)
    : await service.from("products").insert(row);

  if (error) {
    if (error.code === "23505") {
      const field = error.message.includes("sku")
        ? "SKU"
        : error.message.includes("barcode")
          ? "Barcode"
          : "Slug";
      return { ok: false, error: `That ${field} is already in use` };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function adjustProductStock(
  productId: string,
  quantityChange: number,
  note: string
): Promise<SaveResult> {
  const supabase = await requireUser();

  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: productId,
    p_quantity_change: quantityChange,
    p_note: note,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  return { ok: true };
}

export async function saveSupplier(
  supplierId: string | null,
  formData: FormData
): Promise<SaveResult> {
  const supabase = await requireUser();

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") ?? "",
    contact_person: formData.get("contact_person") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    pan_vat: formData.get("pan_vat") ?? "",
    bank_details: formData.get("bank_details") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid supplier data",
    };
  }

  const { error } = supplierId
    ? await supabase.from("suppliers").update(parsed.data).eq("id", supplierId)
    : await supabase.from("suppliers").insert(parsed.data);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/suppliers");
  return { ok: true };
}

export async function saveBrand(
  brandId: string | null,
  formData: FormData
): Promise<SaveResult> {
  const supabase = await requireUser();

  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid brand data",
    };
  }

  const { error } = brandId
    ? await supabase.from("brands").update(parsed.data).eq("id", brandId)
    : await supabase.from("brands").insert(parsed.data);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That slug is already in use" };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteBrand(brandId: string): Promise<SaveResult> {
  const supabase = await requireUser();

  const { error } = await supabase.from("brands").delete().eq("id", brandId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  return { ok: true };
}

export async function deleteSupplier(supplierId: string): Promise<SaveResult> {
  const supabase = await requireUser();

  const { error } = await supabase.from("suppliers").delete().eq("id", supplierId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/suppliers");
  return { ok: true };
}

export async function deleteProduct(productId: string): Promise<SaveResult> {
  await requireUser();
  const service = await createServiceClient();

  const { error } = await service.from("products").delete().eq("id", productId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}
