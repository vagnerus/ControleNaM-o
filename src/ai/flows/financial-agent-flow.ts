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
      prompt: `Você é um assistente financeiro. O usuário fornecerá um comando e você executará a ação apropriada usando as ferramentas disponíveis. Se o comando for uma pergunta ou um bate-papo, responda de forma amigável. Responda em português do Brasil (pt-BR). Comando do usuário: ${prompt}`,
      tools: [addTransactionTool, updateBudgetByCategoryNameTool],
      output: {
        schema: FinancialAgentOutputSchema,
      }
    });

    for await (const part of llmResponse.stream()) {
      if (part.toolRequest) {
        const toolOutput = await part.toolRequest.next();
        return toolOutput.output();
      }
    }
    
    return llmResponse.output() ?? { response: "Não entendi o que você quis dizer. Pode tentar de outra forma?" };
  }
);
