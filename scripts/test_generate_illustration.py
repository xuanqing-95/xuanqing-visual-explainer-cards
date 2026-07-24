import importlib.util
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw


MODULE_PATH = Path(__file__).with_name("generate-illustration.py")
SPEC = importlib.util.spec_from_file_location("generate_illustration", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class AutoFrameTest(unittest.TestCase):
    def test_edge_touching_subject_is_scaled_into_protected_margins(self):
        with tempfile.TemporaryDirectory() as directory:
            image_path = Path(directory) / "edge-touching.png"
            image = Image.new("RGBA", (1000, 1000), (250, 250, 248, 255))
            ImageDraw.Draw(image).rectangle((0, 100, 999, 899), fill=(10, 10, 10, 255))
            image.save(image_path)

            MODULE.auto_frame(image_path, padding_ratio=0.10)
            bbox = MODULE.detect_content_bbox(image_path)

            self.assertIsNotNone(bbox)
            self.assertGreaterEqual(bbox["width_ratio"], 0.78)
            self.assertLessEqual(bbox["width_ratio"], 0.82)
            self.assertGreaterEqual(bbox["height_ratio"], 0.62)
            self.assertLessEqual(bbox["height_ratio"], 0.66)


class HostToolImportTest(unittest.TestCase):
    def test_import_writes_honest_provenance_without_fake_usage(self):
        with tempfile.TemporaryDirectory() as directory:
            task_dir = Path(directory)
            prompt_path = task_dir / "prompt.md"
            image_path = task_dir / "image.png"
            prompt_text = "A clear educational diagram."
            prompt_path.write_text(prompt_text, encoding="utf-8")
            image = Image.new("RGBA", (1024, 1024), (250, 250, 248, 255))
            ImageDraw.Draw(image).rectangle((180, 180, 844, 844), fill=(10, 10, 10, 255))
            image.save(image_path)

            result = subprocess.run(
                [
                    sys.executable,
                    str(MODULE_PATH),
                    "--import-tool-image",
                    "--prompt-file",
                    str(prompt_path),
                    "--output",
                    str(image_path),
                    "--size",
                    "1024x1024",
                    "--quality",
                    "medium",
                    "--provider",
                    "codex-imagegen",
                    "--model",
                    "host-managed-imagegen",
                    "--skip-background-normalize",
                ],
                check=False,
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            provenance = json.loads(
                Path(f"{image_path}.generation.json").read_text(encoding="utf-8")
            )
            self.assertEqual(provenance["provider"], "codex-imagegen")
            self.assertEqual(provenance["generation_mode"], "host_tool")
            self.assertEqual(
                provenance["prompt_sha256"],
                hashlib.sha256(prompt_text.encode("utf-8")).hexdigest(),
            )
            self.assertEqual(provenance["final_sha256"], MODULE.sha256_file(image_path))
            self.assertFalse(Path(f"{image_path}.usage.json").exists())


if __name__ == "__main__":
    unittest.main()
