import { toast } from "sonner";
import { API } from "@/lib/api-client";

/**
 * 验证图片文件
 * @param file - 要验证的文件
 * @returns { valid: boolean; error?: string }
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // 验证文件类型
  if (!file.type.startsWith("image/")) {
    return { valid: false, error: "File must be an image" };
  }

  // 验证文件大小
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: "Image size must be less than 10MB" };
  }

  return { valid: true };
}

/**
 * 将文件转换为 base64 Data URL
 * @param file - 要转换的文件
 * @returns Promise<string> - base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 上传图片到 Cloudinary
 * @param file - 要上传的文件
 * @param showToast - 是否显示 toast 提示
 * @returns Promise<string> - Cloudinary 图片 URL
 */
export async function uploadImageToCloudinary(
  file: File,
  showToast: boolean = true,
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    if (showToast) toast.error(validation.error || "Invalid file");
    throw new Error(validation.error);
  }

  if (showToast) {
    toast.loading("Uploading image...", { id: "image-upload" });
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    const { data } = await API.post("/upload", { file: dataUrl });

    if (showToast) {
      toast.success("Image uploaded successfully", { id: "image-upload" });
    }

    return data.url;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload image";

    if (showToast) {
      toast.error(errorMessage, { id: "image-upload" });
    }

    throw error;
  }
}

/**
 * 处理图片上传（转换为 base64）
 * @param file - 要处理的文件
 * @param showToast - 是否显示 toast 提示
 * @returns Promise<string> - base64 Data URL
 */
export async function uploadImageAsBase64(
  file: File,
  showToast: boolean = true,
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    if (showToast) toast.error(validation.error || "Invalid file");
    throw new Error(validation.error);
  }

  if (showToast) {
    toast.loading("Processing image...", { id: "image-process" });
  }

  try {
    const dataUrl = await fileToDataUrl(file);

    if (showToast) {
      toast.success("Image ready", { id: "image-process" });
    }

    return dataUrl;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process image";

    if (showToast) {
      toast.error(errorMessage, { id: "image-process" });
    }

    throw error;
  }
}
