
'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { RecurringTransaction, Account, Category } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddRecurringDialog } from '@/components/recurring/AddRecurringDialog';
import { RecurringTransactionList } from '@/components/recurring/RecurringTransactionList';

export default function RecurringTransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const recurringQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'recurringTransactions'), orderBy('description', 'asc')) : null
  , [firestore, user]);

  const accountsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'accounts') : null
  , [firestore, user]);

  const categoriesQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'categories') : null
  , [firestore, user]);

  const { data: recurring, isLoading: recurringLoading } = useCollection<RecurringTransaction>(recurringQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const isLoading = recurringLoading || accountsLoading || categoriesLoading;

  return (
    <>
      <Header title="Transações Recorrentes">
        <AddRecurringDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (recurring || []).length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Nenhuma transação recorrente</CardTitle>
              <CardDescription>Adicione suas contas e receitas recorrentes para automatizar seu controle.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddRecurringDialog />
            </CardContent>
          </Card>
        ) : (
          <RecurringTransactionList 
            recurringTransactions={recurring || []} 
            accounts={accounts || []} 
            categories={categories || []} 
          />
        )}
      </main>
    </>
  );
}
