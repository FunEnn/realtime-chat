import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  showText?: boolean;
  className?: string;
}

export default function Logo({ showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MessageCircle className="h-8 w-8 text-white" />
      {showText && (
        <span className="text-2xl font-bold text-white">Realtime Chat</span>
      )}
    </div>
  );
}
