import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // comma-separated: "todo,in_progress"

    const where: any = {};
    if (status) {
      where.status = { in: status.split(",") };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: "asc" },
        { priority: "asc" }, // will need custom ordering
        { createdAt: "desc" },
      ],
      include: {
        aiAnalysis: {
          select: {
            dailyInput: {
              select: { targetDate: true },
            },
          },
        },
      },
    });

    // Map to add targetDate at top level
    const result = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      sourceType: t.sourceType,
      sourceIndex: t.sourceIndex,
      targetDate: t.aiAnalysis.dailyInput.targetDate.toISOString().split("T")[0],
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      dueDate: t.dueDate ? t.dueDate.toISOString().split("T")[0] : null,
      startDate: t.startDate ? t.startDate.toISOString().split("T")[0] : null,
      estimatedHours: t.estimatedHours,
      actualHours: t.actualHours,
      acceptanceCriteria: t.acceptanceCriteria,
      risk: t.risk,
      tags: t.tags,
      blockerNote: t.blockerNote,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      progressNotes: t.progressNotes,
      goalId: t.goalId,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
