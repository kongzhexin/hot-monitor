# Vercel 部署指南

## 快速开始

### 前置条件
- Vercel 账户
- GitHub 仓库（已连接）
- 所需的环境变量

### 部署步骤

#### 1. 连接到 Vercel
```bash
# 使用 Vercel CLI
npm i -g vercel
vercel
```

或直接在 [Vercel Dashboard](https://vercel.com/dashboard) 导入 GitHub 仓库。

#### 2. 配置环境变量

在 Vercel Dashboard 中，进入项目设置 → 环境变量，添加以下变量：

| 变量名 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串（Neon/外部数据库） | `postgresql://neondb_owner:<PASSWORD>@ep-icy-queen-atud3nc1.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 | `sk-or-...` |
| `RSS_SOURCES` | RSS 源列表（JSON） | `[{"url":"https://...",...}]` |
| `SCAN_INTERVAL_SECONDS` | 扫描间隔（秒） | `3600` |
| `PORT` | 监听端口 | `3000` |

#### 3. Vercel 命令配置

在 Vercel 项目设置中配置：

- Install Command: `npm install`
- Build Command: `npm run build`
- Development Command: `npm run dev`

如果你希望在部署时自动执行数据库迁移，可以将 Build Command 改为：

```bash
npm run build && npx prisma migrate deploy
```

但推荐的做法是：
1. 先部署应用
2. 确保 `DATABASE_URL` 正确
3. 再运行一次 `npx prisma migrate deploy`

#### 4. 数据库迁移

本项目已更新为 PostgreSQL 数据源，适合 Neon 等托管数据库。部署后，如果你愿意可以直接将迁移集成到构建流程：

```bash
npm run build && npx prisma migrate deploy
```

如果你更希望手动控制，则在首次部署后运行：

```bash
vercel env pull
npx prisma migrate deploy
```

此命令会把当前源码中的 migration 应用到远端数据库。

### 数据持久化

由于 Vercel 的无状态特性，SQLite 数据库需要特殊处理：

**推荐方案：**

1. **使用 Vercel KV 存储** (最简单)
   - 在 Vercel Dashboard 添加 KV 存储
   - 更新 `prisma/schema.prisma` 改用 PostgreSQL 或迁移逻辑到 KV

2. **使用外部数据库** (推荐生产环境)
   - PostgreSQL (Supabase, Neon 等)
   - MongoDB (MongoDB Atlas)
   
   修改 `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **使用 Vercel Blob 存储**
   - 适合小型数据
   - 适合备份场景

### 环境变量示例

创建 `.env.local`:
```
DATABASE_URL="postgresql://neondb_owner:<YOUR_PASSWORD>@ep-icy-queen-atud3nc1.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
OPENROUTER_API_KEY="sk-or-your-key-here"
RSS_SOURCES='[
  {"name":"HackerNews","url":"https://news.ycombinator.com/rss"},
  {"name":"ProductHunt","url":"https://www.producthunt.com/feed"}
]'
SCAN_INTERVAL_SECONDS=3600
PORT=3000
```

### 本地测试

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npm run prisma:generate

# 初始化数据库
npm run prisma:migrate

# 开发模式
npm run dev

# 生产模式测试
npm run build
npm start
```

### 故障排查

#### 1. 数据库连接失败
- 检查 `DATABASE_URL` 环境变量是否正确设置
- 确认数据库服务可访问
- 查看 Vercel 函数日志

#### 2. Prisma 迁移失败
```bash
vercel env pull
npx prisma migrate deploy --skip-generate
```

#### 3. 内存不足
- 减少 `SCAN_INTERVAL_SECONDS`
- 检查定时任务是否正确清理资源
- 使用 Vercel Pro 获得更多资源

#### 4. 静态资源 404
- 确保 `public/` 文件夹中的资源已正确配置
- 检查 `vercel.json` 中的路由规则

### 监控和日志

查看实时日志：
```bash
vercel logs
```

### 回滚部署

```bash
vercel rollback
```

### 自定义域名

1. 在 Vercel Dashboard 添加域名
2. 更新 DNS 记录指向 Vercel
3. 等待 DNS 生效（通常 24 小时）

### 成本优化

- 使用 Vercel 免费计划的限制：100GB 带宽/月，12 个并发函数
- 定时任务建议每小时不超过 3-4 次
- 使用 Vercel Analytics 监控性能

### 更多资源

- [Vercel 文档](https://vercel.com/docs)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [Express 在 Vercel 上的部署](https://vercel.com/guides/deploying-express-with-vercel)
