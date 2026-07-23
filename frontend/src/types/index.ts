export interface Product {
  id: number;
  skuCode: string;
  name: string;
  description: string;
  price: number;
}

export interface ProductRequest {
  skuCode: string;
  name: string;
  description: string;
  price: number;
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface AddCartItemRequest {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface OrderLineResponse {
  productId: number;
  quantity: number;
  unitPrice: number;
}

export interface OrderResponse {
  id: number;
  userId: string;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderLineResponse[];
}

export interface InventoryResponse {
  skuCode: string;
  quantity: number;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  recaptchaToken?: string;
}

export interface AuthUser {
  name: string;
  email: string;
  roles: string[];
}

export interface Transaction {
  id: number;
  orderId: number;
  userId: string;
  amount: number;
  type: 'PAYMENT';
  createdAt: string;
}

export interface FinanceSummaryResponse {
  userId: string;
  totalAmount: number;
  transactionCount: number;
}
