"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import type { DailyInputListItem } from "@/types/api";

export default function HistoryPage() {
  const [items, setItems] = useState<DailyInputListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchHistory();
  }, [year, month]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/daily-inputs?year=${year}&month=${month}&per_page=31`
      );
      const data = await res.json();
      setItems(data.items);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const statusBadge = (status: string, hasRisks: boolean, consultationNeeded: boolean) => {
    const badges = [];
    if (status === "analyzed") {
      badges.push(
        <span key="analyzed" className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-100 text-green-700">
          分析済
        </span>
      );
    } else if (status === "draft") {
      badges.push(
        <span key="draft" className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-700">
          下書き
        </span>
      );
    }
    if (hasRisks) {
      badges.push(
        <span key="risk" className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-100 text-red-700">
          リスク
        </span>
      );
    }
    if (consultationNeeded) {
      badges.push(
        <span key="consult" className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700">
          相談
        </span>
      );
    }
    return badges;
  };

  return (
    <PageContainer title="履歴" backHref="/">
      {/* 月切り替え */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          &larr; 前月
        </button>
        <span className="text-sm font-medium text-gray-900">
          {year}年{month}月
        </span>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          翌月 &rarr;
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-8">読み込み中...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          この月の入力はありません
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/history/${item.id}`}
              className="block bg-white rounded-lg border p-4 hover:border-gray-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {item.targetDate}
                </span>
                <div className="flex gap-1">
                  {statusBadge(item.status, item.hasRisks, item.consultationNeeded)}
                </div>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {item.doneTodaySummary}
              </p>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
