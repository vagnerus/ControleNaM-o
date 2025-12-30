'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Budget, FinancialGoal, Transaction } from "@/lib/types";

import { Header } from "@/components/common/Header";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { AIForecast } from "@/components/budgets/AIForecast";
import { Loader2 } from 'lucide-react';
import { AddBudgetDialog } from '@/components/budgets/AddBudgetDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BudgetsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Queries
    const budgetsQuery = useMemoFirebase(() => 
        user ? collection(firestore, 'users', user.uid, 'budgets') : null
    , [firestore, user]);
    
    const goalsQuery = useMemoFirebase(() => 
        user ? collection(firestore, 'users', user.uid, 'financialGoals') : null
    , [firestore, user]);

    const transactionsQuery = useMemoFirebase(() =>
        user ? query(collection(firestore, 'users', user.uid, 'transactions')) : null
    , [firestore, user]);

    // Data fetching
    const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);
    const { data: goals, isLoading: goalsLoading } = useCollection<FinancialGoal>(goalsQuery);
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

    const { summary, spendingByCategory } = useMemo(() => {
        if (!transactions) return { summary: { income: 0, expenses: 0, balance: 0 }, spendingByCategory: {} };

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const currentMonthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        });

        const income = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

        const spending: Record<string, number> = {};
        currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
            spending[t.category] = (spending[t.category] || 0) + t.amount;
        });

        return { summary: { income }, spendingByCategory: spending };
    }, [transactions]);
    
    const budgetDataForAI = {
        budgets: budgets || [],
        income: summary.income,
        goals: goals || [],
        spending: spendingByCategory,
    };
    
    const isLoading = budgetsLoading || goalsLoading || transactionsLoading;

    if (isLoading) {
        return (
            <>
                <Header title="Orçamentos" >
                    <AddBudgetDialog />
                </Header>
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Orçamentos">
                <AddBudgetDialog />
            </Header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
                <AIForecast data={budgetDataForAI} />

                 {(budgets || []).length === 0 ? (
                    <Card className="flex flex-col items-center justify-center h-96 border-dashed">
                        <CardHeader className="text-center">
                        <CardTitle>Nenhum orçamento encontrado</CardTitle>
                        <CardDescription>Crie seu primeiro orçamento para começar a planejar.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddBudgetDialog />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(budgets || []).map(budget => (
                            <BudgetCard key={budget.id} budget={budget} transactions={transactions || []} />
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
