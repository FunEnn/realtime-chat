import { jsonResponse, unauthorizedResponse } from "@/src/lib/api-utils";
import { getCurrentUser } from "@/src/server/auth";
import { getAllChatsForUser } from "@/src/server/chat";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const chats = getAllChatsForUser(user._id);
  return jsonResponse({ chats });
}
