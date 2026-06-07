import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from app.sample_gallery import copy_sample_images_to_upload_dir, list_sample_images, resolve_sample_paths


class SampleGalleryTests(unittest.TestCase):
    def test_list_sample_images_returns_only_supported_files(self) -> None:
        with TemporaryDirectory() as temp_directory:
            root = Path(temp_directory)
            (root / "sample-a.png").write_bytes(b"png")
            (root / "sample-b.jpg").write_bytes(b"jpg")
            (root / "notes.txt").write_text("ignore", encoding="utf-8")

            response = list_sample_images(root)

            self.assertEqual(len(response.samples), 2)
            self.assertEqual(response.samples[0].file_name, "Test 1")
            self.assertEqual(response.samples[0].sample_id, "sample-a.png")
            self.assertTrue(response.samples[0].url.startswith("/sample-images/"))

    def test_copy_sample_images_creates_uploaded_scan_files(self) -> None:
        with TemporaryDirectory() as source_directory, TemporaryDirectory() as upload_directory:
            source_root = Path(source_directory)
            upload_root = Path(upload_directory)
            (source_root / "sample image.png").write_bytes(b"abc123")

            sample_paths = resolve_sample_paths(["sample image.png"], source_root)
            saved_files = copy_sample_images_to_upload_dir(sample_paths, upload_root)

            self.assertEqual(len(saved_files), 1)
            self.assertEqual(saved_files[0].original_name, "sample image.png")
            self.assertTrue((upload_root / saved_files[0].stored_name).exists())


if __name__ == "__main__":
    unittest.main()
