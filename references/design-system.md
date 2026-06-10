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
| `--accent` (IKB Blue) | The visible system color | Chrome hairline + category label, foot hairline + page number, `.section-label`, `.hr-accent`, `em` underline inside `.h-display`/`.h-xl`/`.h-md`, `.img-cap`, `.body strong`, illustrations |
| `--highlight` (Mustard) | Cover bar ONLY | The horizontal bar under `.term-en` on the cover. Nowhere else. |
| `--ink` / `--ink-soft` | Body text | All copy |
| `--grey-1/2/3` | Surfaces & meta | Card backgrounds, hairlines, metadata |

**IKB blue must be visible on every page.** If you finish a page and the only colors on it are black + grey + paper, you've failed the system. Use IKB on at minimum: chrome hairline + label, foot hairline + page number.

**Mustard yellow appears exactly once in a card set** — on the cover bar under `.term-en`. Not on content-page titles, not on backgrounds, not on numbers, not on key options. Concentrating mustard on one place is what makes the cover read as a cover.

Earlier versions of this skill used mustard on `.kicker`, `em` fills, ledger numbers, and key options. That over-saturated the emphasis color and made every page look the same. Don't go back to that.

### Alt Accents

3 single-color alternatives in `theme-presets.md` (Lemon Yellow, Lemon Green, Safety Orange). They collapse `--accent` and `--highlight` to one color — use only when Indigo Porcelain truly doesn't fit. The dual-color logic above does not apply.

## Typography

**Editorial-first**: Serif for display + body + lead, italic Playfair for English subtitles, mono for meta.

The single most important rule: **"the larger, the lighter"** — display sizes use weight 500, never 700+. Heavy display weights collapse cards into "heavy infographic banner" and destroy the editorial identity.

The second most important rule: **body and lead use serif-zh, not sans-zh.** Sans body reads as landing page, not magazine.

| Role | Class | Size | Weight | Tracking | Family |
|---|---|---|---|---|---|
| Display | `.h-display` | 124px | 500 | +.04em | serif-zh |
| Section title | `.h-xl` | 88px | 500 | +.03em | serif-zh |
| Mid title | `.h-md` | 56px | 500 | +.02em | serif-zh |
| English sub italic | `.h-sub` | 36px | 400 italic | normal | serif-en |
| Pull quote | `.pullquote` | 64px | 500 italic | normal | serif-zh |
| Lead | `.lead` | 28px | 400 | normal | **serif-zh** |
| Body | `.body` | 24px | 400 | normal | **serif-zh** |
| Kicker / section-label | `.kicker` / `.section-label` | 21px | 500 | +.22em | mono |
| Meta / label / caption / chrome | `.meta` / `.label` / `.img-cap` / `.chrome` | 18px | 500 | +.20em | mono |

Cover-only: `.cover-series .series-zh` = 96px serif-zh; `.cover-series .term-en` = 240px Playfair weight 900; `.cover-series .term-zh` = 42px serif-zh IKB Chinese explanation of the English term; `.cover-series .term-question` = 56px serif-zh.

### Fonts

- `--serif-en`: Playfair Display (loaded from Google Fonts)
- `--serif-zh`: Noto Serif SC
- `--sans-zh`: Noto Sans SC (utility only; do NOT use for body)
- `--mono`: IBM Plex Mono

Hard rules:

- **Display weights are 500.** Never 700+. The system is "the larger, the lighter".
- **Body and lead are serif-zh.** Never sans. Sans body breaks the magazine feel.
- **Tracking on display is positive** (+.03 to +.04em). Negative tracking on serif Chinese looks crushed.
- **Tracking on kicker/meta/section-label is ≥+.20em.** Tight mono uppercase looks like a code editor, not a magazine label.
- **Do not** load additional serif families. Stick to Playfair + Noto Serif SC.
- **Do not** use mono outside chrome/meta/kicker/section-label/caption. Mono in body reads as code.
- **Do not** stretch `em` highlights across more than 4-6 characters. Long highlight blocks lose emphasis.

## Emphasis Pattern

`em` inside `.h-display` / `.h-xl` / `.h-md` gets an IKB blue underline. Thick (6px on display/xl, 5px on md) with large offset (10/8px) so it reads as deliberate, not as a hyperlink.

```html
<h2 class="h-xl">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Use for the single most important phrase per page. **One em block per title.**

Yellow background fills on em are forbidden on content pages. Yellow lives only on the cover bar.

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
