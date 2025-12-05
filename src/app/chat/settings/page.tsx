import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import * as userRepository from "@/lib/server/repositories/user.repository";
import SettingsClient from "./page-client";

export default async function SettingsPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    redirect("/sign-in");
  }

  const user = await userRepository.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  return <SettingsClient user={user} />;
}
