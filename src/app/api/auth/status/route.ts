import { jsonResponse, unauthorizedResponse } from "@/src/lib/api-utils";
import { getCurrentUser } from "@/src/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  return jsonResponse({ user });
}
