export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  category_id: string | null;
  images: string[];
  stock: number;
  featured: boolean;
  active: boolean;
  created_at: string;
  // Inventory extension (Phase A/B)
  brand_id?: string | null;
  model?: string;
  color?: string;
  storage?: string;
  ram?: string;
  sku?: string | null;
  barcode?: string | null;
  purchase_price?: number;
  min_stock?: number;
  supplier_id?: string | null;
  warranty_months?: number;
  imei_tracked?: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Supplier {
  id: string;
  name: string;
  company: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  pan_vat: string;
  bank_details: string;
  notes: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  loyalty_points: number;
  notes: string;
  created_at: string;
}

export type StaffRole = "admin" | "manager" | "cashier" | "technician";

export interface StaffProfile {
  id: string;
  full_name: string;
  role: StaffRole;
  phone: string;
  active: boolean;
  created_at: string;
}

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "esewa" | "khalti";
export type SaleStatus = "completed" | "refunded" | "partially_refunded" | "cancelled";

export interface Sale {
  id: string;
  invoice_number: number;
  customer_id: string | null;
  is_walk_in: boolean;
  subtotal: number;
  discount_type: "percentage" | "fixed" | null;
  discount_value: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_due: number;
  status: SaleStatus;
  cashier_id: string | null;
  notes: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  imei: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  cost_price: number;
  returned: boolean;
}

export interface SaleReturn {
  id: string;
  sale_id: string;
  sale_item_id: string;
  quantity: number;
  reason: string;
  refund_amount: number;
  restock: boolean;
  created_by: string | null;
  created_at: string;
}

export type RepairStatus =
  | "received"
  | "diagnosing"
  | "waiting_parts"
  | "repairing"
  | "ready"
  | "delivered"
  | "cancelled";

export interface Repair {
  id: string;
  repair_number: number;
  customer_id: string | null;
  customer_name: string;
  phone: string;
  device_brand: string;
  device_model: string;
  imei: string;
  problem_description: string;
  technician_id: string | null;
  technician_name: string;
  repair_cost: number;
  advance_paid: number;
  status: RepairStatus;
  date_received: string;
  delivery_date: string | null;
  notes: string;
  images: string[];
  created_at: string;
}

export interface RepairStatusHistory {
  id: string;
  repair_id: string;
  status: string;
  note: string;
  changed_by: string | null;
  changed_at: string;
}

export interface RepairPart {
  id: string;
  repair_id: string;
  product_id: string | null;
  part_name: string;
  quantity: number;
  unit_cost: number;
}

export type PurchaseOrderStatus = "pending" | "partially_received" | "received" | "cancelled";

export interface PurchaseOrder {
  id: string;
  po_number: number;
  supplier_id: string;
  status: PurchaseOrderStatus;
  invoice_file: string;
  notes: string;
  ordered_at: string;
  received_at: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number;
  received_quantity: number;
}

export interface SupplierPayment {
  id: string;
  supplier_id: string;
  purchase_order_id: string | null;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  notes: string;
}

export type ExpenseCategory =
  | "rent"
  | "electricity"
  | "internet"
  | "salary"
  | "marketing"
  | "repairs"
  | "transportation"
  | "miscellaneous";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt_url: string;
  expense_date: string;
  created_by: string | null;
  created_at: string;
}

export type InventoryChangeType = "sale" | "purchase" | "repair_part" | "adjustment" | "return" | "initial";

export interface InventoryMovement {
  id: string;
  product_id: string | null;
  change_type: InventoryChangeType;
  quantity_change: number;
  reference_table: string;
  reference_id: string | null;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_type: "sale" | "repair" | "purchase";
  reference_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  notes: string;
  created_by: string | null;
}

export type NotificationType =
  | "low_stock"
  | "repair_ready"
  | "supplier_due"
  | "daily_summary"
  | "pending_repair"
  | "overdue_payment";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  phone: string;
  address: string;
  delivery_method: "delivery" | "pickup";
  payment_method: "cod" | "qr";
  status: "new" | "confirmed" | "delivered" | "cancelled";
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}
