"use client";

import { LogOut, Users } from "lucide-react";
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

interface PublicRoomInfoDialogProps {
  roomId: string;
  roomName: string;
  roomDescription?: string;
  roomAvatar?: string;
  memberCount?: number;
  isMember?: boolean;
  trigger?: React.ReactNode;
}

export const PublicRoomInfoDialog = memo(
  ({
    roomId,
    roomName,
    roomDescription,
    roomAvatar,
    memberCount,
    isMember = true,
    trigger,
  }: PublicRoomInfoDialogProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
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

    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen) {
        setShowLeaveConfirm(false);
      }
      setOpen(newOpen);
    };

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <button
              type="button"
              className="hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {roomAvatar ? (
                  <img
                    src={roomAvatar}
                    alt={roomName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-5 h-5 text-primary" />
                )}
              </div>
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Room Information</DialogTitle>
            <DialogDescription>
              {isMember
                ? "View details and manage your membership"
                : "View details about this public room"}
            </DialogDescription>
          </DialogHeader>

          {showLeaveConfirm ? (
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to leave <strong>{roomName}</strong>? You
                can rejoin this room anytime from the public rooms list.
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowLeaveConfirm(false)}
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
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {roomAvatar ? (
                      <img
                        src={roomAvatar}
                        alt={roomName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">{roomName}</h3>
                    {memberCount !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {memberCount} {memberCount === 1 ? "member" : "members"}
                      </p>
                    )}
                  </div>
                </div>

                {roomDescription && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {roomDescription}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Close
                </Button>
                {isMember && (
                  <Button
                    variant="destructive"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Room
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

PublicRoomInfoDialog.displayName = "PublicRoomInfoDialog";
