# Steary - Premium Glassmorphic Streaming Platform

Steary is a high-fidelity, highly optimized frontend prototype for a modern streaming platform. It features a sleek dark glassmorphism UI, a dynamic hero section for the latest trailers, a live "Latest" feed, a profile center, temporary notifications, and an interactive "My Projects" showcase that opens external live sites directly within a high-performance iframe overlay.

## Key Features

- **Dark Glassmorphism UI:** Premium aesthetic utilizing transparent glass panels, blurred backgrounds, and subtle borders.
- **Dynamic Background:** Full-viewport background video (`bg.mp4`) with a subtle softening blur.
- **Latest Trailers Showcase:** Scrollable list of trailer cards featuring intelligent 2-line title wrapping and premium hover elevation effects.
- **Profile Center:** A practical user panel for editing profile details, settings, account/privacy notes, and contact information.
- **Temporary Notifications:** Live, browser-only notifications for new news, projects, and hero slides. Notifications expire after 24 hours and are not stored on the server.
- **My Projects Showcase:** Grid of featured projects that open in a seamless iframe overlay.
- **Terminal Loading Screen:** A pure CSS, animated coding-themed terminal loader that gracefully covers iframes while they fetch external content.
- **Ultra-Fast Performance:** Highly optimized transitions using CSS GPU acceleration, avoiding heavy JavaScript recalculations. Fluid typography powered by `clamp()`.

## Tech Stack

- **HTML5:** Semantic, accessible layout.
- **CSS3:** Vanilla CSS (No Tailwind, no preprocessors). Relies heavily on CSS Variables, Flexbox, Grid, and `@keyframes` animations.
- **JavaScript:** Vanilla JS for DOM manipulation, event handling, and overlay toggling.

## Structure
- `index.html`: The main structural layout and UI elements.
- `styles.css`: The styling engine, containing all layout rules, responsive breakpoints, and animations.
- `app.js`: The logic controller for interactions, dropdowns, profile state, temporary notifications, and the iframe overlay lifecycle.

## Working Notes
- Content is primarily driven by Supabase tables: `navbar`, `slider`, `news`, `projects`, and `footer`.
- The profile center stores only local browser state for the current user session and device.
- The notification system polls for new rows and keeps only temporary in-memory/browser-side entries, expiring them after 24 hours.
- For future changes, keep the site CSS-first where possible and preserve the current vanilla HTML/CSS/JS structure.

## Recent Optimization & Performance Fixes (June 2026)
A comprehensive performance and accessibility audit was executed by the Antigravity AI assistant, resulting in:
- **Bandwidth Reduction (10.8MB saved):** Converted all static PNG card images to optimized WebPs (97.2% size reduction) and deferred the loading of background videos until after page-load (`loadLazyVideos()` in `app.js`).
- **Elimination of Database Errors:** Fixed the 400 Bad Request error caused by querying non-existent columns in notification pollers, and resolved the Admin Panel footer save glitch by matching the database's key-value schema via a unified bulk `upsert` query.
- **100/100 Accessibility & Best Practices:** Added keyboard navigation handlers for custom profile triggers, iframe title descriptors, and resolved syntax issues.
- **Strict Future AI Guidelines:** Future AI instances must read and understand `GEMINI.md` (specifically Section 6) before writing code to prevent regressions on these critical performance and database-matching patterns.
