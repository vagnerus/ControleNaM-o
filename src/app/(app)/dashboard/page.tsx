'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { Transaction, Budget, FinancialGoal } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { GoalCard } from "@/components/goals/GoalCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp, Wallet, Loader2 } from "lucide-react";
import { CategoryChart } from "@/components/dashboard/CategoryChart";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Memoize Firestore queries
  const transactionsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
  , [firestore, user]);

  const recentTransactionsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(5)) : null
  , [firestore, user]);

  const budgetsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'budgets') : null
  , [firestore, user]);

  const goalsQuery = useMemoFirebase(() =>
    user ? collection(firestore, 'users', user.uid, 'financialGoals') : null
  , [firestore, user]);

  // Fetch data using hooks
  const { data: transactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: recentTransactions, isLoading: recentTransactionsLoading } = useCollection<Transaction>(recentTransactionsQuery);
  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: goals, isLoading: goalsLoading } = useCollection<FinancialGoal>(goalsQuery);

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
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;

    const spending: Record<string, number> = {};
    currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
    });

    return { summary: { income, expenses, balance }, spendingByCategory: spending };
  }, [transactions]);
  
  const isLoading = transactionsLoading || recentTransactionsLoading || budgetsLoading || goalsLoading;

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col">
      <header className="bg-card p-4 sm:p-6 lg:p-8 border-b">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                <p className="text-muted-foreground">Bem-vindo(a) de volta, {user?.displayName || 'usuário'}!</p>
            </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid gap-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Receitas"
            value={summary.income}
            icon={<TrendingUp className="text-green-500" />}
          />
          <SummaryCard
            title="Despesas"
            value={summary.expenses}
            icon={<TrendingDown className="text-red-500" />}
          />
          <SummaryCard
            title="Saldo"
            value={summary.balance}
            icon={<Wallet />}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Despesas por Categoria</CardTitle>
                    <CardDescription>
                      Visão geral dos seus gastos no mês.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <CategoryChart data={spendingByCategory} />
                  </CardContent>
                </Card>
            </div>
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Orçamentos</CardTitle>
                  <CardDescription>Seu progresso de gastos este mês.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/budgets">
                    Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {budgets?.slice(0, 2).map((budget) => (
                  <BudgetCard key={budget.id} budget={budget} transactions={transactions || []} isCompact />
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>
                    Suas últimas 5 movimentações.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/transactions">
                    Ver todas <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <TransactionList transactions={recentTransactions || []} />
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Objetivos Financeiros</CardTitle>
                    <CardDescription>Acompanhe seu progresso para realizar seus sonhos.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/goals">
                    Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {goals?.slice(0, 3).map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
