import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  mapChatsToChatTypes,
  mapUsersToUserTypes,
  mapUserToUserType,
} from "@/lib/server/mappers/chat.mapper";
import * as chatRepository from "@/lib/server/repositories/chat.repository";
import * as userRepository from "@/lib/server/repositories/user.repository";
import ChatLayoutClient from "./layout-client";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await userRepository.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const chats = await chatRepository.findChatsByUserId(user.id);
  const allUsers = await userRepository.getAllUsers();

  // 过滤掉当前用户（不能和自己聊天）
  const otherUsers = allUsers.filter((u) => u.id !== user.id);

  // 转换为客户端期望的类型
  const chatTypes = mapChatsToChatTypes(chats);
  const userTypes = mapUsersToUserTypes(otherUsers);
  const currentUserType = mapUserToUserType(user);

  if (!currentUserType || !currentUserType.id) {
    throw new Error("Failed to map current user");
  }

  return (
    <ChatLayoutClient
      initialChats={chatTypes}
      allUsers={userTypes}
      currentUser={currentUserType}
    >
      {children}
    </ChatLayoutClient>
  );
}
