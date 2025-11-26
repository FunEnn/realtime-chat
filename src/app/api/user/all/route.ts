import { jsonResponse, unauthorizedResponse } from "@/src/lib/api-utils";
import { getAllUsers, getCurrentUser } from "@/src/server/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const users = getAllUsers();
  return jsonResponse({ users });
}
