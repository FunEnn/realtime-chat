/**
 * 应用自定义错误类
 * 用于统一整个应用的错误处理
 */

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * 认证错误
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: unknown) {
    super("UNAUTHORIZED", message, 401, details);
    this.name = "UnauthorizedError";
  }
}

/**
 * 权限错误
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: unknown) {
    super("FORBIDDEN", message, 403, details);
    this.name = "ForbiddenError";
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends AppError {
  constructor(resource: string, details?: unknown) {
    super("NOT_FOUND", `${resource} not found`, 404, details);
    this.name = "NotFoundError";
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

/**
 * 冲突错误（资源已存在）
 */
export class ConflictError extends AppError {
  constructor(message = "Resource already exists", details?: unknown) {
    super("CONFLICT", message, 409, details);
    this.name = "ConflictError";
  }
}

/**
 * 服务器内部错误
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: unknown) {
    super("INTERNAL_ERROR", message, 500, details);
    this.name = "InternalServerError";
  }
}

/**
 * 错误代码常量
 */
export const ErrorCodes = {
  // 认证错误 (401)
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // 权限错误 (403)
  FORBIDDEN: "FORBIDDEN",
  NOT_MEMBER: "NOT_MEMBER",
  NOT_CREATOR: "NOT_CREATOR",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",

  // 资源错误 (404)
  NOT_FOUND: "NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  CHAT_NOT_FOUND: "CHAT_NOT_FOUND",
  MESSAGE_NOT_FOUND: "MESSAGE_NOT_FOUND",
  ROOM_NOT_FOUND: "ROOM_NOT_FOUND",

  // 验证错误 (400)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",

  // 业务逻辑错误 (400)
  CANNOT_MESSAGE_SELF: "CANNOT_MESSAGE_SELF",
  CHAT_ALREADY_EXISTS: "CHAT_ALREADY_EXISTS",
  ALREADY_MEMBER: "ALREADY_MEMBER",
  NOT_IN_ROOM: "NOT_IN_ROOM",

  // 冲突错误 (409)
  CONFLICT: "CONFLICT",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // 服务器错误 (500)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
} as const;

/**
 * 错误代码类型
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 工厂函数：创建特定类型的错误
 */
export const createError = {
  unauthorized: (message?: string, details?: unknown) =>
    new UnauthorizedError(message, details),

  forbidden: (message?: string, details?: unknown) =>
    new ForbiddenError(message, details),

  notFound: (resource: string, details?: unknown) =>
    new NotFoundError(resource, details),

  validation: (message?: string, details?: unknown) =>
    new ValidationError(message, details),

  conflict: (message?: string, details?: unknown) =>
    new ConflictError(message, details),

  internal: (message?: string, details?: unknown) =>
    new InternalServerError(message, details),
};

/**
 * 错误断言工具
 */
export const assert = {
  /**
   * 断言条件为真，否则抛出错误
   */
  true: (condition: boolean, error: AppError) => {
    if (!condition) throw error;
  },

  /**
   * 断言值存在，否则抛出 NotFoundError
   */
  exists: <T>(value: T | null | undefined, resource: string): T => {
    if (value == null) {
      throw new NotFoundError(resource);
    }
    return value;
  },

  /**
   * 断言用户已认证
   */
  authenticated: (userId: string | null | undefined): string => {
    if (!userId) {
      throw new UnauthorizedError("User not authenticated");
    }
    return userId;
  },

  /**
   * 断言用户有权限
   */
  authorized: (hasPermission: boolean, message?: string) => {
    if (!hasPermission) {
      throw new ForbiddenError(message || "Insufficient permissions");
    }
  },
};
