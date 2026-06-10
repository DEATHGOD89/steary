# AI Assistant Reminders & Instructions (GEMINI.md)

This file is the working memory and architecture guide for the Steary project.
When making future updates, keep the site fast, stable, and easy to reason about.

## 1. Core Architecture & Tech Stack
- **Pure Vanilla Stack:** Use strictly Vanilla HTML, CSS, and JavaScript. Do not introduce TailwindCSS, React, Vue, or external UI libraries.
- **Glassmorphism:** Preserve the dark glassmorphic language (`rgba(255, 255, 255, 0.08)`, `backdrop-filter: blur`, subtle `1px solid rgba(255, 255, 255, 0.15)` borders).

## 2. Performance & Optimization Rules
- **GPU Acceleration:** The `.project-container` and `.project-iframe-wrapper` rely on `transform: translateZ(0)`, `will-change`, and `backface-visibility: hidden`. Keep them in place.
- **Iframe Lifecycle:** Never remount the iframe to switch views. Reuse the existing iframe and update `src`.
- **Loading Screen Strategy:** The terminal loader (`.iframe-coding-loader`) is CSS-only. Do not replace it with JS animation loops. Use CSS opacity transitions and the iframe `onload` event.
- **Responsive Typography:** Use CSS `clamp()` for major text. Avoid JS resize listeners for typography.

## 3. Layout Constraints
- **Grid Structure:** The main layout is a 2-column grid (`320px 1fr`). Do not reintroduce a 3-column layout.
- **Hero / Trailers Section:** The "Continue Watching" section stays removed. The "Latest" section holds 6 cards. Trailer thumbnails stay at `80x50px`, and titles use `-webkit-line-clamp: 2`.
- **Project Cards:** Cards 1 to 8 are hardcoded in `index.html`; later projects come from Supabase.
- **Navbar:** The `.navbar` uses `position: relative`, not `overflow: hidden`.
- **Background Video:** The moving navbar video must stay clipped by `.navbar-video-wrapper` so dropdowns can render outside the navbar bounds.
- **Profile System:** The avatar opens the floating `.profile-dropdown`, which in turn opens the in-page profile center. Keep the flow simple: View Profile, Settings, Account & Privacy, Notifications, Contact Us.
- **Notifications:** The bell opens a temporary notifications list. New `news`, `projects`, and `slider` rows should appear there automatically and expire after 24 hours without server-side storage.
- **Account / Privacy:** This is a local-browser experience unless a backend is explicitly added later. Do not imply real auth when the code is only storing local state.
- **Asset Directory:** Local assets live in `src/assets/`. Use paths like `src/assets/image.png` when referencing local files.

## 4. Maintenance Philosophy
If a bug occurs or a new feature is requested, start with the smallest change that fits the existing patterns. Prefer CSS-first solutions. Before touching `app.js`, ask whether the behavior can be handled with CSS transitions, variables, pseudo-classes, or existing DOM structure.

## 5. Future Work Checklist
- Read `README.md` first for the user-facing feature map.
- Read this file before changing interactions, layout, or data loading.
- Touch `app.js` only when state, event wiring, or Supabase polling genuinely needs JavaScript.
- Prefer additive changes over rewrites. Do not remove a working path just to simplify the code.
- Keep profile data local unless the user explicitly asks to connect it to a backend.
- Keep notifications temporary unless the user explicitly asks for persistence.

## 6. Antigravity Optimization & Fix History (June 2026)
Future AI assistants (including Antigravity) MUST review these previous structural fixes before editing page logic to prevent regressions:
- **Supabase Query Optimization:** Standardized the notification poller `pollNotificationSource()` in `app.js` to dynamically select only existing columns (e.g., `select("id, ${titleField}")`). Querying non-existent columns (like `name` in `slider`/`news` or `title` in `projects`) triggers a 400 Bad Request database error.
- **Enormous Payload & LCP Optimization (Videos):** Removed hardcoded `src` and `autoplay` from `<video>` elements in `index.html`. Implemented a lazy loader in `app.js` (`loadLazyVideos()`) that binds the `src` and plays the background videos *only* after the browser triggers the window `load` event. This dropped the startup payload by **5.54MB** and prevented CPU rendering blocks.
- **Image WebP Conversion & Dimensioning:** Replaced all local PNG card assets (`project1.png` to `project8.png`, `steary_background.png`) with compressed, scaled WebP equivalents in `src/assets/`. Updated image tags in `index.html` with explicit `width="300" height="169"`, `loading="lazy"`, and `decoding="async"`. Resized cards to a maximum width of `640px` (preserving retina sharpness while dropping total payload by **5.3MB** or **97.2%**).
- **Dynamic Local Asset Mapping:** Configured `formatImageUrl(url)` in `app.js` to automatically rewrite local `.png` extensions to `.webp` on the fly, preventing asset loading glitches if Supabase returns legacy filenames.
- **Key-Value Footer Database Schema Fix:** Resolved a major CMS crash in both `app.js` and `admin.js` where the admin panel attempted to update a single row with three columns (`copyright_text`, etc.). The database schema represents the `footer` table as a key-value store. Updated prepopulation logic to parse key-value rows into a dictionary, and updated the update handler to execute a bulk `upsert` query:
  ```javascript
  const payload = [
      { key: 'footer_copyright', value: copyright },
      { key: 'social_twitter', value: twitter },
      { key: 'social_discord', value: discord }
  ];
  await supabaseClient.from('footer').upsert(payload, { onConflict: 'key' });
  ```
- **Accessibility Upgrades (WAI-ARIA):** Added `title` tags to all video/preview iframes, added `role="button"`, `tabindex="0"`, and `aria-label` to the user profile trigger (`#userProfileToggle`), and added a keyboard listener for `Enter` and `Space` triggers.
