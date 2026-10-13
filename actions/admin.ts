"use server";

import { redirect } from "next/navigation";
import { closeAccountSession } from "@/server/services/account-session";

export async function logoutAdmin() {
  await closeAccountSession();
  redirect("/");
}
