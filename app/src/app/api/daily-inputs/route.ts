import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/daily-inputs - 履歴一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : new Date().getFullYear();
    const month = searchParams.get("month")
      ? parseInt(searchParams.get("month")!)
      : new Date().getMonth() + 1;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [items, total] = await Promise.all([
      prisma.dailyInput.findMany({
        where: {
          targetDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          aiAnalysis: {
            select: {
              consultationNeeded: true,
              risks: true,
            },
          },
        },
        orderBy: { targetDate: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.dailyInput.count({
        where: {
          targetDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const responseItems = items.map((item) => ({
      id: item.id,
      targetDate: item.targetDate.toISOString().split("T")[0],
      doneTodaySummary:
        item.doneToday.length > 80
          ? item.doneToday.substring(0, 80) + "..."
          : item.doneToday,
      status: item.status,
      hasRisks: item.aiAnalysis
        ? (item.aiAnalysis.risks as unknown as unknown[]).length > 0
        : false,
      consultationNeeded: item.aiAnalysis?.consultationNeeded ?? false,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({
      items: responseItems,
      total,
      page,
      perPage,
    });
  } catch (error) {
    console.error("GET /api/daily-inputs error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch daily inputs" },
      { status: 500 }
    );
  }
}

// POST /api/daily-inputs - 入力保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetDate, doneToday, concerns, planTomorrow, memo, status } =
      body;

    if (!targetDate || !doneToday?.trim()) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "targetDate and doneToday are required",
        },
        { status: 400 }
      );
    }

    // MVP: 最初のユーザーを取得（認証実装前の暫定処理）
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "me@example.com",
          name: "自分",
        },
      });
    }

    // 同日の入力が既に存在するか確認
    const existing = await prisma.dailyInput.findUnique({
      where: {
        userId_targetDate: {
          userId: user.id,
          targetDate: new Date(targetDate),
        },
      },
    });

    if (existing) {
      // 既存の場合は更新
      const updated = await prisma.dailyInput.update({
        where: { id: existing.id },
        data: {
          doneToday,
          concerns: concerns ?? "",
          planTomorrow: planTomorrow ?? "",
          memo: memo ?? "",
          status: status ?? "submitted",
        },
      });

      return NextResponse.json({
        id: updated.id,
        targetDate: updated.targetDate.toISOString().split("T")[0],
        doneToday: updated.doneToday,
        concerns: updated.concerns,
        planTomorrow: updated.planTomorrow,
        memo: updated.memo,
        inputSource: updated.inputSource,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
      });
    }

    const dailyInput = await prisma.dailyInput.create({
      data: {
        userId: user.id,
        targetDate: new Date(targetDate),
        doneToday,
        concerns: concerns ?? "",
        planTomorrow: planTomorrow ?? "",
        memo: memo ?? "",
        inputSource: "web",
        status: status ?? "submitted",
      },
    });

    return NextResponse.json(
      {
        id: dailyInput.id,
        targetDate: dailyInput.targetDate.toISOString().split("T")[0],
        doneToday: dailyInput.doneToday,
        concerns: dailyInput.concerns,
        planTomorrow: dailyInput.planTomorrow,
        memo: dailyInput.memo,
        inputSource: dailyInput.inputSource,
        status: dailyInput.status,
        createdAt: dailyInput.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/daily-inputs error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to create daily input" },
      { status: 500 }
    );
  }
}
