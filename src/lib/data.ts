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
import type { Category, Transaction } from '@/lib/types';
import { addDoc, collection, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  transaction: Omit<Transaction, 'id'>
) => {
  if (!userId) {
    throw new Error('User must be authenticated to add a transaction.');
  }
  const transactionsCollection = collection(firestore, 'users', userId, 'transactions');
  
  // Non-blocking update
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
};
