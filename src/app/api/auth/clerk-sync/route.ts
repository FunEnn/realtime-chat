import { NextResponse } from "next/server";
import { z } from "zod";
import * as userRepository from "@/lib/server/repositories/user.repository";

const clerkSyncSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = clerkSyncSchema.parse(body);

    const user = await userRepository.upsertUserFromClerk(
      validatedData.clerkId,
      {
        email: validatedData.email,
        name: validatedData.name || "Anonymous",
        avatar: validatedData.avatar || undefined,
      },
    );

    return NextResponse.json(
      {
        success: true,
        user,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.flatten(),
        },
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to sync user",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

// 添加 OPTIONS 方法支持 CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
