import { useQuery } from '@tanstack/react-query';
import { getTransactions, getFinanceSummary } from '../api/finance';

export function useTransactions() {
  return useQuery({
    queryKey: ['finance', 'transactions'],
    queryFn: getTransactions,
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: getFinanceSummary,
  });
}
