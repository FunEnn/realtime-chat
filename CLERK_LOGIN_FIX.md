# 🔧 修复 Clerk 登录后无法写入数据的问题

## 问题描述
- ✅ 可以从 Neon 数据库读取数据
- ❌ Clerk 登录后无法写入用户数据到数据库

## 根本原因
API 客户端使用了未定义的 `NEXT_PUBLIC_API_URL` 环境变量，导致客户端请求路径错误。

## 已修复内容

### 修改文件：`src/lib/api-client.ts`

**修改前：**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api` || "/api",
  // ...
});
```

**修改后：**
```typescript
const API = axios.create({
  baseURL: "/api",  // 使用相对路径
  // ...
});
```

## 部署步骤

1. **提交代码**
   ```bash
   git add .
   git commit -m "fix: 修复 Clerk 用户同步问题"
   git push origin main
   ```

2. **等待 Render 自动部署**（约 2-3 分钟）

3. **清除浏览器缓存并重新测试登录**

## 验证修复

### 1. 检查浏览器控制台（F12 → Console）
- ✅ 无错误信息
- ✅ 用户信息正常显示

### 2. 检查 Network 请求（F12 → Network）
找到 `clerk-sync` 请求：
- ✅ 状态码：200 OK
- ✅ 响应包含用户对象

### 3. 检查 Render 日志
```
POST /api/auth/clerk-sync 200
User synced successfully
```

### 4. 检查 Neon 数据库
- ✅ User 表中有新记录
- ✅ clerkId 字段已填充

## 常见问题排查

### 问题 1：仍然无法写入数据

**检查清单：**
1. 确认代码已推送到 GitHub
2. 确认 Render 已完成部署
3. 清除浏览器缓存（Ctrl + Shift + Delete）
4. 尝试无痕模式

### 问题 2：数据库连接错误

**检查 Render 环境变量：**
- `DATABASE_URL` 是否正确
- Neon 数据库是否激活

**测试连接：**
```bash
# 在 Render Shell 中运行
npx prisma db push
```

### 问题 3：Clerk 认证失败

**检查 Clerk Dashboard：**
1. 域名配置是否包含 Render URL
2. 回调 URL 是否正确设置
3. API 密钥是否有效

## 技术细节

### 为什么使用相对路径？

1. **避免 CORS 问题**：相对路径的请求不会触发跨域检查
2. **简化配置**：不需要为每个环境单独配置 API URL
3. **一致性**：开发和生产环境使用相同的配置

### 用户同步流程

```
1. 用户登录 Clerk
   ↓
2. useAuth Hook 检测到登录
   ↓
3. 调用 API.post("/api/auth/clerk-sync")
   ↓
4. 后端 upsertUserFromClerk
   ↓
5. 写入/更新 Neon 数据库
   ↓
6. 返回用户对象到前端
```

## 需要的环境变量（Render）

```env
# 应用 URL
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com

# 数据库
DATABASE_URL=<your-neon-database-url>

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-publishable-key>
CLERK_SECRET_KEY=<your-secret-key>
```

**注意：** 不再需要 `NEXT_PUBLIC_API_URL` 变量

## 成功标志

- ✅ 登录成功无错误
- ✅ 浏览器控制台无红色错误
- ✅ Network 中 clerk-sync 返回 200
- ✅ Render 日志显示用户同步成功
- ✅ Neon 数据库中有用户记录

---

**修复日期：** 2025-12-04  
**修复版本：** v1.0
