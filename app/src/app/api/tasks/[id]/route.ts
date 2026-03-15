import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: any = {};
    if (body.status) data.status = body.status;
    if (body.title) data.title = body.title;
    if (body.priority) data.priority = body.priority;
    if (body.description !== undefined) data.description = body.description;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.estimatedHours !== undefined) data.estimatedHours = body.estimatedHours;
    if (body.actualHours !== undefined) data.actualHours = body.actualHours;
    if (body.acceptanceCriteria !== undefined) data.acceptanceCriteria = body.acceptanceCriteria;
    if (body.risk !== undefined) data.risk = body.risk;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.blockerNote !== undefined) data.blockerNote = body.blockerNote;
    if (body.goalId !== undefined) data.goalId = body.goalId || null;
    if (body.progressNotes !== undefined) data.progressNotes = body.progressNotes;
    if (body.status === "done") data.completedAt = new Date();
    if (body.status && body.status !== "done") data.completedAt = null;

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Task PATCH error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Task DELETE error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
