"use client";

import { useEffect, useState, useCallback } from "react";
import { PageContainer } from "@/components/layout/page-container";

interface AnalyticsData {
  period: string;
  dateRange: { start: string; end: string };
  totalInputDays: number;
  workDays: number;
  inputRate: number;
  riskSummary: {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    trend: Array<{ date: string; count: number }>;
  };
  priorityTrends: Array<{ date: string; avgScore: number }>;
  consultationRate: number;
  goalProgress: Array<{
    goalId: string;
    goalTitle: string;
    avgAlignment: number;
    contributionCount: number;
    trend: Array<{ date: string; score: number }>;
  }>;
  workloadIndicators: Array<{
    date: string;
    hasWorkloadRisk: boolean;
    riskCount: number;
  }>;
}

const categoryLabels: Record<string, string> = {
  deadline: "納期遅延",
  technical_blocker: "技術的ブロッカー",
  communication: "コミュニケーション",
  scope_creep: "スコープクリープ",
  workload: "負荷・体調",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [refDate, setRefDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics?period=${period}&date=${refDate}`
      );
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [period, refDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigate = (direction: -1 | 1) => {
    const d = new Date(refDate);
    if (period === "weekly") {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    setRefDate(d.toISOString().split("T")[0]);
  };

  return (
    <PageContainer title="分析レポート" backHref="/">
      {/* 期間選択 */}
      <div className="flex gap-2 mb-4">
        {(["weekly", "monthly"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              period === p
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p === "weekly" ? "週次" : "月次"}
          </button>
        ))}
      </div>

      {/* 日付ナビ */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
        >
          &larr; 前の{period === "weekly" ? "週" : "月"}
        </button>
        {data && (
          <span className="text-sm font-medium text-gray-700">
            {data.dateRange.start} 〜 {data.dateRange.end}
          </span>
        )}
        <button
          onClick={() => navigate(1)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
        >
          次の{period === "weekly" ? "週" : "月"} &rarr;
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">読み込み中...</div>
      ) : !data ? (
        <div className="text-center text-gray-400 py-8">
          データの取得に失敗しました
        </div>
      ) : (
        <div className="space-y-5">
          {/* サマリーカード */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="入力率"
              value={`${data.inputRate}%`}
              sub={`${data.totalInputDays}/${data.workDays}営業日`}
            />
            <StatCard
              label="リスク検出"
              value={`${data.riskSummary.total}件`}
              sub={
                data.riskSummary.total > 0
                  ? `HIGH: ${data.riskSummary.bySeverity["high"] || 0}`
                  : "なし"
              }
              warn={
                (data.riskSummary.bySeverity["high"] || 0) > 0
              }
            />
            <StatCard
              label="相談推奨率"
              value={`${data.consultationRate}%`}
              sub="分析結果のうち"
            />
            <StatCard
              label="目標関連"
              value={`${data.goalProgress.length}件`}
              sub={
                data.goalProgress.length > 0
                  ? `平均: ${Math.round(data.goalProgress.reduce((a, g) => a + g.avgAlignment, 0) / data.goalProgress.length)}点`
                  : "目標なし"
              }
            />
          </div>

          {/* リスクカテゴリ内訳 */}
          {data.riskSummary.total > 0 && (
            <section className="bg-white rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                リスクカテゴリ内訳
              </h2>
              <div className="space-y-2">
                {Object.entries(data.riskSummary.byCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-32 truncate">
                        {categoryLabels[cat] || cat}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-red-400 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (count / data.riskSummary.total) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* 優先度スコア推移 */}
          {data.priorityTrends.length > 0 && (
            <section className="bg-white rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                優先度スコア推移
              </h2>
              <MiniLineChart
                data={data.priorityTrends.map((p) => ({
                  label: p.date.slice(5),
                  value: p.avgScore,
                }))}
                maxValue={100}
              />
            </section>
          )}

          {/* ワークロード */}
          {data.workloadIndicators.length > 0 && (
            <section className="bg-white rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                日次リスク状況
              </h2>
              <div className="flex gap-1.5 flex-wrap">
                {data.workloadIndicators.map((w) => (
                  <div key={w.date} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-medium ${
                        w.riskCount === 0
                          ? "bg-green-100 text-green-700"
                          : w.hasWorkloadRisk
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {w.riskCount}
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {w.date.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 目標進捗 */}
          {data.goalProgress.length > 0 && (
            <section className="bg-white rounded-lg border p-5">
              <h2 className="font-semibold text-gray-900 mb-3">目標進捗</h2>
              <div className="space-y-3">
                {data.goalProgress.map((g) => (
                  <div key={g.goalId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {g.goalTitle}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {g.contributionCount}回 / 平均{g.avgAlignment}点
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          g.avgAlignment >= 70
                            ? "bg-green-500"
                            : g.avgAlignment >= 40
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                        }`}
                        style={{ width: `${g.avgAlignment}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* データなし */}
          {data.totalInputDays === 0 && (
            <div className="text-center text-gray-400 py-8">
              この期間のデータはありません
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${warn ? "text-red-600" : "text-gray-900"}`}
      >
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function MiniLineChart({
  data,
  maxValue,
}: {
  data: Array<{ label: string; value: number }>;
  maxValue: number;
}) {
  if (data.length === 0) return null;

  const width = 400;
  const height = 80;
  const padding = 4;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
    const y = padding + chartH - (d.value / maxValue) * chartH;
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        <polyline
          points={polyline}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#6366f1" />
        ))}
      </svg>
      <div className="flex justify-between px-1">
        {points.map((p, i) => (
          <span key={i} className="text-[10px] text-gray-400">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
