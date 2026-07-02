import fs from "node:fs";
import path from "node:path";
import type { FastifyInstance, FastifyReply } from "fastify";
import { paths } from "./env.js";

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf"
};

// 二进制/已压缩类型（PDF、图片、视频）启用 HTTP Range 分段。这些类型 @fastify/compress 不会压缩，
// 所以 206 分段与压缩互不冲突；pdf.js 借此可先取首页数据、边看边加载，无需等整份大 PDF 下完
// （配合已线性化的 PDF 效果最佳）。文本类（HTML/CSS/JS/SVG）仍走整体压缩，不做 Range。
const RANGEABLE_EXT = new Set([".pdf", ".mp4", ".webm", ".png", ".jpg", ".jpeg", ".webp"]);

function sendFile(reply: FastifyReply, root: string, relativePath: string, cacheControl?: string) {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.resolve(root, normalized);
  const relativeToRoot = path.relative(root, filePath);

  if (!relativeToRoot || relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return reply.code(404).send("Not found");
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return reply.code(404).send("Not found");
  }
  if (!stat.isFile()) {
    return reply.code(404).send("Not found");
  }

  const ext = path.extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || "application/octet-stream";
  // 为静态资源补上缓存头：原实现不带 Cache-Control，浏览器每次都回源验证，
  // 弱网/移动端首屏明显变慢。带哈希文件名的资源可 immutable 长缓存，其余按内容更新频率设置。
  if (cacheControl) reply.header("Cache-Control", cacheControl);
  reply.type(type);

  if (!RANGEABLE_EXT.has(ext)) {
    return reply.send(fs.createReadStream(filePath));
  }

  const total = stat.size;
  reply.header("Accept-Ranges", "bytes");
  const rangeHeader = reply.request.headers.range;

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (match && (match[1] !== "" || match[2] !== "")) {
      let start: number;
      let end: number;
      if (match[1] === "") {
        // 后缀区间 bytes=-N：取最后 N 字节
        start = Math.max(0, total - Number(match[2]));
        end = total - 1;
      } else {
        start = Number(match[1]);
        end = match[2] === "" ? total - 1 : Math.min(Number(match[2]), total - 1);
      }
      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
        return reply.code(416).header("Content-Range", `bytes */${total}`).send();
      }
      return reply
        .code(206)
        .header("Content-Range", `bytes ${start}-${end}/${total}`)
        .header("Content-Length", end - start + 1)
        .send(fs.createReadStream(filePath, { start, end }));
    }
  }

  return reply.header("Content-Length", total).send(fs.createReadStream(filePath));
}

// 内容型静态资源（图片、视频、图标、PDF.js 库）：文件名稳定，缓存 30 天，过期后后台再验证。
const ASSET_CACHE = "public, max-age=2592000, stale-while-revalidate=86400";
// 后台构建产物（Vite 带内容哈希）：可安全长期不可变缓存一年。
const HASHED_CACHE = "public, max-age=31536000, immutable";
// 用户上传文件（白皮书 PDF 等）：可能被后台更新，缓存 1 天。
const UPLOAD_CACHE = "public, max-age=86400";

export function registerStaticRoutes(app: FastifyInstance) {
  const adminDistRoot = path.join(paths.projectRoot, "admin/dist");
  const adminSourceRoot = path.join(paths.projectRoot, "admin");

  app.get("/", (_request, reply) => sendFile(reply, paths.projectRoot, "index.html"));
  app.get("/favicon.ico", (_request, reply) => reply.code(204).send());
  app.get("/styles.css", (_request, reply) => sendFile(reply, paths.projectRoot, "styles.css"));
  app.get("/script.js", (_request, reply) => sendFile(reply, paths.projectRoot, "script.js"));

  app.get("/admin", (_request, reply) => {
    const root = fs.existsSync(path.join(adminDistRoot, "index.html")) ? adminDistRoot : adminSourceRoot;
    return sendFile(reply, root, "index.html");
  });
  app.get("/admin/", (_request, reply) => {
    const root = fs.existsSync(path.join(adminDistRoot, "index.html")) ? adminDistRoot : adminSourceRoot;
    return sendFile(reply, root, "index.html");
  });
  app.get("/admin/assets/*", (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    return sendFile(reply, path.join(adminDistRoot, "assets"), wildcard, HASHED_CACHE);
  });

  app.get("/assets/*", (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    return sendFile(reply, path.join(paths.projectRoot, "assets"), wildcard, ASSET_CACHE);
  });

  app.get("/uploads/*", (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    return sendFile(reply, paths.uploadDir, wildcard, UPLOAD_CACHE);
  });
}
