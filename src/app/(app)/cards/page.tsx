
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Account, CreditCard, Transaction, Category, Tag } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { CreditCardView } from "@/components/cards/CreditCardView";
import { Loader2 } from 'lucide-react';
import { AddCardDialog } from '@/components/cards/AddCardDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';

export default function CardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const cardsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'creditCards') : null
  , [firestore, user]);

  const transactionsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'transactions')) : null
  , [firestore, user]);
  
  const accountsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'accounts') : null
  , [firestore, user]);

  const categoriesQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'categories') : null
  , [firestore, user]);

  const tagsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'tags') : null
  , [firestore, user]);

  const { data: cards, isLoading: cardsLoading } = useCollection<CreditCard>(cardsQuery);
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);

  const isLoading = cardsLoading || transactionsLoading || accountsLoading || categoriesLoading || tagsLoading;

  const cardsWithTransactions = (cards || []).map(card => {
    const cardTransactions = (transactions || []).filter(
      (transaction) => transaction.creditCardId === card.id
    );
    const spentAmount = cardTransactions.reduce((sum, t) => sum + t.amount, 0);
    return { ...card, transactions: cardTransactions, spent: spentAmount };
  });

  return (
    <>
      <Header title="Cartões de Crédito">
        <div className="flex items-center gap-2">
            <AddTransactionDialog />
            <AddCardDialog />
        </div>
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
                    <CreditCardView key={cardData.id} cardData={cardData} accounts={accounts || []} categories={categories || []} tags={tags || []} />
                ))}
            </div>
        )}
      </main>
    </>
  );
}
