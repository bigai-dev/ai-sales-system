import { PageSkeleton } from "@/components/ui";

// Shown while any page in the app shell is loading its data.
export default function Loading() {
  return <PageSkeleton panels={3} />;
}
