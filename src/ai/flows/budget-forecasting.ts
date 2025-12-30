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
  monthlyIncome: z.number().describe('The user\'s total monthly income.'),
  spendingByCategory: z.record(z.string(), z.number()).describe('A map of spending amounts for each category (e.g., {\"Food\": 500, \"Transportation\": 200}).'),
  budgetByCategory: z.record(z.string(), z.number()).describe('A map of budget amounts for each category (e.g., {\"Food\": 600, \"Transportation\": 250}).'),
  financialGoal: z.object({
    goalName: z.string().describe('The name of the financial goal (e.g., \"Buy a Car\").'),
    goalAmount: z.number().describe('The total amount needed for the goal.'),
    monthlySaving: z.number().describe('The current monthly saving amount towards the goal.'),
  }).optional().describe('The user\'s financial goal.'),
});
export type BudgetForecastingInput = z.infer<typeof BudgetForecastingInputSchema>;

const BudgetForecastingOutputSchema = z.object({
  forecast: z.string().describe('A detailed forecast of potential overspending, along with suggested adjustments to stay on track with financial goals.'),
});
export type BudgetForecastingOutput = z.infer<typeof BudgetForecastingOutputSchema>;

export async function budgetForecasting(input: BudgetForecastingInput): Promise<BudgetForecastingOutput> {
  return budgetForecastingFlow(input);
}

const budgetForecastingPrompt = ai.definePrompt({
  name: 'budgetForecastingPrompt',
  input: {schema: BudgetForecastingInputSchema},
  output: {schema: BudgetForecastingOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the user's income, spending habits, and budget to forecast potential overspending and suggest adjustments.

Here's the user's financial information:

Monthly Income: {{{monthlyIncome}}}
Spending by Category:{{#each spendingByCategory}} {{@key}}: {{{this}}}{{/each}}
Budget by Category:{{#each budgetByCategory}} {{@key}}: {{{this}}}{{/each}}
{{#if financialGoal}}
Financial Goal: {{financialGoal.goalName}}, Amount: {{{financialGoal.goalAmount}}}, Monthly Saving: {{{financialGoal.monthlySaving}}}
{{/if}}

Based on this information, provide a detailed forecast of potential overspending in specific categories and suggest concrete adjustments to help the user stay on track with their financial goals. Consider suggesting ways to reduce spending in certain categories or increase savings.
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
