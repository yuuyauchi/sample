import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/goals - 目標一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    const user = await getCurrentUser();

    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        ...(status !== "all" && { status: status as "active" | "completed" | "cancelled" }),
      },
      include: {
        contributions: {
          select: { alignmentScore: true },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
      orderBy: { periodEnd: "asc" },
    });

    return NextResponse.json({
      items: goals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        periodStart: g.periodStart.toISOString().split("T")[0],
        periodEnd: g.periodEnd.toISOString().split("T")[0],
        status: g.status,
        createdAt: g.createdAt.toISOString(),
        contributionCount: g.contributions.length,
        avgAlignment: g.contributions.length > 0
          ? Math.round(g.contributions.reduce((sum, c) => sum + c.alignmentScore, 0) / g.contributions.length)
          : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST /api/goals - 目標登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, periodStart, periodEnd } = body;

    if (!title?.trim() || !periodStart || !periodEnd) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "title, periodStart, and periodEnd are required",
        },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title,
        description: description ?? "",
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    });

    return NextResponse.json(
      {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        periodStart: goal.periodStart.toISOString().split("T")[0],
        periodEnd: goal.periodEnd.toISOString().split("T")[0],
        status: goal.status,
        createdAt: goal.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create goal" },
      { status: 500 }
    );
  }
}
