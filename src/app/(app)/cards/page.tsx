'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { CreditCard, Transaction } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { CreditCardView } from "@/components/cards/CreditCardView";
import { Loader2 } from 'lucide-react';
import { AddCardDialog } from '@/components/cards/AddCardDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

  const cardsWithTransactions = (cards || []).map(card => {
    const cardTransactions = (transactions || []).filter(
      (transaction) => transaction.cardId === card.id
    );
    const spentAmount = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
    return { ...card, transactions: cardTransactions, spent: spentAmount };
  });

  return (
    <>
      <Header title="Cartões de Crédito">
        <AddCardDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : cardsWithTransactions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Nenhum cartão encontrado</CardTitle>
              <CardDescription>Adicione seu primeiro cartão de crédito para começar.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddCardDialog />
            </CardContent>
          </Card>
        ) : (
            <div className="space-y-8">
                {cardsWithTransactions.map((cardData) => (
                    <CreditCardView key={cardData.id} cardData={cardData} />
                ))}
            </div>
        )}
      </main>
    </>
  );
}
