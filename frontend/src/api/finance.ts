import api from './client';
import type { Transaction, FinanceSummaryResponse } from '../types';

export async function getTransactions(): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>('/finance/transactions');
  return response.data;
}

export async function getFinanceSummary(): Promise<FinanceSummaryResponse> {
  const response = await api.get<FinanceSummaryResponse>('/finance/summary');
  return response.data;
}

export async function getAdminTransactions(): Promise<Transaction[]> {
  const response = await api.get<Transaction[]>('/finance/admin/transactions');
  return response.data;
}

export async function getAdminFinanceSummary(): Promise<FinanceSummaryResponse> {
  const response = await api.get<FinanceSummaryResponse>('/finance/admin/summary');
  return response.data;
}
