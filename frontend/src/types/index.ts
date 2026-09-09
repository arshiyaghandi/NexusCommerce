export interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  children: Category[];
}

export interface CategoryRequest {
  name: string;
  description: string;
  parentId: number | null;
}

export interface Product {
  id: number;
  skuCode: string;
  name: string;
  description: string;
  price: number;
  categoryId: number | null;
  categoryName: string | null;
}

export interface ProductRequest {
  skuCode: string;
  name: string;
  description: string;
  price: number;
  categoryId: number | null;
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
  captchaId?: string;
  captchaAnswer?: string;
}

export interface AuthUser {
  sub?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  roles: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  roles: string[];
  createdTimestamp?: number;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
