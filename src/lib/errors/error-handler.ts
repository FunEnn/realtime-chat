/**
 * 统一错误处理工具
 * 用于 API Routes 和 Server Actions
 */

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/common";
import { AppError } from "./app-error";

/**
 * API 错误处理中间件
 * 将各种错误转换为统一的 API 响应格式
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  // 应用自定义错误
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  // Zod 验证错误
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  // Prisma 错误
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Prisma 验证错误
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Database validation failed",
          details: error.message,
        },
      },
      { status: 400 },
    );
  }

  // 标准 Error 对象
  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            process.env.NODE_ENV === "production"
              ? "An unexpected error occurred"
              : error.message,
          ...(process.env.NODE_ENV !== "production" && {
            stack: error.stack,
          }),
        },
      },
      { status: 500 },
    );
  }

  // 未知错误
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "UNKNOWN_ERROR",
        message: "An unknown error occurred",
        details: error,
      },
    },
    { status: 500 },
  );
}

/**
 * 处理 Prisma 错误
 */
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): NextResponse<ApiResponse> {
  switch (error.code) {
    // 唯一约束违反
    case "P2002":
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "A record with this value already exists",
            details: error.meta,
          },
        },
        { status: 409 },
      );

    // 外键约束违反
    case "P2003":
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_REFERENCE",
            message: "Referenced record does not exist",
            details: error.meta,
          },
        },
        { status: 400 },
      );

    // 记录不存在
    case "P2025":
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Record not found",
            details: error.meta,
          },
        },
        { status: 404 },
      );

    // 其他数据库错误
    default:
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Database operation failed",
            details:
              process.env.NODE_ENV !== "production"
                ? { code: error.code, meta: error.meta }
                : undefined,
          },
        },
        { status: 500 },
      );
  }
}

/**
 * Server Action 错误处理
 * 返回统一的错误格式（不使用 NextResponse）
 */
export function handleServerActionError(error: unknown): ApiResponse {
  console.error("Server Action Error:", error);

  // 应用自定义错误
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  // Zod 验证错误
  if (error instanceof ZodError) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.flatten(),
      },
    };
  }

  // Prisma 错误
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return prismaErrorToResponse(error);
  }

  // 标准 Error 对象
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : error.message,
      },
    };
  }

  // 未知错误
  return {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
    },
  };
}

/**
 * 将 Prisma 错误转换为 ApiResponse
 */
function prismaErrorToResponse(
  error: Prisma.PrismaClientKnownRequestError,
): ApiResponse {
  switch (error.code) {
    case "P2002":
      return {
        success: false,
        error: {
          code: "CONFLICT",
          message: "A record with this value already exists",
          details: error.meta,
        },
      };

    case "P2003":
      return {
        success: false,
        error: {
          code: "INVALID_REFERENCE",
          message: "Referenced record does not exist",
          details: error.meta,
        },
      };

    case "P2025":
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Record not found",
          details: error.meta,
        },
      };

    default:
      return {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Database operation failed",
        },
      };
  }
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * 包装异步处理函数（用于 API Routes）
 */
export function withErrorHandler<
  T extends (...args: unknown[]) => Promise<NextResponse>,
>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
