"use client";

import { useState } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = "コピー" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2.5 py-1 text-xs font-medium rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {copied ? "コピー済" : label}
    </button>
  );
}
