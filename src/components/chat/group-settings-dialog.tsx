"use client";

import { Pencil, Users } from "lucide-react";
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
import { useChat } from "@/hooks/use-chat";
import { ImageCropDialog } from "./image-crop-dialog";

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
    const { updateGroupInfo, isUpdatingGroup } = useChat();
    const [open, setOpen] = useState(false);
    const [groupName, setGroupName] = useState(currentGroupName);
    const [groupAvatar, setGroupAvatar] = useState<string | null>(
      currentGroupAvatar || null,
    );
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
      setGroupAvatar(croppedImage);
      toast.success("Avatar uploaded successfully");
    };

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
        setGroupAvatar(currentGroupAvatar || null);
      }
      setOpen(newOpen);
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
            <DialogFooter>
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
            </DialogFooter>
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
