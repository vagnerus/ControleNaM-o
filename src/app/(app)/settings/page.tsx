'use client';

import { Header } from "@/components/common/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <Header title="Configurações" />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Card className="flex flex-col items-center justify-center h-96 border-dashed">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Settings className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Configurações em Breve</CardTitle>
                <CardDescription>Esta área está em desenvolvimento. Volte em breve para personalizar sua experiência!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Planejamos adicionar opções de tema, notificações e muito mais.</p>
            </CardContent>
        </Card>
      </main>
    </>
  );
}
