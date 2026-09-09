import api from './client';

export interface RecommendationResponse {
  productId: number;
  score: number;
  reason: string;
}

export type InteractionType = 'view' | 'cart' | 'purchase';

/** دریافت توصیه‌های شخصی‌سازی‌شده */
export async function getRecommendations(topN = 10): Promise<RecommendationResponse[]> {
  const response = await api.get<RecommendationResponse[]>('/recommendations', {
    params: { topN },
  });
  return response.data;
}

/**
 * ثبت تعامل کاربر با یک محصول.
 * userId از JWT cookie در سمت backend استخراج می‌شه — اینجا نمی‌فرستیم.
 */
export async function trackInteraction(
  productId: number,
  interactionType: InteractionType,
): Promise<void> {
  await api.post('/recommendations/track', {
    productId,
    interactionType,
  });
}
