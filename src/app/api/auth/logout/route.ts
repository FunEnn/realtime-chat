import { jsonResponse } from "@/src/lib/api-utils";
import { setCurrentUser } from "@/src/server/auth";

export async function POST() {
  await setCurrentUser(null);
  return jsonResponse({ message: "Logged out" });
}
