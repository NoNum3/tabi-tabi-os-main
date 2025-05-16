# Bookmarks App — Tabi OS

A modern, accessible, and feature-rich bookmarks manager for Tabi OS. Organize, search, and manage your bookmarks and folders with full Supabase sync, light/dark theme, and keyboard accessibility.

---

## Features
- Add, edit, delete bookmarks and folders (with nesting)
- Drag & drop between folders (if enabled)
- Mark favorites, filter by folder or tag
- Import/export (Netscape HTML)
- Visit count, favicon, and metadata
- Real-time sync (Supabase RLS)
- Fully accessible (labels, keyboard nav, ARIA, color contrast)
- Responsive UI, light/dark theme

---

## Usage
- Open the Bookmarks app from the dashboard or app store
- Use the toolbar to add bookmarks/folders, import/export
- Click a folder to filter, or use search (if available)
- Click a bookmark to visit, star to favorite, or edit/delete

---

## Window Config
- **Default size:** 480x600
- **Min size:** 320x400
- **Icon:** `/icons/settings.png`

---

## Permissions & APIs
- **Supabase:** Uses `bookmarks` and `folders` tables (see `/supabase/migrations/20250513193458_create_bookmarks_table.sql`)
- **Permissions:** Requires network access to Supabase
- **Sensitive APIs:** None (all data is per-user, RLS enforced)

---

## Setup
1. Ensure Supabase tables and policies are migrated (see migration SQL)
2. App auto-discovers via `/src/apps/bookmarks/index.ts`
3. No global code changes required
4. Uses `/src/types/supabase.ts` for type safety

---

## Accessibility (a11y)
- All UI elements have labels and ARIA attributes
- Full keyboard navigation (tab, enter, esc)
- Sufficient color contrast (auto with Tailwind/Shadcn)
- No color-only indicators
- Tested with screen readers

---

## Theming
- Fully supports light and dark mode (auto via Tabi OS theme)

---

## Screenshots / Storybook
- (Add screenshots or Storybook links here if available)

---

## Contribution
- See `/src/apps/bookmarks/` for all code
- Uses Shadcn UI, Jotai, and Supabase
- Please lint (`bun run lint`) and test before submitting PRs

---

## License
MIT (c) Tabi OS contributors 