import type { LucideIcon } from "lucide-react";

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // Should be ISO string
  description: string;
  category: string;
  accountId: string;
  creditCardId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
};

export type Category = {
  id: string;
  name: string;
  icon: LucideIcon;
  type: 'income' | 'expense' | 'all';
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

export type Account = {
  id: string;
  name: string;
  balance: number;
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  spent: number; // This will be calculated on the client
};

export type FinancialGoal = {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlySaving: number;
  imageId: string;
};
