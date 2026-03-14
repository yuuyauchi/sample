import { NextRequest, NextResponse } from "next/server";

// POST /api/voice/transcribe - 音声ファイルを文字起こし（OpenAI Whisper API）
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json(
        { error: "validation_error", message: "audio file is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "config_error",
          message: "OpenAI API key is not configured",
        },
        { status: 500 }
      );
    }

    // Forward to OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append("file", audio);
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", "ja");
    whisperForm.append("response_format", "json");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Whisper API error:", errText);
      return NextResponse.json(
        { error: "transcription_error", message: "文字起こしに失敗しました" },
        { status: 502 }
      );
    }

    const result = await response.json();
    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "internal_error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
