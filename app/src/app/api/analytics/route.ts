import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/analytics?period=weekly|monthly&date=2026-03-15
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "weekly";
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const refDate = new Date(dateStr);

    let startDate: Date;
    let endDate: Date;

    if (period === "weekly") {
      const day = refDate.getDay();
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() - ((day + 6) % 7));
      startDate = monday;
      endDate = new Date(monday);
      endDate.setDate(monday.getDate() + 6);
    } else {
      startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    }

    // 日次入力 + 分析データ取得
    const inputs = await prisma.dailyInput.findMany({
      where: {
        userId: user.id,
        targetDate: { gte: startDate, lte: endDate },
      },
      include: {
        aiAnalysis: {
          include: {
            goalContributions: {
              include: { goal: { select: { id: true, title: true } } },
            },
          },
        },
      },
      orderBy: { targetDate: "asc" },
    });

    // 営業日数の計算（月〜金）
    let workDays = 0;
    const d = new Date(startDate);
    while (d <= endDate) {
      const dow = d.getDay();
      if (dow >= 1 && dow <= 5) workDays++;
      d.setDate(d.getDate() + 1);
    }

    const totalInputDays = inputs.length;
    const inputRate = workDays > 0 ? Math.round((totalInputDays / workDays) * 100) : 0;

    // リスク集計
    const risksByCategory: Record<string, number> = {};
    const risksBySeverity: Record<string, number> = {};
    const riskTrend: Array<{ date: string; count: number }> = [];
    let totalRisks = 0;
    let consultationCount = 0;

    // 優先度トレンド
    const priorityTrends: Array<{ date: string; avgScore: number }> = [];

    // 日次データの集計
    const workloadIndicators: Array<{ date: string; hasWorkloadRisk: boolean; riskCount: number }> = [];

    for (const input of inputs) {
      const dateKey = input.targetDate.toISOString().split("T")[0];

      if (input.aiAnalysis) {
        const risks = JSON.parse(input.aiAnalysis.risks) as Array<{
          category: string;
          severity: string;
        }>;
        const priorities = JSON.parse(input.aiAnalysis.priorities) as Array<{
          score: number;
        }>;

        riskTrend.push({ date: dateKey, count: risks.length });
        totalRisks += risks.length;

        let hasWorkloadRisk = false;
        for (const r of risks) {
          risksByCategory[r.category] = (risksByCategory[r.category] || 0) + 1;
          risksBySeverity[r.severity] = (risksBySeverity[r.severity] || 0) + 1;
          if (r.category === "workload") hasWorkloadRisk = true;
        }

        workloadIndicators.push({
          date: dateKey,
          hasWorkloadRisk,
          riskCount: risks.length,
        });

        if (priorities.length > 0) {
          const avgScore = Math.round(
            priorities.reduce((sum, p) => sum + p.score, 0) / priorities.length
          );
          priorityTrends.push({ date: dateKey, avgScore });
        }

        if (input.aiAnalysis.consultationNeeded) {
          consultationCount++;
        }
      }
    }

    const consultationRate =
      totalInputDays > 0
        ? Math.round((consultationCount / totalInputDays) * 100)
        : 0;

    // 目標進捗集計
    const goalMap = new Map<
      string,
      {
        goalId: string;
        goalTitle: string;
        scores: number[];
        trend: Array<{ date: string; score: number }>;
      }
    >();

    for (const input of inputs) {
      if (input.aiAnalysis) {
        const dateKey = input.targetDate.toISOString().split("T")[0];
        for (const gc of input.aiAnalysis.goalContributions) {
          if (!goalMap.has(gc.goalId)) {
            goalMap.set(gc.goalId, {
              goalId: gc.goalId,
              goalTitle: gc.goal.title,
              scores: [],
              trend: [],
            });
          }
          const entry = goalMap.get(gc.goalId)!;
          entry.scores.push(gc.alignmentScore);
          entry.trend.push({ date: dateKey, score: gc.alignmentScore });
        }
      }
    }

    const goalProgress = Array.from(goalMap.values()).map((g) => ({
      goalId: g.goalId,
      goalTitle: g.goalTitle,
      avgAlignment: Math.round(
        g.scores.reduce((a, b) => a + b, 0) / g.scores.length
      ),
      contributionCount: g.scores.length,
      trend: g.trend,
    }));

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      },
      totalInputDays,
      workDays,
      inputRate,
      riskSummary: {
        total: totalRisks,
        byCategory: risksByCategory,
        bySeverity: risksBySeverity,
        trend: riskTrend,
      },
      priorityTrends,
      consultationRate,
      goalProgress,
      workloadIndicators,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
