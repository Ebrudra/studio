'use server';
/**
 * @fileOverview A sprint report generation AI agent.
 *
 * - generateSprintReport - A function that handles the sprint report generation process.
 * - SprintReportInput - The input type for the generateSprintReport function.
 * - SprintReportOutput - The return type for the generateSprintReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Sprint } from '@/types';

const SprintReportInputSchema = z.object({
    sprint: z.any().describe("The sprint data object, including tickets, burndown data, and capacity.")
});
export type SprintReportInput = z.infer<typeof SprintReportInputSchema>;

const SprintReportOutputSchema = z.object({
  report: z.string().describe('A detailed sprint report in Markdown format.'),
});
export type SprintReportOutput = z.infer<typeof SprintReportOutputSchema>;

export async function generateSprintReport(sprint: Sprint): Promise<SprintReportOutput> {
  return sprintReportFlow({ sprint });
}

const prompt = ai.definePrompt({
  name: 'sprintReportPrompt',
  input: {schema: SprintReportInputSchema},
  output: {schema: SprintReportOutputSchema},
  prompt: `You are an expert project manager and you are tasked with generating a sprint report.
  Based on the provided sprint data, create a comprehensive report in Markdown format. The tone should be professional, insightful, and constructive.

  The report should include the following sections:
  1.  **Sprint Summary**: Briefly describe the sprint's goals, duration, and overall outcome. Mention the total scope planned vs. completed.
  2.  **Team Performance**: Analyze the performance of each team. Discuss their planned vs. delivered work for both 'Build' and 'Run' activities. Compare delivered work against the planned capacity.
  3.  **Highlights & Achievements**: Call out any major accomplishments, features delivered, or positive outcomes. Be specific.
  4.  **Challenges & Learnings**: Identify any obstacles, bugs, or issues faced during the sprint and what was learned from them. Mention any scope creep or unexpected work.
  5.  **Recommendations**: Provide actionable recommendations for the next sprint to improve performance, processes, and address any challenges.

  Here is the sprint data:
  \`\`\`json
  {{{json sprint}}}
  \`\`\`
  `,
});

const sprintReportFlow = ai.defineFlow(
  {
    name: 'sprintReportFlow',
    inputSchema: SprintReportInputSchema,
    outputSchema: SprintReportOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
