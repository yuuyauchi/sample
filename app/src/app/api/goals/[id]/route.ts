import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/goals/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goal = await prisma.goal.findUnique({ where: { id } });

    if (!goal) {
      return NextResponse.json(
        { error: "not_found", message: "Goal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      periodStart: goal.periodStart.toISOString().split("T")[0],
      periodEnd: goal.periodEnd.toISOString().split("T")[0],
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, periodStart, periodEnd, status } = body;

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Goal not found" },
        { status: 404 }
      );
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(periodStart !== undefined && {
          periodStart: new Date(periodStart),
        }),
        ...(periodEnd !== undefined && { periodEnd: new Date(periodEnd) }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      periodStart: goal.periodStart.toISOString().split("T")[0],
      periodEnd: goal.periodEnd.toISOString().split("T")[0],
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Goal not found" },
        { status: 404 }
      );
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
