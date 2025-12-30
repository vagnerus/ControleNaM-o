

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // Should be ISO string
  description: string;
  categoryId: string;
  accountId: string;
  creditCardId?: string;
  tagIds?: string[];
};

export type Category = {
  id: string;
  name: string;
  icon: string; // Lucide icon name as string
  type: 'income' | 'expense';
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
  categoryId: string;
  categoryName?: string; // Denormalized for display
  amount: number;
};

export type FinancialGoal = {
  id:string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlySaving: number;
  imageId: string;
};

export type Tag = {
    id: string;
    name: string;
};
