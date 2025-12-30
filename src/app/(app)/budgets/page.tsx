import { getBudgets, getSummary, getFinancialGoals, getSpendingByCategory } from "@/lib/data";
import { Header } from "@/components/common/Header";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { AIForecast } from "@/components/budgets/AIForecast";

export const revalidate = 0; // Revalidate this page on every request

export default async function BudgetsPage() {
    const budgets = await getBudgets();
    const summary = await getSummary();
    const goals = await getFinancialGoals();
    const spending = await getSpendingByCategory();

    const budgetDataForAI = {
        budgets,
        income: summary.monthlyIncome,
        goals,
        spending,
    };

    return (
        <>
            <Header title="Orçamentos" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8">
                <AIForecast data={budgetDataForAI} />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(budget => (
                        <BudgetCard key={budget.id} budget={budget} />
                    ))}
                </div>
            </main>
        </>
    );
}
