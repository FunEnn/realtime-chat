"use client";

import { LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { toast } from "sonner";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { leaveChat } from "@/lib/server/actions/chat";
import type { User } from "@/types";

interface GroupInfoDialogProps {
  chatId: string;
  groupName: string;
  groupDescription?: string;
  groupAvatar?: string;
  members: User[];
  currentUserId: string;
  trigger?: React.ReactNode;
}

export const GroupInfoDialog = memo(
  ({
    chatId,
    groupName,
    groupDescription,
    groupAvatar,
    members,
    currentUserId,
    trigger,
  }: GroupInfoDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeave = async () => {
      setIsLeaving(true);
      try {
        const result = await leaveChat(chatId);
        if (result.success) {
          toast.success("Left group successfully");
          setOpen(false);
          router.push("/chat");
          router.refresh();
        } else {
          toast.error(result.error?.message || "Failed to leave group");
        }
      } catch (_error) {
        toast.error("Failed to leave group");
      } finally {
        setIsLeaving(false);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setShowLeaveConfirm(false);
      }
      setOpen(newOpen);
    };

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Users className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[500px]"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Group Info</DialogTitle>
          </DialogHeader>

          {!showLeaveConfirm ? (
            <>
              <div className="space-y-6 py-4">
                {/* 群组头像和名称 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shadow-md">
                    {groupAvatar ? (
                      <img
                        src={groupAvatar}
                        alt="Group avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <div className="text-center space-y-2 w-full">
                    <h3 className="text-xl font-semibold">{groupName}</h3>
                    {groupDescription && (
                      <p className="text-sm text-muted-foreground px-4">
                        {groupDescription}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {members.length}{" "}
                      {members.length === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>

                {/* 成员列表 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Members</h4>
                  <ScrollArea className="h-[250px] rounded-xl border">
                    <div className="p-2 space-y-1">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent transition-all duration-200"
                        >
                          <AvatarWithBadge
                            name={member.name || member.email}
                            src={member.avatar ?? undefined}
                            size="w-10 h-10"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium truncate">
                              {member.name || member.email}
                              {member.id === currentUserId && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  (You)
                                </span>
                              )}
                            </h5>
                            {member.bio && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Group
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogDescription className="py-4">
                Are you sure you want to leave this group? You will no longer be
                able to see messages or participate in the conversation.
              </DialogDescription>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveConfirm(false)}
                  disabled={isLeaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeave}
                  disabled={isLeaving}
                >
                  {isLeaving && <Spinner className="w-4 h-4 mr-2" />}
                  {isLeaving ? "Leaving..." : "Leave Group"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

GroupInfoDialog.displayName = "GroupInfoDialog";
