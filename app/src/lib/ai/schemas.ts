import { z } from "zod";

// LLMの出力は型が不安定なため、全フィールドを柔軟にパースする

const severityTransform = z.string().transform((val) => {
  const lower = val.toLowerCase();
  if (lower.includes("high") || lower === "高") return "high" as const;
  if (lower.includes("low") || lower === "低") return "low" as const;
  return "medium" as const;
});

const flexNumber = z.union([z.number(), z.string().transform((v) => Number(v) || 0)]);

const prioritySchema = z.object({
  rank: flexNumber.pipe(z.number().int().min(1)),
  task: z.string().min(1),
  score: flexNumber.pipe(z.number().min(0).max(100)),
  urgency: severityTransform,
  reason: z.string().min(1),
  dueDate: z.string().nullable().optional().default(null),
  estimatedHours: z.union([z.number(), z.string().transform((v) => Number(v) || null), z.null()]).optional().default(null),
  acceptanceCriteria: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  evaluation: z.object({
    urgencyScore: flexNumber.pipe(z.number().min(0).max(100)),
    importanceScore: flexNumber.pipe(z.number().min(0).max(100)),
    dependencyScore: flexNumber.pipe(z.number().min(0).max(100)),
    riskScore: flexNumber.pipe(z.number().min(0).max(100)),
  }),
});

const riskCategoryTransform = z.string().transform((val) => {
  const lower = val.toLowerCase();
  const valid = ["deadline", "technical_blocker", "communication", "scope_creep", "workload"] as const;
  if ((valid as readonly string[]).includes(lower)) return lower as (typeof valid)[number];
  if (lower.includes("deadline") || lower.includes("time")) return "deadline" as const;
  if (lower.includes("technical") || lower.includes("blocker")) return "technical_blocker" as const;
  if (lower.includes("communicat")) return "communication" as const;
  if (lower.includes("scope")) return "scope_creep" as const;
  return "workload" as const;
});

const riskSchema = z.object({
  description: z.string().min(1),
  severity: severityTransform,
  category: riskCategoryTransform,
  impact: z.string().min(1),
  daysUntilImpact: z.union([z.number(), z.string().transform((v) => Number(v) || null), z.null()]),
  suggestedMitigation: z.string().min(1),
});

const nextActionCategoryTransform = z.string().transform((val) => {
  const lower = val.toLowerCase();
  const valid = ["technical", "communication", "reporting", "planning"] as const;
  if ((valid as readonly string[]).includes(lower)) return lower as (typeof valid)[number];
  if (["research", "investigation", "analysis"].includes(lower)) return "technical" as const;
  if (["meeting", "discussion", "consultation"].includes(lower)) return "communication" as const;
  if (["report", "documentation", "docs"].includes(lower)) return "reporting" as const;
  return "planning" as const;
});

const nextActionSchema = z.object({
  action: z.string().min(1),
  category: nextActionCategoryTransform,
  priority: severityTransform,
  dueDate: z.string().nullable().optional().default(null),
  estimatedHours: z.union([z.number(), z.string().transform((v) => Number(v) || null), z.null()]).optional().default(null),
  tags: z.array(z.string()).optional().default([]),
});

const consultationSchema = z.object({
  needed: z.union([z.boolean(), z.string().transform((v) => v.toLowerCase() === "true")]),
  target: z.string().nullable(),
  reason: z.string().nullable(),
  urgency: z.string().nullable().transform((val) => {
    if (!val) return null;
    const lower = val.toLowerCase();
    if (["today", "tomorrow", "this_week"].includes(lower)) return lower as "today" | "tomorrow" | "this_week";
    return "this_week" as const;
  }),
});

const taskUpdateSchema = z.object({
  taskId: z.string().min(1),
  newStatus: z.string().transform((val) => {
    const lower = val.toLowerCase();
    if (lower === "done" || lower.includes("完了")) return "done" as const;
    if (lower === "in_progress" || lower.includes("進行")) return "in_progress" as const;
    return "todo" as const;
  }),
  reason: z.string().optional().default(""),
});

export const mainAnalysisSchema = z.object({
  dailyReport: z.string().min(1),
  priorities: z.array(prioritySchema).min(1),
  risks: z.array(riskSchema),
  consultation: consultationSchema,
  nextActions: z.array(nextActionSchema).min(1).max(5),
  taskUpdates: z.array(taskUpdateSchema).optional().default([]),
});

export const consultationDraftSchema = z.object({
  draftText: z.string().min(1),
  contextSummary: z.string(),
});

export type MainAnalysisOutput = z.infer<typeof mainAnalysisSchema>;
export type ConsultationDraftOutput = z.infer<typeof consultationDraftSchema>;
