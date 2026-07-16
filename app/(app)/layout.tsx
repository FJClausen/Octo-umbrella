import { NavBar } from "@/components/NavBar";
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
      <NavBar
        teamName={site.teamName}
        season={site.season}
        isCoach={profile.role === "coach"}
        fullName={profile.full_name}
        logoUrl={site.logoUrl}
      />
      <main className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:pb-10">
        {children}
      </main>
    </div>
  );
}
