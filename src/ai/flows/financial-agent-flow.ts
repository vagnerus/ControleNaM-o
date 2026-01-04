'use server';
/**
 * @fileOverview A financial agent that can perform actions based on user commands.
 * - financialAgent - A function that executes financial commands.
 */

import { ai } from '@/ai/genkit';
import { addTransactionTool, updateBudgetByCategoryNameTool, FinancialAgentInputSchema, FinancialAgentOutputSchema, type FinancialAgentInput, type FinancialAgentOutput } from '../tools/financial-tools';


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
    const { output } = await ai.generate({
      prompt: `Você é um assistente financeiro. O usuário fornecerá um comando e você executará a ação apropriada usando as ferramentas disponíveis. Se o comando for uma pergunta ou um bate-papo, responda de forma amigável. Responda em português do Brasil (pt-BR). Comando do usuário: ${prompt.prompt}`,
      tools: [addTransactionTool, updateBudgetByCategoryNameTool],
      output: {
        schema: FinancialAgentOutputSchema,
      }
    });

    return output ?? { response: "Não entendi o que você quis dizer. Pode tentar de outra forma?" };
  }
);
