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
        priorities={
          analysis.priorities as unknown as Array<{
            rank: number;
            task: string;
            score: number;
            urgency: string;
            reason: string;
          }>
        }
        risks={
          analysis.risks as unknown as Array<{
            description: string;
            severity: string;
            impact: string;
            daysUntilImpact: number | null;
            suggestedMitigation: string;
          }>
        }
        consultationNeeded={analysis.consultationNeeded}
        consultationTarget={analysis.consultationTarget}
        consultationReason={analysis.consultationReason}
        nextActions={
          analysis.nextActions as unknown as Array<{
            action: string;
            category: string;
            priority: string;
          }>
        }
        existingDraft={existingDraft}
      />
    </PageContainer>
  );
}
