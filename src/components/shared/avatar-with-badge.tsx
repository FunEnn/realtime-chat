"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  src?: string;
  size?: string;
  isOnline?: boolean;
  isGroup?: boolean;
  className?: string;
}

const AvatarWithBadge = ({
  name,
  src,
  isOnline,
  isGroup = false,
  size = "w-9 h-9",
  className,
}: Props) => {
  const isMounted = useMounted();

  return (
    <div className="relative shrink-0">
      <Avatar className={size}>
        {isGroup ? (
          <>
            {src ? <AvatarImage src={src} /> : null}
            <AvatarFallback
              className={cn(
                "bg-primary/10 text-primary font-semibold",
                className,
              )}
            >
              <Users className="w-5 h-5" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={src || undefined} />
            <AvatarFallback
              className={cn(
                "bg-primary/10 text-primary font-semibold",
                className,
              )}
            >
              {name?.charAt(0)}
            </AvatarFallback>
          </>
        )}
      </Avatar>

      {/* 在线状态点 - 使用 suppressHydrationWarning 避免 hydration 警告 */}
      {isOnline && !isGroup && (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500"
          suppressHydrationWarning
          style={{ display: isMounted ? undefined : "none" }}
        />
      )}
    </div>
  );
};

export default AvatarWithBadge;
