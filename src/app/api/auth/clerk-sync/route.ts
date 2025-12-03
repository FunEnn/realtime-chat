import { NextResponse } from "next/server";
import { z } from "zod";
import * as userService from "@/lib/server/services/user.service";

const clerkSyncSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = clerkSyncSchema.parse(body);

    const user = await userService.syncUserFromClerk(validatedData.clerkId, {
      email: validatedData.email,
      name: validatedData.name || "Anonymous",
      avatar: validatedData.avatar,
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: error.flatten(),
        },
        { status: 400 },
      );
    }

    console.error("Error syncing Clerk user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync user",
      },
      { status: 500 },
    );
  }
}
