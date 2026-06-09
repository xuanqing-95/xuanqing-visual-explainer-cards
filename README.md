# Visual Explainer Cards

An OpenClaw / Claude Code / Codex skill that creates illustrated Xiaohongshu/Rednote knowledge-card series combining GPT Image 2 explanatory illustrations with editorial HTML layout.

Turn abstract concepts, tutorials, AI knowledge, and educational content into clear 3:4 social cards with small in-image Chinese labels, accurate outer typography, and automated validation.

## Install

### Dependencies

```bash
# Node (Playwright for HTML→PNG rendering)
npm install playwright

# Python (background normalization for generated illustrations)
pip install Pillow
# or
pip install -r requirements.txt

# bun (required by baoyu-imagine)
curl -fsSL https://bun.sh/install | bash
```

### External Skills

This skill relies on two companion skills for image generation:

| Skill | Purpose |
|---|---|
| [baoyu-imagine](https://github.com/xuanqing-95/baoyu-imagine) | GPT Image 2 labeled illustration generation |
| [mz-image-gen](https://github.com/xuanqing-95/mz-image-gen) | No-text fallback illustration generation |

Install them into your skills directory before using this skill.

### Playwright Browsers

```bash
npx playwright install chromium
```

## Quick Start

```
Use $visual-explainer-cards to turn "Token 是什么" into an illustrated Xiaohongshu knowledge-card series.
```

A complete worked example lives in [`examples/llmops/`](examples/llmops/) — source, storyboard, prompts, HTML, and rendered output for a 5-page LLMOps knowledge-card series.

## Visual System

**Editorial-first** (Indigo Porcelain default). Magazine-style serif display + sans body + mono meta, dual-color palette (IKB Blue for system structure + Mustard Yellow for emphasis only).

- 1 dual-color default (Indigo Porcelain) + 3 single-color alternates (Lemon Yellow, Lemon Green, Safety Orange)
- 5 layout recipes (S00 series cover, S01 concept+image, S02 tall ledger, S03 before/after, S04 closing)
- Single board size: 1080×1440 (3:4)
- Hairline rules, off-white paper (`#fafaf8`), no shadows / gradients / rounded corners
- 1 illustration per 5-page set (metaphor page only), not one per page

## Structure

```
visual-explainer-cards/
├── SKILL.md                                # Skill instructions (Core Workflow)
├── README.md
├── assets/template.html                    # Editorial HTML seed (Indigo Porcelain)
├── scripts/
│   ├── generate-labeled-illustration.py    # GPT Image 2 labeled illustrations (Step 10)
│   ├── generate-illustration.py            # No-text fallback illustrations (Step 11)
│   ├── generate.mjs                        # Direct OpenAI-compatible image gen
│   ├── render.mjs                          # HTML → PNG via Playwright
│   └── validate.mjs                        # R1-R7 + identity validator
├── references/
│   ├── background-systems.md               # Dot / cross / ring matrix patterns
│   ├── beginner-explanation.md             # Teaching protocol
│   ├── components.md                       # Type scale, frames, emphasis patterns
│   ├── design-system.md                    # Canvas, typography, two-layer color logic
│   ├── illustration-prompts.md             # Illustration modes & palette lock
│   ├── layouts.md                          # S00-S04 layout recipes
│   ├── metaphor-library.md                 # Abstract → concrete mappings
│   ├── platform-specs.md                   # Xiaohongshu 1080×1440 spec
│   ├── prompt-strategy-audit.md            # Prompt design rationale
│   ├── qa-checklist.md                     # Pre-delivery QA
│   ├── style-system.md                     # Editorial identity rules & anti-patterns
│   ├── theme-presets.md                    # Indigo Porcelain + 3 alt accents
│   └── visual-routing.md                   # Information shape → visual type routing
├── agents/openai.yaml                      # Agent config
└── requirements.txt                        # Python dependencies
```

## Validator

`scripts/validate.mjs` enforces 7 rules using real Playwright rendering, not static scan:

- **R1** Overflow — any poster whose content exceeds 1080×1440
- **R2** Type caps — `.h-display-zh` > 96px or > 2 lines on 1080×1440
- **R3** Footer collision — `.foot` overlapped by preceding content
- **R4** 4-band density — fewer than 3 of 4 horizontal bands carry content
- **R5** Frame overflow — children escaping `.illust-frame` / `.frame-img`
- **R6** Mode identity — Editorial mode requires serif loaded; Swiss mode (`data-mode="swiss"`) rejects serif + requires weight ≤300 at ≥72px
- **R7** Figure margin — browser-default `<figure>` margins not reset

Per `SKILL.md` Step 15, the validator is opt-in: show the rendered PNGs first, ask the user whether to auto-check.

## License

See [LICENSE.txt](LICENSE.txt).
