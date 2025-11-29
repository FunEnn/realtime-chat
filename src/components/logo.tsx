import { MessageCircle } from "lucide-react";

interface LogoProps {
  showText?: boolean;
}

export default function Logo({ showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <MessageCircle className="h-8 w-8 text-white" />
      {showText && (
        <span className="text-2xl font-bold text-white">Realtime Chat</span>
      )}
    </div>
  );
}
