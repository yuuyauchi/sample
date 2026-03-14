import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { AnalysisView } from "@/components/analysis/analysis-view";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dailyInput = await prisma.dailyInput.findUnique({
    where: { id },
    include: {
      aiAnalysis: {
        include: {
          consultationDrafts: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!dailyInput) {
    notFound();
  }

  const dateStr = dailyInput.targetDate.toISOString().split("T")[0];

  return (
    <PageContainer
      title={`${dateStr} の記録`}
      backHref="/history"
    >
      {/* 入力内容 */}
      <div className="space-y-5">
        <section className="bg-white rounded-lg border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">入力内容</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">今日やったこと</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {dailyInput.doneToday}
              </p>
            </div>
            {dailyInput.concerns && (
              <div>
                <p className="text-xs text-gray-500 mb-1">困っていること</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {dailyInput.concerns}
                </p>
              </div>
            )}
            {dailyInput.planTomorrow && (
              <div>
                <p className="text-xs text-gray-500 mb-1">明日やりたいこと</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {dailyInput.planTomorrow}
                </p>
              </div>
            )}
            {dailyInput.memo && (
              <div>
                <p className="text-xs text-gray-500 mb-1">メモ</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {dailyInput.memo}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* AI分析結果 */}
        {dailyInput.aiAnalysis ? (
          <AnalysisView
            analysisId={dailyInput.aiAnalysis.id}
            dailyReport={dailyInput.aiAnalysis.dailyReport}
            priorities={
              dailyInput.aiAnalysis.priorities as unknown as Array<{
                rank: number;
                task: string;
                score: number;
                urgency: string;
                reason: string;
              }>
            }
            risks={
              dailyInput.aiAnalysis.risks as unknown as Array<{
                description: string;
                severity: string;
                impact: string;
                daysUntilImpact: number | null;
                suggestedMitigation: string;
              }>
            }
            consultationNeeded={dailyInput.aiAnalysis.consultationNeeded}
            consultationTarget={dailyInput.aiAnalysis.consultationTarget}
            consultationReason={dailyInput.aiAnalysis.consultationReason}
            nextActions={
              dailyInput.aiAnalysis.nextActions as unknown as Array<{
                action: string;
                category: string;
                priority: string;
              }>
            }
            existingDraft={
              dailyInput.aiAnalysis.consultationDrafts[0]
                ? {
                    id: dailyInput.aiAnalysis.consultationDrafts[0].id,
                    targetRole:
                      dailyInput.aiAnalysis.consultationDrafts[0].targetRole,
                    draftText:
                      dailyInput.aiAnalysis.consultationDrafts[0].draftText,
                    contextSummary:
                      dailyInput.aiAnalysis.consultationDrafts[0].contextSummary,
                  }
                : null
            }
          />
        ) : (
          <div className="bg-white rounded-lg border p-5 text-center text-gray-400">
            AI分析はまだ実行されていません
          </div>
        )}
      </div>
    </PageContainer>
  );
}
