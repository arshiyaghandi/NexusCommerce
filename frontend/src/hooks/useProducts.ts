import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../api/products';
import type { ProductRequest } from '../types';

export function useProducts(search?: string) {
  return useQuery({
    queryKey: ['products', search],
    queryFn: () => getProducts(search),
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: id > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductRequest }) => updateProduct(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });
}
