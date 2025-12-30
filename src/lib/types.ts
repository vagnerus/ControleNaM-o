import type { LucideIcon } from "lucide-react";

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  category: string;
  cardId?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  type: 'income' | 'expense' | 'all';
};

export type RecurringTransaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  frequency: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
};

export type CreditCard = {
  id: string;
  name: string;
  last4: string;
  limit: number;
  closingDate: number; // day of month
  dueDate: number; // day of month
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
};

export type FinancialGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlySaving: number;
  imageId: string;
};
