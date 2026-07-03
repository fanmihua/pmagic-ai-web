# PMagic 白皮书与案例后台开发方案

## 当前前台内容盘点

当前站点是原生 HTML/CSS/JS 静态页，白皮书和案例模块都硬编码在 `index.html` 中，尚无数据接口、登录、后台或下载文件管理。

### 案例模块

位置：`index.html` 的 `#case` 区块。

- 模块标题：`从真实项目中验证的智能闭环`
- 当前案例：`湖州织东控规单元项目`
- 标签：`真实案例`
- 图片：`assets/images/case-city.webp`，回退图 `assets/images/case-city.png`
- 正文：
  - `项目总规划面积约 15 万㎡，正处于主供货的施工高峰期，对钢筋等主材的供应要求很高。`
  - `Pmagic AI 建工管理矩阵 OS 通过多 Agent 协同，快速完成采购全流程任务，保障现场施工不断档。`
- 指标：
  - `全流程` / `26 小时` / `完成采购全链路`
  - `提前` / `38 小时` / `比原计划提前`
  - `成本下降` / `2.1%` / `采购成本降低`
  - `间接损失减少` / `8 万元` / `停工损失降低`
- 时间线：
  - `需求识别` / `0h`
  - `供应商匹配` / `2h`
  - `在线询比价` / `6h`
  - `合同签署` / `10h`
  - `过磅追踪` / `24h`
  - `保供闭环` / `26h`

### 白皮书模块

位置：`index.html` 的 `#whitepaper` 区块。

- 模块标题：`浏览建工 AI 白皮书`
- 模块简介：`系统了解多 Agent 架构、材料闭环、成本预测与企业微信协同的落地方法。`
- 左侧封面：`assets/images/whitepaper-books-cover.webp`，回退图 `assets/images/whitepaper-books-cover.png`
- 当前白皮书卡片：
  - `多 Agent 架构指南`
    - 简介：`了解多 Agent 架构的设计原则与落地路径。`
    - 预览图：`assets/images/whitepaper-agent-orchestrator.webp`
  - `智慧采购与过磅闭环`
    - 简介：`从采购到过磅的全流程协同，实现数据闭环与风险切控。`
    - 预览图：`assets/images/whitepaper-procurement-loop.webp`
  - `项目成本预测实践`
    - 简介：`基于数据与 AI 的成本预测模型助项目降本增效。`
    - 预览图：`assets/images/whitepaper-cost-forecast.webp`
- 当前按钮：`在线浏览`、`下载白皮书` 都只是锚点，后续需要改成真实浏览链接和下载文件。

## 建设目标

第一阶段把白皮书与案例从静态硬编码改成可由后台维护的数据模块：

- 前台仍保持当前视觉，还原已有模块的布局和动效。
- 后台支持登录、用户管理、管理员权限、白皮书管理、案例管理。
- 数据库使用 PostgreSQL，本地和部署均通过 Docker 启动。
- 后端提供公开读取接口和受保护的后台管理接口。
- 当前首页内容作为 seed 数据迁入数据库，避免上线后内容变空。

## 推荐技术方案

当前项目没有构建系统，直接引入重型全栈框架会带来较大迁移成本。建议采用低侵入架构：

- `frontend`：保留当前静态页面结构，逐步把 `#case`、`#whitepaper` 改为通过 API 渲染。
- `backend`：新增 Node.js 服务，推荐 `Fastify + TypeScript + Prisma + Zod`。
- `database`：PostgreSQL 16。
- `auth`：后台使用邮箱密码登录，密码用 `argon2` 哈希，登录态用 HttpOnly Cookie + 服务端会话或短期 JWT。
- `admin`：第一阶段可做轻量原生后台页面 `/admin`；如果后续后台复杂度上升，再迁移到 React/Vite 管理端。
- `assets`：第一阶段上传到 Docker volume 的本地目录，数据库保存文件路径；后续可替换为对象存储。

推荐目录：

```text
pmagic-ai-web/
  index.html
  styles.css
  script.js
  assets/
  admin/
    index.html
    admin.css
    admin.js
  server/
    src/
      app.ts
      env.ts
      routes/
      services/
      middleware/
    prisma/
      schema.prisma
      migrations/
      seed.ts
    package.json
    tsconfig.json
    Dockerfile
  docker-compose.yml
  .env.example
```

## 数据库模型

### users

后台账号表。

- `id`
- `email`
- `name`
- `password_hash`
- `role`：`admin`、`editor`、`viewer`
- `status`：`active`、`disabled`
- `last_login_at`
- `created_at`
- `updated_at`

### sessions

后台登录会话表。如果采用纯 JWT，可省略；推荐保留，方便后台强制下线。

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `created_at`
- `revoked_at`

### media_assets

后台上传的图片和白皮书文件。

- `id`
- `kind`：`image`、`document`
- `filename`
- `original_name`
- `mime_type`
- `size_bytes`
- `storage_path`
- `public_url`
- `width`
- `height`
- `created_by`
- `created_at`

### whitepaper_sections

白皮书模块整体配置。

- `id`
- `title`
- `description`
- `cover_asset_id`
- `status`
- `updated_at`

### whitepapers

白皮书卡片。

- `id`
- `slug`
- `title`
- `summary`
- `preview_asset_id`
- `document_asset_id`
- `online_url`
- `download_url`
- `sort_order`
- `status`：`draft`、`published`、`archived`
- `published_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### case_studies

案例主体。

- `id`
- `slug`
- `title`
- `badge`
- `image_asset_id`
- `summary_paragraphs`：`jsonb`
- `sort_order`
- `status`：`draft`、`published`、`archived`
- `published_at`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

### case_metrics

案例指标。

- `id`
- `case_id`
- `label`
- `value`
- `description`
- `sort_order`

### case_timeline_steps

案例时间线。

- `id`
- `case_id`
- `title`
- `time_label`
- `sort_order`

### audit_logs

后台操作日志。

- `id`
- `actor_id`
- `action`
- `entity_type`
- `entity_id`
- `before`
- `after`
- `created_at`

## API 设计

### 公开接口

用于首页渲染，无需登录。

- `GET /api/public/homepage-content`
  - 返回案例模块、白皮书模块和可公开访问的图片/文件 URL。
- `GET /api/public/cases`
  - 返回已发布案例列表。
- `GET /api/public/whitepapers`
  - 返回已发布白皮书列表。
- `GET /api/public/whitepapers/:slug/download`
  - 下载白皮书文件，后续可增加下载统计。

### 认证接口

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### 后台接口

全部需要登录。

- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/cases`
- `POST /api/admin/cases`
- `PATCH /api/admin/cases/:id`
- `DELETE /api/admin/cases/:id`
- `POST /api/admin/cases/:id/publish`
- `GET /api/admin/whitepapers`
- `POST /api/admin/whitepapers`
- `PATCH /api/admin/whitepapers/:id`
- `DELETE /api/admin/whitepapers/:id`
- `POST /api/admin/whitepapers/:id/publish`
- `POST /api/admin/media`
- `GET /api/admin/audit-logs`

## 后台页面规划

### 登录页

- 邮箱、密码登录。
- 登录失败提示。
- 已登录时跳转后台首页。

### 后台首页

- 显示已发布白皮书数量、案例数量、草稿数量、最近更新时间。
- 提供快捷入口：新增白皮书、新增案例、上传素材。

### 白皮书管理

- 列表字段：标题、状态、排序、更新时间、操作。
- 编辑字段：标题、简介、预览图、在线浏览链接、下载文件、排序、发布状态。
- 支持草稿保存、发布、下架。

### 案例管理

- 列表字段：标题、标签、状态、排序、更新时间、操作。
- 编辑字段：标题、标签、封面图、多段正文、指标、时间线、排序、发布状态。
- 指标和时间线支持增删、排序。

### 用户与权限

- 管理员可新增、禁用用户。
- `admin`：全部权限。
- `editor`：管理白皮书、案例、素材。
- `viewer`：只读查看后台。

## Docker 本地开发

推荐本地启动方式：

```bash
docker compose up --build
```

服务规划：

- `postgres`：PostgreSQL 数据库。
- `api`：Node.js 后端，挂载 `server/uploads` volume。
- `web`：可选，第一阶段可以由 API 服务直接托管静态首页和 `/admin`。

环境变量：

```bash
DATABASE_URL=postgresql://pmagic:pmagic@postgres:5432/pmagic_ai_web
SESSION_SECRET=change-me
ADMIN_BOOTSTRAP_EMAIL=admin@pmagic.ai
ADMIN_BOOTSTRAP_PASSWORD=change-me
PUBLIC_BASE_URL=http://localhost:5173
UPLOAD_DIR=/app/uploads
```

## 前台改造方式

第一阶段只动两个模块，降低视觉回归风险：

1. 在 `index.html` 给案例和白皮书容器增加稳定的 `data-*` 挂载点。
2. 在 `script.js` 增加 `fetch("/api/public/homepage-content")`。
3. API 成功时渲染数据库内容。
4. API 失败时保留当前硬编码 HTML 作为降级内容。
5. 图片仍沿用现有 `.asset-frame`、`data-fallback`、`has-image` 逻辑。

这样即使后端临时不可用，首页仍能展示现有内容。

## 实施里程碑

### 阶段 1：工程骨架与数据库

- 新增 `docker-compose.yml`。
- 新增 `server/` Node.js 后端。
- 接入 Prisma 和 PostgreSQL。
- 建表迁移和 seed 当前白皮书、案例数据。
- 加入 `.env.example`。

验收：

- `docker compose up --build` 可以启动。
- `GET /api/health` 返回正常。
- 数据库中能看到 seed 数据。

### 阶段 2：公开接口与前台接入

- 实现 `GET /api/public/homepage-content`。
- 改造 `script.js` 动态渲染案例和白皮书。
- 保留静态降级内容。

验收：

- 首页两个模块内容来自数据库。
- 停掉后端或 API 报错时，页面仍显示原硬编码内容。

### 阶段 3：登录与后台基础

- 实现登录、退出、当前用户接口。
- 新增 `/admin` 登录页和后台框架。
- 实现用户表、会话、权限中间件。
- 初始化管理员账号。

验收：

- 未登录无法访问管理接口。
- 管理员能登录后台。
- 禁用用户无法登录。

### 阶段 4：白皮书管理

- 白皮书列表、创建、编辑、发布、下架。
- 文件上传和下载链接管理。
- 图片上传和预览。

验收：

- 后台修改白皮书后，首页实时展示新内容。
- 下载按钮能下载真实文件。

### 阶段 5：案例管理

- 案例列表、创建、编辑、发布、下架。
- 指标和时间线编辑。
- 案例封面上传。

验收：

- 后台修改案例指标和时间线后，首页展示一致。
- 首页样式不因字段长度变化而明显破版。

### 阶段 6：审计、备份与部署准备

- 记录后台操作日志。
- 增加数据库备份说明。
- 整理部署环境变量和初始账号流程。
- 补充基础测试。

验收：

- 关键编辑操作有审计记录。
- 新环境可以通过 Docker、迁移和 seed 复现。

## 风险与决策点

- 当前线上是 GitHub Pages 静态站；接入后端后需要新的部署方式，不能继续只依赖 GitHub Pages 承载完整功能。
- 文件上传第一阶段使用本地 volume，单机可用；如果后续多实例部署，需要切换对象存储。
- 管理后台先做轻量原生页面可以最快闭环；如果后台功能继续扩大，再升级到 React/Vite。
- 当前首页视觉依赖现有 CSS，动态渲染时要控制字段长度并保留降级 HTML，避免一次性大改造成视觉回归。
