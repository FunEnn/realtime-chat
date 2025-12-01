import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseImageUploadReturn {
  avatar: string | null;
  setAvatar: (avatar: string | null) => void;
  cropDialogOpen: boolean;
  setCropDialogOpen: (open: boolean) => void;
  tempImageSrc: string;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCropComplete: (croppedImage: string) => void;
  resetAvatar: () => void;
}

export const useImageUpload = (
  initialAvatar?: string | null,
): UseImageUploadReturn => {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar || null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      try {
        toast.loading("Processing image...");

        const { compressImageForCrop } = await import(
          "@/lib/utils/image-compression"
        );
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
    },
    [],
  );

  const handleCropComplete = useCallback((croppedImage: string) => {
    setAvatar(croppedImage);
    toast.success("Avatar uploaded successfully");
  }, []);

  const resetAvatar = useCallback(() => {
    setAvatar(initialAvatar || null);
  }, [initialAvatar]);

  return {
    avatar,
    setAvatar,
    cropDialogOpen,
    setCropDialogOpen,
    tempImageSrc,
    handleAvatarChange,
    handleCropComplete,
    resetAvatar,
  };
};
