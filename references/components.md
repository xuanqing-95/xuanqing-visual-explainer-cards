# Components

Shared component spec for the seed template. Read this when you need to look up a class, a font size, or a hard rule.

## Font Stacks

Editorial (default, in `assets/template.html`):

- `--serif-en`: Playfair Display — English display titles
- `--serif-zh`: Noto Serif SC — Chinese display titles
- `--sans-zh`: Noto Sans SC, PingFang SC — Chinese body
- `--mono`: IBM Plex Mono — chrome / foot / kicker

## Type Scale + Weight Mapping

On 1080×1440 boards, minimum readable size is 22-28px after factoring in mobile downsample.

Editorial scale (3:4 / 1080×1440):

| Role | Class | Size | Weight | Family |
|---|---|---|---|---|
| Term EN (cover) | `.term-en` | 240px | 900 | serif-en |
| Display title | `.h-display-zh` | 96px | 700 | serif-zh |
| Series ZH | `.series-zh` | 84px | 700 | serif-zh |
| Section title | `.h-section-zh` | 64px | 700 | serif-zh |
| Ledger number | `.ledger .num` | 104px | 900 | serif-en |
| Closing letter | `.closing .opt .letter` | 64px | 900 | serif-en |
| Term question | `.term-question` | 44px | 500 | serif-zh |
| Term ZH (cover) | `.term-zh` | 32px | 600 | sans-zh |
| Lead | `.lead` | 30px | 400 | sans-zh |
| Body | `.body` | 26px | 400 | sans-zh |
| Caption | `.concept-page .caption` | 26px | 500 | sans-zh |
| Kicker | `.kicker` / `.kicker-plain` | 20px | 500 | mono |
| Chrome / foot meta | `.chrome` / `.foot` | 18px | 500 | mono |

### Chinese Title Length Bands

Chinese characters are visually denser than Latin. Pick a band before sizing:

| Title shape | `.h-display-zh` |
|---|---|
| 1 line, ≤ 6 chars | 96px |
| 2 lines, each ≤ 8 chars | 96px (default) |
| 3 lines | Cut copy. Don't shrink. |

If the title still does not fit, **shorten the copy first**. Never solve overflow by shrinking body text below the minimum readable size.

### `.h-display-zh` — Hard Caps

| Field | Value |
|---|---|
| Default size on `.poster.xhs` | 96px |
| Max lines | 2 |
| Max chars per line | 8 |
| `em` blocks per title | 1 |

If your title needs 3 Chinese lines: switch the recipe. Don't shrink below 84px.

## Emphasis Patterns

### `.h-display-zh em` — fill block

```html
<h2 class="h-display-zh">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Mustard background, dark text, padded 0 12px, `box-decoration-break: clone` so the highlight stays intact when the line wraps. Use for the single most important phrase per page.

### `.h-section-zh em` — underline

```html
<h2 class="h-section-zh">LLMOps 像<em>餐厅后厨</em></h2>
```

Mustard underline (6px thick, 8px offset), no fill. Lighter weight than the block emphasis. Use when the title is medium-size or when fill would feel too heavy.

### `.kicker` — yellow block tag

```html
<p class="kicker">缺 LLMOps 的典型症状</p>
```

Mono uppercase, 20px, mustard background, dark text. One per page maximum. Sits above the display title.

### `.kicker-plain` — mono tag without highlight

```html
<p class="kicker-plain">Indigo Porcelain</p>
```

Same shape as `.kicker` but plain (no background). Use for series labels or themes that don't deserve emphasis.

## Image Containers

Use `.illust-frame` for AI-generated illustrations. Use `.frame-img` for photographic evidence.

| Class | Fit | Use |
|---|---|---|
| `.illust-frame` | contain | AI-generated illustrations — preserves whole image |
| `.frame-img` | cover | Photographic evidence — cropping is acceptable |

The S01 concept page wraps `.illust-frame` inside `.plate` (paper background, grey border, 560px illustration height + mono caption strip).

```html
<div class="plate">
  <figure class="illust-frame">
    <img src="assets/page-02.png" alt="...">
  </figure>
  <p class="plate-caption">Fig. 01 · 后厨的四个工位</p>
</div>
```

## Minimum Readable Sizes

Below these, text becomes unreadable at phone size:

| Role | Minimum |
|---|---|
| Body | 22px |
| Lead | 26px |
| Caption/Meta | 18px |

**Cut copy instead of shrinking type.** If content overflows, remove words — don't make text smaller.

## Poster Structure

Every `.poster` must have:
1. `overflow: hidden` — prevents content from bleeding out
2. Stable dimensions — never use `vw`/`vh` inside posters
3. One accent only per deck
4. No border-radius, no box-shadow, no gradients

## Footer

Use `.foot` for page metadata (series name, page number). It's defined in the seed template and pinned via `margin-top: auto` inside the flex column `.content` — preserve the flex column or footer collision happens (see `style-system.md` Anti-pattern C).

```html
<div class="foot">
  <span>每天吃透一个 AI 知识点</span>
  <span>01 / 05</span>
</div>
```

## Chrome

Top metadata bar with mono uppercase, hairline border-bottom. Always include category + page number.

```html
<div class="chrome">
  <span>核心比喻 · Metaphor</span>
  <span>02 / 05</span>
</div>
```
