import { z } from "zod";

const nepaliPhone = z
  .string()
  .regex(/^9[78]\d{8}$/, "Enter a valid Nepali mobile number (97/98 XXXXXXXX)");

export const checkoutSchema = z
  .object({
    customer_name: z.string().min(2, "Name must be at least 2 characters"),
    phone: nepaliPhone,
    address: z.string().optional(),
    delivery_method: z.enum(["delivery", "pickup"]),
    payment_method: z.enum(["cod", "qr"]),
  })
  .superRefine((data, ctx) => {
    if (
      data.delivery_method === "delivery" &&
      (!data.address || data.address.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required for home delivery",
        path: ["address"],
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  stock: z.coerce.number().int().min(0, "Stock must be non-negative"),
  description: z.string().optional().default(""),
  category_id: z.string().uuid().optional().or(z.literal("")),
  featured: z.coerce.boolean().optional().default(false),
  active: z.coerce.boolean().optional().default(true),
  brand_id: z.string().uuid().optional().or(z.literal("")),
  model: z.string().optional().default(""),
  color: z.string().optional().default(""),
  storage: z.string().optional().default(""),
  ram: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  purchase_price: z.coerce.number().min(0, "Purchase price must be non-negative").optional().default(0),
  min_stock: z.coerce.number().int().min(0, "Minimum stock must be non-negative").optional().default(2),
  supplier_id: z.string().uuid().optional().or(z.literal("")),
  warranty_months: z.coerce.number().int().min(0).optional().default(0),
  imei_tracked: z.coerce.boolean().optional().default(false),
});

export type ProductInput = z.infer<typeof productSchema>;

export const saleItemInputSchema = z.object({
  productId: z.string().uuid(),
  productName: z.string().min(1),
  imei: z.string().optional().default(""),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const saleInputSchema = z.object({
  customerId: z.string().uuid().nullable(),
  isWalkIn: z.boolean(),
  discountType: z.enum(["percentage", "fixed"]).nullable(),
  discountValue: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  paymentMethod: z.enum(["cash", "card", "bank_transfer", "esewa", "khalti"]),
  amountPaid: z.coerce.number().min(0),
  notes: z.string().optional().default(""),
  items: z.array(saleItemInputSchema).min(1, "Add at least one item"),
});

export type SaleInput = z.infer<typeof saleInputSchema>;

export const customerQuickSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
});

export const returnInputSchema = z.object({
  saleItemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1),
  reason: z.string().optional().default(""),
  refundAmount: z.coerce.number().min(0),
  restock: z.boolean().default(true),
});

export const supplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().default(""),
  contact_person: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  address: z.string().optional().default(""),
  pan_vat: z.string().optional().default(""),
  bank_details: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
