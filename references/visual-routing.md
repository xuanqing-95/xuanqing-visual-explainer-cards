# Visual Routing

Choose the expression that makes the idea easiest to understand.

Routing happens only after the beginner explanation brief is complete. A visually elegant page cannot compensate for a missing definition, example, causal link, or consequence.

| Information shape | Generated illustration role | HTML structure |
|---|---|---|
| Abstract concept needing intuition | mechanism or metaphor evidence | concept explanation |
| Hook or central metaphor | hero metaphor | hero split |
| Two things differ | separate before/after images, or one scene only when the transition itself is the subject | exact two-side comparison |
| 3-5 sequential actions | separate step images when each action needs a referent; otherwise one process scene | vertical process |
| 4-6 practical items | one image per visible item, or one object set when they form a single scene | tall ledger |
| One important number | cause/consequence scene | exact data focus |
| 4-6 related concepts | object map | labeled matrix |
| Final experiment or action | compact action scene | closing checklist |
| One sharp conclusion | supporting metaphor | statement |

## Illustration Requirement

Every non-cover card must contain at least one model-generated illustration. Visual routing decides what the illustration explains and how large it should be; it does not decide whether the page gets an illustration.

Choose the illustration count before prompting. Count the objects, states, or steps that must be independently visible for the page's claim to make sense. Give each one its own `illustrations[]` entry when combining them would hide distinctions. Use one image only when one coherent scene truly explains the whole page.

Choose an illustration that answers at least one of these questions:

- What concrete object behaves like this abstract concept?
- What action makes the mechanism visible?
- What spatial relationship is difficult to explain with text alone?
- What scene would let a beginner predict the outcome?

When exact information must stay in HTML:

- For numbers or prices, generate a small cause/consequence or object scene and keep every number in HTML.
- For checklists or procedures, generate a compact action scene and keep steps in HTML.
- When a screenshot is strong evidence, use it alongside a generated supporting illustration; do not count the screenshot as the generated illustration.
- If an illustration would only repeat the title, change the scene so it shows mechanism, consequence, or a concrete referent.

HTML-native diagrams may add precision, but they never replace the required model-generated illustration.

## Page Rhythm

Write the rhythm plan into `storyboard.yaml` before HTML design. `page_rhythm.strategy` states the sequence logic; each beat records `page`, `purpose`, `silhouette`, `visual_weight`, and `transition`.

For a typical 4-7 page set, let the content decide the exact count:

1. Cover or HTML-led hero
2. Concept explanation with one evidence illustration
3. Mechanism, comparison, or structured data with a generated supporting image
4. Concrete example or use case with a generated supporting image
5. Boundary, misconception, or tradeoff with a generated supporting image when needed
6. Closing action with a compact generated image

Do not repeat a layout or silhouette on adjacent content pages. For three or more content pages, use at least three distinct layouts and three distinct silhouettes. The standalone storyboard validator enforces this before design begins.
