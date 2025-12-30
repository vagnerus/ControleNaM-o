'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { CreditCard, Transaction } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { CreditCardView } from "@/components/cards/CreditCardView";
import { Loader2 } from 'lucide-react';

export default function CardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const cardsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'creditCards') : null
  , [firestore, user]);

  const transactionsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'transactions')) : null
  , [firestore, user]);
  
  const { data: cards, isLoading: cardsLoading } = useCollection<CreditCard>(cardsQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const isLoading = cardsLoading || transactionsLoading;

  if (isLoading) {
    return (
        <>
            <Header title="Cartões de Crédito" />
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </>
    )
  }

  const cardsWithTransactions = (cards || []).map(card => {
    const cardTransactions = (transactions || []).filter(
      (transaction) => transaction.cardId === card.id
    );
    return { ...card, transactions: cardTransactions };
  });

  return (
    <>
      <Header title="Cartões de Crédito" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
        {cardsWithTransactions.map((cardData) => (
          <CreditCardView key={cardData.id} cardData={cardData} />
        ))}
      </main>
    </>
  );
}
