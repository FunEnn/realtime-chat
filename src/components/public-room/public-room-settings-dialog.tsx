"use client";

import { Pencil, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { toast } from "sonner";
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
import { usePublicRoom } from "@/hooks/use-public-room";
import { ImageCropDialog } from "../chat/image-crop-dialog";

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
    const {
      updatePublicRoom,
      isUpdating,
      deletePublicRoom,
      clearCurrentRoom,
      leaveRoom,
    } = usePublicRoom();
    const [open, setOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [name, setName] = useState(currentRoomName);
    const [description, setDescription] = useState(currentDescription || "");
    const [avatar, setAvatar] = useState<string | null>(currentAvatar || null);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string>("");

    const handleAvatarChange = async (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      try {
        toast.loading("Processing image...");

        // 直接压缩图片，不限制文件大小
        const compressed = await compressImageForCrop(file);

        toast.dismiss();
        setTempImageSrc(compressed);
        setCropDialogOpen(true);
      } catch (error) {
        toast.dismiss();
        console.error("Image processing failed:", error);
        toast.error("Failed to process image. Please try a different image.");
      }

      e.target.value = "";
    };

    const compressImageForCrop = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let { width, height } = img;

            // 计算合适的尺寸（最大边不超过2048px）
            const maxDimension = 2048;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height * maxDimension) / width;
                width = maxDimension;
              } else {
                width = (width * maxDimension) / height;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // 转换为base64，质量为0.9
            const compressed = canvas.toDataURL("image/jpeg", 0.9);
            resolve(compressed);
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    };

    const handleCropComplete = (croppedImage: string) => {
      setAvatar(croppedImage);
      toast.success("Avatar uploaded successfully");
    };

    const handleSave = async () => {
      if (!name.trim()) {
        toast.error("Room name cannot be empty");
        return;
      }

      const success = await updatePublicRoom(roomId, {
        name: name.trim(),
        description: description.trim(),
        avatar: avatar || undefined,
      });

      if (success) {
        toast.success("Room settings updated successfully");
        setOpen(false);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setName(currentRoomName);
        setDescription(currentDescription || "");
        setAvatar(currentAvatar || null);
        setShowDeleteConfirm(false);
      }
      setOpen(newOpen);
    };

    const handleDelete = async () => {
      setIsDeleting(true);
      try {
        // 先离开房间（Socket）
        await leaveRoom(roomId);

        // 再删除房间
        const success = await deletePublicRoom(roomId);
        if (success) {
          setOpen(false);
          clearCurrentRoom();
          // 导航回聊天列表
          router.push("/chat");
        }
      } catch (error) {
        console.error("Delete room error:", error);
      } finally {
        setIsDeleting(false);
      }
    };

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
              <DialogTitle>Room Settings</DialogTitle>
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
                  Are you sure you want to delete this room? This action cannot
                  be undone. All messages will be permanently deleted.
                </p>
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
                    Delete Room
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isUpdating || isDeleting}
                >
                  Delete Room
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isUpdating || !name.trim()}
                  >
                    {isUpdating && <Spinner className="w-4 h-4 mr-2" />}
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

PublicRoomSettingsDialog.displayName = "PublicRoomSettingsDialog";
