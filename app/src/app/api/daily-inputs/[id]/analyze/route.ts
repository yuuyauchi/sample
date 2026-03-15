import { NextRequest, NextResponse } from "next/server";
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

    // 3. アクティブな目標を取得
    const activeGoals = await prisma.goal.findMany({
      where: {
        userId: dailyInput.userId,
        status: "active",
      },
      select: { id: true, title: true, description: true, periodEnd: true },
    });

    // 4. AI分析実行（目標情報を含む）
    const rawResult = await analyzeDaily({
      doneToday: dailyInput.doneToday,
      concerns: dailyInput.concerns,
      planTomorrow: dailyInput.planTomorrow,
      memo: dailyInput.memo,
      targetDate: dailyInput.targetDate.toISOString().split("T")[0],
      activeGoals: activeGoals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        periodEnd: g.periodEnd.toISOString().split("T")[0],
      })),
    });

    // 5. バリデーション（Zodでパース）
    const validated = parseMainAnalysis(rawResult);

    // 6. DB保存（upsert: 再分析に対応）
    const aiAnalysis = await prisma.aiAnalysis.upsert({
      where: { dailyInputId: id },
      create: {
        dailyInputId: id,
        dailyReport: validated.dailyReport,
        priorities: JSON.stringify(validated.priorities),
        risks: JSON.stringify(validated.risks),
        consultationNeeded: validated.consultation.needed,
        consultationTarget: validated.consultation.target,
        consultationReason: validated.consultation.reason,
        nextActions: JSON.stringify(validated.nextActions),
        rawResponse: JSON.stringify(rawResult),
        modelVersion: "claude-sonnet-4-6",
      },
      update: {
        dailyReport: validated.dailyReport,
        priorities: JSON.stringify(validated.priorities),
        risks: JSON.stringify(validated.risks),
        consultationNeeded: validated.consultation.needed,
        consultationTarget: validated.consultation.target,
        consultationReason: validated.consultation.reason,
        nextActions: JSON.stringify(validated.nextActions),
        rawResponse: JSON.stringify(rawResult),
        modelVersion: "claude-sonnet-4-6",
      },
    });

    // 7. GoalContribution保存（既存を削除してから再作成）
    if (validated.goalContributions && validated.goalContributions.length > 0) {
      await prisma.goalContribution.deleteMany({
        where: { aiAnalysisId: aiAnalysis.id },
      });

      const validGoalIds = new Set(activeGoals.map((g) => g.id));
      const validContributions = validated.goalContributions.filter((gc) =>
        validGoalIds.has(gc.goalId)
      );

      if (validContributions.length > 0) {
        await prisma.goalContribution.createMany({
          data: validContributions.map((gc) => ({
            goalId: gc.goalId,
            aiAnalysisId: aiAnalysis.id,
            contributionNote: gc.contributionNote,
            alignmentScore: gc.alignmentScore,
          })),
        });
      }
    }

    // 8. 入力ステータスを更新
    await prisma.dailyInput.update({
      where: { id },
      data: { status: "analyzed" },
    });

    // 9. レスポンス返却
    return NextResponse.json({
      analysisId: aiAnalysis.id,
      dailyInputId: id,
      dailyReport: aiAnalysis.dailyReport,
      priorities: JSON.parse(aiAnalysis.priorities),
      risks: JSON.parse(aiAnalysis.risks),
      consultationNeeded: aiAnalysis.consultationNeeded,
      consultationTarget: aiAnalysis.consultationTarget,
      consultationReason: aiAnalysis.consultationReason,
      nextActions: JSON.parse(aiAnalysis.nextActions),
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
