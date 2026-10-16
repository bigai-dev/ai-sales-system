import { ButtonLink, EmptyState } from "@/components/ui";
import { routes } from "@/lib/constants/routes";
import { ERR } from "@/lib/constants/copy";

// Rendered (inside the app shell) whenever a detail page calls notFound():
// a client, call or play that no longer exists, or an out-of-date link.
export default function DashboardNotFound() {
  return (
    <section className="max-w-2xl">
      <EmptyState
        title={ERR.notFound}
        hint="It may have been deleted, or the link you followed is out of date."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href={routes.today()}>Back to Today</ButtonLink>
            <ButtonLink href={routes.clients()} variant="ghost">
              Clients
            </ButtonLink>
            <ButtonLink href={routes.calls()} variant="ghost">
              Calls
            </ButtonLink>
          </div>
        }
      />
    </section>
  );
}
