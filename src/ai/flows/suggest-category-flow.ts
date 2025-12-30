// suggest-category-flow.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting a transaction category.
 *
 * It analyzes a transaction description and a list of available categories to suggest the most appropriate one.
 * - suggestCategory - The function to initiate category suggestion.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The output type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  description: z.string().describe("The user's transaction description (e.g., 'Almoço no restaurante')."),
  categories: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe('A list of available expense categories.'),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  categoryId: z.string().describe('The ID of the most likely category for the given description. The ID must be one of the IDs provided in the input. Return an empty string if no category is a good match.'),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const suggestCategoryPrompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are an expert financial assistant. Your task is to suggest the most relevant category for a transaction based on its description.

Transaction Description: "{{{description}}}"

Available Categories:
{{#each categories}}
- Name: {{this.name}} (ID: {{this.id}})
{{/each}}

Analyze the description and choose the most appropriate category ID from the list above. The category must be an "expense" type. If no category seems like a good fit, return an empty string for the categoryId.
Your response MUST be in the format specified by the output schema.
`, 
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    if (input.categories.length === 0) {
      return { categoryId: '' };
    }
    const {output} = await suggestCategoryPrompt(input);
    return output!;
  }
);
