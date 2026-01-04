export interface FinancialAgentInput {
  prompt: string;
}

export interface FinancialAgentOutput {
  response: string;
}

export async function financialAgent(input: FinancialAgentInput): Promise<FinancialAgentOutput> {
    console.warn("AI Financial Agent is not available in standalone mode.");
    await new Promise(resolve => setTimeout(resolve, 500));
    return { response: "Desculpe, o assistente de IA não está disponível neste modo de aplicativo." };
}
