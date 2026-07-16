# Complete example: LLMOps

This five-card example demonstrates the current workflow without placeholder artwork.

## Included

- `source.md`: source and unstable-fact boundary.
- `storyboard.yaml`: validated beginner brief, per-page rhythm beats, varied layouts and silhouettes, and slot-first image contract.
- `prompts/`: seven slot-specific GPT Image 2 prompts: one landscape concept image, three square signal thumbnails, two square comparison states, and one square action image.
- `assets/`: seven accepted generated illustrations and their `.generation.json` provenance sidecars.
- `index.html`: one fixed cover and four content cards that combine generated illustrations with precise HTML copy.
- `output/`: five final 1080×1440 PNG cards.

## Reproduce

```bash
node scripts/validate-storyboard.mjs examples/llmops

python3 scripts/generate-illustration.py \
  --prompt-file examples/llmops/prompts/page-02.md \
  --output examples/llmops/assets/page-02.png \
  --orientation landscape \
  --size 1536x1024 \
  --quality medium

for name in symptom-quality symptom-cost symptom-safety before after action; do
  python3 scripts/generate-illustration.py \
    --prompt-file "examples/llmops/prompts/${name}.md" \
    --output "examples/llmops/assets/${name}.png" \
    --orientation square \
    --size 1024x1024 \
    --quality medium
done

node scripts/render.mjs examples/llmops
node scripts/validate.mjs examples/llmops
```

The storyboard preflight must pass before generation. Final validation must report seven independent illustration bindings and provenance records, five passing cards, and five 1080×1440 PNG artifacts.
