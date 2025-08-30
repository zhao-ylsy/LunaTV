# LunaTV Cloudflare Pages 部署指南

## 前置准备

1. 确保你有 Cloudflare 账户
2. 将项目推送到 GitHub 仓库
3. 准备好管理员用户名和密码

## 部署步骤

### 1. 创建 Cloudflare Pages 项目

1. 登录 Cloudflare Dashboard
2. 进入 **Workers 和 Pages** → **创建应用程序** → **Pages**
3. 选择 **连接到 Git**，选择你的 GitHub 仓库
4. 配置构建设置：
   - **构建命令**: `pnpm install --frozen-lockfile && pnpm run pages:build`
   - **构建输出目录**: `.vercel/output/static`
   - **Root 目录**: `/` (保持默认)

### 2. 设置环境变量

在 Pages 项目设置中添加以下环境变量：

#### 基础配置
- `CF_PAGES`: `true`
- `PASSWORD`: `你的管理员密码`
- `USERNAME`: `你的管理员用户名`
- `NEXT_PUBLIC_STORAGE_TYPE`: `d1`

#### 可选配置
- `SITE_NAME`: `LunaTV` (或你想要的站点名称)
- `ANNOUNCEMENT`: `自定义公告内容`
- `NEXT_PUBLIC_ENABLE_REGISTER`: `false` (建议关闭公开注册)

### 3. 创建 D1 数据库

1. 在 Cloudflare Dashboard 中，进入 **Workers 和 Pages** → **D1 SQL 数据库**
2. 点击 **创建数据库**，输入数据库名称 (如: `lunatv-db`)
3. 创建完成后，点击数据库名称进入详情页
4. 在 **控制台** 标签页中，复制 `D1初始化.sql` 文件的内容并执行

### 4. 绑定 D1 数据库

1. 回到你的 Pages 项目设置
2. 进入 **函数** → **D1 数据库绑定**
3. 添加绑定：
   - **变量名**: `DB`
   - **D1 数据库**: 选择刚创建的数据库

### 5. 设置兼容性标志

1. 在 Pages 项目设置中，进入 **函数** → **兼容性标志**
2. 添加标志: `nodejs_compat`

### 6. 部署和测试

1. 触发重新部署（可以通过推送代码或手动重新部署）
2. 部署完成后访问分配的域名
3. 使用设置的用户名和密码登录

## 故障排除

### 构建失败
- 检查 Node.js 版本是否兼容
- 确保所有依赖都在 package.json 中正确声明
- 查看构建日志中的具体错误信息

### 数据库连接问题
- 确认 D1 数据库已正确绑定
- 检查数据库初始化 SQL 是否执行成功
- 验证环境变量 `NEXT_PUBLIC_STORAGE_TYPE` 设置为 `d1`

### 功能异常
- 检查所有必需的环境变量是否设置
- 确认兼容性标志 `nodejs_compat` 已添加
- 查看 Functions 日志了解运行时错误

## 自定义域名

1. 在 Pages 项目中进入 **自定义域**
2. 添加你的域名
3. 按照提示配置 DNS 记录

## 安全建议

1. 设置强密码
2. 关闭公开注册 (`NEXT_PUBLIC_ENABLE_REGISTER=false`)
3. 定期备份 D1 数据库
4. 监控访问日志

## 更新项目

每次推送到主分支都会自动触发重新部署。如需手动部署：
1. 进入 Pages 项目
2. 点击 **部署** 标签
3. 选择 **创建新部署**

## 项目修改总结

为了支持 Cloudflare Pages 部署，我已经为你的项目做了以下修改：

### 1. 配置文件修改
- **next.config.js**: 添加了 CF_PAGES 环境变量支持，在 Cloudflare Pages 环境下使用 `export` 模式
- **package.json**: 添加了 `pages:build` 脚本用于 Cloudflare Pages 构建
- **wrangler.toml**: 创建了 Cloudflare Workers 配置文件
- **_headers**: 添加了安全头和缓存控制
- **_redirects**: 配置了 Next.js 路由重定向规则

### 2. D1 数据库支持
- **src/lib/d1.db.ts**: 创建了完整的 D1Storage 类，实现了所有必需的数据库操作
- **src/lib/db.ts**: 更新了存储类型支持，添加了 'd1' 选项
- **src/types/d1.d.ts**: 添加了 D1 数据库的 TypeScript 类型定义
- **D1初始化.sql**: 创建了数据库初始化脚本

### 3. 部署文档
- **CLOUDFLARE_DEPLOY.md**: 详细的部署指南和故障排除说明

## 下一步操作

1. 将这些更改提交到你的 GitHub 仓库
2. 按照 `CLOUDFLARE_DEPLOY.md` 中的步骤进行部署
3. 测试所有功能是否正常工作

## 注意事项

- D1 数据库版本暂时不支持搜索历史、管理员配置和跳过配置功能
- 如需这些功能，可以考虑使用 Upstash Redis 替代方案
- 确保在生产环境中设置强密码并关闭公开注册
