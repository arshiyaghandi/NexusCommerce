import { useQuery } from '@tanstack/react-query';
import { getTransactions, getFinanceSummary, getAdminTransactions, getAdminFinanceSummary } from '../api/finance';

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

export function useAdminTransactions() {
  return useQuery({
    queryKey: ['admin', 'finance', 'transactions'],
    queryFn: getAdminTransactions,
  });
}

export function useAdminFinanceSummary() {
  return useQuery({
    queryKey: ['admin', 'finance', 'summary'],
    queryFn: getAdminFinanceSummary,
  });
}
