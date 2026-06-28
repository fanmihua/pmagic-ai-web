import type { ContentStatus, MediaKind, Prisma } from "@prisma/client";
import { prisma } from "./db.js";

export function publicMedia(asset?: { publicUrl: string; originalName: string; mimeType: string } | null) {
  if (!asset) return null;
  return {
    url: asset.publicUrl,
    alt: asset.originalName,
    mimeType: asset.mimeType
  };
}

export async function ensureMediaFromUrl(publicUrl: string | null | undefined, kind: MediaKind = "IMAGE") {
  if (!publicUrl) return null;

  const normalizedUrl = publicUrl.trim();
  if (!normalizedUrl) return null;

  const filename = normalizedUrl.split("/").pop() || normalizedUrl;
  const mimeType = kind === "DOCUMENT" ? "application/pdf" : "image/webp";

  return prisma.mediaAsset.upsert({
    where: { publicUrl: normalizedUrl },
    update: { kind },
    create: {
      kind,
      filename,
      originalName: filename,
      mimeType,
      storagePath: normalizedUrl,
      publicUrl: normalizedUrl
    }
  });
}

export const caseInclude = {
  image: true,
  metrics: { orderBy: { sortOrder: "asc" as const } },
  timelineSteps: { orderBy: { sortOrder: "asc" as const } }
};

export const whitepaperInclude = {
  preview: true,
  document: true
};

export async function getHomepageContent(status: ContentStatus = "PUBLISHED") {
  const [caseSection, cases, whitepaperSection, whitepapers] = await Promise.all([
    prisma.caseSection.findFirst({ where: { status } }),
    prisma.caseStudy.findMany({
      where: { status },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: caseInclude
    }),
    prisma.whitepaperSection.findFirst({
      where: { status },
      include: { cover: true }
    }),
    prisma.whitepaper.findMany({
      where: { status },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: whitepaperInclude
    })
  ]);

  return {
    caseSection: {
      title: caseSection?.title || "从真实项目中验证的智能闭环",
      cases: cases.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        badge: item.badge,
        image: publicMedia(item.image),
        summaryParagraphs: item.summaryParagraphs,
        metrics: item.metrics.map((metric) => ({
          id: metric.id,
          label: metric.label,
          value: metric.value,
          description: metric.description
        })),
        timelineSteps: item.timelineSteps.map((step) => ({
          id: step.id,
          title: step.title,
          timeLabel: step.timeLabel
        }))
      }))
    },
    whitepaperSection: {
      title: whitepaperSection?.title || "浏览建工 AI 白皮书",
      description:
        whitepaperSection?.description || "系统了解多 Agent 架构、材料闭环、成本预测与企业微信协同的落地方法。",
      cover: publicMedia(whitepaperSection?.cover),
      whitepapers: whitepapers.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        summary: item.summary,
        preview: publicMedia(item.preview),
        document: publicMedia(item.document),
        onlineUrl: item.onlineUrl,
        downloadUrl: item.downloadUrl || `/api/public/whitepapers/${item.slug}/download`
      }))
    }
  };
}

export async function writeAuditLog(data: {
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      before: data.before ?? undefined,
      after: data.after ?? undefined
    }
  });
}
