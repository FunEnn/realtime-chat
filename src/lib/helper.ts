"use client";

import { format, isThisWeek, isToday, isYesterday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "@/src/hooks/use-socket";
import type { ChatType } from "@/src/types/chat.type";

export interface ChatDisplayInfo {
  name: string;
  subheading: string;
  avatar: string;
  isGroup: boolean;
  isOnline?: boolean;
  isAI?: boolean;
}

/**
 * Check if a user is currently online
 */
export const isUserOnline = (userId?: string): boolean => {
  if (!userId) return false;
  const { onlineUsers } = useSocket.getState();
  return onlineUsers.includes(userId);
};

/**
 * Get chat display information (name, avatar, online status)
 * Handles both group chats and individual chats
 */
export const getOtherUserAndGroup = (
  chat: ChatType,
  currentUserId: string | null,
): ChatDisplayInfo => {
  const isGroup = chat?.isGroup;

  if (isGroup) {
    return {
      name: chat.groupName || "Unnamed Group",
      subheading: `${chat.participants.length} members`,
      avatar: "",
      isGroup: true,
    };
  }

  const other = chat?.participants.find((p) => p._id !== currentUserId);
  const isOnline = isUserOnline(other?._id);

  return {
    name: other?.name || "Unknown",
    subheading: isOnline ? "Online" : "Offline",
    avatar: other?.avatar || "",
    isGroup: false,
    isOnline,
    isAI: other?.isAI || false,
  };
};

/**
 * Format chat time for chat list display
 * Examples: "14:30", "Yesterday", "Monday", "11/27"
 */
export const formatChatTime = (date: string | Date): string => {
  if (!date) return "";

  try {
    const newDate = new Date(date);
    if (Number.isNaN(newDate.getTime())) return "";

    if (isToday(newDate)) return format(newDate, "HH:mm");
    if (isYesterday(newDate)) return "Yesterday";
    if (isThisWeek(newDate)) return format(newDate, "EEEE");
    return format(newDate, "M/d/yy");
  } catch (error) {
    console.error("Error formatting chat time:", error);
    return "";
  }
};

/**
 * Format message time for message display
 * Example: "14:30"
 */
export const formatMessageTime = (date: string | Date): string => {
  if (!date) return "";

  try {
    const newDate = new Date(date);
    if (Number.isNaN(newDate.getTime())) return "";

    return format(newDate, "HH:mm");
  } catch (error) {
    console.error("Error formatting message time:", error);
    return "";
  }
};

/**
 * Format full date with time
 * Example: "Nov 27, 2025 at 14:30"
 */
export const formatFullDate = (date: string | Date): string => {
  if (!date) return "";

  try {
    const newDate = new Date(date);
    if (Number.isNaN(newDate.getTime())) return "";

    return format(newDate, "MMM d, yyyy 'at' HH:mm");
  } catch (error) {
    console.error("Error formatting full date:", error);
    return "";
  }
};

/**
 * Generate a unique UUID
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Get user initials from name
 * Examples: "John Doe" -> "JD", "Alice" -> "A"
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Format file size in human readable format
 * Examples: 1024 -> "1 KB", 1048576 -> "1 MB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round(bytes / k ** i)} ${sizes[i]}`;
};

/**
 * Check if a string is a valid URL
 */
export const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get relative time string
 * Examples: "just now", "2 minutes ago", "1 hour ago"
 */
export const getRelativeTime = (date: string | Date): string => {
  if (!date) return "";

  try {
    const newDate = new Date(date);
    if (Number.isNaN(newDate.getTime())) return "";

    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - newDate.getTime()) / 1000,
    );

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return formatChatTime(newDate);
  } catch (error) {
    console.error("Error getting relative time:", error);
    return "";
  }
};
