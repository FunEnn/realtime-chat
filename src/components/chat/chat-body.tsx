"use client";

import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { ChevronUp } from "lucide-react";
import {
  memo,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { MessageWithSender } from "@/types";
import ChatBodyMessage from "./chat-body-message";

interface ChatBodyProps {
  messages: MessageWithSender[];
  onReply: (message: MessageWithSender) => void;
  currentUserId?: string;
  showLoadMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
  shouldAutoScroll?: boolean;
  scrollElementRef?: RefObject<HTMLDivElement | null>;
}

const ChatBody = memo(
  ({
    messages,
    onReply,
    currentUserId,
    showLoadMore,
    isLoadingMore,
    onLoadMore,
    shouldAutoScroll = true,
    scrollElementRef,
  }: ChatBodyProps) => {
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const isFirstRender = useRef(true);
    const didInitialScrollToBottom = useRef(false);
    const [isScrollReady, setIsScrollReady] = useState(
      () => !scrollElementRef || !!scrollElementRef.current,
    );

    const safeMessages = useMemo(
      () =>
        messages.filter((message) => {
          if (!message || typeof message !== "object" || !message.id) {
            console.error("Invalid message object:", message);
            return false;
          }
          return true;
        }),
      [messages],
    );

    const hasLoadMoreRow = !!showLoadMore;
    const rowCount = safeMessages.length + (hasLoadMoreRow ? 1 : 0);

    useEffect(() => {
      if (!scrollElementRef) {
        if (!isScrollReady) setIsScrollReady(true);
        return;
      }
      if (scrollElementRef.current) {
        if (!isScrollReady) setIsScrollReady(true);
        return;
      }

      let raf = 0;
      const tick = () => {
        if (scrollElementRef.current) {
          setIsScrollReady(true);
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      return () => {
        if (raf) cancelAnimationFrame(raf);
      };
    }, [isScrollReady, scrollElementRef]);

    const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
      count: rowCount,
      getScrollElement: () => scrollElementRef?.current ?? null,
      estimateSize: () => 96,
      overscan: 10,
    });

    useEffect(() => {
      if (didInitialScrollToBottom.current) return;
      if (!safeMessages.length) return;
      if (!isScrollReady) return;

      if (typeof window === "undefined") return;

      requestAnimationFrame(() => {
        const el = scrollElementRef?.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        } else {
          bottomRef.current?.scrollIntoView({ behavior: "instant" });
        }
        didInitialScrollToBottom.current = true;
      });
    }, [isScrollReady, safeMessages.length, scrollElementRef]);

    useEffect(() => {
      if (!safeMessages.length) return;

      if (isFirstRender.current || shouldAutoScroll) {
        bottomRef.current?.scrollIntoView({
          behavior: isFirstRender.current ? "instant" : "smooth",
        });
      }

      if (isFirstRender.current) {
        isFirstRender.current = false;
      }
    }, [safeMessages.length, shouldAutoScroll]);

    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col px-4 md:px-6 py-3">
        {isScrollReady ? (
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
              const isLoadMoreRow = hasLoadMoreRow && virtualRow.index === 0;
              const messageIndex = hasLoadMoreRow
                ? virtualRow.index - 1
                : virtualRow.index;

              const message =
                !isLoadMoreRow && messageIndex >= 0
                  ? safeMessages[messageIndex]
                  : null;

              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {isLoadMoreRow ? (
                    <div className="sticky top-0 z-10 pb-3">
                      <div className="mx-auto w-fit rounded-full border bg-background/80 px-1 py-1 shadow-sm backdrop-blur transition-shadow hover:shadow-md supports-backdrop-filter:bg-background/60">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => onLoadMore?.()}
                          disabled={!!isLoadingMore}
                        >
                          {isLoadingMore ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronUp className="mr-2 h-4 w-4" />
                              Load earlier messages
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : message ? (
                    <ChatBodyMessage
                      key={message.id}
                      message={message}
                      onReply={onReply}
                      currentUserId={currentUserId}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {showLoadMore && (
              <div className="sticky top-0 z-10 pb-3">
                <div className="mx-auto w-fit rounded-full border bg-background/80 px-1 py-1 shadow-sm backdrop-blur transition-shadow hover:shadow-md supports-backdrop-filter:bg-background/60">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => onLoadMore?.()}
                    disabled={!!isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Load earlier messages
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            {safeMessages.map((message) => (
              <ChatBodyMessage
                key={message.id}
                message={message}
                onReply={onReply}
                currentUserId={currentUserId}
              />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>
    );
  },
);

ChatBody.displayName = "ChatBody";

export default ChatBody;
