"use client";

import { Search } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import type { UserType } from "@/types/auth.type";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { NewChatPopover } from "./newchat-popover";

interface ChatListHeaderProps {
  onSearch: (val: string) => void;
  users?: UserType[];
}

const ChatListHeader = ({ onSearch, users }: ChatListHeaderProps) => {
  const { onlineUsers, isConnected } = useSocket();

  return (
    <div className="px-2 md:px-3 py-2.5 md:py-3 border-b border-border">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <h1 className="text-lg md:text-xl font-semibold">
          Chat
          <span className="text-xs ml-2 text-muted-foreground">
            ({isConnected ? "🟢" : "🔴"} {onlineUsers.length} online)
          </span>
        </h1>
        <div>
          <NewChatPopover users={users} />
        </div>
      </div>
      <div>
        <InputGroup className="bg-background text-xs md:text-sm">
          <InputGroupInput
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
            className="h-9 md:h-10"
          />
          <InputGroupAddon>
            <Search className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
};

export default ChatListHeader;
