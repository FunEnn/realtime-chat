import type { MessageType } from "@/types/chat.type";

export function addMessageIfNotExists(
  messages: MessageType[],
  newMessage: MessageType,
): MessageType[] {
  const exists = messages.some((msg) => msg.id === newMessage.id);

  if (exists) {
    return messages;
  }

  return [...messages, newMessage];
}

export function replaceOrRemoveTempMessage(
  messages: MessageType[],
  tempId: string,
  realMessage: MessageType,
): MessageType[] {
  const tempIndex = messages.findIndex((msg) => msg.id === tempId);

  if (tempIndex === -1) {
    return addMessageIfNotExists(messages, realMessage);
  }

  const newMessages = [...messages];
  newMessages[tempIndex] = realMessage;

  return newMessages;
}

export function removeTempMessage(
  messages: MessageType[],
  tempId: string,
): MessageType[] {
  return messages.filter((msg) => msg.id !== tempId);
}

export function updateMessage(
  messages: MessageType[],
  messageId: string,
  updates: Partial<MessageType>,
): MessageType[] {
  return messages.map((msg) =>
    msg.id === messageId ? { ...msg, ...updates } : msg,
  );
}
