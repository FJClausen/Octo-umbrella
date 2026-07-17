export type RsvpCounts = { going: number; maybe: number; not_going: number };

/** Aggregate raw rsvp rows into per-event counts. */
export function countRsvpsByEvent(
  rows: { event_id: string; status: string }[] | null | undefined
): Map<string, RsvpCounts> {
  const map = new Map<string, RsvpCounts>();
  for (const r of rows ?? []) {
    const counts =
      map.get(r.event_id) ?? { going: 0, maybe: 0, not_going: 0 };
    if (r.status === "going") counts.going++;
    else if (r.status === "maybe") counts.maybe++;
    else if (r.status === "not_going") counts.not_going++;
    map.set(r.event_id, counts);
  }
  return map;
}
