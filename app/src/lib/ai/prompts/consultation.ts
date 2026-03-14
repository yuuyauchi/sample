interface ConsultationPromptInput {
  analysisContext: string;
  risks: string;
  concerns: string;
  targetRole: string;
  tone: "formal" | "casual";
}

export function buildConsultationPrompt(input: ConsultationPromptInput) {
  const toneInstruction = input.tone === "formal"
    ? "丁寧語・敬語を使い、ビジネスメールとして適切なトーンで書いてください。"
    : "カジュアルなトーンで、Slackメッセージのように書いてください。";

  const systemPrompt = `あなたは業務相談文の生成AIです。
ユーザーの業務状況とリスク情報を元に、${input.targetRole}への相談文を生成してください。

## ルール
- ${toneInstruction}
- 構成: 「状況説明 → 影響・リスク → 対応案 → 依頼事項」の順で書く
- 簡潔に、要点を明確に書く
- 相手が判断しやすいよう、選択肢を提示する

## 出力形式
必ず以下のJSON形式のみで出力してください。

\`\`\`json
{
  "draftText": "相談文のテキスト（改行は\\nで表現）",
  "contextSummary": "相談の背景を1-2文で要約"
}
\`\`\``;

  const userPrompt = `## 業務状況
${input.analysisContext}

## リスク・懸念
${input.risks}

## 困っていること
${input.concerns}

## 相談先
${input.targetRole}

上記の情報を元に、${input.targetRole}への相談文をJSON形式で生成してください。`;

  return { systemPrompt, userPrompt };
}
