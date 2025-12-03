"use client";

import { Toaster } from "@/components/ui/sonner";

interface AppWrapperProps {
  children: React.ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  // 数据获取已移至 Server Components (layout.tsx)
  // 不再需要在客户端 fetch 数据

  return (
    <>
      <div>{children}</div>
      <Toaster position="top-center" richColors />
    </>
  );
};

export default AppWrapper;
