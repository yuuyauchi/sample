import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateConsultationDraft } from "@/lib/ai/client";
import { parseConsultationDraft } from "@/lib/ai/parser";

// POST /api/analyses/[id]/consultation-draft - 相談文生成
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetRole, tone = "formal" } = body;

    if (!targetRole) {
      return NextResponse.json(
        {
          error: "validation_error",
          message: "targetRole is required",
        },
        { status: 400 }
      );
    }

    // 1. 分析データ取得
    const analysis = await prisma.aiAnalysis.findUnique({
      where: { id },
      include: {
        dailyInput: true,
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "not_found", message: "Analysis not found" },
        { status: 404 }
      );
    }

    // 2. 相談文生成
    const rawResult = await generateConsultationDraft({
      analysisContext: analysis.dailyReport,
      risks: analysis.risks,
      concerns: analysis.dailyInput.concerns,
      targetRole,
      tone,
    });

    // 3. バリデーション
    const validated = parseConsultationDraft(rawResult);

    // 4. DB保存
    const draft = await prisma.consultationDraft.create({
      data: {
        aiAnalysisId: id,
        targetRole,
        draftText: validated.draftText,
        contextSummary: validated.contextSummary,
      },
    });

    return NextResponse.json({
      id: draft.id,
      targetRole: draft.targetRole,
      draftText: draft.draftText,
      contextSummary: draft.contextSummary,
      createdAt: draft.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Consultation draft generation failed:", error);

    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        {
          error: "llm_error",
          message: "AI service is temporarily unavailable",
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
