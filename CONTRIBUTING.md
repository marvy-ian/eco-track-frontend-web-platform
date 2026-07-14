# Contributing to EcoTrack

Thanks for your interest in improving EcoTrack — a personal carbon footprint tracker and community action hub. This is a lightweight static site (HTML/CSS/vanilla JS), so getting set up and contributing is quick.

## Project structure

```
.
├── index.html       # Page markup and content
├── indexstyle.css   # All styling
└── script.js        # All interactivity (calculator, counters, pledge wall, etc.)
```

There's no build step, framework, or package manager involved — just open the files and edit.

## Getting started

1. **Fork** the repository and **clone** your fork locally.
2. Open `index.html` directly in a browser, or serve the folder locally for a closer-to-production experience:
   ```bash
   # any static server works, e.g.
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000`.
3. Make your changes in `index.html`, `indexstyle.css`, and/or `script.js`.
4. Refresh the browser to see updates — no compilation required.

## Making changes

### HTML (`index.html`)
- Keep markup semantic and accessible (the project uses ARIA labels, `aria-expanded`, etc. — please preserve or extend these when adding interactive elements).
- New sections should follow the existing pattern: a `<section>` with a `container` div and a `section-header` block.

### CSS (`indexstyle.css`)
- Reuse existing CSS custom properties (variables) for colors, spacing, and typography instead of hardcoding new values. Check the `:root` block at the top of the file first.
- Keep responsive/mobile styles working — test at common breakpoints (mobile, tablet, desktop).

### JavaScript (`script.js`)
- Functions are grouped by feature (navigation, calculator steps, results dashboard, pledge wall, newsletter, etc.). Add new logic near related existing functions.
- The pledge wall and newsletter features use `localStorage` for persistence — if you touch these, make sure data is still escaped via `escapeHtmlSecurity()` before being inserted into the DOM (this prevents XSS from user-submitted text).
- Avoid introducing external dependencies unless there's a strong reason — the project intentionally stays framework-free.
- Use `const`/`let`, not `var`, and favor small, named functions over large inline handlers.

## Testing your changes

There's no automated test suite yet, so please manually verify:
- The page loads without console errors.
- The carbon footprint calculator can be completed start to finish (all 4 steps), including validation and the results dashboard/canvas indicator.
- The mobile navigation (hamburger menu) opens and closes correctly.
- The pledge wall and newsletter forms save and reload correctly from `localStorage`.
- Layout looks correct at mobile, tablet, and desktop widths.

## Submitting a pull request

1. Create a branch with a descriptive name (e.g. `fix/mobile-nav-bug`, `feat/dark-mode`).
2. Keep PRs focused — one feature or fix per PR is easier to review.
3. Write a clear PR description: what changed, why, and how you tested it. Screenshots or a short screen recording are appreciated for UI changes.
4. Make sure `index.html`, `indexstyle.css`, and `script.js` are all still linked correctly and the page runs cleanly before opening the PR.

## Reporting bugs / suggesting features

Please open an issue that includes:
- A clear description of the bug or feature request.
- Steps to reproduce (for bugs), including browser and device if relevant.
- Expected vs. actual behavior.

## Code of conduct

Be respectful and constructive. This project welcomes contributions from people of all experience levels — if you're new to open source, feel free to ask questions in your issue or PR.

Thanks for helping make EcoTrack better! 🌱