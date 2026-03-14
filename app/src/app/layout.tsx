import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Work Decision Agent - 業務意思決定エージェント",
  description: "日報入力を起点に、意思決定まで支援するAIエージェント",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
