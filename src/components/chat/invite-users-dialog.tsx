"use client";

import { UserPlus } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { addUsersToChat } from "@/lib/server/actions/chat";
import type { User } from "@/types";

interface InviteUsersDialogProps {
  chatId: string;
  chatName: string;
  currentMembers: User[];
  allUsers: User[];
  trigger?: React.ReactNode;
}

export const InviteUsersDialog = memo(
  ({
    chatId,
    chatName,
    currentMembers,
    allUsers,
    trigger,
  }: InviteUsersDialogProps) => {
    const [open, setOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isInviting, setIsInviting] = useState(false);

    // 获取不在群里的用户
    const availableUsers = allUsers.filter(
      (user) => !currentMembers.some((member) => member.id === user.id),
    );

    const toggleUserSelection = (userId: string) => {
      setSelectedUsers((prev) =>
        prev.includes(userId)
          ? prev.filter((id) => id !== userId)
          : [...prev, userId],
      );
    };

    const handleInvite = async () => {
      if (selectedUsers.length === 0) {
        toast.error("Please select at least one user to invite");
        return;
      }

      setIsInviting(true);
      try {
        const result = await addUsersToChat(chatId, selectedUsers);

        if (result.success) {
          toast.success(
            `Successfully invited ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""} to ${chatName}`,
          );
          setSelectedUsers([]);
          setOpen(false);
        } else {
          toast.error(result.error?.message || "Failed to invite users");
        }
      } catch (_error) {
        toast.error("Failed to invite users");
      } finally {
        setIsInviting(false);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setSelectedUsers([]);
      }
      setOpen(newOpen);
    };

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <UserPlus className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[500px]"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>Invite Users to {chatName}</DialogTitle>
            <DialogDescription>
              Select users to add to this group chat
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {availableUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                All users are already members of this group
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-all duration-200 cursor-pointer hover:shadow-sm"
                    onClick={() => toggleUserSelection(user.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleUserSelection(user.id);
                      }
                    }}
                  >
                    <AvatarWithBadge
                      name={user.name || user.email}
                      src={user.avatar ?? undefined}
                      size="w-10 h-10"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium truncate">
                        {user.name || user.email}
                      </h5>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {availableUsers.length > 0 && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={isInviting || selectedUsers.length === 0}
              >
                {isInviting && <Spinner className="w-4 h-4 mr-2" />}
                {isInviting
                  ? "Inviting..."
                  : `Invite ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}`}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

InviteUsersDialog.displayName = "InviteUsersDialog";
