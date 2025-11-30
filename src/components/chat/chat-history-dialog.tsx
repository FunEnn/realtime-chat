"use client";

import { format } from "date-fns";
import { ArrowLeft, Calendar, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useChat } from "@/hooks/use-chat";
import type { ChatType, MessageType } from "@/types/chat.type";

interface ChatHistoryDialogProps {
  trigger?: React.ReactNode;
  chatId?: string;
}

export default function ChatHistoryDialog({
  trigger,
  chatId,
}: ChatHistoryDialogProps) {
  const { chats, fetchChatHistory } = useChat();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [chatMessages, setChatMessages] = useState<MessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const activeChatId = selectedChatId || chatId;

  // 获取选中聊天室的历史消息
  useEffect(() => {
    if (open && activeChatId) {
      setIsLoading(true);
      fetchChatHistory(activeChatId)
        .then((messages) => {
          setChatMessages(messages);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, activeChatId, fetchChatHistory]);

  // 当对话框关闭时重置状态
  useEffect(() => {
    if (!open) {
      setSelectedChatId(null);
      setChatMessages([]);
      setSearchQuery("");
      setDateFilter("");
    }
  }, [open]);

  // 获取所有聊天记录和消息
  const allHistory = useMemo(() => {
    if (activeChatId && chatMessages.length > 0) {
      const currentChat = chats.find((c) => c._id === activeChatId);
      if (!currentChat) return [];

      return chatMessages.map((message) => ({
        type: "message" as const,
        message,
        chat: currentChat,
      }));
    }

    return chats.map((chat) => ({
      type: "chat" as const,
      chat,
      lastMessage: chat.lastMessage,
    }));
  }, [chats, activeChatId, chatMessages]);

  // 过滤历史记录
  const filteredHistory = useMemo(() => {
    return allHistory.filter((item) => {
      if (item.type === "message") {
        const { message } = item;

        // 搜索过滤
        const matchesSearch =
          !searchQuery ||
          message.sender?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          message.content?.toLowerCase().includes(searchQuery.toLowerCase());

        // 日期过滤
        const matchesDate =
          !dateFilter ||
          (message.createdAt &&
            format(new Date(message.createdAt), "yyyy-MM-dd") === dateFilter);

        return matchesSearch && matchesDate;
      }

      const { chat, lastMessage } = item;

      // 搜索过滤
      const matchesSearch =
        !searchQuery ||
        chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.participants.some((p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
        ) ||
        lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase());

      // 日期过滤
      const matchesDate =
        !dateFilter ||
        (lastMessage?.createdAt &&
          format(new Date(lastMessage.createdAt), "yyyy-MM-dd") === dateFilter);

      return matchesSearch && matchesDate;
    });
  }, [allHistory, searchQuery, dateFilter]);

  // 按日期分组
  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof filteredHistory> = {};

    filteredHistory.forEach((item) => {
      let date: string;

      if (item.type === "message") {
        date = item.message.createdAt
          ? format(new Date(item.message.createdAt), "yyyy-MM-dd")
          : "No date";
      } else {
        date = item.lastMessage?.createdAt
          ? format(new Date(item.lastMessage.createdAt), "yyyy-MM-dd")
          : "No messages";
      }

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredHistory]);

  const getChatName = (chat: ChatType) => {
    if (chat.isGroup) {
      return chat.groupName || "Unnamed Group";
    }
    const otherUser = chat.participants.find((p) => p._id !== chat.createdBy);
    return otherUser?.name || "Unknown";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-2" />
            History
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[92vw] sm:max-w-[85vw] md:max-w-2xl max-h-[90vh] md:max-h-[85vh] p-3 sm:p-4 md:p-6 gap-3 md:gap-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            {selectedChatId && !chatId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedChatId(null)}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle className="text-sm sm:text-base md:text-lg">
              {selectedChatId && !chatId
                ? chats.find((c) => c._id === selectedChatId)?.groupName ||
                  "Chat History"
                : "Chat History"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-2 md:space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 md:pl-9 pr-8 md:pr-9 h-9 md:h-10 text-sm md:text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 md:h-7 md:w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            )}
          </div>

          <div className="relative">
            <Calendar className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8 md:pl-9 pr-8 md:pr-9 h-9 md:h-10 text-sm md:text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 md:h-7 md:w-7 p-0"
                onClick={() => setDateFilter("")}
              >
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[50vh] sm:h-[55vh] md:h-[400px] pr-2 md:pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner className="w-8 h-8 text-primary!" />
            </div>
          ) : groupedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-3 sm:p-4 md:p-8">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground mb-2 md:mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                {chatId ? "No messages found" : "No chat history found"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {groupedHistory.map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase mb-1 sm:mb-1.5 md:mb-2 sticky top-0 bg-background py-0.5 sm:py-1">
                    {date === "No messages" || date === "No date"
                      ? date
                      : format(new Date(date), "MMMM dd, yyyy")}
                  </h3>
                  <div className="space-y-1 sm:space-y-1.5 md:space-y-2">
                    {items.map((item) => {
                      if (item.type === "message") {
                        return (
                          <div
                            key={item.message._id}
                            className="w-full p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border text-left"
                          >
                            <div className="flex items-start justify-between mb-0.5 sm:mb-1">
                              <h4 className="font-semibold text-[11px] sm:text-xs md:text-sm">
                                {item.message.sender?.name || "Unknown"}
                              </h4>
                              <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {format(
                                  new Date(item.message.createdAt),
                                  "HH:mm",
                                )}
                              </span>
                            </div>
                            {item.message.image && (
                              <div className="mt-1 sm:mt-1.5 md:mt-2 mb-1 sm:mb-1.5 md:mb-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.message.image}
                                  alt="Message attachment"
                                  className="max-w-[120px] sm:max-w-[150px] md:max-w-[200px] max-h-[80px] sm:max-h-[100px] md:max-h-[150px] rounded-md object-cover"
                                />
                              </div>
                            )}
                            {item.message.content && (
                              <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground break-words">
                                {item.message.content}
                              </p>
                            )}
                            {!item.message.content && !item.message.image && (
                              <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">
                                📷 Photo
                              </p>
                            )}
                            {item.message.replyTo && (
                              <div className="mt-1 sm:mt-1.5 md:mt-2 pl-1 sm:pl-1.5 md:pl-2 border-l-2 border-muted">
                                <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                                  Reply to:{" "}
                                  {item.message.replyTo.sender?.name ||
                                    "Unknown"}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          key={item.chat._id}
                          className="w-full p-1.5 sm:p-2 md:p-3 rounded-md sm:rounded-lg border hover:bg-accent active:bg-accent focus:bg-accent transition-colors cursor-pointer text-left"
                          onClick={() => {
                            if (chatId) {
                              // 如果是从聊天室内打开的，则跳转
                              window.location.href = `/chat/${item.chat._id}`;
                              setOpen(false);
                            } else {
                              // 如果是从聊天列表打开的，则在对话框内查看历史
                              setSelectedChatId(item.chat._id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between mb-0.5 sm:mb-1">
                            <h4 className="font-semibold text-[11px] sm:text-xs md:text-sm">
                              {getChatName(item.chat)}
                            </h4>
                            {item.lastMessage && (
                              <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {format(
                                  new Date(item.lastMessage.createdAt),
                                  "HH:mm",
                                )}
                              </span>
                            )}
                          </div>
                          {item.lastMessage && (
                            <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate">
                              {item.lastMessage.sender?.name}:{" "}
                              {item.lastMessage.content || "📷 Photo"}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground text-center pt-1.5 sm:pt-2 border-t">
          Showing {filteredHistory.length} of {allHistory.length}{" "}
          {chatId ? "messages" : "chats"}
        </div>
      </DialogContent>
    </Dialog>
  );
}
