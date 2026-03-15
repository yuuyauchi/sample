import { prisma } from "@/lib/prisma";

interface Priority {
  rank: number;
  task: string;
  score: number;
  urgency: string;
  reason: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  acceptanceCriteria?: string;
  tags?: string[];
}

interface NextAction {
  action: string;
  category: string;
  priority: string;
  dueDate?: string | null;
  estimatedHours?: number | null;
  tags?: string[];
}

interface TaskUpdate {
  taskId: string;
  newStatus: "todo" | "in_progress" | "done";
  reason?: string;
}

export async function generateTasksFromAnalysis(
  aiAnalysisId: string,
  priorities: Priority[],
  nextActions: NextAction[],
  taskUpdates?: TaskUpdate[]
): Promise<void> {
  // 1. Apply status updates to existing tasks
  if (taskUpdates && taskUpdates.length > 0) {
    for (const update of taskUpdates) {
      try {
        await prisma.task.update({
          where: { id: update.taskId },
          data: { status: update.newStatus },
        });
        console.log(`Task ${update.taskId} updated to ${update.newStatus}: ${update.reason || ""}`);
      } catch (e) {
        // Task might not exist if deleted manually
        console.warn(`Failed to update task ${update.taskId}:`, e);
      }
    }
  }

  // 2. Delete existing tasks for THIS analysis only (re-analysis case)
  await prisma.task.deleteMany({ where: { aiAnalysisId } });

  // 3. Create new tasks from this analysis
  const tasks = [
    ...priorities.map((p, i) => ({
      aiAnalysisId,
      title: p.task,
      description: p.reason,
      priority: p.urgency,
      sourceType: "priority",
      sourceIndex: p.rank || i + 1,
      status: "todo" as const,
      dueDate: p.dueDate ? new Date(p.dueDate) : null,
      estimatedHours: p.estimatedHours || null,
      acceptanceCriteria: p.acceptanceCriteria || "",
      tags: p.tags || [],
    })),
    ...nextActions.map((a, i) => ({
      aiAnalysisId,
      title: a.action,
      description: `カテゴリ: ${a.category}`,
      priority: a.priority,
      sourceType: "next_action",
      sourceIndex: i + 1,
      status: "todo" as const,
      dueDate: a.dueDate ? new Date(a.dueDate) : null,
      estimatedHours: a.estimatedHours || null,
      tags: a.tags || [],
    })),
  ];

  await prisma.task.createMany({ data: tasks });
}

/**
 * Fetch all non-done tasks for use in AI prompt context
 */
export async function getExistingTasksForPrompt() {
  const tasks = await prisma.task.findMany({
    where: { status: { not: "done" } },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Limit to avoid bloating the prompt
  });

  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as "todo" | "in_progress" | "done",
    priority: t.priority,
  }));
}
