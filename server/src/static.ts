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

function sendFile(reply: FastifyReply, root: string, relativePath: string) {
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.resolve(root, normalized);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return reply.code(404).send("Not found");
  }

  const type = mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
  return reply.type(type).send(fs.createReadStream(filePath));
}

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
    return sendFile(reply, path.join(adminDistRoot, "assets"), wildcard);
  });

  app.get("/assets/*", (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    return sendFile(reply, path.join(paths.projectRoot, "assets"), wildcard);
  });

  app.get("/uploads/*", (request, reply) => {
    const wildcard = (request.params as { "*": string })["*"];
    return sendFile(reply, paths.uploadDir, wildcard);
  });
}
