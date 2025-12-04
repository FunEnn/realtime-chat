"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { leavePublicRoom } from "@/lib/server/actions/public-room";

interface PublicRoomLeaveDialogProps {
  roomId: string;
  roomName: string;
  trigger?: React.ReactNode;
}

export const PublicRoomLeaveDialog = memo(
  ({ roomId, roomName, trigger }: PublicRoomLeaveDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeave = async () => {
      setIsLeaving(true);
      try {
        const result = await leavePublicRoom(roomId);
        if (result.success) {
          toast.success(`Left ${roomName}`);
          setOpen(false);
          router.push("/chat");
          router.refresh();
        } else {
          toast.error(
            typeof result.error === "string"
              ? result.error
              : "Failed to leave room",
          );
        }
      } catch (error) {
        console.error("Leave room error:", error);
        toast.error("Failed to leave room");
      } finally {
        setIsLeaving(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Leave Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{roomName}</strong>? You
              can rejoin anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Leaving...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Room
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

PublicRoomLeaveDialog.displayName = "PublicRoomLeaveDialog";
