import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { formatDay } from "@/lib/format";

export const metadata = { title: "Team News" };

export default async function NewsPage() {
  const supabase = createClient();
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Team News"
        subtitle="Announcements and updates from your coaches."
      />

      {news && news.length > 0 ? (
        <div className="space-y-4">
          {news.map((n) => (
            <Card key={n.id} className="scroll-mt-20" >
              <article id={n.id}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {formatDay(n.created_at)}
                </p>
                <h2 className="mt-1 text-lg font-bold text-brand-ink">
                  {n.title}
                </h2>
                {n.image_url ? (
                  <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-100">
                    <Image
                      src={n.image_url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 700px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {n.body}
                </p>
              </article>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No news yet"
          hint="When your coaches post announcements, they’ll show up here."
        />
      )}
    </div>
  );
}
