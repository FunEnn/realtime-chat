import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ChatLayoutClient from "@/components/chat/chat-layout-client";
import {
  mapChatsToChatTypes,
  mapUsersToUserTypes,
  mapUserToUserType,
} from "@/lib/server/mappers/chat.mapper";
import * as chatRepository from "@/lib/server/repositories/chat.repository";
import * as userRepository from "@/lib/server/repositories/user.repository";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let user = await userRepository.findUserByClerkId(userId);

  if (!user) {
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      user = await userRepository.upsertUserFromClerk(userId, {
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: clerkUser.firstName || clerkUser.username || "User",
        avatar: clerkUser.imageUrl,
      });
    } catch (error) {
      console.error("Failed to sync user from Clerk:", error);
      redirect("/sign-in");
    }
  }

  if (!user) {
    redirect("/sign-in");
  }

  const chats = await chatRepository.findChatsByUserId(user.id);
  const allUsers = await userRepository.getAllUsers();
  const otherUsers = allUsers.filter((u) => u.id !== user.id);

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
