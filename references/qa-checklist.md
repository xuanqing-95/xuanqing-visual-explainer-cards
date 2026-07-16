# QA Checklist

## Storyboard gate

- Was `storyboard.yaml` created and validated before `index.html` was designed?
- Does `page_rhythm` contain one deliberate beat per page with purpose, silhouette, visual weight, and transition?
- Do adjacent content pages change both layout and silhouette?
- For three or more content pages, are at least three layouts and three silhouettes used?
- Do every card's `data-page-id`, `data-layout`, and `data-silhouette` match the storyboard?
- Does every planned `illustrations[].id` map to exactly one HTML image through `data-illustration-id`?
- Do every generated asset, wrapper class, prompt, and output size match that illustration's storyboard entry, with no missing or unplanned images?

## Meaning

- Can a beginner understand the page without reading the post body?
- Does the full set answer: what it is, what it is not, how it works, one concrete example, and why it matters?
- Are core messages complete explanatory sentences rather than keywords?
- Is every technical term explained in plain language at first use?
- Can a beginner predict the outcome of one new example after reading?
- Is the boundary of each analogy or likely misconception stated?
- Does the illustration show a mechanism or consequence?
- Does nearby copy explicitly tell the reader what to notice in the illustration?
- Does every illustration-led page visibly connect input -> transformation -> result -> consequence?
- Does every annotation point to a specific visual element instead of floating beside the image?
- With paragraphs hidden, can a beginner identify the image's input, action, direction, and result?
- With text restored, can a beginner explain why the result happens?
- Would the page remain structurally clear if the illustration were removed?
- Is every claim accurate and current?
- Does each page communicate one message?

## Typography

- Are outer-card titles, definitions, caveats, dates, prices, and unstable claims rendered in HTML?
- If generated images contain text, is every character correct, readable, and intentionally requested?
- Does the generated image avoid duplicating the outer HTML title?
- Is body text at least 24px and lead text at least 28px?
- Is the page title at most two lines?
- Is there any generated-image text or gibberish?

## Composition

- Does every non-cover card contain at least one model-generated illustration, even when HTML carries the exact code, numbers, comparison, or checklist?
- Is the illustration clearly visible and not merely decorative?
- Was every `illustrations[].image_slot` defined before writing its prompt or generating its image?
- For each illustration, do `requested_orientation`, `model_output_size`, and `subject_bbox` match its chosen slot?
- Does every major generated illustration use an `.evidence-figure` wrapper instead of a naked `.illust-frame`?
- Does the illustration feel native to the card: optically centered, balanced top/bottom margin, not pasted in, not stuck to the top?
- Does each generated illustration visually fill its intended slot, rather than appearing as a small centered diagram with excessive paper margin?
- Did the prompt include a measurable composition contract for content width, content height, balanced margins, and visual centering?
- Did the prompt include a pixel margin contract for the actual generator output size (`1536x1024`, `1024x1024`, or `1024x1536`)?
- Does the HTML slot match the generated image's physical aspect ratio, e.g. `1536x1024` landscape output placed in `.evidence-figure.landscape` or another near-3:2 slot instead of a shallow wide band?
- Did the generation wrapper run default `auto-frame`, or was `--no-auto-frame` intentionally justified?
- For wide workflow/comparison/metaphor pages, was the image generated with an explicit landscape canvas, or enlarged with `.wide-flow` / `.zoom-*` after label-crop inspection?
- Does the cover bar under `.term-en` follow the real English term width instead of stretching across the full row?
- Is the cover `term-zh` a Chinese explanation of the English professional term, not an English subtitle?
- Does HTML remain the dominant layout system?
- Does active content fill at least 75% of the canvas height?
- Does the evidence zone occupy 40%-60% height when an illustration is the main explanation?
- Is any middle or lower 25% band empty without an explicit reason?
- Does the card set use at least four different page silhouettes?
- Is the typography safe zone respected?
- Does active content occupy the vertical canvas intentionally?
- Are adjacent pages visually different?

## Technical

- Run `validate-storyboard.mjs` before prompting or HTML design.
- Run `render.mjs`.
- Run `validate.mjs`.
- Fix every FAIL.
- Confirm every non-cover card has at least one `<img data-generated-illustration="true" data-illustration-id="...">` inside `.illust-frame` and that the ids exactly match the storyboard.
- Confirm every generated PNG has the generator-written `.generation.json` sidecar and that validation verifies its model, provider, prompt hash, dimensions, and final image hash.
- Confirm the number of final PNGs equals the number of `.poster` elements and every PNG is 1080×1440.
- Confirm all fonts and images loaded and no placeholder or pending-image text remains.
- Inspect every output PNG at full size and phone thumbnail size.
