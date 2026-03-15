import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/daily-inputs/[id] - 入力詳細取得（分析結果含む）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dailyInput = await prisma.dailyInput.findUnique({
      where: { id },
      include: {
        aiAnalysis: {
          include: {
            consultationDrafts: true,
          },
        },
      },
    });

    if (!dailyInput) {
      return NextResponse.json(
        { error: "not_found", message: "Daily input not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: dailyInput.id,
      targetDate: dailyInput.targetDate.toISOString().split("T")[0],
      doneToday: dailyInput.doneToday,
      concerns: dailyInput.concerns,
      planTomorrow: dailyInput.planTomorrow,
      memo: dailyInput.memo,
      inputSource: dailyInput.inputSource,
      status: dailyInput.status,
      createdAt: dailyInput.createdAt.toISOString(),
      updatedAt: dailyInput.updatedAt.toISOString(),
      aiAnalysis: dailyInput.aiAnalysis
        ? {
            id: dailyInput.aiAnalysis.id,
            dailyReport: dailyInput.aiAnalysis.dailyReport,
            priorities: JSON.parse(dailyInput.aiAnalysis.priorities),
            risks: JSON.parse(dailyInput.aiAnalysis.risks),
            consultationNeeded: dailyInput.aiAnalysis.consultationNeeded,
            consultationTarget: dailyInput.aiAnalysis.consultationTarget,
            consultationReason: dailyInput.aiAnalysis.consultationReason,
            nextActions: JSON.parse(dailyInput.aiAnalysis.nextActions),
            modelVersion: dailyInput.aiAnalysis.modelVersion,
            createdAt: dailyInput.aiAnalysis.createdAt.toISOString(),
            consultationDrafts: dailyInput.aiAnalysis.consultationDrafts.map(
              (d) => ({
                id: d.id,
                targetRole: d.targetRole,
                draftText: d.draftText,
                contextSummary: d.contextSummary,
                createdAt: d.createdAt.toISOString(),
              })
            ),
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/daily-inputs/[id] error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to fetch daily input" },
      { status: 500 }
    );
  }
}

// PUT /api/daily-inputs/[id] - 入力更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { doneToday, concerns, planTomorrow, memo, status } = body;

    const existing = await prisma.dailyInput.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "Daily input not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.dailyInput.update({
      where: { id },
      data: {
        ...(doneToday !== undefined && { doneToday }),
        ...(concerns !== undefined && { concerns }),
        ...(planTomorrow !== undefined && { planTomorrow }),
        ...(memo !== undefined && { memo }),
        ...(status !== undefined && { status }),
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
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/daily-inputs/[id] error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "Failed to update daily input" },
      { status: 500 }
    );
  }
}
