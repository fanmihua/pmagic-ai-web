import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import argon2 from "argon2";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { z } from "zod";
import { clearSessionCookie, createSession, getAuthUser, hashSessionToken, requireRole, requireUser, setSessionCookie } from "./auth.js";
import { caseInclude, ensureMediaFromUrl, getHomepageContent, whitepaperInclude, writeAuditLog } from "./content.js";
import { prisma } from "./db.js";
import { env, paths } from "./env.js";
import { registerStaticRoutes } from "./static.js";

const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const casePayloadSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().min(1),
  badge: z.string().min(1).default("真实案例"),
  imageUrl: z.string().min(1).optional().nullable(),
  summaryParagraphs: z.array(z.string().min(1)).default([]),
  metrics: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        description: z.string().min(1)
      })
    )
    .default([]),
  timelineSteps: z
    .array(
      z.object({
        title: z.string().min(1),
        timeLabel: z.string().min(1)
      })
    )
    .default([]),
  sortOrder: z.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

const whitepaperPayloadSchema = z.object({
  slug: slugSchema.optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  previewUrl: z.string().min(1).optional().nullable(),
  documentUrl: z.string().min(1).optional().nullable(),
  onlineUrl: z.string().optional().nullable(),
  downloadUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
});

const sectionPayloadSchema = z.object({
  caseTitle: z.string().min(1),
  whitepaperTitle: z.string().min(1),
  whitepaperDescription: z.string().min(1),
  whitepaperCoverUrl: z.string().min(1).optional().nullable()
});

function resolvePublicFilePath(publicUrl: string) {
  const [pathname] = publicUrl.split("?");
  const routes = [
    { prefix: "/uploads/", root: paths.uploadDir },
    { prefix: "/assets/", root: path.join(paths.projectRoot, "assets") }
  ];
  const route = routes.find((item) => pathname.startsWith(item.prefix));
  if (!route) return null;

  const relativePath = pathname.slice(route.prefix.length);
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.resolve(route.root, normalized);
  const relativeToRoot = path.relative(route.root, filePath);
  return relativeToRoot && !relativeToRoot.startsWith("..") && !path.isAbsolute(relativeToRoot) ? filePath : null;
}

function contentDispositionFilename(filename: string) {
  const fallback = filename.replace(/[^\w.-]+/g, "-") || "whitepaper.pdf";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function upsertCase(id: string | null, payload: z.infer<typeof casePayloadSchema>, actorId?: string) {
  const image = await ensureMediaFromUrl(payload.imageUrl, "IMAGE");
  const data = {
    slug: payload.slug || makeSlug(payload.title) || `case-${Date.now()}`,
    title: payload.title,
    badge: payload.badge,
    imageAssetId: image?.id,
    summaryParagraphs: payload.summaryParagraphs,
    sortOrder: payload.sortOrder,
    status: payload.status,
    publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
    updatedBy: actorId
  };

  const item = id
    ? await prisma.caseStudy.update({
        where: { id },
        data: {
          ...data,
          metrics: { deleteMany: {}, create: payload.metrics.map((metric, index) => ({ ...metric, sortOrder: index })) },
          timelineSteps: {
            deleteMany: {},
            create: payload.timelineSteps.map((step, index) => ({ ...step, sortOrder: index }))
          }
        },
        include: caseInclude
      })
    : await prisma.caseStudy.create({
        data: {
          ...data,
          createdBy: actorId,
          metrics: { create: payload.metrics.map((metric, index) => ({ ...metric, sortOrder: index })) },
          timelineSteps: { create: payload.timelineSteps.map((step, index) => ({ ...step, sortOrder: index })) }
        },
        include: caseInclude
      });

  await writeAuditLog({ actorId, action: id ? "case.update" : "case.create", entityType: "case", entityId: item.id });
  return item;
}

async function upsertWhitepaper(id: string | null, payload: z.infer<typeof whitepaperPayloadSchema>, actorId?: string) {
  const preview = await ensureMediaFromUrl(payload.previewUrl, "IMAGE");
  const document = await ensureMediaFromUrl(payload.documentUrl, "DOCUMENT");
  const data = {
    slug: payload.slug || makeSlug(payload.title) || `whitepaper-${Date.now()}`,
    title: payload.title,
    summary: payload.summary,
    previewAssetId: preview?.id,
    documentAssetId: document?.id,
    onlineUrl: payload.onlineUrl || null,
    downloadUrl: payload.downloadUrl || null,
    sortOrder: payload.sortOrder,
    status: payload.status,
    publishedAt: payload.status === "PUBLISHED" ? new Date() : null,
    updatedBy: actorId
  };

  const item = id
    ? await prisma.whitepaper.update({ where: { id }, data, include: whitepaperInclude })
    : await prisma.whitepaper.create({ data: { ...data, createdBy: actorId }, include: whitepaperInclude });

  await writeAuditLog({
    actorId,
    action: id ? "whitepaper.update" : "whitepaper.create",
    entityType: "whitepaper",
    entityId: item.id
  });
  return item;
}

const app = Fastify({ logger: true });

await fs.mkdir(paths.uploadDir, { recursive: true });
await app.register(cookie);
await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  }
});

app.get("/api/health", async () => ({ ok: true }));

app.get("/api/public/homepage-content", async () => getHomepageContent("PUBLISHED"));
app.get("/api/public/cases", async () => {
  const content = await getHomepageContent("PUBLISHED");
  return content.caseSection.cases;
});
app.get("/api/public/whitepapers", async () => {
  const content = await getHomepageContent("PUBLISHED");
  return content.whitepaperSection.whitepapers;
});
app.get("/api/public/whitepapers/:slug/download", async (request, reply) => {
  const { slug } = request.params as { slug: string };
  const paper = await prisma.whitepaper.findUnique({ where: { slug }, include: { document: true } });

  if (!paper || paper.status !== "PUBLISHED") return reply.code(404).send({ error: "NOT_FOUND" });
  if (paper.document?.publicUrl) {
    const filePath = resolvePublicFilePath(paper.document.publicUrl);
    if (filePath) {
      try {
        const stat = await fs.stat(filePath);
        if (stat.isFile()) {
          return reply
            .type(paper.document.mimeType || "application/pdf")
            .header("Content-Length", stat.size)
            .header("Content-Disposition", contentDispositionFilename(paper.document.originalName || `${paper.slug}.pdf`))
            .send(createReadStream(filePath));
        }
      } catch {
        return reply.code(404).send({ error: "FILE_NOT_FOUND" });
      }
    }

    return reply.redirect(paper.document.publicUrl);
  }
  if (paper.downloadUrl) return reply.redirect(paper.downloadUrl);

  return reply.code(404).send({ error: "DOWNLOAD_NOT_CONFIGURED" });
});

app.post("/api/auth/login", async (request, reply) => {
  const payload = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(request.body);
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user || user.status !== "ACTIVE") return reply.code(401).send({ error: "INVALID_LOGIN" });
  const valid = await argon2.verify(user.passwordHash, payload.password);
  if (!valid) return reply.code(401).send({ error: "INVALID_LOGIN" });

  const session = await createSession(user.id);
  setSessionCookie(reply, session.token, session.expiresAt);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
});

app.post("/api/auth/logout", async (request, reply) => {
  const token = request.cookies.pmagic_session;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  clearSessionCookie(reply);
  return { ok: true };
});

app.get("/api/auth/me", async (request) => {
  const user = await getAuthUser(request);
  return { user };
});

app.get("/api/admin/content", { preHandler: requireUser }, async () => getHomepageContent("PUBLISHED"));

app.get("/api/admin/raw-content", { preHandler: requireUser }, async () => {
  const [caseSection, whitepaperSection, cases, whitepapers] = await Promise.all([
    prisma.caseSection.findFirst(),
    prisma.whitepaperSection.findFirst({ include: { cover: true } }),
    prisma.caseStudy.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: caseInclude }),
    prisma.whitepaper.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: whitepaperInclude })
  ]);

  return { caseSection, whitepaperSection, cases, whitepapers };
});

app.patch("/api/admin/sections", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const payload = sectionPayloadSchema.parse(request.body);
  const cover = await ensureMediaFromUrl(payload.whitepaperCoverUrl, "IMAGE");

  const [caseSection, whitepaperSection] = await Promise.all([
    prisma.caseSection.upsert({
      where: { id: "default-case-section" },
      create: { id: "default-case-section", title: payload.caseTitle, status: "PUBLISHED" },
      update: { title: payload.caseTitle }
    }),
    prisma.whitepaperSection.upsert({
      where: { id: "default-whitepaper-section" },
      create: {
        id: "default-whitepaper-section",
        title: payload.whitepaperTitle,
        description: payload.whitepaperDescription,
        coverAssetId: cover?.id,
        status: "PUBLISHED"
      },
      update: {
        title: payload.whitepaperTitle,
        description: payload.whitepaperDescription,
        coverAssetId: cover?.id
      }
    })
  ]);

  await writeAuditLog({ actorId: request.user?.id, action: "sections.update", entityType: "sections" });
  return { caseSection, whitepaperSection };
});

app.get("/api/admin/cases", { preHandler: requireUser }, async () =>
  prisma.caseStudy.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: caseInclude })
);
app.post("/api/admin/cases", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const payload = casePayloadSchema.parse(request.body);
  return upsertCase(null, payload, request.user?.id);
});
app.patch("/api/admin/cases/:id", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const { id } = request.params as { id: string };
  const payload = casePayloadSchema.parse(request.body);
  return upsertCase(id, payload, request.user?.id);
});
app.delete("/api/admin/cases/:id", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const { id } = request.params as { id: string };
  await prisma.caseStudy.update({ where: { id }, data: { status: "ARCHIVED", updatedBy: request.user?.id } });
  await writeAuditLog({ actorId: request.user?.id, action: "case.archive", entityType: "case", entityId: id });
  return { ok: true };
});

app.get("/api/admin/whitepapers", { preHandler: requireUser }, async () =>
  prisma.whitepaper.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: whitepaperInclude })
);
app.post("/api/admin/whitepapers", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const payload = whitepaperPayloadSchema.parse(request.body);
  return upsertWhitepaper(null, payload, request.user?.id);
});
app.patch("/api/admin/whitepapers/:id", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const { id } = request.params as { id: string };
  const payload = whitepaperPayloadSchema.parse(request.body);
  return upsertWhitepaper(id, payload, request.user?.id);
});
app.delete("/api/admin/whitepapers/:id", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request) => {
  const { id } = request.params as { id: string };
  await prisma.whitepaper.update({ where: { id }, data: { status: "ARCHIVED", updatedBy: request.user?.id } });
  await writeAuditLog({ actorId: request.user?.id, action: "whitepaper.archive", entityType: "whitepaper", entityId: id });
  return { ok: true };
});

app.get("/api/admin/users", { preHandler: requireRole(["ADMIN"]) }, async () =>
  prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true }
  })
);
app.post("/api/admin/users", { preHandler: requireRole(["ADMIN"]) }, async (request) => {
  const payload = z
    .object({
      email: z.string().email(),
      name: z.string().min(1),
      password: z.string().min(8),
      role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).default("EDITOR")
    })
    .parse(request.body);

  const passwordHash = await argon2.hash(payload.password);
  const user = await prisma.user.create({ data: { ...payload, passwordHash } });
  await writeAuditLog({ actorId: request.user?.id, action: "user.create", entityType: "user", entityId: user.id });
  return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status };
});
app.patch("/api/admin/users/:id", { preHandler: requireRole(["ADMIN"]) }, async (request) => {
  const { id } = request.params as { id: string };
  const payload = z
    .object({
      name: z.string().min(1).optional(),
      role: z.enum(["ADMIN", "EDITOR", "VIEWER"]).optional(),
      status: z.enum(["ACTIVE", "DISABLED"]).optional(),
      password: z.string().min(8).optional()
    })
    .parse(request.body);

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: payload.name,
      role: payload.role,
      status: payload.status,
      passwordHash: payload.password ? await argon2.hash(payload.password) : undefined
    }
  });
  await writeAuditLog({ actorId: request.user?.id, action: "user.update", entityType: "user", entityId: user.id });
  return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status };
});

app.get("/api/admin/media", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async () => {
  return prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true,
      kind: true,
      filename: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      publicUrl: true,
      createdAt: true
    }
  });
});

app.post("/api/admin/media", { preHandler: requireRole(["ADMIN", "EDITOR"]) }, async (request, reply) => {
  const file = await request.file();
  if (!file) return reply.code(400).send({ error: "NO_FILE" });

  const ext = path.extname(file.filename).toLowerCase();
  const safeBase = path.basename(file.filename, ext).replace(/[^a-zA-Z0-9._-]+/g, "-");
  const filename = `${Date.now()}-${safeBase || "asset"}${ext}`;
  const destination = path.join(paths.uploadDir, filename);

  await pipeline(file.file, await fs.open(destination, "w").then((handle) => handle.createWriteStream()));

  const publicUrl = `/uploads/${filename}`;
  const asset = await prisma.mediaAsset.create({
    data: {
      kind: file.mimetype.startsWith("image/") ? "IMAGE" : "DOCUMENT",
      filename,
      originalName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: Number(file.file.bytesRead || 0),
      storagePath: destination,
      publicUrl,
      createdBy: request.user?.id
    }
  });

  await writeAuditLog({ actorId: request.user?.id, action: "media.create", entityType: "media", entityId: asset.id });
  return asset;
});

registerStaticRoutes(app);

try {
  await app.listen({ host: "0.0.0.0", port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
