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
  const osDocument = await media("/uploads/whitepapers/pmagic-ai-construction-os-2026.pdf", "application/pdf");
  const agentDocument = await media("/uploads/whitepapers/pmagic-ai-agent-coordination-hub.pdf", "application/pdf");
  const procurementDocument = await media("/uploads/whitepapers/pmagic-ai-procurement-weighing-loop.pdf", "application/pdf");
  const bimFinanceDocument = await media("/uploads/whitepapers/pmagic-ai-bim-finance.pdf", "application/pdf");

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

  const caseStudies = [
    {
      slug: "huzhou-zhidong-control-unit",
      title: "湖州织东控规单元项目",
      badge: "真实案例",
      summaryParagraphs: [
        "项目总规划面积约 15 万㎡，正处于主供货的施工高峰期，对钢筋等主材的供应要求很高。",
        "盈泰 AI 建工管理矩阵 OS 通过多 Agent 协同，快速完成采购全流程任务，保障现场施工不断档。"
      ],
      metrics: [
        { label: "全流程", value: "26 小时", description: "完成采购全链路", sortOrder: 0 },
        { label: "提前", value: "62 天", description: "比原计划提前", sortOrder: 1 },
        { label: "成本下降", value: "12.6%", description: "采购成本降低", sortOrder: 2 },
        { label: "间接损失减少", value: "529.7 万", description: "停工损失降低", sortOrder: 3 }
      ],
      timelineSteps: [
        { title: "需求识别", timeLabel: "0h", sortOrder: 0 },
        { title: "供应商匹配", timeLabel: "2h", sortOrder: 1 },
        { title: "在线询比价", timeLabel: "6h", sortOrder: 2 },
        { title: "合同签署", timeLabel: "10h", sortOrder: 3 },
        { title: "过磅追踪", timeLabel: "24h", sortOrder: 4 },
        { title: "保供闭环", timeLabel: "提前 62 天", sortOrder: 5 }
      ],
      sortOrder: 0
    },
    {
      slug: "hangzhou-commercial-complex-demo",
      title: "杭州未来商业综合体项目",
      badge: "真实案例",
      summaryParagraphs: [
        "项目处于机电、幕墙与精装交叉施工阶段，现场材料到货节奏复杂，对多专业协同要求更高。",
        "盈泰 AI 建工管理矩阵 OS 将采购计划、合同履约、过磅入场和财务对账统一串联，帮助项目团队提前识别断供与超支风险。"
      ],
      metrics: [
        { label: "协同响应", value: "18 小时", description: "完成跨专业采购响应", sortOrder: 0 },
        { label: "风险预警", value: "31 项", description: "提前识别供应风险", sortOrder: 1 },
        { label: "预算偏差", value: "-8.4%", description: "材料预算偏差收敛", sortOrder: 2 },
        { label: "对账效率", value: "3 天", description: "完成批量对账闭环", sortOrder: 3 }
      ],
      timelineSteps: [
        { title: "计划校准", timeLabel: "0h", sortOrder: 0 },
        { title: "风险识别", timeLabel: "4h", sortOrder: 1 },
        { title: "供应商协同", timeLabel: "9h", sortOrder: 2 },
        { title: "合同联动", timeLabel: "14h", sortOrder: 3 },
        { title: "现场入场", timeLabel: "18h", sortOrder: 4 },
        { title: "财务闭环", timeLabel: "3 天", sortOrder: 5 }
      ],
      sortOrder: 1
    }
  ];

  for (const item of caseStudies) {
    await prisma.caseStudy.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        badge: item.badge,
        imageAssetId: caseImage.id,
        summaryParagraphs: item.summaryParagraphs,
        sortOrder: item.sortOrder,
        status: "PUBLISHED",
        publishedAt: new Date(),
        metrics: { deleteMany: {}, create: item.metrics },
        timelineSteps: { deleteMany: {}, create: item.timelineSteps }
      },
      create: {
        slug: item.slug,
        title: item.title,
        badge: item.badge,
        imageAssetId: caseImage.id,
        summaryParagraphs: item.summaryParagraphs,
        sortOrder: item.sortOrder,
        status: "PUBLISHED",
        publishedAt: new Date(),
        metrics: { create: item.metrics },
        timelineSteps: { create: item.timelineSteps }
      }
    });
  }

  await prisma.caseStudy.updateMany({
    where: { slug: { notIn: caseStudies.map((item) => item.slug) } },
    data: { status: "DRAFT" }
  });

  const whitepapers = [
    {
      slug: "pmagic-ai-construction-os-2026",
      title: "建工管理矩阵OS白皮书（2026）",
      summary: "系统了解建工管理矩阵 OS 的整体架构、核心模块与落地路径。",
      previewAssetId: whitepaperCover.id,
      documentAssetId: osDocument.id,
      sortOrder: 0
    },
    {
      slug: "pmagic-ai-agent-coordination-hub",
      title: "Agent落地协调中枢白皮书",
      summary: "聚焦多 Agent 协调中枢，说明任务编排、协同执行与业务闭环方法。",
      previewAssetId: agentPreview.id,
      documentAssetId: agentDocument.id,
      sortOrder: 1
    },
    {
      slug: "pmagic-ai-procurement-weighing-loop",
      title: "智慧采购与过磅闭环白皮书",
      summary: "围绕采购、过磅、合同与供应商协同，展示材料管理闭环。",
      previewAssetId: procurementPreview.id,
      documentAssetId: procurementDocument.id,
      sortOrder: 2
    },
    {
      slug: "pmagic-ai-bim-finance",
      title: "BIM预测与智能财务白皮书",
      summary: "说明 BIM 预测、成本预警与智能财务协同在项目管理中的应用。",
      previewAssetId: costPreview.id,
      documentAssetId: bimFinanceDocument.id,
      sortOrder: 3
    }
  ];

  for (const item of whitepapers) {
    await prisma.whitepaper.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        summary: item.summary,
        previewAssetId: item.previewAssetId,
        documentAssetId: item.documentAssetId,
        onlineUrl: null,
        downloadUrl: null,
        sortOrder: item.sortOrder,
        status: "PUBLISHED",
        publishedAt: new Date()
      },
      create: {
        ...item,
        status: "PUBLISHED",
        publishedAt: new Date()
      }
    });
  }

  await prisma.whitepaper.updateMany({
    where: { slug: { notIn: whitepapers.map((item) => item.slug) } },
    data: { status: "DRAFT" }
  });

  console.log(`Seed complete. Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Seeded cases: ${caseStudies.map((item) => item.title).join(", ")}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
