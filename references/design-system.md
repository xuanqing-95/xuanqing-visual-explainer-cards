# Design System

## Canvas

- Xiaohongshu: 1080 × 1440 (3:4).
- Outer padding: 80px on all sides (handled by `.poster.xhs .content` in the template).
- Spacing scale: 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px (tokens `--sp-3` through `--sp-12`).

## Color System

Default theme is **Indigo Porcelain** — a deliberate dual-color system:

```css
--accent:     #002FA7   /* IKB Klein Blue — system structure */
--accent-on:  #ffffff
--highlight:  #F2D24B   /* Mustard Yellow — emphasis only */
--highlight-on: #0a0a0a
```

### Two-Layer Color Logic (hard rule)

| Token | Role | Use on |
|---|---|---|
| `--accent` (IKB Blue) | System structure | Illustrations, brand chrome, link color, structural blocks |
| `--highlight` (Mustard) | Emphasis only | `.kicker`, `em` inside titles, `.ledger .num`, `.hr-accent`, cover term-en bar, key `.closing .opt.is-key` |
| `--ink` / `--ink-soft` | Body text | All copy |
| `--grey-1/2/3` | Surfaces & meta | Card backgrounds, hairlines, metadata |

**Never use `--accent` for emphasis. Never use `--highlight` for structure.** This separation is what gives the system its calm + accent rhythm. Mixing breaks the visual hierarchy.

### Alt Accents

3 single-color alternatives in `theme-presets.md` (Lemon Yellow, Lemon Green, Safety Orange). They collapse `--accent` and `--highlight` to one color — use only when Indigo Porcelain truly doesn't fit. The dual-color logic above does not apply.

## Typography

**Editorial-first**: Serif for display, sans for body, mono for meta.

| Role | Class | Font | Size | Weight |
|---|---|---|---|---|
| Series ZH (cover) | `.series-zh` | serif-zh | 84px | 700 |
| English term (cover) | `.term-en` | serif-en (Playfair Display) | 240px | 900 |
| Display title | `.h-display-zh` | serif-zh | 96px | 700 |
| Section title | `.h-section-zh` | serif-zh | 64px | 700 |
| Ledger number | `.ledger .num` | serif-en | 104px | 900 |
| Closing letter | `.closing .opt .letter` | serif-en | 64px | 900 |
| Lead | `.lead` | sans-zh | 30px | 400 |
| Body | `.body` | sans-zh | 26px | 400 |
| Caption | `.concept-page .caption` | sans-zh | 26px | 500 |
| Kicker | `.kicker` | mono | 20px | 500 |
| Chrome / foot meta | `.chrome` / `.foot` | mono | 18px | 500 |

### Fonts

- `--serif-en`: Playfair Display (loaded from Google Fonts)
- `--serif-zh`: Noto Serif SC
- `--sans-zh`: Noto Sans SC
- `--mono`: IBM Plex Mono

Hard rules:

- **Do not** use sans-serif for display titles in Editorial mode.
- **Do not** load additional serif families. Stick to Playfair + Noto Serif SC.
- **Do not** use mono outside chrome/meta/kicker. Mono in body copy reads as code.
- **Do not** stretch `em` highlights across more than 4-6 characters. Long highlight blocks lose emphasis.

## Emphasis Pattern

`em` inside a display title gets a mustard background with white-on-black ink. The padding + `box-decoration-break: clone` keeps the highlight block intact when wrapping.

```html
<h2 class="h-display-zh">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Use this for the single most important phrase per page. **One em block per title.** Two em blocks on one title look like decoration, not emphasis.

`h-section-zh em` is different — it uses an underline instead of a fill, lighter visual weight, for inline highlighting.

```html
<h2 class="h-section-zh">LLMOps 像<em>餐厅后厨</em></h2>
```

## Portrait Composition

Plan every 3:4 page as intentional vertical zones:

| Zone | Height | Purpose |
|---|---|---|
| Chrome | 0-60px | category / day / page no. |
| Kicker | 60-110px | yellow highlight tag |
| Display title | 130-360px | dominant message |
| Evidence | 380-1000px | illustration / ledger / split / options |
| Foot | 1340-1400px | tagline + page no. |

**Content density rule (hard)**: content must cover ≥75% of canvas height. Any pure-whitespace band >15% canvas height (>216px) needs a stated reason.

## Page Rhythm

Alternate between dense pages and breathing pages. End with a closing page, not a content page.

Typical 5-page set:
1. Cover (S00)
2. Concept + Image (S01) — only page with illustration
3. Tall Ledger (S02) — pure type rhythm
4. Before / After (S03) — split contrast
5. Closing (S04) — options + action

## Hard Rules

- Exactly one `--accent` per set
- `--highlight` only on emphasis surfaces listed above
- No border-radius, no box-shadow, no gradients
- Content density ≥ 75% on 3:4 cards
- One `em` block per display title
- 1-3 illustrations per 5-page set, not one on every page
