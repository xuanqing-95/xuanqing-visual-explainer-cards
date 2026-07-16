# Visual Explainer Cards

Create illustrated Xiaohongshu/Rednote knowledge-card series with an editorial HTML layout and explanatory image evidence.

The final card is always rendered from HTML at **1080×1440 (3:4)**. Every non-cover card contains at least one model-generated illustration. Those illustrations live inside the card and use the canvas that matches their HTML slot, such as landscape, square, or portrait.

## Install

Requirements: Node.js 20+, Python 3.9+, network access for fonts and image generation.

### Codex

```bash
git clone https://github.com/xuanqing-95/xuanqing-visual-explainer-cards.git \
  "$HOME/.agents/skills/xuanqing-visual-explainer-cards"
```

### Claude Code

```bash
git clone https://github.com/xuanqing-95/xuanqing-visual-explainer-cards.git \
  "$HOME/.claude/skills/xuanqing-visual-explainer-cards"
```

### OpenClaw

```bash
openclaw skills install \
  git:xuanqing-95/xuanqing-visual-explainer-cards@main \
  --global
```

Then install the runtime dependencies inside the installed skill directory:

```bash
npm ci
npx playwright install chromium
python3 -m pip install -r requirements.txt
```

Configure an OpenAI-compatible image endpoint:

```bash
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.openai.com/v1
# Optional model override:
export OPENAI_IMAGE_MODEL=gpt-image-2
```

If `ZENMUX_API_KEY` is set instead, the local wrapper uses the ZenMux-compatible endpoint automatically. Image generation can incur provider charges.

## Use

```text
Use $xuanqing-visual-explainer-cards to turn "Token 是什么" into an illustrated Xiaohongshu knowledge-card series.
```

The workflow:

1. Turn the source into a beginner-friendly explanation.
2. Build a content-driven storyboard.
3. Define at least one final illustration slot for every non-cover page before prompting.
4. Generate slot-matched illustrations for every non-cover page.
5. Compose the cards in HTML.
6. Render 1080×1440 PNGs.
7. Validate the HTML, media, fonts, and final PNG artifacts.

## Output contract

- Final cards: `1080x1440`, 3:4.
- Cover: fixed S00 editorial cover with HTML typography.
- Content pages: composed from content shape, not fixed numbered templates; each must contain a model-generated illustration.
- HTML/CSS diagrams, exact code, numbers, labels, and screenshots may supplement but never replace the generated illustration.
- Illustration slot: declared before generation.
- Model output: explicit `model_output_size`; it does not have to be 3:4.
- Generated image fit: `object-fit: contain`; photographs may use `cover`.
- Generation proof: each generated PNG has a generator-written `.generation.json` sidecar; validation checks the model, provider, prompt hash, dimensions, and final image hash.
- Source hashtags remain publishing metadata and never enter cards or image prompts by default.

## Commands

Generate one illustration for a landscape slot:

```bash
python3 scripts/generate-illustration.py \
  --prompt-file prompts/page-02.md \
  --output assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality medium
```

Render and validate a task directory:

```bash
node scripts/render.mjs <task-dir>
node scripts/validate.mjs <task-dir>
```

Run the repository verification:

```bash
npm run verify
```

## Complete example

[`examples/llmops/`](examples/llmops/) contains a complete source, current storyboard, per-content-page image prompts, HTML, generated visual assets with provenance, and five rendered 3:4 cards. It contains no placeholder artwork.

## License

This project is licensed under **GNU AGPL-3.0-only**. See [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).
