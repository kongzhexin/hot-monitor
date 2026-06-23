# Vercel 部署指南

## 1. 概览
本项目已经改为：
- 使用 `PostgreSQL` 数据源（Neon / 外部数据库）
- 在 Vercel 上通过 `api/index.js` 提供 API 服务
- 通过 `api/cron-scan.js` 支持每天一次的定时扫描
- 使用 `public/` 提供静态前端页面

## 2. 关键配置

### Vercel 项目设置
- Install Command: `npm install`
- Build Command: `npm run build`
- Development Command: `npm run dev`

如果你希望把数据库迁移也放到部署流程里，Build Command 可改为：
```bash
npm run build && npx prisma migrate deploy
```

### Vercel 环境变量
在 Vercel Dashboard → Settings → Environment Variables 中添加：

| 名称 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | Neon/PostgreSQL 连接字符串 | `postgresql://neondb_owner:<PASSWORD>@ep-icy-queen-atud3nc1.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `OPENROUTER_API_KEY` | OpenRouter API 密钥 | `sk-or-...` |
| `RSS_SOURCES` | RSS 源列表（JSON） | `[{"name":"HackerNews","url":"https://news.ycombinator.com/rss"}]` |
| `SCAN_INTERVAL_SECONDS` | 扫描间隔（秒） | `3600` |

> 备注：`PORT` 不需要在 Vercel 中手动设置，Vercel 会自动管理运行端口。
>
> 注意：本项目不再依赖 `vercel.json` 中的 `@SECRET` 引用，环境变量应直接通过 Vercel Dashboard 设置。
### Vercel 定时任务
当前为 Hobby 账户优化为每日一次定时任务：
```json
"crons": [
  {
    "path": "/api/cron-scan",
    "schedule": "0 0 * * *"
  }
]
```
这意味着每天 UTC 00:00 运行一次扫描，符合 Hobby 计划限制。

## 3. 部署流程

### 3.1 连接仓库
- 直接在 Vercel Dashboard 中导入 GitHub 仓库
- 或使用 Vercel CLI：
```bash
npm i -g vercel
vercel
```

### 3.2 运行部署
- 在 Vercel Dashboard 中点击 Deploy：
  - 触发 `npm install`
  - 触发 `npm run build`
  - 生成 Prisma Client

### 3.3 运行数据库迁移
推荐在部署完成后单独执行迁移：
```bash
vercel env pull
npx prisma migrate deploy
```

如果你想让构建过程自动迁移，可以改为：
```bash
npm run build && npx prisma migrate deploy
```
但建议先确认 `DATABASE_URL` 是否正确，再执行迁移。

## 4. 本地开发与测试

### 4.1 本地环境文件
创建 `.env.local`：
```env
DATABASE_URL="postgresql://neondb_owner:<YOUR_PASSWORD>@ep-icy-queen-atud3nc1.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
OPENROUTER_API_KEY="sk-or-your-key-here"
RSS_SOURCES='[
  {"name":"HackerNews","url":"https://news.ycombinator.com/rss"},
  {"name":"ProductHunt","url":"https://www.producthunt.com/feed"}
]'
SCAN_INTERVAL_SECONDS=3600
PORT=3000
```

### 4.2 本地测试步骤
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 4.3 生产模式测试
```bash
npm run build
npm start
```

## 5. 注意事项

### 数据库类型
- 当前 `prisma/schema.prisma` 已使用 PostgreSQL
- `DATABASE_URL` 不能再使用 SQLite 文件路径
- Vercel 上强烈推荐使用外部数据库（Neon、Supabase、MongoDB Atlas）

### 定时任务限制
- Hobby 账户只能运行每日一次 cron
- 已将 `vercel.json` 中的 cron 表达式调整为 `0 0 * * *`
- 如果需要更频繁的调度，需要升级 Vercel Pro

### 如果你使用 Vercel KV 或 Blob
本项目当前未将数据迁移到 KV/Blob，仍然依赖 Prisma/PostgreSQL。
如果要改成 KV/Blob，需要额外改写数据库层。

## 6. 故障排查

### 6.1 数据库连接失败
- 检查 `DATABASE_URL` 是否正确
- 确认 Neon 实例可访问
- 查看 Vercel 函数日志

### 6.2 Prisma 迁移失败
```bash
vercel env pull
npx prisma migrate deploy --skip-generate
```

### 6.3 API 无响应
- 检查 `api/index.js` 是否正常部署
- 确认 `vercel.json` 路由配置正确
- 访问 `https://<your-app>.vercel.app/api/health`

### 6.4 静态页面 404
- 确认 `public/index.html` 存在
- 确保 `vercel.json` 有：
  - `/api/*` 路由到 `api/index.js`
  - 非 API 路由到 `public/index.html`

## 7. 日志与回滚

### 查看日志
```bash
vercel logs
```

### 回滚版本
```bash
vercel rollback
```

## 8. 更多资源
- [Express 在 Vercel 上的部署](https://vercel.com/guides/deploying-express-with-vercel)
