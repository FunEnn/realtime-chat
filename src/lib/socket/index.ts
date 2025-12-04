/**
 * Socket.IO 工具函数导出
 *
 * 这个文件提供了在 Next.js API Routes 中使用 Socket.IO 的工具函数
 */

export {
  emitChatDeletedToParticipants,
  emitChatInfoUpdatedToParticipants,
  emitLastMessageToParticipants,
  emitNewChatToParticipants,
  emitNewMessageToChatRoom,
  emitNewPublicRoom,
  emitPublicRoomDeleted,
  emitPublicRoomUpdate,
  emitSystemMessage,
  getIO,
  getOnlineUsers,
  initializeSocket,
  isUserOnline,
} from "./socket-server";
