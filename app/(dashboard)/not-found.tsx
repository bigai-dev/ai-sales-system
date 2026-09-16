import Link from "next/link";

// Rendered (inside the dashboard shell) whenever a detail page calls
// notFound(): a client, call, play, or drill that no longer exists, or a
// link/bookmark to a record that was deleted. Friendlier than a bare 404.
export default function DashboardNotFound() {
  return (
    <section className="max-w-2xl">
      <div className="panel p-8 text-center">
        <div className="text-xs text-muted uppercase tracking-wider">
          Nothing here
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          This record no longer exists
        </h1>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          It may have been deleted, or the link you followed is out of date.
          Head back to the dashboard to find what you were looking for.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/today" className="btn">
            Back to dashboard
          </Link>
          <Link href="/clients" className="btn-ghost">
            Clients
          </Link>
          <Link href="/calls" className="btn-ghost">
            Calls
          </Link>
        </div>
      </div>
    </section>
  );
}
