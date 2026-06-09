#!/usr/bin/env python3
import argparse
from collections import deque
import os
import subprocess
from pathlib import Path
from PIL import Image


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


def main():
    parser = argparse.ArgumentParser(description="Generate a labeled GPT Image 2 illustration through ZenMux/baoyu-imagine.")
    parser.add_argument("--prompt-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--ar", default="3:4")
    parser.add_argument("--quality", default="2k")
    parser.add_argument("--model", default="openai/gpt-image-2")
    parser.add_argument("--skip-background-normalize", action="store_true")
    parser.add_argument("--paper-color", default="#f7f4ec")
    parser.add_argument("--bun", default=str(Path.home() / ".bun/bin/bun"))
    parser.add_argument("--baoyu-imagine", default=str(Path.home() / ".openclaw/skills/baoyu-imagine/scripts/main.ts"))
    args = parser.parse_args()

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env.setdefault("OPENAI_BASE_URL", "https://zenmux.ai/api/v1")
    if "OPENAI_API_KEY" not in env and "ZENMUX_API_KEY" in env:
        env["OPENAI_API_KEY"] = env["ZENMUX_API_KEY"]

    command = [
        args.bun,
        args.baoyu_imagine,
        "--provider",
        "openai",
        "--model",
        args.model,
        "--promptfiles",
        args.prompt_file,
        "--image",
        str(output),
        "--ar",
        args.ar,
        "--quality",
        args.quality,
    ]
    result = subprocess.call(command, env=env)
    if result == 0 and not args.skip_background_normalize:
        paper = args.paper_color.lstrip("#")
        target = tuple(int(paper[index:index + 2], 16) for index in (0, 2, 4))
        normalize_background(output, target=target)
        print(f"Background normalized to {args.paper_color}: {output}")
    raise SystemExit(result)


if __name__ == "__main__":
    main()
