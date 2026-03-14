import Link from "next/link";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  subtitle,
  backHref,
  children,
}: PageContainerProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        {backHref && (
          <Link
            href={backHref}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; 戻る
          </Link>
        )}
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
