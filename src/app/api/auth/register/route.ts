import {
  badRequestResponse,
  handleError,
  jsonResponse,
  parseRequestBody,
} from "@/src/lib/api-utils";
import { registerUser, setCurrentUser } from "@/src/server/auth";
import type { RegisterInput } from "@/src/types/auth.type";

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody<RegisterInput>(request);

    if (!body.email || !body.password || !body.name) {
      return badRequestResponse("Missing required fields");
    }

    const user = registerUser(body);
    await setCurrentUser(user);
    return jsonResponse({ user }, 201);
  } catch (error) {
    return handleError(error, "Register failed");
  }
}
