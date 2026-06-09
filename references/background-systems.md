# Background Systems

A flat paper color is usually fine for dense content. For covers and sparse pages, add one geometric matrix layer to create rhythm.

The template ships three Swiss matrix patterns, defined as utility classes.

## Dot Matrix

```css
.dot-mat {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .08;
  background-image: radial-gradient(var(--ink) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
}
```

## Cross Hatch

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

## Ring Pattern

```css
.ring-mat {
  position: absolute; inset: 0; pointer-events: none; z-index: 1;
  opacity: .08;
  background-image: radial-gradient(circle at 50% 50%, transparent 4px, var(--ink) 4.5px, var(--ink) 5px, transparent 5.5px);
  background-size: 32px 32px;
}
```

## Usage

Add the pattern div **before** `.content` inside the poster:

```html
<section class="poster xhs">
  <!-- Background layer (z-index 1) -->
  <div class="dot-mat"></div>
  <!-- Content (z-index 2) -->
  <div class="content">...</div>
</section>
```

Use on covers, statement pages, and sparse pages. Omit on dense ledger/checklist pages where the pattern would compete with text.

## Layer Order

```text
.poster (paper background)
  └─ .dot-mat / .cross-mat / .ring-mat   (z-index 1)
  └─ .content                            (z-index 2)
```

## Do Not

- Do not use bright gradients
- Do not use page-wide grid or graph-paper patterns (use dot-matrix instead)
- Do not use decorative blobs or circles with no relationship to the layout
- Do not place strong background marks behind body text
- Do not stack two matrix layers on the same poster
