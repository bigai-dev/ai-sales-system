import Sidebar from "@/components/Sidebar";
import TourProvider from "@/components/tour/TourProvider";
import TourOverlay from "@/components/tour/TourOverlay";
import MovieProvider from "@/components/movie/MovieProvider";
import { getPrimaryRep } from "@/lib/queries/reps";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getPrimaryRep();
  return (
    <MovieProvider>
      <TourProvider>
        <div className="min-h-screen">
          <Sidebar user={user} />
          <main className="md:pl-60">
            <div className="mx-auto max-w-[1280px] px-6 pb-10 pt-16 md:px-8 md:pt-8">
              {children}
            </div>
          </main>
        </div>
        <TourOverlay />
      </TourProvider>
    </MovieProvider>
  );
}
