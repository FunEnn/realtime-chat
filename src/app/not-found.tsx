"use client";

import { ArrowLeft, Home, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <Empty className="max-w-2xl mx-auto px-4">
        <EmptyHeader className="space-y-6">
          <EmptyMedia variant="icon" className="mb-4">
            <Logo showText={false} className="w-20 h-20" />
          </EmptyMedia>

          <div className="space-y-2">
            <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
            <EmptyTitle className="text-3xl">Page Not Found</EmptyTitle>
            <EmptyDescription className="text-base max-w-md mx-auto">
              Sorry, the page you are looking for doesn't exist or has been
              moved.
            </EmptyDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/chat">
                <MessageSquare className="w-4 h-4" />
                Go to Chats
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 mt-4 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
