'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FormEvent, useContext } from "react";
import { SettingsContext, initialSettings } from "@/contexts/SettingsContext";

const cardOptions = [
    { id: "expenses-chart", label: "Mostrar gráfico de despesas por categoria" },
    { id: "accounts", label: "Mostrar minhas contas?" },
    { id: "pending-transactions", label: "Mostrar transações recentes?" },
    { id: "budget-summary", label: "Mostrar resumo do orçamento do mês atual?" },
    { id: "goals", label: "Mostrar seus objetivos?" },
    { id: "income-chart", label: "Mostrar gráfico de receitas por categoria?" },
    { id: "monthly-balance-chart", label: "Mostrar gráfico do balanço mensal?" },
    { id: "credit-card-info", label: "Mostrar informações de cartão de crédito?" },
];


function PlaceholderTabContent({ title }: { title: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Esta funcionalidade estará disponível em breve.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Estamos trabalhando para trazer mais opções de personalização para você!</p>
            </CardContent>
        </Card>
    )
}

export function DashboardSettingsForm() {
    const { toast } = useToast();
    const { settings, setSettings } = useContext(SettingsContext);

    const handleSave = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const newSettings = { ...initialSettings };
        
        for (const key of Object.keys(newSettings)) {
            newSettings[key as keyof typeof newSettings] = formData.has(key);
        }

        setSettings(newSettings);

        toast({
            title: "Configurações salvas!",
            description: "Seu dashboard foi atualizado."
        })
    }

  return (
    <Tabs defaultValue="dashboard">
      <TabsList className="grid w-full grid-cols-4 md:w-fit">
        <TabsTrigger value="preferences">Preferências</TabsTrigger>
        <TabsTrigger value="notifications">Alertas e notificações</TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="security">Segurança</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard" className="mt-6">
        <form onSubmit={handleSave}>
            <Card>
                <CardHeader>
                    <CardTitle>Quais cards você deseja que apareça no dashboard?</CardTitle>
                    <CardDescription>Selecione os componentes que você quer visualizar no painel principal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cardOptions.map(option => (
                           <div key={option.id} className="flex items-center space-x-3 w-full rounded-lg border p-4 transition-colors hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                                <Checkbox 
                                    id={option.id} 
                                    name={option.id}
                                    checked={settings[option.id as keyof typeof settings]}
                                    onCheckedChange={(checked) => {
                                        setSettings(prev => ({ ...prev, [option.id]: !!checked }))
                                    }}
                                />
                                <label htmlFor={option.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit">Salvar</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
      </TabsContent>
      <TabsContent value="preferences">
        <PlaceholderTabContent title="Preferências" />
      </TabsContent>
       <TabsContent value="notifications">
        <PlaceholderTabContent title="Alertas e notificações" />
      </TabsContent>
       <TabsContent value="security">
        <PlaceholderTabContent title="Segurança" />
      </TabsContent>
    </Tabs>
  );
}
