#!/usr/bin/env python3
import argparse
from collections import deque
import os
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install with: pip install Pillow", file=sys.stderr)
    sys.exit(1)


def remove_background(image_path, tolerance=34, feather=28):
    image = Image.open(image_path).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    samples = [
        pixels[0, 0][:3],
        pixels[width - 1, 0][:3],
        pixels[0, height - 1][:3],
        pixels[width - 1, height - 1][:3],
    ]
    background = tuple(sum(sample[channel] for sample in samples) // 4 for channel in range(3))

    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            distance = max(abs(red - background[0]), abs(green - background[1]), abs(blue - background[2]))
            if distance <= tolerance:
                alpha = 0
            elif distance < tolerance + feather:
                alpha = round(255 * (distance - tolerance) / feather)
            else:
                alpha = 255
            pixels[x, y] = (red, green, blue, alpha)
    image.save(image_path)


def normalize_background(image_path, target=(247, 244, 236), tolerance=42, feather=26):
    image = Image.open(image_path).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    corners = [
        pixels[0, 0][:3],
        pixels[width - 1, 0][:3],
        pixels[0, height - 1][:3],
        pixels[width - 1, height - 1][:3],
    ]
    background = tuple(sum(sample[channel] for sample in corners) // 4 for channel in range(3))
    visited = bytearray(width * height)
    queue = deque()

    def distance(rgb):
        return max(abs(rgb[channel] - background[channel]) for channel in range(3))

    def enqueue(x, y):
        index = y * width + x
        if visited[index]:
            return
        if distance(pixels[x, y][:3]) <= tolerance + feather:
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        red, green, blue, alpha = pixels[x, y]
        delta = distance((red, green, blue))
        if delta <= tolerance:
            mix = 1.0
        else:
            mix = 1.0 - (delta - tolerance) / feather
        pixels[x, y] = (
            round(red * (1 - mix) + target[0] * mix),
            round(green * (1 - mix) + target[1] * mix),
            round(blue * (1 - mix) + target[2] * mix),
            alpha,
        )
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)
    image.save(image_path)


def auto_frame(image_path, target=(250, 250, 248), threshold=24, padding_ratio=0.08, min_area_ratio=0.03):
    image = Image.open(image_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    min_x, min_y = width, height
    max_x, max_y = -1, -1

    def is_content(x, y):
        red, green, blue, alpha = pixels[x, y]
        if alpha < 16:
            return False
        return max(abs(red - target[0]), abs(green - target[1]), abs(blue - target[2])) > threshold

    for y in range(height):
        for x in range(width):
            if is_content(x, y):
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < min_x or max_y < min_y:
        print("Auto-frame skipped: no content bounds detected.")
        return

    box_w = max_x - min_x + 1
    box_h = max_y - min_y + 1
    if (box_w * box_h) / (width * height) < min_area_ratio:
        print("Auto-frame skipped: detected content area too small to trust.")
        return

    pad = max(24, round(max(box_w, box_h) * padding_ratio))
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(width - 1, max_x + pad)
    max_y = min(height - 1, max_y + pad)
    crop = image.crop((min_x, min_y, max_x + 1, max_y + 1))

    canvas_ratio = width / height
    crop_ratio = crop.width / crop.height
    if crop_ratio > canvas_ratio:
        new_w = width
        new_h = max(1, round(width / crop_ratio))
    else:
        new_h = height
        new_w = max(1, round(height * crop_ratio))

    resized = crop.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (*target, 255))
    offset = ((width - new_w) // 2, (height - new_h) // 2)
    canvas.alpha_composite(resized, offset)
    canvas.save(image_path)

    content_w = (max_x - min_x + 1) / width
    content_h = (max_y - min_y + 1) / height
    print(f"Auto-framed illustration: content_bbox={content_w:.0%}x{content_h:.0%}, output={width}x{height}")


def main():
    parser = argparse.ArgumentParser(description="Generate a no-text illustration through the local OpenAI-compatible generator.")
    parser.add_argument("--prompt-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--ar", default="3:4")
    parser.add_argument("--quality", default="medium")
    parser.add_argument("--model", default="gpt-image-2")
    parser.add_argument("--generator", default=str(Path(__file__).with_name("generate.mjs")))
    parser.add_argument("--remove-background", action="store_true")
    parser.add_argument("--background-tolerance", type=int, default=34)
    parser.add_argument("--skip-background-normalize", action="store_true")
    parser.add_argument("--paper-color", default="#fafaf8")
    parser.add_argument("--auto-frame", dest="auto_frame", action="store_true", default=True)
    parser.add_argument("--no-auto-frame", dest="auto_frame", action="store_false")
    parser.add_argument("--auto-frame-threshold", type=int, default=24)
    parser.add_argument("--auto-frame-padding", type=float, default=0.08)
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    generator_path = Path(args.generator)
    if not generator_path.exists():
        print(f"ERROR: generator not found at {generator_path}.", file=sys.stderr)
        sys.exit(1)

    env = os.environ.copy()
    if "OPENAI_API_KEY" not in env and "ZENMUX_API_KEY" in env:
        env["OPENAI_API_KEY"] = env["ZENMUX_API_KEY"]
        env.setdefault("OPENAI_BASE_URL", "https://zenmux.ai/api/v1")

    command = [
        "node",
        str(generator_path),
        "--promptfile",
        args.prompt_file,
        "--output",
        str(output),
        "--ar",
        args.ar,
        "--quality",
        args.quality,
        "--model",
        args.model,
    ]
    result = subprocess.call(command, env=env)
    if result == 0:
        if args.remove_background:
            remove_background(output, args.background_tolerance)
            print(f"Transparent background applied: {output}")
        elif not args.skip_background_normalize:
            paper = args.paper_color.lstrip("#")
            target = tuple(int(paper[index:index + 2], 16) for index in (0, 2, 4))
            normalize_background(output, target=target)
            print(f"Background normalized to {args.paper_color}: {output}")
            if args.auto_frame:
                auto_frame(
                    output,
                    target=target,
                    threshold=args.auto_frame_threshold,
                    padding_ratio=args.auto_frame_padding,
                )
    raise SystemExit(result)


if __name__ == "__main__":
    main()
