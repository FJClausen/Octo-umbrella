import { requireCoach } from "@/lib/auth";
import { CoachTabs } from "@/components/CoachTabs";

export default async function CoachesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCoach();
  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-brand-blue px-4 py-3 text-white">
        <h1 className="text-lg font-bold">📋 Coaching Corner</h1>
        <p className="text-sm text-brand-blue-light">
          Coaches only — parents can’t see anything in here.
        </p>
      </div>
      <CoachTabs />
      <div>{children}</div>
    </div>
  );
}
