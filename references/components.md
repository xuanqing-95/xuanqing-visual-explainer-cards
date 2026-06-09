# Components

Shared component spec for the seed template. Read this when you need to look up a class, a font size, or a hard rule.

## Font Stacks

Editorial (default, in `assets/template.html`):

- `--serif-en`: Playfair Display — English display titles
- `--serif-zh`: Noto Serif SC — Chinese display titles
- `--sans-zh`: Noto Sans SC, PingFang SC — Chinese body
- `--mono`: IBM Plex Mono — chrome / foot / section labels / captions

## Type Scale + Weight Mapping

On 1080×1440 boards, minimum readable size is 22-28px after factoring in mobile downsample.

Editorial scale (3:4 / 1080×1440):

| Role | Class | Size | Weight | Family |
|---|---|---|---|---|
| Term EN (cover) | `.term-en` | 240px | 900 | serif-en |
| Display title | `.h-display-zh` | 96px | 700 | serif-zh |
| Series ZH | `.series-zh` | 84px | 700 | serif-zh |
| Section title | `.h-section-zh` | 64px | 700 | serif-zh |
| Term question | `.term-question` | 44px | 500 | serif-zh |
| Term ZH (cover) | `.term-zh` | 32px | 600 | sans-zh (IKB) |
| Lead | `.lead` | 30px | 400 | sans-zh |
| Body | `.body` | 26px | 400 | sans-zh |
| Section label | `.section-label` | 20px | 600 | mono (IKB) |
| Plate caption | `.plate-caption` | 18px | 400 | mono (IKB) |
| Chrome / foot meta | `.chrome` / `.foot` | 18px | 500-600 | mono |

Task-scoped classes (numbered lists, comparison columns, etc.) are defined inline in each `index.html`, not here. See `layouts.md` for guidance.

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

### `.h-display-zh em` / `.h-section-zh em` — IKB underline

```html
<h2 class="h-display-zh">Demo 漂亮<br><em>上生产翻车</em></h2>
```

Thick IKB underline (6px on display, 5px on section), large offset. Use for the single most important phrase per page. **One em block per title.**

Yellow background fills on em are forbidden. Yellow lives only on the cover bar.

### `.section-label` — IKB tag with square mark

```html
<p class="section-label">核心比喻</p>
<p class="section-label">为什么重要</p>
<p class="section-label">真实案例</p>
```

Small IKB blue square + mono uppercase IKB text. This is what makes IKB blue visible on every page and replaces what used to be the yellow `.kicker`. Use one per content page.

### `.body strong` — IKB inline emphasis

```html
<p class="body">大多数团队在 LLMOps 上失败,是因为 <strong>缺少反馈闭环</strong>,不是模型选错了。</p>
```

Use for inline emphasis inside body copy. IKB color, 600 weight.

## Image Containers

Use `.illust-frame` for AI-generated illustrations. Use `.frame-img` for photographic evidence.

| Class | Fit | Use |
|---|---|---|
| `.illust-frame` | contain | AI-generated illustrations — preserves whole image |
| `.frame-img` | cover | Photographic evidence — cropping is acceptable |

The seed leaves `.illust-frame` height up to the task. See `illustration-prompts.md` "How Big Should the Illustration Be":

- Concept page (image-led): 480-560px
- List item (one mini per row): 160-260px
- Inline step mark: 100-160px

Captions use `.plate-caption` (IKB mono, 18px).

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

## Chrome (required on every page)

Top metadata bar. IKB blue hairline + IKB category label is what makes the system color visible on every page.

```html
<div class="chrome">
  <span class="c-cat">核心比喻 · Metaphor</span>
  <span class="c-num">02 / 05</span>
</div>
```

`.c-cat` is IKB, `.c-num` is grey. The `border-bottom` is IKB hairline.

## Footer (required on every page)

Bottom metadata bar. IKB blue hairline + IKB page number for the same reason.

```html
<div class="foot">
  <span class="f-tag">每天吃透一个 AI 知识点</span>
  <span class="f-num">02 / 05</span>
</div>
```

`.f-tag` is grey, `.f-num` is IKB. Pinned via `margin-top: auto` inside the flex column `.content` — preserve the flex column or footer collision happens (see `style-system.md` Anti-pattern C).
