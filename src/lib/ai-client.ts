import { z } from "zod";

const SuggestCategoryInputSchema = z.object({
  description: z.string(),
  categories: z.array(z.object({id: z.string(), name: z.string()})),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

export type SuggestCategoryOutput = {
    categoryId: string | null;
    confidence?: number;
    reasoning?: string;
}

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  // In a real standalone app, this would call a remote API.
  // For now, we return a mock or error to prevent build failure due to Node.js imports.
  console.warn("AI Suggestion is not available in standalone mode without a backend connection configured.");
  
  // Simulating a delay
  await new Promise(resolve => setTimeout(resolve, 500));

  throw new Error("Recurso de IA indisponível neste modo de aplicativo.");
}
