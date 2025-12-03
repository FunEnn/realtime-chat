/**
 * Public Room List Component
 * 从 API 获取公共聊天室列表
 * TODO: 未来可以改为从 Server Component 传入 rooms 以进一步优化
 */
"use client";

import { Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useSocket } from "@/hooks/use-socket";
import { API } from "@/lib/api/axios-client";
import { cn } from "@/lib/utils";
import type { PublicRoomType } from "@/types/public-room.type";

export default function PublicRoomList() {
  const router = useRouter();
  const pathname = usePathname();
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<PublicRoomType[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);

  const fetchPublicRooms = useCallback(async () => {
    setIsRoomsLoading(true);
    try {
      const response = await API.get("/public-rooms/all");
      console.log("[PublicRoomList] API Response:", response.data);

      const data =
        response.data?.data || response.data?.rooms || response.data || [];

      console.log("[PublicRoomList] Extracted data:", data);

      // 过滤掉无效的房间数据
      const validRooms = Array.isArray(data)
        ? data.filter((room) => room?.id)
        : [];

      console.log("[PublicRoomList] Valid rooms:", validRooms);
      setRooms(validRooms);
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
    if (!socket) return;

    const handleRoomCreated = (_room: PublicRoomType) => {
      fetchPublicRooms();
    };

    const handleRoomUpdated = (_room: PublicRoomType) => {
      fetchPublicRooms();
    };

    const handleRoomDeleted = () => {
      fetchPublicRooms();
    };

    socket.on("public-room:created", handleRoomCreated);
    socket.on("public-room:updated", handleRoomUpdated);
    socket.on("public-room:deleted", handleRoomDeleted);

    return () => {
      socket.off("public-room:created", handleRoomCreated);
      socket.off("public-room:updated", handleRoomUpdated);
      socket.off("public-room:deleted", handleRoomDeleted);
    };
  }, [socket, fetchPublicRooms]);

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
            pathname.includes(room.id) && "!bg-sidebar-accent",
          )}
        >
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
                {room.memberCount}{" "}
                {room.memberCount === 1 ? "member" : "members"}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
