
'use client';

import type { Category, Transaction, CreditCard, Account, Budget, FinancialGoal } from '@/lib/types';
import { addDoc, collection, Firestore, doc, deleteDoc, runTransaction, increment, updateDoc, writeBatch } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    if (oldTransactionData) {
        const oldAccountRef = doc(firestore, 'users', userId, 'accounts', oldTransactionData.accountId);
        const oldBalanceChange = oldTransactionData.type === 'income' ? -oldTransactionData.amount : oldTransactionData.amount;
        tx.update(oldAccountRef, { balance: increment(oldBalanceChange) });
    }

    // Apply new balance change
    const newAccountRef = doc(firestore, 'users', userId, 'accounts', transactionData.accountId);
    const newBalanceChange = transactionData.type === 'income' ? transactionData.amount : -transactionData.amount;
    tx.update(newAccountRef, { balance: increment(newBalanceChange) });
    
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
        
        const accountRef = doc(firestore, 'users', userId, 'accounts', transaction.accountId);
        const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        tx.update(accountRef, { balance: increment(balanceChange) });
        
        tx.delete(transactionDoc);
    }).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: transactionDoc.path,
            operation: 'delete'
        }));
    });
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
  const cardDoc = doc(firestore, 'users', userId, 'creditCards', cardId);
  
  // TODO: Add logic to delete associated transactions or handle them
  
  return deleteDoc(cardDoc)
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
    return updateDoc(accountDoc, accountData).catch(error => {
      console.error("Error updating account: ", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: accountDoc.path,
        operation: 'update',
        requestResourceData: accountData,
      }));
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
) => {
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
export const saveTag = (firestore: Firestore, userId: string, tagData: Omit<Tag, 'id'>, tagId?: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  if (tagId) {
    const tagDoc = doc(firestore, 'users', userId, 'tags', tagId);
    return updateDoc(tagDoc, tagData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagDoc.path, operation: 'update', requestResourceData: tagData }));
    });
  } else {
    const tagsCollection = collection(firestore, 'users', userId, 'tags');
    return addDoc(tagsCollection, tagData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagsCollection.path, operation: 'create', requestResourceData: tagData }));
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
