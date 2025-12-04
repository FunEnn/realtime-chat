"use client";

import { Pencil, Users } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation";
import { useImageUpload } from "@/hooks/use-image-upload";
import { deleteChat, updateChatInfo } from "@/lib/server/actions/chat";

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
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState(currentGroupName);
    const [isUpdating, setIsUpdating] = useState(false);

    const {
      avatar: groupAvatar,
      cropDialogOpen,
      setCropDialogOpen,
      tempImageSrc,
      isUploading,
      handleAvatarChange,
      handleCropComplete,
      uploadToCloudinary,
      resetAvatar,
    } = useImageUpload(currentGroupAvatar);

    const { showDeleteConfirm, showConfirmDialog, hideConfirmDialog } =
      useDeleteConfirmation();

    const handleSave = async () => {
      if (!groupName.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }

      setIsUpdating(true);
      try {
        // 如果有头像且是 base64 格式，先上传到 Cloudinary
        let avatarUrl = groupAvatar;
        if (groupAvatar?.startsWith("data:")) {
          try {
            avatarUrl = await uploadToCloudinary(groupAvatar);
          } catch (uploadError) {
            console.error("Failed to upload avatar:", uploadError);
            // 上传失败时继续使用 base64
          }
        }

        const result = await updateChatInfo(chatId, {
          name: groupName.trim(),
          avatar: avatarUrl || undefined,
        });

        if (result.success) {
          toast.success("Group settings updated successfully");
          setOpen(false);
          router.refresh(); // 刷新 Server Component 数据
        } else {
          toast.error(result.error?.message || "Failed to update group");
        }
      } finally {
        setIsUpdating(false);
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
      const result = await deleteChat(chatId);
      if (result.success) {
        toast.success("Group deleted successfully");
        setOpen(false);
        router.push("/chat");
        router.refresh();
      } else {
        toast.error(result.error?.message || "Failed to delete group");
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
                  <Button
                    variant="outline"
                    onClick={hideConfirmDialog}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isUploading}
                  >
                    Delete Group
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={showConfirmDialog}
                  disabled={isUpdating || isUploading}
                >
                  Delete Group
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isUpdating || isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating || isUploading || !groupName.trim()}
                  >
                    {(isUpdating || isUploading) && (
                      <Spinner className="w-4 h-4 mr-2" />
                    )}
                    {isUploading ? "Uploading..." : "Save Changes"}
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
