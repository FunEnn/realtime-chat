"use client";

import { Toaster } from "@/components/ui/sonner";

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  return (
    <>
      <div>{children}</div>
      <Toaster position="top-center" richColors />
    </>
  );
};

export default AppWrapper;
