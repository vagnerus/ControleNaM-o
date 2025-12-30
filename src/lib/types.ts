

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
  attachmentUrls?: string[];
  isInstallment?: boolean; // Is this transaction an installment payment?
  totalInstallments?: number; // Total number of installments for a purchase
  originalPurchaseId?: string; // Link to the original purchase transaction for installments
  isFuture?: boolean; // For projected transactions
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
  icon: string; // Bank icon identifier
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

export type RecurringTransaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string; // ISO string
  endDate?: string; // ISO string
  categoryId: string;
  accountId: string;
  categoryName?: string; // Denormalized for display
  accountName?: string; // Denormalized for display
};

export type Installment = {
    id: string;
    transactionId: string; // Original purchase transaction
    creditCardId: string;
    installmentNumber: number;
    totalInstallments: number;
    amount: number;
    dueDate: string; // ISO string
    isPaid: boolean;
};
