import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseImageUploadReturn {
  avatar: string | null;
  setAvatar: (avatar: string | null) => void;
  cropDialogOpen: boolean;
  setCropDialogOpen: (open: boolean) => void;
  tempImageSrc: string;
  isUploading: boolean;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleCropComplete: (croppedImage: string | Blob) => void;
  uploadToCloudinary: (base64Image: string) => Promise<string>;
  resetAvatar: () => void;
}

export const useImageUpload = (
  initialAvatar?: string | null,
): UseImageUploadReturn => {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar || null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      try {
        toast.loading("Processing image...", { id: "image-process" });

        const { compressImageForCrop } = await import(
          "@/lib/utils/image-compression"
        );
        const compressed = await compressImageForCrop(file);

        toast.dismiss("image-process");
        setTempImageSrc(compressed);
        setCropDialogOpen(true);
      } catch (error) {
        toast.dismiss("image-process");
        console.error("Image processing failed:", error);
        toast.error("Failed to process image. Please try a different image.");
      }

      e.target.value = "";
    },
    [],
  );

  const handleCropComplete = useCallback((croppedImage: string | Blob) => {
    if (typeof croppedImage === "string") {
      setAvatar(croppedImage);
      toast.success("Image ready");
    } else {
      console.error("Blob format not supported, expected base64 string");
      toast.error("Image format not supported");
    }
  }, []);

  const uploadToCloudinary = useCallback(
    async (base64Image: string): Promise<string> => {
      setIsUploading(true);
      toast.loading("Uploading to Cloudinary...", { id: "cloudinary-upload" });

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ file: base64Image }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();
        toast.success("Image uploaded successfully", {
          id: "cloudinary-upload",
        });

        return data.url;
      } catch (error) {
        console.error("Upload to Cloudinary failed:", error);
        toast.error("Failed to upload image", { id: "cloudinary-upload" });
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  const resetAvatar = useCallback(() => {
    setAvatar(initialAvatar || null);
  }, [initialAvatar]);

  return {
    avatar,
    setAvatar,
    cropDialogOpen,
    setCropDialogOpen,
    tempImageSrc,
    isUploading,
    handleAvatarChange,
    handleCropComplete,
    uploadToCloudinary,
    resetAvatar,
  };
};
