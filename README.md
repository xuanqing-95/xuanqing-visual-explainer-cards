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

# Image generation
# Configure any OpenAI-compatible image endpoint:
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.openai.com/v1
# or use ZENMUX_API_KEY; the wrappers will map it automatically.
```

### Optional External Skills

This skill does **not** require `baoyu-imagine` or `mz-image-gen`.

By default, image generation uses the local `scripts/generate.mjs` OpenAI-compatible wrapper. The older companion skills can still be used manually if you prefer their CLIs, but they are not installation requirements.

| Skill | Purpose |
|---|---|
| baoyu-imagine | Optional GPT Image 2 CLI backend |
| mz-image-gen | Optional no-text fallback backend |

### Playwright Browsers

```bash
npx playwright install chromium
```

## Quick Start

```
Use $xuanqing-visual-explainer-cards to turn "Token 是什么" into an illustrated Xiaohongshu knowledge-card series.
```

A complete worked example lives in [`examples/llmops/`](examples/llmops/) — source, storyboard, prompts, HTML, and rendered output for a 5-page LLMOps knowledge-card series.

## Visual System

**Editorial-first** (Indigo Porcelain default). Magazine-style serif display + sans body + mono meta, dual-color palette (IKB Blue for system structure + Mustard Yellow for emphasis only).

- 1 dual-color default (Indigo Porcelain) + 3 single-color alternates (Lemon Yellow, Lemon Green, Safety Orange)
- One fixed series cover plus content-page composition primitives
- Single board size: 1080×1440 (3:4)
- Hairline rules, off-white paper (`#fafaf8`), no shadows / gradients / rounded corners
- 3-4 supporting illustrations in a typical 5-page set, each placed inside `.evidence-figure`

## Structure

```
xuanqing-visual-explainer-cards/
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
- **R2** Type caps — `.h-display` > 132px or `.h-xl` > 100px, or > 2 lines on 1080×1440
- **R3** Footer collision — `.foot` overlapped by preceding content
- **R4** 4-band density — fewer than 3 of 4 horizontal bands carry content
- **R5** Frame overflow — children escaping `.illust-frame` / `.frame-img`
- **R6** Mode identity — Editorial mode requires serif loaded; Swiss mode (`data-mode="swiss"`) rejects serif + requires weight ≤300 at ≥72px
- **R7** Figure margin — browser-default `<figure>` margins not reset

Per `SKILL.md` Step 15, the validator is opt-in: show the rendered PNGs first, ask the user whether to auto-check.

## License

This project is licensed under the **GNU Affero General Public License v3.0**.
See [`LICENSE`](LICENSE) for the full license text and [`NOTICE.md`](NOTICE.md)
for attribution notes.

What this means in plain language:

- You may use, modify, and redistribute this skill.
- If you distribute a modified version, keep it under AGPL-3.0-compatible terms and provide the complete corresponding source code.
- If you run a modified version as a network service for others, provide users access to the corresponding source code as required by AGPL-3.0.
- Keep copyright notices, license text, and attribution notices intact.
