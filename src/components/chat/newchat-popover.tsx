"use client";

import { ArrowLeft, PenBox, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { toast } from "sonner";
import AvatarWithBadge from "@/components/shared/avatar-with-badge";
import { ImageCropDialog } from "@/components/shared/image-crop-dialog";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useImageUpload } from "@/hooks/use-image-upload";
import { createChat as createChatAction } from "@/lib/server/actions/chat";
import type { User } from "@/types";
import CreatePublicRoomDialog from "../public-room/create-public-room-dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Spinner } from "../ui/spinner";

interface NewChatPopoverProps {
  users?: User[];
}

export const NewChatPopover = memo(
  ({ users: externalUsers }: NewChatPopoverProps) => {
    const router = useRouter();
    const { user } = useAuth();
    const [isCreatingChat, setIsCreatingChat] = useState(false);

    // 使用外部传入的 users（从 Server Component 传递）
    const users = externalUsers || [];
    const [isOpen, setIsOpen] = useState(false);
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

    const {
      avatar: groupAvatar,
      cropDialogOpen,
      setCropDialogOpen,
      tempImageSrc,
      isUploading,
      handleAvatarChange,
      handleCropComplete: onCropComplete,
      uploadToCloudinary,
      resetAvatar,
    } = useImageUpload();

    // 不再需要 fetchAllUsers，users 从 props 传入

    const toggleUserSelection = (id: string) => {
      setSelectedUsers((prev) =>
        prev.includes(id)
          ? prev.filter((userId) => userId !== id)
          : [...prev, id],
      );
    };

    const handleBack = () => {
      resetState();
    };

    const resetState = () => {
      setIsGroupMode(false);
      setGroupName("");
      resetAvatar();
      setSelectedUsers([]);
    };

    const handleOpenChange = (open: boolean) => {
      // 如果裁剪对话框打开中，不关闭Popover
      if (!open && cropDialogOpen) {
        return;
      }
      setIsOpen(open);
      if (!open) {
        resetState();
      }
    };

    const handleCropComplete = (croppedImage: string | Blob) => {
      onCropComplete(croppedImage);
      setIsOpen(true);
    };

    const handleCreateGroup = async () => {
      if (!groupName.trim() || selectedUsers?.length === 0) return;

      setIsCreatingChat(true);
      try {
        // 如果有头像且是 base64 格式，先上传到 Cloudinary
        let avatarUrl = groupAvatar;
        if (groupAvatar?.startsWith("data:")) {
          try {
            avatarUrl = await uploadToCloudinary(groupAvatar);
          } catch (uploadError) {
            console.error("Failed to upload avatar:", uploadError);
            // 上传失败时继续使用 base64
          }
        }

        const result = await createChatAction({
          isGroup: true,
          participants: selectedUsers,
          name: groupName,
          avatar: avatarUrl || undefined,
        });

        if (result.success && result.data) {
          const chat = result.data as any;
          setIsOpen(false);
          resetState();
          router.push(`/chat/${chat.id}`);
          router.refresh(); // 刷新 Server Component 数据
        } else {
          toast.error(result.error?.message || "Failed to create group");
        }
      } finally {
        setIsCreatingChat(false);
      }
    };

    const handleCreateChat = async (userId: string) => {
      setLoadingUserId(userId);
      try {
        const result = await createChatAction({
          isGroup: false,
          participantId: userId,
        });

        if (result.success && result.data) {
          const chat = result.data as any;
          setIsOpen(false);
          resetState();
          router.push(`/chat/${chat.id}`);
          router.refresh(); // 刷新 Server Component 数据
        } else {
          toast.error(result.error?.message || "Failed to create chat");
        }
      } finally {
        setLoadingUserId(null);
      }
    };

    // 移除 isMounted 检查以避免 hydration 不匹配

    return (
      <>
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <PenBox className="!h-5 !w-5 !stroke-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 z-[999] p-0 rounded-xl min-h-[400px] max-h-[80vh] flex flex-col"
          >
            <div className="border-b p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {isGroupMode && (
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft size={16} />
                  </Button>
                )}
                <h3 className="text-lg font-semibold">
                  {isGroupMode ? "New Group" : "New Chat"}
                </h3>
              </div>

              {isGroupMode && (
                <div className="flex items-center gap-3">
                  <label htmlFor="group-avatar" className="cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden hover:bg-primary/20 transition-colors">
                      {groupAvatar ? (
                        <img
                          src={groupAvatar}
                          alt="Group avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-primary" />
                      )}
                    </div>
                  </label>
                  <input
                    id="group-avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Click to upload group avatar
                    </p>
                  </div>
                </div>
              )}

              <InputGroup>
                {isGroupMode ? (
                  <InputGroupInput
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name"
                  />
                ) : (
                  <InputGroupInput
                    placeholder="Search name"
                    value=""
                    readOnly
                  />
                )}
                <InputGroupAddon>
                  {isGroupMode ? <Users /> : <Search />}
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex-1 justify-center overflow-y-auto px-1 py-1 space-y-1">
              {users && users?.length === 0 ? (
                <div className="text-center text-muted-foreground p-4">
                  No users found
                </div>
              ) : !isGroupMode ? (
                <>
                  <div key="new-group-item">
                    <NewGroupItem
                      disabled={isCreatingChat}
                      onClick={() => setIsGroupMode(true)}
                    />
                  </div>
                  <div key="public-room-item">
                    {user?.isAdmin && (
                      <CreatePublicRoomDialog
                        trigger={
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left"
                          >
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Users className="size-4 text-primary" />
                            </div>
                            <span>New Public Room</span>
                          </button>
                        }
                      />
                    )}
                  </div>
                  {users?.map((user) => (
                    <ChatUserItem
                      key={user.id}
                      user={user}
                      isLoading={loadingUserId === user.id}
                      disabled={loadingUserId !== null}
                      onClick={handleCreateChat}
                    />
                  ))}
                </>
              ) : (
                users?.map((user) => (
                  <GroupUserItem
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onToggle={toggleUserSelection}
                  />
                ))
              )}
            </div>

            {isGroupMode && (
              <div className="border-t p-3">
                <Button
                  onClick={handleCreateGroup}
                  className="w-full"
                  disabled={
                    isCreatingChat ||
                    isUploading ||
                    !groupName.trim() ||
                    selectedUsers.length === 0
                  }
                >
                  {(isCreatingChat || isUploading) && (
                    <Spinner className="w-4 h-4 mr-2" />
                  )}
                  {isUploading ? "Uploading..." : "Create Group"}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={(open) => {
            setCropDialogOpen(open);
            // 裁剪对话框关闭后，恢复Popover打开状态
            if (!open) {
              setIsOpen(true);
            }
          }}
          imageSrc={tempImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      </>
    );
  },
);

NewChatPopover.displayName = "NewChatPopover";

const UserAvatar = memo(({ user }: { user: User }) => (
  <>
    <AvatarWithBadge
      name={user.name || user.email}
      src={user.avatar ?? undefined}
    />
    <div className="flex-1 min-w-0">
      <h5 className="text-[13.5px] font-medium truncate">
        {user.name || user.email}
      </h5>
      <p className="text-xs text-muted-foreground truncate">
        {user.bio || "Hey there! I'm using chat"}
      </p>
    </div>
  </>
));

UserAvatar.displayName = "UserAvatar";

const NewGroupItem = memo(
  ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
    >
      <div className="bg-primary/10 p-2 rounded-full">
        <Users className="size-4 text-primary" />
      </div>
      <span>New Group</span>
    </button>
  ),
);

NewGroupItem.displayName = "NewGroupItem";

const ChatUserItem = memo(
  ({
    user,
    isLoading,
    disabled,
    onClick,
  }: {
    user: User;
    disabled: boolean;
    isLoading: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      type="button"
      className="relative w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
      disabled={isLoading || disabled}
      onClick={() => onClick(user.id)}
    >
      <UserAvatar user={user} />
      {isLoading && <Spinner className="absolute right-2 w-4 h-4 ml-auto" />}
    </button>
  ),
);

ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(
  ({
    user,
    isSelected,
    onToggle,
  }: {
    user: User;
    isSelected: boolean;
    onToggle: (id: string) => void;
  }) => (
    <div
      role="button"
      tabIndex={0}
      className="w-full flex items-center gap-2 p-2 rounded-sm hover:bg-accent transition-colors text-left cursor-pointer"
      onClick={() => onToggle(user.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(user.id);
        }
      }}
    >
      <UserAvatar user={user} />
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(user.id)}
      />
    </div>
  ),
);

GroupUserItem.displayName = "GroupUserItem";
