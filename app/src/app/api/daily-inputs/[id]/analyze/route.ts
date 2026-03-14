import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { analyzeDaily } from "@/lib/ai/client";
import { parseMainAnalysis } from "@/lib/ai/parser";

// POST /api/daily-inputs/[id]/analyze - AI分析実行
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 入力データ取得
    const dailyInput = await prisma.dailyInput.findUnique({
      where: { id },
    });

    if (!dailyInput) {
      return NextResponse.json(
        { error: "not_found", message: "Daily input not found" },
        { status: 404 }
      );
    }

    // 2. 入力内容のバリデーション
    if (!dailyInput.doneToday.trim()) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "done_today is required for analysis",
        },
        { status: 422 }
      );
    }

    // 3. AI分析実行
    const rawResult = await analyzeDaily({
      doneToday: dailyInput.doneToday,
      concerns: dailyInput.concerns,
      planTomorrow: dailyInput.planTomorrow,
      memo: dailyInput.memo,
      targetDate: dailyInput.targetDate.toISOString().split("T")[0],
    });

    // 4. バリデーション（Zodでパース）
    const validated = parseMainAnalysis(rawResult);

    // 5. DB保存（upsert: 再分析に対応）
    const aiAnalysis = await prisma.aiAnalysis.upsert({
      where: { dailyInputId: id },
      create: {
        dailyInputId: id,
        dailyReport: validated.dailyReport,
        priorities: validated.priorities as unknown as Prisma.InputJsonValue,
        risks: validated.risks as unknown as Prisma.InputJsonValue,
        consultationNeeded: validated.consultation.needed,
        consultationTarget: validated.consultation.target,
        consultationReason: validated.consultation.reason,
        nextActions: validated.nextActions as unknown as Prisma.InputJsonValue,
        rawResponse: rawResult as unknown as Prisma.InputJsonValue,
        modelVersion: "claude-sonnet-4-6",
      },
      update: {
        dailyReport: validated.dailyReport,
        priorities: validated.priorities as unknown as Prisma.InputJsonValue,
        risks: validated.risks as unknown as Prisma.InputJsonValue,
        consultationNeeded: validated.consultation.needed,
        consultationTarget: validated.consultation.target,
        consultationReason: validated.consultation.reason,
        nextActions: validated.nextActions as unknown as Prisma.InputJsonValue,
        rawResponse: rawResult as unknown as Prisma.InputJsonValue,
        modelVersion: "claude-sonnet-4-6",
      },
    });

    // 6. 入力ステータスを更新
    await prisma.dailyInput.update({
      where: { id },
      data: { status: "analyzed" },
    });

    // 7. レスポンス返却
    return NextResponse.json({
      analysisId: aiAnalysis.id,
      dailyInputId: id,
      dailyReport: aiAnalysis.dailyReport,
      priorities: aiAnalysis.priorities,
      risks: aiAnalysis.risks,
      consultationNeeded: aiAnalysis.consultationNeeded,
      consultationTarget: aiAnalysis.consultationTarget,
      consultationReason: aiAnalysis.consultationReason,
      nextActions: aiAnalysis.nextActions,
      createdAt: aiAnalysis.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Analysis failed:", error);

    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        {
          error: "llm_error",
          message: "AI analysis service is temporarily unavailable",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
