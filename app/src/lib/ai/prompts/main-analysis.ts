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
   リスクがない場合は空配列を返す。
4. **相談要否判定**: 以下の条件に1つでも該当すれば相談推奨。
   - 自分の判断権限を超える意思決定が必要
   - 納期に影響するリスクが発生
   - 顧客への影響が見込まれる
   - 2営業日以上ブロックされている
   - 技術的に解決策が見えない
   - 仕様の解釈に曖昧さがある
   該当しない場合は needed: false とし、target/reason/urgency は null にする。
5. **次アクション提案**: 必ず3つ。具体的で明日実行可能。少なくとも1つはリスク対応（リスクがなければ予防的アクション）、1つは通常業務推進。

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
      "priority": "high"
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
