'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Budget, FinancialGoal, Transaction, Category } from "@/lib/types";

import { Header } from "@/components/common/Header";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { AIForecast } from "@/components/budgets/AIForecast";
import { Loader2, PlusCircle } from 'lucide-react';
import { AddBudgetDialog } from '@/components/budgets/AddBudgetDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function BudgetsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

    const categoriesQuery = useMemoFirebase(() =>
        user ? query(collection(firestore, 'users', user.uid, 'categories')) : null
    , [firestore, user]);

    // Data fetching
    const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);
    const { data: goals, isLoading: goalsLoading } = useCollection<FinancialGoal>(goalsQuery);
    const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
    const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

    const { monthlyIncome, spendingByCategory } = useMemo(() => {
        if (!transactions || !categories) return { monthlyIncome: 0, spendingByCategory: {} };

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
            const category = categories.find(c => c.id === t.categoryId);
            if (category) {
                 spending[category.name] = (spending[category.name] || 0) + t.amount;
            }
        });

        return { monthlyIncome: income, spendingByCategory: spending };
    }, [transactions, categories]);
    
    const budgetDataForAI = useMemo(() => ({
        budgets: budgets || [],
        income: monthlyIncome,
        goals: goals || [],
        spending: spendingByCategory,
    }), [budgets, monthlyIncome, goals, spendingByCategory]);
    
    const isLoading = budgetsLoading || goalsLoading || transactionsLoading || categoriesLoading;

    if (isLoading) {
        return (
            <ErrorBoundary>
                <Header title="Planejamento" >
                    <AddBudgetDialog />
                </Header>
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </ErrorBoundary>
        )
    }

    return (
        <ErrorBoundary>
            <Header title="Planejamento">
                <AddBudgetDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
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
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Orçamento
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(budgets || []).map(budget => (
                            <ErrorBoundary key={budget.id}>
                                <BudgetCard budget={budget} transactions={transactions || []} />
                            </ErrorBoundary>
                        ))}
                    </div>
                )}
            </main>
        </ErrorBoundary>
    );
}