"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

export default function CheckoutPage() {
  const { items, total, clear, hydrated } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "qr">("cod");

  if (!hydrated) {
    return <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10" />;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 pt-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nothing to check out
        </h1>
        <Link
          href="/products"
          className="mt-6 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Shop products
        </Link>
      </main>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const form = {
      customer_name: formData.get("customer_name") as string,
      phone: formData.get("phone") as string,
      address: (formData.get("address") as string) ?? "",
      delivery_method: deliveryMethod,
      payment_method: paymentMethod,
    };

    startTransition(async () => {
      const result = await placeOrder(form, items);
      if (result.ok && result.orderId) {
        clear();
        router.push(`/order-confirmed/${result.orderId}`);
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-accent";

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>

      {/* Order summary */}
      <div className="mt-8 rounded-2xl bg-surface p-4">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-bg">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[8px] font-semibold tracking-widest text-muted">
                    iMart
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.name}</p>
                <p className="text-xs text-muted">× {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <p className="text-sm text-muted">Total</p>
          <p className="text-lg font-semibold">{formatPrice(total)}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-5 pb-16">
        <div>
          <label htmlFor="customer_name" className="mb-1.5 block text-sm">
            Full name
          </label>
          <input
            id="customer_name"
            name="customer_name"
            required
            minLength={2}
            placeholder="Your name"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm">
            Mobile number
          </label>
          <input
            id="phone"
            name="phone"
            required
            type="tel"
            inputMode="numeric"
            pattern="9[78][0-9]{8}"
            placeholder="98XXXXXXXX"
            className={inputClass}
          />
        </div>

        {/* Delivery method */}
        <div>
          <p className="mb-1.5 text-sm">Delivery</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                deliveryMethod === "delivery"
                  ? "border-accent bg-surface"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              <span className="font-semibold">Home delivery</span>
              <br />
              <span className="text-xs text-muted">Within Butwal</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("pickup")}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                deliveryMethod === "pickup"
                  ? "border-accent bg-surface"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              <span className="font-semibold">Store pickup</span>
              <br />
              <span className="text-xs text-muted">Amarpath, Butwal</span>
            </button>
          </div>
        </div>

        {deliveryMethod === "delivery" && (
          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm">
              Delivery address
            </label>
            <input
              id="address"
              name="address"
              required
              placeholder="Tole, landmark, ward…"
              className={inputClass}
            />
          </div>
        )}

        {/* Payment method */}
        <div>
          <p className="mb-1.5 text-sm">Payment</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cod")}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                paymentMethod === "cod"
                  ? "border-accent bg-surface"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              <span className="font-semibold">Cash</span>
              <br />
              <span className="text-xs text-muted">
                Pay on {deliveryMethod === "pickup" ? "pickup" : "delivery"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("qr")}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                paymentMethod === "qr"
                  ? "border-accent bg-surface"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              <span className="font-semibold">QR / eSewa</span>
              <br />
              <span className="text-xs text-muted">Scan after ordering</span>
            </button>
          </div>
        </div>

        {paymentMethod === "qr" && (
          <p className="rounded-xl bg-surface px-4 py-3 text-xs leading-relaxed text-muted">
            After placing the order you&apos;ll see our payment QR. Send the
            payment screenshot on WhatsApp to confirm.
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Placing order…" : `Place order — ${formatPrice(total)}`}
        </button>
      </form>
    </main>
  );
}
