
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

// The Zod schemas for Sprint and related types are complex to define here.
// Using z.any() is a shortcut for the purpose of this example.
// In a real-world scenario, you would define these schemas to match your types.
const SprintReportInputSchema = z.object({
    sprint: z.any().describe("The current sprint data object."),
    allSprints: z.array(z.any()).describe("An array of all sprints, including the current one, for historical context.")
});
export type SprintReportInput = z.infer<typeof SprintReportInputSchema>;

const SprintReportOutputSchema = z.object({
  report: z.string().describe('A detailed sprint report in Markdown format. If data is insufficient for a section, state it clearly.'),
});
export type SprintReportOutput = z.infer<typeof SprintReportOutputSchema>;

export async function generateSprintReport(input: SprintReportInput): Promise<SprintReportOutput> {
  return sprintReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sprintReportPrompt',
  input: {schema: SprintReportInputSchema},
  output: {schema: SprintReportOutputSchema},
  prompt: `You are an expert project manager tasked with generating a sprint report.
  Based on the provided sprint data, create a comprehensive report in Markdown format. The tone should be professional, insightful, and constructive.

  **IMPORTANT INSTRUCTIONS:**
  - For each section, first check if you have enough data. If not, explicitly state "Not enough data to generate this section." and briefly mention what data is missing (e.g., "Not enough data. No tickets were found in the sprint.").
  - Do not invent or hallucinate data. Base all analysis strictly on the JSON provided.
  - If historical sprint data is available in 'allSprints' (more than one sprint), use it for trend analysis and comparisons. If not, analyze the current sprint in isolation.
  - The ticket's 'platform' field refers to the team responsible (e.g., Web, Backend).

  **REPORT STRUCTURE:**
  The report should include the following sections. Use Markdown headings (e.g., '## 1. Executive Summary').

  1.  **Executive Summary**: A high-level overview.
      - Briefly describe the sprint's goals, duration, and overall outcome (planned vs. completed work).
      - Mention overall health (Good, At Risk, etc.) based on completion percentage and challenges.

  2.  **Team Performance**:
      - Analyze the performance of each platform team that has planned capacity. Discuss their planned vs. delivered work for both 'Build' and 'Run' activities.
      - Compare delivered work against the planned capacity. If capacity data is missing or zero for a team, state it.

  3.  **Highlights & Achievements**:
      - Call out any major accomplishments, features delivered, or positive outcomes. Be specific, referencing ticket IDs or titles.

  4.  **Challenges & Learnings**:
      - Identify obstacles, bugs, or issues faced. Mention any scope creep (new tickets added mid-sprint) or unexpected work.
      - If historical data is available, identify recurring challenges across sprints.

  5.  **Recommendations**:
      - Provide actionable recommendations for the next sprint to improve performance, processes, and address any challenges.

  **DATA:**
  Current Sprint Data:
  \`\`\`json
  {{{json sprint}}}
  \`\`\`

  Historical Sprint Data (for context):
  \`\`\`json
  {{{json allSprints}}}
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
