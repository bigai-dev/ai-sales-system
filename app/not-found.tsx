import Link from "next/link";

// Catch-all for URLs that don't match any page (typos, stale links).
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="panel p-8 text-center max-w-md">
        <div className="text-xs text-muted uppercase tracking-wider">
          Page not found
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          That page doesn&apos;t exist
        </h1>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          The address may be mistyped or the link is out of date.
        </p>
        <Link href="/" className="btn inline-block mt-6">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
