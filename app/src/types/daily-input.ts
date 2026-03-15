export type InputSource = "web" | "slack" | "voice";
export type InputStatus = "draft" | "submitted" | "analyzed";

export interface DailyInput {
  id: string;
  userId: string;
  targetDate: string;
  content: string;
  inputSource: InputSource;
  status: InputStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyInputWithAnalysis extends DailyInput {
  aiAnalysis: AiAnalysis | null;
}

export interface CreateDailyInputRequest {
  targetDate: string;
  content: string;
  status?: InputStatus;
}

export interface UpdateDailyInputRequest {
  content?: string;
  status?: InputStatus;
}

// Forward reference
import type { AiAnalysis } from "./analysis";
