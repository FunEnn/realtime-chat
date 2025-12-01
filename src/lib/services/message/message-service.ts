import { toast } from "sonner";
import { API } from "@/lib/api/axios-client";
import {
  createTempMessage,
  validateMessageInput,
} from "@/lib/services/message/message-utils";
import { getErrorMessage } from "@/lib/utils/error-handler";
import { generateUUID } from "@/lib/utils/user-utils";
import type { UserType } from "@/types/auth.type";
import type { MessageType } from "@/types/chat.type";

interface SendMessagePayload {
  chatId: string;
  content?: string;
  image?: string;
  replyTo?: MessageType | null;
}

interface MessageCallbacks {
  onOptimisticUpdate: (tempMessage: MessageType) => void;
  onSuccess: (realMessage: MessageType, tempId: string) => void;
  onError: (tempId: string) => void;
}

export const sendMessageService = async (
  payload: SendMessagePayload,
  user: UserType | null,
  callbacks: MessageCallbacks,
): Promise<void> => {
  const { chatId, content, image, replyTo } = payload;

  const validation = validateMessageInput(chatId, user?._id, content, image);
  if (!validation.isValid) {
    toast.error(validation.error ?? "Invalid message");
    return;
  }

  const tempId = generateUUID();
  const tempMessage = createTempMessage(
    chatId,
    content,
    image,
    replyTo,
    user as NonNullable<typeof user>,
    tempId,
  );

  callbacks.onOptimisticUpdate(tempMessage);

  try {
    const { data } = await API.post<{ message: MessageType }>(
      "/chat/message/send",
      {
        chatId,
        content,
        image,
        replyToId: replyTo?._id,
      },
    );

    callbacks.onSuccess(data.message, tempId);
  } catch (error) {
    console.error("Send message error:", error);
    toast.error(getErrorMessage(error, "Failed to send message"));
    callbacks.onError(tempId);
  }
};
