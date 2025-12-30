

'use client';

import React from 'react';
import type { Category, Transaction, CreditCard, Account, Budget, FinancialGoal, Tag, RecurringTransaction } from '@/lib/types';
import { addDoc, collection, Firestore, doc, deleteDoc, runTransaction, increment, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import * as lucide from "lucide-react"

export type BankIcon = {
  id: string;
  name: string;
  component: React.ComponentType<any>;
};

export const ICONS = Object.keys(lucide).filter(key => typeof (lucide as any)[key] === 'object' && 'displayName' in (lucide as any)[key]).map(key => ({
    id: key,
    name: key,
    component: (lucide as any)[key]
}));

export const BANK_ICONS: BankIcon[] = [
    { id: 'Landmark', name: 'Outro', component: lucide.Landmark },
    { id: 'piggy-bank', name: 'Poupança', component: lucide.PiggyBank },
    { id: 'wallet', name: 'Carteira', component: lucide.Wallet },
    { id: 'bradesco', name: 'Bradesco', component: () => <div className="font-bold text-red-600">B</div> },
    { id: 'itau', name: 'Itaú', component: () => <div className="font-bold text-white bg-orange-500 rounded-sm px-1">Itaú</div> },
    { id: 'nubank', name: 'Nubank', component: () => <div className="font-bold text-white bg-purple-600 rounded-sm px-1">Nu</div> },
    { id: 'santander', name: 'Santander', component: () => <div className="font-bold text-white bg-red-500 rounded-sm px-1">Santander</div> },
    { id: 'caixa', name: 'Caixa', component: () => <div className="font-bold text-white bg-blue-700 rounded-sm px-1">Caixa</div> },
    { id: 'banco-do-brasil', name: 'Banco do Brasil', component: () => <div className="font-bold text-yellow-400 bg-blue-800 rounded-sm px-1">BB</div> },
    { id: 'inter', name: 'Inter', component: () => <div className="font-bold text-white bg-orange-600 rounded-sm px-1">Inter</div> },
];

export const getBankIcon = (id: string | undefined): BankIcon => {
    if (!id) {
        return { id: 'Landmark', name: 'Outro', component: lucide.Landmark };
    }
    const icon = BANK_ICONS.find(i => i.id === id);
    return icon || { id: 'Landmark', name: 'Outro', component: lucide.Landmark };
}

export const getIconComponent = (name: string): React.ComponentType<any> => {
    const icon = ICONS.find(i => i.name === name);
    return icon ? icon.component : lucide.HelpCircle;
}

export const isCategoryInUse = async (firestore: Firestore, userId: string, categoryId: string): Promise<boolean> => {
    const transactionsQuery = query(collection(firestore, `users/${userId}/transactions`), where('categoryId', '==', categoryId));
    const budgetsQuery = query(collection(firestore, `users/${userId}/budgets`), where('categoryId', '==', categoryId));

    const [transactionsSnap, budgetsSnap] = await Promise.all([
        getDocs(transactionsQuery),
        getDocs(budgetsQuery),
    ]);

    return !transactionsSnap.empty || !budgetsSnap.empty;
};


export const getCategoryDetails = (name: string, categories: Category[]): Partial<Category> => {
    const category = categories.find(c => c.name === name);
    return {
        icon: category?.icon,
    };
};

export const saveTransaction = (
  firestore: Firestore,
  userId: string,
  transactionData: Omit<Transaction, 'id'>,
  transactionId?: string
) => {
  if (!userId) {
    throw new Error('User must be authenticated.');
  }

  // Do not update account balance if transaction is on a credit card
  if (transactionData.creditCardId) {
      const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
      const newDocRef = transactionId ? doc(transactionsCollection, transactionId) : doc(transactionsCollection);
      
      const operation = transactionId ? updateDoc(newDocRef, transactionData) : addDoc(transactionsCollection, transactionData);

      return operation.catch(error => {
          const path = transactionId ? newDocRef.path : transactionsCollection.path;
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: path,
              operation: transactionId ? 'update' : 'create',
              requestResourceData: transactionData,
          }));
      });
  }

  return runTransaction(firestore, async (tx) => {
    const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
    const newDocRef = transactionId ? doc(transactionsCollection, transactionId) : doc(transactionsCollection);
    let oldTransactionData: Transaction | null = null;
    
    if (transactionId) {
        const oldDoc = await tx.get(newDocRef);
        if (oldDoc.exists()) {
            oldTransactionData = oldDoc.data() as Transaction;
        }
    }

    // Revert old balance if it's an update
    if (oldTransactionData && !oldTransactionData.creditCardId) {
        const oldAccountRef = doc(firestore, 'users', userId, 'accounts', oldTransactionData.accountId);
        const oldBalanceChange = oldTransactionData.type === 'income' ? -oldTransactionData.amount : oldTransactionData.amount;
        tx.update(oldAccountRef, { balance: increment(oldBalanceChange) });
    }

    // Apply new balance change if it's not a credit card transaction
    if (!transactionData.creditCardId) {
        const newAccountRef = doc(firestore, 'users', userId, 'accounts', transactionData.accountId);
        const newBalanceChange = transactionData.type === 'income' ? transactionData.amount : -transactionData.amount;
        tx.update(newAccountRef, { balance: increment(newBalanceChange) });
    }
    
    tx.set(newDocRef, { ...transactionData, date: transactionData.date.toString() });

  }).catch(error => {
    const path = transactionId 
        ? doc(collection(firestore, 'users', userId, 'transactions'), transactionId).path
        : collection(firestore, 'users', userId, 'transactions').path;

    errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: path,
        operation: transactionId ? 'update' : 'create',
        requestResourceData: transactionData,
    }));
  });
};

export const deleteTransaction = async (firestore: Firestore, userId: string, transactionId: string) => {
    if (!userId) throw new Error("User must be authenticated.");

    const transactionDoc = doc(firestore, 'users', userId, 'transactions', transactionId);

    return runTransaction(firestore, async (tx) => {
        const transactionSnapshot = await tx.get(transactionDoc);
        if (!transactionSnapshot.exists()) {
            throw "Transaction not found!";
        }
        const transaction = transactionSnapshot.data() as Transaction;
        
        // Only adjust balance if it's not a credit card transaction
        if (!transaction.creditCardId) {
            const accountRef = doc(firestore, 'users', userId, 'accounts', transaction.accountId);
            const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
            tx.update(accountRef, { balance: increment(balanceChange) });
        }
        
        tx.delete(transactionDoc);
    }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionDoc.path,
            operation: 'delete'
        }));
    });
};

export const saveCard = async (
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
    return updateDoc(cardDoc, cardData).catch(error => {
      console.error("Error updating card: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: cardDoc.path,
        operation: 'update',
        requestResourceData: cardData,
      }));
    });
  } else {
    const cardsCollection = collection(firestore, 'users', userId, 'creditCards');
    return addDoc(cardsCollection, cardData).catch(error => {
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
  
  const cardDocRef = doc(firestore, 'users', userId, 'creditCards', cardId);
  const transactionsQuery = query(collection(firestore, 'users', userId, 'transactions'), where('creditCardId', '==', cardId));

  return runTransaction(firestore, async (transaction) => {
    // 1. Get all transactions associated with the card
    const transactionsSnapshot = await getDocs(transactionsQuery);

    // 2. Delete each of those transactions
    transactionsSnapshot.forEach(doc => {
      transaction.delete(doc.ref);
    });

    // 3. Delete the card itself
    transaction.delete(cardDocRef);
  }).catch(error => {
    console.error("Error deleting card and its transactions: ", error);
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: cardDocRef.path,
      operation: 'delete',
    }));
  });
}

export const saveAccount = (
  firestore: Firestore,
  userId: string,
  accountData: Partial<Omit<Account, 'id'>>,
  accountId?: string
): Promise<any> => {
  if (!userId) {
    throw new Error('User must be authenticated.');
  }
  
  if (accountId) {
    const accountDoc = doc(firestore, 'users', userId, 'accounts', accountId);
    return updateDoc(accountDoc, accountData).catch(error => {
      console.error("Error updating account: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: accountDoc.path,
        operation: 'update',
        requestResourceData: accountData,
      }));
      throw error;
    });
  } else {
    const accountsCollection = collection(firestore, 'users', userId, 'accounts');
    return addDoc(accountsCollection, accountData).catch(error => {
      console.error("Error adding account: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: accountsCollection.path,
        operation: 'create',
        requestResourceData: accountData,
      }));
      throw error;
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
  
  return deleteDoc(accountDoc)
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
  
  if (budgetId) {
    // Update existing budget
    const budgetDoc = doc(firestore, 'users', userId, 'budgets', budgetId);
    return updateDoc(budgetDoc, budgetData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetDoc.path, operation: 'update', requestResourceData: budgetData }));
    });
  } else {
    // Add new budget
    const budgetsCollection = collection(firestore, 'users', userId, 'budgets');
    return addDoc(budgetsCollection, budgetData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetsCollection.path, operation: 'create', requestResourceData: budgetData }));
    });
  }
};

export const deleteBudget = (firestore: Firestore, userId: string, budgetId: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const budgetDoc = doc(firestore, 'users', userId, 'budgets', budgetId);
  return deleteDoc(budgetDoc).catch(error => {
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
    return updateDoc(goalDoc, goalData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: goalDoc.path, operation: 'update', requestResourceData: goalData }));
    });
  } else {
    // Add new goal
    return addDoc(goalsCollection, goalData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: goalsCollection.path, operation: 'create', requestResourceData: goalData }));
    });
  }
};

export const deleteGoal = (firestore: Firestore, userId: string, goalId: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const goalDoc = doc(firestore, 'users', userId, 'financialGoals', goalId);
  return deleteDoc(goalDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: goalDoc.path, operation: 'delete' }));
  });
};

// Category Functions
export const saveCategory = (
  firestore: Firestore,
  userId: string,
  categoryData: Omit<Category, 'id'>,
  categoryId?: string
): Promise<any> => {
  if (!userId) {
    throw new Error('User must be authenticated.');
  }
  
  if (categoryId) {
    const categoryDoc = doc(firestore, 'users', userId, 'categories', categoryId);
    return updateDoc(categoryDoc, categoryData).catch(error => {
      console.error("Error updating category: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: categoryDoc.path,
        operation: 'update',
        requestResourceData: categoryData,
      }));
      throw error;
    });
  } else {
    const categoriesCollection = collection(firestore, 'users', userId, 'categories');
    return addDoc(categoriesCollection, categoryData).catch(error => {
      console.error("Error adding category: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: categoriesCollection.path,
        operation: 'create',
        requestResourceData: categoryData,
      }));
      throw error;
    });
  }
};

export const deleteCategory = (
  firestore: Firestore,
  userId: string,
  categoryId: string
) => {
  if (!userId) {
    throw new Error('User must be authenticated to delete a category.');
  }
  const categoryDoc = doc(firestore, 'users', userId, 'categories', categoryId);
  
  return deleteDoc(categoryDoc)
    .catch(error => {
      console.error("Error deleting category: ", error);
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: categoryDoc.path,
          operation: 'delete',
        })
      );
    });
};


// Tag Functions
export const saveTag = (firestore: Firestore, userId: string, tagData: Omit<Tag, 'id'>, tagId?: string): Promise<any> => {
  if (!userId) throw new Error("User must be authenticated.");
  if (tagId) {
    const tagDoc = doc(firestore, 'users', userId, 'tags', tagId);
    return updateDoc(tagDoc, tagData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagDoc.path, operation: 'update', requestResourceData: tagData }));
      throw error;
    });
  } else {
    const tagsCollection = collection(firestore, 'users', userId, 'tags');
    return addDoc(tagsCollection, tagData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagsCollection.path, operation: 'create', requestResourceData: tagData }));
      throw error;
    });
  }
};

export const deleteTag = async (firestore: Firestore, userId: string, tagId: string) => {
  if (!userId) throw new Error("User must be authenticated.");

  // Check if tag is in use in any transaction
  const transactionsRef = collection(firestore, 'users', userId, 'transactions');
  // This is a simplified check. For production, you'd want to query where 'tagIds' array-contains tagId.
  // This requires a composite index on tagIds.
  // const q = query(transactionsRef, where('tagIds', 'array-contains', tagId));
  // const querySnapshot = await getDocs(q);
  // if (!querySnapshot.empty) {
  //   throw new Error("Cannot delete a tag that is currently in use.");
  // }

  const tagDoc = doc(firestore, 'users', userId, 'tags', tagId);
  return deleteDoc(tagDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagDoc.path, operation: 'delete' }));
    throw error; // Re-throw to be caught in the component
  });
};

// Recurring Transaction Functions
export const saveRecurringTransaction = (
  firestore: Firestore,
  userId: string,
  recurringData: Omit<RecurringTransaction, 'id'>,
  recurringId?: string
) => {
  if (!userId) throw new Error("User must be authenticated.");
  const recurringCollection = collection(firestore, 'users', userId, 'recurringTransactions');

  if (recurringId) {
    const recurringDoc = doc(firestore, 'users', userId, 'recurringTransactions', recurringId);
    return updateDoc(recurringDoc, recurringData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recurringDoc.path,
        operation: 'update',
        requestResourceData: recurringData,
      }));
    });
  } else {
    return addDoc(recurringCollection, recurringData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: recurringCollection.path,
        operation: 'create',
        requestResourceData: recurringData,
      }));
    });
  }
};

export const deleteRecurringTransaction = (
  firestore: Firestore,
  userId: string,
  recurringId: string
) => {
  if (!userId) throw new Error("User must be authenticated.");
  const recurringDoc = doc(firestore, 'users', userId, 'recurringTransactions', recurringId);
  return deleteDoc(recurringDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: recurringDoc.path,
      operation: 'delete',
    }));
  });
};
