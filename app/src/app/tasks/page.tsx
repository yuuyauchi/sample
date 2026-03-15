"use client";

import { useState, useEffect, useCallback, useRef, DragEvent } from "react";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: string;
  sourceType: string;
  sourceIndex: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  acceptanceCriteria: string;
  risk: string;
  tags: string[];
  blockerNote: string;
  completedAt: string | null;
  progressNotes: { text: string; createdAt: string }[];
  goalId: string | null;
}

const STATUS_CONFIG = {
  todo: { label: "未着手", color: "bg-gray-100", headerColor: "bg-gray-500", borderColor: "border-gray-300", badge: "bg-gray-200 text-gray-700" },
  in_progress: { label: "進行中", color: "bg-blue-50", headerColor: "bg-blue-500", borderColor: "border-blue-300", badge: "bg-blue-100 text-blue-700" },
  done: { label: "完了", color: "bg-green-50", headerColor: "bg-green-500", borderColor: "border-green-300", badge: "bg-green-100 text-green-700" },
} as const;

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const SOURCE_LABELS: Record<string, string> = {
  priority: "優先タスク",
  next_action: "次アクション",
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
};

// ─── Detail Panel ────────────────────────────────────────────
function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, fields: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(task.acceptanceCriteria || "");
  const [risk, setRisk] = useState(task.risk || "");
  const [blockerNote, setBlockerNote] = useState(task.blockerNote || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingAcceptance, setIsEditingAcceptance] = useState(false);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [isEditingBlocker, setIsEditingBlocker] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newNote, setNewNote] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const acceptanceRef = useRef<HTMLTextAreaElement>(null);
  const riskRef = useRef<HTMLTextAreaElement>(null);
  const blockerRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync state when task prop changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setAcceptanceCriteria(task.acceptanceCriteria || "");
    setRisk(task.risk || "");
    setBlockerNote(task.blockerNote || "");
  }, [task.id, task.title, task.description, task.acceptanceCriteria, task.risk, task.blockerNote]);

  // Focus input when editing starts
  useEffect(() => { if (isEditingTitle) titleRef.current?.focus(); }, [isEditingTitle]);
  useEffect(() => { if (isEditingDesc) descRef.current?.focus(); }, [isEditingDesc]);
  useEffect(() => { if (isEditingAcceptance) acceptanceRef.current?.focus(); }, [isEditingAcceptance]);
  useEffect(() => { if (isEditingRisk) riskRef.current?.focus(); }, [isEditingRisk]);
  useEffect(() => { if (isEditingBlocker) blockerRef.current?.focus(); }, [isEditingBlocker]);
  useEffect(() => { if (isAddingTag) tagInputRef.current?.focus(); }, [isAddingTag]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const saveTitle = () => {
    setIsEditingTitle(false);
    if (title.trim() && title !== task.title) {
      onUpdate(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
  };

  const saveDescription = () => {
    setIsEditingDesc(false);
    if (description !== task.description) {
      onUpdate(task.id, { description });
    }
  };

  const saveAcceptanceCriteria = () => {
    setIsEditingAcceptance(false);
    if (acceptanceCriteria !== (task.acceptanceCriteria || "")) {
      onUpdate(task.id, { acceptanceCriteria });
    }
  };

  const saveRisk = () => {
    setIsEditingRisk(false);
    if (risk !== (task.risk || "")) {
      onUpdate(task.id, { risk });
    }
  };

  const saveBlockerNote = () => {
    setIsEditingBlocker(false);
    if (blockerNote !== (task.blockerNote || "")) {
      onUpdate(task.id, { blockerNote });
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !(task.tags || []).includes(tag)) {
      onUpdate(task.id, { tags: [...(task.tags || []), tag] });
    }
    setNewTag("");
    setIsAddingTag(false);
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate(task.id, { tags: (task.tags || []).filter((t) => t !== tagToRemove) });
  };

  const addProgressNote = () => {
    const text = newNote.trim();
    if (!text) return;
    const note = { text, createdAt: new Date().toISOString() };
    onUpdate(task.id, { progressNotes: [note, ...(task.progressNotes || [])] });
    setNewNote("");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_CONFIG[task.status].badge}`}>
              {STATUS_CONFIG[task.status].label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
              {PRIORITY_LABELS[task.priority] || task.priority}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* a) Title */}
          <div>
            {isEditingTitle ? (
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); }}
                className="w-full text-xl font-bold text-gray-900 border-b-2 border-blue-500 outline-none pb-1"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-900 cursor-text hover:bg-gray-50 rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* b) Status selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ステータス</label>
            <div className="flex gap-2">
              {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onUpdate(task.id, { status: s })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    task.status === s
                      ? `${STATUS_CONFIG[s].badge} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* b) Priority selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">優先度</label>
            <div className="flex gap-2">
              {(["high", "medium", "low"]).map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdate(task.id, { priority: p })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    task.priority === p
                      ? `${PRIORITY_COLORS[p]} ring-2 ring-offset-1 ring-current`
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* c) Schedule section */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">スケジュール</label>
            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
              <span className="text-sm text-gray-500">期限</span>
              <input
                type="date"
                value={task.dueDate || ""}
                onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
                className="text-sm text-gray-900 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">開始予定日</span>
              <input
                type="date"
                value={task.startDate || ""}
                onChange={(e) => onUpdate(task.id, { startDate: e.target.value || null })}
                className="text-sm text-gray-900 bg-white border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">見込み工数</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={task.estimatedHours ?? ""}
                  onChange={(e) => onUpdate(task.id, { estimatedHours: e.target.value ? parseFloat(e.target.value) : null })}
                  className="text-sm text-gray-900 bg-white border border-gray-200 rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-"
                />
                <span className="text-sm text-gray-500">時間</span>
              </div>
              <span className="text-sm text-gray-500">実績工数</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={task.actualHours ?? ""}
                  onChange={(e) => onUpdate(task.id, { actualHours: e.target.value ? parseFloat(e.target.value) : null })}
                  className="text-sm text-gray-900 bg-white border border-gray-200 rounded px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="-"
                />
                <span className="text-sm text-gray-500">時間</span>
              </div>
            </div>
          </div>

          {/* d) Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">説明</label>
            {isEditingDesc ? (
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={saveDescription}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="min-h-[60px] rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-text hover:bg-gray-100 transition-colors whitespace-pre-wrap"
              >
                {task.description || <span className="text-gray-400">クリックして説明を追加...</span>}
              </div>
            )}
          </div>

          {/* e) Acceptance Criteria */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">完了条件</label>
            {isEditingAcceptance ? (
              <textarea
                ref={acceptanceRef}
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                onBlur={saveAcceptanceCriteria}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            ) : (
              <div
                onClick={() => setIsEditingAcceptance(true)}
                className="min-h-[48px] rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-text hover:bg-gray-100 transition-colors whitespace-pre-wrap"
              >
                {task.acceptanceCriteria || <span className="text-gray-400">クリックして完了条件を追加...</span>}
              </div>
            )}
          </div>

          {/* f) Risk */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">リスク・懸念</label>
            {isEditingRisk ? (
              <textarea
                ref={riskRef}
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                onBlur={saveRisk}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
              />
            ) : (
              <div
                onClick={() => setIsEditingRisk(true)}
                className="min-h-[48px] rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-text hover:bg-gray-100 transition-colors whitespace-pre-wrap"
              >
                {task.risk || <span className="text-gray-400">クリックしてリスク・懸念を追加...</span>}
              </div>
            )}
          </div>

          {/* g) Blocker (only show if not done) */}
          {task.status !== "done" && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">ブロッカー</label>
              {isEditingBlocker ? (
                <textarea
                  ref={blockerRef}
                  value={blockerNote}
                  onChange={(e) => setBlockerNote(e.target.value)}
                  onBlur={saveBlockerNote}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                />
              ) : (
                <div
                  onClick={() => setIsEditingBlocker(true)}
                  className="min-h-[48px] rounded-md px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-text hover:bg-gray-100 transition-colors whitespace-pre-wrap"
                >
                  {task.blockerNote || <span className="text-gray-400">止まっている理由があれば記入</span>}
                </div>
              )}
            </div>
          )}

          {/* h) Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">タグ</label>
            <div className="flex flex-wrap items-center gap-2">
              {(task.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-blue-500 hover:text-blue-700 ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {isAddingTag ? (
                <input
                  ref={tagInputRef}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag();
                    if (e.key === "Escape") { setNewTag(""); setIsAddingTag(false); }
                  }}
                  onBlur={addTag}
                  placeholder="タグ名"
                  className="text-xs border border-gray-300 rounded px-2 py-0.5 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
                >
                  +追加
                </button>
              )}
            </div>
          </div>

          {/* i) Progress Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">進捗メモ</label>
            <div className="flex gap-2 mb-3">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addProgressNote(); }}
                placeholder="新しいメモを入力..."
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addProgressNote}
                disabled={!newNote.trim()}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                追加
              </button>
            </div>
            {(task.progressNotes || []).length > 0 && (
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {(task.progressNotes || []).map((note, i) => (
                  <div key={i} className="px-4 py-2.5">
                    <div className="text-xs text-gray-400 mb-0.5">
                      {new Date(note.createdAt).toLocaleString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* j) Metadata */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">詳細情報</label>
            <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">ソース</span>
                <span className="text-sm text-gray-900 font-medium">{SOURCE_LABELS[task.sourceType] || task.sourceType}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">対象日</span>
                <span className="text-sm text-gray-900 font-medium">{task.targetDate}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">作成日</span>
                <span className="text-sm text-gray-900 font-medium">{new Date(task.createdAt).toLocaleString("ja-JP")}</span>
              </div>
              <div className="flex justify-between px-4 py-2.5">
                <span className="text-sm text-gray-500">完了日</span>
                <span className="text-sm text-gray-900 font-medium">
                  {task.completedAt ? new Date(task.completedAt).toLocaleString("ja-JP") : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="text-sm text-red-600 hover:text-red-800 font-medium hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
          >
            タスクを削除
          </button>
          <button
            onClick={onClose}
            className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

// ─── Due Date Helper ─────────────────────────────────────────
function isDueDateOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return due < today;
}

// ─── Main Page ───────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const updateTask = async (taskId: string, fields: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...fields, updatedAt: new Date().toISOString() } : t));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) fetchTasks();
    } catch {
      fetchTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch {
      fetchTasks();
    }
  };

  // Drag handlers
  const handleDragStart = (e: DragEvent, taskId: string) => {
    setDraggingId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleDragEnd = (e: DragEvent) => {
    setDraggingId(null);
    setDragOverColumn(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const handleDragOver = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = (e: DragEvent, status: TaskStatus) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      if (dragOverColumn === status) setDragOverColumn(null);
    }
  };

  const handleDrop = (e: DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    setDragOverColumn(null);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.status !== targetStatus) {
      updateTask(taskId, { status: targetStatus });
    }
  };

  const handleCardClick = (taskId: string) => {
    // Don't open detail if we just finished dragging
    if (!draggingId) setSelectedTaskId(taskId);
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  const columns = (["todo", "in_progress", "done"] as TaskStatus[]).map((status) => ({
    status,
    ...STATUS_CONFIG[status],
    tasks: tasks.filter((t) => t.status === status),
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">タスクボード</h1>

      {tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">タスクはまだありません</p>
          <p className="text-sm">日次入力を分析するとタスクが自動生成されます</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`rounded-lg p-4 min-h-[400px] transition-all duration-200 border-2 ${
                dragOverColumn === col.status
                  ? `${col.color} ${col.borderColor} ring-2 ring-offset-1 ring-blue-200 scale-[1.01]`
                  : `${col.color} border-transparent`
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${col.headerColor}`} />
                <h2 className="font-semibold text-gray-700">{col.label}</h2>
                <span className="text-sm text-gray-500 ml-auto">{col.tasks.length}</span>
              </div>
              <div className="space-y-3">
                {col.tasks.map((task) => {
                  const overdue = task.status !== "done" && isDueDateOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(task.id)}
                      className={`bg-white rounded-lg shadow-sm border p-3 cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
                        draggingId === task.id
                          ? "opacity-50 scale-95 shadow-lg"
                          : selectedTaskId === task.id
                            ? "ring-2 ring-blue-500 shadow-md"
                            : "hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-gray-900 flex-1">{task.title}</h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                          className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                          title="削除"
                        >
                          ✕
                        </button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-400">{task.targetDate}</span>
                        {task.dueDate && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${overdue ? "bg-red-100 text-red-700 font-medium" : "bg-gray-100 text-gray-600"}`}>
                            {overdue ? "期限超過 " : ""}
                            {task.dueDate}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); updateTask(task.id, { status: NEXT_STATUS[task.status] }); }}
                          className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {task.status === "todo" ? "着手 →" : task.status === "in_progress" ? "完了 →" : "戻す →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {col.tasks.length === 0 && (
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center text-sm text-gray-400 ${
                    dragOverColumn === col.status ? "border-blue-300 bg-blue-50" : "border-gray-200"
                  }`}>
                    ここにドラッグ
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
}
