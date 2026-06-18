const header = document.querySelector("[data-header]");
const navShell = document.querySelector(".nav-shell");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
}

window.addEventListener("scroll", setHeaderState, { passive: true });
setHeaderState();

menuToggle?.addEventListener("click", () => {
  const isOpen = navShell.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
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
  ".case-stats div",
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

const motionSections = document.querySelectorAll(".metrics-section, .architecture-section");

if (!prefersReducedMotion && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        sectionObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -18% 0px", threshold: 0.16 }
  );

  motionSections.forEach((section) => {
    section.classList.add("motion-ready");
    sectionObserver.observe(section);
  });
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

  image.addEventListener("load", markLoaded);
  image.addEventListener("error", markMissing);

  if (image.complete) {
    if (image.naturalWidth > 0) {
      markLoaded();
    } else {
      markMissing();
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
