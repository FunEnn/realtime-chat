import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  mapChatsToChatTypes,
  mapUsersToUserTypes,
  mapUserToUserType,
} from "@/lib/server/mappers/chat.mapper";
import * as chatService from "@/lib/server/services/chat.service";
import * as userService from "@/lib/server/services/user.service";
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

  const user = await userService.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const chats = await chatService.findChatsByUserId(user.id);
  const allUsers = await userService.getAllUsers();

  // 过滤掉当前用户（不能和自己聊天）
  const otherUsers = allUsers.filter((u) => u.id !== user.id);

  // 转换为客户端期望的类型
  try {
    const chatTypes = mapChatsToChatTypes(chats);
    const userTypes = mapUsersToUserTypes(otherUsers);
    const currentUserType = mapUserToUserType(user);

    // 验证数据
    if (!currentUserType || !currentUserType.id) {
      console.error("[Layout] Current user mapping failed:", {
        user,
        currentUserType,
      });
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
  } catch (error) {
    console.error("[Layout] Error mapping data:", error);
    console.error("[Layout] User data:", user);
    console.error("[Layout] Chats count:", chats.length);
    throw error;
  }
}
