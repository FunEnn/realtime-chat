/**
 * 统一的日志工具
 * 在生产环境可以轻松切换到其他日志服务
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = process.env.NODE_ENV === "development";

const log = (level: LogLevel, message: string, context?: LogContext): void => {
  if (!isDevelopment && level === "info") {
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = context
    ? `[${timestamp}] ${message}`
    : `[${timestamp}] ${message}`;

  switch (level) {
    case "error":
      console.error(logMessage, context || "");
      break;
    case "warn":
      console.warn(logMessage, context || "");
      break;
    case "info":
      console.log(logMessage, context || "");
      break;
  }
};

export const logger = {
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};
