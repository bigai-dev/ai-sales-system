import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { getPrimaryRep } from "@/lib/queries/reps";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPrimaryRep();
  return (
    <div className="min-h-screen">
      <Sidebar user={user} />
      <main className="md:pl-60">
        <TopBar />
        <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
