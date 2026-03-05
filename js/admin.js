const ADMIN_PASSWORD = "NeolifeAdmin2026";
const POSTS_OVERRIDE_KEY = "nlp_posts_override_v1";
const SESSION_KEY = "nlp_admin_auth_v1";

const state = { posts: [], editingId: null };

function qs(id) { return document.getElementById(id); }

async function loadPosts() {
  // Local storage-backed CMS layer; replace with remote persistence when backend is introduced.
  const override = localStorage.getItem(POSTS_OVERRIDE_KEY);
  if (override) {
    try {
      const parsed = JSON.parse(override);
      if (Array.isArray(parsed.posts)) return parsed.posts;
    } catch {}
  }
  const res = await fetch("./data/posts.json", { cache: "no-store" });
  const data = await res.json();
  return data.posts || [];
}

function persist() {
  localStorage.setItem(POSTS_OVERRIDE_KEY, JSON.stringify({ posts: state.posts }));
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function readingTime(html) {
  const words = (html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function renderList() {
  const list = qs("adminPosts");
  if (!list) return;
  list.innerHTML = state.posts
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((p) => `
      <article class="service-card">
        <h3 class="service-title text-xl">${p.title}</h3>
        <p>${p.category} . ${p.slug}</p>
        <p>${p.draft ? "Draft" : "Published"} . ${p.featured ? "Featured" : "Standard"}</p>
        <div class="cookie-actions mt-2">
          <button class="cookie-btn" data-edit="${p.id}">Edit</button>
          <button class="cookie-btn cookie-btn-outline" data-delete="${p.id}">Delete</button>
        </div>
      </article>
    `)
    .join("");
}

function resetForm() {
  qs("postForm")?.reset();
  qs("postId").value = "";
  qs("postContent").innerHTML = "<p></p>";
  qs("postPreview").innerHTML = "";
  state.editingId = null;
}

function fillForm(post) {
  qs("postId").value = post.id;
  qs("postTitle").value = post.title;
  qs("postSlug").value = post.slug;
  qs("postExcerpt").value = post.excerpt;
  qs("postCategory").value = post.category;
  qs("postTags").value = (post.tags || []).join(", ");
  qs("postDate").value = post.date;
  qs("postAuthorName").value = post.author?.name || "";
  qs("postAuthorRole").value = post.author?.role || "";
  qs("postImage").value = post.featuredImage;
  qs("postMeta").value = post.metaDescription || "";
  qs("postDraft").checked = !!post.draft;
  qs("postFeatured").checked = !!post.featured;
  qs("postContent").innerHTML = post.content || "<p></p>";
  state.editingId = post.id;
}

function upsertFromForm() {
  const idField = qs("postId").value;
  const title = qs("postTitle").value.trim();
  if (!title) return;

  const generatedSlug = slugify(qs("postSlug").value || title);
  const payload = {
    id: idField ? Number(idField) : Date.now(),
    slug: generatedSlug,
    title,
    excerpt: qs("postExcerpt").value.trim(),
    content: qs("postContent").innerHTML,
    author: { name: qs("postAuthorName").value.trim(), role: qs("postAuthorRole").value.trim() },
    date: qs("postDate").value || new Date().toISOString().slice(0, 10),
    featuredImage: qs("postImage").value.trim() || "./assets/images/hero-photo.jpg",
    category: qs("postCategory").value.trim() || "General",
    tags: qs("postTags").value.split(",").map((t) => t.trim()).filter(Boolean),
    metaDescription: qs("postMeta").value.trim(),
    featured: qs("postFeatured").checked,
    draft: qs("postDraft").checked
  };

  const idx = state.posts.findIndex((p) => p.id === payload.id);
  if (idx >= 0) state.posts[idx] = payload;
  else state.posts.push(payload);

  if (payload.featured) {
    state.posts = state.posts.map((p) => ({ ...p, featured: p.id === payload.id }));
  }

  persist();
  renderList();
}

function renderPreview() {
  const preview = qs("postPreview");
  preview.innerHTML = `
    <h2 class="service-title text-2xl">${qs("postTitle").value || "Untitled Post"}</h2>
    <p class="text-white/60 text-sm mt-1">${qs("postAuthorName").value || "Author"} . ${qs("postDate").value || new Date().toISOString().slice(0,10)} . ${readingTime(qs("postContent").innerHTML)} min read</p>
    <img class="mt-3 rounded-xl" src="${qs("postImage").value || "./assets/images/hero-photo.jpg"}" alt="Preview image" />
    <div class="mt-4 text-white/80">${qs("postContent").innerHTML}</div>
  `;
}

function bindEvents() {
  qs("postTitle").addEventListener("blur", () => {
    if (!qs("postSlug").value.trim()) qs("postSlug").value = slugify(qs("postTitle").value);
  });

  qs("newPost").addEventListener("click", resetForm);
  qs("previewPost").addEventListener("click", renderPreview);
  qs("savePost").addEventListener("click", () => {
    upsertFromForm();
    alert("Saved to local content store.");
  });

  qs("postImageUpload").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      qs("postImage").value = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

  qs("adminPosts").addEventListener("click", (event) => {
    const edit = event.target.closest("[data-edit]");
    const del = event.target.closest("[data-delete]");
    if (edit) {
      const post = state.posts.find((p) => p.id === Number(edit.dataset.edit));
      if (post) fillForm(post);
      return;
    }
    if (del) {
      const id = Number(del.dataset.delete);
      state.posts = state.posts.filter((p) => p.id !== id);
      persist();
      renderList();
      if (state.editingId === id) resetForm();
    }
  });
}

async function initAdmin() {
  const gate = qs("adminGate");
  const panel = qs("adminPanel");

  const authed = sessionStorage.getItem(SESSION_KEY) === "1";
  if (authed) {
    gate.hidden = true;
    panel.hidden = false;
  }

  qs("adminLogin").addEventListener("submit", (event) => {
    event.preventDefault();
    const pass = qs("adminPassword").value;
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      gate.hidden = true;
      panel.hidden = false;
    } else {
      qs("adminLoginError").textContent = "Invalid password.";
    }
  });

  state.posts = await loadPosts();
  renderList();
  bindEvents();
}

initAdmin();
