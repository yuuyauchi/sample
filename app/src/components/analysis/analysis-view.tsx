"use client";

import { useState } from "react";
import { CopyButton } from "./copy-button";

interface Priority {
  rank: number;
  task: string;
  score: number;
  urgency: string;
  reason: string;
}

interface Risk {
  description: string;
  severity: string;
  impact: string;
  daysUntilImpact: number | null;
  suggestedMitigation: string;
}

interface NextAction {
  action: string;
  category: string;
  priority: string;
}

interface ConsultationDraftData {
  id: string;
  targetRole: string;
  draftText: string;
  contextSummary: string | null;
}

interface AnalysisViewProps {
  analysisId: string;
  dailyReport: string;
  priorities: Priority[];
  risks: Risk[];
  consultationNeeded: boolean;
  consultationTarget: string | null;
  consultationReason: string | null;
  nextActions: NextAction[];
  existingDraft: ConsultationDraftData | null;
}

const urgencyColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const severityLabels: Record<string, string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

export function AnalysisView({
  analysisId,
  dailyReport,
  priorities,
  risks,
  consultationNeeded,
  consultationTarget,
  consultationReason,
  nextActions,
  existingDraft,
}: AnalysisViewProps) {
  const [draft, setDraft] = useState<ConsultationDraftData | null>(existingDraft);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const handleGenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const res = await fetch(
        `/api/analyses/${analysisId}/consultation-draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetRole: consultationTarget || "上司",
            tone: "formal",
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDraft(data);
      }
    } catch (error) {
      console.error("Failed to generate draft:", error);
    } finally {
      setGeneratingDraft(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 日報 */}
      <section className="bg-white rounded-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">日報</h2>
          <CopyButton text={dailyReport} />
        </div>
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {dailyReport}
        </div>
      </section>

      {/* 優先順位 */}
      <section className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">明日の優先順位</h2>
        <div className="space-y-3">
          {priorities.map((p) => (
            <div key={p.rank} className="flex items-start gap-3">
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  p.score >= 80
                    ? "bg-red-500 text-white"
                    : p.score >= 60
                    ? "bg-yellow-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {p.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {p.task}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                      urgencyColors[p.urgency] || urgencyColors.medium
                    }`}
                  >
                    {p.urgency.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  スコア: {p.score} / {p.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* リスク */}
      {risks.length > 0 && (
        <section className="bg-white rounded-lg border border-red-200 p-5">
          <h2 className="font-semibold text-red-700 mb-3">リスク</h2>
          <div className="space-y-3">
            {risks.map((r, i) => (
              <div key={i} className="border-l-2 border-red-300 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {r.description}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
                    {severityLabels[r.severity] || r.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{r.impact}</p>
                {r.daysUntilImpact !== null && (
                  <p className="text-xs text-red-600 mt-0.5">
                    影響まで約{r.daysUntilImpact}日
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  緩和策: {r.suggestedMitigation}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 相談要否 */}
      <section className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">相談要否</h2>
        {consultationNeeded ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700">
                相談推奨
              </span>
              {consultationTarget && (
                <span className="text-sm text-gray-600">
                  → {consultationTarget}
                </span>
              )}
            </div>
            {consultationReason && (
              <p className="text-sm text-gray-600 mb-3">{consultationReason}</p>
            )}
            {draft ? (
              <div className="bg-gray-50 rounded-md p-3 mt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    相談文（{draft.targetRole}宛）
                  </span>
                  <CopyButton text={draft.draftText} />
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {draft.draftText}
                </div>
              </div>
            ) : (
              <button
                onClick={handleGenerateDraft}
                disabled={generatingDraft}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {generatingDraft ? "生成中..." : "相談文を生成する"}
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            現時点で相談が必要な事項はありません。
          </p>
        )}
      </section>

      {/* 次アクション */}
      <section className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">次アクション</h2>
        <div className="space-y-2">
          {nextActions.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-shrink-0 w-5 h-5 rounded border border-gray-300 mt-0.5" />
              <div>
                <p className="text-sm text-gray-900">{a.action}</p>
                <span
                  className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    urgencyColors[a.priority] || urgencyColors.medium
                  }`}
                >
                  {a.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
