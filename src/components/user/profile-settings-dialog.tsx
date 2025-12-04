"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-clerk-auth";
import { updateUserProfile } from "@/lib/server/actions/user";

interface ProfileSettingsDialogProps {
  trigger?: React.ReactNode;
}

export default function ProfileSettingsDialog({
  trigger,
}: ProfileSettingsDialogProps) {
  const { user, setUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");

  const handleSave = async () => {
    if (bio.length > 500) {
      toast.error("Bio must be less than 500 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserProfile({
        bio: bio.trim(),
      });

      if (
        result.success &&
        result.data &&
        typeof result.data === "object" &&
        "id" in result.data
      ) {
        setUser(result.data as any);
        setOpen(false);
        toast.success("Bio saved successfully");
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : "Failed to save bio";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Update bio error:", error);
      toast.error("Failed to save bio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setBio(user?.bio || "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Edit Profile</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit Bio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Hey there! I'm using chat"
              maxLength={500}
              rows={6}
              disabled={isLoading}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Spinner className="mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
