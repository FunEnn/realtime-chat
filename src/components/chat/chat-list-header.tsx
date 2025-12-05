"use client";

import { Search } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import type { User } from "@/types";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { NewChatPopover } from "./newchat-popover";

interface ChatListHeaderProps {
  onSearch: (val: string) => void;
  users?: User[];
}

const ChatListHeader = ({ onSearch, users }: ChatListHeaderProps) => {
  const { onlineUsers, isConnected } = useSocket();

  return (
    <div className="px-3 md:px-4 py-3 md:py-4 border-b border-border">
      <div className="flex items-center justify-between mb-3 md:mb-4">
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
        <InputGroup className="bg-background text-xs md:text-sm shadow-sm">
          <InputGroupInput
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
            className="h-10 md:h-11 rounded-xl"
          />
          <InputGroupAddon>
            <Search className="h-4 w-4 md:h-4 md:w-4 text-muted-foreground" />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
};

export default ChatListHeader;
