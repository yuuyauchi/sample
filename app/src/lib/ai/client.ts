import { buildMainAnalysisPrompt } from "./prompts/main-analysis";
import { buildConsultationPrompt } from "./prompts/consultation";
import type { MainAnalysisResponse } from "@/types/analysis";

const LLM_BASE_URL = process.env.LLM_BASE_URL || "http://localhost:11434/v1";
const LLM_MODEL = process.env.LLM_MODEL || "qwen2.5:7b";

import type { ExistingTask } from "./prompts/main-analysis";

export interface DailyInputForAnalysis {
  content: string;
  targetDate: string;
  existingTasks?: ExistingTask[];
}

async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("LLM API error:", errText);
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function analyzeDaily(
  input: DailyInputForAnalysis
): Promise<MainAnalysisResponse> {
  const { systemPrompt, userPrompt } = buildMainAnalysisPrompt(input);
  const text = await chatCompletion(systemPrompt, userPrompt, 4096);

  console.log("LLM raw response:", text.substring(0, 500));

  // Try multiple patterns to extract JSON
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    || text.match(/```\s*([\s\S]*?)\s*```/)
    || text.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON parse failed. Raw text:", text);
    throw new Error(`Failed to parse LLM response as JSON: ${e}`);
  }
}

export async function generateConsultationDraft(params: {
  analysisContext: string;
  risks: string;
  content: string;
  targetRole: string;
  tone: "formal" | "casual";
}): Promise<{ draftText: string; contextSummary: string }> {
  const { systemPrompt, userPrompt } = buildConsultationPrompt(params);
  const text = await chatCompletion(systemPrompt, userPrompt, 2048);

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr);
}
