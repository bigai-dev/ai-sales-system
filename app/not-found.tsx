import { ButtonLink, EmptyState } from "@/components/ui";
import { routes } from "@/lib/constants/routes";

// Catch-all for addresses that don't match any page (typos, stale links).
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <EmptyState
          title="That page doesn't exist"
          hint="The address may be mistyped or the link is out of date."
          action={<ButtonLink href={routes.today()}>Back to Today</ButtonLink>}
        />
      </div>
    </main>
  );
}
