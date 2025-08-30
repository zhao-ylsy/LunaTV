# LunaTV 部署指南

## ⚠️ 重要说明

由于 LunaTV 项目包含大量 API 路由和服务端功能，**不适合直接部署到 Cloudflare Pages**（静态托管）。

推荐以下部署方案：

## 🚀 推荐方案

### 方案 1: Vercel 部署（推荐）

Vercel 对 Next.js 有完美支持，包括 API 路由和服务端功能。

1. **Fork 项目**到你的 GitHub
2. **登录 Vercel**，导入 GitHub 仓库
3. **设置环境变量**：
   - `USERNAME`: 管理员用户名
   - `PASSWORD`: 管理员密码
   - `NEXT_PUBLIC_STORAGE_TYPE`: `upstash`
   - `UPSTASH_URL`: Upstash Redis URL
   - `UPSTASH_TOKEN`: Upstash Redis Token
4. **部署**即可

### 方案 2: Docker 部署

使用 Docker 在 VPS 或云服务器上部署：

```bash
# 克隆项目
git clone https://github.com/your-username/LunaTV.git
cd LunaTV

# 构建并运行
docker build -t lunatv .
docker run -d -p 3000:3000 \
  -e USERNAME=admin \
  -e PASSWORD=your_password \
  -e NEXT_PUBLIC_STORAGE_TYPE=redis \
  -e REDIS_URL=redis://your-redis:6379 \
  lunatv
```

## 🔧 Cloudflare Pages 替代方案

如果你坚持使用 Cloudflare，可以考虑：

### 方案 3: Cloudflare Workers + D1（高级）

需要重构项目以适应 Cloudflare Workers 环境，这需要：
1. 将 API 路由改写为 Workers 函数
2. 使用 Cloudflare D1 数据库
3. 前端使用静态部署

这需要大量的代码修改，不在当前指南范围内。

## 📋 如果仍要尝试 Cloudflare Pages

虽然不推荐，但如果你想尝试，可以：

### 1. 创建 Cloudflare Pages 项目

1. 登录 Cloudflare Dashboard
2. 进入 **Workers 和 Pages** → **创建应用程序** → **Pages**
3. 选择 **连接到 Git**，选择你的 GitHub 仓库
4. 配置构建设置：
   - **构建命令**: `pnpm install --frozen-lockfile && pnpm run build`
   - **构建输出目录**: `out`
   - **Root 目录**: `/` (保持默认)

**注意**: 这种方式会失去所有 API 功能，项目将无法正常工作。

## 💡 总结

**LunaTV 是一个功能丰富的 Next.js 应用**，包含：
- 多个 API 路由
- 服务端渲染
- 数据库操作
- 用户认证
- 实时功能

这些功能使其**更适合部署到支持服务端功能的平台**，如：
- ✅ **Vercel**（最佳选择）
- ✅ **Netlify Functions**
- ✅ **Docker + VPS**
- ✅ **Railway**
- ✅ **Render**

而不是静态托管平台如 Cloudflare Pages。

## 🔄 如果你想继续使用 Cloudflare

建议考虑：
1. **Cloudflare Workers** + **D1** + **静态前端**（需要重构）
2. **Vercel** + **Cloudflare** 作为 CDN
3. **Docker** 部署到支持 Cloudflare 的 VPS

## 📞 需要帮助？

如果你需要帮助选择合适的部署方案或进行项目重构，请告诉我你的具体需求和偏好！
