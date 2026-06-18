const header = document.querySelector("[data-header]");
const navShell = document.querySelector(".nav-shell");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"]')) : [];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

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

if (!prefersReducedMotion && "IntersectionObserver" in window) {
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
} else {
  motionSections.forEach((section) => section.classList.add("is-in-view"));
}

document.querySelectorAll(".asset-frame img").forEach((image) => {
  const frame = image.closest(".asset-frame");
  const markLoaded = () => {
    frame?.classList.add("has-image");
    frame?.classList.remove("is-missing");
  };
  const markMissing = () => {
    image.style.display = "none";
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
    } else {
      if (!tryFallback()) markMissing();
    }
  }
});

document.querySelectorAll("[data-autoplay-video]").forEach((video) => {
  if (!(video instanceof HTMLVideoElement)) return;

  const syncFallbackClass = () => {
    video.classList.toggle("is-fallback-video", /\.mp4(?:$|\?)/.test(video.currentSrc));
  };
  const playMutedVideo = () => {
    if (document.visibilityState !== "visible") return;
    video.play().catch(() => {});
  };

  video.addEventListener("loadedmetadata", syncFallbackClass);
  video.addEventListener("loadeddata", playMutedVideo, { once: true });
  document.addEventListener("visibilitychange", playMutedVideo);
  syncFallbackClass();
  playMutedVideo();
});
