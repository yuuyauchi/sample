"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";

interface Goal {
  id: string;
  title: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  status: "active" | "completed" | "cancelled";
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    periodStart: new Date().toISOString().split("T")[0],
    periodEnd: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [filter]);

  async function fetchGoals() {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?status=${filter}`);
      const data = await res.json();
      setGoals(data.items);
    } catch (error) {
      console.error("Failed to fetch goals:", error);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      periodStart: new Date().toISOString().split("T")[0],
      periodEnd: "",
    });
    setEditingGoal(null);
    setShowForm(false);
  };

  const handleEdit = (goal: Goal) => {
    setForm({
      title: goal.title,
      description: goal.description,
      periodStart: goal.periodStart,
      periodEnd: goal.periodEnd,
    });
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.periodEnd) return;
    setSaving(true);
    try {
      if (editingGoal) {
        await fetch(`/api/goals/${editingGoal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      resetForm();
      fetchGoals();
    } catch (error) {
      console.error("Failed to save goal:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch(`/api/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchGoals();
    } catch (error) {
      console.error("Failed to update goal status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この目標を削除しますか？")) return;
    try {
      await fetch(`/api/goals/${id}`, { method: "DELETE" });
      fetchGoals();
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const statusLabel: Record<string, string> = {
    active: "進行中",
    completed: "完了",
    cancelled: "中止",
  };

  const statusColor: Record<string, string> = {
    active: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  return (
    <PageContainer title="目標管理" backHref="/">
      {/* フィルタ */}
      <div className="flex gap-2 mb-4">
        {(["active", "completed", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === s
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {s === "active" ? "進行中" : s === "completed" ? "完了" : "すべて"}
          </button>
        ))}
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="ml-auto px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          + 新規作成
        </button>
      </div>

      {/* 作成/編集フォーム */}
      {showForm && (
        <div className="bg-white rounded-lg border p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-gray-900">
            {editingGoal ? "目標を編集" : "新しい目標"}
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="目標のタイトル"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-y"
              placeholder="目標の詳細説明"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.periodStart}
                onChange={(e) =>
                  setForm({ ...form, periodStart: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.periodEnd}
                onChange={(e) =>
                  setForm({ ...form, periodEnd: e.target.value })
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.periodEnd}
              className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? "保存中..." : editingGoal ? "更新" : "作成"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 目標一覧 */}
      {loading ? (
        <div className="text-center text-gray-400 py-8">読み込み中...</div>
      ) : goals.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          {filter === "active"
            ? "進行中の目標はありません"
            : "目標はありません"}
        </div>
      ) : (
        <div className="space-y-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="bg-white rounded-lg border p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {goal.title}
                    </h3>
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                        statusColor[goal.status]
                      }`}
                    >
                      {statusLabel[goal.status]}
                    </span>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-500 mb-1">
                      {goal.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {goal.periodStart} 〜 {goal.periodEnd}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {goal.status === "active" && (
                  <button
                    onClick={() => handleStatusChange(goal.id, "completed")}
                    className="px-2.5 py-1 text-xs font-medium rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                  >
                    完了にする
                  </button>
                )}
                {goal.status === "completed" && (
                  <button
                    onClick={() => handleStatusChange(goal.id, "active")}
                    className="px-2.5 py-1 text-xs font-medium rounded border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                  >
                    再開する
                  </button>
                )}
                <button
                  onClick={() => handleEdit(goal)}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="px-2.5 py-1 text-xs font-medium rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
