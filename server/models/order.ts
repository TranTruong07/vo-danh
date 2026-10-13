import type { ObjectId } from "mongodb";
import type { OrderStatus, PaymentMethod } from "@/server/domain/order";
export interface OrderModel {
  _id: ObjectId; orderCode: number; userId: string; requestKey: string;
  email: string; name: string; phone: string; address: string; note: string;
  productName: string; unitPrice: number; quantity: number; total: number;
  paymentMethod: PaymentMethod; status: OrderStatus;
  paymentLinkId?: string; checkoutUrl?: string; qrCode?: string; providerStatus?: string;
  paymentLeaseUntil?: Date; lastPaymentCheck?: Date;
  createdAt: Date; updatedAt: Date; paidAt?: Date; completedAt?: Date; completedBy?: string;
}
export type OrderView = Omit<OrderModel, "_id" | "createdAt" | "updatedAt" | "paidAt" | "completedAt" | "paymentLeaseUntil" | "lastPaymentCheck" | "requestKey"> & {
  id: string; createdAt: string; updatedAt: string; paidAt?: string; completedAt?: string;
};
