import {
  badRequestResponse,
  handleError,
  jsonResponse,
  parseRequestBody,
  unauthorizedResponse,
} from "@/src/lib/api-utils";
import { getCurrentUser } from "@/src/server/auth";
import { sendMessageToChat } from "@/src/server/chat";
import type { SendMessageInput } from "@/src/types/chat.type";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await parseRequestBody<SendMessageInput>(request);

    if (!body.chatId) {
      return badRequestResponse("chatId is required");
    }

    const message = sendMessageToChat(body.chatId, user._id, {
      content: body.content,
      image: body.image,
      replyToId: body.replyToId,
    });

    return jsonResponse({ message }, 201);
  } catch (error) {
    return handleError(error, "Failed to send message");
  }
}
