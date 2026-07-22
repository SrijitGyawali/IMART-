"use server";

import { createClient } from "@/lib/supabase/server";
import { checkoutSchema } from "@/lib/validation";
import type { CartItem } from "@/lib/types";

interface PlaceOrderResult {
  ok: boolean;
  orderId?: string;
  error?: string;
}

export async function placeOrder(
  form: unknown,
  items: CartItem[]
): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(form);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }
  if (!items.length) {
    return { ok: false, error: "Your cart is empty" };
  }

  const supabase = await createClient();

  // Re-price items server-side — never trust client prices
  const ids = items.map((i) => i.productId);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price, stock, active")
    .in("id", ids);

  if (productsError || !products) {
    return { ok: false, error: "Could not verify products. Try again." };
  }

  const verifiedItems = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || !product.active) {
      return { ok: false, error: `${item.name} is no longer available` };
    }
    if (product.stock < item.quantity) {
      return {
        ok: false,
        error: `${product.name}: only ${product.stock} in stock`,
      };
    }
    verifiedItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      price: product.price,
    });
  }

  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_customer_name: parsed.data.customer_name,
    p_phone: parsed.data.phone,
    p_address: parsed.data.address ?? "",
    p_delivery_method: parsed.data.delivery_method,
    p_payment_method: parsed.data.payment_method,
    p_items: verifiedItems,
  });

  if (error || !orderId) {
    return { ok: false, error: "Could not place order. Please try again." };
  }

  return { ok: true, orderId };
}
