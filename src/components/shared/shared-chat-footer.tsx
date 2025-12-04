"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Paperclip, Send, X } from "lucide-react";
import { memo, useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { API } from "@/lib/api-client";
import type { MessageWithSender } from "@/types";
import ChatReplyBar from "../chat/chat-reply-bar";
import { Button } from "../ui/button";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";

interface SharedChatFooterProps {
  chatId: string | null;
  currentUserId: string | null;
  replyTo: MessageWithSender | null;
  onCancelReply: () => void;
  isSendingMsg: boolean;
  sendMessage: (payload: {
    chatId: string;
    content?: string;
    image?: string;
    replyTo?: MessageWithSender | null;
  }) => void | Promise<void>;
  showReplyBar?: boolean;
}

const messageSchema = z.object({
  message: z.string().optional(),
});

const SharedChatFooter = memo(
  ({
    chatId,
    currentUserId,
    replyTo,
    onCancelReply,
    isSendingMsg,
    sendMessage,
    showReplyBar = true,
  }: SharedChatFooterProps) => {
    const [image, setImage] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
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

        try {
          const { validateImageFile } = await import(
            "@/lib/utils/image-upload"
          );
          const { compressImage } = await import(
            "@/lib/utils/image-compression"
          );

          const validation = validateImageFile(file);
          if (!validation.valid) {
            toast.error(validation.error || "Invalid file");
            return;
          }

          toast.loading("Compressing image...", { id: "image-process" });

          const compressed = await compressImage(file, 2, 1920, 0.8);
          setImage(compressed);

          toast.success("Image ready", { id: "image-process" });
        } catch (error) {
          console.error("Image compression error:", error);
          toast.error("Failed to process image", { id: "image-process" });
        }
      },
      [],
    );

    const handleRemoveImage = useCallback(() => {
      setImage(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }, []);

    const onSubmit = useCallback(
      async (values: { message?: string }) => {
        if (isSendingMsg || isUploadingImage) return;
        if (!chatId) {
          toast.error("Chat ID is not available");
          return;
        }
        if (!values.message?.trim() && !image) {
          toast.error("Please enter a message or select an image");
          return;
        }

        let imageUrl = image;
        if (image?.startsWith("data:")) {
          setIsUploadingImage(true);
          try {
            const { data } = await API.post("/upload", { file: image });
            imageUrl = data.url;
          } catch (error) {
            console.error("Failed to send message:", error);
            toast.error(
              "Failed to upload image. Please check your connection and try again.",
            );
            setIsUploadingImage(false);
            return;
          } finally {
            setIsUploadingImage(false);
          }
        }

        sendMessage({
          chatId,
          content: values.message,
          image: imageUrl || undefined,
          replyTo,
        });

        onCancelReply();
        handleRemoveImage();
        form.reset();
      },
      [
        isSendingMsg,
        isUploadingImage,
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
      <>
        <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-border py-3 md:py-4 safe-area-bottom">
          {image && !isSendingMsg && (
            <div className="max-w-6xl mx-auto px-3 md:px-8.5 mb-2">
              <div className="relative w-fit">
                <img
                  src={image}
                  className="object-contain h-16 bg-muted min-w-16"
                  alt="Preview"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-px right-1 bg-black/50 text-white rounded-full cursor-pointer h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="max-w-6xl px-3 md:px-8.5 mx-auto flex items-end gap-1.5 md:gap-2"
            >
              <div className="flex items-center gap-1 md:gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isSendingMsg || isUploadingImage}
                  className="rounded-full h-9 w-9 md:h-10 md:w-10"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={isSendingMsg || isUploadingImage}
                  ref={imageInputRef}
                  onChange={handleImageChange}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                disabled={isSendingMsg || isUploadingImage}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder="Type new message"
                      className="min-h-[36px] md:min-h-[40px] bg-background text-sm md:text-base"
                    />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="icon"
                className="rounded-lg h-9 w-9 md:h-10 md:w-10"
                disabled={isSendingMsg || isUploadingImage}
              >
                {isUploadingImage ? (
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </form>
          </Form>
        </div>

        {showReplyBar && replyTo && !isSendingMsg && (
          <ChatReplyBar
            replyTo={replyTo}
            currentUserId={currentUserId}
            onCancel={onCancelReply}
          />
        )}
      </>
    );
  },
);

SharedChatFooter.displayName = "SharedChatFooter";

export default SharedChatFooter;
