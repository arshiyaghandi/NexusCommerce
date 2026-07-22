import api from './client';
import type { OrderResponse } from '../types';

export async function getOrders(): Promise<OrderResponse[]> {
  const response = await api.get<OrderResponse[]>('/orders');
  return response.data;
}

export async function getOrder(orderId: number): Promise<OrderResponse> {
  const response = await api.get<OrderResponse>(`/orders/${orderId}`);
  return response.data;
}

export async function placeOrder(): Promise<string> {
  const response = await api.post<string>('/orders');
  return response.data;
}
