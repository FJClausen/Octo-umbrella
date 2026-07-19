import { redirect } from "next/navigation";

// Lineups moved into the Game Day tab.
export default function LineupsRedirect() {
  redirect("/coaches/gameday");
}
