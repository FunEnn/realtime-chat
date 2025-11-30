"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, Send, X } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { usePublicRoom } from "@/hooks/use-public-room";
import type { MessageType } from "@/types/chat.type";
import { Button } from "../ui/button";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import ChatReplyBar from "./chat-reply-bar";

interface PublicRoomChatFooterProps {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageType | null;
  onCancelReply: () => void;
}

const messageSchema = z.object({
  message: z.string().optional(),
});

const PublicRoomChatFooter = memo(
  ({
    chatId,
    currentUserId,
    replyTo,
    onCancelReply,
  }: PublicRoomChatFooterProps) => {
    const { sendMessage, isSendingMsg } = usePublicRoom();

    const [image, setImage] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    const form = useForm({
      resolver: zodResolver(messageSchema),
      defaultValues: {
        message: "",
      },
    });

    const handleImageChange = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          toast.error("Please select an image file");
          return;
        }

        try {
          toast.loading("Compressing image...", { id: "compress" });
          const { compressImage, getBase64Size } = await import(
            "@/lib/image-compression"
          );

          // Compress image to max 2MB, 1920px, quality 0.8
          const compressed = await compressImage(file, 2, 1920, 0.8);
          const sizeMB = getBase64Size(compressed);

          toast.success(`Image compressed to ${sizeMB.toFixed(2)}MB`, {
            id: "compress",
          });
          setImage(compressed);
        } catch (error) {
          console.error("Image compression failed:", error);
          toast.error("Failed to compress image", { id: "compress" });
        }
      },
      [],
    );

    const handleRemoveImage = useCallback(() => {
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }, []);

    const onSubmit = useCallback(
      (values: { message?: string }) => {
        if (isSendingMsg) return;
        if (!chatId) {
          toast.error("Chat ID is not available");
          return;
        }
        if (!values.message?.trim() && !image) {
          toast.error("Please enter a message or select an image");
          return;
        }

        const payload = {
          chatId: chatId,
          content: values.message,
          image: image || undefined,
          replyTo: replyTo,
        };

        sendMessage(payload);

        onCancelReply();
        handleRemoveImage();
        form.reset();
      },
      [
        isSendingMsg,
        image,
        chatId,
        replyTo,
        sendMessage,
        onCancelReply,
        handleRemoveImage,
        form,
      ],
    );

    return (
      <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border py-3 md:py-4 safe-area-bottom">
        {image && !isSendingMsg && (
          <div className="max-w-6xl mx-auto px-3 md:px-8.5">
            <div className="relative w-fit">
              <img
                src={image}
                alt="Preview"
                className="h-24 w-24 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {replyTo && (
          <ChatReplyBar
            replyTo={replyTo}
            currentUserId={currentUserId}
            onCancel={onCancelReply}
          />
        )}

        <div className="max-w-6xl mx-auto px-3 md:px-8.5">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex items-end gap-2"
            >
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={isSendingMsg}
                className="shrink-0"
              >
                <Paperclip className="w-5 h-5" />
              </Button>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input
                      {...field}
                      placeholder="Type a message..."
                      disabled={isSendingMsg}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                      className="resize-none"
                    />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="icon"
                disabled={isSendingMsg}
                className="shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  },
);

PublicRoomChatFooter.displayName = "PublicRoomChatFooter";

export default PublicRoomChatFooter;
