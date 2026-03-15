export interface ExistingTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: string;
}

interface PromptInput {
  content: string;
  targetDate: string;
  existingTasks?: ExistingTask[];
}

export function buildMainAnalysisPrompt(input: PromptInput) {
  const existingTasksSection = input.existingTasks && input.existingTasks.length > 0
    ? `
6. **既存タスク更新**: 以下の既存タスクリストを確認し、ユーザーの報告内容に基づいてステータス変更が必要なタスクを判定してください。
   - 「完了した」「終わった」「対応済み」などの記述があればステータスを "done" に
   - 「着手した」「取り掛かっている」「進めている」などの記述があればステータスを "in_progress" に
   - 「まだ」「未着手」「これから」などの記述があればステータスを "todo" に
   - 報告内容に言及がないタスクは taskUpdates に含めないでください
   - タスクのタイトルと報告内容の意味的な一致で判断してください（完全一致でなくてOK）`
    : "";

  const taskUpdatesSchema = input.existingTasks && input.existingTasks.length > 0
    ? `,
  "taskUpdates": [
    {
      "taskId": "既存タスクのID",
      "newStatus": "done",
      "reason": "報告内容からの判断理由"
    }
  ]`
    : "";

  const existingTasksList = input.existingTasks && input.existingTasks.length > 0
    ? `\n\n## 既存タスク一覧\n${input.existingTasks.map((t) =>
        `- [${t.id}] "${t.title}" (ステータス: ${t.status === "todo" ? "未着手" : t.status === "in_progress" ? "進行中" : "完了"}, 優先度: ${t.priority})`
      ).join("\n")}`
    : "";

  const systemPrompt = `あなたは業務意思決定支援AIエージェントです。
ユーザーの日次業務報告を分析し、以下の出力を生成してください。

## 出力ルール
1. **日報生成**: ビジネス文書として整形された日報。「実施事項」「課題・懸念」「明日の予定」のセクションに整理。
2. **優先順位判定**: 明日のタスクを以下の4軸で0-100でスコアリングし、加重平均で総合スコアを算出。
   - 緊急度（30%）: 期限までの残日数
   - 重要度（30%）: ビジネスインパクトの大きさ
   - 依存関係（20%）: 他タスクのブロッカーか
   - リスク影響（20%）: 放置した場合のダメージ
   以下の追加フィールドはユーザーの入力に明示的な記述がある場合のみ抽出してください。言及がなければnullまたは空にしてください。AIが推測して埋めてはいけません。
   - dueDate: ユーザーが「○日まで」「金曜まで」等の期限を明示した場合のみISO日付で設定。言及なしならnull。
   - estimatedHours: ユーザーが「2時間くらい」「半日」等の工数を明示した場合のみ数値で設定。言及なしならnull。
   - acceptanceCriteria: ユーザーが完了条件や成果物を明示した場合のみ設定。言及なしなら空文字。
   - tags: タスクに直接関連する固有名詞やキーワードがユーザーの入力に含まれている場合のみ抽出。
3. **リスク検知**: 以下のカテゴリでリスクを検出。
   - deadline: 納期遅延
   - technical_blocker: 技術的ブロッカー
   - communication: コミュニケーション不足
   - scope_creep: スコープクリープ
   - workload: 体調・負荷
   リスクがない場合は空配列を返す。
4. **相談要否判定**: 以下の条件に1つでも該当すれば相談推奨。
   - 自分の判断権限を超える意思決定が必要
   - 納期に影響するリスクが発生
   - 顧客への影響が見込まれる
   - 2営業日以上ブロックされている
   - 技術的に解決策が見えない
   - 仕様の解釈に曖昧さがある
   該当しない場合は needed: false とし、target/reason/urgency は null にする。
5. **次アクション提案**: 必ず3つ。具体的で明日実行可能。少なくとも1つはリスク対応（リスクがなければ予防的アクション）、1つは通常業務推進。dueDate・estimatedHours・tagsはルール2と同様、ユーザーの入力に明示的な記述がある場合のみ抽出してください。${existingTasksSection}

## 出力形式
必ず以下のJSON形式のみで出力してください。JSON以外のテキストは含めないでください。

\`\`\`json
{
  "dailyReport": "string（整形された日報テキスト。改行は\\nで表現）",
  "priorities": [
    {
      "rank": 1,
      "task": "タスク名",
      "score": 95,
      "urgency": "high",
      "reason": "理由",
      "dueDate": null,
      "estimatedHours": null,
      "acceptanceCriteria": "",
      "tags": [],
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
      "severity": "high",
      "category": "deadline",
      "impact": "影響の説明",
      "daysUntilImpact": 2,
      "suggestedMitigation": "緩和策"
    }
  ],
  "consultation": {
    "needed": true,
    "target": "上司",
    "reason": "理由",
    "urgency": "today"
  },
  "nextActions": [
    {
      "action": "具体的なアクション",
      "category": "technical",
      "priority": "high",
      "dueDate": null,
      "estimatedHours": null,
      "tags": []
    }
  ]${taskUpdatesSchema}
}
\`\`\``;

  const userPrompt = `# ${input.targetDate} の業務報告

${input.content}${existingTasksList}

上記の内容を分析し、JSON形式で出力してください。`;

  return { systemPrompt, userPrompt };
}
