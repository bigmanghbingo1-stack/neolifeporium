const POSTS_OVERRIDE_KEY = "nlp_posts_override_v1";

function debounce(fn, delay = 220) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

async function loadPosts() {
  // Swappable data adapter: replace this with API calls (Strapi/Sanity/Firebase/Supabase/WordPress) later.
  const override = localStorage.getItem(POSTS_OVERRIDE_KEY);
  if (override) {
    try {
      const parsed = JSON.parse(override);
      if (Array.isArray(parsed.posts)) return parsed.posts;
    } catch {
      // fall through to file
    }
  }

  const res = await fetch("./data/posts.json", { cache: "no-store" });
  const data = await res.json();
  return data.posts || [];
}

function byNewest(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function formatDate(raw) {
  return new Date(raw).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function readingTimeFromHtml(html) {
  const txt = (html || "").replace(/<[^>]+>/g, " ").trim();
  const words = txt.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function slugFromUrl() {
  const qs = new URLSearchParams(window.location.search);
  return qs.get("slug") || "";
}

function updateMetaForPost(post) {
  document.title = `${post.title} | Neolifeporium Blog`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", post.metaDescription || post.excerpt || "");
  const canonical = document.querySelector('link[rel="canonical"]');
  const canonicalUrl = `https://www.neolifeporium.com/blog-post.html?slug=${post.slug}`;
  if (canonical) canonical.setAttribute("href", canonicalUrl);

  const setMeta = (selector, attr, value) => {
    const node = document.querySelector(selector);
    if (node) node.setAttribute(attr, value);
  };

  setMeta('meta[property="og:title"]', "content", post.title);
  setMeta('meta[property="og:description"]', "content", post.metaDescription || post.excerpt || "");
  setMeta('meta[property="og:url"]', "content", canonicalUrl);
  setMeta('meta[property="og:image"]', "content", `https://www.neolifeporium.com/${post.featuredImage.replace(/^\.\//, "")}`);
  setMeta('meta[name="twitter:title"]', "content", post.title);
  setMeta('meta[name="twitter:description"]', "content", post.metaDescription || post.excerpt || "");
  setMeta('meta[name="twitter:image"]', "content", `https://www.neolifeporium.com/${post.featuredImage.replace(/^\.\//, "")}`);
}

function injectPostJsonLd(post) {
  const canonicalUrl = `https://www.neolifeporium.com/blog-post.html?slug=${post.slug}`;
  const image = `https://www.neolifeporium.com/${post.featuredImage.replace(/^\.\//, "")}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: post.author?.name || "Neolifeporium Editorial"
    },
    image,
    mainEntityOfPage: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: "Neolifeporium Limited",
      logo: { "@type": "ImageObject", url: "https://www.neolifeporium.com/assets/images/hero-photo.jpg" }
    }
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.neolifeporium.com/index.html" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.neolifeporium.com/blog.html" },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl }
    ]
  };

  const author = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: post.author?.name || "Neolifeporium Editorial",
    worksFor: { "@type": "Organization", name: "Neolifeporium Limited" }
  };

  [article, breadcrumbs, author].forEach((payload, idx) => {
    const node = document.createElement("script");
    node.type = "application/ld+json";
    node.id = `post-jsonld-${idx}`;
    node.textContent = JSON.stringify(payload);
    document.head.appendChild(node);
  });
}

function maybeHighlightCode() {
  if (window.hljs) window.hljs.highlightAll();
}

function shareUrl() {
  return encodeURIComponent(window.location.href);
}

function shareText(title) {
  return encodeURIComponent(title);
}

function renderRelated(posts, current) {
  const container = document.getElementById("relatedPosts");
  if (!container) return;
  const related = posts.filter((p) => p.slug !== current.slug && p.category === current.category).slice(0, 3);
  container.innerHTML = related
    .map((p) => `
      <article class="portfolio-grid-item">
        <img loading="lazy" src="${p.featuredImage}" alt="${p.title}" />
        <div class="portfolio-overlay"><h3>${p.title}</h3><p>${p.category}</p><a href="./blog-post.html?slug=${p.slug}" class="inline-block mt-2 text-xs tracking-[0.16em] uppercase">Read +</a></div>
      </article>
    `)
    .join("");
}

function renderPost(posts) {
  const slug = slugFromUrl();
  const post = posts.find((p) => p.slug === slug && !p.draft) || posts.find((p) => !p.draft);
  if (!post) return;

  document.getElementById("postTitle").textContent = post.title;
  document.getElementById("postExcerpt").textContent = post.excerpt;
  document.getElementById("postAuthor").textContent = post.author?.name || "Neolifeporium Editorial";
  document.getElementById("postDate").textContent = formatDate(post.date);
  document.getElementById("postImage").src = post.featuredImage;
  document.getElementById("postImage").alt = post.title;
  document.getElementById("postContent").innerHTML = post.content;
  document.getElementById("postReadingTime").textContent = `${readingTimeFromHtml(post.content)} min read`;

  const tags = document.getElementById("postTags");
  tags.innerHTML = (post.tags || []).map((t) => `<span class="filter-btn is-active">${t}</span>`).join(" ");

  document.getElementById("shareX").href = `https://twitter.com/intent/tweet?url=${shareUrl()}&text=${shareText(post.title)}`;
  document.getElementById("shareLinkedIn").href = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl()}`;
  document.getElementById("shareFacebook").href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl()}`;

  updateMetaForPost(post);
  injectPostJsonLd(post);
  renderRelated(posts, post);
  maybeHighlightCode();
  window.dispatchEvent(new CustomEvent("blog:post-loaded", { detail: { title: post.title } }));
}

function createCard(post) {
  return `
    <article class="portfolio-grid-item blog-card" data-category="${post.category.toLowerCase()}" data-search="${`${post.title} ${post.excerpt} ${(post.tags || []).join(" ")}`.toLowerCase()}">
      <img loading="lazy" src="${post.featuredImage}" alt="${post.title}" />
      <div class="portfolio-overlay">
        <h3>${post.title}</h3>
        <p>${post.category} . ${formatDate(post.date)}</p>
        <a href="./blog-post.html?slug=${post.slug}" class="inline-block mt-2 text-xs tracking-[0.16em] uppercase">Read Article +</a>
      </div>
    </article>
  `;
}

function renderBlogIndex(posts) {
  const featuredWrap = document.getElementById("featuredPost");
  const grid = document.getElementById("blogGrid");
  const loadMoreBtn = document.getElementById("loadMorePosts");
  const categoryWrap = document.getElementById("blogCategoryFilters");
  const searchInput = document.getElementById("blogSearch");
  if (!featuredWrap || !grid || !loadMoreBtn || !categoryWrap || !searchInput) return;

  let visibleCount = 6;
  let currentCategory = "all";
  let currentQuery = "";

  const clean = posts.filter((p) => !p.draft).sort(byNewest);
  const featured = clean.find((p) => p.featured) || clean[0];
  if (featured) {
    featuredWrap.innerHTML = `
      <article class="portfolio-grid-item">
        <img loading="eager" src="${featured.featuredImage}" alt="${featured.title}" />
        <div class="portfolio-overlay"><h3>${featured.title}</h3><p>${featured.category} . ${formatDate(featured.date)}</p><a href="./blog-post.html?slug=${featured.slug}" class="inline-block mt-2 text-xs tracking-[0.16em] uppercase">Read Featured +</a></div>
      </article>
    `;
  }

  const categories = ["all", ...new Set(clean.map((p) => p.category.toLowerCase()))];
  categoryWrap.innerHTML = categories
    .map((c, i) => `<button class="filter-btn ${i === 0 ? "is-active" : ""}" data-blog-filter="${c}" aria-pressed="${i === 0 ? "true" : "false"}">${c}</button>`)
    .join("");

  const getFiltered = () => clean.filter((p) => {
    const inCat = currentCategory === "all" || p.category.toLowerCase() === currentCategory;
    const inQuery = !currentQuery || `${p.title} ${p.excerpt} ${(p.tags || []).join(" ")}`.toLowerCase().includes(currentQuery);
    return inCat && inQuery;
  });

  const renderList = () => {
    const filtered = getFiltered();
    const slice = filtered.slice(0, visibleCount);
    grid.innerHTML = slice.map(createCard).join("");

    if (window.gsap) {
      gsap.fromTo("#blogGrid .blog-card", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.04, ease: "power2.out" });
    }

    loadMoreBtn.hidden = slice.length >= filtered.length;
  };

  categoryWrap.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-blog-filter]");
    if (!btn) return;
    currentCategory = btn.dataset.blogFilter || "all";
    visibleCount = 6;

    categoryWrap.querySelectorAll("button").forEach((node) => {
      const active = node === btn;
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-pressed", String(active));
    });

    renderList();
  });

  searchInput.addEventListener("input", debounce((event) => {
    currentQuery = event.target.value.trim().toLowerCase();
    visibleCount = 6;
    renderList();
  }, 220));

  loadMoreBtn.addEventListener("click", () => {
    visibleCount += 6;
    renderList();
  });

  renderList();
}

async function initBlog() {
  const posts = await loadPosts();
  if (document.body.dataset.page === "blog-index") {
    renderBlogIndex(posts);
  }
  if (document.body.dataset.page === "blog-post") {
    renderPost(posts);
  }
}

initBlog();
