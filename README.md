# xuanqing-visual-explainer-cards

An OpenClaw / Claude Code / Codex skill that creates illustrated Xiaohongshu/Rednote knowledge-card series combining GPT Image 2 explanatory illustrations with Guizang-style editorial HTML layout.

By **玄清 (xuanqing-95)** — a Guizang-style visual explanation skill for AI knowledge content.

Turn abstract concepts, tutorials, AI knowledge, and educational content into clear 3:4 social cards with small in-image Chinese labels, accurate outer typography, and automated validation.

## Install

### Dependencies

Only one external dependency — [Playwright](https://playwright.dev/) for HTML→PNG rendering and card validation:

```bash
npm install playwright
npx playwright install chromium
```

### Environment Variables

Set these for image generation (`scripts/generate.mjs`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | API key |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | API endpoint (OpenAI-compatible) |
| `OPENAI_IMAGE_MODEL` | No | `gpt-image-2` | Image model to use |

## Quick Start

```
Use xuanqing-visual-explainer-cards to turn "Token 是什么" into an illustrated Xiaohongshu knowledge-card series.
```

## What's Included

```
xuanqing-visual-explainer-cards/
├── SKILL.md                    # Skill instructions
├── assets/template.html        # Guizang-style HTML card template (Indigo Porcelain)
├── scripts/
│   ├── generate.mjs            # Image generation via OpenAI-compatible API
│   ├── render.mjs              # HTML → PNG via Playwright
│   └── validate.mjs            # Automated card validation (R1-R7 rules)
└── references/
    ├── beginner-explanation.md # Teaching protocol
    ├── design-system.md        # Canvas, typography, color tokens
    ├── illustration-prompts.md # Illustration mode & prompt guide
    ├── layouts.md              # Page layout catalog
    ├── metaphor-library.md     # Abstract→concrete visual mappings
    ├── qa-checklist.md         # Pre-delivery QA checks
    └── visual-routing.md       # Information shape → visual type routing
```

### Scripts

| Script | Function |
|---|---|
| `generate.mjs` | Standalone image generation. No npm deps, uses Node.js built-in fetch. Supports `--prompt`, `--promptfile`, `--ar`, `--quality`, `--model`. |
| `render.mjs` | Renders all `<section class="poster">` in `index.html` to PNG at 1200×1600 (3:4) via Playwright. |
| `validate.mjs` | 7-rule automated validation: R1 overflow, R2 footer collision, R3 Swiss bold display, R4 min font, R5 4-band density, R6 h-xl cap, R7 figure margin drift. Exits 1 on FAIL. |

## License

See [LICENSE.txt](LICENSE.txt).

## Credits

Built by [玄清 (xuanqing-95)](https://github.com/xuanqing-95). Design language inspired by Guizang's editorial PPT style. Validation rules from guizang-social-card-skill.
