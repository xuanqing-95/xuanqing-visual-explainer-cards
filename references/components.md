# Components

Shared component spec for the seed template. Read this when you need to look up a class, a font size, or a hard rule.

## Font Stacks

- `--serif-en`: Playfair Display — English display titles, italic subtitles
- `--serif-zh`: Noto Serif SC, Songti SC, STSong — Chinese display titles + body + lead
- `--sans-zh`: Noto Sans SC, PingFang SC — utility text, fallback only (body defaults to serif-zh in Editorial)
- `--sans`: Inter — Latin body in mixed content
- `--mono`: IBM Plex Mono — kicker, meta, captions, section labels, chrome, foot

Editorial **body and lead default to serif-zh**, not sans. This is what makes the cards read as magazine, not landing page.

## Type Scale — "The Larger, The Lighter"

Display sizes use **weight 500**, never 700+. Heavy display weights collapse the card into "heavy infographic banner" and destroy the editorial identity. Small text uses heavier weight than large text.

Editorial scale (1080×1440 board):

| Role | Class | Size | Weight | Tracking | Family |
|---|---|---|---|---|---|
| Display | `.h-display` | **124px** | 500 | +.04em | serif-zh |
| Section title | `.h-xl` | **88px** | 500 | +.03em | serif-zh |
| Mid title | `.h-md` | **56px** | 500 | +.02em | serif-zh |
| English subtitle | `.h-sub` | 36px | 400 italic | normal | serif-en |
| Pull quote | `.pullquote` | 64px | 500 italic | normal | serif-zh |
| Lead | `.lead` | 28px | 400 | normal | **serif-zh** |
| Body | `.body` | 24px | 400 | normal | **serif-zh** |
| Kicker | `.kicker` | 21px | 500 | +.22em | mono |
| Section label | `.section-label` | 21px | 500 (IKB) | +.22em | mono |
| Meta / label | `.meta` / `.label` | 18px | 500 | +.20em | mono |
| Caption | `.img-cap` | 18px | 500 (IKB) | +.20em | mono |
| Chrome / foot | `.chrome` / `.foot` | 18px | 500 | +.20em | mono |

Cover-only specials:

| Role | Class | Size | Weight | Tracking | Family |
|---|---|---|---|---|---|
| Series title | `.cover-series .series-zh` | 96px | 500 | +.04em | serif-zh |
| Series accent letter ("AI") | `.series-zh .ai-accent` | 96px | 700 italic (IKB) | inherit | serif-en |
| Big English term | `.cover-series .term-en` | **240px** | 900 | −.02em | serif-en |
| Cover Chinese explanation | `.cover-series .term-zh` | 42px | 500 (IKB) | +.04em | serif-zh |
| Cover question | `.cover-series .term-question` | 56px | 500 | +.02em | serif-zh |

### Chinese Title Length Bands

Chinese characters are denser than Latin. Pick a band before sizing:

| Title shape | `.h-display` | `.h-xl` |
|---|---|---|
| 1 line, ≤ 6 chars | 124px (default) | 88px (default) |
| 1 line, 7-10 chars | 108px | 78px |
| 2 lines, each ≤ 8 chars | 96px | 78px |
| 2 lines, any line 9-12 chars | 84px | 68px |
| 3 lines | reconsider — split the page |

If the title still does not fit, **shorten the copy first**. Never solve overflow by shrinking body text below the minimum readable size.

### `.h-xl` — Hard Caps (validated)

| Field | Value |
|---|---|
| Default size on `.poster.xhs` | 88px |
| Max lines | 2 |
| Max chars per line | 9 |
| `em` blocks per title | 1 |

If your title needs 3 Chinese lines: shorten the copy or split the page. Don't shrink `.h-xl` below 78px — small + heavy reads as Web1.0.

## Emphasis Patterns

### `em` inside `.h-display` / `.h-xl` / `.h-md` — IKB underline

```html
<h2 class="h-xl">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Thick IKB underline (6px on display/xl, 5px on md), large offset (10/8px). Use for the single most important phrase per page. **One em block per title.**

Yellow background fills on em are forbidden. Yellow lives only on the cover bar.

### `.section-label` — IKB tag with square mark

```html
<p class="section-label">核心比喻</p>
<p class="section-label">为什么重要</p>
```

Small IKB blue square + 21px mono uppercase IKB text, +.22em tracking. Makes the system color visible on every page. Use one per content page in place of `.kicker`.

### `.body strong` — IKB inline emphasis

```html
<p class="body">大多数团队在 LLMOps 上失败,是因为 <strong>缺少反馈闭环</strong>,不是模型选错了。</p>
```

IKB color, 500 weight, inside serif body copy.

### `.kicker` — mono uppercase, no color emphasis

```html
<p class="kicker">第三幕 · The Third Act</p>
```

21px mono, +.22em tracking, muted ink. Use when you need a section label that does NOT need to read as "system color". For the IKB system marker use `.section-label` instead.

## Image Containers

| Class | Fit | Use |
|---|---|---|
| `.evidence-figure` | layout wrapper | Major generated illustrations; centers the visual in a stable evidence band |
| `.evidence-figure.hero` | 500-600px band | Concept/metaphor page where image is the main explanation |
| `.evidence-figure.wide` | 340-460px band | Workflow/comparison/metaphor strip |
| `.evidence-figure.compact` | 220-300px band | Small support mark or action page image |
| `.illust-frame` | contain | AI-generated illustrations — preserves whole image |
| `.illust-frame.wide-flow` | contain + 118% enlargement | Wide process/metaphor/comparison diagrams that otherwise look too small |
| `.illust-frame.zoom-110` | contain + 110% enlargement | Subtle enlargement after background normalization |
| `.illust-frame.zoom-125` | contain + 125% enlargement | Margin-heavy generated images |
| `.illust-frame.zoom-140` | contain + 140% enlargement | Very margin-heavy images; inspect labels before accepting |
| `.frame-img` | cover | Photographic evidence — cropping is acceptable |

`.illust-frame` heights (per `illustration-prompts.md`):

- Concept page (image-led): 480-560px
- List item thumb: 160-260px
- Inline step mark: 100-160px

For wide diagrams, prefer generating `16:10` or `4:3` images and placing them in `.illust-frame.wide-flow`. Avoid square images in wide slots; they leave the page looking underfilled.

For content-page generated images, do not use `.illust-frame` alone as the outer layout block. Wrap it:

```html
<figure class="evidence-figure wide">
  <div class="illust-frame wide-flow">
    <img src="assets/page-03.png" alt="...">
  </div>
  <figcaption class="img-cap">Fig. 03 · caption</figcaption>
</figure>
```

The wrapper makes the image optically centered and keeps the caption attached to the visual.

Captions use `.img-cap` (18px mono, +.20em tracking, IKB color).

## Minimum Readable Sizes

A 1080×1440 PNG is usually viewed on phone at 360-420 logical pixels wide. Below these, text becomes unreadable:

| Role | Minimum |
|---|---|
| Body / paragraph | 24px |
| Lead | 28px |
| Caption / kicker | 20px |
| Label / meta | 18px (mono only) |
| Cell title in grids | 24px |

**Cut copy instead of shrinking type.** If content overflows, remove words.

## Poster Structure

Every `.poster` must have:
1. `overflow: hidden` — prevents content bleeding out
2. Stable dimensions — never use `vw`/`vh` inside posters
3. One accent only per deck
4. No border-radius, no box-shadow, no gradients
5. Content padding: 96px top/bottom, 88px sides on `.poster.xhs`

## Chrome (required on every page)

Top metadata bar. IKB hairline + IKB category label is what makes the system color visible.

```html
<div class="chrome">
  <span class="c-cat">核心比喻 · Metaphor</span>
  <span class="c-num">02 / 05</span>
</div>
```

`.c-cat` is IKB, `.c-num` is muted. `border-bottom` is IKB hairline.

## Footer (required on every page)

Bottom metadata bar.

```html
<div class="foot">
  <span class="f-tag">每天吃透一个 AI 知识点</span>
  <span class="f-num">02 / 05</span>
</div>
```

`.f-tag` is muted, `.f-num` is IKB. Pinned via `margin-top: auto` inside the flex column `.content` — preserve the flex column or footer collision happens (see `style-system.md` Anti-pattern C).
