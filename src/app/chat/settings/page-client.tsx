"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  getUserGroupInvitations,
  getUserPrivateChats,
} from "@/lib/server/actions/user-activity";
import type { User } from "@/types/prisma.types";

interface SettingsClientProps {
  user: User;
}

interface GroupInvitation {
  id: string;
  chatId: string;
  chatName: string | null;
  chatAvatar: string | null;
  inviterName: string;
  invitedAt: Date;
}

interface PrivateChat {
  id: string;
  otherUserId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  otherUserEmail: string;
  initiatedBy: "me" | "other";
  initiatorName: string | null;
  createdAt: Date;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invitationsRes, privateChatsRes] = await Promise.all([
          getUserGroupInvitations(),
          getUserPrivateChats(),
        ]);

        if (invitationsRes.success && invitationsRes.data) {
          setInvitations(invitationsRes.data as GroupInvitation[]);
        }

        if (privateChatsRes.success && privateChatsRes.data) {
          setPrivateChats(privateChatsRes.data as PrivateChat[]);
        }
      } catch (_error) {
        // 错误已处理
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: zhCN,
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="bg-primary px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-white/10 h-9 w-9 sm:h-10 sm:w-10"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </Button>
        <h1 className="text-base sm:text-lg md:text-xl font-semibold text-white">
          账号设置
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* User Info Section */}
          <div className="bg-card border-b">
            <div className="px-4 sm:px-6 py-4 sm:py-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 ring-primary/10">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="text-lg sm:text-xl font-semibold bg-primary/5">
                    {user.name?.[0] || user.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-lg sm:text-xl font-semibold mb-1 truncate">
                    {user.name || "未设置昵称"}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Records Section */}
          <div className="py-2">
            {/* Group Invitations */}
            <div className="mb-1">
              <div className="px-4 sm:px-6 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    群聊邀请记录
                  </h3>
                  {!loading && invitations.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({invitations.length})
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-card">
                {loading ? (
                  <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : invitations.length === 0 ? (
                  <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
                    暂无群聊邀请记录
                  </div>
                ) : (
                  <div className="divide-y">
                    {invitations.map((invitation) => (
                      <Link
                        key={invitation.id}
                        href={`/chat/${invitation.chatId}`}
                        className="block hover:bg-accent/50 active:bg-accent transition-colors"
                      >
                        <div className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0">
                              <AvatarImage
                                src={invitation.chatAvatar || undefined}
                              />
                              <AvatarFallback className="text-sm bg-primary/5">
                                {invitation.chatName?.[0] || "G"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-medium text-sm truncate">
                                  {invitation.chatName || "未命名群聊"}
                                </p>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                <span className="font-medium text-foreground">
                                  {invitation.inviterName}
                                </span>{" "}
                                邀请了您
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTime(invitation.invitedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Private Chats */}
            <div>
              <div className="px-4 sm:px-6 py-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    私聊记录
                  </h3>
                  {!loading && privateChats.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({privateChats.length})
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-card">
                {loading ? (
                  <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
                    加载中...
                  </div>
                ) : privateChats.length === 0 ? (
                  <div className="px-4 sm:px-6 py-8 text-center text-sm text-muted-foreground">
                    暂无私聊记录
                  </div>
                ) : (
                  <div className="divide-y">
                    {privateChats.map((chat) => (
                      <Link
                        key={chat.id}
                        href={`/chat/${chat.id}`}
                        className="block hover:bg-accent/50 active:bg-accent transition-colors"
                      >
                        <div className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 sm:h-12 sm:w-12 shrink-0">
                              <AvatarImage
                                src={chat.otherUserAvatar || undefined}
                              />
                              <AvatarFallback className="text-sm bg-primary/5">
                                {chat.otherUserName?.[0] ||
                                  chat.otherUserEmail[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-medium text-sm truncate">
                                  {chat.otherUserName || chat.otherUserEmail}
                                </p>
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {chat.initiatedBy === "me" ? (
                                  "您发起了与 TA 的私聊"
                                ) : (
                                  <>
                                    <span className="font-medium text-foreground">
                                      {chat.initiatorName}
                                    </span>{" "}
                                    发起了与您的私聊
                                  </>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatTime(chat.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
