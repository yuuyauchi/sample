# Work Decision Agent（業務意思決定エージェント）

AI を活用した業務意思決定支援システム。日々の業務報告をもとに、タスク優先度の評価・リスク検出・上司への相談判断を自動で行います。

## 主な機能（現在利用可能）

### 日次インプット（`/input`）
- 今日やったこと・困りごと・明日の予定・メモを入力
- 1日1回のユニーク制約あり

### AI 分析（`/analysis/[id]`）
- Claude API による自動分析
- **日報生成** — 構造化された業務報告
- **優先度スコアリング** — 緊急度・重要度・依存度・リスクの4軸で 0-100 点評価
- **リスク検出** — 納期・技術的ブロッカー・コミュニケーション・スコープ拡大・負荷の5カテゴリ
- **相談判断** — 上司やステークホルダーへの相談が必要かを自動判定
- **ネクストアクション** — 具体的な次の行動を3つ提案

### 履歴（`/history`）
- 月別の分析結果一覧
- 過去の分析詳細表示

### ダッシュボード（`/`）
- 当日のステータス表示
- 最新の分析結果サマリ
- 週間カレンダー

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 (App Router) / React 19 |
| スタイリング | Tailwind CSS 4 |
| バックエンド | Next.js API Routes |
| データベース | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| AI | Claude API (@anthropic-ai/sdk) |
| 認証 | Supabase Auth（準備済み） |
| バリデーション | Zod 4 |
| 言語 | TypeScript 5 |

## セットアップ

### 前提条件

- Node.js 18+
- PostgreSQL（または Supabase プロジェクト）
- Anthropic API キー

### インストール

```bash
cd app
npm install
```

### 環境変数

`app/.env.local` を作成し、以下を設定：

```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

### データベースのセットアップ

```bash
cd app
npx prisma db push
npx prisma generate
```

### 開発サーバーの起動

```bash
cd app
npm run dev
```

http://localhost:3000 でアクセスできます。

## プロジェクト構成

```
sample/
├── docs/design/          # 設計ドキュメント
│   ├── mvp-design.md
│   └── implementation-guide.md
└── app/
    ├── src/
    │   ├── app/           # ページ & API ルート
    │   │   ├── page.tsx           # ダッシュボード
    │   │   ├── input/             # 日次入力フォーム
    │   │   ├── analysis/[id]/     # 分析結果表示
    │   │   ├── history/           # 履歴一覧・詳細
    │   │   └── api/               # REST API エンドポイント
    │   ├── components/    # UI コンポーネント
    │   ├── lib/           # ビジネスロジック
    │   │   ├── prisma.ts          # DB クライアント
    │   │   └── ai/                # Claude API 連携
    │   └── types/         # TypeScript 型定義
    └── prisma/
        └── schema.prisma  # データベーススキーマ
```

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/daily-inputs` | 日次インプット作成 |
| GET | `/api/daily-inputs` | インプット一覧（月別フィルタ対応） |
| GET | `/api/daily-inputs/[id]` | インプット詳細（分析結果付き） |
| PUT | `/api/daily-inputs/[id]` | インプット更新 |
| POST | `/api/daily-inputs/[id]/analyze` | AI 分析実行 |
| POST | `/api/analyses/[id]/consultation-draft` | 相談文面生成 |
| GET/POST | `/api/goals` | 目標 CRUD |

## 開発ロードマップ

- **Phase 1 (MVP)** — Web 入力 → AI 分析 → 結果表示 ✅
- **Phase 2** — 音声入力（Whisper API）
- **Phase 3** — Slack 連携
- **Phase 4** — 目標管理・週次レビュー
- **Phase 5** — マルチユーザー・高度な機能

## スクリプト

```bash
npm run dev    # 開発サーバー起動
npm run build  # プロダクションビルド
npm run start  # プロダクションサーバー起動
npm run lint   # ESLint 実行
```
