"use client";

import { Pencil, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useDeleteConfirmation } from "@/hooks/use-delete-confirmation";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
  checkIsAdmin,
  deletePublicRoom,
  updatePublicRoom,
} from "@/lib/server/actions/public-room";

interface PublicRoomSettingsDialogProps {
  roomId: string;
  currentRoomName: string;
  currentDescription?: string;
  currentAvatar?: string;
  trigger?: React.ReactNode;
}

export const PublicRoomSettingsDialog = memo(
  ({
    roomId,
    currentRoomName,
    currentDescription,
    currentAvatar,
    trigger,
  }: PublicRoomSettingsDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [name, setName] = useState(currentRoomName);
    const [description, setDescription] = useState(currentDescription || "");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

    const {
      avatar,
      cropDialogOpen,
      setCropDialogOpen,
      tempImageSrc,
      isUploading,
      handleAvatarChange,
      handleCropComplete,
      uploadToCloudinary,
      resetAvatar,
    } = useImageUpload(currentAvatar);

    const {
      showDeleteConfirm,
      isDeleting,
      setIsDeleting,
      showConfirmDialog,
      hideConfirmDialog,
    } = useDeleteConfirmation();

    useEffect(() => {
      const checkAdmin = async () => {
        setIsCheckingAdmin(true);
        try {
          const result = await checkIsAdmin();
          setIsAdmin(result.isAdmin);
        } finally {
          setIsCheckingAdmin(false);
        }
      };

      checkAdmin();
    }, []);

    const handleSave = async () => {
      if (!name.trim()) {
        toast.error("Room name cannot be empty");
        return;
      }

      setIsUpdating(true);
      try {
        // 如果有头像且是 base64 格式，先上传到 Cloudinary
        let avatarUrl = avatar;
        if (avatar?.startsWith("data:")) {
          try {
            avatarUrl = await uploadToCloudinary(avatar);
          } catch (uploadError) {
            console.error("Failed to upload avatar:", uploadError);
            // 上传失败时继续使用 base64
          }
        }

        const result = await updatePublicRoom(roomId, {
          name: name.trim(),
          description: description.trim(),
          avatar: avatarUrl || undefined,
        });

        if (result.success) {
          toast.success("Room settings updated successfully");
          setOpen(false);
          router.refresh();
        } else {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Failed to update room",
          );
        }
      } finally {
        setIsUpdating(false);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setName(currentRoomName);
        setDescription(currentDescription || "");
        resetAvatar();
        hideConfirmDialog();
      }
      setOpen(newOpen);
    };

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        // 删除公共聊天室（仅管理员）
        const result = await deletePublicRoom(roomId);
        if (result.success) {
          toast.success("Room deleted successfully");
          setOpen(false);
          router.push("/chat");
          router.refresh();
        } else {
          const errorMsg =
            typeof result.error === "string"
              ? result.error
              : "Failed to delete room";
          toast.error(errorMsg);
        }
      } catch (error) {
        console.error("Delete room error:", error);
        toast.error("Failed to delete room");
      } finally {
        setIsDeleting(false);
      }
    };

    if (isCheckingAdmin) {
      return null;
    }

    if (!isAdmin) {
      return null;
    }

    return (
      <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="ghost" size="icon">
                <Pencil className="w-5 h-5" />
              </Button>
            )}
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[425px]"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Room Settings (Admin)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-4">
                <label htmlFor="room-avatar-edit" className="cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Room avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-12 h-12 text-primary" />
                    )}
                  </div>
                </label>
                <input
                  id="room-avatar-edit"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground">
                  Click to change room avatar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter room name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-description">Description</Label>
                <Textarea
                  id="room-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter room description"
                  maxLength={500}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/500 characters
                </p>
              </div>
            </div>

            {showDeleteConfirm ? (
              <div className="border-t pt-4">
                <p className="text-sm text-destructive mb-4">
                  ⚠️ Are you sure you want to delete this room? This action
                  cannot be undone. All messages and members will be permanently
                  deleted.
                </p>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={hideConfirmDialog}
                    disabled={isDeleting || isUploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting || isUploading}
                  >
                    {(isDeleting || isUploading) && (
                      <Spinner className="w-4 h-4 mr-2" />
                    )}
                    Delete Room Permanently
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={showConfirmDialog}
                  disabled={isUpdating || isDeleting || isUploading}
                >
                  Delete Room
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
                    disabled={isUpdating || isUploading || !name.trim()}
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

PublicRoomSettingsDialog.displayName = "PublicRoomSettingsDialog";
