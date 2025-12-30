'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Transaction } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { MonthlyOverviewChart, type MonthlyData } from '@/components/charts/MonthlyOverviewChart';
import { subMonths, format, getMonth, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PerformancePage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const transactionsQuery = useMemoFirebase(() => 
        user ? query(collection(firestore, 'users', user.uid, 'transactions')) : null
    , [firestore, user]);

    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
    
    const monthlyData: MonthlyData[] = useMemo(() => {
        const data: MonthlyData[] = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = subMonths(today, i);
            const monthName = format(date, 'MMM', { locale: ptBR });
            
            data.push({
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                income: 0,
                expenses: 0,
            });
        }
        
        if (transactions) {
            transactions.forEach(transaction => {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = getMonth(transactionDate);
                const transactionYear = getYear(transactionDate);

                for (let i = 5; i >= 0; i--) {
                    const date = subMonths(today, i);
                    const month = getMonth(date);
                    const year = getYear(date);
                    
                    if (transactionMonth === month && transactionYear === year) {
                        const monthIndex = 5 - i;
                        if (transaction.type === 'income') {
                            data[monthIndex].income += transaction.amount;
                        } else {
                            data[monthIndex].expenses += transaction.amount;
                        }
                    }
                }
            });
        }

        return data;
    }, [transactions]);


    if (transactionsLoading) {
        return (
            <>
                <Header title="Meu Desempenho" />
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </>
        )
    }

  return (
    <>
      <Header title="Meu Desempenho" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Evolução Financeira</CardTitle>
                <CardDescription>Receitas vs. Despesas nos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <MonthlyOverviewChart data={monthlyData} />
                </div>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
