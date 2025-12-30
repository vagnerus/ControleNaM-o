
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Transaction, Account, Category, Tag } from '@/lib/types';
import { TransactionList } from "@/components/transactions/TransactionList";
import { Header } from "@/components/common/Header";
import { AddTransactionDialog } from "@/components/transactions/AddTransactionDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
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

  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);

  const isLoading = transactionsLoading || accountsLoading || categoriesLoading || tagsLoading;

  const safeTransactions = transactions || [];
  const safeAccounts = accounts || [];
  const safeCategories = categories || [];
  const safeTags = tags || [];
  
  const incomeTransactions = safeTransactions.filter(t => t.type === 'income');
  const expenseTransactions = safeTransactions.filter(t => t.type === 'expense');

  const renderTransactionList = (list: Transaction[]) => {
    if (isLoading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center h-96 border-dashed mt-4">
          <CardHeader className="text-center">
            <CardTitle>Nenhuma transação encontrada</CardTitle>
            <CardDescription>Adicione sua primeira transação para começar.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddTransactionDialog />
          </CardContent>
        </Card>
      );
    }
    return <TransactionList transactions={list} accounts={safeAccounts} categories={safeCategories} tags={safeTags} />;
  };
  
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
          <TabsContent value="all" className="mt-4">
            {renderTransactionList(safeTransactions)}
          </TabsContent>
          <TabsContent value="income" className="mt-4">
            {renderTransactionList(incomeTransactions)}
          </TabsContent>
          <TabsContent value="expenses" className="mt-4">
            {renderTransactionList(expenseTransactions)}
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
    
