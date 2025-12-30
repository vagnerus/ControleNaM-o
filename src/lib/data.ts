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
  LucideIcon,
  Shapes,
  Shirt,
  Dog,
  Gamepad2,
  Book,
  Bus,
  Baby,
} from 'lucide-react';
import type { Category, Transaction, CreditCard, Account, Budget, FinancialGoal, Icon, Tag } from '@/lib/types';
import { addDoc, collection, Firestore, doc, deleteDoc, runTransaction, increment, updateDoc, writeBatch, query, where, getDocs, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export const ICONS: Icon[] = [
  { id: 'cat_1', name: 'Utensils', component: Utensils },
  { id: 'cat_2', name: 'Car', component: Car },
  { id: 'cat_3', name: 'Home', component: Home },
  { id: 'cat_4', name: 'ShoppingCart', component: ShoppingCart },
  { id: 'cat_5', name: 'Heart', component: Heart },
  { id: 'cat_6', name: 'Film', component: Film },
  { id: 'cat_7', name: 'GraduationCap', component: GraduationCap },
  { id: 'cat_8', name: 'Plane', component: Plane },
  { id: 'cat_9', name: 'Gift', component: Gift },
  { id: 'cat_10', name: 'Receipt', component: Receipt },
  { id: 'cat_11', name: 'Briefcase', component: Briefcase },
  { id: 'cat_12', name: 'PiggyBank', component: PiggyBank },
  { id: 'cat_13', name: 'Landmark', component: Landmark },
  { id: 'cat_14', name: 'Wallet', component: Wallet },
  { id: 'cat_15', name: 'Shapes', component: Shapes },
  { id: 'cat_16', name: 'Shirt', component: Shirt },
  { id: 'cat_17', name: 'Dog', component: Dog },
  { id: 'cat_18', name: 'Gamepad2', component: Gamepad2 },
  { id: 'cat_19', name: 'Book', component: Book },
  { id: 'cat_20', name: 'Bus', component: Bus },
  { id: 'cat_21', name: 'Baby', component: Baby },
];


export const getIcon = (iconName: string): LucideIcon | undefined => {
    return ICONS.find(i => i.name === iconName)?.component;
}

export const getIconComponent = (iconName: string) => {
    const icon = ICONS.find(i => i.name === iconName || i.id === iconName);
    return icon ? icon.component : Receipt; // Default icon
};


// This function is now mostly for providing icon details for a given category name
export const getCategoryDetails = (name: string, categories: Category[]): Partial<Category> => {
    const category = categories.find(c => c.name === name);
    return {
        icon: category?.icon,
    };
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
        return batch.commit().catch(error => {
            console.error("Error creating installments:", error)
            const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: transactionsCollection.path,
                operation: 'create',
                requestResourceData: transactionData,
            }));
        });
    } else { // For single new transactions or updating existing ones
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
            const path = transactionId 
                ? doc(collection(firestore, 'users', userId, 'transactions'), transactionId).path
                : collection(firestore, 'users', userId, 'transactions').path;

            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: path,
                operation: transactionId ? 'update' : 'create',
                requestResourceData: transactionData,
            }));
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
    
    await batch.commit().catch(error => {
        const path = transaction.installmentId 
            ? collection(firestore, 'users', userId, 'transactions').path 
            : doc(firestore, 'users', userId, 'transactions', transaction.id).path;

        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: path,
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
    return setDoc(cardDoc, cardData, { merge: true }).catch(error => {
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
    return setDoc(accountDoc, accountData, { merge: true }).catch(error => {
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
  
  const budgetPayload = { ...budgetData };

  if (budgetId) {
    // Update existing budget
    const budgetDoc = doc(firestore, 'users', userId, 'budgets', budgetId);
    return updateDoc(budgetDoc, budgetPayload).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetDoc.path, operation: 'update', requestResourceData: budgetPayload }));
    });
  } else {
    // Add new budget
    const budgetsCollection = collection(firestore, 'users', userId, 'budgets');
    return addDoc(budgetsCollection, budgetPayload).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: budgetsCollection.path, operation: 'create', requestResourceData: budgetPayload }));
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
export const saveCategory = (firestore: Firestore, userId: string, categoryData: Omit<Category, 'id'>, categoryId?: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  
  if (categoryId) {
    // Update existing category
    const categoryDoc = doc(firestore, 'users', userId, 'categories', categoryId);
    return updateDoc(categoryDoc, categoryData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: categoryDoc.path, operation: 'update', requestResourceData: categoryData }));
    });
  } else {
    // Add new category
    const categoriesCollection = collection(firestore, 'users', userId, 'categories');
    return addDoc(categoriesCollection, categoryData).catch(error => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: categoriesCollection.path, operation: 'create', requestResourceData: categoryData }));
    });
  }
};

export const deleteCategory = (firestore: Firestore, userId: string, categoryId: string) => {
  if (!userId) throw new Error("User must be authenticated.");
  const categoryDoc = doc(firestore, 'users', userId, 'categories', categoryId);
  return deleteDoc(categoryDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: categoryDoc.path, operation: 'delete' }));
  });
};

export const isCategoryInUse = async (firestore: Firestore, userId: string, categoryId: string): Promise<boolean> => {
    if (!userId) throw new Error("User must be authenticated.");

    const transactionsQuery = query(collection(firestore, 'users', userId, 'transactions'), where('categoryId', '==', categoryId));
    const transactionsSnap = await getDocs(transactionsQuery);
    if (!transactionsSnap.empty) {
        return true;
    }

    const budgetsQuery = query(collection(firestore, 'users', userId, 'budgets'), where('categoryId', '==', categoryId));
    const budgetsSnap = await getDocs(budgetsQuery);
    if (!budgetsSnap.empty) {
        return true;
    }

    return false;
};

// Tag Functions
export const saveTag = (firestore: Firestore, userId: string, tagData: Omit<Tag, 'id'>) => {
  if (!userId) throw new Error("User must be authenticated.");
  const tagsCollection = collection(firestore, 'users', userId, 'tags');
  return addDoc(tagsCollection, tagData).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagsCollection.path, operation: 'create', requestResourceData: tagData }));
  });
};

export const deleteTag = async (firestore: Firestore, userId: string, tagId: string) => {
  if (!userId) throw new Error("User must be authenticated.");

  // Check if tag is in use
  const transactionsQuery = query(collection(firestore, 'users', userId, 'transactions'), where('tagIds', 'array-contains', tagId));
  const querySnapshot = await getDocs(transactionsQuery);

  if (!querySnapshot.empty) {
    throw new Error("A tag em uso não pode ser removida.");
  }

  const tagDoc = doc(firestore, 'users', userId, 'tags', tagId);
  return deleteDoc(tagDoc).catch(error => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({ path: tagDoc.path, operation: 'delete' }));
  });
};
