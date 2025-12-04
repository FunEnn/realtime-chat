"use client";

import { useParams } from "next/navigation";

export const useChatId = (): string | null => {
  const params = useParams<{ chatId?: string; roomId?: string }>();
  // 支持普通聊天的 chatId 和公共聊天室的 roomId
  return params?.chatId ?? params?.roomId ?? null;
};
