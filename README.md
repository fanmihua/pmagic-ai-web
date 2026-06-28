# PMagic AI Web

PMagic AI 官网静态页，使用原生 HTML、CSS 和 JavaScript 构建，可直接通过静态服务器预览或部署。

线上地址：<https://fanmihua.github.io/pmagic-ai-web/>

后台静态预览：<https://fanmihua.github.io/pmagic-ai-web/admin/>

后台预览运行在 GitHub Pages 上，会自动进入演示数据模式，适合客户查看后台界面和配置流程。保存、上传、删除会模拟成功；真实数据写入需要运行 `server/` 后端服务。

## 本地预览

```bash
python3 -m http.server 5173
```

打开 `http://localhost:5173`。

## 后台与数据库预览

完整后台能力需要本地 Docker：

```bash
docker compose up --build
```

打开：

- 前台：`http://localhost:5173`
- 后台：`http://localhost:5173/admin`

默认管理员账号来自 `.env.example` 和 `docker-compose.yml`：

- 邮箱：`admin@pmagic.local`
- 密码：`ChangeMe123!`

后端会在 PostgreSQL 中初始化当前首页的案例和白皮书内容，后台修改后前台通过 `/api/public/homepage-content` 读取最新发布数据。若 API 不可用，首页会保留静态 HTML 内容作为降级展示。

## 文件结构

- `index.html`：页面结构
- `styles.css`：页面样式
- `script.js`：交互逻辑
- `assets/images/`：页面实际引用的图片
- `assets/videos/`：Hero 视频素材
- `assets/icons/`：本地 SVG sprite 图标
- `admin/`：Vite + React + shadcn/ui 后台页面
- `server/`：Fastify API、Prisma 模型与 seed
- `docker-compose.yml`：PostgreSQL 与 API 本地运行配置

## 资产维护

仓库只保留页面运行时需要的素材。调试截图、参考源图、临时导出、Playwright 记录等文件放在本地即可，不提交到仓库。
