export interface ConsultationDraft {
  id: string;
  aiAnalysisId: string;
  targetRole: string;
  draftText: string;
  contextSummary: string | null;
  createdAt: string;
}

export interface CreateConsultationDraftRequest {
  targetRole: string;
  tone?: "formal" | "casual";
  includeContext?: boolean;
}
