import api from './client';
import type { Category, CategoryRequest } from '../types';

export async function getCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>('/categories');
  return response.data;
}

export async function getCategory(id: number): Promise<Category> {
  const response = await api.get<Category>(`/categories/${id}`);
  return response.data;
}

export async function createCategory(data: CategoryRequest): Promise<Category> {
  const response = await api.post<Category>('/categories', data);
  return response.data;
}

export async function updateCategory(id: number, data: CategoryRequest): Promise<Category> {
  const response = await api.put<Category>(`/categories/${id}`, data);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
