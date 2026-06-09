# Layout Recipes

Each page carries one layout recipe. Content shape decides layout — do not pick a pretty layout first and invent content to fit it.

## Table of Contents

- [Content Density Rule (Hard)](#content-density-rule-hard)
- [Swiss International Recipes](#swiss-international-recipes)
  - [S01 Accent Cover](#s01-accent-cover)
  - [S02 Concept + Image](#s02-concept--image)
  - [S03 File Card / Evidence Split](#s03-file-card--evidence-split)
  - [S04 Pull Quote / Thesis](#s04-pull-quote--thesis)
  - [S05 Checklist / Trap Rows](#s05-checklist--trap-rows)
  - [S06 KPI Tower](#s06-kpi-tower)
  - [S07 H-Bar Chart](#s07-h-bar-chart)
  - [S08 Image Hero](#s08-image-hero)
  - [S09 Tall Ledger](#s09-tall-ledger)
  - [S10 Stacked Ledger + Image](#s10-stacked-ledger--image)
  - [S11 Matrix + Hero Stat](#s11-matrix--hero-stat)
  - [S12 Closing Note](#s12-closing-note)
- [Editorial Magazine Recipes](#editorial-magazine-recipes)
- [WeChat Adaptation](#wechat-adaptation)

## Content Density Rule (Hard)

On 1080×1440 cards, content must cover ≥75% of canvas height. Any pure-whitespace band >15% canvas height (>216px) needs a stated reason. Do NOT use `<div style="flex: 1"></div>` to push content to the vertical centre.

If your copy doesn't reach the minimum density, **shorten the canvas (switch to 1:1) or pick a different recipe** — never just publish under-filled.

---

## Swiss International Recipes

### S01 Accent Cover

Best for Rednote page 1, series cover.

Structure:
- Top: `chrome-min` row (category, date, issue)
- Category kicker (`t-cat`) in accent color
- Large statement title (`h-statement` or `h-xl`), 2-4 lines
- Horizontal accent rule (`hr-accent`)
- Lead sentence
- Bottom: metadata row

HTML skeleton:
```html
<section class="poster xhs" id="xhs-01">
  <div class="dot-mat"></div>
  <div class="content stack gap-9">
    <div class="chrome-min">
      <span>AI KNOWLEDGE</span>
      <span>Vol. 01</span>
    </div>
    <div class="stack gap-7">
      <p class="t-cat">封面 · Cover</p>
      <h1 class="h-statement">标题<br>占位</h1>
    </div>
    <div class="grow"></div>
    <hr class="hr-accent">
    <p class="lead">用一句克制的解释，告诉读者这一组卡片在讲什么。</p>
    <div class="row gap-6">
      <p class="t-meta">Issue 01</p>
      <p class="t-meta">/ AI Native</p>
    </div>
  </div>
</section>
```

### S02 Concept + Image

Best for explaining one concept with visual evidence.

Structure:
- `chrome-min` header
- `h-xl` page title
- Large `frame-img` (3:4 or 4:3 ratio) — the illustration IS the evidence
- `lead` or `body` text below
- Optional caption in `mono`

HTML skeleton:
```html
<section class="poster xhs" id="xhs-02">
  <div class="content stack gap-7">
    <div class="chrome-min">
      <span>核心概念</span>
      <span>02</span>
    </div>
    <h2 class="h-xl">概念标题</h2>
    <figure class="frame-img r-3x4 fit-contain">
      <img src="assets/page-02.png" alt="description">
    </figure>
    <p class="lead">解释文字。</p>
    <p class="t-meta">补充说明</p>
  </div>
</section>
```

### S03 File Card / Evidence Split

Best for one idea with nuance, before/after, or side-by-side comparison.

Structure:
- `chrome-min` header
- `h-xl` page title
- Two-column grid: left = evidence image, right = explanation cards
- Cards use `card-fill` or `card-outlined`

HTML skeleton:
```html
<section class="poster xhs" id="xhs-03">
  <div class="content stack gap-7">
    <div class="chrome-min">
      <span>例子</span>
      <span>03</span>
    </div>
    <h2 class="h-xl">对比标题</h2>
    <div class="grid-2-9" style="flex:1;">
      <figure class="frame-img r-3x4 fit-contain">
        <img src="assets/page-03.png" alt="description">
      </figure>
      <div class="stack gap-6">
        <div class="card-fill">
          <p class="t-cat">Before</p>
          <p class="body">描述</p>
        </div>
        <div class="card-accent">
          <p class="t-cat">After</p>
          <p class="body">描述</p>
        </div>
      </div>
    </div>
  </div>
</section>
```

### S04 Pull Quote / Thesis

Best for a core sentence or conclusion. This is the ONE recipe where ≤60% canvas content is allowed (hero statement = intentional whitespace).

Structure:
- `chrome-min` header at top
- Very large `h-statement` or `h-xl` title (the quote)
- Source/context row in `mono`
- `hr-hairline` above source
- Small footer metadata

Required anchors (without these, whitespace reads as missing content):
1. Source/context row 18-20px mono ≤15% from bottom
2. Date-stamp or kicker at top
3. Hairline rule above the source row

### S05 Checklist / Trap Rows

Best for practical content, common mistakes, step-by-step.

Structure:
- `chrome-min` header
- `h-xl` page title
- 4-6 rows, each with: mono number, Chinese title, consequence/description
- Each row uses `hr-hairline` divider

HTML skeleton:
```html
<section class="poster xhs" id="xhs-05">
  <div class="content stack gap-7">
    <div class="chrome-min">
      <span>常见错误</span>
      <span>05</span>
    </div>
    <h2 class="h-xl">新手容易踩的坑</h2>
    <div class="stack" style="flex:1;">
      <div class="stack gap-5" style="padding:24px 0;border-bottom:1px solid var(--grey-2);">
        <p class="t-meta">01</p>
        <p class="lead">错误标题</p>
        <p class="body">后果描述</p>
      </div>
      <!-- repeat for each row -->
    </div>
  </div>
</section>
```

### S06 KPI Tower

Best for quantitative data, metrics, statistics.

Structure:
- `chrome-min` header
- `h-xl` page title
- 2-4 columns, each with: large number (`num-xl`), label (`t-meta`), optional bar

HTML skeleton (3:4 uses 2 columns):
```html
<div class="kpi-tower-row">
  <div class="tower-col">
    <p class="num">128K</p>
    <p class="lbl">Token 上限</p>
    <div class="bar-tower" style="--h:320px"></div>
  </div>
  <div class="tower-col">
    <p class="num">4K</p>
    <p class="lbl">基础上下文</p>
    <div class="bar-tower" style="--h:120px"></div>
  </div>
</div>
```

### S07 H-Bar Chart

Best for rankings, comparisons of 5-10 items.

Structure:
- `chrome-min` header
- `h-xl` page title
- 5-10 bar rows, each with label + track + value

Max rows: 6 on 1:1, 10 on 3:4, 8 on 21:9.

### S08 Image Hero

Best for when the image is the main content (photo, screenshot, illustration).

Structure:
- `chrome-min` header
- `h-xl` page title
- Full-width image occupying 45%-65% of vertical canvas
- Bottom stats or caption row

### S09 Tall Ledger

Best for lists, roles, pros/cons, numbered explanations.

Structure:
- `chrome-min` header
- `h-xl` page title
- 4-6 full-width rows, each minimum 118-170px vertical
- Left: large mono number. Right: title + consequence.

This is the primary layout for "X reasons" or "X things you need to know" pages.

HTML skeleton:
```html
<section class="poster xhs" id="xhs-09">
  <div class="content stack gap-7">
    <div class="chrome-min">
      <span>为什么要关心</span>
      <span>04</span>
    </div>
    <h2 class="h-xl">三个关键影响</h2>
    <div class="stacked-ledger">
      <div class="ledger-row">
        <p class="ledger-num">01</p>
        <div class="ledger-lbl">影响标题
          <span class="sub">详细解释</span>
        </div>
      </div>
      <!-- repeat -->
    </div>
  </div>
</section>
```

### S10 Stacked Ledger + Image

Best for quantified lists with visual support.

Structure:
- `chrome-min` header
- `h-xl` page title
- Image well at top (16:10 or 4:3)
- Stacked ledger rows below

### S11 Matrix + Hero Stat

Best for capability matrices, "this covers X domains" pages.

Structure:
- `chrome-min` header
- `h-xl` page title
- 8-cell matrix (2×4 on 3:4)
- Bottom: hero stat with `num-mega`

Max: 8 cells on 3:4 (2×4), 9 on 1:1 (3×3), 12 on 21:9 (4×3). Max one `is-accent` cell.

### S12 Closing Note

Best for final page.

Structure:
- `chrome-min` header
- Large takeaway title (≤2 lines)
- 4-6 ledger items with sub-lines
- Closing block: pull-quote OR signature OR CTA
- Small footer label

**Minimum density**: title + ≥4 ledger items with sub-lines + closing block. 3 short ledger lines on 3:4 is a failure mode.

---

## Editorial Magazine Recipes

See `style-system.md` "Mode A" for Editorial-specific recipes (M01-M15). These use serif typography, ink-wash backgrounds, and different component styles.

---

## WeChat Adaptation

For 21:9: use wide composition, title in left/center-left safe area, right half for visual.

For 1:1: distill to simple centered title, big type, generous margins. Readable as thumbnail.

For pair preview: put 21:9 + 1:1 in one HTML preview frame for review.
