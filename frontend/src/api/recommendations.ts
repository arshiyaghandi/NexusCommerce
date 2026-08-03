import api from './client';

export interface RecommendationResponse {
  productId: number;
  score: number;
  reason: string;
}

export async function getRecommendations(userId?: string): Promise<RecommendationResponse[]> {
  const response = await api.get<RecommendationResponse[]>('/recommendations', {
    params: userId ? { userId } : undefined,
  });
  return response.data;
}
