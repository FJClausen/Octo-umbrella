import { redirect } from "next/navigation";

// Middleware already guarantees an authenticated user here; send them to the
// team home. (Unauthenticated visitors are redirected to /login upstream.)
export default function RootPage() {
  redirect("/home");
}
