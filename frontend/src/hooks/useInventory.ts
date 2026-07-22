import { useQuery } from '@tanstack/react-query';
import { getInventory } from '../api/inventory';

export function useInventory(skuCode: string) {
  return useQuery({
    queryKey: ['inventory', skuCode],
    queryFn: () => getInventory(skuCode),
    enabled: !!skuCode,
  });
}
