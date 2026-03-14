import Anthropic from "@anthropic-ai/sdk";
import { buildMainAnalysisPrompt } from "./prompts/main-analysis";
import { buildConsultationPrompt } from "./prompts/consultation";
import type { MainAnalysisResponse } from "@/types/analysis";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface DailyInputForAnalysis {
  doneToday: string;
  concerns: string;
  planTomorrow: string;
  memo: string;
  targetDate: string;
}

export async function analyzeDaily(
  input: DailyInputForAnalysis
): Promise<MainAnalysisResponse> {
  const { systemPrompt, userPrompt } = buildMainAnalysisPrompt(input);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr);
}

export async function generateConsultationDraft(params: {
  analysisContext: string;
  risks: string;
  concerns: string;
  targetRole: string;
  tone: "formal" | "casual";
}): Promise<{ draftText: string; contextSummary: string }> {
  const { systemPrompt, userPrompt } = buildConsultationPrompt(params);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr);
}
