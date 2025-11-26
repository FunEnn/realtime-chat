import {
  badRequestResponse,
  errorResponse,
  jsonResponse,
  parseRequestBody,
} from "@/src/lib/api-utils";
import { loginUser, setCurrentUser } from "@/src/server/auth";
import type { LoginInput } from "@/src/types/auth.type";

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody<LoginInput>(request);

    if (!body.email || !body.password) {
      return badRequestResponse("Missing email or password");
    }

    const user = loginUser(body.email, body.password);
    await setCurrentUser(user);
    return jsonResponse({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return errorResponse(message, 401);
  }
}
