"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "ホーム" },
    { href: "/input", label: "入力" },
    { href: "/history", label: "履歴" },
  ];

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-gray-900">
          Work Agent
        </Link>
        <nav className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
