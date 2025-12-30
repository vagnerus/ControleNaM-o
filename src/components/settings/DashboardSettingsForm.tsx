'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const leftColumnOptions = [
    { id: "expenses-chart", label: "Mostrar gráfico de despesas por categoria", checked: true },
    { id: "frequency-chart", label: "Mostrar gráfico de frequência de gastos?", checked: false },
    { id: "monthly-balance-chart", label: "Mostrar gráfico do balanço mensal?", checked: true },
    { id: "pending-transactions", label: "Mostrar transações pendentes?", checked: false },
    { id: "budget-summary", label: "Mostrar resumo do orçamento do mês atual?", checked: true },
    { id: "monthly-savings", label: "Mostrar informações da economia no mês atual?", checked: false },
    { id: "accounts", label: "Mostrar minhas contas?", checked: false },
];

const rightColumnOptions = [
    { id: "income-chart", label: "Mostrar gráfico de receitas por categoria?", checked: true },
    { id: "semester-balance-chart", label: "Mostrar gráfico do balanço semestral?", checked: false },
    { id: "quarterly-balance-chart", label: "Mostrar gráfico do balanço trimestral?", checked: false },
    { id: "credit-card-info", label: "Mostrar informações de cartão de crédito?", checked: true },
    { id: "goals", label: "Mostrar seus objetivos?", checked: false },
    { id: "profile-info", label: "Mostrar informações de perfil?", checked: false },
];

function CheckboxItem({ id, label, checked: defaultChecked }: { id: string, label: string, checked: boolean }) {
    return (
        <div className="flex items-center space-x-3 w-full rounded-lg border p-4 transition-colors hover:bg-accent/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
            <Checkbox id={id} defaultChecked={defaultChecked} />
            <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {label}
            </label>
        </div>
    )
}

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

    const handleSave = () => {
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
        <Card>
            <CardHeader>
                <CardTitle>Quais cards você deseja que apareça no dashboard?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-medium text-center text-muted-foreground">Cards da esquerda</h3>
                        <div className="space-y-3">
                            {leftColumnOptions.map(option => (
                                <CheckboxItem key={option.id} {...option} />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                         <h3 className="font-medium text-center text-muted-foreground">Cards da direita</h3>
                        <div className="space-y-3">
                            {rightColumnOptions.map(option => (
                                <CheckboxItem key={option.id} {...option} />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave}>Salvar</Button>
                </div>
            </CardContent>
        </Card>
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
