'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Transaction, Account } from '@/lib/types';
import { TransactionList } from "@/components/transactions/TransactionList";
import { Header } from "@/components/common/Header";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
  , [firestore, user]);

  const accountsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'accounts') : null
  , [firestore, user]);

  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);

  const isLoading = transactionsLoading || accountsLoading;

  if (isLoading) {
    return (
      <>
        <Header title="Transações">
          <AddTransactionDialog />
        </Header>
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const safeTransactions = transactions || [];
  const safeAccounts = accounts || [];

  return (
    <>
      <Header title="Transações">
        <AddTransactionDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="income">Receitas</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <TransactionList transactions={safeTransactions} accounts={safeAccounts} />
          </TabsContent>
          <TabsContent value="income">
            <TransactionList transactions={safeTransactions.filter(t => t.type === 'income')} accounts={safeAccounts} />
          </TabsContent>
          <TabsContent value="expenses">
            <TransactionList transactions={safeTransactions.filter(t => t.type === 'expense')} accounts={safeAccounts} />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
