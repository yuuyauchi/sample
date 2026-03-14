"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DailyInputListItem } from "@/types/api";

interface LatestAnalysis {
  targetDate: string;
  priorities: Array<{ rank: number; task: string; score: number; urgency: string }>;
  risks: Array<{ description: string; severity: string }>;
  consultationNeeded: boolean;
}

export default function HomePage() {
  const [todayStatus, setTodayStatus] = useState<"none" | "draft" | "submitted" | "analyzed">("none");
  const [todayInputId, setTodayInputId] = useState<string | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<LatestAnalysis | null>(null);
  const [weeklyStatus, setWeeklyStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    try {
      const now = new Date();
      const res = await fetch(
        `/api/daily-inputs?year=${now.getFullYear()}&month=${now.getMonth() + 1}&per_page=7`
      );
      const data = await res.json();
      const items: DailyInputListItem[] = data.items;

      const todayStr = now.toISOString().split("T")[0];
      const todayItem = items.find((i) => i.targetDate === todayStr);
      if (todayItem) {
        setTodayStatus(todayItem.status as "draft" | "submitted" | "analyzed");
        setTodayInputId(todayItem.id);
      }

      const weekMap: Record<string, boolean> = {};
      items.forEach((item) => {
        weekMap[item.targetDate] = true;
      });
      setWeeklyStatus(weekMap);

      const analyzed = items.find((i) => i.status === "analyzed");
      if (analyzed) {
        const detailRes = await fetch(`/api/daily-inputs/${analyzed.id}`);
        const detail = await detailRes.json();
        if (detail.aiAnalysis) {
          setLatestAnalysis({
            targetDate: detail.targetDate,
            priorities: detail.aiAnalysis.priorities,
            risks: detail.aiAnalysis.risks,
            consultationNeeded: detail.aiAnalysis.consultationNeeded,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setLoading(false);
    }
  }

  const getWeekDays = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const days = [];
    const labels = ["月", "火", "水", "木", "金"];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        label: labels[i],
        date: d.toISOString().split("T")[0],
      });
    }
    return days;
  };

  const statusLabel = {
    none: "未入力",
    draft: "下書き",
    submitted: "入力済",
    analyzed: "分析済",
  };

  const statusColor = {
    none: "bg-gray-100 text-gray-600",
    draft: "bg-yellow-100 text-yellow-700",
    submitted: "bg-blue-100 text-blue-700",
    analyzed: "bg-green-100 text-green-700",
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* 今日のステータス */}
      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">今日の入力</h2>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[todayStatus]}`}
          >
            {statusLabel[todayStatus]}
          </span>
        </div>
        <Link
          href={
            todayStatus === "analyzed" && todayInputId
              ? `/history/${todayInputId}`
              : "/input"
          }
          className="block w-full text-center py-2.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {todayStatus === "none"
            ? "今日の入力を始める"
            : todayStatus === "analyzed"
            ? "今日の分析結果を見る"
            : "入力を続ける"}
        </Link>
      </div>

      {/* 前回の分析結果 */}
      {latestAnalysis && (
        <div className="bg-white rounded-lg border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">
            前回の分析結果（{latestAnalysis.targetDate}）
          </h2>
          {latestAnalysis.priorities.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">優先順位1</p>
              <p className="text-sm text-gray-800">
                {latestAnalysis.priorities[0].task}
              </p>
            </div>
          )}
          {latestAnalysis.risks.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">リスク</p>
              {latestAnalysis.risks.map((risk, i) => (
                <p key={i} className="text-sm text-red-600">
                  {risk.severity === "high" ? "!!" : "!"} {risk.description}
                </p>
              ))}
            </div>
          )}
          {latestAnalysis.consultationNeeded && (
            <p className="text-sm text-amber-600 font-medium">
              相談推奨あり
            </p>
          )}
        </div>
      )}

      {/* 今週の入力状況 */}
      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-gray-900 mb-3">今週の入力状況</h2>
        <div className="flex gap-3 justify-center">
          {getWeekDays().map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{day.label}</span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  weeklyStatus[day.date]
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {weeklyStatus[day.date] ? "\u2713" : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
