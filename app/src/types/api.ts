import type { InputStatus } from "./daily-input";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string>;
}

export interface DailyInputListItem {
  id: string;
  targetDate: string;
  doneTodaySummary: string;
  status: InputStatus;
  hasRisks: boolean;
  consultationNeeded: boolean;
  createdAt: string;
}
