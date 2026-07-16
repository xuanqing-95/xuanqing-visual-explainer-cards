# Complete example: LLMOps

This five-card example demonstrates the current workflow without placeholder artwork.

## Included

- `source.md`: source and unstable-fact boundary.
- `storyboard.yaml`: beginner brief, page rhythm, current content layouts, and slot-first image contract.
- `prompts/page-02.md`: one GPT Image 2 prompt derived from the declared landscape slot.
- `assets/page-02.png`: accepted 1536×1024 generated illustration.
- `index.html`: one fixed cover, one generated-image page, and three HTML-native evidence pages.
- `output/`: five final 1080×1440 PNG cards.

## Reproduce

```bash
python3 scripts/generate-illustration.py \
  --prompt-file examples/llmops/prompts/page-02.md \
  --output examples/llmops/assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality medium

node scripts/render.mjs examples/llmops
node scripts/validate.mjs examples/llmops
```

The validator must report five passing cards and five 1080×1440 PNG artifacts.
