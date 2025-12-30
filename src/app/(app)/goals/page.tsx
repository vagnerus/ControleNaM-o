'use client';

import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { FinancialGoal } from '@/lib/types';
import { Header } from "@/components/common/Header";
import { GoalCard } from "@/components/goals/GoalCard";
import { Loader2 } from 'lucide-react';
import { AddGoalDialog } from '@/components/goals/AddGoalDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const goalsQuery = useMemoFirebase(() => 
    user ? collection(firestore, 'users', user.uid, 'financialGoals') : null
  , [firestore, user]);

  const { data: goals, isLoading } = useCollection<FinancialGoal>(goalsQuery);
  
  if (isLoading) {
    return (
        <>
            <Header title="Objetivos Financeiros">
                <AddGoalDialog />
            </Header>
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </>
    )
  }

  return (
    <>
      <Header title="Objetivos Financeiros">
        <AddGoalDialog />
      </Header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {(goals || []).length === 0 ? (
            <Card className="flex flex-col items-center justify-center h-96 border-dashed">
                <CardHeader className="text-center">
                <CardTitle>Nenhum objetivo encontrado</CardTitle>
                <CardDescription>Crie seu primeiro objetivo para realizar seus sonhos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddGoalDialog />
                </CardContent>
            </Card>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(goals || []).map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                ))}
            </div>
        )}
      </main>
    </>
  );
}
