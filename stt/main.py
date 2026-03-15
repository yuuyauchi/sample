"""Minimal OpenAI-compatible STT server using faster-whisper."""

import io
import tempfile
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel

app = FastAPI()

model = None


def get_model():
    global model
    if model is None:
        model = WhisperModel("base", device="cpu", compute_type="int8")
    return model


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    model: str = Form("faster-whisper"),
    language: str = Form("ja"),
    response_format: str = Form("json"),
):
    contents = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
        tmp.write(contents)
        tmp.flush()

        whisper = get_model()
        segments, info = whisper.transcribe(tmp.name, language=language, beam_size=5)
        text = "".join(seg.text for seg in segments)

    return JSONResponse(content={"text": text})


@app.get("/health")
async def health():
    return {"status": "ok"}
