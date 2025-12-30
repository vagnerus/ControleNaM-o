'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown } from "lucide-react";

export default function ExportPage() {
  return (
    <>
      <Header title="Exportar Transações" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <FileDown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Exportação de Transações em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para exportar seus dados!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Você poderá exportar suas transações para planilhas (CSV, Excel) e outros formatos.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
