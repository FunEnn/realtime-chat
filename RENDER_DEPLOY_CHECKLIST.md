# ✅ Render 部署检查清单

## 🔍 当前问题诊断

### 问题 1: "Timed Out"
**原因:** 缺少健康检查端点  
**解决:** ✅ 已添加 `/health` 端点

### 问题 2: "No open ports detected"
**原因:** 服务器绑定到 `localhost` 而非 `0.0.0.0`  
**解决:** ✅ 已修改为生产环境使用 `0.0.0.0`

---

## 📊 修复内容

### 1. 端口绑定修复
```typescript
// 修改前
const hostname = process.env.HOSTNAME || "localhost";

// 修改后
const hostname = dev ? "localhost" : "0.0.0.0";
```

### 2. 健康检查端点
```typescript
if (req.url === "/health" || req.url === "/api/health") {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "ok", timestamp: ... }));
  return;
}
```

### 3. Render 配置文件
```yaml
# render.yaml
services:
  - type: web
    healthCheckPath: /health
```

---

## 🚀 部署步骤

### 1. 推送代码
```bash
git push origin main
```

### 2. 等待 Render 自动部署（约 2-3 分钟）

### 3. 观察部署日志

**期望看到的日志:**
```
==> Building...
✓ Build completed

==> Deploying...
> Server ready on http://0.0.0.0:10000 (production)
> Socket.IO ready on path: /api/socket/io
> Health check: /health
> Listening on 0.0.0.0:10000

==> Port 10000 detected ✅
==> Health check passed ✅
==> Deploy successful! 🎉
```

---

## 🔧 验证部署成功

### 检查 1: 访问主页
```
https://your-app.onrender.com
```
**预期:** 页面正常加载（或重定向到登录）

### 检查 2: 健康检查
```
https://your-app.onrender.com/health
```
**预期响应:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T..."
}
```

### 检查 3: 查看 Render 日志
Render Dashboard → Logs

**成功标志:**
- ✅ 无 "No open ports" 错误
- ✅ 无 "Timed Out" 错误
- ✅ 看到 "Listening on 0.0.0.0:10000"
- ✅ 服务状态显示为 "Live"

---

## 🎯 Render 环境变量检查

确保在 Render Dashboard → Environment 中配置了：

```env
# 必需变量
NODE_ENV=production
PORT=10000  # Render 自动设置，无需手动配置

# 数据库
DATABASE_URL=postgresql://your-neon-url

# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_or_live_xxx
CLERK_SECRET_KEY=sk_test_or_live_xxx

# 应用 URL
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-app.onrender.com

# Cloudinary（可选）
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

---

## 🐛 常见问题排查

### 问题: 仍然显示 "No open ports"

**检查:**
1. 确认代码已推送
2. 确认 Render 已重新部署
3. 查看日志中的 `Listening on` 信息

**解决:**
```bash
# 确认本地修改
git log --oneline -1

# 确认远程版本
git log origin/main --oneline -1

# 如果不一致，推送
git push origin main
```

### 问题: 健康检查失败

**检查:**
1. 访问 `/health` 是否返回 200
2. 日志中是否有启动错误

**调试:**
```bash
# 本地测试
npm run build
npm start

# 访问
curl http://localhost:3000/health
```

### 问题: 构建超时

**原因:** Next.js 构建时间过长

**解决:**
1. 在 Render 升级到付费计划（更多构建时间）
2. 或优化构建配置

---

## 📋 部署前最后检查

- [ ] `server.ts` 中 hostname 配置正确
- [ ] `/health` 端点已添加
- [ ] `render.yaml` 文件已创建
- [ ] 所有环境变量已配置
- [ ] 代码已提交并推送
- [ ] Clerk 域名已配置（如果使用 Clerk）

---

## 🎉 部署成功标志

- ✅ Render 显示 "Live" 状态
- ✅ 可以访问主页
- ✅ `/health` 返回 200
- ✅ 日志无错误
- ✅ 用户可以登录（如果配置了 Clerk）
- ✅ WebSocket 连接正常

---

## 📞 需要帮助？

如果遇到问题：

1. **查看 Render 日志**
   - 复制完整的错误日志
   - 查找关键错误信息

2. **检查环境变量**
   - 确认所有必需变量存在
   - 确认变量值正确

3. **测试本地部署**
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production npm start
   ```

4. **联系支持**
   - [Render 文档](https://render.com/docs)
   - [Render 社区](https://community.render.com)

---

**最后更新:** 2025-12-04  
**版本:** 1.0
