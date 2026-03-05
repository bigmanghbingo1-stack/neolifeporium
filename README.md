# Neolifeporium Website

Premium multi-page marketing + content-managed static website for Neolifeporium, built with HTML, Tailwind, custom CSS, vanilla JS, GSAP, ScrollTrigger, and Lenis.

## Live Architecture
- Multi-page static site
- JSON content sources (`/data/*.json`)
- Modular JS (`/js/*.js`)
- LocalStorage-backed admin CMS simulation
- SEO assets (`sitemap.xml`, `robots.txt`, `rss.xml`)

## Tech Stack
- HTML5 (semantic)
- Tailwind CSS + custom CSS variables
- Vanilla JavaScript modules
- GSAP + ScrollTrigger
- Lenis smooth scrolling
- Three.js background effects

## Project Structure
- `index.html`
- `about.html`
- `portfolio.html`
- `case-study.html`
- `blog.html`
- `blog-post.html`
- `privacy-policy.html`
- `terms.html`
- `admin.html`
- `css/styles.css`
- `css/legal.css`
- `js/main.js`
- `js/animations.js`
- `js/webgl.js`
- `js/cookies.js`
- `js/blog.js`
- `js/case-study.js`
- `js/admin.js`
- `data/posts.json`
- `data/case-studies.json`
- `scripts/generate-seo-files.ps1`
- `sitemap.xml`
- `rss.xml`
- `robots.txt`

## Run Locally
From project root:

```powershell
py -m http.server 5500
```

Open:
- `http://localhost:5500/`

## Content Management
### Blog Content Source
- Primary data file: `data/posts.json`
- Blog index renders from JSON
- Single post renders by slug: `blog-post.html?slug=your-slug`

### Case Study Content Source
- Data file: `data/case-studies.json`
- Page renders by ID: `case-study.html?id=neolearn-rollout`

## Admin Panel
- URL: `admin.html`
- Persistence: `localStorage` override (`nlp_posts_override_v1`)
- Supports:
  - create/edit/delete posts
  - draft/featured toggle
  - SEO metadata editing
  - rich text content editing
  - image upload as base64 (simulation)

Important: change admin password in `js/admin.js` (`ADMIN_PASSWORD`) before production.

## SEO
Implemented:
- unique titles and descriptions per page
- canonical URLs
- Open Graph + Twitter Card tags
- JSON-LD structured data across core pages
- dynamic blog post schema (Article, BreadcrumbList, Author)
- `robots.txt`
- `sitemap.xml`
- `rss.xml`

### Regenerate Sitemap + RSS
```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-seo-files.ps1 -Root .
```

## Cookie Consent + Analytics
- Consent manager in `js/cookies.js`
- Optional scripts load only after consent
- Set your GA4 ID in:
  - `ANALYTICS_MEASUREMENT_ID` inside `js/cookies.js`

## Theme + UX
- Dark/light toggle stored in localStorage (`nlp-theme-pref-v1`)
- Page transition overlay + color tone interpolation between pages
- Breadcrumb navigation auto-injected on non-home pages
- Reading progress indicator on long-form pages

## Deployment Notes
- Deploy as static site (GitHub Pages, Netlify, Vercel static output, S3/CloudFront)
- Ensure absolute production domain matches canonical URLs
- If migrating to headless CMS later, swap data adapters in:
  - `js/blog.js`
  - `js/admin.js`
  - `js/case-study.js`
