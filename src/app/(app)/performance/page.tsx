'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function PerformancePage() {
  return (
    <>
      <Header title="Meu Desempenho" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Activity className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Análise de Desempenho em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para insights sobre sua saúde financeira!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Compare seus gastos e receitas ao longo dos meses e veja sua evolução.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
