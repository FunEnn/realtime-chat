/**
 * Public Room List Component
 * 使用 Server Action 获取公共聊天室列表
 */
"use client";

import { Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useSocket } from "@/hooks/use-socket";
import { getAllPublicRooms } from "@/lib/server/actions/public-room";
import { cn } from "@/lib/utils";
import type { PublicRoomDisplay } from "@/types";

export default function PublicRoomList() {
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();
  const { user: currentUser } = useAuth();
  const [rooms, setRooms] = useState<PublicRoomDisplay[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const currentRoomId = pathname.split("/").pop();

  const fetchPublicRooms = useCallback(async () => {
    setIsRoomsLoading(true);
    try {
      const result = await getAllPublicRooms();

      if (result.success && result.rooms) {
        const validRooms = result.rooms.filter((room) => room?.id);
        setRooms(validRooms as PublicRoomDisplay[]);
      }
    } catch (error) {
      console.error("Failed to fetch public rooms:", error);
    } finally {
      setIsRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicRooms();
  }, [fetchPublicRooms]);

  useEffect(() => {
    if (!currentRoomId || !pathname.includes("/public-room/")) return;

    setRooms((prev) =>
      prev.map((room) =>
        room.id === currentRoomId
          ? { ...room, unreadCount: 0, hasUnread: false }
          : room,
      ),
    );
  }, [currentRoomId, pathname]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (_room: PublicRoomDisplay) => {
      fetchPublicRooms();
    };

    const handleRoomUpdated = (updatedRoom: any) => {
      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === updatedRoom.id) {
            // 检查当前用户是否在成员列表中
            let isMember = room.isMember;
            if (currentUser?.id && Array.isArray(updatedRoom.members)) {
              isMember = updatedRoom.members.some((member: any) => {
                const memberId = member.userId || member.user?.id;
                return memberId === currentUser.id;
              });
            }

            // 获取成员数量
            const memberCount =
              updatedRoom._count?.members ||
              updatedRoom.memberCount ||
              (Array.isArray(updatedRoom.members)
                ? updatedRoom.members.length
                : room._count?.members);

            return {
              ...room,
              name: updatedRoom.name || room.name,
              avatar: updatedRoom.avatar || room.avatar,
              description: updatedRoom.description ?? room.description,
              members: updatedRoom.members || room.members,
              memberCount,
              _count: {
                ...room._count,
                members: memberCount,
              },
              isMember,
              unreadCount: updatedRoom.unreadCount ?? room.unreadCount,
              hasUnread: updatedRoom.hasUnread ?? room.hasUnread,
            };
          }
          return room;
        }),
      );
    };

    const handleRoomDeleted = (data: { roomId: string }) => {
      setRooms((prev) => prev.filter((room) => room.id !== data.roomId));

      // 如果用户正在被删除的房间中，跳转到聊天列表
      if (currentRoomId === data.roomId) {
        router.push("/chat");
      }
    };

    const handleChatUpdate = (data: { chatId: string; lastMessage: any }) => {
      const roomId = data.chatId;
      const senderId = data.lastMessage?.sender?.id;

      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === roomId && room.isMember) {
            const isCurrentRoom = currentRoomId === roomId;
            const isSelf = senderId === currentUser?.id;

            if (isCurrentRoom || isSelf) {
              return room;
            }

            return {
              ...room,
              unreadCount: (room.unreadCount || 0) + 1,
              hasUnread: true,
            };
          }
          return room;
        }),
      );
    };

    socket.on("public-room:created", handleRoomCreated);
    socket.on("public-room:updated", handleRoomUpdated);
    socket.on("public-room:deleted", handleRoomDeleted);
    socket.on("chat:update", handleChatUpdate);

    return () => {
      socket.off("public-room:created", handleRoomCreated);
      socket.off("public-room:updated", handleRoomUpdated);
      socket.off("public-room:deleted", handleRoomDeleted);
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, fetchPublicRooms, currentRoomId, currentUser?.id, router.push]);

  if (isRoomsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No public rooms available
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rooms.map((room) => (
        <button
          key={room.id}
          type="button"
          onClick={() => router.push(`/chat/public-room/${room.id}`)}
          className={cn(
            "w-full flex items-center gap-2 p-1.5 md:p-2 rounded-sm hover:bg-sidebar-accent transition-colors text-left",
            pathname.includes(room.id) && "bg-sidebar-accent!",
          )}
        >
          <div className="relative">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {room.avatar ? (
                <img
                  src={room.avatar}
                  alt={room.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Users className="w-5 h-5 text-primary" />
              )}
            </div>
            {room.isMember ? (
              room.unreadCount && room.unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full border-2 border-background">
                  {room.unreadCount > 99 ? "99+" : room.unreadCount}
                </span>
              ) : null
            ) : (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-muted-foreground/40 rounded-full" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h5 className="text-xs md:text-sm font-semibold truncate">
                {room.name}
              </h5>
              {room.isMember && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-2 shrink-0">
                  Joined
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <p className="text-[10px] md:text-xs truncate text-muted-foreground -mt-px flex-1">
                {room.description || "Public chat room"}
              </p>
              <span className="text-[10px] md:text-xs shrink-0 text-muted-foreground">
                {room._count.members}{" "}
                {room._count.members === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
