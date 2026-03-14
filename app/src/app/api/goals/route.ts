import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/goals - 目標一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    // MVP: 最初のユーザーを使用
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: user.id,
        ...(status !== "all" && { status: status as "active" | "completed" | "cancelled" }),
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

    // MVP: 最初のユーザーを使用
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { email: "me@example.com", name: "自分" },
      });
    }

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
