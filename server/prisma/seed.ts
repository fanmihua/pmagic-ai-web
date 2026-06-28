import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@pmagic.local";
const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "ChangeMe123!";

async function media(publicUrl: string, mimeType = "image/webp") {
  const filename = publicUrl.split("/").pop() || publicUrl;
  return prisma.mediaAsset.upsert({
    where: { publicUrl },
    update: {},
    create: {
      kind: mimeType === "application/pdf" ? "DOCUMENT" : "IMAGE",
      filename,
      originalName: filename,
      mimeType,
      storagePath: publicUrl,
      publicUrl
    }
  });
}

async function main() {
  const passwordHash = await argon2.hash(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: adminEmail,
      name: "PMagic 管理员",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  const caseImage = await media("/assets/images/case-city.webp");
  const whitepaperCover = await media("/assets/images/whitepaper-books-cover.webp");
  const agentPreview = await media("/assets/images/whitepaper-agent-orchestrator.webp");
  const procurementPreview = await media("/assets/images/whitepaper-procurement-loop.webp");
  const costPreview = await media("/assets/images/whitepaper-cost-forecast.webp");

  await prisma.caseSection.upsert({
    where: { id: "default-case-section" },
    update: {
      title: "从真实项目中验证的智能闭环",
      status: "PUBLISHED"
    },
    create: {
      id: "default-case-section",
      title: "从真实项目中验证的智能闭环",
      status: "PUBLISHED"
    }
  });

  await prisma.whitepaperSection.upsert({
    where: { id: "default-whitepaper-section" },
    update: {
      title: "浏览建工 AI 白皮书",
      description: "系统了解多 Agent 架构、材料闭环、成本预测与企业微信协同的落地方法。",
      coverAssetId: whitepaperCover.id,
      status: "PUBLISHED"
    },
    create: {
      id: "default-whitepaper-section",
      title: "浏览建工 AI 白皮书",
      description: "系统了解多 Agent 架构、材料闭环、成本预测与企业微信协同的落地方法。",
      coverAssetId: whitepaperCover.id,
      status: "PUBLISHED"
    }
  });

  const caseStudy = await prisma.caseStudy.upsert({
    where: { slug: "huzhou-zhidong-control-unit" },
    update: {
      title: "湖州织东控规单元项目",
      badge: "真实案例",
      imageAssetId: caseImage.id,
      summaryParagraphs: [
        "项目总规划面积约 15 万㎡，正处于主供货的施工高峰期，对钢筋等主材的供应要求很高。",
        "盈泰 AI 建工管理矩阵 OS 通过多 Agent 协同，快速完成采购全流程任务，保障现场施工不断档。"
      ],
      sortOrder: 0,
      status: "PUBLISHED",
      publishedAt: new Date(),
      metrics: {
        deleteMany: {},
        create: [
          { label: "全流程", value: "26 小时", description: "完成采购全链路", sortOrder: 0 },
          { label: "提前", value: "62 天", description: "比原计划提前", sortOrder: 1 },
          { label: "成本下降", value: "12.6%", description: "采购成本降低", sortOrder: 2 },
          { label: "间接损失减少", value: "529.7 万", description: "停工损失降低", sortOrder: 3 }
        ]
      },
      timelineSteps: {
        deleteMany: {},
        create: [
          { title: "需求识别", timeLabel: "0h", sortOrder: 0 },
          { title: "供应商匹配", timeLabel: "2h", sortOrder: 1 },
          { title: "在线询比价", timeLabel: "6h", sortOrder: 2 },
          { title: "合同签署", timeLabel: "10h", sortOrder: 3 },
          { title: "过磅追踪", timeLabel: "24h", sortOrder: 4 },
          { title: "保供闭环", timeLabel: "提前 62 天", sortOrder: 5 }
        ]
      }
    },
    create: {
      slug: "huzhou-zhidong-control-unit",
      title: "湖州织东控规单元项目",
      badge: "真实案例",
      imageAssetId: caseImage.id,
      summaryParagraphs: [
        "项目总规划面积约 15 万㎡，正处于主供货的施工高峰期，对钢筋等主材的供应要求很高。",
        "盈泰 AI 建工管理矩阵 OS 通过多 Agent 协同，快速完成采购全流程任务，保障现场施工不断档。"
      ],
      sortOrder: 0,
      status: "PUBLISHED",
      publishedAt: new Date(),
      metrics: {
        create: [
          { label: "全流程", value: "26 小时", description: "完成采购全链路", sortOrder: 0 },
          { label: "提前", value: "62 天", description: "比原计划提前", sortOrder: 1 },
          { label: "成本下降", value: "12.6%", description: "采购成本降低", sortOrder: 2 },
          { label: "间接损失减少", value: "529.7 万", description: "停工损失降低", sortOrder: 3 }
        ]
      },
      timelineSteps: {
        create: [
          { title: "需求识别", timeLabel: "0h", sortOrder: 0 },
          { title: "供应商匹配", timeLabel: "2h", sortOrder: 1 },
          { title: "在线询比价", timeLabel: "6h", sortOrder: 2 },
          { title: "合同签署", timeLabel: "10h", sortOrder: 3 },
          { title: "过磅追踪", timeLabel: "24h", sortOrder: 4 },
          { title: "保供闭环", timeLabel: "提前 62 天", sortOrder: 5 }
        ]
      }
    }
  });

  const whitepapers = [
    {
      slug: "multi-agent-architecture-guide",
      title: "多 Agent 架构指南",
      summary: "了解多 Agent 架构的设计原则与落地路径。",
      previewAssetId: agentPreview.id,
      sortOrder: 0
    },
    {
      slug: "procurement-weighing-loop",
      title: "智慧采购与过磅闭环",
      summary: "从采购到过磅的全流程协同，实现数据闭环与风险切控。",
      previewAssetId: procurementPreview.id,
      sortOrder: 1
    },
    {
      slug: "project-cost-forecast-practice",
      title: "项目成本预测实践",
      summary: "基于数据与 AI 的成本预测模型助项目降本增效。",
      previewAssetId: costPreview.id,
      sortOrder: 2
    }
  ];

  for (const item of whitepapers) {
    await prisma.whitepaper.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        ...item,
        onlineUrl: "#whitepaper-title",
        downloadUrl: "#whitepaper-title",
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    });
  }

  console.log(`Seed complete. Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Seeded case: ${caseStudy.title}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
