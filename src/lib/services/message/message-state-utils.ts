import type { MessageType } from "@/types/chat.type";

export const replaceOrRemoveTempMessage = (
  messages: MessageType[],
  tempId: string,
  realMessage: MessageType | null,
): MessageType[] => {
  const realMessageExists = realMessage
    ? messages.some((msg) => msg._id === realMessage._id)
    : false;

  if (realMessageExists || !realMessage) {
    return messages.filter((msg) => msg._id !== tempId);
  }

  return messages.map((msg) => (msg._id === tempId ? realMessage : msg));
};

export const addMessageIfNotExists = (
  messages: MessageType[],
  newMessage: MessageType,
): MessageType[] => {
  if (!newMessage || typeof newMessage !== "object" || !newMessage._id) {
    console.error("Invalid message:", newMessage);
    return messages;
  }

  const exists = messages.some((msg) => msg._id === newMessage._id);
  return exists ? messages : [...messages, newMessage];
};
