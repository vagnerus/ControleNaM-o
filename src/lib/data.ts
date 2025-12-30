'use client';

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
  Wallet,
} from 'lucide-react';
import type { Category, Transaction, CreditCard, Account, Budget, FinancialGoal } from '@/lib/types';
import { addDoc, collection, Firestore, doc, deleteDoc, runTransaction, increment, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { addMonths } from 'date-fns';


// This file now contains the static definitions for categories,
// but all transactional data functions will interact with Firestore.

const STATIC_CATEGORIES: Category[] = [
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

export const getCategoryByName = (name: string): Category | undefined => STATIC_CATEGORIES.find(c => c.name === name);

export const getCategories = (type?: 'income' | 'expense'): Category[] => {
    if (type) {
        return STATIC_CATEGORIES.filter(c => c.type === type || c.type === 'all');
    }
    return STATIC_CATEGORIES;
};


export const addTransaction = (
  firestore: Firestore,
  userId: string,
  transactionData: Omit<Transaction, 'id'> & { totalInstallments?: number }
) => {
  if (!userId) {
    throw new Error('User must be authenticated to add a transaction.');
  }
  
  const { amount, type, accountId, creditCardId, totalInstallments, ...rest } = transactionData;
  const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
  
  if (totalInstallments && totalInstallments > 1 && creditCardId) {
    const installmentAmount = amount / totalInstallments;
    for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = addMonths(new Date(rest.date), i);
        const installmentTransaction = {
            ...rest,
            amount: installmentAmount,
            type,
            accountId,
            creditCardId,
            date: installmentDate.toISOString(),
            installmentNumber: i + 1,
            totalInstallments,
        };
        // We don't update account balance for credit card transactions
        addDoc(transactionsCollection, installmentTransaction).catch(error => {
          console.error("Error adding installment transaction: ", error);
        });
    }
  } else {
    // Non-installment or single installment transaction
    const newTransaction = {
      ...rest,
      amount,
      type,
      accountId,
      date: rest.date,
      totalInstallments: 1,
      installmentNumber: 1,
    };
    
    runTransaction(firestore, async (tx) => {
        const newTransactionRef = doc(transactionsCollection);
        tx.set(newTransactionRef, newTransaction);

        // Update account balance only if it's not a credit card transaction
        if (!creditCardId) {
            const accountRef = doc(firestore, 'users', userId, 'accounts', accountId);
            const balanceChange = type === 'income' ? amount : -amount;
            tx.update(accountRef, { balance: increment(balanceChange) });
        }
    }).catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: transactionsCollection.path,
            operation: 'create',
            requestResourceData: newTransaction,
          })
        );
    });
  }
};

export const addCard = (
  firestore: Firestore,
  userId: string,
  cardData: Omit<CreditCard, 'id' | 'spent' | 'transactions'>
) => {
  if (!userId) {
    throw new Error('User must be authenticated to add a card.');
  }
  const cardsCollection = collection(firestore, 'users', userId, 'creditCards');
  
  const newCard: Omit<CreditCard, 'id'> = {
    ...cardData,
  };

  addDoc(cardsCollection, newCard)
    .catch(error => {
      console.error("Error adding card: ", error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: cardsCollection.path,
          operation: 'create',
          requestResourceData: newCard,
        })
      );
    });
}

export const deleteCard = (
  firestore: Firestore,
  userId: string,
  cardId: string
) => {
  if (!userId) {
    throw new Error('User must be authenticated to delete a card.');
  }
  const cardDoc = doc(firestore, 'users', userId, 'creditCards', cardId);
  
  deleteDoc(cardDoc)
    .catch(error => {
      console.error("Error deleting card: ", error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: cardDoc.path,
          operation: 'delete',
        })
      );
    });
}

export const addAccount = (
  firestore: Firestore,
  userId: string,
  accountData: Omit<Account, 'id'>
) => {
  if (!userId) {
    throw new Error('User must be authenticated to add an account.');
  }
  const accountsCollection = collection(firestore, 'users', userId, 'accounts');
  
  addDoc(accountsCollection, accountData)
    .catch(error => {
      console.error("Error adding account: ", error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: accountsCollection.path,
          operation: 'create',
          requestResourceData: accountData,
        })
      );
    });
};

export const deleteAccount = (
  firestore: Firestore,
  userId: string,
  accountId: string
) => {
  if (!userId) {
    throw new Error('User must be authenticated to delete an account.');
  }
  // Note: This does not handle transactions associated with the account.
  // In a real app, you might want to re-assign them or delete them.
  const accountDoc = doc(firestore, 'users', userId, 'accounts', accountId);
  
  deleteDoc(accountDoc)
    .catch(error => {
      console.error("Error deleting account: ", error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: accountDoc.path,
          operation: 'delete',
        })
      );
    });
};


// Budget Functions
export const saveBudget = (firestore: Firestore, userId: string, budgetData: Omit<Budget, 'id'>, budgetId?: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const budgetsCollection = collection(firestore, 'users', userId, 'budgets');
  
  if (budgetId) {
    // Update existing budget
    const budgetDoc = doc(firestore, 'users', userId, 'budgets', budgetId);
    updateDoc(budgetDoc, budgetData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetDoc.path, operation: 'update', requestResourceData: budgetData }));
    });
  } else {
    // Add new budget
    addDoc(budgetsCollection, budgetData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetsCollection.path, operation: 'create', requestResourceData: budgetData }));
    });
  }
};

export const deleteBudget = (firestore: Firestore, userId: string, budgetId: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const budgetDoc = doc(firestore, 'users', userId, 'budgets', budgetId);
  deleteDoc(budgetDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetDoc.path, operation: 'delete' }));
  });
};

// Financial Goal Functions
export const saveGoal = (firestore: Firestore, userId: string, goalData: Omit<FinancialGoal, 'id'>, goalId?: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const goalsCollection = collection(firestore, 'users', userId, 'financialGoals');

  if (goalId) {
    // Update existing goal
    const goalDoc = doc(firestore, 'users', userId, 'financialGoals', goalId);
    updateDoc(goalDoc, goalData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: goalDoc.path, operation: 'update', requestResourceData: goalData }));
    });
  } else {
    // Add new goal
    addDoc(goalsCollection, goalData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: goalsCollection.path, operation: 'create', requestResourceData: goalData }));
    });
  }
};

export const deleteGoal = (firestore: Firestore, userId: string, goalId: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const goalDoc = doc(firestore, 'users', userId, 'financialGoals', goalId);
  deleteDoc(goalDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: goalDoc.path, operation: 'delete' }));
  });
};
