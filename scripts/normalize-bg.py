#!/usr/bin/env python3
"""Normalize illustration paper background to match card paper color.

Usage:
  python3 scripts/normalize-bg.py assets/page-02.png --target f1f3f5
  python3 scripts/normalize-bg.py assets/*.png --target f1f3f5
"""
import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("ERROR: Pillow and numpy required. pip install Pillow numpy", file=sys.stderr)
    sys.exit(1)


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def normalize_bg(img_path, target_rgb, threshold=40):
    """Replace near-white/near-paper pixels with target color."""
    img = Image.open(img_path).convert("RGBA")
    data = np.array(img)

    # Sample corners to detect source paper color
    h, w = data.shape[:2]
    corners = [
        data[10, 10, :3],
        data[w-10, 10, :3],
        data[10, h-10, :3],
        data[w-10, h-10, :3],
    ]
    src_avg = np.mean(corners, axis=0)

    # Find pixels close to source paper color
    diff = np.abs(data[:, :, :3].astype(float) - src_avg.astype(float))
    mask = np.all(diff < threshold, axis=2)

    # Replace those pixels with target color
    data[mask, 0] = target_rgb[0]
    data[mask, 1] = target_rgb[1]
    data[mask, 2] = target_rgb[2]

    result = Image.fromarray(data)
    result.save(img_path)
    return mask.sum()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("images", nargs="+")
    parser.add_argument("--target", default="f1f3f5", help="Target paper hex color")
    parser.add_argument("--threshold", type=int, default=40)
    args = parser.parse_args()

    target_rgb = hex_to_rgb(args.target)

    for path in args.images:
        count = normalize_bg(path, target_rgb, args.threshold)
        print(f"{path}: replaced {count} pixels → #{args.target}")


if __name__ == "__main__":
    main()
