# Design System

## Canvas

- Xiaohongshu: 1080 x 1440 (3:4).
- Outer padding: 88px left/right, 96px top, 56px bottom (issue-strip safe area).
- Spacing scale: 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px.

## Theme

Default theme is **Indigo Porcelain** (Swiss International mode). One deck — one accent. Never combine.

```css
:root {
  --paper:     #f2f4f5;
  --paper-2:   #e5ebef;
  --ink:       #0a1f3d;
  --muted:     #5f6d78;
  --line:      rgba(10,31,61,.20);
  --accent:    #315d93;
  --accent-soft: #d7e1ec;
}
```

Do not return to red/yellow/blue primary-color styling unless the user explicitly asks for a brighter variant.

### Other Available Themes

See `theme-presets.md` for the full palette catalog (6 Editorial + 4 Swiss). Switch via `data-theme` on `<html>` (Editorial) or `data-accent` (Swiss).

## Typography

### Swiss International Mode (default for this skill)

**Hard rule: "the larger, the lighter"**

| Role | Weight | Size (3:4) | Font | Notes |
|---|---|---|---|---|
| Hero display | 200 | 168px | sans | ≤2 lines |
| Statement | 200 | 124px | sans | Pull-quote size |
| Page title (h-xl) | 300 | 96px | sans | 2-3 lines max |
| Mid title (h-md) | 400 | 56px | sans | Section headers |
| Category kicker | 600 | 22px | sans | Uppercase, accent color, +.08em tracking |
| Lead | 400 | 30px | sans-zh | Introductions |
| Body | 400 | 26px | sans-zh | Main content |
| Metadata | 500 | 20px | mono | Uppercase, +.14em tracking |

Anti-patterns:
- **Do not** use weight 700-900 for display titles — it collapses Swiss into "infographic banner" look
- **Do not** use serif body text in Swiss mode (that's Editorial mode)
- **Do not** use negative tracking on large type

### Editorial Magazine Mode (optional)

See `style-system.md` "Mode A" for Editorial typography rules (serif display, Songti body, wide tracking on kicker/meta).

## Portrait Composition

Plan every 3:4 page as intentional vertical zones:

| Zone | Height | Purpose |
|---|---|---|
| Header | 0-90px | chrome-min row: category, date, issue |
| Hook | 240-380px | dominant title and promise |
| Evidence | 520-720px | illustration, diagram, comparison, ledger |
| Takeaway | 100-180px | consequence, formula, compressed conclusion |
| Footer | 52-86px | issue-strip or next-page cue |

**Content density rule (hard)**: content must cover ≥75% of canvas height. Any pure-whitespace band >15% canvas height (>216px) needs a stated reason.

Do NOT use `<div style="flex: 1"></div>` to push content to the vertical centre — social cards are scrolled one at a time, under-filled cards read as "PowerPoint with a missing element."

## Background

A flat paper color is not enough. Use the layered background system from `background-systems.md`:

1. Paper base from theme preset
2. Procedural paper grain (CSS dots or noise)
3. Optional ink wash / contour atmosphere (stronger on covers, subtler on content pages)
4. Content layer

For Swiss mode, use subtle dot-matrix or cross-mat patterns instead of ink wash. See `background-systems.md` for CSS.

## Information Hierarchy

Each page should contain:

1. One dominant message
2. One evidence or explanation zone
3. Optional supporting note or takeaway

Use one accent color per set. Align elements to a visible grid.

## Page Rhythm

Alternate between dense pages and breathing pages. Do not stack three heavy ledger pages in a row. End with a closing page, not a content page.

## Hard Rules

- Exactly one `--accent` in the entire deck
- No border-radius on frames (Swiss mode uses square corners)
- No box-shadow, no gradients (Swiss mode)
- `frame-img` / `frame-shot` use `object-fit: contain` for screenshots (never crop UI)
- "The larger, the lighter" — ≥200px must use weight 200
- Content density ≥75% on 3:4 cards
