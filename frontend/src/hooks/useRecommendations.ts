import { useQuery } from '@tanstack/react-query';
import { getRecommendations } from '../api/recommendations';
import { useAuth } from '../contexts/AuthContext';

export function useRecommendations() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recommendations', user?.sub],
    queryFn: () => getRecommendations(user?.sub),
    enabled: !!user, // only fetch if user is logged in
    staleTime: 5 * 60 * 1000,
  });
}
