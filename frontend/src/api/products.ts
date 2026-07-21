import api from './client';
import type { Product, ProductRequest } from '../types';

export async function getProducts(search?: string): Promise<Product[]> {
  const response = await api.get<Product[]>('/products', {
    params: search ? { search } : undefined,
  });
  return response.data;
}

export async function getProduct(id: number): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function createProduct(data: ProductRequest): Promise<Product> {
  const response = await api.post<Product>('/products', data);
  return response.data;
}

export async function updateProduct(id: number, data: ProductRequest): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}
