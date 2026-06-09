# Layouts

Use only these layouts in version 1.

## Portrait Hard Rules

- Fill the canvas vertically; active composition should cover at least 75% height.
- Illustration evidence should occupy 40%-60% height when it is the page's explanation.
- Every dense page needs a top hook, a middle evidence/body zone, and a bottom takeaway or conclusion.
- Do not place a small illustration beside text in the middle of a 3:4 canvas.
- Do not use horizontal-slide compositions on portrait cards.
- Do not add top metadata labels by default. Add `.show-meta` only when explicitly useful.

## Series Cover

Use for page 1 of recurring educational series. This cover is fixed, but it must stay inside the Guizang editorial system rather than becoming a standalone poster style. Default to the `Swiss Accent Cover` variant on the `Indigo Porcelain` theme.

Structure:

- Top chrome line: stable column identity on the left and `DAY NN` or `VOL.NN` on the right.
- Main area: small mono kicker, large serif series line, English technical term as the oversized visual anchor, Chinese explanation, and one user-scenario question.
- Bottom foot line: short Chinese topic description on the left and an English act/series marker on the right.

Classes: `.layout-series-cover`, `.cover-swiss-accent`, `.chrome-line`, `.cover-main`, `.cover-kicker`, `.cover-series`, `.cover-term`, `.cover-cn`, `.cover-question`, `.foot-line`.

Rules:

- Do not use generated illustration on the cover by default.
- Do not add category badges or decorative icons.
- Do use Guizang-style chrome and foot lines. The cover should feel like a magazine hero page adapted to 3:4.
- Keep the cover text sparse: series line, English term, Chinese explanation, one question.
- Use serif Chinese for the series line/question, Playfair-style display typography for the English term, mono for metadata.
- The English term must be the visual anchor, not the Chinese title.
- Use the Indigo Porcelain palette by default: porcelain paper, deep indigo ink, blue accent, restrained warm-yellow underline. Do not use the previous red `AI` accent.
- The question should be concrete and user-facing, for example `为什么同一个问题，AI 每次回答都不一样？`
- Content pages after the cover may use any suitable explanatory layout.

## Hero Split

Use for the cover. Stack vertically: metadata, dominant hook, large illustration/evidence band, bottom promise strip. Do not center a small illustration beside the title on a portrait canvas.

Classes: `.layout-hero`, `.hero-copy`, `.hero-art`.

## Annotated Canvas

Use one large illustration with 2-4 HTML labels or arrows around it. Keep labels short.

Classes: `.layout-annotated`, `.art-stage`, `.annotation`.

## Concept Evidence

Use HTML title at the top, one large illustration occupying the middle 45%-55%, and a bottom explanation/takeaway band. Side-by-side is forbidden on 3:4 unless both columns intentionally fill the full height.

Classes: `.layout-concept`, `.concept-copy`, `.evidence-well`.

## Labeled Figure Evidence

Default for `labeled-gpt-image` pages. Use a Guizang-style HTML title and short lead at the top, a GPT Image 2 illustration panel in the middle, and a bottom explanation grid. The generated image may contain only short internal labels and must not duplicate the outer title.

Structure:

- Top: `.concept-copy` with `.kicker`, `.page-title`, optional `.body`.
- Middle: `.labeled-figure` containing the generated image.
- Bottom: `.explain-grid` with one accent `.explain-box` for the main takeaway and one neutral `.explain-box` for caveat or misconception.

Classes: `.layout-concept`, `.concept-copy`, `.labeled-figure`, `.explain-grid`, `.explain-box`.

Use this when the picture itself needs labels such as `原始文字`, `切分规则`, `Token 块`, `交给模型`. Keep bottom copy short and do not repeat every in-image label.

Add `.figure-zoom` to `.labeled-figure` only when the generated image background has been normalized to the page paper color and the illustration has too much safe margin. Do not use zoom if it crops labels or arrow endpoints.

## Two-Side Comparison

Use two equal modules with a shared title. Allow one accent module.

Classes: `.layout-comparison`, `.compare-grid`, `.panel`.

## Vertical Process

Use 3-5 numbered rows. Each row gets a title and one consequence.

Classes: `.layout-process`, `.process-list`, `.process-row`.

## Tall Ledger

Use 4-6 rows for principles, mistakes, or takeaways.

Classes: `.layout-ledger`, `.ledger`, `.ledger-row`.

## Data Focus

Use one large number or formula plus 2-3 supporting statements.

Classes: `.layout-data`, `.data-hero`, `.fact-grid`.

## Matrix

Use four or six related concepts. Keep cell text short.

Classes: `.layout-matrix`, `.matrix`.

## Closing Action

Use a short title, 3-4 action rows, and a bottom next-step block.

Classes: `.layout-action`, `.action-list`, `.next-block`.
