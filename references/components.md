# Components

Shared component spec for the seed template. Read this when you need to look up a class, a font size, or a hard rule.

## Font Stacks

Swiss International (`template.html`):

- `--sans`: Inter, Helvetica Neue, Helvetica.
- `--sans-zh`: Noto Sans SC, PingFang SC — Chinese body.
- `--mono`: IBM Plex Mono — labels, captions, t-meta.

## Type Scale + Weight Mapping

**"The larger, the lighter."** Small text always uses heavier weight than large text. On 1080x1440 boards, the minimum readable size is 22-28px after factoring in mobile downsample.

Swiss scale (default for 3:4):

| Role | Class | Size | Weight | Family |
|---|---|---|---|---|
| Hero | `.h-hero` | 240px | 200 | sans |
| Statement | `.h-statement` | 180px | 200 | sans |
| Section title | `.h-xl` | 120px | 300 | sans |
| Mid title | `.h-md` | 56px | 400 | sans |
| Mega number | `.num-mega` | 200px | 200 | sans |
| XL number | `.num-xl` | 144px | 200 | sans |
| Lead | `.lead` | 30px | 400 | sans-zh |
| Body | `.body` | 26px | 400 | sans-zh |
| Category | `.t-cat` | 22px | 600 | sans |
| Meta | `.t-meta` | 20px | 500 | mono |

### Chinese Title Length Bands

Chinese characters are visually denser than Latin. Pick a band before sizing:

| Title shape | Swiss h-xl |
|---|---|
| 1 line, ≤ 6 chars | 96px (default) |
| 2 lines, each ≤ 8 chars | 96px |
| 3 lines (rare) | Use `.h-statement` instead |

If the title still does not fit, **shorten the copy first**. Never solve overflow by shrinking body text below the minimum readable size.

### `.h-xl` — Hard Caps per Board

| Board | Default `.h-xl` | Max lines | Max chars/line |
|---|---|---|---|
| `.poster.xhs` (1080×1440) | 96px | 2 | 8 |
| `.poster.square` (1080×1080) | 88px | 2 | 7 |
| `.poster.wide` (2100×900) | 104px | 1 | 14 |

If your title needs 3 Chinese lines on `.poster.xhs`: switch the recipe. Don't shrink `.h-xl` below 80px.

## Image Containers

Use the `.frame-img` system. Always pick a standard ratio class. Never write ad-hoc `aspect-ratio` values.

| Class | Ratio | Use |
|---|---|---|
| `.r-3x4` | 3:4 | Default for portrait covers and field-note photos |
| `.r-1x1` | 1:1 | Square portraits, product objects, balanced grids |
| `.r-4x3` | 4:3 | Classic editorial photo, full-bleed top zone |
| `.r-3x2` | 3:2 | Magazine inline figure |
| `.r-16x9` | 16:9 | Landscape photo, infographic |
| `.r-16x10` | 16:10 | Default for left-text + right-image splits |
| `.r-21x9` | 21:9 | WeChat 21:9 hero image |

Default `object-fit: cover` keeps `object-position: center 50%`. Use `.fit-contain` for UI screenshots, dense text, code, and infographics.

### Subject-Aware Cropping

**Always set `object-position` inline per photo.** The template default is a fallback, not a recommendation.

| Subject location | Inline value |
|---|---|
| Subject near top (sky-heavy, face at top) | `center 25-35%` |
| Subject centered (default) | `center 50%` (omit) |
| Subject mid-body (hiker, hands) | `center 55-65%` |
| Subject low (foreground gear) | `center 70-80%` |

## Illustration Frame (`.illust-frame`)

For AI-generated illustrations (GPT Image 2, etc.), use `.illust-frame` with a standard ratio class:

```html
<div class="illust-frame r-4x3">
  <img src="assets/page-02.png" alt="描述">
</div>
```

- `.illust-frame` uses `object-fit: contain` to preserve generated image content without cropping.
- `.frame-img` uses `object-fit: cover` for photos where cropping is acceptable.
- Pick the ratio that matches your generated image's aspect ratio.

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
4. No border-radius, no box-shadow, no gradients (Swiss mode)

## Footer

Use `.foot` for page metadata (series name, page number):

```html
<div class="foot">
  <span>每天吃透一个 AI 知识点</span>
  <span>01 / 05</span>
</div>
```

The `.foot` class is defined in task-scoped CSS (not in the seed template). Define it as:

```css
.foot {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  letter-spacing: .06em;
  color: var(--grey-3);
  padding: 0 80px 40px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}
```
