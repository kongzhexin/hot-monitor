# hot-monitor

热点监控系统 Web MVP（阶段 1）。

## 启动

1. 安装依赖
   npm install

2. 配置环境变量
   cp .env.example .env

3. 初始化数据库迁移
   npx prisma migrate dev --name init

4. 启动服务
   npm run dev

5. 打开页面
   http://localhost:3000

## OpenRouter 配置

在 .env 中设置：

OPENROUTER_API_KEY=你的key
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
DATABASE_URL="file:./dev.db"

未配置 key 时，系统会自动使用启发式评估。

## API

- GET /api/health
- GET /api/rules
- POST /api/rules
- PATCH /api/rules/:id
- POST /api/scan
- GET /api/hotspots
- GET /api/trends
- GET /api/notifications

## Agent Skills

技能定义：

- agent-skills/skills-manifest.json
- agent-skills/skills-cli.mjs

运行示例：

1. 发现趋势
   node agent-skills/skills-cli.mjs discover_trends "AI 编程"

2. 关键词监控
   node agent-skills/skills-cli.mjs monitor_keywords "openai model release" high

3. 事件校验
   node agent-skills/skills-cli.mjs validate_event "openai model release" "OpenAI发布新模型" "OpenAI announced a new model update" "https://openai.com/blog"

可通过环境变量覆盖服务地址：

HOT_MONITOR_BASE_URL=http://localhost:3000

## 测试

npm test
