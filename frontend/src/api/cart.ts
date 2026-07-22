import api from './client';
import type { CartItem, AddCartItemRequest, Product } from '../types';

export async function getCart(): Promise<CartItem[]> {
  const response = await api.get<CartItem[]>('/cart');
  return response.data;
}

export async function addToCart(product: Product, quantity: number): Promise<CartItem[]> {
  const request: AddCartItemRequest = {
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
  };
  const response = await api.post<CartItem[]>('/cart/items', request);
  return response.data;
}

export async function removeFromCart(productId: number): Promise<CartItem[]> {
  const response = await api.delete<CartItem[]>(`/cart/items/${productId}`);
  return response.data;
}

export async function clearCart(): Promise<void> {
  await api.delete('/cart');
}
