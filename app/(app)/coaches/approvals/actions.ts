"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/auth";
import type { ProfileUpdate } from "@/lib/types";

async function updateProfile(id: string, patch: ProfileUpdate) {
  await requireCoach();
  const supabase = createClient();
  await supabase.from("profiles").update(patch).eq("id", id);
  revalidatePath("/coaches/approvals");
  revalidatePath("/coaches");
}

export async function approveMember(formData: FormData) {
  await updateProfile(String(formData.get("id")), { status: "approved" });
}

export async function denyMember(formData: FormData) {
  await updateProfile(String(formData.get("id")), { status: "denied" });
}

export async function promoteToCoach(formData: FormData) {
  await updateProfile(String(formData.get("id")), {
    role: "coach",
    status: "approved",
  });
}

export async function demoteToParent(formData: FormData) {
  await updateProfile(String(formData.get("id")), { role: "parent" });
}
