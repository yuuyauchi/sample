import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { analyzeDaily } from "@/lib/ai/client";
import { parseMainAnalysis } from "@/lib/ai/parser";
import type { Prisma } from "@prisma/client";

// POST /api/slack/commands - Slack slash command handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const command = formData.get("command") as string;
    const text = formData.get("text") as string;
    const token = formData.get("token") as string;

    // Verify Slack token
    const expectedToken = process.env.SLACK_VERIFICATION_TOKEN;
    if (expectedToken && token !== expectedToken) {
      return NextResponse.json(
        { error: "invalid_token" },
        { status: 401 }
      );
    }

    if (command === "/daily-input" || command === "/report") {
      return handleDailyInput(text);
    }

    if (command === "/status") {
      return handleStatus();
    }

    return NextResponse.json({
      response_type: "ephemeral",
      text: `不明なコマンド: ${command}\n使用可能: /daily-input, /status`,
    });
  } catch (error) {
    console.error("Slack command error:", error);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "エラーが発生しました。しばらくしてからお試しください。",
    });
  }
}

async function handleDailyInput(text: string) {
  if (!text.trim()) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: "使い方: /daily-input 今日やったことを入力してください\n例: /daily-input APIの設計レビューを実施。テストカバレッジを80%に改善。",
    });
  }

  const user = await getCurrentUser();
  const today = new Date().toISOString().split("T")[0];

  // Save daily input
  const dailyInput = await prisma.dailyInput.upsert({
    where: {
      userId_targetDate: {
        userId: user.id,
        targetDate: new Date(today),
      },
    },
    create: {
      userId: user.id,
      targetDate: new Date(today),
      doneToday: text,
      inputSource: "slack",
      status: "submitted",
    },
    update: {
      doneToday: text,
      inputSource: "slack",
      status: "submitted",
    },
  });

  // Run AI analysis
  try {
    const rawResult = await analyzeDaily({
      doneToday: dailyInput.doneToday,
      concerns: dailyInput.concerns,
      planTomorrow: dailyInput.planTomorrow,
      memo: dailyInput.memo,
      targetDate: today,
    });

    const validated = parseMainAnalysis(rawResult);

    await prisma.aiAnalysis.upsert({
      where: { dailyInputId: dailyInput.id },
      create: {
        dailyInputId: dailyInput.id,
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

    await prisma.dailyInput.update({
      where: { id: dailyInput.id },
      data: { status: "analyzed" },
    });

    // Format response for Slack
    const prioritySummary = validated.priorities
      .slice(0, 3)
      .map((p) => `${p.rank}. ${p.task} (${p.score}点)`)
      .join("\n");

    const riskSummary =
      validated.risks.length > 0
        ? validated.risks.map((r) => `- [${r.severity.toUpperCase()}] ${r.description}`).join("\n")
        : "なし";

    const consultationText = validated.consultation.needed
      ? `*相談推奨*: ${validated.consultation.target} - ${validated.consultation.reason}`
      : "相談不要";

    return NextResponse.json({
      response_type: "in_channel",
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `${today} の分析結果` },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*優先順位:*\n${prioritySummary}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*リスク:*\n${riskSummary}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: consultationText,
          },
        },
      ],
    });
  } catch {
    return NextResponse.json({
      response_type: "ephemeral",
      text: `入力を保存しました（${today}）。AI分析に失敗しました。Webから再分析してください。`,
    });
  }
}

async function handleStatus() {
  const user = await getCurrentUser();
  const today = new Date().toISOString().split("T")[0];

  const todayInput = await prisma.dailyInput.findFirst({
    where: {
      userId: user.id,
      targetDate: new Date(today),
    },
    include: { aiAnalysis: true },
  });

  if (!todayInput) {
    return NextResponse.json({
      response_type: "ephemeral",
      text: `${today}: まだ入力がありません。\n/daily-input で今日の業務を報告してください。`,
    });
  }

  const statusText =
    todayInput.status === "analyzed"
      ? "分析済み"
      : todayInput.status === "submitted"
      ? "入力済み（未分析）"
      : "下書き";

  return NextResponse.json({
    response_type: "ephemeral",
    text: `${today}: ${statusText}`,
  });
}
