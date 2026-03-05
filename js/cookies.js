const STORAGE_KEY = "neolifeporium_cookie_prefs_v1";
const ANALYTICS_MEASUREMENT_ID = "G-XXXXXXXXXX";

const DEFAULT_PREFS = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
  updatedAt: null
};

function readPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFS, ...parsed, essential: true };
  } catch {
    return null;
  }
}

function savePrefs(prefs) {
  const data = { ...DEFAULT_PREFS, ...prefs, essential: true, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function loadAnalytics() {
  if (window.__nlpAnalyticsLoaded || ANALYTICS_MEASUREMENT_ID === "G-XXXXXXXXXX") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", ANALYTICS_MEASUREMENT_ID, { anonymize_ip: true });
  window.__nlpAnalyticsLoaded = true;
}

function applyOptionalScripts(prefs) {
  if (prefs.analytics && !window.__nlpAnalyticsLoaded) {
    loadAnalytics();
    window.dispatchEvent(new CustomEvent("nlp:analytics-enabled"));
  }

  if (prefs.marketing && !window.__nlpMarketingLoaded) {
    window.__nlpMarketingLoaded = true;
    window.dispatchEvent(new CustomEvent("nlp:marketing-enabled"));
  }
}

function buildConsentUI() {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="cookieBar" class="cookie-bar" role="region" aria-label="Cookie consent">
      <div class="cookie-content">
        <p class="cookie-title">Cookie Preferences</p>
        <p class="cookie-text">We use essential cookies for core functionality. Optional cookies help improve analytics, preferences, and communications.</p>
      </div>
      <div class="cookie-actions">
        <button class="cookie-btn" data-cookie-action="accept">Accept All</button>
        <button class="cookie-btn" data-cookie-action="reject">Reject Non-Essential</button>
        <button class="cookie-btn cookie-btn-outline" data-cookie-action="customize">Customize Settings</button>
      </div>
    </div>

    <div id="cookieModal" class="cookie-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Customize cookie settings">
      <div class="cookie-modal-backdrop" data-cookie-action="close"></div>
      <div class="cookie-panel">
        <h2>Customize Cookie Settings</h2>
        <p>Choose which optional cookies to allow. Essential cookies are always enabled.</p>

        <label class="cookie-row">
          <span>Essential</span>
          <input type="checkbox" checked disabled />
        </label>
        <label class="cookie-row">
          <span>Analytics</span>
          <input type="checkbox" id="cookieAnalytics" />
        </label>
        <label class="cookie-row">
          <span>Marketing</span>
          <input type="checkbox" id="cookieMarketing" />
        </label>
        <label class="cookie-row">
          <span>Preferences</span>
          <input type="checkbox" id="cookiePreferences" />
        </label>

        <div class="cookie-panel-actions">
          <button class="cookie-btn cookie-btn-outline" data-cookie-action="close">Cancel</button>
          <button class="cookie-btn" data-cookie-action="save">Save Preferences</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);
}

function showBar() {
  const bar = document.getElementById("cookieBar");
  if (!bar) return;
  requestAnimationFrame(() => bar.classList.add("is-visible"));
}

function hideBar() {
  const bar = document.getElementById("cookieBar");
  if (!bar) return;
  bar.classList.remove("is-visible");
}

function openModal(prefs) {
  const modal = document.getElementById("cookieModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "false");
  modal.classList.add("is-visible");

  const analytics = document.getElementById("cookieAnalytics");
  const marketing = document.getElementById("cookieMarketing");
  const preferences = document.getElementById("cookiePreferences");
  if (analytics) analytics.checked = !!prefs.analytics;
  if (marketing) marketing.checked = !!prefs.marketing;
  if (preferences) preferences.checked = !!prefs.preferences;
}

function closeModal() {
  const modal = document.getElementById("cookieModal");
  if (!modal) return;
  modal.classList.remove("is-visible");
  modal.setAttribute("aria-hidden", "true");
}

function initCookieConsent() {
  buildConsentUI();
  const stored = readPrefs();

  if (stored) {
    applyOptionalScripts(stored);
    hideBar();
  } else {
    showBar();
  }

  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.cookieAction;
    if (!action) return;

    if (action === "accept") {
      const prefs = savePrefs({ essential: true, analytics: true, marketing: true, preferences: true });
      applyOptionalScripts(prefs);
      hideBar();
      closeModal();
      return;
    }

    if (action === "reject") {
      savePrefs({ essential: true, analytics: false, marketing: false, preferences: false });
      hideBar();
      closeModal();
      return;
    }

    if (action === "customize") {
      openModal(stored || DEFAULT_PREFS);
      return;
    }

    if (action === "save") {
      const prefs = savePrefs({
        essential: true,
        analytics: !!document.getElementById("cookieAnalytics")?.checked,
        marketing: !!document.getElementById("cookieMarketing")?.checked,
        preferences: !!document.getElementById("cookiePreferences")?.checked
      });
      applyOptionalScripts(prefs);
      hideBar();
      closeModal();
      return;
    }

    if (action === "close") {
      closeModal();
    }
  });
}

initCookieConsent();
