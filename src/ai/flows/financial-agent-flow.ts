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
    const llmResponse = await ai.generate({
      prompt: `Você é um assistente financeiro. O usuário fornecerá um comando e você executará a ação apropriada usando as ferramentas disponíveis. Se o comando for uma pergunta ou um bate-papo, responda de forma amigável. Responda em português do Brasil (pt-BR). Comando do usuário: ${prompt}`,
      tools: [addTransactionTool, updateBudgetByCategoryNameTool],
      output: {
        schema: FinancialAgentOutputSchema,
      }
    });

    // Handle tool calls if any
    for await (const part of llmResponse.stream()) {
      if (part.toolRequest) {
        // This assumes your tools are implemented to handle the request and return a final answer.
        // The `next()` function calls the tool and the `output()` on the result gets the response.
        const toolOutput = await part.toolRequest.next();
        const output = await toolOutput.output();
        
        // If the tool returns a string, wrap it in the expected output format.
        if (typeof output === 'string') {
            return { response: output };
        }
        // If the tool returns the correct object, just return it.
        return output as FinancialAgentOutput;
      }
    }
    
    // Fallback to the LLM's text response if no tool was called.
    return llmResponse.output() ?? { response: "Não entendi o que você quis dizer. Pode tentar de outra forma?" };
  }
);
