"use client";

import { useParams } from "next/navigation";

export const useChatId = (): string | null => {
  const params = useParams<{ chatId?: string }>();
  return params?.chatId ?? null;
};
