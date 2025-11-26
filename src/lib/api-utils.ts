import { NextResponse } from "next/server";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function unauthorizedResponse(message = "Not authenticated") {
  return errorResponse(message, 401);
}

export function notFoundResponse(message = "Resource not found") {
  return errorResponse(message, 404);
}

export function badRequestResponse(message = "Invalid request") {
  return errorResponse(message, 400);
}

export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function handleError(
  error: unknown,
  defaultMessage = "Operation failed",
) {
  const message = error instanceof Error ? error.message : defaultMessage;
  return errorResponse(message, 400);
}
