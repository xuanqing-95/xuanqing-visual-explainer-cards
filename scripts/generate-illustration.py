#!/usr/bin/env python3
import argparse
from collections import deque
from datetime import datetime, timezone
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is required. Install with: python3 -m pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)


STANDARD_SIZES = {
    "landscape": (1536, 1024),
    "square": (1024, 1024),
    "portrait": (1024, 1536),
}


def parse_size(value):
    try:
        width, height = (int(part) for part in value.lower().split("x", 1))
    except (TypeError, ValueError):
        raise argparse.ArgumentTypeError("size must use WIDTHxHEIGHT, for example 1536x1024")
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("size edges must be positive")
    return width, height


def orientation_for_size(size):
    width, height = size
    if width == height:
        return "square"
    return "landscape" if width > height else "portrait"


def edge_region(image, tolerance, feather):
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
        yield x, y, distance(pixels[x, y][:3])
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)


def normalize_background(image_path, target=(250, 250, 248), tolerance=42, feather=26):
    image = Image.open(image_path).convert("RGBA")
    pixels = image.load()
    for x, y, delta in edge_region(image, tolerance, feather):
        red, green, blue, alpha = pixels[x, y]
        mix = 1.0 if delta <= tolerance else 1.0 - (delta - tolerance) / feather
        pixels[x, y] = (
            round(red * (1 - mix) + target[0] * mix),
            round(green * (1 - mix) + target[1] * mix),
            round(blue * (1 - mix) + target[2] * mix),
            alpha,
        )
    image.save(image_path)


def remove_background(image_path, tolerance=34, feather=28):
    image = Image.open(image_path).convert("RGBA")
    pixels = image.load()
    for x, y, delta in edge_region(image, tolerance, feather):
        red, green, blue, alpha = pixels[x, y]
        if delta <= tolerance:
            new_alpha = 0
        else:
            new_alpha = round(alpha * (delta - tolerance) / feather)
        pixels[x, y] = (red, green, blue, new_alpha)
    image.save(image_path)


def auto_frame(image_path, target=(250, 250, 248), threshold=24, padding_ratio=0.08, min_area_ratio=0.03):
    image = Image.open(image_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    min_x, min_y = width, height
    max_x, max_y = -1, -1

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            is_content = alpha >= 16 and max(
                abs(red - target[0]), abs(green - target[1]), abs(blue - target[2])
            ) > threshold
            if is_content:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x < min_x or max_y < min_y:
        print("Auto-frame skipped: no content bounds detected.")
        return

    box_width = max_x - min_x + 1
    box_height = max_y - min_y + 1
    if (box_width * box_height) / (width * height) < min_area_ratio:
        print("Auto-frame skipped: detected content area is too small to trust.")
        return

    crop = image.crop((min_x, min_y, max_x + 1, max_y + 1))
    padding_x = max(24, round(width * padding_ratio))
    padding_y = max(24, round(height * padding_ratio))
    inner_width = max(1, width - 2 * padding_x)
    inner_height = max(1, height - 2 * padding_y)
    canvas_ratio = inner_width / inner_height
    crop_ratio = crop.width / crop.height
    if crop_ratio > canvas_ratio:
        new_width = inner_width
        new_height = max(1, round(inner_width / crop_ratio))
    else:
        new_height = inner_height
        new_width = max(1, round(inner_height * crop_ratio))

    resized = crop.resize((new_width, new_height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (*target, 255))
    canvas.alpha_composite(resized, ((width - new_width) // 2, (height - new_height) // 2))
    canvas.save(image_path)
    print(
        "Auto-framed illustration into protected margins: "
        f"content_bbox={box_width / width:.0%}x{box_height / height:.0%}, "
        f"output={width}x{height}"
    )


def detect_content_bbox(image_path, target=(250, 250, 248), threshold=24):
    image = Image.open(image_path).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    min_x, min_y = width, height
    max_x, max_y = -1, -1
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha >= 16 and max(
                abs(red - target[0]), abs(green - target[1]), abs(blue - target[2])
            ) > threshold:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x or max_y < min_y:
        return None
    return {
        "left": min_x,
        "top": min_y,
        "right": max_x + 1,
        "bottom": max_y + 1,
        "width_ratio": round((max_x - min_x + 1) / width, 6),
        "height_ratio": round((max_y - min_y + 1) / height, 6),
    }


def parse_color(value):
    color = value.lstrip("#")
    if len(color) != 6:
        raise ValueError("paper color must use #RRGGBB")
    return tuple(int(color[index:index + 2], 16) for index in (0, 2, 4))


def sha256_file(file_path):
    digest = hashlib.sha256()
    with open(file_path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_tool_provenance(output, expected_size, args):
    prompt_path = Path(args.prompt_file).resolve()
    prompt_text = prompt_path.read_text(encoding="utf-8")
    metadata_path = Path(f"{output}.generation.json")
    metadata = {
        "schema_version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "provider": args.provider,
        "model": args.model or "host-managed-imagegen",
        "quality": args.quality,
        "size": f"{expected_size[0]}x{expected_size[1]}",
        "orientation": orientation_for_size(expected_size),
        "output_file": output.name,
        "prompt_file": os.path.relpath(prompt_path, output.parent.resolve()),
        "prompt_sha256": hashlib.sha256(prompt_text.encode("utf-8")).hexdigest(),
        "raw_sha256": sha256_file(output),
        "request_id": None,
        "generation_mode": "host_tool",
    }
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Recorded host-tool provenance: {metadata_path}")


def finalize_provenance(output, expected_size, args, content_bbox):
    metadata_path = Path(f"{output}.generation.json")
    if not metadata_path.is_file():
        print(
            f"ERROR: generator did not create provenance sidecar: {metadata_path}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"ERROR: invalid provenance sidecar: {error}", file=sys.stderr)
        raise SystemExit(1)

    metadata.update(
        {
            "output_file": output.name,
            "prompt_file": os.path.relpath(
                Path(args.prompt_file).resolve(), output.parent.resolve()
            ),
            "final_sha256": sha256_file(output),
            "final_width": expected_size[0],
            "final_height": expected_size[1],
            "content_bbox": content_bbox,
            "postprocessing": {
                "background_normalized": not args.remove_background
                and not args.skip_background_normalize,
                "background_removed": args.remove_background,
                "auto_frame_requested": args.auto_frame
                and not args.remove_background
                and not args.skip_background_normalize,
                "paper_color": args.paper_color,
            },
        }
    )
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Verified generation provenance: {metadata_path}")

    usage_path = Path(f"{output}.usage.json")
    if usage_path.is_file():
        try:
            usage = json.loads(usage_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            print(f"ERROR: invalid usage sidecar: {error}", file=sys.stderr)
            raise SystemExit(1)
        usage["final_sha256"] = metadata["final_sha256"]
        usage["prompt_sha256"] = metadata["prompt_sha256"]
        usage_path.write_text(
            json.dumps(usage, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Verified provider usage: {usage_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Generate and normalize one slot-matched illustration through an OpenAI-compatible Image API."
    )
    parser.add_argument("--prompt-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--orientation", choices=sorted(STANDARD_SIZES))
    parser.add_argument("--size", type=parse_size)
    parser.add_argument("--quality", choices=("low", "medium", "high"), default="medium")
    parser.add_argument("--model")
    parser.add_argument(
        "--provider",
        default="codex-imagegen",
        help="Provider label for --import-tool-image provenance.",
    )
    parser.add_argument("--generator", default=str(Path(__file__).with_name("generate.mjs")))
    parser.add_argument(
        "--import-tool-image",
        action="store_true",
        help="Finalize an existing PNG returned by a trusted host image tool such as Codex imagegen. Writes honest provenance but no synthetic provider-usage record.",
    )
    parser.add_argument(
        "--finalize-existing",
        action="store_true",
        help="Normalize and finalize an already-generated PNG plus its real generation/usage sidecars without another image API call.",
    )
    parser.add_argument("--remove-background", action="store_true")
    parser.add_argument("--background-tolerance", type=int, default=34)
    parser.add_argument("--skip-background-normalize", action="store_true")
    parser.add_argument("--paper-color", default="#fafaf8")
    parser.add_argument("--auto-frame", dest="auto_frame", action="store_true", default=True)
    parser.add_argument("--no-auto-frame", dest="auto_frame", action="store_false")
    parser.add_argument("--auto-frame-threshold", type=int, default=24)
    parser.add_argument("--auto-frame-padding", type=float, default=0.08)
    args = parser.parse_args()
    if args.import_tool_image and args.finalize_existing:
        parser.error("--import-tool-image and --finalize-existing are mutually exclusive")

    if not args.size and not args.orientation:
        parser.error("--size or --orientation is required; define image_slot before generation")
    expected_size = args.size or STANDARD_SIZES[args.orientation]
    if args.orientation and orientation_for_size(expected_size) != args.orientation:
        parser.error(
            f"--size {expected_size[0]}x{expected_size[1]} conflicts with --orientation {args.orientation}"
        )

    prompt_path = Path(args.prompt_file)
    if not prompt_path.is_file() or not prompt_path.read_text(encoding="utf-8").strip():
        parser.error(f"prompt file is missing or empty: {prompt_path}")

    output = Path(args.output)
    if output.suffix.lower() != ".png":
        parser.error("--output must use a .png extension")
    output.parent.mkdir(parents=True, exist_ok=True)

    if args.import_tool_image:
        if not output.is_file():
            parser.error(f"--import-tool-image requires an existing PNG: {output}")
        usage_path = Path(f"{output}.usage.json")
        if usage_path.exists():
            parser.error(
                f"--import-tool-image refuses an existing provider usage sidecar: {usage_path}"
            )
    elif args.finalize_existing:
        if not output.is_file():
            parser.error(f"--finalize-existing requires an existing PNG: {output}")
        for sidecar in (Path(f"{output}.generation.json"), Path(f"{output}.usage.json")):
            if not sidecar.is_file():
                parser.error(f"--finalize-existing requires the real sidecar: {sidecar}")
        print(f"Finalizing existing paid image without another API call: {output}")
    else:
        generator_path = Path(args.generator)
        if not generator_path.is_file():
            parser.error(f"generator not found: {generator_path}")

        command = [
            "node",
            str(generator_path),
            "--prompt-file",
            str(prompt_path),
            "--output",
            str(output),
            "--size",
            f"{expected_size[0]}x{expected_size[1]}",
            "--quality",
            args.quality,
        ]
        if args.orientation:
            command.extend(["--orientation", args.orientation])
        if args.model:
            command.extend(["--model", args.model])

        result = subprocess.run(command, check=False)
        if result.returncode:
            raise SystemExit(result.returncode)
        if not output.is_file():
            print(f"ERROR: generator returned success but did not create {output}", file=sys.stderr)
            raise SystemExit(1)

    with Image.open(output) as image:
        actual_size = image.size
    if actual_size != expected_size:
        print(
            f"ERROR: expected {expected_size[0]}x{expected_size[1]}, got {actual_size[0]}x{actual_size[1]}",
            file=sys.stderr,
        )
        raise SystemExit(1)
    if args.import_tool_image:
        write_tool_provenance(output, expected_size, args)
        print(
            "Importing host-tool image without fabricating provider usage. "
            "Use API generation when strict usage accounting is required."
        )

    target = parse_color(args.paper_color)
    if args.remove_background:
        remove_background(output, args.background_tolerance)
        print(f"Applied edge-connected transparency: {output}")
    elif not args.skip_background_normalize:
        normalize_background(output, target=target)
        print(f"Normalized edge-connected paper background to {args.paper_color}: {output}")
        if args.auto_frame:
            auto_frame(
                output,
                target=target,
                threshold=args.auto_frame_threshold,
                padding_ratio=args.auto_frame_padding,
            )

    with Image.open(output) as image:
        if image.size != expected_size:
            print("ERROR: post-processing changed the output dimensions", file=sys.stderr)
            raise SystemExit(1)
    content_bbox = detect_content_bbox(
        output,
        target=parse_color(args.paper_color),
        threshold=args.auto_frame_threshold,
    )
    if not content_bbox:
        print("ERROR: generated image has no measurable visual subject", file=sys.stderr)
        raise SystemExit(1)
    finalize_provenance(output, expected_size, args, content_bbox)
    print(f"Verified illustration: {output} ({expected_size[0]}x{expected_size[1]})")


if __name__ == "__main__":
    main()
