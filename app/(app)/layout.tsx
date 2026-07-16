import { NavBar } from "@/components/NavBar";
import { CrestWatermark } from "@/components/CrestWatermark";
import { requireApproved } from "@/lib/auth";
import { site } from "@/lib/site";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireApproved();

  return (
    <div className="min-h-screen">
      <CrestWatermark />
      <NavBar
        teamName={site.teamName}
        season={site.season}
        isCoach={profile.role === "coach"}
        fullName={profile.full_name}
        logoUrl={site.logoUrl}
      />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-6 sm:pb-10">
        {children}
      </main>
    </div>
  );
}
