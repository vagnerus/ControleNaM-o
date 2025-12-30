
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import type { Transaction, Budget, FinancialGoal, Account, Category, Tag } from '@/lib/types';
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
import { SettingsContext } from '@/contexts/SettingsContext';
import { useContext } from 'react';
import { AddTransactionDialog } from '@/components/transactions/AddTransactionDialog';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useContext(SettingsContext);

  // Memoize Firestore queries
  const transactionsQuery = useMemoFirebase(() => 
    user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('date', 'desc')) : null
  , [firestore, user]);
  
  const accountsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'accounts')) : null
  , [firestore, user]);

  const budgetsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'budgets'), limit(2)) : null
  , [firestore, user]);

  const goalsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'financialGoals'), limit(3)) : null
  , [firestore, user]);

  const categoriesQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'categories')) : null
  , [firestore, user]);

  const tagsQuery = useMemoFirebase(() =>
    user ? query(collection(firestore, 'users', user.uid, 'tags')) : null
  , [firestore, user]);


  // Fetch data using hooks
  const { data: allTransactions, isLoading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);
  const { data: accounts, isLoading: accountsLoading } = useCollection<Account>(accountsQuery);
  const { data: budgets, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);
  const { data: goals, isLoading: goalsLoading } = useCollection<FinancialGoal>(goalsQuery);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  const { data: tags, isLoading: tagsLoading } = useCollection<Tag>(tagsQuery);
  
  const recentTransactions = useMemo(() => allTransactions?.slice(0, 5) || [], [allTransactions]);

  const { summary, monthlyTransactions } = useMemo(() => {
    if (!allTransactions || !accounts) return { summary: { income: 0, expenses: 0, balance: 0 }, monthlyTransactions: [] };

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyTrans = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });

    const income = monthlyTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthlyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return { 
        summary: { income, expenses, balance: totalBalance },
        monthlyTransactions: monthlyTrans
    };
  }, [allTransactions, accounts]);
  
  const isLoading = transactionsLoading || budgetsLoading || goalsLoading || accountsLoading || categoriesLoading || tagsLoading;

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
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
            <AddTransactionDialog />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 grid gap-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            title="Receitas do Mês"
            value={summary.income}
            icon={<TrendingUp className="text-emerald-500" />}
          />
          <SummaryCard
            title="Despesas do Mês"
            value={summary.expenses}
            icon={<TrendingDown className="text-red-500" />}
          />
          <SummaryCard
            title="Saldo Total"
            value={summary.balance}
            icon={<Wallet />}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {settings['pending-transactions'] && (
                <div className="lg:col-span-2">
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
                        <TransactionList transactions={recentTransactions} accounts={accounts || []} categories={categories || []} tags={tags || []}/>
                    </CardContent>
                    </Card>
                </div>
            )}
            
            {settings['budget-summary'] && (
                <div className="lg:col-span-1">
                    <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Planejamento</CardTitle>
                            <CardDescription>Seu progresso de gastos este mês.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/budgets">
                            Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {budgets && budgets.length > 0 ? (
                        budgets.map((budget) => (
                            <BudgetCard key={budget.id} budget={budget} transactions={monthlyTransactions} />
                        ))
                        ) : (
                            <p className="text-sm text-muted-foreground p-4 text-center">Nenhum planejamento encontrado.</p>
                        )}
                    </CardContent>
                    </Card>
                </div>
            )}
        </div>
        
        {settings['goals'] && (
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
                {goals && goals.length > 0 ? (
                    goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground col-span-full p-4 text-center">Nenhum objetivo encontrado.</p>
                )}
                </CardContent>
            </Card>
            </section>
        )}
      </main>
    </div>
  );
}
