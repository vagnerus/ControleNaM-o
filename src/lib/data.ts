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
} from 'lucide-react';
import type { Category, Transaction, CreditCard } from '@/lib/types';
import { addDoc, collection, Firestore, doc, deleteDoc } from 'firebase/firestore';
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
  { id 'cat_8', name: 'Viagem', icon: Plane, type: 'expense' },
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
  transaction: Omit<Transaction, 'id'> & { totalInstallments?: number }
) => {
  if (!userId) {
    throw new Error('User must be authenticated to add a transaction.');
  }
  const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
  
  if (transaction.totalInstallments && transaction.totalInstallments > 1) {
    const installmentAmount = transaction.amount / transaction.totalInstallments;
    for (let i = 0; i < transaction.totalInstallments; i++) {
        const installmentDate = addMonths(new Date(transaction.date), i);
        const installmentTransaction = {
            ...transaction,
            amount: installmentAmount,
            date: installmentDate.toISOString(),
            installmentNumber: i + 1,
        };

        addDoc(transactionsCollection, installmentTransaction)
            .catch(error => {
                console.error("Error adding installment transaction: ", error);
                // We can decide how to handle partial failures. 
                // Maybe emit one error for the whole batch.
            });
    }
  } else {
    // Non-installment or single installment transaction
    addDoc(transactionsCollection, transaction)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: transactionsCollection.path,
            operation: 'create',
            requestResourceData: transaction,
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
