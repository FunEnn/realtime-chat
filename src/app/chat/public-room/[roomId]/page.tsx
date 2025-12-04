import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import * as messageRepository from "@/lib/server/repositories/message.repository";
import * as roomRepository from "@/lib/server/repositories/room.repository";
import * as userRepository from "@/lib/server/repositories/user.repository";
import PublicRoomClient from "./room-client";

/**
 * 公共聊天室页面 - Server Component 版本
 */
export default async function PublicRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await userRepository.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const room = await roomRepository.findPublicRoomById(roomId);

  if (!room) {
    notFound();
  }

  const isMember = await roomRepository.isUserInRoom(roomId, user.id);

  // 公共聊天室：所有人都可以查看消息（公开可见）
  const messagesResult = await messageRepository.findMessagesByRoomId(roomId);

  return (
    <PublicRoomClient
      room={room}
      initialMessages={messagesResult.messages || []}
      roomId={roomId}
      currentUserId={user.id}
      isMember={isMember}
    />
  );
}
