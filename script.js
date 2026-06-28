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

function renderCaseSection(caseSection) {
  const section = document.querySelector("#case");
  const title = document.querySelector("#case-title");
  const container = section?.querySelector(".container");
  const cases = Array.isArray(caseSection?.cases) ? caseSection.cases : [];
  if (!section || !title || !container || !cases.length) return;

  title.textContent = caseSection.title || title.textContent;
  const cards = cases
    .map((item) => {
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
        <div class="case-card">
          <div class="asset-frame case-image" data-asset-label="案例图片">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" decoding="async" />
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
        </div>
      `;
    })
    .join("");

  container.querySelector(".case-list")?.remove();
  container.querySelector(".case-card")?.remove();
  container.insertAdjacentHTML(
    "beforeend",
    `
      <div class="case-list">${cards}</div>
    `
  );

  setupAssetFrames(section);
}

function renderWhitepaperSection(whitepaperSection) {
  const section = document.querySelector("#whitepaper");
  const title = document.querySelector("#whitepaper-title");
  const description = section?.querySelector(".whitepaper-head p");
  const grid = section?.querySelector(".whitepaper-grid");
  if (!section || !title || !description || !grid || !whitepaperSection) return;

  title.textContent = whitepaperSection.title || title.textContent;
  description.textContent = whitepaperSection.description || description.textContent;

  const coverUrl = mediaUrl(whitepaperSection.cover, "assets/images/whitepaper-books-cover.png").replace(
    "whitepaper-books-cover.webp",
    "whitepaper-books-cover.png"
  );
  const cards = (whitepaperSection.whitepapers || [])
    .map((paper) => {
      const previewUrl = mediaUrl(paper.preview, "assets/images/whitepaper-agent-orchestrator.webp");
      const onlineUrl = paper.onlineUrl || "#whitepaper-title";
      const downloadUrl = paper.downloadUrl || `/api/public/whitepapers/${paper.slug}/download`;
      return `
        <article class="paper-card">
          <span class="bookmark" aria-hidden="true"></span>
          <h3>${escapeHtml(paper.title)}</h3>
          <p>${escapeHtml(paper.summary)}</p>
          <div class="asset-frame paper-preview" data-asset-label="${escapeHtml(paper.title)}">
            <img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(paper.title)}预览" decoding="async" />
            <div class="visual-placeholder"><span>${escapeHtml(paper.title)}</span></div>
          </div>
          <div class="paper-actions">
            <a class="btn btn-small btn-secondary" href="${escapeHtml(onlineUrl)}">在线浏览</a>
            <a class="btn btn-small btn-primary" href="${escapeHtml(downloadUrl)}">下载白皮书</a>
          </div>
        </article>
      `;
    })
    .join("");

  grid.innerHTML = `
    <div class="asset-frame books-asset" data-asset-label="白皮书书本">
      <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(whitepaperSection.title)}" decoding="async" />
      <div class="visual-placeholder"><span>${escapeHtml(whitepaperSection.title)}</span></div>
    </div>
    <div class="paper-cards">
      ${cards}
    </div>
  `;

  setupAssetFrames(section);
}

async function loadHomepageContent() {
  try {
    const response = await fetch("/api/public/homepage-content", { credentials: "same-origin" });
    if (!response.ok) return;
    const content = await response.json();
    renderCaseSection(content.caseSection);
    renderWhitepaperSection(content.whitepaperSection);
  } catch {
    // Keep the static HTML content as the public fallback.
  }
}

setupAssetFrames();
loadHomepageContent();

const demoModal = document.querySelector("[data-demo-modal]");
const demoDialog = demoModal?.querySelector(".demo-modal__dialog");
const demoForm = document.querySelector("[data-demo-form]");
const demoStatus = document.querySelector("[data-demo-status]");
let lastFocusedElement = null;

function openDemoModal(event) {
  event?.preventDefault();
  if (!demoModal) return;
  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  demoModal.hidden = false;
  document.body.classList.add("is-demo-modal-open");
  window.setTimeout(() => {
    demoModal.classList.add("is-open");
    const firstInput = demoModal.querySelector("input");
    if (firstInput instanceof HTMLElement) firstInput.focus();
  }, 0);
}

function closeDemoModal() {
  if (!demoModal) return;
  demoModal.classList.remove("is-open");
  document.body.classList.remove("is-demo-modal-open");
  window.setTimeout(() => {
    demoModal.hidden = true;
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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && demoModal?.classList.contains("is-open")) {
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
    video.pause();
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
  const playMutedVideo = () => {
    if (prefersStaticHeroMedia) {
      markStaticLoop();
      return;
    }
    if (document.visibilityState !== "visible") return;
    video.preload = "metadata";
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.setAttribute("src", source.dataset.src);
    });
    video.load();
    video.play().then(markVideoReady).catch(markVideoUnavailable);
  };

  video.addEventListener("loadedmetadata", syncFallbackClass);
  video.addEventListener("playing", markVideoReady);
  video.addEventListener("pause", () => {
    if (!video.ended) markVideoUnavailable();
  });
  video.addEventListener("error", markVideoUnavailable);
  document.addEventListener("visibilitychange", playMutedVideo);
  syncFallbackClass();
  playMutedVideo();
});
