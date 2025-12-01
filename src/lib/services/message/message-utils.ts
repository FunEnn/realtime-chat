import type { UserType } from "@/types/auth.type";
import type { MessageType } from "@/types/chat.type";

export const createTempMessage = (
  chatId: string,
  content: string | undefined,
  image: string | null | undefined,
  replyTo: MessageType | null | undefined,
  user: UserType,
  tempId: string,
): MessageType => ({
  _id: tempId,
  chatId,
  content: content ?? "",
  image: image ?? null,
  sender: user,
  replyTo: replyTo ?? null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: "sending...",
});

export const validateMessageInput = (
  chatId: string | null,
  userId: string | undefined,
  content: string | undefined,
  image: string | null | undefined,
): { isValid: boolean; error?: string } => {
  if (!chatId || !userId) {
    return { isValid: false, error: "Chat or user not available" };
  }

  if (!content?.trim() && !image) {
    return { isValid: false, error: "Message content cannot be empty" };
  }

  return { isValid: true };
};
