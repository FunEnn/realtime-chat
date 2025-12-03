import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import * as messageService from "@/lib/server/services/message.service";
import * as publicRoomService from "@/lib/server/services/room.service";
import * as userService from "@/lib/server/services/user.service";
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

  const user = await userService.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  const room = await publicRoomService.findPublicRoomById(roomId);

  if (!room) {
    notFound();
  }

  const isMember = await publicRoomService.isUserInRoom(roomId, user.id);

  // 只有成员才能查看消息
  const messagesResult = isMember
    ? await messageService.findMessagesByRoomId(roomId)
    : { messages: [] };

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
