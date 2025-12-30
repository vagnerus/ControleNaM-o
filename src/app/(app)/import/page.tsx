'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp } from "lucide-react";

export default function ImportPage() {
  return (
    <>
      <Header title="Importar Transações" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <FileUp className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Importação de Transações em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para importar extratos bancários!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Você poderá importar arquivos OFX, CSV e outros formatos para agilizar seus lançamentos.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
