"use client";

import AppWrapper from "@/components/app-wrapper";
import ChatList from "@/components/chat/chat-list";
import { useChatId } from "@/hooks/use-chat-id";
import { cn } from "@/lib/utils";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chatId = useChatId();

  return (
    <AppWrapper>
      <div className="h-full flex">
        <div className={cn(chatId ? "hidden lg:block" : "block")}>
          <ChatList />
        </div>

        <div
          className={cn(
            "flex-1 lg:flex-1",
            !chatId ? "hidden lg:block" : "block",
          )}
        >
          {children}
        </div>
      </div>
    </AppWrapper>
  );
}
