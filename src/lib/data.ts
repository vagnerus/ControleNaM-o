import {
  Car,
  Utensils,
  Home,
  ShoppingCart,
  Gift,
  PiggyBank,
  Briefcase,
  Heart,
  Film,
  GraduationCap,
  Landmark,
  Plane,
  Receipt,
  LucideIcon
} from 'lucide-react';
import type { Budget, Category, CreditCard, FinancialGoal, Transaction } from '@/lib/types';
import { getPlaceholderImage } from './placeholder-images';

const categories: Category[] = [
  { id: 'cat_1', name: 'Alimentação', icon: Utensils, type: 'expense' },
  { id: 'cat_2', name: 'Transporte', icon: Car, type: 'expense' },
  { id: 'cat_3', name: 'Moradia', icon: Home, type: 'expense' },
  { id: 'cat_4', name: 'Supermercado', icon: ShoppingCart, type: 'expense' },
  { id: 'cat_5', name: 'Saúde', icon: Heart, type: 'expense' },
  { id: 'cat_6', name: 'Lazer', icon: Film, type: 'expense' },
  { id: 'cat_7', name: 'Educação', icon: GraduationCap, type: 'expense' },
  { id: 'cat_8', name: 'Viagem', icon: Plane, type: 'expense' },
  { id: 'cat_9', name: 'Presentes', icon: Gift, type: 'expense' },
  { id: 'cat_10', name: 'Outras Despesas', icon: Receipt, type: 'expense' },
  { id: 'cat_11', name: 'Salário', icon: Briefcase, type: 'income' },
  { id: 'cat_12', name: 'Investimentos', icon: PiggyBank, type: 'income' },
  { id: 'cat_13', name: 'Outras Receitas', icon: Landmark, type: 'income' },
];

export const getCategoryByName = (name: string): Category | undefined => categories.find(c => c.name === name);
export const getCategories = async (type?: 'income' | 'expense'): Promise<Category[]> => {
    if (type) {
        return categories.filter(c => c.type === type || c.type === 'all');
    }
    return categories;
};

let transactions: Transaction[] = [
  { id: 'txn_1', type: 'expense', amount: 150.75, date: new Date(new Date().setMonth(new Date().getMonth(), 1)).toISOString(), description: 'Compras da semana', category: 'Supermercado', cardId: 'card_1' },
  { id: 'txn_2', type: 'income', amount: 5000, date: new Date(new Date().setMonth(new Date().getMonth(), 5)).toISOString(), description: 'Salário de Maio', category: 'Salário' },
  { id: 'txn_3', type: 'expense', amount: 80.00, date: new Date(new Date().setMonth(new Date().getMonth(), 3)).toISOString(), description: 'Jantar com amigos', category: 'Alimentação', cardId: 'card_2' },
  { id: 'txn_4', type: 'expense', amount: 1200.00, date: new Date(new Date().setMonth(new Date().getMonth(), 10)).toISOString(), description: 'Aluguel', category: 'Moradia' },
  { id: 'txn_5', type: 'expense', amount: 50.00, date: new Date(new Date().setMonth(new Date().getMonth(), 8)).toISOString(), description: 'Uber', category: 'Transporte', cardId: 'card_1' },
  { id: 'txn_6', type: 'expense', amount: 250.00, date: new Date(new Date().setMonth(new Date().getMonth(), 12)).toISOString(), description: 'Cinema e pipoca', category: 'Lazer', cardId: 'card_2' },
  { id: 'txn_7', type: 'expense', amount: 300.00, date: new Date(new Date().setMonth(new Date().getMonth(), 15)).toISOString(), description: 'Curso de Inglês', category: 'Educação' },
  { id: 'txn_8', type: 'income', amount: 300.00, date: new Date(new Date().setMonth(new Date().getMonth(), 16)).toISOString(), description: 'Freelance de design', category: 'Outras Receitas' },
  { id: 'txn_9', type: 'expense', amount: 25.50, date: new Date(new Date().setMonth(new Date().getMonth(), 18)).toISOString(), description: 'iFood', category: 'Alimentação', cardId: 'card_1' },
  { id: 'txn_10', type: 'expense', amount: 150.00, date: new Date(new Date().setMonth(new Date().getMonth(), 20)).toISOString(), description: 'Consulta médica', category: 'Saúde' },
];

const creditCards: CreditCard[] = [
    { id: 'card_1', name: 'Nubank Platinum', last4: '1234', limit: 5000, closingDate: 25, dueDate: 5, brand: 'mastercard' },
    { id: 'card_2', name: 'Inter Gold', last4: '5678', limit: 8000, closingDate: 20, dueDate: 1, brand: 'mastercard' },
    { id: 'card_3', name: 'Bradesco Amex', last4: '9012', limit: 15000, closingDate: 15, dueDate: 25, brand: 'amex' },
];

let budgets: Budget[] = [
    { id: 'bud_1', category: 'Alimentação', amount: 800, spent: transactions.filter(t => t.category === 'Alimentação').reduce((sum, t) => sum + t.amount, 0) },
    { id: 'bud_2', category: 'Transporte', amount: 250, spent: transactions.filter(t => t.category === 'Transporte').reduce((sum, t) => sum + t.amount, 0) },
    { id: 'bud_3', category: 'Lazer', amount: 500, spent: transactions.filter(t => t.category === 'Lazer').reduce((sum, t) => sum + t.amount, 0) },
    { id: 'bud_4', category: 'Supermercado', amount: 600, spent: transactions.filter(t => t.category === 'Supermercado').reduce((sum, t) => sum + t.amount, 0) },
];

let financialGoals: FinancialGoal[] = [
    { id: 'goal_1', name: 'Comprar um Carro', targetAmount: 70000, currentAmount: 15000, monthlySaving: 800, imageId: 'goal-car' },
    { id: 'goal_2', name: 'Viagem para a Europa', targetAmount: 25000, currentAmount: 12000, monthlySaving: 1000, imageId: 'goal-travel' },
    { id: 'goal_3', name: 'Entrada do Apartamento', targetAmount: 100000, currentAmount: 25000, monthlySaving: 1200, imageId: 'goal-house' },
];

// --- API-like functions ---

const getCurrentMonthTransactions = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
}


// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getRecentTransactions = async (limit: number): Promise<Transaction[]> => {
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
};

export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const newTransaction: Transaction = {
        ...transaction,
        id: `txn_${Date.now()}`
    };
    transactions.unshift(newTransaction);
    // update budget spent
    const budget = budgets.find(b => b.category === newTransaction.category);
    if (budget && newTransaction.type === 'expense') {
        budget.spent += newTransaction.amount;
    }
    return newTransaction;
}

// Summary
export const getSummary = async () => {
    const currentMonthTransactions = getCurrentMonthTransactions();
    const income = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    return { income, expenses, balance, monthlyIncome: 5300 };
};

// Budgets
export const getBudgets = async (): Promise<Budget[]> => {
  const currentMonthTransactions = getCurrentMonthTransactions();
  // Recalculate spent for each budget before returning
  return budgets.map(budget => ({
    ...budget,
    spent: currentMonthTransactions
      .filter(t => t.category === budget.category && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  }));
};

export const getSpendingByCategory = async () => {
    const spending: Record<string, number> = {};
    const currentMonthTransactions = getCurrentMonthTransactions();
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
    });
    return spending;
}

// Goals
export const getFinancialGoals = async () => {
    return financialGoals;
};

// Credit Cards
export const getCreditCards = async (): Promise<CreditCard[]> => {
    return creditCards;
};

export const getCardTransactions = async (cardId: string): Promise<Transaction[]> => {
    return transactions.filter(t => t.cardId === cardId);
};
