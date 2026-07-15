"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";

function normalizeUrl(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export async function createDocument(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  const title = String(formData.get("title") || "").trim();
  const url = normalizeUrl(String(formData.get("url") || ""));
  if (!title || !url) return;
  await supabase.from("documents").insert({
    title,
    url,
    description: String(formData.get("description") || "").trim() || null,
  });
  revalidatePath("/coaches/documents");
}

export async function deleteDocument(formData: FormData) {
  await requireCoach();
  const supabase = createClient();
  await supabase
    .from("documents")
    .delete()
    .eq("id", String(formData.get("id")));
  revalidatePath("/coaches/documents");
}
