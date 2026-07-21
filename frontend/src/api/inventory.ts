import api from './client';
import type { InventoryResponse } from '../types';

export async function getInventory(skuCode: string): Promise<InventoryResponse> {
  const response = await api.get<InventoryResponse>(`/inventory/${skuCode}`);
  return response.data;
}
