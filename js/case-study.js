function getCaseId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "neolearn-rollout";
}

function text(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function html(id, value) {
  const node = document.getElementById(id);
  if (node) node.innerHTML = value;
}

function setAttr(id, attr, value) {
  const node = document.getElementById(id);
  if (node) node.setAttribute(attr, value);
}

function renderCase(study) {
  text("caseTitle", study.title);
  text("caseOverviewTitle", study.overviewTitle);
  text("caseOverviewText", study.overviewText);
  text("caseClientSector", study.clientSector);
  text("caseClientServices", study.clientServices);
  text("caseClientDuration", study.clientDuration);
  text("caseChallenge", study.challenge);
  text("caseSolution", study.solution);

  setAttr("caseHeroImage", "src", study.heroImage);
  setAttr("caseHeroImage", "alt", study.heroAlt);

  const gallery = document.getElementById("caseGallery");
  if (gallery && Array.isArray(study.gallery)) {
    gallery.innerHTML = study.gallery
      .map((image) => `<figure class="reveal-mask clip-advanced"><img src="${image.src}" loading="lazy" alt="${image.alt}" /></figure>`)
      .join("");
  }

  const results = document.getElementById("caseResults");
  if (results && Array.isArray(study.results)) {
    results.innerHTML = study.results
      .map((item) => `<article class="service-card"><p class="counter text-5xl font-display" data-target="${item.value}">0</p><p>${item.label}</p></article>`)
      .join("");
  }

  setAttr("nextProjectLink", "href", `./case-study.html?id=${study.nextId}`);
  text("nextProjectLabel", study.nextLabel);

  document.title = `Case Study | ${study.title} | Neolifeporium`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", `${study.title} case study by Neolifeporium in Ghana.`);

  window.dispatchEvent(new CustomEvent("case-study:loaded"));
}

async function initCaseStudy() {
  if (document.body.dataset.page !== "case-study") return;

  try {
    const response = await fetch("./data/case-studies.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Failed to load case studies: ${response.status}`);
    const payload = await response.json();
    const studies = payload.caseStudies || [];
    const id = getCaseId();
    const selected = studies.find((item) => item.id === id) || studies[0];
    if (!selected) return;
    renderCase(selected);
  } catch (error) {
    console.error("Case study loader error:", error);
  }
}

initCaseStudy();
