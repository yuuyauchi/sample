import { NextRequest, NextResponse } from "next/server";

const STT_BASE_URL =
  process.env.STT_BASE_URL || "http://localhost:8000";

// POST /api/voice/transcribe - 音声ファイルを文字起こし（faster-whisper）
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

    // Forward to faster-whisper server (OpenAI-compatible API)
    const whisperForm = new FormData();
    whisperForm.append("file", audio);
    whisperForm.append("model", "faster-whisper");
    whisperForm.append("language", "ja");
    whisperForm.append("response_format", "json");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(
        `${STT_BASE_URL}/v1/audio/transcriptions`,
        {
          method: "POST",
          body: whisperForm,
          signal: controller.signal,
        }
      );
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === "AbortError"
      ) {
        return NextResponse.json(
          {
            error: "timeout_error",
            message:
              "文字起こしがタイムアウトしました。もう一度お試しください",
          },
          { status: 504 }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("STT API error:", errText);
      return NextResponse.json(
        {
          error: "transcription_error",
          message: "文字起こしに失敗しました",
        },
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
