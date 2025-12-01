import { isAxiosError } from "axios";
import { toast } from "sonner";
import { logger } from "./logger";

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string })?.message;
    return message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

/**
 * 统一的错误处理工具
 * @param error 错误对象
 * @param context 错误上下文描述
 * @param fallbackMessage 默认错误消息
 * @param showToast 是否显示 toast 提示
 */
export const handleError = (
  error: unknown,
  context: string,
  fallbackMessage: string,
  showToast: boolean = true,
): void => {
  const errorMessage = getErrorMessage(error, fallbackMessage);
  logger.error(`${context}:`, { error, message: errorMessage });

  if (showToast) {
    toast.error(errorMessage);
  }
};
