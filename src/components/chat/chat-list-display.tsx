"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import PublicRoomList from "@/components/public-room/public-room-list";
import CollapsibleSection from "@/components/shared/collapsible-section";
import type { UserType } from "@/types/auth.type";
import type { ChatType } from "@/types/chat.type";
import ChatListHeader from "./chat-list-header";
import ChatListItem from "./chat-list-item";

interface ChatListDisplayProps {
  chats: ChatType[];
  users: UserType[];
  currentUser: UserType;
}

export default function ChatListDisplay({
  chats,
  users,
  currentUser,
}: ChatListDisplayProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);
  const [isPublicRoomsExpanded, setIsPublicRoomsExpanded] = useState(true);

  const { privateChats, groupChats } = useMemo(() => {
    const query = searchQuery.toLowerCase();

    // 过滤掉 undefined 或 null 的聊天
    const validChats = chats.filter((chat) => chat != null);

    const filtered = validChats.filter((chat) => {
      if (!query) return true; // 没有搜索词，显示所有

      // 搜索群聊名称
      if (chat.groupName?.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索参与者名称
      if (
        chat.participants?.some(
          (p) =>
            p &&
            p.id !== currentUser.id &&
            p.name?.toLowerCase().includes(query),
        )
      ) {
        return true;
      }

      return false;
    });

    return {
      privateChats: filtered.filter((chat) => chat && !chat.isGroup),
      groupChats: filtered.filter((chat) => chat?.isGroup),
    };
  }, [chats, searchQuery, currentUser.id]);

  const handleChatClick = useCallback(
    (id: string) => {
      router.push(`/chat/${id}`);
    },
    [router],
  );

  return (
    <div className="w-full lg:w-95 border-r bg-sidebar h-svh flex flex-col">
      <ChatListHeader onSearch={setSearchQuery} users={users} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-1.5 md:px-2 pb-10 pt-1">
          {privateChats.length === 0 && groupChats.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <p className="text-sm text-muted-foreground text-center">
                {searchQuery ? "No chat found" : "No chats created"}
              </p>
            </div>
          ) : (
            <div>
              <div key="private-chats-section" className="mb-4">
                {privateChats.length > 0 && (
                  <CollapsibleSection
                    title="Private Chats"
                    count={privateChats.length}
                    isExpanded={isPrivateExpanded}
                    onToggle={() => setIsPrivateExpanded(!isPrivateExpanded)}
                  >
                    <div className="space-y-1">
                      {privateChats.map((chat) => (
                        <ChatListItem
                          key={chat.id}
                          chat={chat}
                          currentUserId={currentUser.id}
                          onClick={() => handleChatClick(chat.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>

              <div key="group-chats-section">
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
                          key={chat.id}
                          chat={chat}
                          currentUserId={currentUser.id}
                          onClick={() => handleChatClick(chat.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
              </div>

              <div key="public-rooms-section" className="mt-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
