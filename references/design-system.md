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
| `--accent` (IKB Blue) | The visible system color | Chrome hairline + category label, foot hairline + page number, `.section-label`, `.hr-accent`, `.h-display-zh em` underline, `.plate-caption`, `.body strong`, illustrations |
| `--highlight` (Mustard) | Cover bar ONLY | The horizontal bar under `.term-en` on the cover. Nowhere else. |
| `--ink` / `--ink-soft` | Body text | All copy |
| `--grey-1/2/3` | Surfaces & meta | Card backgrounds, hairlines, metadata |

**IKB blue must be visible on every page.** If you finish a page and the only colors on it are black + grey + paper, you've failed the system. Use IKB on at minimum: chrome hairline + label, foot hairline + page number.

**Mustard yellow appears exactly once in a card set** — on the cover bar under `.term-en`. Not on content-page titles, not on backgrounds, not on numbers, not on key options. Concentrating mustard on one place is what makes the cover read as a cover.

Earlier versions of this skill used mustard on `.kicker`, `em` fills, ledger numbers, and key options. That over-saturated the emphasis color and made every page look the same. Don't go back to that.

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

`em` inside a display title gets an IKB blue underline. The underline is thick (6px) and offset (10px) so it reads as deliberate, not a hyperlink.

```html
<h2 class="h-display-zh">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Use this for the single most important phrase per page. **One em block per title.** Two em blocks on one title look like decoration, not emphasis.

`h-section-zh em` is identical (slightly thinner underline at 5px) for medium-size titles.

```html
<h2 class="h-section-zh">LLMOps 像<em>餐厅后厨</em></h2>
```

Do not use yellow background fills on `em` in content pages. Yellow is reserved for the cover bar.

## Page Rhythm

Most content pages pair **text + small illustration**. Text leads, illustration explains.

Typical 5-page set:
1. Cover (S00) — typography only, mustard yellow bar
2. Concept / metaphor — large illustration (480-560px) + short caption
3. Numbered list / multi-item — 3 small illustrations (160-260px each) inline with text
4. Comparison or mechanism — 2 small illustrations side-by-side
5. Closing / call to action — type-led, optional small illustration

Avoid both extremes: "one illustration on page 2 only" (boring) or "one big illustration on every single page" (overwhelming).

## Hard Rules

- Exactly one `--accent` per set
- IKB blue is visible on every page (chrome + foot, minimum)
- Mustard yellow appears exactly once per set, on the cover bar only
- No border-radius, no box-shadow, no gradients
- Content density ≥ 75% on 3:4 cards
- One `em` block per display title (IKB underline, not yellow fill)
- Most content pages should pair text + small illustration
- The cover is the only fixed layout. Content pages are composed fresh from primitives.
