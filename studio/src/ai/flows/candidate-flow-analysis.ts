'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing candidate flow data to generate insights.
 *
 * - analyzeCandidateFlow - A function that triggers the candidate flow analysis process.
 * - AnalyzeCandidateFlowInput - The input type for the analyzeCandidateFlow function.
 * - AnalyzeCandidateFlowOutput - The return type for the analyzeCandidateFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCandidateFlowInputSchema = z.object({
  candidateFlowData: z.string().describe('JSON string containing data about candidate flow, including timestamps of each stage.'),
  jobProfile: z.string().describe('Description of the job profile for which the candidates were considered.'),
});
export type AnalyzeCandidateFlowInput = z.infer<typeof AnalyzeCandidateFlowInputSchema>;

const AnalyzeCandidateFlowOutputSchema = z.object({
  insights: z.string().describe('Insights about the optimal time to approach candidates with similar profiles for future hiring campaigns.'),
});
export type AnalyzeCandidateFlowOutput = z.infer<typeof AnalyzeCandidateFlowOutputSchema>;

export async function analyzeCandidateFlow(input: AnalyzeCandidateFlowInput): Promise<AnalyzeCandidateFlowOutput> {
  return analyzeCandidateFlowFlow(input);
}

const analyzeCandidateFlowPrompt = ai.definePrompt({
  name: 'analyzeCandidateFlowPrompt',
  input: {schema: AnalyzeCandidateFlowInputSchema},
  output: {schema: AnalyzeCandidateFlowOutputSchema},
  prompt: `You are an expert in analyzing candidate hiring data.
  Your goal is to identify the optimal time to approach candidates with similar profiles for future hiring campaigns.
  Analyze the following candidate flow data and provide insights on the best moment to engage candidates, maximizing the effectiveness of the hiring efforts.

  Candidate Flow Data: {{{candidateFlowData}}}
  Job Profile: {{{jobProfile}}}

  Provide clear, actionable insights that can be used to improve the timing and approach of future hiring campaigns for similar roles.
`,
});

const analyzeCandidateFlowFlow = ai.defineFlow(
  {
    name: 'analyzeCandidateFlowFlow',
    inputSchema: AnalyzeCandidateFlowInputSchema,
    outputSchema: AnalyzeCandidateFlowOutputSchema,
  },
  async input => {
    const {output} = await analyzeCandidateFlowPrompt(input);
    return output!;
  }
);
