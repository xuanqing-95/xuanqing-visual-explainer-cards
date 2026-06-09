# Background Systems

A flat paper color is not enough for social cards. Use layered backgrounds to create atmosphere while keeping text readable.

## Swiss International Mode (default)

Swiss backgrounds are geometric and restrained. Use one of these patterns:

### Dot Matrix

```css
.dot-mat {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .08;
  background-image: radial-gradient(var(--ink) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
}
```

### Cross Hatch

```css
.cross-mat {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .06;
  background-image:
    linear-gradient(var(--ink), var(--ink)),
    linear-gradient(90deg, var(--ink), var(--ink));
  background-size: 1px 14px, 14px 1px;
  background-position: center, center;
  background-repeat: repeat;
}
```

### Ring Pattern

```css
.ring-mat {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .08;
  background-image: radial-gradient(circle at 50% 50%, transparent 4px, var(--ink) 4.5px, var(--ink) 5px, transparent 5.5px);
  background-size: 32px 32px;
}
```

Usage: add `<div class="dot-mat"></div>` inside the poster, before `.content`. Use on covers and sparse pages; omit on dense ledger/checklist pages where the pattern would compete with text.

## Editorial Magazine Mode

Editorial backgrounds use paper grain + ink wash atmosphere. See the Editorial seed template (`template-editorial-card.html`) for the full CSS.

### Paper Grain

```css
.grain {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  opacity: .35; mix-blend-mode: multiply;
  background-image: radial-gradient(rgba(0,0,0,.045) 1px, transparent 1px);
  background-size: 3px 3px;
}
```

### Paper Wash

```css
.paper-wash {
  position: absolute; inset: 0; z-index: 1; pointer-events: none;
  background:
    linear-gradient(180deg, rgba(var(--ink-rgb),.02), rgba(var(--ink-rgb),.05) 60%, rgba(var(--ink-rgb),.08));
}
```

### When To Show Stronger Atmosphere

Use stronger visible atmosphere for:
- Cover
- Chapter/divider
- Pull quote
- Sparse thesis page
- Closing page

Use subtle atmosphere for:
- Screenshot pages
- Dense ledgers
- Checklists

## Layer Order

```html
<section class="poster xhs">
  <!-- Background layers (z-index 0-1) -->
  <div class="dot-mat"></div>   <!-- or grain, ring-mat, etc. -->
  <!-- Content (z-index 2) -->
  <div class="content">...</div>
</section>
```

## Do Not

- Do not use bright gradients
- Do not use page-wide grid or graph-paper patterns (Swiss uses dot-matrix instead)
- Do not use decorative blobs or circles with no relationship to the layout
- Do not place strong background marks behind body text
- Do not animate the final image sequence unless the task is video
