import { MessageCircle } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <MessageCircle className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold">Realtime Chat</span>
    </div>
  );
}
