import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBudgets,
  getFinancialGoals,
  getRecentTransactions,
  getSummary,
} from "@/lib/data";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { TransactionList } from "@/components/transactions/TransactionList";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { GoalCard } from "@/components/goals/GoalCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export default async function DashboardPage() {
  const summary = await getSummary();
  const recentTransactions = await getRecentTransactions(5);
  const budgets = await getBudgets();
  const goals = await getFinancialGoals();

  return (
    <div className="flex flex-col">
      <header className="bg-card p-4 sm:p-6 lg:p-8 border-b">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
                <p className="text-muted-foreground">Bem-vindo(a) de volta!</p>
            </div>
            {/* Can add user avatar here */}
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
                <TransactionList transactions={recentTransactions} />
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
                {budgets.slice(0, 3).map((budget) => (
                  <BudgetCard key={budget.id} budget={budget} isCompact />
                ))}
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
              {goals.slice(0, 3).map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
