import {
  jsonResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/src/lib/api-utils";
import { getCurrentUser } from "@/src/server/auth";
import { getChatWithMessages } from "@/src/server/chat";

type Params = {
  params: {
    chatId: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const result = getChatWithMessages(params.chatId);
  if (!result) {
    return notFoundResponse("Chat not found");
  }

  return jsonResponse(result);
}
