# Design System

## Canvas

- Xiaohongshu: 1080 x 1440.
- Outer padding: 80px.
- Spacing scale: 8, 16, 24, 40, 64, 96px.
- Default theme is Guizang `Indigo Porcelain`: porcelain paper `#f1f3f5`, deep indigo ink `#0a1f3d`, muted blue accent `#0a4fb8`, soft blue-gray modules, and restrained warm-yellow highlight for the English term underline.
- Do not return to red/yellow/blue primary-color styling unless the user explicitly asks for a brighter variant.

## Portrait Composition

Plan every 3:4 page as five intentional vertical zones:

| Zone | Height | Purpose |
|---|---:|---|
| Header | 0-90px | optional category, issue, page |
| Hook | 240-380px | dominant title and promise |
| Evidence | 520-720px | illustration, diagram, comparison, ledger |
| Takeaway | 100-180px | consequence, formula, compressed conclusion |
| Footer | 52-86px | orientation or next-page cue |

Active composition must occupy at least 75% of the canvas. A large empty middle or lower band is a failure unless the page is an explicit statement page.

## Typography

- Display: sans-serif, light weight, 92-150px.
- Page title: sans-serif, 72-96px, at most two lines.
- Mid title: 38-48px.
- Body: at least 28px.
- Metadata: 18-20px mono.
- Render outer titles, body explanations, caveats, dates, prices, and unstable claims in HTML.
- Short in-image labels are allowed in GPT Image 2 labeled illustrations when they make the picture self-explanatory.
- Shorten copy before reducing body text below 28px.

## Information Hierarchy

Each page should contain:

1. One dominant message.
2. One evidence or explanation zone.
3. Optional supporting note or takeaway.

Metadata rows are optional and disabled by default. Use them only when the user wants an issue/editorial system or when page orientation genuinely benefits from them.

Use one accent color per set. Align elements to a visible grid.

For the recurring AI knowledge series, keep the whole set on the Indigo Porcelain theme unless the user explicitly chooses another Guizang preset.

## Page Rhythm

For 5-7 pages, use at least four different silhouettes:

- cover with dominant hook and bottom evidence strip
- large evidence illustration
- structured comparison or matrix
- tall process or ledger
- closing statement/action

Never repeat a centered title-plus-small-image composition. After an illustration-heavy page, use a structured text/data page.

## Illustration Integration

- HTML controls the page. When an illustration is used as evidence, give it 40%-60% of the canvas height. Small corner illustrations are allowed only as secondary decoration.
- Keep illustration inside a deliberate evidence well or side zone.
- Default for beginner concept cards: use GPT Image 2 to generate a central explanation illustration with a few readable Chinese labels, then use HTML for the outer card title, body, caveat, and conclusion.
- Generated in-image labels are allowed only when they make the illustration independently understandable.
- GPT Image 2 illustrations should feel like Guizang-style editorial diagrams: thin electronic-ink lines, quiet paper, restrained blue accents, precise geometry, and no chunky cartoon/toy rendering.
- Do not place long explanations, caveats, dates, prices, or unstable facts inside generated images.
- Do not duplicate the HTML title inside the generated image.
- Use HTML labels and arrows when generated text must be perfectly editable, when labels are long, or when the model repeatedly makes Chinese mistakes.
- Prefer a page-matched uniform illustration background inside a borderless evidence well.
- Normalize the edge-connected generated background to the exact page paper color before rendering; do not rely on the model matching a hex value exactly.
- Use transparent PNG only for isolated characters or objects that must overlap HTML regions.
- Do not use an illustration as faint decoration behind dense text.
- Crop only after checking that the main action remains visible.
- Do not generate full-page visual backgrounds by default.
