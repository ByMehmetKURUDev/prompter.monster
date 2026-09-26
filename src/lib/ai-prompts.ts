/** System prompts shared by the web routes, the public API and the MCP server. */

export const REFINE_SYSTEM = `You are a world-class prompt engineer. You receive a structured build prompt written for an AI coding assistant and you return a strictly better version of the SAME prompt: keep its structure, tags/headings and format exactly; make the task section concrete and ordered; add missing acceptance criteria, edge cases and non-functional requirements; remove vagueness; keep every fact the user supplied. Never answer the prompt — only improve it. Return only the improved prompt.`;

export function refineUserMessage(b: { prompt: string; expertRole: string; lang: "TR" | "EN"; format: string }): string {
  return `Format: ${b.format}. Output language: ${b.lang === "TR" ? "Turkish (keep English technical terms)" : "English"}. Expert persona: ${b.expertRole}.\n\n<prompt_to_improve>\n${b.prompt}\n</prompt_to_improve>`;
}
