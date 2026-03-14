"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export default function InputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    doneToday: "",
    concerns: "",
    planTomorrow: "",
    memo: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.doneToday.trim().length > 0;

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await fetch("/api/daily-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: new Date().toISOString().split("T")[0],
          ...form,
          status: "draft",
        }),
      });
    } catch {
      setError("下書き保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. 入力を保存
      const inputRes = await fetch("/api/daily-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: new Date().toISOString().split("T")[0],
          ...form,
          status: "submitted",
        }),
      });

      if (!inputRes.ok) {
        throw new Error("入力の保存に失敗しました");
      }

      const input = await inputRes.json();

      // 2. AI分析を実行
      const analysisRes = await fetch(
        `/api/daily-inputs/${input.id}/analyze`,
        { method: "POST" }
      );

      if (!analysisRes.ok) {
        throw new Error("AI分析に失敗しました");
      }

      const analysis = await analysisRes.json();

      // 3. 分析結果画面へ遷移
      router.push(`/analysis/${analysis.analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="今日の入力"
      subtitle={new Date().toISOString().split("T")[0]}
      backHref="/"
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-900">
              今日やったこと <span className="text-red-500">*</span>
            </label>
            <VoiceRecorder
              onTranscription={(text) =>
                updateField("doneToday", form.doneToday ? form.doneToday + "\n" + text : text)
              }
            />
          </div>
          <textarea
            placeholder="今日の業務内容を入力してください"
            value={form.doneToday}
            onChange={(e) => updateField("doneToday", e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>

        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            困っていること・懸念
          </label>
          <textarea
            placeholder="困っていることや心配事があれば入力してください"
            value={form.concerns}
            onChange={(e) => updateField("concerns", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>

        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            明日やりたいこと
          </label>
          <textarea
            placeholder="明日取り組みたいことを入力してください"
            value={form.planTomorrow}
            onChange={(e) => updateField("planTomorrow", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>

        <div className="bg-white rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            その他メモ（任意）
          </label>
          <textarea
            placeholder="メモがあれば入力してください"
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex-1 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSaving ? "保存中..." : "下書き保存"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "分析中..." : "分析する"}
          </button>
        </div>

        {isSubmitting && (
          <div className="text-center text-sm text-gray-500 py-4">
            AIが分析中です。しばらくお待ちください...
          </div>
        )}
      </div>
    </PageContainer>
  );
}
