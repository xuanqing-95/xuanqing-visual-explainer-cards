# Prompt Strategy Audit

## External Patterns Reviewed

These notes record high-level design and prompting patterns reviewed during development. They are not a license to copy third-party code, template text, prompts, assets, or repository structure.

### Editorial card systems

- Expression comes before decoration.
- Decide the image's evidence role and final slot before generation.
- Use images selectively; diagrams, HTML, and screenshots may be stronger evidence.
- Preserve quiet zones and predictable crops for editorial integration.
- Prompts should be short and role-specific.

### Image-prompting systems

- Separate meaning from style, rendering, palette, mood, and composition.
- Select a visual strategy before prompting.
- Use one dominant focal point, limited support elements, and explicit spatial arrangement.
- Keep style and layout as separate decisions.
- Describe reference traits explicitly instead of relying on the model to infer them.

## Previous Skill Failures

1. Prompts were mechanism-complete but visually overloaded.
2. Every illustration was treated as the same type of compact conceptual scene.
3. Full-card `3:4` was used even when the final slot was a small horizontal evidence well.
4. “Beginner-friendly” was stated as an adjective rather than implemented as a visible relation.
5. Style restrictions outnumbered positive composition instructions.
6. A recurring robot became a default decoration instead of meaningful evidence.
7. The prompt asked the bitmap to carry exact logic better handled by HTML.

## Current Strategy

```text
content question
-> choose image role
-> define one-glance proposition
-> divide image vs HTML responsibility
-> choose one visual strategy
-> define anchor, support, direction, slot, quiet zone
-> write compact prompt
-> generate at final slot ratio
-> integrate with HTML
-> review at phone thumbnail size
```

## Decision Rule

Use an illustration only if one memorable visual moment will improve intuition.

Use HTML when the information requires exact:

- sequence;
- labels;
- quantities;
- caveats;
- comparisons;
- definitions;
- causal links spanning multiple stages.

The strongest page may combine one simple illustration with one simple HTML explanation. It should not combine a complex illustration with a complex infographic.
