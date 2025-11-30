"use client";

import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-clerk-auth";

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  const { user, isLoading } = useAuth();
  const { fetchChats } = useChat();
  const hasFetchedChats = useRef(false);

  useEffect(() => {
    if (user && !isLoading && !hasFetchedChats.current) {
      fetchChats();
      hasFetchedChats.current = true;
    }
  }, [user, isLoading, fetchChats]);

  return (
    <>
      <div>{children}</div>
      <Toaster position="top-center" richColors />
    </>
  );
};

export default AppWrapper;
