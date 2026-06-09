# Layout Recipes

Each page carries one layout recipe. Content shape decides layout — do not pick a pretty layout first and invent content to fit it.

## Content Density Rule (Hard)

On 1080×1440 cards, content must cover ≥75% of canvas height. Any pure-whitespace band >15% canvas height (>216px) needs a stated reason. Do NOT use `<div style="flex: 1"></div>` to push content to the vertical centre.

If your copy doesn't reach the minimum density, shorten the canvas (switch to 1:1) or pick a different recipe — never just publish under-filled.

---

## Editorial Recipes (default — Indigo Porcelain)

5 recipes cover most educational card sets. Mix and match across a 5-page set.

### S00 Series Cover

Best for page 1 of a recurring series (Day 0X · 每天吃透一个 AI 知识点).

Fixed elements (replace 5 variables):

| Variable | Example | Notes |
|---|---|---|
| `Day NN` | `Day 04` | top-right chrome |
| `term-en` | `LLMOps` | huge serif English, with mustard bar |
| `term-zh` | `大模型运维体系` | grey sub-line |
| `term-question` | `为什么同一个模型,别人用起来效果炸裂,你用起来平平无奇?` | open-ended hook |
| `foot-tagline` | `LLMOPS · 从能跑到可控` | bottom-left tag |

HTML skeleton:

```html
<section class="poster xhs cover-series" id="xhs-01-cover">
  <div class="content" style="gap:36px;">
    <div class="chrome">
      <span>AI Knowledge · Beginner Series</span>
      <span>Day 04</span>
    </div>
    <p class="kicker-plain" style="color:var(--ink);">Indigo Porcelain</p>
    <h1 class="series-zh">每天吃透一个<br><span class="ai-accent">AI</span> 知识点</h1>
    <hr class="hr-hairline">
    <div style="display:flex;flex-direction:column;gap:24px;">
      <p class="term-en">LLMOps</p>
      <p class="term-zh">大模型运维体系</p>
    </div>
    <p class="term-question">为什么同一个模型,别人用起来效果炸裂,你用起来平平无奇?</p>
    <div class="grow"></div>
    <div class="foot">
      <span>LLMOPS · 从能跑到可控</span>
      <span>AI Native · 004</span>
    </div>
  </div>
</section>
```

Hard rules:
- The series cover does NOT carry an illustration. Typography IS the cover.
- `term-en` should fit on one line. If your term is >8 characters, switch to two lines or shorten.
- `term-question` is one open question, not a sentence summarizing the topic.

### S01 Concept + Image plate

Best for explaining one concept with visual evidence (metaphor pages).

Structure:
- chrome
- yellow kicker (1-3 Chinese words)
- `.h-section-zh` with one `em` underline highlight (the metaphor target)
- `.plate` containing `.illust-frame` (560px) + mono `.plate-caption`
- `.caption` body paragraph below
- foot

```html
<section class="poster xhs concept-page" id="xhs-02-concept">
  <div class="content" style="gap:28px;">
    <div class="chrome"><span>核心比喻 · Metaphor</span><span>02 / 05</span></div>
    <p class="kicker">打个比方</p>
    <h2 class="h-section-zh">LLMOps 像<em>餐厅后厨</em></h2>
    <div class="plate">
      <figure class="illust-frame">
        <img src="assets/page-02.png" alt="...">
      </figure>
      <p class="plate-caption">Fig. 01 · 后厨的四个工位</p>
    </div>
    <p class="caption">一句承接的中文解释,把图里的元素与真实业务对应起来。</p>
    <div class="foot"><span>—— 模型不是终点,运维才是</span><span>02 / 05</span></div>
  </div>
</section>
```

### S02 Tall Ledger

Best for a numbered list of 3 items (symptoms, principles, steps).

Structure:
- chrome
- yellow kicker
- `.h-display-zh` with one `em` block
- `.ledger` with 3 `.row` items (yellow numbered block + serif title + sans sub)
- foot

```html
<section class="poster xhs" id="xhs-03-symptoms">
  <div class="content" style="gap:32px;">
    <div class="chrome"><span>为什么重要 · Why</span><span>03 / 05</span></div>
    <p class="kicker">缺 LLMOps 的典型症状</p>
    <h2 class="h-display-zh">Demo 漂亮<br><em>上生产翻车</em></h2>
    <div class="ledger grow">
      <div class="row"><span class="num">01</span>
        <p class="row-text">输出忽高忽低<span class="sub">一句具体说明。</span></p></div>
      <div class="row"><span class="num">02</span>
        <p class="row-text">成本悄悄飙涨<span class="sub">一句具体说明。</span></p></div>
      <div class="row"><span class="num">03</span>
        <p class="row-text">安全问题频发<span class="sub">一句具体说明。</span></p></div>
    </div>
    <div class="foot"><span>—— "能跑"不等于"可控"</span><span>03 / 05</span></div>
  </div>
</section>
```

Hard rules:
- Use exactly 3 rows. 2 looks unbalanced, 4+ overflows.
- Each `.row-text` main line ≤ 8 Chinese characters. Sub line ≤ 24 characters.

### S03 Before / After

Best for case study showing transformation.

Structure:
- chrome
- yellow kicker
- `.h-display-zh` with one `em` block
- `.ba` grid (2 columns): `.ba-before` (paper-deep) + `.ba-after` (ink black + yellow em)
- foot

```html
<section class="poster xhs" id="xhs-04-case">
  <div class="content" style="gap:28px;">
    <div class="chrome"><span>真实案例 · Case</span><span>04 / 05</span></div>
    <p class="kicker">某电商 AI 客服</p>
    <h2 class="h-display-zh">从写死<br>到<em>可管控</em></h2>
    <div class="ba">
      <div class="ba-card ba-before">
        <p class="ba-tag">Before · 上线初期</p>
        <p class="ba-h">主要状态</p>
        <hr class="hr-hairline">
        <ul><li>痛点 1</li><li>痛点 2</li><li>痛点 3</li></ul>
      </div>
      <div class="ba-card ba-after">
        <p class="ba-tag">After · 引入 LLMOps</p>
        <p class="ba-h">新状态<em>带强调</em></p>
        <hr class="hr-hairline" style="background:rgba(247,241,227,.3);">
        <ul><li>改变 1</li><li>改变 2</li><li>改变 3</li></ul>
      </div>
    </div>
    <div class="foot"><span>—— 把"试一下"变成"管起来"</span><span>04 / 05</span></div>
  </div>
</section>
```

### S04 Closing (A/B/C options)

Best for last page: self-check question with 3 options, one highlighted as the key.

Structure:
- chrome
- yellow kicker
- `.h-display-zh` with one `em` block (the question)
- `.options` with 3 `.opt` items (one `.is-key` highlighted in yellow)
- yellow `.hr-accent` + `.lead` action sentence
- foot

```html
<section class="poster xhs closing" id="xhs-05-closing">
  <div class="content" style="gap:28px;">
    <div class="chrome"><span>今日行动 · Action</span><span>05 / 05</span></div>
    <p class="kicker">Action · 今天检查一件事</p>
    <h2 class="h-display-zh">你的 prompt<br><em>写在哪?</em></h2>
    <div class="options">
      <div class="opt"><span class="letter">A</span>
        <p class="opt-text">选项 A<span class="sub">说明文字。</span></p></div>
      <div class="opt"><span class="letter">B</span>
        <p class="opt-text">选项 B<span class="sub">说明文字。</span></p></div>
      <div class="opt is-key"><span class="letter">C</span>
        <p class="opt-text">关键答案<span class="sub">这就是理想状态。</span></p></div>
    </div>
    <div class="grow"></div>
    <hr class="hr-accent">
    <p class="lead">一句行动建议,告诉读者从哪一步开始。</p>
    <div class="foot"><span>每天吃透一个 AI 知识点 · Day 0X</span><span>END</span></div>
  </div>
</section>
```

Hard rules:
- Always 3 options. `.is-key` marks the answer/ideal.
- `.is-key` letter wears the mustard block — this is the only highlight on this page.

---

## Layout Selection Cheatsheet

| Content shape | Recipe |
|---|---|
| Series cover with English term | S00 |
| Metaphor + visual evidence | S01 |
| 3-item numbered list (symptoms, principles, steps) | S02 |
| Before/After or two-state comparison | S03 |
| Self-check question, action prompt | S04 |
| 2-item comparison (no transformation) | S03 with simpler `.ba-card` content |
| 4+ item list | Re-think — split into two pages, or compress into S02 with shorter rows |

---

## When Recipes Don't Fit

If none of S00-S04 fits, do NOT invent a freeform layout. Instead:

1. Re-read the content and ask whether you've split it into the wrong pages.
2. Consider whether two pages should merge or one page should split.
3. If still no fit, document the new pattern in this file before using it.
