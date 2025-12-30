
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Header } from "@/components/common/Header";
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { CategoryChart } from '@/components/charts/CategoryChart';

export default function ReportsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'users', user.uid, 'transactions')) : null
    , [firestore, user]);

    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const spendingByCategory = useMemo(() => {
        if (!transactions) return {};

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const currentMonthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' && transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        });

        const spending: Record<string, number> = {};
        currentMonthTransactions.forEach(t => {
            spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount;
        });

        return spending;
    }, [transactions]);
    
    if (transactionsLoading) {
        return (
            <>
                <Header title="Relatórios" />
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </>
        )
    }
  
  return (
    <>
      <Header title="Relatórios" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Análise dos seus gastos no mês atual.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <CategoryChart data={spendingByCategory} />
                </div>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
