'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <>
      <Header title="Calendário" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Calendar className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Calendário Financeiro em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para ver suas transações em um calendário!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Visualize suas receitas, despesas e vencimentos de faturas em um só lugar.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
