'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export default function ReportsPage() {
  return (
    <>
      <Header title="Relatórios" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <BarChart className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Relatórios em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para visualizações detalhadas de suas finanças!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Planejamos adicionar gráficos de fluxo de caixa, análise de despesas por categoria e muito mais.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
