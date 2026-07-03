const header = document.querySelector("[data-header]");
const navShell = document.querySelector(".nav-shell");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
const footerSections = Array.from(document.querySelectorAll("[data-footer-section]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const footerCompactQuery = window.matchMedia("(max-width: 860px)");
const supportsIndividualTransforms =
  window.CSS &&
  typeof window.CSS.supports === "function" &&
  window.CSS.supports("translate", "0 0") &&
  window.CSS.supports("scale", "1");
const supportsWebp =
  document.createElement("canvas").toDataURL("image/webp").indexOf("data:image/webp") === 0;

document.documentElement.classList.toggle("no-individual-transform", !supportsIndividualTransforms);
document.documentElement.classList.toggle("no-webp", !supportsWebp);

function setHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

function syncFooterSections(event = footerCompactQuery) {
  footerSections.forEach((section) => {
    section.open = !event.matches;
  });
}

syncFooterSections();
if (typeof footerCompactQuery.addEventListener === "function") {
  footerCompactQuery.addEventListener("change", syncFooterSections);
} else if (typeof footerCompactQuery.addListener === "function") {
  footerCompactQuery.addListener(syncFooterSections);
}

const navTargets = navLinks
  .map((link) => {
    const hash = link.getAttribute("href");
    const target = hash ? document.querySelector(hash) : null;
    return hash && target ? { hash, link, target } : null;
  })
  .filter(Boolean);

function setActiveNav(hash) {
  navTargets.forEach(({ hash: targetHash, link }) => {
    const isActive = targetHash === hash;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function getCurrentNavHash() {
  if (!navTargets.length) return null;

  const headerOffset = header?.offsetHeight || 0;
  if (window.scrollY <= headerOffset + 16) return "#position";

  const hashTarget = navTargets.find(({ hash }) => hash === window.location.hash);

  if (hashTarget) {
    const rect = hashTarget.target.getBoundingClientRect();
    const isHashTargetVisible = rect.top < window.innerHeight * 0.85 && rect.bottom > 0;
    if (isHashTargetVisible) return hashTarget.hash;
  }

  const activationOffset = Math.min(220, Math.max(120, window.innerHeight * 0.28));
  const probeY = window.scrollY + headerOffset + activationOffset;
  let currentHash = navTargets[0].hash;

  navTargets.forEach(({ hash, target }) => {
    if (target.offsetTop <= probeY) {
      currentHash = hash;
    }
  });

  return currentHash;
}

let navTicking = false;

function syncActiveNav() {
  const currentHash = getCurrentNavHash();
  if (currentHash) setActiveNav(currentHash);
  navTicking = false;
}

function requestActiveNavSync() {
  if (navTicking) return;
  navTicking = true;
  window.requestAnimationFrame(syncActiveNav);
}

window.addEventListener("scroll", requestActiveNavSync, { passive: true });
window.addEventListener("resize", requestActiveNavSync);
window.addEventListener("hashchange", () => setActiveNav(window.location.hash || getCurrentNavHash()));
setActiveNav(window.location.hash || getCurrentNavHash());

menuToggle?.addEventListener("click", () => {
  const isOpen = navShell.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
});

nav?.addEventListener("click", (event) => {
  const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
  if (link instanceof HTMLAnchorElement) {
    setActiveNav(link.getAttribute("href"));
    navShell.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "打开导航");
  }
});

const interactiveSelectors = [
  ".metric-card",
  ".pain-card",
  ".layer-card",
  ".module-card",
  ".final-cta",
  ".btn"
].join(",");

const interactiveCards = document.querySelectorAll(interactiveSelectors);

interactiveCards.forEach((card) => {
  card.classList.add("interactive-card");
});

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
  interactiveCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--pointer-x", `${x.toFixed(2)}%`);
      card.style.setProperty("--pointer-y", `${y.toFixed(2)}%`);
      card.classList.add("is-pointer-active");
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-pointer-active");
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
    });
  });
}

const earlyMotionSections = document.querySelectorAll(".metrics-section, .architecture-section");
const scrollMotionSections = document.querySelectorAll(
  ".modules-section, .case-section, .whitepaper-section, .final-section"
);
const motionSections = [...earlyMotionSections, ...scrollMotionSections];

if (!prefersReducedMotion && supportsIndividualTransforms && "IntersectionObserver" in window) {
  const observeSections = (sections, options) => {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        sectionObserver.unobserve(entry.target);
      });
    }, options);

    sections.forEach((section) => {
      section.classList.add("motion-ready");
      sectionObserver.observe(section);
    });
  };

  observeSections(earlyMotionSections, { rootMargin: "0px 0px 12% 0px", threshold: 0.08 });
  observeSections(scrollMotionSections, { rootMargin: "0px 0px -14% 0px", threshold: 0.18 });
  window.setTimeout(() => {
    motionSections.forEach((section) => section.classList.add("is-in-view"));
  }, 1200);
} else {
  motionSections.forEach((section) => section.classList.add("is-in-view"));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setupAssetFrames(root = document) {
  root.querySelectorAll(".asset-frame img").forEach((image) => {
    if (image.dataset.assetReady === "true") return;
    image.dataset.assetReady = "true";

    const frame = image.closest(".asset-frame");
    frame?.classList.add("is-loading");
    const enhancedSrc = image.dataset.enhancedSrc;
    if (enhancedSrc && supportsWebp) {
      image.src = enhancedSrc;
    }

    const markLoaded = () => {
      frame?.classList.add("has-image");
      frame?.classList.remove("is-loading");
      frame?.classList.remove("is-missing");
    };
    const markMissing = () => {
      image.style.display = "none";
      frame?.classList.remove("is-loading");
      frame?.classList.remove("has-image");
      frame?.classList.add("is-missing");
    };
    const tryFallback = () => {
      const fallback = image.dataset.fallback;
      if (!fallback || image.dataset.fallbackUsed === "true") return false;
      image.dataset.fallbackUsed = "true";
      image.src = fallback;
      return true;
    };

    image.addEventListener("load", markLoaded);
    image.addEventListener("error", () => {
      if (tryFallback()) return;
      markMissing();
    });

    if (image.complete) {
      if (image.naturalWidth > 0) {
        markLoaded();
      } else if (!tryFallback()) {
        markMissing();
      }
    }
  });
}

function mediaUrl(asset, fallback = "") {
  return asset?.url || fallback;
}

const staticHomepageContent = {
  caseSection: {
    title: "从真实项目中验证的智能闭环",
    cases: [
      {
        title: "湖州织东控规单元项目",
        badge: "真实案例",
        image: { url: "assets/images/case-city.webp", alt: "湖州织东控规单元项目" },
        summaryParagraphs: [
          "项目总规划面积约 15 万㎡，正处于主供货的施工高峰期，对钢筋等主材的供应要求很高。",
          "盈泰 AI 建工管理矩阵 OS 通过多 Agent 协同，快速完成采购全流程任务，保障现场施工不断档。"
        ],
        metrics: [
          { label: "全流程", value: "26 小时", description: "完成采购全链路" },
          { label: "提前", value: "62 天", description: "比原计划提前" },
          { label: "成本下降", value: "12.6%", description: "采购成本降低" },
          { label: "间接损失减少", value: "529.7 万", description: "停工损失降低" }
        ],
        timelineSteps: [
          { title: "需求识别", timeLabel: "0h" },
          { title: "供应商匹配", timeLabel: "2h" },
          { title: "在线询比价", timeLabel: "6h" },
          { title: "合同签署", timeLabel: "10h" },
          { title: "过磅追踪", timeLabel: "24h" },
          { title: "保供闭环", timeLabel: "提前 62 天" }
        ]
      },
      {
        title: "杭州未来商业综合体项目",
        badge: "真实案例",
        image: { url: "assets/images/case-city.webp", alt: "杭州未来商业综合体项目" },
        summaryParagraphs: [
          "项目处于机电、幕墙与精装交叉施工阶段，现场材料到货节奏复杂，对多专业协同要求更高。",
          "盈泰 AI 建工管理矩阵 OS 将采购计划、合同履约、过磅入场和财务对账统一串联，帮助项目团队提前识别断供与超支风险。"
        ],
        metrics: [
          { label: "协同响应", value: "18 小时", description: "完成跨专业采购响应" },
          { label: "风险预警", value: "31 项", description: "提前识别供应风险" },
          { label: "预算偏差", value: "-8.4%", description: "材料预算偏差收敛" },
          { label: "对账效率", value: "3 天", description: "完成批量对账闭环" }
        ],
        timelineSteps: [
          { title: "计划校准", timeLabel: "0h" },
          { title: "风险识别", timeLabel: "4h" },
          { title: "供应商协同", timeLabel: "9h" },
          { title: "合同联动", timeLabel: "14h" },
          { title: "现场入场", timeLabel: "18h" },
          { title: "财务闭环", timeLabel: "3 天" }
        ]
      }
    ]
  },
  whitepaperSection: {
    title: "浏览建工 AI 白皮书",
    description: "系统了解多 Agent 架构、材料闭环、成本预测与企业微信协同的落地方法。",
    whitepapers: [
      {
        title: "建工管理矩阵OS白皮书（2026）",
        summary: "系统了解建工管理矩阵 OS 的整体架构、核心模块与落地路径。",
        preview: { url: "assets/images/whitepaper-books-cover.webp" },
        onlineUrl: "uploads/whitepapers/pmagic-ai-construction-os-2026.pdf",
        downloadUrl: "uploads/whitepapers/pmagic-ai-construction-os-2026.pdf"
      },
      {
        title: "Agent落地协调中枢白皮书",
        summary: "聚焦多 Agent 协调中枢，说明任务编排、协同执行与业务闭环方法。",
        preview: { url: "assets/images/whitepaper-agent-orchestrator.webp" },
        onlineUrl: "uploads/whitepapers/pmagic-ai-agent-coordination-hub.pdf",
        downloadUrl: "uploads/whitepapers/pmagic-ai-agent-coordination-hub.pdf"
      },
      {
        title: "智慧采购与过磅闭环白皮书",
        summary: "围绕采购、过磅、合同与供应商协同，展示材料管理闭环。",
        preview: { url: "assets/images/whitepaper-procurement-loop.webp" },
        onlineUrl: "uploads/whitepapers/pmagic-ai-procurement-weighing-loop.pdf",
        downloadUrl: "uploads/whitepapers/pmagic-ai-procurement-weighing-loop.pdf"
      },
      {
        title: "BIM预测与智能财务白皮书",
        summary: "说明 BIM 预测、成本预警与智能财务协同在项目管理中的应用。",
        preview: { url: "assets/images/whitepaper-cost-forecast.webp" },
        onlineUrl: "uploads/whitepapers/pmagic-ai-bim-finance.pdf",
        downloadUrl: "uploads/whitepapers/pmagic-ai-bim-finance.pdf"
      }
    ]
  }
};

function renderHomepageContent(content) {
  renderCaseSection(content.caseSection);
  renderWhitepaperSection(content.whitepaperSection);
}

function renderCaseCard(item, index) {
  const imageUrl = mediaUrl(item.image, "assets/images/case-city.webp");
  const imageAlt = item.image?.alt || item.title;
  const paragraphs = (item.summaryParagraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("");
  const metrics = (item.metrics || [])
    .map(
      (metric) =>
        `<div><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><small>${escapeHtml(metric.description)}</small></div>`
    )
    .join("");
  const timeline = (item.timelineSteps || [])
    .map((step) => `<li><span></span><b>${escapeHtml(step.title)}</b><small>${escapeHtml(step.timeLabel)}</small></li>`)
    .join("");

  return `
    <article
      class="case-card${index === 0 ? " is-active" : ""}"
      data-case-slide="${index}"
      role="group"
      aria-roledescription="幻灯片"
      aria-label="${escapeHtml(item.title)}"
      ${index === 0 ? "" : 'aria-hidden="true"'}
    >
      <div class="asset-frame case-image" data-asset-label="案例图片">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" decoding="async" loading="lazy" />
        <div class="visual-placeholder"><span>${escapeHtml(imageAlt)}</span></div>
      </div>
      <div class="case-content">
        <div class="case-heading">
          <h3>${escapeHtml(item.title)}</h3>
          <span>${escapeHtml(item.badge)}</span>
        </div>
        ${paragraphs}
        <div class="case-stats">${metrics}</div>
        <ol class="timeline">${timeline}</ol>
      </div>
    </article>
  `;
}

function renderCaseControls(cases) {
  if (cases.length < 2) return "";

  const dots = cases
    .map(
      (item, index) => `
        <button
          class="case-dot${index === 0 ? " is-active" : ""}"
          type="button"
          role="tab"
          aria-label="${escapeHtml(item.title)}"
          aria-selected="${index === 0 ? "true" : "false"}"
          data-case-dot="${index}"
        ></button>
      `
    )
    .join("");

  return `
    <div class="case-controls">
      <button class="case-arrow case-arrow--prev" type="button" data-case-prev aria-label="上一个案例">
        <svg class="icon-chevron" aria-hidden="true"><use href="#chevron-left"></use></svg>
      </button>
      <div class="case-dots" role="tablist" aria-label="项目案例切换">${dots}</div>
      <button class="case-arrow case-arrow--next" type="button" data-case-next aria-label="下一个案例">
        <svg class="icon-chevron" aria-hidden="true"><use href="#chevron-right"></use></svg>
      </button>
    </div>
  `;
}

function setupCaseCarousel(section) {
  const carousel = section.querySelector("[data-case-carousel]");
  const track = section.querySelector("[data-case-track]");
  const viewport = section.querySelector("[data-case-viewport]");
  if (!carousel || !track || !viewport) return;

  const slides = Array.from(track.querySelectorAll("[data-case-slide]"));
  const dots = Array.from(carousel.querySelectorAll("[data-case-dot]"));
  const prevBtn = carousel.querySelector("[data-case-prev]");
  const nextBtn = carousel.querySelector("[data-case-next]");
  if (slides.length < 2) return;

  const AUTOPLAY_MS = 6000;
  const canAutoplay = !prefersReducedMotion;
  let index = 0;
  let autoTimer = null;

  const applyState = () => {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((slide, i) => {
      const isActive = i === index;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
    dots.forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });
  };

  let interactionPaused = false;
  let inView = true;

  const stopAutoplay = () => {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  };
  const startAutoplay = () => {
    // 仅在：允许自动播放、未在计时、页面可见、未被交互暂停、且轮播在视口内时才启动。
    if (!canAutoplay || autoTimer || document.hidden || interactionPaused || !inView) return;
    autoTimer = window.setInterval(() => {
      index = (index + 1) % slides.length;
      applyState();
    }, AUTOPLAY_MS);
  };
  const goTo = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    applyState();
    // 手动切换后重置计时（若正被悬停/聚焦暂停，startAutoplay 会自动保持暂停）。
    stopAutoplay();
    startAutoplay();
  };
  const pauseForInteraction = () => {
    interactionPaused = true;
    stopAutoplay();
  };
  const resumeAfterInteraction = () => {
    interactionPaused = false;
    startAutoplay();
  };

  prevBtn?.addEventListener("click", () => goTo(index - 1));
  nextBtn?.addEventListener("click", () => goTo(index + 1));
  dots.forEach((dot) => dot.addEventListener("click", () => goTo(Number(dot.dataset.caseDot))));

  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    }
  });

  // 悬停 / 聚焦时暂停自动播放，离开后恢复。
  carousel.addEventListener("pointerenter", pauseForInteraction);
  carousel.addEventListener("pointerleave", resumeAfterInteraction);
  carousel.addEventListener("focusin", pauseForInteraction);
  carousel.addEventListener("focusout", resumeAfterInteraction);

  // 切后台时暂停，回到前台恢复。
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // 仅在轮播进入视口时自动播放。
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) startAutoplay();
          else stopAutoplay();
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(carousel);
  }

  // 触摸 / 指针滑动切换；在可横向滚动的时间线上不触发，避免冲突。
  let pointerStartX = 0;
  let pointerStartY = 0;
  let swiping = false;
  viewport.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(".timeline")) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    swiping = true;
    stopAutoplay();
  });
  const endSwipe = (event) => {
    if (!swiping) return;
    swiping = false;
    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
      goTo(index + (dx < 0 ? 1 : -1));
    } else {
      startAutoplay();
    }
  };
  viewport.addEventListener("pointerup", endSwipe);
  viewport.addEventListener("pointercancel", () => {
    swiping = false;
    startAutoplay();
  });

  applyState();
  startAutoplay();
}

function renderCaseSection(caseSection) {
  const section = document.querySelector("#case");
  const title = document.querySelector("#case-title");
  const container = section?.querySelector(".container");
  const cases = Array.isArray(caseSection?.cases) ? caseSection.cases : [];
  if (!section || !title || !container || !cases.length) return;

  title.textContent = caseSection.title || title.textContent;
  const cards = cases.map(renderCaseCard).join("");
  const controls = renderCaseControls(cases);

  container.querySelector(".case-switch")?.remove();
  container.querySelector(".case-carousel")?.remove();
  container.querySelector(".case-list")?.remove();
  container.querySelector(".case-card")?.remove();
  container.insertAdjacentHTML(
    "beforeend",
    `
      <div class="case-carousel${cases.length > 1 ? "" : " is-single"}" data-case-carousel>
        <div class="case-viewport" data-case-viewport>
          <div class="case-track" data-case-track>${cards}</div>
        </div>
        ${controls}
      </div>
    `
  );

  setupAssetFrames(section);
  setupCaseCarousel(section);
}

function renderWhitepaperSection(whitepaperSection) {
  const section = document.querySelector("#whitepaper");
  const title = document.querySelector("#whitepaper-title");
  const description = section?.querySelector(".whitepaper-head p");
  const grid = section?.querySelector(".whitepaper-grid");
  if (!section || !title || !description || !grid || !whitepaperSection) return;

  title.textContent = whitepaperSection.title || title.textContent;
  description.textContent = whitepaperSection.description || description.textContent;

  const cards = (whitepaperSection.whitepapers || [])
    .map((paper) => {
      const previewUrl = mediaUrl(paper.preview, "assets/images/whitepaper-agent-orchestrator.webp");
      const downloadUrl = paper.downloadUrl || `/api/public/whitepapers/${paper.slug}/download`;
      const onlineUrl = paper.onlineUrl || paper.document?.url || downloadUrl;
      return `
        <article class="paper-card">
          <span class="bookmark" aria-hidden="true"></span>
          <div class="paper-body">
            <div class="asset-frame paper-preview" data-asset-label="${escapeHtml(paper.title)}">
              <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(paper.title)}预览" decoding="async" loading="lazy" />
              <div class="visual-placeholder"><span>${escapeHtml(paper.title)}</span></div>
            </div>
            <div class="paper-copy">
              <h3>${escapeHtml(paper.title)}</h3>
              <p>${escapeHtml(paper.summary)}</p>
            </div>
          </div>
          <div class="paper-actions">
            <a
              class="btn btn-small btn-secondary"
              href="${escapeHtml(onlineUrl)}"
              data-pdf-open
              data-pdf-url="${escapeHtml(onlineUrl)}"
              data-pdf-title="${escapeHtml(paper.title)}"
              data-pdf-download="${escapeHtml(downloadUrl)}"
            >在线浏览</a>
            <a class="btn btn-small btn-primary" href="${escapeHtml(downloadUrl)}" download>下载白皮书</a>
          </div>
        </article>
      `;
    })
    .join("");

  grid.innerHTML = `
    <div class="paper-cards">
      ${cards}
    </div>
  `;

  setupAssetFrames(section);
}

async function loadHomepageContent() {
  try {
    const response = await fetch("/api/public/homepage-content", { credentials: "same-origin" });
    if (!response.ok) {
      renderHomepageContent(staticHomepageContent);
      return;
    }
    const content = await response.json();
    renderHomepageContent(content);
  } catch {
    renderHomepageContent(staticHomepageContent);
  }
}

setupAssetFrames();
loadHomepageContent();

const demoModal = document.querySelector("[data-demo-modal]");
const demoDialog = demoModal?.querySelector(".demo-modal__dialog");
const demoForm = document.querySelector("[data-demo-form]");
const demoStatus = document.querySelector("[data-demo-status]");
const pdfModal = document.querySelector("[data-pdf-modal]");
const pdfDialog = pdfModal?.querySelector(".pdf-modal__dialog");
const pdfViewer = document.querySelector("[data-pdf-viewer]");
const pdfPages = document.querySelector("[data-pdf-pages]");
const pdfStatus = document.querySelector("[data-pdf-status]");
const pdfTitle = document.querySelector("[data-pdf-modal-title]");
const pdfDownload = document.querySelector("[data-pdf-modal-download]");
let lastFocusedElement = null;
let pdfRenderToken = 0;
let pdfObserver = null;
let pdfLoadingTask = null;
let pdfDocument = null;
let pdfScrollHandler = null;
let pdfScrollRaf = 0;

function setModalOpenState(isOpen) {
  document.body.classList.toggle("is-demo-modal-open", isOpen);
}

function openDemoModal(event) {
  event?.preventDefault();
  if (!demoModal) return;
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  demoModal.hidden = false;
  setModalOpenState(true);
  window.setTimeout(() => {
    demoModal.classList.add("is-open");
    const firstInput = demoModal.querySelector("input");
    if (firstInput instanceof HTMLElement) firstInput.focus();
  }, 0);
}

function closeDemoModal() {
  if (!demoModal) return;
  demoModal.classList.remove("is-open");
  setModalOpenState(false);
  window.setTimeout(() => {
    demoModal.hidden = true;
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }, 180);
}

function setPdfStatus(message) {
  if (pdfStatus) pdfStatus.textContent = message;
}

function clearPdfPreview() {
  pdfRenderToken += 1;
  pdfObserver?.disconnect();
  pdfObserver = null;
  if (pdfScrollHandler && pdfViewer instanceof HTMLElement) {
    pdfViewer.removeEventListener("scroll", pdfScrollHandler);
    window.removeEventListener("resize", pdfScrollHandler);
  }
  pdfScrollHandler = null;
  if (pdfScrollRaf) {
    window.cancelAnimationFrame(pdfScrollRaf);
    pdfScrollRaf = 0;
  }
  pdfLoadingTask?.destroy?.();
  pdfLoadingTask = null;
  pdfDocument?.destroy?.();
  pdfDocument = null;
  if (pdfPages) pdfPages.innerHTML = "";
  setPdfStatus("");
}

// 预取 pdf.js：白皮书区块进入视口时，用 rel=prefetch 低优先级提前把预览库和 worker 拉进缓存，
// 用户点“在线浏览”时无需再现下约 1.4MB，预览可近乎秒开。只做一次、不阻塞渲染、不执行脚本。
let pdfPrefetchDone = false;
function prefetchPdfJs() {
  if (pdfPrefetchDone) return;
  pdfPrefetchDone = true;
  ["assets/vendor/pdfjs/pdf.min.js", "assets/vendor/pdfjs/pdf.worker.min.js"].forEach((href) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "script";
    link.href = href;
    document.head.appendChild(link);
  });
}

function setupPdfPrefetch() {
  const section = document.querySelector("#whitepaper");
  if (!section) return;
  if (!("IntersectionObserver" in window)) {
    if ("requestIdleCallback" in window) window.requestIdleCallback(prefetchPdfJs);
    else window.setTimeout(prefetchPdfJs, 2500);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        prefetchPdfJs();
        observer.disconnect();
      });
    },
    { rootMargin: "500px 0px" }
  );
  observer.observe(section);
}

function ensurePdfJs() {
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/vendor/pdfjs/pdf.worker.min.js";
    return Promise.resolve(window.pdfjsLib);
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-pdfjs-loader="true"]');
    const script = existingScript || document.createElement("script");

    script.addEventListener(
      "load",
      () => {
        if (!window.pdfjsLib) {
          reject(new Error("PDF.js failed to initialize"));
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "assets/vendor/pdfjs/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error("PDF.js failed to load")), { once: true });

    if (!existingScript) {
      script.src = "assets/vendor/pdfjs/pdf.min.js";
      script.defer = true;
      script.dataset.pdfjsLoader = "true";
      document.head.appendChild(script);
    }
  });
}

async function renderPdfPage(pdf, pageNumber, shell, token) {
  if (token !== pdfRenderToken || shell.dataset.renderState) return;
  shell.dataset.renderState = "rendering";
  shell.classList.add("is-rendering");

  try {
    const page = await pdf.getPage(pageNumber);
    if (token !== pdfRenderToken) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const viewerWidth = pdfViewer instanceof HTMLElement ? pdfViewer.clientWidth : window.innerWidth;
    const availableWidth = Math.min(920, Math.max(260, viewerWidth - 36));
    const cssScale = Math.min(1.35, Math.max(0.48, availableWidth / baseViewport.width));
    const outputScale = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const renderViewport = page.getViewport({ scale: cssScale * outputScale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas is not available");

    canvas.width = Math.floor(renderViewport.width);
    canvas.height = Math.floor(renderViewport.height);
    canvas.style.width = `${Math.floor(baseViewport.width * cssScale)}px`;
    canvas.style.height = `${Math.floor(baseViewport.height * cssScale)}px`;
    canvas.setAttribute("aria-label", `第 ${pageNumber} 页`);

    await page.render({ canvasContext: context, viewport: renderViewport }).promise;
    if (token !== pdfRenderToken) return;

    shell.replaceChildren(canvas);
    shell.classList.remove("is-rendering");
    shell.classList.add("is-rendered");
    shell.dataset.renderState = "rendered";
  } catch {
    shell.classList.remove("is-rendering");
    shell.classList.add("is-error");
    shell.dataset.renderState = "error";
    shell.textContent = `第 ${pageNumber} 页加载失败`;
  }
}

async function renderPdfPreview(pdfUrl) {
  if (!pdfPages || !(pdfViewer instanceof HTMLElement)) return;
  clearPdfPreview();
  const token = pdfRenderToken;
  setPdfStatus("正在加载预览...");

  try {
    const pdfjsLib = await ensurePdfJs();
    if (token !== pdfRenderToken) return;

    // 大 PDF 提速：PDF 已做线性化（Fast Web View，首页数据在文件前部），配合流式渲染，
    // pdf.js 下载到前部字节即可渲染首页——实测 600kbps 弱网下首页约 1 秒出现（整份 2.7MB 下完约需 36 秒）。
    // disableAutoFetch 作为按需加载提示（pdf.js 3.11 的 fetch 传输仍可能在后台续传整份，但不阻塞首页显示）。
    // 服务端已支持 Range（见 static.ts），为按需取页与断点续传打下基础。
    pdfLoadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      rangeChunkSize: 65536,
      disableAutoFetch: true
    });
    pdfDocument = await pdfLoadingTask.promise;
    if (token !== pdfRenderToken) return;

    setPdfStatus(`共 ${pdfDocument.numPages} 页，向下滚动浏览`);
    const fragment = document.createDocumentFragment();
    const pageShells = [];

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const shell = document.createElement("section");
      shell.className = "pdf-page";
      shell.dataset.pageNumber = String(pageNumber);
      shell.setAttribute("aria-label", `第 ${pageNumber} 页`);
      shell.textContent = `第 ${pageNumber} 页`;
      fragment.appendChild(shell);
      pageShells.push(shell);
    }

    pdfPages.replaceChildren(fragment);
    pdfViewer.scrollTop = 0;

    const renderVisiblePages = () => {
      if (token !== pdfRenderToken || !(pdfViewer instanceof HTMLElement)) return;
      const viewerRect = pdfViewer.getBoundingClientRect();
      const preloadTop = viewerRect.top - 900;
      const preloadBottom = viewerRect.bottom + 900;
      pageShells.forEach((shell) => {
        if (shell.dataset.renderState === "rendered" || shell.dataset.renderState === "rendering") return;
        const rect = shell.getBoundingClientRect();
        if (rect.bottom >= preloadTop && rect.top <= preloadBottom) {
          renderPdfPage(pdfDocument, Number(shell.dataset.pageNumber), shell, token);
        }
      });
    };

    pdfScrollHandler = () => {
      if (pdfScrollRaf) return;
      pdfScrollRaf = window.requestAnimationFrame(() => {
        pdfScrollRaf = 0;
        renderVisiblePages();
      });
    };
    pdfViewer.addEventListener("scroll", pdfScrollHandler, { passive: true });
    window.addEventListener("resize", pdfScrollHandler);

    pdfObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const shell = entry.target;
          const pageNumber = Number(shell.dataset.pageNumber);
          renderPdfPage(pdfDocument, pageNumber, shell, token);
          if (shell.dataset.renderState === "rendered") pdfObserver?.unobserve(shell);
        });
      },
      { root: pdfViewer, rootMargin: "900px 0px", threshold: 0.01 }
    );

    pageShells.forEach((shell) => pdfObserver?.observe(shell));
    renderVisiblePages();
  } catch {
    if (token !== pdfRenderToken) return;
    if (pdfPages) pdfPages.innerHTML = "";
    setPdfStatus("预览加载失败，请下载白皮书查看。");
  }
}

function openPdfModal(control) {
  if (!pdfModal || !(pdfViewer instanceof HTMLElement)) return;
  const pdfUrl = control.dataset.pdfUrl || control.getAttribute("href") || "";
  if (!pdfUrl || pdfUrl.startsWith("#")) return;

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (pdfTitle) pdfTitle.textContent = control.dataset.pdfTitle || "白皮书预览";
  if (pdfDownload instanceof HTMLAnchorElement) {
    const downloadUrl = control.dataset.pdfDownload || pdfUrl;
    pdfDownload.href = downloadUrl;
  }

  pdfModal.hidden = false;
  setModalOpenState(true);
  window.setTimeout(() => {
    pdfModal.classList.add("is-open");
    renderPdfPreview(pdfUrl);
    pdfModal.querySelector("[data-pdf-close]")?.focus();
  }, 0);
}

function closePdfModal() {
  if (!pdfModal) return;
  pdfModal.classList.remove("is-open");
  setModalOpenState(false);
  clearPdfPreview();
  window.setTimeout(() => {
    pdfModal.hidden = true;
    if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
  }, 180);
}

document.querySelectorAll("[data-demo-open]").forEach((control) => {
  control.addEventListener("click", openDemoModal);
});

document.querySelectorAll("[data-demo-close]").forEach((control) => {
  control.addEventListener("click", closeDemoModal);
});

demoDialog?.addEventListener("click", (event) => {
  event.stopPropagation();
});

pdfDialog?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", (event) => {
  const control = event.target instanceof Element ? event.target.closest("[data-pdf-open]") : null;
  if (!(control instanceof HTMLAnchorElement)) return;
  event.preventDefault();
  openPdfModal(control);
});

document.querySelectorAll("[data-pdf-close]").forEach((control) => {
  control.addEventListener("click", closePdfModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (pdfModal?.classList.contains("is-open")) {
    closePdfModal();
  } else if (demoModal?.classList.contains("is-open")) {
    closeDemoModal();
  }
});

demoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!(demoForm instanceof HTMLFormElement)) return;
  const formData = new FormData(demoForm);
  const lead = {
    company: String(formData.get("company") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    contact: String(formData.get("contact") || "").trim(),
    createdAt: new Date().toISOString()
  };
  const leads = JSON.parse(window.localStorage.getItem("pmagic-demo-leads") || "[]");
  leads.unshift(lead);
  window.localStorage.setItem("pmagic-demo-leads", JSON.stringify(leads.slice(0, 20)));
  if (demoStatus) {
    demoStatus.textContent = "已收到预约信息，我们会尽快联系你。";
  }
  demoForm.reset();
});

document.querySelectorAll("[data-autoplay-video]").forEach((video) => {
  if (!(video instanceof HTMLVideoElement)) return;

  const media = video.closest(".hero-media");
  const prefersStaticHeroMedia = prefersReducedMotion || window.matchMedia("(max-width: 768px)").matches;
  const markVideoReady = () => {
    media?.classList.add("is-video-ready");
    media?.classList.remove("is-video-unavailable");
    media?.classList.remove("is-static-loop");
  };
  const markVideoUnavailable = () => {
    media?.classList.remove("is-video-ready");
    media?.classList.add("is-video-unavailable");
  };
  const markStaticLoop = () => {
    markVideoUnavailable();
    media?.classList.add("is-static-loop");
    video.removeAttribute("src");
    video.querySelectorAll("source").forEach((source) => {
      source.dataset.src = source.getAttribute("src") || "";
      source.removeAttribute("src");
    });
    video.load();
    video.remove();
  };
  const syncFallbackClass = () => {
    video.classList.toggle("is-fallback-video", /\.mp4(?:$|\?)/.test(video.currentSrc));
  };

  // 移动端 / 减少动态偏好：不加载视频，直接用静态海报（省流量并规避自动播放限制）。
  if (prefersStaticHeroMedia) {
    markStaticLoop();
    return;
  }

  let sourcesReady = false;
  const ensureSources = () => {
    if (sourcesReady) return;
    sourcesReady = true;
    video.preload = "metadata";
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.setAttribute("src", source.dataset.src);
    });
    video.load();
  };

  // 关键修复："放一会就不动了"的根因是原代码把任何 pause（滚动离开视口、切后台被
  // 系统暂停）都当成失败并永久隐藏视频，且没有恢复机制。改为：只有真正播放失败/解码
  // 出错才回退到海报；滚动/切后台造成的暂停属于正常状态，回到视口后自动继续播放。
  let inView = true;
  const tryPlay = () => {
    if (document.visibilityState !== "visible" || !inView) return;
    ensureSources();
    const attempt = video.play();
    if (attempt && typeof attempt.catch === "function") {
      attempt.then(markVideoReady).catch(markVideoUnavailable);
    }
  };

  video.addEventListener("loadedmetadata", syncFallbackClass);
  video.addEventListener("playing", markVideoReady);
  video.addEventListener("error", markVideoUnavailable);

  // 进入视口播放、离开视口暂停：既省电，又避免被浏览器后台策略强停后无法恢复。
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) {
            tryPlay();
          } else if (!video.paused) {
            video.pause();
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(media || video);
  }

  // 切回前台且仍在视口内时恢复播放。
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryPlay();
  });

  syncFallbackClass();
  tryPlay();
});

setupPdfPrefetch();
