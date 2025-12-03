import { API } from "@/lib/api/axios-client";
import type { UserType } from "@/types/auth.type";
import type { CreateMessageType, MessageType } from "@/types/chat.type";

export interface SendMessageOptions {
  onOptimisticUpdate?: (tempMessage: MessageType) => void;
  onSuccess?: (message: MessageType, tempId: string) => void;
  onError?: (tempId: string) => void;
}

export interface SendRoomMessagePayload {
  roomId: string;
  content?: string;
  image?: string;
  replyToId?: string;
}

export async function sendMessageService(
  payload: CreateMessageType,
  user: UserType | null,
  options?: SendMessageOptions,
): Promise<MessageType> {
  const tempId = `temp-${Date.now()}-${Math.random()}`;

  if (!user) {
    throw new Error("User is required to send a message");
  }

  const tempMessage: MessageType = {
    id: tempId,
    chatId: payload.chatId || "",
    content: payload.content || null,
    image: payload.image || null,
    sender: user,
    replyTo: payload.replyTo || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (options?.onOptimisticUpdate) {
    options.onOptimisticUpdate(tempMessage);
  }

  try {
    const response = await API.post<{ success: boolean; message: MessageType }>(
      `/chat/${payload.chatId}/messages`,
      {
        content: payload.content,
        image: payload.image,
        replyToId: payload.replyTo?.id,
      },
    );

    const realMessage = response.data.message;

    if (options?.onSuccess) {
      options.onSuccess(realMessage, tempId);
    }

    return realMessage;
  } catch (error) {
    if (options?.onError) {
      options.onError(tempId);
    }

    throw error;
  }
}

export async function sendRoomMessageService(
  payload: SendRoomMessagePayload,
  user: UserType | null,
  options?: SendMessageOptions,
): Promise<MessageType> {
  const tempId = `temp-${Date.now()}-${Math.random()}`;

  if (!user) {
    throw new Error("User is required to send a message");
  }

  const tempMessage: MessageType = {
    id: tempId,
    chatId: payload.roomId,
    content: payload.content || null,
    image: payload.image || null,
    sender: user,
    replyTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (options?.onOptimisticUpdate) {
    options.onOptimisticUpdate(tempMessage);
  }

  try {
    const response = await API.post<{ success: boolean; message: MessageType }>(
      `/public-rooms/${payload.roomId}/messages`,
      {
        content: payload.content,
        image: payload.image,
        replyToId: payload.replyToId,
      },
    );

    const realMessage = response.data.message;

    if (options?.onSuccess) {
      options.onSuccess(realMessage, tempId);
    }

    return realMessage;
  } catch (error) {
    if (options?.onError) {
      options.onError(tempId);
    }

    throw error;
  }
}
