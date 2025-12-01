"use client";

import { Pencil, Users } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/shared/image-crop-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useChat } from "@/hooks/use-chat";
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation";
import { useImageUpload } from "@/hooks/use-image-upload";

interface GroupSettingsDialogProps {
  chatId: string;
  currentGroupName: string;
  currentGroupAvatar?: string;
  trigger?: React.ReactNode;
}

export const GroupSettingsDialog = memo(
  ({
    chatId,
    currentGroupName,
    currentGroupAvatar,
    trigger,
  }: GroupSettingsDialogProps) => {
    const { updateGroupInfo, isUpdatingGroup, deleteGroupChat } = useChat();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState(currentGroupName);

    const {
      avatar: groupAvatar,
      cropDialogOpen,
      setCropDialogOpen,
      tempImageSrc,
      handleAvatarChange,
      handleCropComplete,
      resetAvatar,
    } = useImageUpload(currentGroupAvatar);

    const { showDeleteConfirm, showConfirmDialog, hideConfirmDialog } =
      useDeleteConfirmation();

    const handleSave = async () => {
      if (!groupName.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }

      const success = await updateGroupInfo(chatId, {
        groupName: groupName.trim(),
        groupAvatar: groupAvatar || undefined,
      });

      if (success) {
        toast.success("Group settings updated successfully");
        setOpen(false);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setGroupName(currentGroupName);
        resetAvatar();
        hideConfirmDialog();
      }
      setOpen(newOpen);
    };

    const handleDelete = async () => {
      const success = await deleteGroupChat(chatId);
      if (success) {
        setOpen(false);
        // 导航回聊天列表
        window.location.href = "/chat";
      }
    };

    return (
      <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[425px]"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Group Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <label htmlFor="group-avatar-edit" className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors">
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
                </label>
                <input
                  id="group-avatar-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground">
                  Click to change group avatar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
            </div>

            {showDeleteConfirm ? (
              <div className="border-t pt-4">
                <p className="text-sm text-destructive mb-4">
                  Are you sure you want to delete this group? This action cannot
                  be undone. All messages will be permanently deleted.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={hideConfirmDialog}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete Group
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={showConfirmDialog}
                  disabled={isUpdatingGroup}
                >
                  Delete Group
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isUpdatingGroup}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUpdatingGroup || !groupName.trim()}
                  >
                    {isUpdatingGroup && <Spinner className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      </>
    );
  },
);

GroupSettingsDialog.displayName = "GroupSettingsDialog";
