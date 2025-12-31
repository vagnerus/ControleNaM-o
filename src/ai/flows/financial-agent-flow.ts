'use server';
/**
 * @fileOverview A financial agent that can perform actions based on user commands.
 * - financialAgent - A function that executes financial commands.
 * - FinancialAgentInput - The input type for the financialAgent function.
 * - FinancialAgentOutput - The output type for the financialAgent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addTransactionTool, updateBudgetByCategoryNameTool } from '../tools/financial-tools';

export const FinancialAgentInputSchema = z.string();
export type FinancialAgentInput = z.infer<typeof FinancialAgentInputSchema>;

export const FinancialAgentOutputSchema = z.object({
  response: z.string().describe('A confirmation message to the user about the action taken, in pt-BR.'),
});
export type FinancialAgentOutput = z.infer<typeof FinancialAgentOutputSchema>;

export async function financialAgent(prompt: FinancialAgentInput): Promise<FinancialAgentOutput> {
  return financialAgentFlow(prompt);
}

const financialAgentFlow = ai.defineFlow(
  {
    name: 'financialAgentFlow',
    inputSchema: FinancialAgentInputSchema,
    outputSchema: FinancialAgentOutputSchema,
  },
  async (prompt) => {
    const llmResponse = await ai.generate({
      prompt: `Você é um assistente financeiro. O usuário fornecerá um comando e você executará a ação apropriada usando as ferramentas disponíveis. Responda em português do Brasil (pt-BR). Comando: ${prompt}`,
      tools: [addTransactionTool, updateBudgetByCategoryNameTool],
    });

    const toolResponse = llmResponse.toolRequest();

    if (toolResponse) {
      // Here you could add more complex logic, but for now we just confirm the tool output.
      const toolOutput = await toolResponse.next();
      return {
        response: toolOutput?.output as string || "Ação concluída, mas não recebi uma confirmação clara.",
      };
    }

    return {
      response: llmResponse.text(),
    };
  }
);
