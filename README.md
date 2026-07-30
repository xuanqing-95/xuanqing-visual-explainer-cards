# Visual Explainer Cards

Create illustrated Xiaohongshu/Rednote knowledge-card series with an editorial HTML layout and explanatory image evidence.

The final card is always rendered from HTML at **1080×1440 (3:4)**. Page count and image count are decided from the content, without reserved pure-text pages or a fixed image quota. Every generated canvas must match its final HTML slot.

Install a fixed GitHub Release tag for reproducible sharing. Do not put API keys
inside this repository or commit generated task folders.

## 快速开始（推荐）

如果你使用 Codex，不需要先看懂下面的命令。把这段话直接发给 Codex：

```text
请安装并使用这个固定版本的 Skill：
https://github.com/xuanqing-95/xuanqing-visual-explainer-cards/releases/tag/v1.1.5

请按 README 完成依赖安装并运行 npm run verify。
优先使用 Codex 自带的 ImageGen；如果当前环境没有生图工具，再提醒我配置自己的图片 API。
不要读取或复用其他项目里的 API Key。

安装完成后，请使用 $xuanqing-visual-explainer-cards，
把“Token 是什么”制作成一套小红书知识解释卡片。
```

安装完成后，新开一个 Codex 任务再使用这个 Skill。你也可以把最后一行的
“Token 是什么”替换成自己的主题或文章。

> 说明：GitHub 链接本身不是在线应用。使用者需要 Codex、Claude Code 或
> OpenClaw，并需要 Codex 自带的 ImageGen，或者自己的兼容图片 API。

## Quick start for Codex

Paste this into Codex:

```text
Install and use this exact Skill release:
https://github.com/xuanqing-95/xuanqing-visual-explainer-cards/releases/tag/v1.1.5

Follow the README to install dependencies and run npm run verify.
Prefer the built-in Codex ImageGen tool. If it is unavailable, ask me to
configure my own image API. Do not read or reuse API keys from other projects.

After installation, use $xuanqing-visual-explainer-cards to turn
"What is a token?" into an illustrated knowledge-card series.
```

Start a new Codex task after installation so the Skill can be discovered.

## Manual install

Requirements: Node.js 20+, Python 3.9+, and either a host image-generation
tool or access to the user's own image API.

### Codex

```bash
git clone --branch v1.1.5 --depth 1 https://github.com/xuanqing-95/xuanqing-visual-explainer-cards.git \
  "$HOME/.agents/skills/xuanqing-visual-explainer-cards"
cd "$HOME/.agents/skills/xuanqing-visual-explainer-cards"
```

### Claude Code

```bash
git clone --branch v1.1.5 --depth 1 https://github.com/xuanqing-95/xuanqing-visual-explainer-cards.git \
  "$HOME/.claude/skills/xuanqing-visual-explainer-cards"
cd "$HOME/.claude/skills/xuanqing-visual-explainer-cards"
```

### OpenClaw

```bash
openclaw skills install \
  git:xuanqing-95/xuanqing-visual-explainer-cards@v1.1.5 \
  --global
```

For Codex or Claude Code, install the runtime dependencies from the skill
directory:

```bash
npm ci
npx playwright install chromium
python3 -m pip install -r requirements.txt
npm run verify
```

`npm run verify` must pass before first use. If the destination directory
already exists, update or remove the old installation intentionally instead of
merging two versions.

## Image generation

Choose either route. Both keep the same storyboard, prompts, layout, rendering,
and validation workflow.

### Route A: Codex built-in ImageGen

When the host provides an image-generation tool such as Codex `imagegen`, no
user API key is required. Generate the exact storyboard size, save the returned
PNG at the declared asset path, then import it:

```bash
python3 scripts/generate-illustration.py \
  --import-tool-image \
  --prompt-file prompts/page-02.md \
  --output assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality high \
  --provider codex-imagegen \
  --model host-managed-imagegen
```

The importer writes prompt and image hashes. It does not fabricate token usage
that the host tool does not expose.

### Route B: Your own image API

Configure any OpenAI-compatible image endpoint:

```bash
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.openai.com/v1
# Optional model override:
export OPENAI_IMAGE_MODEL=gpt-image-2
```

Then generate normally:

```bash
python3 scripts/generate-illustration.py \
  --prompt-file prompts/page-02.md \
  --output assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality high
```

If `ZENMUX_API_KEY` is set instead, the wrapper can use that compatible
endpoint. API generation may incur provider charges. Never commit `.env` files
or keys.

## Use

```text
Use $xuanqing-visual-explainer-cards to turn "Token 是什么" into an illustrated Xiaohongshu knowledge-card series.
```

The workflow:

1. Turn the source into a beginner-friendly explanation.
2. Copy `assets/storyboard.template.yaml`, plan page rhythm, and vary content-page layouts and silhouettes.
3. Validate `storyboard.yaml` before image prompting or HTML design.
4. Decide from the content whether each page needs generated imagery; define slots for every planned illustration.
5. Run the deterministic preflight, choose one image route, then generate each slot-matched illustration with its own prompt, output size, and explicit quality level.
6. Compose the cards in HTML and bind each page to its storyboard layout and silhouette.
7. Render 1080×1440 PNGs.
8. Validate storyboard binding, HTML, media, fonts, and final PNG artifacts.

## Output contract

- Final cards: `1080x1440`, 3:4.
- Storyboard: required pre-design source of truth for page order, rhythm, layout, silhouette, image slots, and asset paths.
- Cover: fixed S00 editorial cover with HTML typography.
- Content pages: composed from content shape, not fixed numbered templates; page and image counts are content-driven and have no hard budget.
- Multi-image mapping: every planned illustration has an independent storyboard id, prompt, asset path, slot, and model output size; HTML binds it with `data-illustration-id`.
- Exact code, numbers, labels, and editable structures remain in HTML. HTML, screenshots, and placeholders may never masquerade as generated art.
- Illustration slot: declared before generation.
- Model output: explicit `model_output_size`; it does not have to be 3:4.
- Generated image fit: `object-fit: contain`; photographs may use `cover`.
- Generation proof: every generated PNG has script-written provenance containing prompt and image hashes. API usage is retained when the provider returns it; host-tool imports explicitly record that usage is not exposed instead of inventing numbers. Set `REQUIRE_IMAGE_USAGE_SIDECAR=true` only when strict API usage accounting is required.
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
node scripts/validate-storyboard.mjs <task-dir>
node scripts/validate-preflight.mjs <task-dir> --write-plan
node scripts/render.mjs <task-dir>
node scripts/validate.mjs <task-dir>
```

Run the repository verification:

```bash
npm run verify
```

## Complete example

[`examples/llmops/`](examples/llmops/) contains a complete source, validated page-rhythm storyboard, per-content-page image prompts, storyboard-bound HTML, generated visual assets with provenance, and five rendered 3:4 cards. It contains no placeholder artwork.

[`quality-baselines/`](quality-baselines/) contains five hash-pinned visual
categories. `npm run quality:baselines` verifies that accepted samples were not
replaced by placeholders or altered silently.

Run `npm run audit:public` before sharing or publishing a Release. It rejects
tracked credentials, personal paths, private email addresses, and internal
production integrations.

## License

This project is licensed under **GNU AGPL-3.0-only**. See [`LICENSE`](LICENSE) and [`NOTICE.md`](NOTICE.md).
