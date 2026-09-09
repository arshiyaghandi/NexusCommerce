import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecommendations, trackInteraction, InteractionType } from '../api/recommendations';
import { useAuth } from '../contexts/AuthContext';

/** دریافت توصیه‌های شخصی‌سازی‌شده برای کاربر جاری */
export function useRecommendations(topN = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.sub, topN],
    queryFn: () => getRecommendations(topN),
    enabled: true,          // حتی برای کاربران ناشناس trending نشان داده می‌شه
    staleTime: 5 * 60 * 1000,
    retry: false,           // اگه سرویس down بود crash نکنه
  });
}

/**
 * ثبت تعامل کاربر با یک محصول.
 *
 * استفاده:
 * ```tsx
 * const { trackView, trackCart, trackPurchase } = useTrackInteraction();
 * // وقتی کاربر صفحه محصول رو باز کرد:
 * useEffect(() => { trackView(productId); }, [productId]);
 * // وقتی به سبد اضافه کرد:
 * trackCart(productId);
 * ```
 */
export function useTrackInteraction() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ productId, type }: { productId: number; type: InteractionType }) =>
      trackInteraction(productId, type),
    onSuccess: () => {
      // بعد از هر تعامل، توصیه‌ها stale می‌شن تا دفعه بعد refresh بشن
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
    },
    onError: () => {
      // Track failure نباید UX رو خراب کنه — silent fail
    },
  });

  return {
    trackView:     (productId: number) => mutation.mutate({ productId, type: 'view' }),
    trackCart:     (productId: number) => mutation.mutate({ productId, type: 'cart' }),
    trackPurchase: (productId: number) => mutation.mutate({ productId, type: 'purchase' }),
  };
}
