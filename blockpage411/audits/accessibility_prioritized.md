Accessibility audit — prioritized fixes

This document is a high-level, prioritized list of accessibility issues (high -> low) and recommended fixes for the project. It's based on manual review of components and typical issues found in SPAs; use the provided `scripts/run_a11y_audit.js` (requires Puppeteer + axe-core) to run automated scans against a running instance.

High priority (impact & easy to fix)

1. Missing/weak focus styles in interactive elements
   - Fix: Ensure `.btn`, `.input`, and focusable controls have clear visible focus outlines. Implemented in `styles/globals.css`.

2. No announcements for toasts
   - Fix: Ensure toasts use an `aria-live` region and role=status so screen readers announce messages. Implemented in `app/components/simpleToast.tsx`.

3. Modals need ARIA roles and keyboard handling
   - Fix: Add `role="dialog"`, `aria-modal="true"`, initial focus and Escape to close. Implemented for `ReportModal` and `AddProviderModal`.

Medium priority

4. Touch target sizes too small on mobile
   - Fix: Increase button and input min-height to 44-52px on mobile and increase padding. Implemented via `.btn` and `.input` updates in `styles/globals.css`.

5. Missing form labels / inputs without accessible names
   - Fix: Ensure all inputs have associated `<label>` elements or `aria-label` attributes. Review forms in `AddProviderModal`, report modal and any search/filter inputs.

6. Color contrast issues in some decorative gradients and subtle text
   - Fix: Review color usage where text is over gradients and ensure contrast >= 4.5:1 for body text. Consider adjusting text color or adding semi-opaque overlays.

Lower priority

7. ARIA roles & landmarks
   - Fix: Add landmarks (main, nav) where appropriate: layout already includes a skip link; add `<main id="content">` wrapper if not present semantically.

8. Dynamic content announcements
   - Fix: For actions that update content (e.g., live transaction feed), consider `aria-live` regions or `role=status` areas to announce updates when they are important.

How to run an automated scan (local)

1. Start local dev server: `npm run dev`
2. Install dev deps: `npm i -D puppeteer axe-core`
3. Run the audit script: `node scripts/run_a11y_audit.js`

Notes

- I implemented several of the high-impact fixes (modals, toasts, focus and touch targets). The remaining items (contrast review, full form labeling checks, dynamic announcements for live feeds) require some manual review and optional automated scans using `axe`.
- If you'd like, I can implement an automated axe script that crawls key pages and opens a report in `audits/axe-report.json`.
