import { getFinancialGoals } from "@/lib/data";
import { Header } from "@/components/common/Header";
import { GoalCard } from "@/components/goals/GoalCard";

export default async function GoalsPage() {
  const goals = await getFinancialGoals();

  return (
    <>
      <Header title="Objetivos Financeiros" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      </main>
    </>
  );
}
