import { z } from "zod";

const prioritySchema = z.object({
  rank: z.number().int().min(1),
  task: z.string().min(1),
  score: z.number().min(0).max(100),
  urgency: z.enum(["high", "medium", "low"]),
  reason: z.string().min(1),
  evaluation: z.object({
    urgencyScore: z.number().min(0).max(100),
    importanceScore: z.number().min(0).max(100),
    dependencyScore: z.number().min(0).max(100),
    riskScore: z.number().min(0).max(100),
  }),
});

const riskSchema = z.object({
  description: z.string().min(1),
  severity: z.enum(["high", "medium", "low"]),
  category: z.enum([
    "deadline",
    "technical_blocker",
    "communication",
    "scope_creep",
    "workload",
  ]),
  impact: z.string().min(1),
  daysUntilImpact: z.number().nullable(),
  suggestedMitigation: z.string().min(1),
});

const nextActionSchema = z.object({
  action: z.string().min(1),
  category: z.enum(["technical", "communication", "reporting", "planning"]),
  priority: z.enum(["high", "medium", "low"]),
});

const consultationSchema = z.object({
  needed: z.boolean(),
  target: z.string().nullable(),
  reason: z.string().nullable(),
  urgency: z.enum(["today", "tomorrow", "this_week"]).nullable(),
});

export const mainAnalysisSchema = z.object({
  dailyReport: z.string().min(1),
  priorities: z.array(prioritySchema).min(1),
  risks: z.array(riskSchema),
  consultation: consultationSchema,
  nextActions: z.array(nextActionSchema).min(1).max(5),
});

export const consultationDraftSchema = z.object({
  draftText: z.string().min(1),
  contextSummary: z.string(),
});

export type MainAnalysisOutput = z.infer<typeof mainAnalysisSchema>;
export type ConsultationDraftOutput = z.infer<typeof consultationDraftSchema>;
