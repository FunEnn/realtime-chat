# 实时聊天应用

基于 Next.js 16 构建的现代化实时聊天应用，支持私聊、群聊和公共聊天室。

## 📸 功能展示

- 💬 **私聊** - 一对一实时消息通信
- 👥 **群聊** - 创建和管理群组对话
- 🌐 **公共聊天室** - 加入公共聊天室，支持成员管理
- 🖼️ **图片分享** - 支持图片上传和预览
- 📝 **消息回复** - 支持回复特定消息
- 🔔 **未读提醒** - 实时追踪未读消息数量

## 🛠️ 技术栈

- **前端**：Next.js 16 + TypeScript + Tailwind CSS + Shadcn UI + Zustand
- **后端**：PostgreSQL + Prisma ORM + Socket.IO + Docker
- **认证**：Clerk
- **存储**：Cloudinary
- **工具**：Biome + Husky

## 🚀 快速开始

### 环境要求
- Node.js 22+
- PostgreSQL（或使用 Docker）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/realtime_chat"

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat

# 应用地址
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### 3. 启动数据库（Docker）

```bash
docker-compose up -d
```

### 4. 构建数据库表

```bash
npx prisma migrate dev --name realtime-chat-db-init
npx prisma generate
```

### 5. 运行项目

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 🎯 核心功能

### 实时通信
- WebSocket 长连接，消息即时推送
- 在线状态实时更新
- 消息已读/未读状态追踪

### 权限管理
- **管理员**：创建/删除公共聊天室
- **群主**：管理群组设置和成员
- **成员**：发送消息、加入/离开聊天室

### 消息系统
- 文本和图片消息
- 消息回复和引用
- 历史记录查询
- 乐观 UI 更新（发送即显示）
