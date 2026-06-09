# xuanqing-visual-explainer-cards

An OpenClaw / Claude Code / Codex skill that creates illustrated Xiaohongshu/Rednote knowledge-card series combining GPT Image 2 explanatory illustrations with Guizang-style editorial HTML layout.

By **玄清 (xuanqing-95)** — a Guizang-style visual explanation skill for AI knowledge content.

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

## Structure

```
visual-explainer-cards/
├── SKILL.md                  # Skill instructions
├── assets/template.html      # Guizang-style HTML card template
├── scripts/
│   ├── generate-labeled-illustration.py  # GPT Image 2 labeled illustrations
│   ├── generate-illustration.py          # No-text fallback illustrations
│   ├── render.mjs                        # HTML → PNG via Playwright
│   └── validate.mjs                      # Automated card validation
├── references/
│   ├── beginner-explanation.md   # Teaching protocol
│   ├── design-system.md          # Canvas, typography, color tokens
│   ├── illustration-prompts.md   # Illustration mode & prompt guide
│   ├── layouts.md                # Page layout catalog
│   ├── metaphor-library.md       # Abstract→concrete visual mappings
│   ├── prompt-strategy-audit.md  # Prompt design rationale
│   ├── qa-checklist.md           # Pre-delivery QA checks
│   └── visual-routing.md         # Information shape → visual type routing
├── agents/openai.yaml            # Agent config for OpenAI/Codex
└── requirements.txt              # Python dependencies
```

## License

See [LICENSE.txt](LICENSE.txt).

## Credits

Built by [玄清 (xuanqing-95)](https://github.com/xuanqing-95). Design language inspired by Guizang's editorial PPT style.
