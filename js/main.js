import { initAnimations } from "./animations.js";
import { initWebGLBackground } from "./webgl.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const THEME_STORAGE_KEY = "nlp-theme-transition-v1";
const THEME_PREF_KEY = "nlp-theme-pref-v1";
const PAGE_THEMES = {
  "index.html": { toneA: "rgba(87,227,255,0.12)", toneB: "rgba(255,122,89,0.08)" },
  "about.html": { toneA: "rgba(96,165,250,0.1)", toneB: "rgba(167,139,250,0.08)" },
  "portfolio.html": { toneA: "rgba(45,212,191,0.1)", toneB: "rgba(167,139,250,0.08)" },
  "case-study.html": { toneA: "rgba(56,189,248,0.1)", toneB: "rgba(244,114,182,0.08)" },
  "blog.html": { toneA: "rgba(94,234,212,0.1)", toneB: "rgba(167,139,250,0.08)" },
  "blog-post.html": { toneA: "rgba(94,234,212,0.1)", toneB: "rgba(129,140,248,0.08)" },
  "privacy-policy.html": { toneA: "rgba(129,140,248,0.1)", toneB: "rgba(45,212,191,0.08)" },
  "terms.html": { toneA: "rgba(129,140,248,0.1)", toneB: "rgba(45,212,191,0.08)" }
};

function debounce(fn, delay = 140) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function pageKey(pathname = window.location.pathname) {
  const key = pathname.split("/").pop();
  return key && key.length ? key : "index.html";
}

function resolveTheme(pathname = window.location.pathname) {
  return PAGE_THEMES[pageKey(pathname)] || PAGE_THEMES["index.html"];
}

function initPageThemeTransition() {
  const root = document.documentElement;
  const current = resolveTheme();

  if (window.gsap && !prefersReducedMotion) {
    let previous = null;
    try {
      previous = JSON.parse(sessionStorage.getItem(THEME_STORAGE_KEY) || "null");
    } catch {
      previous = null;
    }

    if (previous?.to?.toneA && previous?.to?.toneB) {
      root.style.setProperty("--tone-a", previous.to.toneA);
      root.style.setProperty("--tone-b", previous.to.toneB);
      gsap.to(":root", { "--tone-a": current.toneA, "--tone-b": current.toneB, duration: 0.55, ease: "power2.out" });
      sessionStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      root.style.setProperty("--tone-a", current.toneA);
      root.style.setProperty("--tone-b", current.toneB);
    }
  } else {
    root.style.setProperty("--tone-a", current.toneA);
    root.style.setProperty("--tone-b", current.toneB);
  }
}

function initThemeToggle() {
  const saved = localStorage.getItem(THEME_PREF_KEY) || "dark";
  document.body.setAttribute("data-theme", saved);

  const nav = document.querySelector("#siteHeader nav");
  if (!nav || nav.querySelector(".theme-toggle")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.setAttribute("aria-label", "Toggle light and dark theme");
  button.textContent = saved === "light" ? "Dark" : "Light";

  button.addEventListener("click", () => {
    const next = document.body.getAttribute("data-theme") === "light" ? "dark" : "light";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem(THEME_PREF_KEY, next);
    button.textContent = next === "light" ? "Dark" : "Light";
  });

  nav.insertBefore(button, document.getElementById("menuToggle"));
}

function initBreadcrumbs() {
  const page = document.body.dataset.page || "home";
  if (page === "home" || page === "admin") return;

  const labelMap = {
    about: "About",
    portfolio: "Portfolio",
    "case-study": document.getElementById("caseTitle")?.textContent?.trim() || "Case Study",
    legal: window.location.pathname.includes("terms") ? "Terms" : "Privacy Policy",
    "blog-index": "Blog",
    "blog-post": "Post"
  };

  const current = labelMap[page] || "Page";
  const wrap = document.createElement("div");
  wrap.className = "breadcrumb-wrap";
  wrap.innerHTML = `
    <div class="breadcrumb-inner">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="./index.html">Home</a>
        <span>/</span>
        <span id="breadcrumbCurrent">${current}</span>
      </nav>
    </div>
  `;
  document.body.appendChild(wrap);

  const updateCurrent = (value) => {
    const node = document.getElementById("breadcrumbCurrent");
    if (node && value) node.textContent = value;
  };

  window.addEventListener("case-study:loaded", () => {
    const title = document.getElementById("caseTitle")?.textContent?.trim();
    updateCurrent(title || "Case Study");
  });

  window.addEventListener("blog:post-loaded", (event) => {
    updateCurrent(event.detail?.title || "Post");
  });
}

function initLenis() {
  if (prefersReducedMotion || typeof window.Lenis === "undefined") {
    return {
      scrollTo: (target) => {
        const node = typeof target === "string" ? document.querySelector(target) : target;
        node?.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.15
  });

  if (window.gsap && window.ScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  return lenis;
}

function initPreloader(onDone) {
  const preloader = document.getElementById("preloader");
  const bar = document.getElementById("preloaderBar");
  const logoText = document.querySelector(".preloader-logo-text");
  const logoPath = document.getElementById("logoPath");

  if (!preloader || !bar) {
    onDone();
    return;
  }

  try {
    if (window.gsap && !prefersReducedMotion) {
      if (logoText) {
        gsap.fromTo(logoText, { yPercent: 120 }, { yPercent: 0, duration: 1, ease: "expo.out" });
      }

      if (logoPath && typeof logoPath.getTotalLength === "function") {
        const pathLength = logoPath.getTotalLength();
        const altPath = logoPath.getAttribute("data-alt-path");
        logoPath.style.strokeDasharray = `${pathLength}`;
        logoPath.style.strokeDashoffset = `${pathLength}`;

        const pathTl = gsap.timeline();
        pathTl.to(logoPath, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" });
        if (altPath) {
          pathTl.to(logoPath, { attr: { d: altPath }, duration: 0.85, ease: "power2.inOut" }, "-=0.45");
        }
      }
    }
  } catch (error) {
    console.error("Preloader logo animation failed:", error);
  }

  // Track only above-the-fold / eager assets. Lazy images can load later.
  const assets = Array.from(document.querySelectorAll("img")).filter(
    (img) => img.loading !== "lazy" || img.getAttribute("fetchpriority") === "high"
  );
  const total = assets.length;
  let loaded = 0;
  let finished = false;
  const forceTimer = window.setTimeout(() => {
    bar.style.width = "100%";
    finish();
  }, 2600);

  const finish = () => {
    if (finished) return;
    finished = true;
    if (window.gsap && !prefersReducedMotion) {
      gsap.to(preloader, {
        autoAlpha: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          preloader.remove();
          onDone();
        }
      });
    } else {
      preloader.remove();
      onDone();
    }
  };

  const updateBar = () => {
    if (finished) return;
    loaded += 1;
    const pct = total > 0 ? Math.min((loaded / total) * 100, 100) : 100;
    bar.style.width = `${pct}%`;
    if (loaded >= total) {
      window.clearTimeout(forceTimer);
      window.setTimeout(finish, 220);
    }
  };

  if (total === 0) {
    bar.style.width = "100%";
    window.clearTimeout(forceTimer);
    window.setTimeout(finish, 120);
    return;
  }

  assets.forEach((img) => {
    if (img.complete) {
      updateBar();
      return;
    }
    img.addEventListener("load", updateBar, { once: true });
    img.addEventListener("error", updateBar, { once: true });
  });
}

function initHeaderState() {
  const header = document.getElementById("siteHeader");
  if (!header) return;
  let ticking = false;

  const onScroll = () => {
    ticking = false;
    if (window.scrollY > 28) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  onScroll();
}

function initOverlayMenu(lenis) {
  const toggle = document.getElementById("menuToggle");
  const overlay = document.getElementById("overlayMenu");
  const links = Array.from(document.querySelectorAll(".overlay-link"));

  if (!toggle || !overlay) return;

  let open = false;
  let tl;

  if (window.gsap && !prefersReducedMotion) {
    tl = gsap.timeline({ paused: true })
      .to(overlay, { autoAlpha: 1, pointerEvents: "auto", duration: 0.4, ease: "power2.out" })
      .to(links, { yPercent: 0, opacity: 1, stagger: 0.07, duration: 0.55, ease: "expo.out" }, "<0.12");
  }

  const setMenu = (next) => {
    open = next;
    toggle.classList.toggle("is-active", open);
    toggle.setAttribute("aria-expanded", String(open));
    overlay.setAttribute("aria-hidden", String(!open));
    overlay.toggleAttribute("inert", !open);

    if (open) {
      document.body.style.overflow = "hidden";
      if (tl) tl.play(0);
      if (lenis.stop) lenis.stop();
    } else {
      document.body.style.overflow = "";
      if (tl) tl.reverse();
      if (lenis.start) lenis.start();
      if (!tl) {
        overlay.style.opacity = "0";
        overlay.style.pointerEvents = "none";
      }
    }

    if (!tl && open) {
      overlay.style.opacity = "1";
      overlay.style.pointerEvents = "auto";
      links.forEach((link) => {
        link.style.opacity = "1";
        link.style.transform = "translateY(0)";
      });
    }
  };

  toggle.addEventListener("click", () => setMenu(!open));

  links.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) setMenu(false);
  });
}

function initCursor() {
  const cursor = document.querySelector(".custom-cursor");
  if (!cursor || window.matchMedia("(pointer: coarse)").matches || prefersReducedMotion) return;

  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;
  let cx = tx;
  let cy = ty;

  const update = () => {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx - 9}px, ${cy - 9}px)`;
    requestAnimationFrame(update);
  };

  document.addEventListener("pointermove", (event) => {
    tx = event.clientX;
    ty = event.clientY;
    cursor.style.opacity = "1";
  });

  document.addEventListener("pointerdown", () => cursor.classList.add("is-active"));
  document.addEventListener("pointerup", () => cursor.classList.remove("is-active"));

  document.querySelectorAll("a, button, [data-cursor]").forEach((node) => {
    node.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    node.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });

  requestAnimationFrame(update);
}

function initMagnetic() {
  const magnets = document.querySelectorAll(".magnetic-btn");
  magnets.forEach((btn) => {
    btn.addEventListener("pointermove", (event) => {
      const rect = btn.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
    });

    btn.addEventListener("pointerleave", () => {
      btn.style.transform = "translate(0, 0)";
    });
  });
}

function initPortfolioFilters() {
  const buttons = Array.from(document.querySelectorAll(".filter-btn"));
  const items = Array.from(document.querySelectorAll(".portfolio-grid-item"));
  if (!buttons.length || !items.length) return;

  const animateVisible = () => {
    const visible = items.filter((item) => !item.classList.contains("is-hidden"));
    if (window.gsap && !prefersReducedMotion) {
      gsap.fromTo(visible, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: "power2.out" });
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      buttons.forEach((b) => {
        const active = b === button;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      items.forEach((item) => {
        const categories = (item.dataset.category || "").split(" ");
        const show = filter === "all" || categories.includes(filter);
        item.classList.toggle("is-hidden", !show);
      });

      animateVisible();
    });
  });

  animateVisible();
}

function initLegalFade() {
  const nodes = document.querySelectorAll(".legal-fade");
  if (!nodes.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1 }
  );

  nodes.forEach((node) => io.observe(node));
}

function initReadingProgress() {
  const bar = document.getElementById("readingProgressBar");
  if (!bar) return;

  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;
    bar.style.width = `${ratio}%`;
  };

  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initScrollSpy(lenis) {
  const links = Array.from(document.querySelectorAll(".legal-toc a[href^='#']"));
  if (!links.length) return;

  const targets = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (links[0]) links[0].classList.add("is-active");

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const href = link.getAttribute("href");
      if (href) lenis.scrollTo(href, { offset: -90, immediate: false });
    });
  });

  if (!("IntersectionObserver" in window)) return;

  const byId = new Map(links.map((link) => [link.getAttribute("href"), link]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.remove("is-active"));
        const active = byId.get(`#${entry.target.id}`);
        if (active) active.classList.add("is-active");
      });
    },
    { rootMargin: "-30% 0px -55% 0px", threshold: 0.1 }
  );

  targets.forEach((node) => io.observe(node));
}

function initPageTransition(lenis) {
  const layer = document.querySelector(".page-transition");
  const loader = document.getElementById("transitionFill");
  const loaderWrap = document.querySelector(".transition-loader");
  if (!layer || !loader || !loaderWrap) return;

  const animateOverlay = (onMidpoint) => {
    if (!window.gsap || prefersReducedMotion) {
      onMidpoint();
      return;
    }

    gsap.set(loader, { width: "0%" });
    const tl = gsap.timeline();

    // Loader-first page wipe used for hash navigation and internal page hops.
    tl.to(layer, { scaleY: 1, transformOrigin: "bottom", duration: 0.34, ease: "power2.inOut" })
      .to(loaderWrap, { autoAlpha: 1, duration: 0.15 }, "<")
      .to(loader, { width: "100%", duration: 0.52, ease: "power2.out" }, "<0.08")
      .add(onMidpoint, ">-0.08")
      .to(loaderWrap, { autoAlpha: 0, duration: 0.18 })
      .to(layer, { scaleY: 0, transformOrigin: "top", duration: 0.45, ease: "power2.inOut" });
  };

  document.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") || "";
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || link.target === "_blank" || link.hasAttribute("download")) return;

      const isHash = href.startsWith("#");
      if (isHash) {
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(href, { offset: -20, immediate: false });
        return;
      }

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      const payload = { from: resolveTheme(window.location.pathname), to: resolveTheme(url.pathname) };
      sessionStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(payload));
      animateOverlay(() => {
        window.location.href = url.href;
      });
    });
  });
}

function initTestimonials() {
  const items = Array.from(document.querySelectorAll(".testimonial"));
  if (items.length <= 1) return;

  items.forEach((item, i) => {
    const active = i === 0;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-hidden", active ? "false" : "true");
  });

  let index = 0;
  const cycle = () => {
    const current = items[index];
    index = (index + 1) % items.length;
    const next = items[index];

    current.classList.remove("is-active");
    current.setAttribute("aria-hidden", "true");
    next.classList.add("is-active");
    next.setAttribute("aria-hidden", "false");

    if (window.gsap && !prefersReducedMotion) {
      gsap.fromTo(next, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" });
    }
  };

  window.setInterval(cycle, 4200);
}

function initResizeRefresh() {
  if (!(window.gsap && window.ScrollTrigger)) return;
  const refresh = debounce(() => ScrollTrigger.refresh(), 220);
  window.addEventListener("resize", refresh);
}

function boot() {
  const lenis = initLenis();
  initPageThemeTransition();
  initThemeToggle();
  initBreadcrumbs();
  let started = false;
  const pageType = document.body.dataset.page || "default";
  const safeRun = (fn, label) => {
    try {
      fn();
    } catch (error) {
      console.error(`${label} failed:`, error);
    }
  };

  const startExperience = () => {
    if (started) return;
    started = true;
    safeRun(() => initHeaderState(), "Header");
    safeRun(() => initOverlayMenu(lenis), "Overlay menu");
    safeRun(() => initCursor(), "Cursor");
    safeRun(() => initMagnetic(), "Magnetic buttons");
    safeRun(() => initPageTransition(lenis), "Page transition");
    safeRun(() => initTestimonials(), "Testimonials");
    safeRun(() => initPortfolioFilters(), "Portfolio filters");
    safeRun(() => initLegalFade(), "Legal fade");
    safeRun(() => initReadingProgress(), "Reading progress");
    safeRun(() => initScrollSpy(lenis), "Scroll spy");
    if (pageType !== "legal") {
      safeRun(() => initWebGLBackground({ reducedMotion: prefersReducedMotion }), "WebGL");
      safeRun(() => initAnimations({ reducedMotion: prefersReducedMotion }), "Animations");
      window.addEventListener("case-study:loaded", () => {
        safeRun(() => initAnimations({ reducedMotion: prefersReducedMotion }), "Case animations refresh");
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, { once: true });
    }
    safeRun(() => initResizeRefresh(), "Resize refresh");
    document.querySelector(".cta-bg")?.classList.add("noise-motion");
  };

  window.setTimeout(() => {
    document.getElementById("preloader")?.remove();
    startExperience();
  }, 4200);

  initPreloader(() => {
    startExperience();
  });
}

boot();
