#!/usr/bin/env python3
"""Compare two rendered card sets without treating PNG encoder bytes as design."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


THUMBNAIL_SIZE = (270, 360)
MAX_PAGE_MEAN_DELTA = 2.6
MAX_SET_MEAN_DELTA = 1.75


def card_files(directory: Path) -> list[Path]:
    return sorted(path for path in directory.glob("*.png") if path.is_file())


def mean_delta(left: Path, right: Path) -> float:
    with Image.open(left) as left_image, Image.open(right) as right_image:
        if left_image.size != right_image.size:
            raise ValueError(
                f"{left.name}: dimensions differ "
                f"{left_image.width}x{left_image.height} vs "
                f"{right_image.width}x{right_image.height}"
            )
        left_gray = left_image.convert("L").resize(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        right_gray = right_image.convert("L").resize(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        return float(ImageStat.Stat(ImageChops.difference(left_gray, right_gray)).mean[0])


def compare(baseline_dir: Path, candidate_dir: Path) -> dict:
    baseline = card_files(baseline_dir)
    candidate = card_files(candidate_dir)
    baseline_names = [path.name for path in baseline]
    candidate_names = [path.name for path in candidate]
    errors: list[str] = []
    pages: list[dict] = []

    if baseline_names != candidate_names:
        errors.append(
            f"output set differs: {len(baseline_names)} baseline vs "
            f"{len(candidate_names)} candidate"
        )
        return {"ok": False, "errors": errors, "pages": pages}

    for baseline_path in baseline:
        candidate_path = candidate_dir / baseline_path.name
        try:
            delta = mean_delta(baseline_path, candidate_path)
        except ValueError as error:
            errors.append(str(error))
            continue
        pages.append({"file": baseline_path.name, "mean_grayscale_delta": round(delta, 4)})
        if delta > MAX_PAGE_MEAN_DELTA:
            errors.append(
                f"{baseline_path.name}: perceptual delta {delta:.3f} "
                f"exceeds {MAX_PAGE_MEAN_DELTA:.3f}"
            )

    set_mean = sum(page["mean_grayscale_delta"] for page in pages) / len(pages) if pages else 0.0
    if set_mean > MAX_SET_MEAN_DELTA:
        errors.append(
            f"set perceptual delta {set_mean:.3f} exceeds {MAX_SET_MEAN_DELTA:.3f}"
        )

    return {
        "ok": not errors,
        "errors": errors,
        "pages": pages,
        "set_mean_grayscale_delta": round(set_mean, 4),
        "max_page_mean_delta": MAX_PAGE_MEAN_DELTA,
        "max_set_mean_delta": MAX_SET_MEAN_DELTA,
        "note": "A passing mechanical replay does not replace human visual approval.",
    }


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: compare_visual_pixels.py <baseline-output-dir> <candidate-output-dir>")
        return 2
    result = compare(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
