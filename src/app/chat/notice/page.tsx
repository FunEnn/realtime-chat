import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import * as userRepository from "@/lib/server/repositories/user.repository";
import NoticeClient from "./_components/notice-client";

export default async function NoticePage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    redirect("/sign-in");
  }

  const user = await userRepository.findUserByClerkId(userId);

  if (!user) {
    redirect("/sign-in");
  }

  return <NoticeClient user={user} />;
}
