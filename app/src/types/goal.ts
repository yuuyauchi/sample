export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
}
