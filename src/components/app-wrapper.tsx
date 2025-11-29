"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  const { refreshAuthStatus, user } = useAuth();
  const { fetchChats } = useChat();

  useEffect(() => {
    refreshAuthStatus();
  }, [refreshAuthStatus]);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  return (
    <>
      <div>{children}</div>
      <Toaster position="top-center" richColors />
    </>
  );
};

export default AppWrapper;
