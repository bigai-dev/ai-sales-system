import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import TourProvider from "@/components/tour/TourProvider";
import TourOverlay from "@/components/tour/TourOverlay";
import { getPrimaryRep } from "@/lib/queries/reps";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPrimaryRep();
  return (
    <TourProvider>
      <div className="min-h-screen">
        <Sidebar user={user} />
        <main className="md:pl-60">
          <TopBar />
          <div className="max-w-[1280px] mx-auto px-6 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
      <TourOverlay />
    </TourProvider>
  );
}
