"use client";

import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ImageCropDialog } from "@/components/shared/image-crop-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useImageUpload } from "@/hooks/use-image-upload";
import { usePublicRoom } from "@/hooks/use-public-room";

interface CreatePublicRoomDialogProps {
  trigger?: React.ReactNode;
}

export default function CreatePublicRoomDialog({
  trigger,
}: CreatePublicRoomDialogProps) {
  const router = useRouter();
  const { createPublicRoom } = usePublicRoom();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const {
    avatar,
    cropDialogOpen,
    setCropDialogOpen,
    tempImageSrc,
    handleAvatarChange,
    handleCropComplete,
    resetAvatar,
  } = useImageUpload();

  const resetForm = () => {
    setName("");
    setDescription("");
    resetAvatar();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Room name is required");
      return;
    }

    setIsCreating(true);
    try {
      const room = await createPublicRoom({
        name: name.trim(),
        description: description.trim(),
        avatar: avatar || undefined,
      });

      if (room) {
        resetForm();
        setOpen(false);
        router.push(`/chat/public-room/${room._id}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Create Public Room
            </Button>
          )}
        </DialogTrigger>
        <DialogPortal>
          <DialogOverlay className="!z-[1000]" />
          <DialogContent
            className="sm:max-w-[500px] !z-[1000]"
            aria-describedby={undefined}
          >
            <DialogHeader>
              <DialogTitle>Create Public Room</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Avatar Upload */}
              <div className="flex items-center gap-3">
                <label htmlFor="room-avatar" className="cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Room avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-primary" />
                    )}
                  </div>
                </label>
                <input
                  id="room-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Click to upload room avatar
                  </p>
                </div>
              </div>

              {/* Room Name */}
              <div className="space-y-2">
                <label htmlFor="room-name" className="text-sm font-medium">
                  Room Name
                </label>
                <Input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter room name"
                  maxLength={100}
                  disabled={isCreating}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="room-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Textarea
                  id="room-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter room description"
                  maxLength={500}
                  rows={3}
                  disabled={isCreating}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/500 characters
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !name.trim()}
              >
                {isCreating && <Spinner className="mr-2 w-4 h-4" />}
                Create Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
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
}
