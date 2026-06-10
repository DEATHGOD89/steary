# TODO - Make Admin Panel Match Main Website Theme

## 1) Fix CSS conflicts (most important)
- File: `admin.css`
- Remove/comment out these global/theme override sections so `styles.css` controls the theme:
  - `:root { ... }` token block
  - `body { ... }` global override block
  - `.glass-panel, .glass-card { ... }` override block
  - `.btn-primary { ... }` and `.btn-secondary { ... }` override blocks (+ their hover/active)
  - Any other global selectors that change shared UI appearance (fonts/colors/scrollbars) unless they’re admin-only.

## 2) Keep only admin layout/component CSS
- File: `admin.css`
- Keep admin-only layout styles (dashboard grid/sidebar/topbar, CMS forms, admin table, toasts, widgets):
  - `.admin-login-wrapper`, `.admin-login-panel`, `.admin-header`, `.admin-form`
  - `.dashboard-wrapper`, `.dashboard-sidebar`, `.topbar-wrapper`, `.dashboard-main`
  - `.dashboard-nav-btn`, `.logout-btn`
  - `.cms-*`, `.widget-card`, `.stat-card`, `.toast-*`, `.admin-table*`, `.analytics-table*`

## 3) Fix theme toggle logic in admin pages
- Files: `admin.html`, `admin-dashboard.html`
- Replace the current script that toggles `dark-theme` with one that toggles `body.light-mode` (this is what `styles.css` expects),
  - or remove the theme script completely.

Current theme script adds:
- `document.documentElement.classList.add('dark-theme')`
- `document.body.classList.add('dark-theme')`
But `styles.css` uses:
- `body.light-mode { ... }`

So admin should add/remove `light-mode` class on `body`.

## 4) Optional: match fonts
- Remove the Space Grotesk / Space Mono `<link>` fonts from admin pages so `styles.css` uses Inter.

## 5) Thorough manual testing (user will do)
- Check:
  - `admin.html` login page styling (glass + buttons + inputs)
  - `admin-dashboard.html` sidebar buttons, top bar (search + icons), cards (stats/widgets), tables, toasts
  - theme toggle (light/dark) matches `styles.css`
  - scrolling and dropdowns still work
