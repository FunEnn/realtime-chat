import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import {
  mapChatToChatType,
  mapMessageToMessageType,
} from "@/lib/server/mappers/chat.mapper";
import * as chatService from "@/lib/server/services/chat.service";
import * as messageService from "@/lib/server/services/message.service";
import * as userService from "@/lib/server/services/user.service";
import SingleChatClient from "./page-client";

export default async function SingleChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await userService.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const chat = await chatService.findChatById(chatId);

  if (!chat) {
    notFound();
  }

  const isMember = await chatService.isUserInChat(chatId, user.id);

  if (!isMember) {
    notFound();
  }

  const { messages } = await messageService.findMessagesByChatId(chatId);

  // 转换为客户端期望的类型
  const chatType = mapChatToChatType(chat);
  const messageTypes = messages.map(mapMessageToMessageType);

  return (
    <SingleChatClient
      key={chatId}
      initialChat={chatType}
      initialMessages={messageTypes}
      chatId={chatId}
      currentUserId={user.id}
    />
  );
}
