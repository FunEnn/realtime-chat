"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import PublicRoomList from "@/components/public-room/public-room-list";
import CollapsibleSection from "@/components/shared/collapsible-section";
import { Spinner } from "@/components/ui/spinner";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useSocket } from "@/hooks/use-socket";
import type { MessageType } from "@/types/chat.type";
import ChatListHeader from "./chat-list-header";
import ChatListItem from "./chat-list-item";

const ChatList = () => {
  const router = useRouter();
  const { socket } = useSocket();
  const { chats, isChatsLoading, addNewChat, updateChatLastMessage } =
    useChat();
  const { user } = useAuth();

  const currentUserId = user?._id || null;
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);
  const [isPublicRoomsExpanded, setIsPublicRoomsExpanded] = useState(true);

  const { privateChats, groupChats } = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered =
      chats?.filter(
        (chat) =>
          chat.groupName?.toLowerCase().includes(query) ||
          chat.participants?.some(
            (p) =>
              p._id !== currentUserId && p.name?.toLowerCase().includes(query),
          ),
      ) || [];

    return {
      privateChats: filtered.filter((chat) => !chat.isGroup),
      groupChats: filtered.filter((chat) => chat.isGroup),
    };
  }, [chats, searchQuery, currentUserId]);

  const handleChatClick = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("chat:new", addNewChat);
    socket.on(
      "chat:update",
      (data: { chatId: string; lastMessage: MessageType }) => {
        updateChatLastMessage(data.chatId, data.lastMessage);
      },
    );

    return () => {
      socket.off("chat:new", addNewChat);
      socket.off("chat:update");
    };
  }, [socket, addNewChat, updateChatLastMessage]);

  if (isChatsLoading) {
    return (
      <div className="w-full lg:w-95 border-r bg-sidebar h-svh flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary!" />
      </div>
    );
  }

  return (
    <div className="w-full lg:w-95 border-r bg-sidebar h-svh flex flex-col">
      <ChatListHeader onSearch={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-1.5 md:px-2 pb-10 pt-1">
          {privateChats.length === 0 && groupChats.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery ? "No chat found" : "No chats created"}
              </p>
            </div>
          ) : (
            <>
              {privateChats.length > 0 && (
                <div className="mb-4">
                  <CollapsibleSection
                    title="Private Chats"
                    count={privateChats.length}
                    isExpanded={isPrivateExpanded}
                    onToggle={() => setIsPrivateExpanded(!isPrivateExpanded)}
                  >
                    <div className="space-y-1">
                      {privateChats.map((chat) => (
                        <ChatListItem
                          key={chat._id}
                          chat={chat}
                          currentUserId={currentUserId}
                          onClick={() => handleChatClick(chat._id)}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                </div>
              )}

              {groupChats.length > 0 && (
                <CollapsibleSection
                  title="Group Chats"
                  count={groupChats.length}
                  isExpanded={isGroupExpanded}
                  onToggle={() => setIsGroupExpanded(!isGroupExpanded)}
                >
                  <div className="space-y-1">
                    {groupChats.map((chat) => (
                      <ChatListItem
                        key={chat._id}
                        chat={chat}
                        currentUserId={currentUserId}
                        onClick={() => handleChatClick(chat._id)}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              )}

              <div className="mt-2">
                <CollapsibleSection
                  title="Public Rooms"
                  isExpanded={isPublicRoomsExpanded}
                  onToggle={() =>
                    setIsPublicRoomsExpanded(!isPublicRoomsExpanded)
                  }
                >
                  <PublicRoomList />
                </CollapsibleSection>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
