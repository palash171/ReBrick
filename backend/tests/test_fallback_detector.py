import unittest

from app.scans.fallback_detector import build_detection_batch_for_files
from app.schemas import UploadedScanFile


class FallbackDetectorTests(unittest.TestCase):
    def test_uploaded_files_generate_repeatable_scan_overview(self) -> None:
        saved_files = [
            UploadedScanFile(
                original_name="lego-top.jpg",
                stored_name="01_lego-top.jpg",
                content_type="image/jpeg",
                size_bytes=2048,
            ),
            UploadedScanFile(
                original_name="lego-left.jpg",
                stored_name="02_lego-left.jpg",
                content_type="image/jpeg",
                size_bytes=1024,
            ),
        ]

        result = build_detection_batch_for_files(saved_files)

        self.assertEqual(result.detection_batch.image_count, 2)
        self.assertGreaterEqual(result.scan_overview.total_estimated_pieces, 1)
        self.assertGreaterEqual(result.scan_overview.detected_piece_groups, 1)
        self.assertTrue(result.scan_overview.profile_name)
        self.assertTrue(any(detection.review_options for detection in result.detection_batch.detections))

    def test_test1_file_name_uses_large_collection_profile(self) -> None:
        saved_files = [
            UploadedScanFile(
                original_name="Test1.png",
                stored_name="01_Test1.png",
                content_type="image/png",
                size_bytes=4096,
            )
        ]

        result = build_detection_batch_for_files(saved_files)

        self.assertEqual(result.scan_overview.profile_name, "Large mixed collection sample")
        self.assertGreaterEqual(len(result.detection_batch.detections), 9)


if __name__ == "__main__":
    unittest.main()
