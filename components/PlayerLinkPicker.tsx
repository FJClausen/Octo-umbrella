import { Alert, SubmitButton } from "@/components/ui";
import {
  requestPlayerLink,
  cancelPlayerLinkRequest,
} from "@/app/(app)/account/link-actions";

export type LinkablePlayer = {
  id: string;
  first_name: string;
  /** The caller's own request for this player, if they've made one. */
  request?: { id: string; status: string };
};

/**
 * Shown to an approved parent who has no player linked yet: the roster as a
 * list of first names they can claim, which raises a request for a coach to
 * approve. Replaces telling them to go and ask a coach out-of-band.
 */
export function PlayerLinkPicker({ players }: { players: LinkablePlayer[] }) {
  const pending = players.filter((p) => p.request?.status === "pending");
  const denied = players.filter((p) => p.request?.status === "denied");

  if (players.length === 0) {
    return (
      <Alert variant="info" title="No players on the roster yet">
        <p>
          Once your coach adds the team roster, you’ll be able to pick your
          child here.
        </p>
      </Alert>
    );
  }

  if (pending.length > 0) {
    return (
      <Alert variant="success" title="Request sent to your coach">
        <p className="mb-2">
          You asked to be linked to{" "}
          <strong>{pending.map((p) => p.first_name).join(" and ")}</strong>.
          Your coach will confirm it — then you can RSVP and sign up for
          snacks.
        </p>
        {pending.map((p) => (
          <form key={p.id} action={cancelPlayerLinkRequest} className="inline">
            <input type="hidden" name="id" value={p.request!.id} />
            <button
              type="submit"
              className="text-xs underline underline-offset-2"
            >
              Undo request for {p.first_name}
            </button>
          </form>
        ))}
      </Alert>
    );
  }

  return (
    <Alert variant="info" title="Which player is yours?">
      <p className="mb-3">
        Pick your child from the team roster. Your coach gets a note to
        confirm it, and then you can RSVP for games and practices.
      </p>
      {denied.length > 0 ? (
        <p className="mb-3">
          A previous request wasn’t confirmed. Check with your coach if you
          think that was a mistake.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {players.map((p) => (
          <form key={p.id} action={requestPlayerLink}>
            <input type="hidden" name="player_id" value={p.id} />
            <SubmitButton variant="outline">{p.first_name}</SubmitButton>
          </form>
        ))}
      </div>
    </Alert>
  );
}
