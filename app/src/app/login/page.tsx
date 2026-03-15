"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Supabase未設定の場合はホームにリダイレクト（MVPモード）
    if (!supabase) {
      router.replace("/");
    }
  }, [supabase, router]);

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-400">リダイレクト中...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("確認メールを送信しました。メールを確認してください。");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Work Decision Agent
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          業務意思決定エージェント
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">
            {isSignUp ? "アカウント作成" : "ログイン"}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md p-3">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="6文字以上"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading
              ? "処理中..."
              : isSignUp
              ? "アカウント作成"
              : "ログイン"}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isSignUp
              ? "既にアカウントをお持ちの方はこちら"
              : "アカウントを作成する"}
          </button>
        </form>
      </div>
    </div>
  );
}
