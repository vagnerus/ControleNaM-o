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
import { addDoc, collection, Firestore, doc, deleteDoc, runTransaction, increment, updateDoc, writeBatch, query, where, getDocs, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';


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


export const saveTransaction = (
  firestore: Firestore,
  userId: string,
  transactionData: Omit<Transaction, 'id' | 'installmentId'> & { totalInstallments?: number },
  transactionId?: string
) => {
    if (!userId) {
        throw new Error('User must be authenticated.');
    }
    
    // For new transactions, especially installments
    if (!transactionId && transactionData.totalInstallments && transactionData.totalInstallments > 1 && transactionData.creditCardId) {
        const batch = writeBatch(firestore);
        const installmentId = uuidv4();
        const installmentAmount = transactionData.amount / transactionData.totalInstallments;

        for (let i = 0; i < transactionData.totalInstallments; i++) {
            const installmentDate = addMonths(new Date(transactionData.date), i);
            const newDocRef = doc(collection(firestore, 'users', userId, 'transactions'));
            batch.set(newDocRef, {
                ...transactionData,
                amount: installmentAmount,
                date: installmentDate.toISOString(),
                installmentId,
                installmentNumber: i + 1,
            });
        }
        batch.commit().catch(error => console.error("Error creating installments:", error));
    } else { // For single new transactions or updating existing ones
        runTransaction(firestore, async (tx) => {
            const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
            const newDocRef = transactionId ? doc(transactionsCollection, transactionId) : doc(transactionsCollection);
            let oldTransactionData: Transaction | null = null;
            
            if (transactionId) {
                const oldDoc = await tx.get(newDocRef);
                if (oldDoc.exists()) {
                    oldTransactionData = oldDoc.data() as Transaction;
                }
            }

            // Revert old balance if it's an update and not a credit card transaction
            if (oldTransactionData && !oldTransactionData.creditCardId) {
                const oldAccountRef = doc(firestore, 'users', userId, 'accounts', oldTransactionData.accountId);
                const oldBalanceChange = oldTransactionData.type === 'income' ? -oldTransactionData.amount : oldTransactionData.amount;
                tx.update(oldAccountRef, { balance: increment(oldBalanceChange) });
            }

            // Apply new balance change if not a credit card transaction
            if (!transactionData.creditCardId) {
                const newAccountRef = doc(firestore, 'users', userId, 'accounts', transactionData.accountId);
                const newBalanceChange = transactionData.type === 'income' ? transactionData.amount : -transactionData.amount;
                tx.update(newAccountRef, { balance: increment(newBalanceChange) });
            }
            
            tx.set(newDocRef, { ...transactionData, date: transactionData.date.toString() });

        }).catch(error => {
            console.error("Error saving transaction:", error);
        });
    }
};

export const deleteTransaction = async (firestore: Firestore, userId: string, transaction: Transaction) => {
    if (!userId) throw new Error("User must be authenticated.");

    const batch = writeBatch(firestore);

    // If it's an installment, delete all related transactions
    if (transaction.installmentId) {
        const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
        const q = query(transactionsCollection, where("installmentId", "==", transaction.installmentId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
    } else {
        // Just delete the single transaction
        const transactionDoc = doc(firestore, 'users', userId, 'transactions', transaction.id);
        batch.delete(transactionDoc);
        
        // Revert account balance only if it's NOT a credit card transaction
        if (!transaction.creditCardId) {
            const accountRef = doc(firestore, 'users', userId, 'accounts', transaction.accountId);
            const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
            batch.update(accountRef, { balance: increment(balanceChange) });
        }
    }
    
    await batch.commit().catch(error => console.error("Error deleting transaction(s):", error));
};

export const saveCard = (
  firestore: Firestore,
  userId: string,
  cardData: Omit<CreditCard, 'id'>,
  cardId?: string
) => {
  if (!userId) {
    throw new Error('User must be authenticated.');
  }

  if (cardId) {
    const cardDoc = doc(firestore, 'users', userId, 'creditCards', cardId);
    setDoc(cardDoc, cardData, { merge: true }).catch(error => {
      console.error("Error updating card: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: cardDoc.path,
        operation: 'update',
        requestResourceData: cardData,
      }));
    });
  } else {
    const cardsCollection = collection(firestore, 'users', userId, 'creditCards');
    addDoc(cardsCollection, cardData).catch(error => {
      console.error("Error adding card: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: cardsCollection.path,
        operation: 'create',
        requestResourceData: cardData,
      }));
    });
  }
};

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

export const saveAccount = (
  firestore: Firestore,
  userId: string,
  accountData: Omit<Account, 'id'>,
  accountId?: string
) => {
  if (!userId) {
    throw new Error('User must be authenticated.');
  }
  
  if (accountId) {
    const accountDoc = doc(firestore, 'users', userId, 'accounts', accountId);
    // Be careful with balance updates. This assumes the form provides the *new* total balance.
    // A more robust solution for balance would be to calculate it based on transactions.
    setDoc(accountDoc, accountData, { merge: true }).catch(error => {
      console.error("Error updating account: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: accountDoc.path,
        operation: 'update',
        requestResourceData: accountData,
      }));
    });
  } else {
    const accountsCollection = collection(firestore, 'users', userId, 'accounts');
    addDoc(accountsCollection, accountData).catch(error => {
      console.error("Error adding account: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: accountsCollection.path,
        operation: 'create',
        requestResourceData: accountData,
      }));
    });
  }
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
  
  const budgetPayload = { ...budgetData };

  if (budgetId) {
    // Update existing budget
    const budgetDoc = doc(firestore, 'users', userId, 'budgets', budgetId);
    updateDoc(budgetDoc, budgetPayload).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetDoc.path, operation: 'update', requestResourceData: budgetPayload }));
    });
  } else {
    // Add new budget
    const budgetsCollection = collection(firestore, 'users', userId, 'budgets');
    addDoc(budgetsCollection, budgetPayload).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetsCollection.path, operation: 'create', requestResourceData: budgetPayload }));
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
