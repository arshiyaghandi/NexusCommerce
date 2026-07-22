import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCart, addToCart, removeFromCart, clearCart } from '../api/cart';
import type { Product } from '../types';

export function useCartCount(enabled = true) {
  return useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    staleTime: 1000 * 30,
    enabled,
  });
}

export function useCart(enabled = true) {
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    enabled,
  });

  const addMutation = useMutation({
    mutationFn: ({ product, quantity }: { product: Product; quantity: number }) =>
      addToCart(product, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  return {
    items: cartQuery.data ?? [],
    isLoading: cartQuery.isPending,
    addItem: addMutation.mutateAsync,
    removeItem: removeMutation.mutateAsync,
    clearCart: clearMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
