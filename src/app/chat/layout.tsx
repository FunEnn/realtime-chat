"use client";

import AppWrapper from "@/components/app-wrapper";
import AsideBar from "@/components/aside-bar";
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
      <div className={cn("lg:block", chatId ? "hidden" : "block")}>
        <AsideBar />
      </div>

      <div className={cn("h-full flex", chatId ? "" : "ml-14 md:ml-16")}>
        <div
          className={cn(
            "lg:block lg:w-auto",
            chatId ? "hidden" : "block w-full",
          )}
        >
          <ChatList />
        </div>

        <div
          className={cn(
            "lg:flex-1 lg:block",
            chatId ? "block w-full" : "hidden",
          )}
        >
          {children}
        </div>
      </div>
    </AppWrapper>
  );
}
