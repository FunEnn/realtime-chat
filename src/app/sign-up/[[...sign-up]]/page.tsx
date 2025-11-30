import { SignUp } from "@clerk/nextjs";
import { AnimeBackground } from "@/components/anime-background";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden p-6">
      <AnimeBackground />
      <div className="relative z-10">
        <SignUp
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl border-2 border-pink-200 dark:border-pink-800 backdrop-blur-md bg-background/95",
            },
          }}
        />
      </div>
    </div>
  );
}
