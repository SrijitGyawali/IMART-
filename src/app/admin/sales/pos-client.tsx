"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import type { Customer, PaymentMethod, Product } from "@/lib/types";
import { createCustomerQuick, createSale } from "./actions";

interface CartLine {
  productId: string;
  productName: string;
  imei: string;
  quantity: number;
  unitPrice: number;
  maxStock: number;
  imeiTracked: boolean;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "esewa", label: "eSewa" },
  { value: "khalti", label: "Khalti" },
];

export function PosClient({
  products,
  customers,
}: {
  products: Product[];
  customers: Customer[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const [customerList, setCustomerList] = useState(customers);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "">("");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [search, products]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return [];
    return customerList
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 6);
  }, [customerQuery, customerList]);

  const selectedCustomer = customerList.find((c) => c.id === customerId) ?? null;

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const discountAmount =
    discountType === "percentage"
      ? subtotal * (Math.min(Math.max(discountValue, 0), 100) / 100)
      : discountType === "fixed"
        ? Math.min(Math.max(discountValue, 0), subtotal)
        : 0;
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * (Math.max(taxRate, 0) / 100);
  const total = taxable + taxAmount;
  const changeDue = paymentMethod === "cash" && amountPaid > total ? amountPaid - total : 0;

  function addToCart(product: Product) {
    setSearch("");
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.maxStock) return prev;
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      if (product.stock === 0) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          imei: "",
          quantity: 1,
          unitPrice: product.price,
          maxStock: product.stock,
          imeiTracked: product.imei_tracked ?? false,
        },
      ];
    });
  }

  function updateLine(productId: string, patch: Partial<CartLine>) {
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l))
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  function handleAddCustomer(formData: FormData) {
    startTransition(async () => {
      const result = await createCustomerQuick(formData);
      if (result.ok && result.customer) {
        setCustomerList((prev) => [...prev, result.customer!]);
        setCustomerId(result.customer.id);
        setCustomerQuery("");
        setShowNewCustomer(false);
      } else {
        setError(result.error ?? "Could not add customer");
      }
    });
  }

  function handleCompleteSale() {
    setError(null);
    if (cart.length === 0) {
      setError("Add at least one item to the cart");
      return;
    }
    if (cart.some((l) => l.imeiTracked && !l.imei.trim())) {
      setError("Enter the IMEI for every IMEI-tracked item");
      return;
    }

    startTransition(async () => {
      const result = await createSale({
        customerId,
        isWalkIn: customerId === null,
        discountType: discountType || null,
        discountValue,
        taxRate,
        paymentMethod,
        amountPaid,
        notes,
        items: cart.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          imei: l.imei.trim(),
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });

      if (result.ok && result.saleId) {
        router.push(`/admin/sales/${result.saleId}`);
      } else {
        setError(result.error ?? "Could not complete sale");
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted focus:border-accent";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Left: product search + cart */}
      <div>
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or barcode…"
            className={inputClass}
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-surface disabled:opacity-40"
                >
                  <span className="min-w-0 truncate">
                    {p.name}
                    <span className="ml-2 text-xs text-muted">
                      {p.sku || p.barcode || ""}
                    </span>
                  </span>
                  <span className="ml-3 shrink-0 text-xs text-muted">
                    {p.stock === 0 ? "Out of stock" : `${formatPrice(p.price)} · ${p.stock} left`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border">
          {cart.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              Search above to add items to this sale.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5">Unit price</th>
                  <th className="px-4 py-2.5">Line total</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cart.map((line) => (
                  <tr key={line.productId}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{line.productName}</p>
                      {line.imeiTracked && (
                        <input
                          value={line.imei}
                          onChange={(e) =>
                            updateLine(line.productId, { imei: e.target.value })
                          }
                          placeholder="IMEI (required)"
                          className="mt-1 w-40 rounded-lg border border-border bg-bg px-2 py-1 text-xs outline-none focus:border-accent"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={1}
                        max={line.maxStock}
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(line.productId, {
                            quantity: Math.min(
                              Math.max(1, Number(e.target.value) || 1),
                              line.maxStock
                            ),
                          })
                        }
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1 text-sm outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min={0}
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(line.productId, {
                            unitPrice: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm outline-none focus:border-accent"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeLine(line.productId)}
                        className="text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: customer + payment + totals */}
      <div className="space-y-5">
        <div className="rounded-2xl border border-border p-4">
          <p className="mb-2 text-sm font-semibold">Customer</p>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm">
              <span>
                {selectedCustomer.name}
                {selectedCustomer.phone && (
                  <span className="text-muted"> · {selectedCustomer.phone}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setCustomerId(null)}
                className="text-xs text-muted hover:text-text"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Walk-in customer — search to link one"
                  className={inputClass}
                />
                {filteredCustomers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-bg shadow-lg">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerQuery("");
                        }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-surface"
                      >
                        {c.name} <span className="text-muted">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!showNewCustomer ? (
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="mt-2 text-xs text-accent"
                >
                  + Add new customer
                </button>
              ) : (
                <form
                  action={handleAddCustomer}
                  className="mt-2 space-y-2 rounded-lg bg-surface p-3"
                >
                  <input name="name" required placeholder="Name" className={inputClass} />
                  <input name="phone" placeholder="Phone" className={inputClass} />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(false)}
                      className="text-xs text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-border p-4">
          <p className="mb-2 text-sm font-semibold">Discount &amp; tax</p>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed" | "")}
              className={inputClass}
            >
              <option value="">No discount</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed (Rs.)</option>
            </select>
            <input
              type="number"
              min={0}
              value={discountValue}
              disabled={!discountType}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              placeholder="Value"
              className={`${inputClass} disabled:opacity-50`}
            />
          </div>
          <label className="mt-3 block text-xs text-muted">Tax rate (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
            className={`${inputClass} mt-1`}
          />
        </div>

        <div className="rounded-2xl border border-border p-4">
          <p className="mb-2 text-sm font-semibold">Payment</p>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className={inputClass}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-xs text-muted">Amount received</label>
          <input
            type="number"
            min={0}
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
            className={`${inputClass} mt-1`}
          />
          {paymentMethod === "cash" && changeDue > 0 && (
            <p className="mt-1.5 text-xs text-muted">
              Change due: <span className="font-semibold text-text">{formatPrice(changeDue)}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-muted">
                <span>Discount</span>
                <span>−{formatPrice(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-muted">
                <span>Tax ({taxRate}%)</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={pending || cart.length === 0}
            className="btn-primary mt-4 w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Completing…" : `Complete sale — ${formatPrice(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
