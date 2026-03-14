import { mainAnalysisSchema, consultationDraftSchema } from "./schemas";
import type { MainAnalysisOutput, ConsultationDraftOutput } from "./schemas";

export function parseMainAnalysis(raw: unknown): MainAnalysisOutput {
  return mainAnalysisSchema.parse(raw);
}

export function parseConsultationDraft(raw: unknown): ConsultationDraftOutput {
  return consultationDraftSchema.parse(raw);
}
