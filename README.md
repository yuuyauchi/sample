# Work Decision Agent（業務意思決定エージェント）

AI を活用した業務意思決定支援システム。日々の業務報告をもとに、タスク優先度の評価・リスク検出・上司への相談判断を自動で行います。

## 主な機能

### 日次インプット（`/input`）
- 今日やったこと・困りごと・明日の予定・メモを入力
- **音声入力対応** — マイクから録音し、Whisper API で自動文字起こし
- 1日1回のユニーク制約あり

### AI 分析（`/analysis/[id]`）
- Claude API による自動分析
- **日報生成** — 構造化された業務報告
- **優先度スコアリング** — 緊急度・重要度・依存度・リスクの4軸で 0-100 点評価
- **リスク検出** — 納期・技術的ブロッカー・コミュニケーション・スコープ拡大・負荷の5カテゴリ
- **相談判断** — 上司やステークホルダーへの相談が必要かを自動判定
- **ネクストアクション** — 具体的な次の行動を3つ提案

### 目標管理（`/goals`）
- 目標の作成・編集・削除
- ステータス管理（進行中 / 完了 / 中止）
- 期間設定（開始日・終了日）

### 履歴（`/history`）
- 月別の分析結果一覧
- 過去の分析詳細表示

### ダッシュボード（`/`）
- 当日のステータス表示
- 最新の分析結果サマリ
- 週間カレンダー

### Slack 連携
- `/daily-input <内容>` — Slack から日次入力 + AI 分析を実行
- `/status` — 当日の入力状況を確認
- Block Kit による構造化レスポンス

### 認証
- Supabase Auth によるメール/パスワード認証
- ミドルウェアによる自動リダイレクト
- Supabase 未設定時は MVP モード（認証不要）で動作

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 (App Router) / React 19 |
| スタイリング | Tailwind CSS 4 |
| バックエンド | Next.js API Routes |
| データベース | PostgreSQL |
| ORM | Prisma 7 |
| AI 分析 | Claude API (@anthropic-ai/sdk) |
| 音声入力 | OpenAI Whisper API |
| 認証 | Supabase Auth |
| バリデーション | Zod 4 |
| コンテナ | Docker / Docker Compose |
| 言語 | TypeScript 5 |

## セットアップ

### Docker で起動（推奨）

```bash
# 環境変数を設定
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定

# 起動（DB + アプリ + マイグレーション）
docker compose up -d

# ログ確認
docker compose logs -f app
```

http://localhost:3000 でアクセスできます。

### ローカル開発

#### 前提条件

- Node.js 20+
- PostgreSQL
- Anthropic API キー

#### インストール

```bash
cd app
npm install
```

#### 環境変数

`app/.env.local` を作成：

```env
# 必須
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/work_decision_agent
ANTHROPIC_API_KEY=sk-ant-xxx

# Supabase Auth（任意 — 未設定時は MVP モードで動作）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 音声入力（任意）
OPENAI_API_KEY=sk-xxx

# Slack 連携（任意）
SLACK_VERIFICATION_TOKEN=your-token
SLACK_BOT_TOKEN=xoxb-xxx
```

#### データベースのセットアップ

```bash
cd app
npx prisma db push
npx prisma generate
```

#### 開発サーバーの起動

```bash
cd app
npm run dev
```

## Docker 構成

```
docker-compose.yml
├── db        PostgreSQL 16 (Alpine)
├── app       Next.js アプリケーション（マルチステージビルド）
└── migrate   Prisma マイグレーション（起動時に1回実行）
```

- `db` のデータは `postgres_data` ボリュームに永続化
- `app` は standalone モードでビルド（軽量イメージ）
- 環境変数は `.env` ファイルまたは `docker compose` の `environment` で設定

## プロジェクト構成

```
sample/
├── docker-compose.yml        # Docker 構成
├── .env.example              # 環境変数テンプレート
├── docs/design/              # 設計ドキュメント
│   ├── mvp-design.md
│   └── implementation-guide.md
└── app/
    ├── Dockerfile            # マルチステージビルド
    ├── src/
    │   ├── app/              # ページ & API ルート
    │   │   ├── page.tsx              # ダッシュボード
    │   │   ├── login/                # ログインページ
    │   │   ├── input/                # 日次入力フォーム（音声入力対応）
    │   │   ├── analysis/[id]/        # 分析結果表示
    │   │   ├── history/              # 履歴一覧・詳細
    │   │   ├── goals/                # 目標管理
    │   │   ├── auth/callback/        # Supabase Auth コールバック
    │   │   └── api/
    │   │       ├── daily-inputs/     # 日次入力 CRUD + 分析
    │   │       ├── analyses/         # 相談文面生成
    │   │       ├── goals/            # 目標 CRUD
    │   │       ├── voice/            # 音声文字起こし
    │   │       └── slack/            # Slack 連携
    │   ├── components/       # UI コンポーネント
    │   │   ├── analysis/             # 分析結果表示
    │   │   ├── layout/               # ヘッダー・レイアウト
    │   │   ├── voice/                # 音声録音コンポーネント
    │   │   └── ui/                   # 汎用 UI パーツ
    │   ├── lib/              # ビジネスロジック
    │   │   ├── prisma.ts             # DB クライアント
    │   │   ├── auth.ts               # 認証ヘルパー
    │   │   ├── ai/                   # Claude API 連携
    │   │   └── supabase/             # Supabase クライアント
    │   └── types/            # TypeScript 型定義
    └── prisma/
        └── schema.prisma     # データベーススキーマ
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
| GET | `/api/goals` | 目標一覧（ステータスフィルタ対応） |
| POST | `/api/goals` | 目標作成 |
| GET | `/api/goals/[id]` | 目標詳細 |
| PUT | `/api/goals/[id]` | 目標更新 |
| DELETE | `/api/goals/[id]` | 目標削除 |
| POST | `/api/voice/transcribe` | 音声文字起こし |
| POST | `/api/slack/commands` | Slack スラッシュコマンド |
| POST | `/api/slack/events` | Slack イベント |

## Slack 連携の設定

1. [Slack API](https://api.slack.com/apps) でアプリを作成
2. Slash Commands を追加：
   - `/daily-input` → `https://your-domain/api/slack/commands`
   - `/status` → `https://your-domain/api/slack/commands`
3. Event Subscriptions を有効化：
   - Request URL: `https://your-domain/api/slack/events`
4. 環境変数に `SLACK_VERIFICATION_TOKEN` と `SLACK_BOT_TOKEN` を設定

## 開発ロードマップ

- **Phase 1 (MVP)** — Web 入力 → AI 分析 → 結果表示 ✅
- **Phase 2** — 音声入力（Whisper API） ✅
- **Phase 3** — Slack 連携 ✅
- **Phase 4** — 目標管理 ✅
- **Phase 5** — 認証（Supabase Auth） ✅

## スクリプト

```bash
npm run dev    # 開発サーバー起動
npm run build  # プロダクションビルド
npm run start  # プロダクションサーバー起動
npm run lint   # ESLint 実行
```
