"use client";

import { Mail, Trash2, User } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { deleteChat } from "@/lib/server/actions/chat";

interface PrivateChatInfoDialogProps {
  chatId: string;
  userName: string;
  userEmail?: string;
  userBio?: string;
  userAvatar?: string;
  isOnline: boolean;
  trigger?: React.ReactNode;
}

export const PrivateChatInfoDialog = memo(
  ({
    chatId,
    userName,
    userEmail,
    userBio,
    userAvatar,
    isOnline,
    trigger,
  }: PrivateChatInfoDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        const result = await deleteChat(chatId);
        if (result.success) {
          toast.success("Chat deleted successfully");
          setOpen(false);
          router.push("/chat");
          router.refresh();
        } else {
          toast.error(result.error?.message || "Failed to delete chat");
        }
      } catch (_error) {
        toast.error("Failed to delete chat");
      } finally {
        setIsDeleting(false);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setShowDeleteConfirm(false);
      }
      setOpen(newOpen);
    };

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-[425px]"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>User Info</DialogTitle>
          </DialogHeader>

          {!showDeleteConfirm ? (
            <>
              <div className="flex flex-col items-center gap-4 py-6">
                <AvatarWithBadge
                  name={userName}
                  src={userAvatar}
                  isOnline={isOnline}
                  size="w-24 h-24"
                />
                <div className="text-center space-y-2 w-full">
                  <h3 className="text-xl font-semibold">{userName}</h3>
                  {userEmail && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{userEmail}</span>
                    </div>
                  )}
                  {userBio && (
                    <p className="text-sm text-muted-foreground mt-4 px-4">
                      {userBio}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-2 text-sm mt-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isOnline ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span
                      className={
                        isOnline ? "text-green-500" : "text-muted-foreground"
                      }
                    >
                      {isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
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
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogDescription className="py-4">
                Are you sure you want to delete this chat? This will remove the
                conversation from your list. This action cannot be undone.
              </DialogDescription>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Spinner className="w-4 h-4 mr-2" />}
                  {isDeleting ? "Deleting..." : "Delete Chat"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

PrivateChatInfoDialog.displayName = "PrivateChatInfoDialog";
