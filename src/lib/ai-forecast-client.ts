export interface BudgetForecastingInput {
  monthlyIncome: number;
  spendingByCategory: Record<string, number>;
  budgetByCategory: Record<string, number>;
  financialGoal?: {
    goalName: string;
    goalAmount: number;
    monthlySaving: number;
  };
}

export interface BudgetForecastingOutput {
  forecast: string;
}

export async function budgetForecasting(input: BudgetForecastingInput): Promise<BudgetForecastingOutput> {
    console.log("Mocking AI Budget Forecasting", input);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

    const topCategories = Object.entries(input.spendingByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, amount]) => `- **${name}**: R$ ${amount.toFixed(2)}`)
        .join('\n');

    return {
        forecast: `**Análise Financeira (Modo Demonstração)**

Com base nos dados fornecidos:
- **Renda Mensal:** R$ ${input.monthlyIncome.toFixed(2)}
- **Meta:** ${input.financialGoal?.goalName || 'Não definida'}

**Análise Geral:**
Seus gastos estão sendo monitorados. Este é um modo de demonstração offline, mas em um ambiente conectado, eu analisaria profundamente seus hábitos.

**Principais Gastos:**
${topCategories}

**Sugestões Práticas:**
1.  **Acompanhamento:** Continue registrando todas as suas despesas para ter uma visão clara.
2.  **Economia:** ${input.financialGoal ? `Para atingir sua meta de "${input.financialGoal.goalName}", tente manter seus gastos essenciais abaixo de 50% da renda.` : 'Defina uma meta financeira para ajudar no seu planejamento.'}

*Nota: Para análises reais com IA, conecte-se ao backend.*`
    };
}
