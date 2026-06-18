# PMagic AI Web

PMagic AI 官网静态页，使用原生 HTML、CSS 和 JavaScript 构建，可直接通过静态服务器预览或部署。

## 本地预览

```bash
python3 -m http.server 5173
```

打开 `http://localhost:5173`。

## 文件结构

- `index.html`：页面结构
- `styles.css`：页面样式
- `script.js`：交互逻辑
- `assets/images/`：页面实际引用的图片
- `assets/videos/`：Hero 视频素材
- `assets/icons/`：本地 SVG sprite 图标

## 资产维护

仓库只保留页面运行时需要的素材。调试截图、参考源图、临时导出、Playwright 记录等文件放在本地即可，不提交到仓库。

