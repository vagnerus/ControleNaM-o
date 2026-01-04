
"use client";

import { useState } from "react";
import { budgetForecasting, BudgetForecastingInput } from "@/lib/ai-forecast-client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import type { Budget, FinancialGoal } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type AIForecastProps = {
  data: {
    budgets: Budget[];
    income: number;
    goals: FinancialGoal[];
    spending: Record<string, number>;
  };
};

export function AIForecast({ data }: AIForecastProps) {
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState("");
  const { toast } = useToast();

  const handleGenerateForecast = async () => {
    setLoading(true);
    setForecast("");

    const budgetByCategory = data.budgets.reduce((acc, budget) => {
      if (budget.categoryName) {
        acc[budget.categoryName] = budget.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const financialGoal = data.goals[0]
      ? {
          goalName: data.goals[0].name,
          goalAmount: data.goals[0].targetAmount,
          monthlySaving: data.goals[0].monthlySaving,
        }
      : undefined;

    const input: BudgetForecastingInput = {
      monthlyIncome: data.income,
      spendingByCategory: data.spending,
      budgetByCategory,
      financialGoal,
    };

    try {
      const result = await budgetForecasting(input);
      setForecast(result.forecast);
      toast({
        title: "Previsão Gerada!",
        description: "Sua análise financeira com IA está pronta.",
      });
    } catch (error) {
      console.error("AI forecast failed:", error);
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar a previsão. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            <span>Assistente Financeiro IA</span>
          </CardTitle>
          <CardDescription>
            Use inteligência artificial para prever gastos e receber dicas.
          </CardDescription>
        </div>
        <Button onClick={handleGenerateForecast} disabled={loading} className="w-full md:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
             <Wand2 className="mr-2 h-4 w-4" />
              Gerar Previsão com IA
            </>
          )}
        </Button>
      </CardHeader>
      
        {forecast && (
          <CardContent>
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Análise e Sugestões</AlertTitle>
              <AlertDescription>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {forecast}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      
    </Card>
  );
}
