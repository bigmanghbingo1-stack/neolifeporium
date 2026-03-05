const hasGSAP = typeof window.gsap !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

function splitLines(el) {
  if (!el || el.dataset.splitReady === "true") return;

  const source = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = source.length ? source : [el.textContent.trim()];
  el.innerHTML = lines
    .map((line) => `<span class="line-wrap"><span class="line">${line}</span></span>`)
    .join("");
  el.dataset.splitReady = "true";
}

function resetSplitVisibility() {
  document.querySelectorAll(".hero-title .line, .section-title .line").forEach((line) => {
    line.style.transform = "translateY(0)";
    line.style.opacity = "1";
  });
  document.querySelectorAll(".reveal-up").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  document.querySelectorAll(".reveal-mask").forEach((el) => {
    el.style.clipPath = "inset(0 0 0 0)";
  });
}

function setupRevealFallback() {
  const targets = document.querySelectorAll(".reveal-up, .reveal-mask, .service-card");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("io-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("io-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
  );

  targets.forEach((el) => io.observe(el));
}

function animateCounters() {
  const counters = document.querySelectorAll(".counter");
  counters.forEach((counter) => {
    const target = Number(counter.dataset.target || 0);

    if (hasGSAP && hasScrollTrigger) {
      gsap.fromTo(
        counter,
        { innerText: 0 },
        {
          innerText: target,
          duration: 1.6,
          ease: "power2.out",
          snap: { innerText: 1 },
          scrollTrigger: {
            trigger: counter,
            start: "top 86%",
            once: true
          },
          onUpdate() {
            counter.textContent = String(Math.round(counter.innerText));
          }
        }
      );
      return;
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            counter.textContent = String(target);
            observer.unobserve(counter);
          });
        },
        { threshold: 0.4 }
      );
      io.observe(counter);
    } else {
      counter.textContent = String(target);
    }
  });
}

function setupHorizontalPortfolio() {
  if (!hasGSAP || !hasScrollTrigger) return;

  const wrap = document.querySelector(".portfolio-track-wrap");
  const track = document.querySelector(".portfolio-track");
  if (!wrap || !track) return;

  const mm = gsap.matchMedia();
  mm.add("(min-width: 768px)", () => {
    const update = () => Math.max(0, track.scrollWidth - window.innerWidth);

    // Pin the track and translate it horizontally while vertical scroll continues.
    gsap.to(track, {
      x: () => -update(),
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: () => `+=${update() + window.innerHeight * 0.4}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });
  });
}

function setupServiceTilt() {
  const cards = document.querySelectorAll(".service-card");
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 8;
      const rotateX = ((y / rect.height) - 0.5) * -8;
      card.style.transform = `translateY(-6px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      card.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
      card.style.setProperty("--my", `${(y / rect.height) * 100}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "translateY(0) rotateX(0) rotateY(0)";
    });

    card.addEventListener("focus", () => {
      card.style.transform = "translateY(-4px)";
    });

    card.addEventListener("blur", () => {
      card.style.transform = "translateY(0)";
    });
  });
}

function setupSectionToneTransitions() {
  if (!hasGSAP || !hasScrollTrigger) return;

  const sections = document.querySelectorAll("section[data-tone-a][data-tone-b]");
  sections.forEach((section) => {
    const toneA = section.dataset.toneA;
    const toneB = section.dataset.toneB;

    ScrollTrigger.create({
      trigger: section,
      start: "top 52%",
      end: "bottom 48%",
      onEnter: () => gsap.to(":root", { "--tone-a": toneA, "--tone-b": toneB, duration: 0.8, ease: "power2.out" }),
      onEnterBack: () => gsap.to(":root", { "--tone-a": toneA, "--tone-b": toneB, duration: 0.8, ease: "power2.out" })
    });
  });
}

function setupAdvancedClipTransitions() {
  const items = document.querySelectorAll(".clip-advanced");

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (!hasGSAP) return;
      gsap.to(item, { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 0.6, ease: "power2.out" });
    });

    item.addEventListener("mouseleave", () => {
      if (!hasGSAP) return;
      gsap.to(item, { clipPath: "polygon(12% 0, 100% 8%, 88% 100%, 0 90%)", duration: 0.6, ease: "power2.out" });
    });
  });
}

function setupSvgMorphs() {
  const morphPaths = document.querySelectorAll("#blobPath");
  morphPaths.forEach((path) => {
    const alt = path.getAttribute("data-alt-path");
    if (!alt || !hasGSAP) return;

    gsap.to(path, {
      attr: { d: alt },
      duration: 4.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  });
}

export function initAnimations({ reducedMotion = false } = {}) {
  document.querySelectorAll(".hero-title, .section-title").forEach(splitLines);

  if (!hasGSAP || !hasScrollTrigger || reducedMotion) {
    resetSplitVisibility();
    setupRevealFallback();
    animateCounters();
    setupServiceTilt();
    setupAdvancedClipTransitions();
    return;
  }

  try {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(".hero-title .line", { yPercent: 120, opacity: 1 });
    gsap.set(".reveal-up", { y: 32, opacity: 0 });
    gsap.utils.toArray(".reveal-mask").forEach((el) => {
      const isAdvanced = el.classList.contains("clip-advanced");
      gsap.set(el, { clipPath: isAdvanced ? "polygon(12% 0, 100% 8%, 88% 100%, 0 90%)" : "inset(0 0 100% 0)" });
    });

    gsap.fromTo(
      ".hero-title .line",
      { yPercent: 120 },
      { yPercent: 0, stagger: 0.09, duration: 1.35, ease: "expo.out", delay: 0.2 }
    );

  gsap.fromTo(
    "#hero .magnetic-btn",
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, delay: 0.65, ease: "power2.out" }
  );

  if (document.querySelector(".hero-bg-layer") && document.querySelector("#hero")) {
    gsap.to(".hero-bg-layer", {
      yPercent: 14,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });
  }

  if (document.querySelector(".about-image") && document.querySelector(".about-figure")) {
    gsap.to(".about-image", {
      yPercent: -10,
      scale: 1.05,
      ease: "none",
      scrollTrigger: {
        trigger: ".about-figure",
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  gsap.utils.toArray(".reveal-up").forEach((el) => {
    gsap.fromTo(
      el,
      { y: 32, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 84%",
          once: true
        }
      }
    );
  });

  gsap.utils.toArray(".reveal-mask").forEach((el) => {
    const media = el.querySelector("img");
    const isAdvanced = el.classList.contains("clip-advanced");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true
      }
    });

    // Unmask the container and slightly scale media for a cinematic reveal.
    tl.to(
      el,
      {
        clipPath: isAdvanced ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)" : "inset(0 0 0% 0)",
        duration: 1.1,
        ease: "expo.out"
      }
    );
    if (media) {
      tl.to(media, { scale: 1.03, duration: 1.35, ease: "power2.out" }, 0);
    }
  });

  gsap.utils.toArray(".service-card").forEach((card, i) => {
    gsap.fromTo(
      card,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        delay: i * 0.04,
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          once: true
        }
      }
    );
  });

  animateCounters();
  setupHorizontalPortfolio();
  setupServiceTilt();
  setupAdvancedClipTransitions();
  setupSectionToneTransitions();
  setupSvgMorphs();

    gsap.to(".cta-bg", {
      xPercent: 3,
      yPercent: -3,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  } catch (error) {
    console.error("Animation init failed:", error);
    resetSplitVisibility();
    setupRevealFallback();
  }
}
