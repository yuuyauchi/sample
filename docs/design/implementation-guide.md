# 業務意思決定エージェント 実装ガイド

## 1. ディレクトリ構成

```
work-decision-agent/
├── prisma/
│   ├── schema.prisma              # DBスキーマ定義
│   ├── migrations/                # マイグレーションファイル
│   └── seed.ts                    # シードデータ
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # ルートレイアウト
│   │   ├── page.tsx               # ホーム画面
│   │   ├── login/
│   │   │   └── page.tsx           # ログイン画面
│   │   ├── input/
│   │   │   └── page.tsx           # 入力画面
│   │   ├── analysis/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # AI分析結果画面
│   │   ├── history/
│   │   │   ├── page.tsx           # 履歴一覧画面
│   │   │   └── [id]/
│   │   │       └── page.tsx       # 履歴詳細画面
│   │   └── api/                   # API Routes
│   │       ├── daily-inputs/
│   │       │   ├── route.ts       # GET(一覧), POST(作成)
│   │       │   └── [id]/
│   │       │       ├── route.ts   # GET(詳細), PUT(更新)
│   │       │       └── analyze/
│   │       │           └── route.ts  # POST(AI分析実行)
│   │       ├── analyses/
│   │       │   └── [id]/
│   │       │       └── consultation-draft/
│   │       │           └── route.ts  # POST(相談文生成)
│   │       └── goals/
│   │           └── route.ts       # GET(一覧), POST(作成)
│   ├── components/                # UIコンポーネント
│   │   ├── ui/                    # shadcn/ui ベースコンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── header.tsx         # ヘッダー
│   │   │   ├── nav.tsx            # ナビゲーション
│   │   │   └── page-container.tsx # ページコンテナ
│   │   ├── home/
│   │   │   ├── input-status.tsx   # 今日の入力ステータス
│   │   │   ├── latest-analysis.tsx # 直近の分析結果サマリー
│   │   │   └── weekly-calendar.tsx # 今週の入力状況
│   │   ├── input/
│   │   │   ├── daily-input-form.tsx    # 日報入力フォーム
│   │   │   └── input-field.tsx         # 入力フィールド（ラベル+テキストエリア）
│   │   ├── analysis/
│   │   │   ├── daily-report-section.tsx    # 日報セクション
│   │   │   ├── priorities-section.tsx      # 優先順位セクション
│   │   │   ├── risks-section.tsx           # リスクセクション
│   │   │   ├── consultation-section.tsx    # 相談要否セクション
│   │   │   ├── next-actions-section.tsx    # 次アクションセクション
│   │   │   └── copy-button.tsx             # コピーボタン
│   │   └── history/
│   │       ├── history-list.tsx    # 履歴一覧リスト
│   │       └── history-item.tsx    # 履歴一覧の各行
│   ├── lib/                       # ユーティリティ・ライブラリ
│   │   ├── prisma.ts              # Prismaクライアント（シングルトン）
│   │   ├── supabase.ts            # Supabaseクライアント
│   │   ├── ai/
│   │   │   ├── client.ts          # Claude APIクライアント
│   │   │   ├── prompts/
│   │   │   │   ├── main-analysis.ts    # メイン分析プロンプト
│   │   │   │   └── consultation.ts     # 相談文生成プロンプト
│   │   │   ├── parser.ts          # AI出力JSONパーサー
│   │   │   └── schemas.ts         # AI出力のZodスキーマ
│   │   └── utils.ts               # 共通ユーティリティ
│   └── types/                     # TypeScript型定義
│       ├── daily-input.ts
│       ├── analysis.ts
│       ├── consultation.ts
│       ├── goal.ts
│       └── api.ts                 # APIリクエスト/レスポンス型
├── .env.local                     # 環境変数（ローカル）
├── .env.example                   # 環境変数テンプレート
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vitest.config.ts
```

---

## 2. フロントエンドの主要コンポーネント一覧

| コンポーネント | ファイル | 責務 |
|---------------|---------|------|
| **Header** | `components/layout/header.tsx` | アプリヘッダー、ナビリンク |
| **Nav** | `components/layout/nav.tsx` | ボトムナビゲーション（ホーム/入力/履歴） |
| **PageContainer** | `components/layout/page-container.tsx` | ページ共通のパディング・幅制御 |
| **InputStatus** | `components/home/input-status.tsx` | 今日の入力状態表示（未入力/入力済/分析済） |
| **LatestAnalysis** | `components/home/latest-analysis.tsx` | 直近の分析サマリーカード |
| **WeeklyCalendar** | `components/home/weekly-calendar.tsx` | 今週の入力済み日をドット表示 |
| **DailyInputForm** | `components/input/daily-input-form.tsx` | メイン入力フォーム（4フィールド+ボタン） |
| **DailyReportSection** | `components/analysis/daily-report-section.tsx` | AI生成日報の表示+コピー |
| **PrioritiesSection** | `components/analysis/priorities-section.tsx` | 優先順位リスト（スコア・色分け） |
| **RisksSection** | `components/analysis/risks-section.tsx` | リスク一覧（重要度バッジ付き） |
| **ConsultationSection** | `components/analysis/consultation-section.tsx` | 相談要否+相談文表示+コピー |
| **NextActionsSection** | `components/analysis/next-actions-section.tsx` | 次アクション3件リスト |
| **CopyButton** | `components/analysis/copy-button.tsx` | クリップボードコピー+完了フィードバック |
| **HistoryList** | `components/history/history-list.tsx` | 履歴一覧（日付・サマリー・ステータス） |
| **HistoryItem** | `components/history/history-item.tsx` | 履歴一覧の1行コンポーネント |

---

## 3. バックエンドの主要ファイル一覧

| ファイル | 責務 |
|---------|------|
| `app/api/daily-inputs/route.ts` | 日次入力のCRUD（一覧取得・新規作成） |
| `app/api/daily-inputs/[id]/route.ts` | 日次入力の詳細取得・更新 |
| `app/api/daily-inputs/[id]/analyze/route.ts` | AI分析の実行。Claude API呼び出し→結果保存→レスポンス |
| `app/api/analyses/[id]/consultation-draft/route.ts` | 相談文のAI生成 |
| `app/api/goals/route.ts` | 目標のCRUD |
| `lib/prisma.ts` | Prismaクライアントのシングルトン管理 |
| `lib/supabase.ts` | Supabase認証クライアント |
| `lib/ai/client.ts` | Claude APIの呼び出しラッパー |
| `lib/ai/prompts/main-analysis.ts` | メイン分析用のシステムプロンプト構築 |
| `lib/ai/prompts/consultation.ts` | 相談文生成用のプロンプト構築 |
| `lib/ai/parser.ts` | LLMのJSON出力をパース・バリデーション |
| `lib/ai/schemas.ts` | AI出力のZodスキーマ定義 |

---

## 4. APIルーティング構成

```
/api
├── /daily-inputs
│   ├── GET    → 一覧取得（クエリ: year, month, page, per_page）
│   ├── POST   → 新規作成
│   └── /[id]
│       ├── GET    → 詳細取得（ai_analysisを含む）
│       ├── PUT    → 更新
│       └── /analyze
│           └── POST   → AI分析実行
├── /analyses
│   └── /[id]
│       └── /consultation-draft
│           └── POST   → 相談文生成
└── /goals
    ├── GET    → 一覧取得（クエリ: status）
    └── POST   → 新規作成
```

---

## 5. DBマイグレーション案

```sql
-- CreateEnum
CREATE TYPE input_source AS ENUM ('web', 'slack', 'voice');
CREATE TYPE input_status AS ENUM ('draft', 'submitted', 'analyzed');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'cancelled');

-- CreateTable: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable: daily_inputs
CREATE TABLE daily_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    done_today TEXT NOT NULL,
    concerns TEXT DEFAULT '',
    plan_tomorrow TEXT DEFAULT '',
    memo TEXT DEFAULT '',
    input_source input_source NOT NULL DEFAULT 'web',
    status input_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, target_date)
);

-- CreateTable: ai_analyses
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_input_id UUID NOT NULL UNIQUE REFERENCES daily_inputs(id) ON DELETE CASCADE,
    daily_report TEXT NOT NULL,
    priorities JSONB NOT NULL DEFAULT '[]',
    risks JSONB NOT NULL DEFAULT '[]',
    consultation_needed BOOLEAN NOT NULL DEFAULT false,
    consultation_target VARCHAR(50),
    consultation_reason TEXT,
    next_actions JSONB NOT NULL DEFAULT '[]',
    raw_response JSONB,
    model_version VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable: consultation_drafts
CREATE TABLE consultation_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ai_analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    target_role VARCHAR(50) NOT NULL,
    draft_text TEXT NOT NULL,
    context_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateTable: goals
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status goal_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CreateIndex
CREATE INDEX idx_daily_inputs_user_date ON daily_inputs(user_id, target_date DESC);
CREATE INDEX idx_daily_inputs_status ON daily_inputs(status);
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
```

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum InputSource {
  web
  slack
  voice
}

enum InputStatus {
  draft
  submitted
  analyzed
}

enum GoalStatus {
  active
  completed
  cancelled
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique @db.VarChar(255)
  name      String   @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  dailyInputs DailyInput[]
  goals       Goal[]

  @@map("users")
}

model DailyInput {
  id            String      @id @default(uuid()) @db.Uuid
  userId        String      @map("user_id") @db.Uuid
  targetDate    DateTime    @map("target_date") @db.Date
  doneToday     String      @map("done_today")
  concerns      String      @default("")
  planTomorrow  String      @default("") @map("plan_tomorrow")
  memo          String      @default("")
  inputSource   InputSource @default(web) @map("input_source")
  status        InputStatus @default(draft)
  createdAt     DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime    @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  aiAnalysis AiAnalysis?

  @@unique([userId, targetDate])
  @@index([userId, targetDate(sort: Desc)])
  @@index([status])
  @@map("daily_inputs")
}

model AiAnalysis {
  id                  String  @id @default(uuid()) @db.Uuid
  dailyInputId        String  @unique @map("daily_input_id") @db.Uuid
  dailyReport         String  @map("daily_report")
  priorities          Json    @default("[]")
  risks               Json    @default("[]")
  consultationNeeded  Boolean @default(false) @map("consultation_needed")
  consultationTarget  String? @map("consultation_target") @db.VarChar(50)
  consultationReason  String? @map("consultation_reason")
  nextActions         Json    @default("[]") @map("next_actions")
  rawResponse         Json?   @map("raw_response")
  modelVersion        String  @map("model_version") @db.VarChar(50)
  createdAt           DateTime @default(now()) @map("created_at") @db.Timestamptz

  dailyInput          DailyInput          @relation(fields: [dailyInputId], references: [id], onDelete: Cascade)
  consultationDrafts  ConsultationDraft[]

  @@map("ai_analyses")
}

model ConsultationDraft {
  id             String @id @default(uuid()) @db.Uuid
  aiAnalysisId   String @map("ai_analysis_id") @db.Uuid
  targetRole     String @map("target_role") @db.VarChar(50)
  draftText      String @map("draft_text")
  contextSummary String? @map("context_summary")
  createdAt      DateTime @default(now()) @map("created_at") @db.Timestamptz

  aiAnalysis AiAnalysis @relation(fields: [aiAnalysisId], references: [id], onDelete: Cascade)

  @@map("consultation_drafts")
}

model Goal {
  id          String     @id @default(uuid()) @db.Uuid
  userId      String     @map("user_id") @db.Uuid
  title       String     @db.VarChar(200)
  description String     @default("")
  periodStart DateTime   @map("period_start") @db.Date
  periodEnd   DateTime   @map("period_end") @db.Date
  status      GoalStatus @default(active)
  createdAt   DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime   @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, status])
  @@map("goals")
}
```

---

## 6. TypeScriptの型定義

### `src/types/daily-input.ts`

```typescript
export type InputSource = "web" | "slack" | "voice";
export type InputStatus = "draft" | "submitted" | "analyzed";

export interface DailyInput {
  id: string;
  userId: string;
  targetDate: string; // "YYYY-MM-DD"
  doneToday: string;
  concerns: string;
  planTomorrow: string;
  memo: string;
  inputSource: InputSource;
  status: InputStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DailyInputWithAnalysis extends DailyInput {
  aiAnalysis: AiAnalysis | null;
}

export interface CreateDailyInputRequest {
  targetDate: string;
  doneToday: string;
  concerns?: string;
  planTomorrow?: string;
  memo?: string;
  status?: InputStatus;
}

export interface UpdateDailyInputRequest {
  doneToday?: string;
  concerns?: string;
  planTomorrow?: string;
  memo?: string;
  status?: InputStatus;
}
```

### `src/types/analysis.ts`

```typescript
export interface Priority {
  rank: number;
  task: string;
  score: number; // 0-100
  urgency: "high" | "medium" | "low";
  reason: string;
  evaluation: {
    urgencyScore: number;
    importanceScore: number;
    dependencyScore: number;
    riskScore: number;
  };
}

export interface Risk {
  description: string;
  severity: "high" | "medium" | "low";
  category: "deadline" | "technical_blocker" | "communication" | "scope_creep" | "workload";
  impact: string;
  daysUntilImpact: number | null;
  suggestedMitigation: string;
}

export interface NextAction {
  action: string;
  category: "technical" | "communication" | "reporting" | "planning";
  priority: "high" | "medium" | "low";
}

export interface AiAnalysis {
  id: string;
  dailyInputId: string;
  dailyReport: string;
  priorities: Priority[];
  risks: Risk[];
  consultationNeeded: boolean;
  consultationTarget: string | null;
  consultationReason: string | null;
  nextActions: NextAction[];
  modelVersion: string;
  createdAt: string;
}

/** Claude APIから返されるメイン分析の全体構造 */
export interface MainAnalysisResponse {
  dailyReport: string;
  priorities: Priority[];
  risks: Risk[];
  consultation: {
    needed: boolean;
    target: string | null;
    reason: string | null;
    urgency: "today" | "tomorrow" | "this_week" | null;
  };
  nextActions: NextAction[];
}
```

### `src/types/consultation.ts`

```typescript
export interface ConsultationDraft {
  id: string;
  aiAnalysisId: string;
  targetRole: string;
  draftText: string;
  contextSummary: string | null;
  createdAt: string;
}

export interface CreateConsultationDraftRequest {
  targetRole: string;
  tone?: "formal" | "casual";
  includeContext?: boolean;
}
```

### `src/types/goal.ts`

```typescript
export type GoalStatus = "active" | "completed" | "cancelled";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  periodStart: string;
  periodEnd: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
}
```

### `src/types/api.ts`

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, string>;
}

export interface DailyInputListItem {
  id: string;
  targetDate: string;
  doneTodaySummary: string;
  status: InputStatus;
  hasRisks: boolean;
  consultationNeeded: boolean;
  createdAt: string;
}
```

---

## 7. 1日分析APIのサンプル実装方針

### `src/app/api/daily-inputs/[id]/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeDaily } from "@/lib/ai/client";
import { mainAnalysisSchema } from "@/lib/ai/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 入力データ取得
    const dailyInput = await prisma.dailyInput.findUnique({
      where: { id: params.id },
    });

    if (!dailyInput) {
      return NextResponse.json(
        { error: "not_found", message: "Daily input not found" },
        { status: 404 }
      );
    }

    // 2. 入力内容のバリデーション
    if (!dailyInput.doneToday.trim()) {
      return NextResponse.json(
        { error: "validation_error", message: "done_today is required for analysis" },
        { status: 422 }
      );
    }

    // 3. AI分析実行
    const analysisResult = await analyzeDaily({
      doneToday: dailyInput.doneToday,
      concerns: dailyInput.concerns,
      planTomorrow: dailyInput.planTomorrow,
      memo: dailyInput.memo,
      targetDate: dailyInput.targetDate.toISOString().split("T")[0],
    });

    // 4. バリデーション（Zodでパース）
    const validated = mainAnalysisSchema.parse(analysisResult);

    // 5. DB保存（upsert: 再分析に対応）
    const aiAnalysis = await prisma.aiAnalysis.upsert({
      where: { dailyInputId: params.id },
      create: {
        dailyInputId: params.id,
        dailyReport: validated.dailyReport,
        priorities: validated.priorities as any,
        risks: validated.risks as any,
        consultationNeeded: validated.consultation.needed,
        consultationTarget: validated.consultation.target,
        consultationReason: validated.consultation.reason,
        nextActions: validated.nextActions as any,
        rawResponse: analysisResult as any,
        modelVersion: "claude-sonnet-4-6",
      },
      update: {
        dailyReport: validated.dailyReport,
        priorities: validated.priorities as any,
        risks: validated.risks as any,
        consultationNeeded: validated.consultation.needed,
        consultationTarget: validated.consultation.target,
        consultationReason: validated.consultation.reason,
        nextActions: validated.nextActions as any,
        rawResponse: analysisResult as any,
        modelVersion: "claude-sonnet-4-6",
      },
    });

    // 6. 入力ステータスを更新
    await prisma.dailyInput.update({
      where: { id: params.id },
      data: { status: "analyzed" },
    });

    // 7. レスポンス返却
    return NextResponse.json({
      analysisId: aiAnalysis.id,
      dailyInputId: params.id,
      dailyReport: aiAnalysis.dailyReport,
      priorities: aiAnalysis.priorities,
      risks: aiAnalysis.risks,
      consultationNeeded: aiAnalysis.consultationNeeded,
      consultationTarget: aiAnalysis.consultationTarget,
      consultationReason: aiAnalysis.consultationReason,
      nextActions: aiAnalysis.nextActions,
      createdAt: aiAnalysis.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Analysis failed:", error);

    if (error instanceof Error && error.message.includes("API")) {
      return NextResponse.json(
        { error: "llm_error", message: "AI analysis service is temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
```

### `src/lib/ai/client.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { buildMainAnalysisPrompt } from "./prompts/main-analysis";
import { buildConsultationPrompt } from "./prompts/consultation";
import type { MainAnalysisResponse } from "@/types/analysis";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface DailyInputForAnalysis {
  doneToday: string;
  concerns: string;
  planTomorrow: string;
  memo: string;
  targetDate: string;
}

export async function analyzeDaily(
  input: DailyInputForAnalysis
): Promise<MainAnalysisResponse> {
  const { systemPrompt, userPrompt } = buildMainAnalysisPrompt(input);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  // JSONブロックを抽出
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr);
}

export async function generateConsultationDraft(params: {
  analysisContext: string;
  targetRole: string;
  tone: "formal" | "casual";
}): Promise<{ draftText: string; contextSummary: string }> {
  const { systemPrompt, userPrompt } = buildConsultationPrompt(params);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;

  return JSON.parse(jsonStr);
}
```

### `src/lib/ai/prompts/main-analysis.ts`

```typescript
interface PromptInput {
  doneToday: string;
  concerns: string;
  planTomorrow: string;
  memo: string;
  targetDate: string;
}

export function buildMainAnalysisPrompt(input: PromptInput) {
  const systemPrompt = `あなたは業務意思決定支援AIエージェントです。
ユーザーの日次業務報告を分析し、以下の5つの出力を生成してください。

## 出力ルール
1. **日報生成**: ビジネス文書として整形された日報。「実施事項」「課題・懸念」「明日の予定」のセクションに整理。
2. **優先順位判定**: 明日のタスクを以下の4軸で0-100でスコアリングし、加重平均で総合スコアを算出。
   - 緊急度（30%）: 期限までの残日数
   - 重要度（30%）: ビジネスインパクトの大きさ
   - 依存関係（20%）: 他タスクのブロッカーか
   - リスク影響（20%）: 放置した場合のダメージ
3. **リスク検知**: 以下のカテゴリでリスクを検出。
   - deadline: 納期遅延
   - technical_blocker: 技術的ブロッカー
   - communication: コミュニケーション不足
   - scope_creep: スコープクリープ
   - workload: 体調・負荷
4. **相談要否判定**: 以下の条件に1つでも該当すれば相談推奨。
   - 自分の判断権限を超える意思決定が必要
   - 納期に影響するリスクが発生
   - 顧客への影響が見込まれる
   - 2営業日以上ブロックされている
   - 技術的に解決策が見えない
   - 仕様の解釈に曖昧さがある
5. **次アクション提案**: 必ず3つ。具体的で明日実行可能。少なくとも1つはリスク対応、1つは通常業務推進。

## 出力形式
必ず以下のJSON形式で出力してください。JSON以外のテキストは含めないでください。

\`\`\`json
{
  "dailyReport": "string（整形された日報テキスト）",
  "priorities": [
    {
      "rank": 1,
      "task": "タスク名",
      "score": 95,
      "urgency": "high|medium|low",
      "reason": "理由",
      "evaluation": {
        "urgencyScore": 90,
        "importanceScore": 85,
        "dependencyScore": 95,
        "riskScore": 100
      }
    }
  ],
  "risks": [
    {
      "description": "リスクの説明",
      "severity": "high|medium|low",
      "category": "deadline|technical_blocker|communication|scope_creep|workload",
      "impact": "影響の説明",
      "daysUntilImpact": 2,
      "suggestedMitigation": "緩和策"
    }
  ],
  "consultation": {
    "needed": true,
    "target": "上司|顧客|チーム|null",
    "reason": "理由|null",
    "urgency": "today|tomorrow|this_week|null"
  },
  "nextActions": [
    {
      "action": "具体的なアクション",
      "category": "technical|communication|reporting|planning",
      "priority": "high|medium|low"
    }
  ]
}
\`\`\``;

  const userPrompt = `# ${input.targetDate} の業務報告

## 今日やったこと
${input.doneToday}

## 困っていること・懸念
${input.concerns || "特になし"}

## 明日やりたいこと
${input.planTomorrow || "未定"}

## その他メモ
${input.memo || "なし"}

上記の内容を分析し、JSON形式で出力してください。`;

  return { systemPrompt, userPrompt };
}
```

---

## 8. AI出力JSONスキーマ（Zod）

### `src/lib/ai/schemas.ts`

```typescript
import { z } from "zod";

const prioritySchema = z.object({
  rank: z.number().int().min(1),
  task: z.string().min(1),
  score: z.number().min(0).max(100),
  urgency: z.enum(["high", "medium", "low"]),
  reason: z.string().min(1),
  evaluation: z.object({
    urgencyScore: z.number().min(0).max(100),
    importanceScore: z.number().min(0).max(100),
    dependencyScore: z.number().min(0).max(100),
    riskScore: z.number().min(0).max(100),
  }),
});

const riskSchema = z.object({
  description: z.string().min(1),
  severity: z.enum(["high", "medium", "low"]),
  category: z.enum([
    "deadline",
    "technical_blocker",
    "communication",
    "scope_creep",
    "workload",
  ]),
  impact: z.string().min(1),
  daysUntilImpact: z.number().nullable(),
  suggestedMitigation: z.string().min(1),
});

const nextActionSchema = z.object({
  action: z.string().min(1),
  category: z.enum(["technical", "communication", "reporting", "planning"]),
  priority: z.enum(["high", "medium", "low"]),
});

const consultationSchema = z.object({
  needed: z.boolean(),
  target: z.string().nullable(),
  reason: z.string().nullable(),
  urgency: z.enum(["today", "tomorrow", "this_week"]).nullable(),
});

export const mainAnalysisSchema = z.object({
  dailyReport: z.string().min(1),
  priorities: z.array(prioritySchema).min(1),
  risks: z.array(riskSchema),
  consultation: consultationSchema,
  nextActions: z.array(nextActionSchema).length(3),
});

export const consultationDraftSchema = z.object({
  draftText: z.string().min(1),
  contextSummary: z.string(),
});

export type MainAnalysisOutput = z.infer<typeof mainAnalysisSchema>;
export type ConsultationDraftOutput = z.infer<typeof consultationDraftSchema>;
```

---

## 9. MVPで最初に作る画面のコード骨子

### 入力画面 `src/app/input/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { DailyInputForm } from "@/components/input/daily-input-form";

export default function InputPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: {
    doneToday: string;
    concerns: string;
    planTomorrow: string;
    memo: string;
  }) => {
    setIsSubmitting(true);
    try {
      // 1. 入力を保存
      const inputRes = await fetch("/api/daily-inputs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetDate: new Date().toISOString().split("T")[0],
          ...data,
          status: "submitted",
        }),
      });
      const input = await inputRes.json();

      // 2. AI分析を実行
      const analysisRes = await fetch(
        `/api/daily-inputs/${input.id}/analyze`,
        { method: "POST" }
      );
      const analysis = await analysisRes.json();

      // 3. 分析結果画面へ遷移
      router.push(`/analysis/${analysis.analysisId}`);
    } catch (error) {
      console.error("Submit failed:", error);
      // TODO: エラーUI表示
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: {
    doneToday: string;
    concerns: string;
    planTomorrow: string;
    memo: string;
  }) => {
    await fetch("/api/daily-inputs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetDate: new Date().toISOString().split("T")[0],
        ...data,
        status: "draft",
      }),
    });
  };

  return (
    <PageContainer title="今日の入力" backHref="/">
      <DailyInputForm
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        isSubmitting={isSubmitting}
      />
    </PageContainer>
  );
}
```

### 入力フォームコンポーネント `src/components/input/daily-input-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FormData {
  doneToday: string;
  concerns: string;
  planTomorrow: string;
  memo: string;
}

interface Props {
  onSubmit: (data: FormData) => Promise<void>;
  onSaveDraft: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Partial<FormData>;
}

export function DailyInputForm({
  onSubmit,
  onSaveDraft,
  isSubmitting,
  initialData,
}: Props) {
  const [form, setForm] = useState<FormData>({
    doneToday: initialData?.doneToday ?? "",
    concerns: initialData?.concerns ?? "",
    planTomorrow: initialData?.planTomorrow ?? "",
    memo: initialData?.memo ?? "",
  });

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.doneToday.trim().length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">今日やったこと *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="今日の業務内容を入力してください"
            value={form.doneToday}
            onChange={(e) => updateField("doneToday", e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">困っていること・懸念</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="困っていることや心配事があれば入力してください"
            value={form.concerns}
            onChange={(e) => updateField("concerns", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">明日やりたいこと</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="明日取り組みたいことを入力してください"
            value={form.planTomorrow}
            onChange={(e) => updateField("planTomorrow", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">その他メモ（任意）</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="メモがあれば入力してください"
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onSaveDraft(form)}
        >
          下書き保存
        </Button>
        <Button
          className="flex-1"
          onClick={() => onSubmit(form)}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "分析中..." : "分析する"}
        </Button>
      </div>
    </div>
  );
}
```

### AI分析結果画面 `src/app/analysis/[id]/page.tsx`

```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { DailyReportSection } from "@/components/analysis/daily-report-section";
import { PrioritiesSection } from "@/components/analysis/priorities-section";
import { RisksSection } from "@/components/analysis/risks-section";
import { ConsultationSection } from "@/components/analysis/consultation-section";
import { NextActionsSection } from "@/components/analysis/next-actions-section";
import type { Priority, Risk, NextAction } from "@/types/analysis";

export default async function AnalysisPage({
  params,
}: {
  params: { id: string };
}) {
  const analysis = await prisma.aiAnalysis.findUnique({
    where: { id: params.id },
    include: {
      dailyInput: true,
      consultationDrafts: true,
    },
  });

  if (!analysis) {
    notFound();
  }

  return (
    <PageContainer
      title="AI分析結果"
      subtitle={analysis.dailyInput.targetDate.toISOString().split("T")[0]}
      backHref="/"
    >
      <div className="space-y-6">
        <DailyReportSection report={analysis.dailyReport} />

        <PrioritiesSection
          priorities={analysis.priorities as unknown as Priority[]}
        />

        <RisksSection risks={analysis.risks as unknown as Risk[]} />

        <ConsultationSection
          needed={analysis.consultationNeeded}
          target={analysis.consultationTarget}
          reason={analysis.consultationReason}
          analysisId={analysis.id}
          existingDraft={analysis.consultationDrafts[0] ?? null}
        />

        <NextActionsSection
          actions={analysis.nextActions as unknown as NextAction[]}
        />
      </div>
    </PageContainer>
  );
}
```

---

## 10. 優先順位判定ロジックの擬似コード

以下はAIプロンプトの補助として、バックエンドでも再計算・検証できるようにするための擬似コード。

```typescript
// src/lib/ai/scoring.ts

interface TaskForScoring {
  task: string;
  urgencyHint?: string;    // "今日中", "今週中", "期限なし" 等
  hasBlocker?: boolean;     // 他タスクをブロックしているか
  relatedRisk?: string;     // 関連するリスクがあるか
  businessImpact?: string;  // "顧客影響", "社内のみ" 等
}

interface ScoringResult {
  task: string;
  urgencyScore: number;
  importanceScore: number;
  dependencyScore: number;
  riskScore: number;
  totalScore: number;
  urgencyLabel: "high" | "medium" | "low";
}

// 緊急度スコアの算出
function calcUrgencyScore(hint?: string): number {
  if (!hint) return 50; // デフォルト中程度

  const urgencyMap: Record<string, number> = {
    "当日中": 95,
    "今日中": 95,
    "明日まで": 80,
    "翌営業日": 80,
    "今週中": 60,
    "来週まで": 40,
    "期限なし": 20,
    "余裕あり": 15,
  };

  for (const [keyword, score] of Object.entries(urgencyMap)) {
    if (hint.includes(keyword)) return score;
  }
  return 50;
}

// 重要度スコアの算出
function calcImportanceScore(impact?: string): number {
  if (!impact) return 50;

  const importanceMap: Record<string, number> = {
    "売上": 95,
    "顧客": 90,
    "納期": 85,
    "プロジェクト": 70,
    "チーム": 55,
    "自分": 40,
    "nice to have": 20,
  };

  for (const [keyword, score] of Object.entries(importanceMap)) {
    if (impact.includes(keyword)) return score;
  }
  return 50;
}

// 依存関係スコアの算出
function calcDependencyScore(hasBlocker?: boolean): number {
  return hasBlocker ? 90 : 30;
}

// リスク影響スコアの算出
function calcRiskScore(relatedRisk?: string): number {
  if (!relatedRisk) return 20;
  // リスクが関連している場合、高スコア
  return 80;
}

// 総合スコア算出
export function calculatePriorityScore(task: TaskForScoring): ScoringResult {
  const urgencyScore = calcUrgencyScore(task.urgencyHint);
  const importanceScore = calcImportanceScore(task.businessImpact);
  const dependencyScore = calcDependencyScore(task.hasBlocker);
  const riskScore = calcRiskScore(task.relatedRisk);

  // 加重平均
  const totalScore = Math.round(
    urgencyScore * 0.3 +
    importanceScore * 0.3 +
    dependencyScore * 0.2 +
    riskScore * 0.2
  );

  // ラベル判定
  let urgencyLabel: "high" | "medium" | "low";
  if (totalScore >= 70) urgencyLabel = "high";
  else if (totalScore >= 40) urgencyLabel = "medium";
  else urgencyLabel = "low";

  return {
    task: task.task,
    urgencyScore,
    importanceScore,
    dependencyScore,
    riskScore,
    totalScore,
    urgencyLabel,
  };
}

// 相談要否判定
interface ConsultationInput {
  risks: Array<{ severity: string; category: string; daysUntilImpact: number | null }>;
  concerns: string;
  daysBlocked?: number;
}

interface ConsultationResult {
  needed: boolean;
  target: string | null;
  reason: string | null;
  urgency: "today" | "tomorrow" | "this_week" | null;
  matchedRules: string[];
}

export function evaluateConsultationNeed(input: ConsultationInput): ConsultationResult {
  const matchedRules: string[] = [];
  let target: string | null = null;
  let urgency: "today" | "tomorrow" | "this_week" | null = null;

  // ルール1: 高重要度のリスクがある
  const highRisks = input.risks.filter((r) => r.severity === "high");
  if (highRisks.length > 0) {
    matchedRules.push("高重要度のリスクが検出された");
    target = "上司";
    urgency = "today";
  }

  // ルール2: 納期に影響するリスク
  const deadlineRisks = input.risks.filter(
    (r) => r.category === "deadline" && r.daysUntilImpact !== null && r.daysUntilImpact <= 3
  );
  if (deadlineRisks.length > 0) {
    matchedRules.push("3日以内に納期影響のあるリスクが存在");
    target = target ?? "上司";
    urgency = "today";
  }

  // ルール3: 2日以上ブロックされている
  if (input.daysBlocked && input.daysBlocked >= 2) {
    matchedRules.push("2営業日以上ブロックされている課題がある");
    target = target ?? "チーム";
    urgency = urgency ?? "tomorrow";
  }

  // ルール4: 顧客関連の懸念
  if (input.concerns.includes("顧客") || input.concerns.includes("クライアント")) {
    matchedRules.push("顧客への影響が懸念される");
    target = "上司";
    urgency = "today";
  }

  const needed = matchedRules.length > 0;
  const reason = needed ? matchedRules.join("。") : null;

  return { needed, target, reason, urgency, matchedRules };
}
```

---

## 環境変数テンプレート（.env.example）

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxxxx"
SUPABASE_SERVICE_ROLE_KEY="xxxxx"

# Anthropic (Claude API)
ANTHROPIC_API_KEY="sk-ant-xxxxx"

# OpenAI (Whisper - Phase 2)
# OPENAI_API_KEY="sk-xxxxx"
```
