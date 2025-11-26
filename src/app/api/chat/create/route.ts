import {
  handleError,
  jsonResponse,
  parseRequestBody,
  unauthorizedResponse,
} from "@/src/lib/api-utils";
import { getCurrentUser } from "@/src/server/auth";
import { createChatForUser } from "@/src/server/chat";
import type { CreateChatInput } from "@/src/types/chat.type";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await parseRequestBody<CreateChatInput>(request);
    const chat = createChatForUser(user._id, body);
    return jsonResponse({ chat }, 201);
  } catch (error) {
    return handleError(error, "Failed to create chat");
  }
}
