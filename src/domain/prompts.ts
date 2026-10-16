export type PromptCategory =
  | "Behavioral"
  | "Teamwork"
  | "Problem solving"
  | "Leadership"
  | "Communication";

export interface InterviewPrompt {
  id: string;
  category: PromptCategory;
  text: string;
  /** What a strong answer usually covers. Shown as guidance, never scored. */
  hint: string;
}

export const PROMPT_CATEGORIES: readonly PromptCategory[] = [
  "Behavioral",
  "Teamwork",
  "Problem solving",
  "Leadership",
  "Communication",
];

/** Curated catalog. Static in P0; the planned API equivalent is GET /api/prompts. */
export const PROMPTS: readonly InterviewPrompt[] = [
  {
    id: "beh-challenge",
    category: "Behavioral",
    text: "Tell me about a time you faced a significant challenge at work or school. How did you handle it?",
    hint: "Situation, the action you personally took, and a measurable result.",
  },
  {
    id: "beh-mistake",
    category: "Behavioral",
    text: "Describe a mistake you made and what you learned from it.",
    hint: "Own the mistake, explain the fix, and show what you changed afterward.",
  },
  {
    id: "team-conflict",
    category: "Teamwork",
    text: "Tell me about a disagreement with a teammate. How was it resolved?",
    hint: "Stay neutral about the other person and focus on the outcome for the team.",
  },
  {
    id: "team-support",
    category: "Teamwork",
    text: "Give an example of how you helped a struggling team member or project.",
    hint: "What you noticed, what you offered, and what changed as a result.",
  },
  {
    id: "prob-ambiguous",
    category: "Problem solving",
    text: "Describe a problem you solved with incomplete information. What was your approach?",
    hint: "How you reduced uncertainty: questions asked, assumptions tested, risks managed.",
  },
  {
    id: "prob-deadline",
    category: "Problem solving",
    text: "Tell me about a time you had to deliver under a tight deadline.",
    hint: "How you prioritized, what you cut, and how you communicated trade-offs.",
  },
  {
    id: "lead-initiative",
    category: "Leadership",
    text: "Tell me about a time you took initiative without being asked.",
    hint: "Why it mattered, how you got buy-in, and the result.",
  },
  {
    id: "comm-technical",
    category: "Communication",
    text: "Explain a technical concept you know well to someone without a technical background.",
    hint: "Use an analogy, avoid jargon, and check for understanding.",
  },
];

export function findPrompt(id: string | undefined): InterviewPrompt | undefined {
  return id ? PROMPTS.find((p) => p.id === id) : undefined;
}
