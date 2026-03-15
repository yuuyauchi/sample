#!/bin/sh
# Start Ollama server in the background
ollama serve &

# Wait for the server to be ready
echo "Waiting for Ollama server to start..."
until ollama list > /dev/null 2>&1; do
  sleep 1
done
echo "Ollama server is ready."

# Pull the model if not already present
MODEL="${LLM_MODEL:-qwen2.5:7b}"
echo "Ensuring model '$MODEL' is available..."
ollama pull "$MODEL"
echo "Model '$MODEL' is ready."

# Keep the server running in the foreground
wait
