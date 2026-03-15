"use client";

import { useState, useRef } from "react";

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
}

const SUPPORTED_MIME_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
] as const;

function getSupportedMimeType(): string | undefined {
  return SUPPORTED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
  };
  return map[mimeType] ?? "webm";
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  const startRecording = async () => {
    setError(null);
    try {
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        setError("このブラウザは音声録音に対応していません");
        return;
      }
      mimeTypeRef.current = mimeType;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        await transcribe(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("マイクへのアクセスが許可されていません");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    setError(null);
    try {
      const ext = getExtension(mimeTypeRef.current);
      const formData = new FormData();
      formData.append("audio", blob, `recording.${ext}`);

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "文字起こしに失敗しました");
      }

      onTranscription(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {recording ? (
        <button
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          録音停止
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={transcribing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-14 0m14 0a7 7 0 00-14 0m14 0v1a7 7 0 01-14 0v-1m7 8v4m-4 0h8"
            />
          </svg>
          {transcribing ? "文字起こし中..." : "音声入力"}
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
