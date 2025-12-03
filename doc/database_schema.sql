-- ====================================
-- Realtime Chat 数据库初始化脚本
-- Database: PostgreSQL
-- Description: 实时聊天应用数据库结构
-- Created: 2025-12-01
-- ====================================

-- 删除已存在的表（如果需要重新初始化）
-- DROP TABLE IF EXISTS "room_messages" CASCADE;
-- DROP TABLE IF EXISTS "room_members" CASCADE;
-- DROP TABLE IF EXISTS "public_rooms" CASCADE;
-- DROP TABLE IF EXISTS "messages" CASCADE;
-- DROP TABLE IF EXISTS "chat_members" CASCADE;
-- DROP TABLE IF EXISTS "chats" CASCADE;
-- DROP TABLE IF EXISTS "users" CASCADE;

-- ====================================
-- 用户表
-- ====================================
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "users" IS '用户信息表';
COMMENT ON COLUMN "users"."clerkId" IS 'Clerk 认证系统用户 ID';
COMMENT ON COLUMN "users"."email" IS '用户邮箱';
COMMENT ON COLUMN "users"."name" IS '用户昵称';
COMMENT ON COLUMN "users"."avatar" IS '用户头像 URL';
COMMENT ON COLUMN "users"."bio" IS '用户简介';

-- ====================================
-- 聊天会话表（私聊和群聊）
-- ====================================
CREATE TABLE "chats" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "description" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "chats" IS '聊天会话表，支持私聊和群聊';
COMMENT ON COLUMN "chats"."name" IS '群聊名称（私聊为 null）';
COMMENT ON COLUMN "chats"."avatar" IS '群聊头像 URL';
COMMENT ON COLUMN "chats"."description" IS '群聊描述';
COMMENT ON COLUMN "chats"."isGroup" IS '是否为群聊';
COMMENT ON COLUMN "chats"."createdById" IS '创建者用户 ID';

-- ====================================
-- 聊天成员关系表
-- ====================================
CREATE TABLE "chat_members" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "chat_members" IS '聊天成员关系表';
COMMENT ON COLUMN "chat_members"."unreadCount" IS '未读消息数';
COMMENT ON COLUMN "chat_members"."lastReadAt" IS '最后阅读时间';
COMMENT ON COLUMN "chat_members"."joinedAt" IS '加入时间';

-- ====================================
-- 消息表
-- ====================================
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "image" TEXT,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "messages" IS '聊天消息表';
COMMENT ON COLUMN "messages"."content" IS '消息文本内容';
COMMENT ON COLUMN "messages"."image" IS '消息图片 URL';
COMMENT ON COLUMN "messages"."chatId" IS '所属聊天会话 ID';
COMMENT ON COLUMN "messages"."senderId" IS '发送者用户 ID';
COMMENT ON COLUMN "messages"."replyToId" IS '回复的消息 ID';

-- ====================================
-- 公共聊天室表
-- ====================================
CREATE TABLE "public_rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_rooms_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "public_rooms" IS '公共聊天室表';
COMMENT ON COLUMN "public_rooms"."name" IS '聊天室名称';
COMMENT ON COLUMN "public_rooms"."avatar" IS '聊天室头像 URL';
COMMENT ON COLUMN "public_rooms"."description" IS '聊天室描述';
COMMENT ON COLUMN "public_rooms"."createdById" IS '创建者用户 ID';

-- ====================================
-- 公共聊天室成员表
-- ====================================
CREATE TABLE "room_members" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_members_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "room_members" IS '公共聊天室成员关系表';
COMMENT ON COLUMN "room_members"."roomId" IS '聊天室 ID';
COMMENT ON COLUMN "room_members"."userId" IS '用户 ID';
COMMENT ON COLUMN "room_members"."joinedAt" IS '加入时间';

-- ====================================
-- 公共聊天室消息表
-- ====================================
CREATE TABLE "room_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "image" TEXT,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_messages_pkey" PRIMARY KEY ("id")
);

COMMENT ON TABLE "room_messages" IS '公共聊天室消息表';
COMMENT ON COLUMN "room_messages"."content" IS '消息文本内容';
COMMENT ON COLUMN "room_messages"."image" IS '消息图片 URL';
COMMENT ON COLUMN "room_messages"."roomId" IS '所属聊天室 ID';
COMMENT ON COLUMN "room_messages"."senderId" IS '发送者用户 ID';
COMMENT ON COLUMN "room_messages"."replyToId" IS '回复的消息 ID';

-- ====================================
-- 创建索引
-- ====================================

-- 用户表索引
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- 聊天成员表索引
CREATE UNIQUE INDEX "chat_members_chatId_userId_key" ON "chat_members"("chatId", "userId");

-- 消息表索引
CREATE INDEX "messages_chatId_idx" ON "messages"("chatId");
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- 聊天室成员表索引
CREATE UNIQUE INDEX "room_members_roomId_userId_key" ON "room_members"("roomId", "userId");

-- 聊天室消息表索引
CREATE INDEX "room_messages_roomId_idx" ON "room_messages"("roomId");
CREATE INDEX "room_messages_senderId_idx" ON "room_messages"("senderId");

-- ====================================
-- 创建外键约束
-- ====================================

-- 聊天会话外键
ALTER TABLE "chats" ADD CONSTRAINT "chats_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 聊天成员外键
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_chatId_fkey" 
    FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 消息外键
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" 
    FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" 
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" 
    FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 公共聊天室外键
ALTER TABLE "public_rooms" ADD CONSTRAINT "public_rooms_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 聊天室成员外键
ALTER TABLE "room_members" ADD CONSTRAINT "room_members_roomId_fkey" 
    FOREIGN KEY ("roomId") REFERENCES "public_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "room_members" ADD CONSTRAINT "room_members_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 聊天室消息外键
ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_roomId_fkey" 
    FOREIGN KEY ("roomId") REFERENCES "public_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "room_messages" ADD CONSTRAINT "room_messages_replyToId_fkey" 
    FOREIGN KEY ("replyToId") REFERENCES "room_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ====================================
-- 初始化完成
-- ====================================
