export type UserRole = 'admin' | 'vendor'

export interface User {
  id: string
  email: string
  roles: UserRole[]
  name: string
}

export type OrderStatus =
  | 'pending'
  | 'awaiting_verification'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled'

export type PaymentMethod = 'online' | 'cod'

export type AffiliateType = 'influencer' | 'creator' | 'shop_owner' | 'blogger' | 'other'

export interface StockMovement {
  id: string
  productId: string
  type: 'add' | 'remove'
  quantity: number
  reason: 'restock' | 'return' | 'correction' | 'sale'
  warehouse: string
  notes?: string
  createdAt: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string
  category: string
  available: boolean
  sku: string
  commissionRate: number       // percentage e.g. 15
  commissionTier: string       // e.g. "Tier A Affiliates"
}

export interface OrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
  image: string
}

export interface StatusChange {
  status: OrderStatus
  timestamp: string
  remark?: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  affiliateCode?: string
  affiliateDiscount?: number
  createdAt: string
  address: string
  statusHistory: StatusChange[]
}

export interface Affiliate {
  id: string
  // Personal Details
  fullName: string
  email: string
  affiliateType: AffiliateType
  contactNumber: string
  physicalAddress: string
  // Affiliate Details
  linkedProductIds: string[]
  affiliateCode: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  commissionType: 'percentage' | 'fixed'
  commissionValue: number
  // Bank Details
  bankName: string
  accountNumber: string
  // Meta
  createdAt: string
  status: 'active' | 'inactive'
}

export interface Withdrawal {
  id: string
  affiliateId: string
  amount: number
  requestedAt: string
  processedAt?: string
  status: 'pending' | 'approved' | 'rejected'
  remarks?: string
  paymentScreenshot?: string   // data URL or object URL from file upload
}

export interface EarningEntry {
  id: string
  affiliateId: string
  orderId: string
  productName: string
  affiliateCode: string
  commissionAmount: number
  orderTotal: number
  createdAt: string
  status: 'pending' | 'paid'
}
