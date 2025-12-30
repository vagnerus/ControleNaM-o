// budget-forecasting.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for budget forecasting.
 *
 * It analyzes spending habits, predicts potential overspending, and suggests adjustments.
 * - budgetForecasting - The function to initiate budget forecasting.
 * - BudgetForecastingInput - The input type for the budgetForecasting function.
 * - BudgetForecastingOutput - The output type for the budgetForecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BudgetForecastingInputSchema = z.object({
  monthlyIncome: z.number().describe("The user's total monthly income."),
  spendingByCategory: z.record(z.string(), z.number()).describe('A map of spending amounts for each category for the current month (e.g., {"Comida": 500, "Transporte": 200}).'),
  budgetByCategory: z.record(z.string(), z.number()).describe('A map of budget amounts for each category (e.g., {"Comida": 600, "Transporte": 250}).'),
  financialGoal: z.object({
    goalName: z.string().describe('The name of the financial goal (e.g., "Comprar um Carro").'),
    goalAmount: z.number().describe('The total amount needed for the goal.'),
    monthlySaving: z.number().describe('The current monthly saving amount towards the goal.'),
  }).optional().describe("The user's primary financial goal."),
});
export type BudgetForecastingInput = z.infer<typeof BudgetForecastingInputSchema>;

const BudgetForecastingOutputSchema = z.object({
  forecast: z.string().describe('A detailed forecast of potential overspending, along with suggested adjustments to stay on track with financial goals. The response must be in pt-BR.'),
});
export type BudgetForecastingOutput = z.infer<typeof BudgetForecastingOutputSchema>;

export async function budgetForecasting(input: BudgetForecastingInput): Promise<BudgetForecastingOutput> {
  return budgetForecastingFlow(input);
}

const budgetForecastingPrompt = ai.definePrompt({
  name: 'budgetForecastingPrompt',
  input: {schema: BudgetForecastingInputSchema},
  output: {schema: BudgetForecastingOutputSchema},
  prompt: `Você é um consultor financeiro pessoal e seu objetivo é ajudar o usuário a ter um controle financeiro saudável. Analise a renda mensal, os gastos por categoria e o orçamento definido pelo usuário para o mês atual. Forneça uma previsão de gastos, aponte possíveis excessos e sugira ajustes práticos. O idioma da resposta deve ser português do Brasil (pt-BR).

**Informações Financeiras do Usuário (Mês Atual):**

*   **Renda Mensal Total:** R$ {{{monthlyIncome}}}
*   **Gastos por Categoria:**{{#each spendingByCategory}}
    *   {{@key}}: R$ {{{this}}}{{/each}}
*   **Orçamento por Categoria:**{{#each budgetByCategory}}
    *   {{@key}}: R$ {{{this}}}{{/each}}
{{#if financialGoal}}

**Meta Financeira Principal:**
*   **Objetivo:** {{financialGoal.goalName}}
*   **Valor Total:** R$ {{{financialGoal.goalAmount}}}
*   **Economia Mensal Planejada:** R$ {{{financialGoal.monthlySaving}}}
{{/if}}

**Sua Tarefa:**

Com base nessas informações, gere uma análise detalhada em formato de texto. Sua resposta deve incluir:
1.  **Análise Geral:** Um resumo de como estão os gastos do usuário em relação aos seus orçamentos e renda.
2.  **Pontos de Atenção:** Destaque as 2 ou 3 categorias onde o usuário mais gastou ou que estão mais próximas de estourar o orçamento.
3.  **Sugestões Práticas:** Ofereça conselhos concretos e acionáveis para cada ponto de atenção. Se houver uma meta financeira, suas sugestões devem ajudar o usuário a alcançá-la.

O tom deve ser encorajador e amigável, não julgador.
`, 
});

const budgetForecastingFlow = ai.defineFlow(
  {
    name: 'budgetForecastingFlow',
    inputSchema: BudgetForecastingInputSchema,
    outputSchema: BudgetForecastingOutputSchema,
  },
  async input => {
    const {output} = await budgetForecastingPrompt(input);
    return output!;
  }
);

