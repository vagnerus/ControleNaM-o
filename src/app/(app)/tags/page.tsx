'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tags } from "lucide-react";

export default function TagsPage() {
  return (
    <>
      <Header title="Tags" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Tags className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Gerenciamento de Tags em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para organizar suas transações com tags!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Você poderá criar, editar e excluir tags para agrupar suas despesas e receitas.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
