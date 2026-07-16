# Complete example: LLMOps

This five-card example demonstrates the current workflow without placeholder artwork.

## Included

- `source.md`: source and unstable-fact boundary.
- `storyboard.yaml`: beginner brief, page rhythm, current content layouts, and slot-first image contract.
- `prompts/page-02.md` through `page-05.md`: one GPT Image 2 prompt for every non-cover card.
- `assets/page-02.png` through `page-05.png`: accepted generated illustrations and their `.generation.json` provenance sidecars.
- `index.html`: one fixed cover and four content cards that combine generated illustrations with precise HTML copy.
- `output/`: five final 1080×1440 PNG cards.

## Reproduce

```bash
python3 scripts/generate-illustration.py \
  --prompt-file examples/llmops/prompts/page-02.md \
  --output examples/llmops/assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality medium

python3 scripts/generate-illustration.py \
  --prompt-file examples/llmops/prompts/page-03.md \
  --output examples/llmops/assets/page-03.png \
  --orientation landscape \
  --size 1792x640 \
  --quality medium

python3 scripts/generate-illustration.py \
  --prompt-file examples/llmops/prompts/page-04.md \
  --output examples/llmops/assets/page-04.png \
  --orientation landscape \
  --size 1792x640 \
  --quality medium

python3 scripts/generate-illustration.py \
  --prompt-file examples/llmops/prompts/page-05.md \
  --output examples/llmops/assets/page-05.png \
  --orientation landscape \
  --size 1792x640 \
  --quality medium

node scripts/render.mjs examples/llmops
node scripts/validate.mjs examples/llmops
```

The validator must report five passing cards and five 1080×1440 PNG artifacts.
