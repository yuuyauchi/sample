import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { AnalysisView } from "@/components/analysis/analysis-view";

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const analysis = await prisma.aiAnalysis.findUnique({
    where: { id },
    include: {
      dailyInput: true,
      consultationDrafts: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      goalContributions: {
        include: { goal: { select: { title: true } } },
      },
    },
  });

  if (!analysis) {
    notFound();
  }

  const existingDraft = analysis.consultationDrafts[0]
    ? {
        id: analysis.consultationDrafts[0].id,
        targetRole: analysis.consultationDrafts[0].targetRole,
        draftText: analysis.consultationDrafts[0].draftText,
        contextSummary: analysis.consultationDrafts[0].contextSummary,
      }
    : null;

  return (
    <PageContainer
      title="AI分析結果"
      subtitle={analysis.dailyInput.targetDate.toISOString().split("T")[0]}
      backHref="/"
    >
      <AnalysisView
        analysisId={analysis.id}
        dailyReport={analysis.dailyReport}
        priorities={JSON.parse(analysis.priorities)}
        risks={JSON.parse(analysis.risks)}
        consultationNeeded={analysis.consultationNeeded}
        consultationTarget={analysis.consultationTarget}
        consultationReason={analysis.consultationReason}
        nextActions={JSON.parse(analysis.nextActions)}
        existingDraft={existingDraft}
        goalContributions={analysis.goalContributions.map((gc) => ({
          goalTitle: gc.goal.title,
          alignmentScore: gc.alignmentScore,
          contributionNote: gc.contributionNote,
        }))}
      />
    </PageContainer>
  );
}
