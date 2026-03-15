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

  const [content, setContent] = useState("");

  const canSubmit = content.trim().length > 0;

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await fetch("/api/daily-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: new Date().toISOString().split("T")[0],
          content,
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
          content,
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
              業務内容 <span className="text-red-500">*</span>
            </label>
            <VoiceRecorder
              onTranscription={(text) =>
                setContent(content ? content + "\n" + text : text)
              }
            />
          </div>
          <textarea
            placeholder="今日の業務内容、困っていること、明日の予定などを自由に入力してください"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
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
