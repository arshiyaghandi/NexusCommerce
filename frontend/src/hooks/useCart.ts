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
    onMutate: async ({ product, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']);

      queryClient.setQueryData<CartItem[]>(['cart'], (old) => {
        if (!old) return [];
        const existing = old.find((item) => item.productId === product.id);
        if (existing) {
          return old.map((item) =>
            item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...old, { productId: product.id, productName: product.name, quantity, unitPrice: product.price }];
      });
      return { previousCart };
    },
    onError: (_err, _newVal, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(['cart'], newCart);
    },
    onSettled: () => {
      // Background sync just in case
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromCart,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']);
      queryClient.setQueryData<CartItem[]>(['cart'], (old) =>
        old ? old.filter((item) => item.productId !== productId) : []
      );
      return { previousCart };
    },
    onError: (_err, _productId, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
    },
    onSuccess: (newCart) => {
      queryClient.setQueryData(['cart'], newCart);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<CartItem[]>(['cart']);
      queryClient.setQueryData<CartItem[]>(['cart'], []);
      return { previousCart };
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(['cart'], context?.previousCart);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
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
