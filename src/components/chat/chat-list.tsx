"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { useSocket } from "@/hooks/use-socket";
import type { ChatType, MessageType } from "@/types/chat.type";
import ChatListHeader from "./chat-list-header";
import ChatListItem from "./chat-list-item";

const ChatList = () => {
  const router = useRouter();
  const { socket } = useSocket();
  const { chats, isChatsLoading, addNewChat, updateChatLastMessage } =
    useChat();
  const { user } = useAuth();

  const currentUserId = useMemo(() => user?._id || null, [user?._id]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);

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

  const handleNewChat = useCallback(
    (newChat: ChatType) => {
      console.log("Received new chat", newChat);
      addNewChat(newChat);
    },
    [addNewChat],
  );

  const handleChatUpdate = useCallback(
    (data: { chatId: string; lastMessage: MessageType }) => {
      console.log("Received update on chat", data.lastMessage);
      updateChatLastMessage(data.chatId, data.lastMessage);
    },
    [updateChatLastMessage],
  );

  const handleChatClick = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on("chat:new", handleNewChat);

    return () => {
      socket.off("chat:new", handleNewChat);
    };
  }, [socket, handleNewChat]);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat:update", handleChatUpdate);

    return () => {
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, handleChatUpdate]);

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
                  <button
                    type="button"
                    onClick={() => setIsPrivateExpanded(!isPrivateExpanded)}
                    className="w-full flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1.5 hover:bg-sidebar-accent rounded transition-colors"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground transition-transform duration-200 ${
                        isPrivateExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <h3 className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Private Chats ({privateChats.length})
                    </h3>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isPrivateExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="space-y-1 mt-1">
                      {privateChats.map((chat) => (
                        <ChatListItem
                          key={chat._id}
                          chat={chat}
                          currentUserId={currentUserId}
                          onClick={() => handleChatClick(chat._id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {groupChats.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsGroupExpanded(!isGroupExpanded)}
                    className="w-full flex items-center gap-1.5 md:gap-2 px-1.5 md:px-2 py-1.5 hover:bg-sidebar-accent rounded transition-colors"
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground transition-transform duration-200 ${
                        isGroupExpanded ? "rotate-90" : ""
                      }`}
                    />
                    <h3 className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Group Chats ({groupChats.length})
                    </h3>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isGroupExpanded
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="space-y-1 mt-1">
                      {groupChats.map((chat) => (
                        <ChatListItem
                          key={chat._id}
                          chat={chat}
                          currentUserId={currentUserId}
                          onClick={() => handleChatClick(chat._id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
