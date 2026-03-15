export interface Priority {
  rank: number;
  task: string;
  score: number;
  urgency: "high" | "medium" | "low";
  reason: string;
  evaluation: {
    urgencyScore: number;
    importanceScore: number;
    dependencyScore: number;
    riskScore: number;
  };
}

export interface Risk {
  description: string;
  severity: "high" | "medium" | "low";
  category: "deadline" | "technical_blocker" | "communication" | "scope_creep" | "workload";
  impact: string;
  daysUntilImpact: number | null;
  suggestedMitigation: string;
}

export interface NextAction {
  action: string;
  category: "technical" | "communication" | "reporting" | "planning";
  priority: "high" | "medium" | "low";
}

export interface AiAnalysis {
  id: string;
  dailyInputId: string;
  dailyReport: string;
  priorities: Priority[];
  risks: Risk[];
  consultationNeeded: boolean;
  consultationTarget: string | null;
  consultationReason: string | null;
  nextActions: NextAction[];
  modelVersion: string;
  createdAt: string;
}

export interface GoalContribution {
  goalId: string;
  alignmentScore: number;
  contributionNote: string;
}

export interface MainAnalysisResponse {
  dailyReport: string;
  priorities: Priority[];
  risks: Risk[];
  consultation: {
    needed: boolean;
    target: string | null;
    reason: string | null;
    urgency: "today" | "tomorrow" | "this_week" | null;
  };
  nextActions: NextAction[];
  goalContributions?: GoalContribution[];
}
