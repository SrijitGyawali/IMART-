"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  customerQuickSchema,
  returnInputSchema,
  saleInputSchema,
  type SaleInput,
} from "@/lib/validation";
import type { Customer } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createSale(
  input: SaleInput
): Promise<ActionResult & { saleId?: string }> {
  const supabase = await requireUser();

  const parsed = saleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid sale data" };
  }

  // Defense-in-depth: re-check stock before hitting the DB trigger, so
  // a cashier gets a clear message instead of a raw Postgres error.
  const productIds = [...new Set(parsed.data.items.map((i) => i.productId))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, stock, active")
    .in("id", productIds);

  if (productsError || !products) {
    return { ok: false, error: "Could not verify products. Try again." };
  }

  const requestedByProduct = new Map<string, number>();
  for (const item of parsed.data.items) {
    requestedByProduct.set(
      item.productId,
      (requestedByProduct.get(item.productId) ?? 0) + item.quantity
    );
  }

  for (const product of products) {
    if (!product.active) {
      return { ok: false, error: `${product.name} is no longer available` };
    }
    const requested = requestedByProduct.get(product.id) ?? 0;
    if (product.stock < requested) {
      return { ok: false, error: `${product.name}: only ${product.stock} in stock` };
    }
  }

  const { data: saleId, error } = await supabase.rpc("create_sale", {
    p_customer_id: parsed.data.customerId,
    p_is_walk_in: parsed.data.isWalkIn,
    p_discount_type: parsed.data.discountType,
    p_discount_value: parsed.data.discountValue,
    p_tax_rate: parsed.data.taxRate,
    p_payment_method: parsed.data.paymentMethod,
    p_amount_paid: parsed.data.amountPaid,
    p_notes: parsed.data.notes,
    p_items: parsed.data.items.map((i) => ({
      product_id: i.productId,
      product_name: i.productName,
      imei: i.imei,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    })),
  });

  if (error || !saleId) {
    return { ok: false, error: error?.message ?? "Could not create sale" };
  }

  revalidatePath("/admin/sales");
  revalidatePath("/admin/products");
  return { ok: true, saleId };
}

export async function createCustomerQuick(
  formData: FormData
): Promise<ActionResult & { customer?: Customer }> {
  const supabase = await requireUser();

  const parsed = customerQuickSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid customer data" };
  }

  const { data, error } = await supabase
    .from("customers")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create customer" };
  }

  return { ok: true, customer: data };
}

export async function createReturn(formData: FormData): Promise<ActionResult> {
  const supabase = await requireUser();

  const parsed = returnInputSchema.safeParse({
    saleItemId: formData.get("sale_item_id"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") ?? "",
    refundAmount: formData.get("refund_amount"),
    restock: formData.get("restock") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid return data" };
  }

  const { data: item } = await supabase
    .from("sale_items")
    .select("sale_id, quantity, returned")
    .eq("id", parsed.data.saleItemId)
    .single();

  if (!item) return { ok: false, error: "Sale item not found" };
  if (item.returned) return { ok: false, error: "This item was already returned" };
  if (parsed.data.quantity > item.quantity) {
    return { ok: false, error: `Cannot return more than ${item.quantity}` };
  }

  const { error } = await supabase.from("sale_returns").insert({
    sale_id: item.sale_id,
    sale_item_id: parsed.data.saleItemId,
    quantity: parsed.data.quantity,
    reason: parsed.data.reason,
    refund_amount: parsed.data.refundAmount,
    restock: parsed.data.restock,
  });

  if (error) return { ok: false, error: error.message };

  await supabase
    .from("sales")
    .update({ status: "partially_refunded" })
    .eq("id", item.sale_id);

  revalidatePath(`/admin/sales/${item.sale_id}`);
  revalidatePath("/admin/sales");
  revalidatePath("/admin/products");
  return { ok: true };
}
