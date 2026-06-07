from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from collections import Counter

from app.scans.image_detector import build_detection_batch_from_images
from app.schemas import UploadedScanFile


class ImageDetectorTests(unittest.TestCase):
    def build_scan_result(self, fixture_name: str, original_name: str):
        fixture_path = Path(__file__).resolve().parent / "fixtures" / fixture_name
        self.assertTrue(fixture_path.exists(), f"Expected fixture {fixture_name} to be available.")

        with TemporaryDirectory() as temporary_directory:
            upload_root = Path(temporary_directory)
            stored_name = original_name
            upload_path = upload_root / stored_name
            upload_path.write_bytes(fixture_path.read_bytes())

            saved_files = [
                UploadedScanFile(
                    original_name=original_name,
                    stored_name=stored_name,
                    content_type="image/png" if fixture_path.suffix == ".png" else "image/jpeg",
                    size_bytes=upload_path.stat().st_size,
                )
            ]

            return build_detection_batch_from_images(saved_files, upload_root)

    def test_test1_image_generates_piece_groups(self) -> None:
        source_image = Path(__file__).resolve().parents[2] / "sample-images" / "Test 39.png"
        self.assertTrue(source_image.exists(), "Expected Test 39.png to be available for detector tests.")

        with TemporaryDirectory() as temporary_directory:
            upload_root = Path(temporary_directory)
            stored_name = "01_Test_39.png"
            upload_path = upload_root / stored_name
            upload_path.write_bytes(source_image.read_bytes())

            saved_files = [
                UploadedScanFile(
                    original_name="Test 39.png",
                    stored_name=stored_name,
                    content_type="image/png",
                    size_bytes=upload_path.stat().st_size,
                )
            ]

            result = build_detection_batch_from_images(saved_files, upload_root)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.detection_batch.image_count, 1)
        self.assertGreater(result.scan_overview.total_estimated_pieces, 100)
        self.assertGreaterEqual(result.scan_overview.detected_piece_groups, 6)

        detected_piece_ids = {detection.piece_id for detection in result.detection_batch.detections}
        self.assertIn("piece_2x4", detected_piece_ids)
        self.assertIn("piece_2x3", detected_piece_ids)
        self.assertIn("piece_1x2", detected_piece_ids)

    def test_single_brick_image_counts_one_piece(self) -> None:
        result = self.build_scan_result(
            fixture_name="test_single_brick.jpeg",
            original_name="01_test_single_brick.jpeg",
        )

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.scan_overview.total_estimated_pieces, 1)
        self.assertEqual(len(result.detection_batch.detections), 1)
        self.assertEqual(result.detection_batch.detections[0].quantity, 1)
        self.assertEqual(result.detection_batch.detections[0].piece_id, "piece_2x4")

    def test_sparse_collection_uses_per_piece_counting(self) -> None:
        result = self.build_scan_result(
            fixture_name="test_sparse_collection.png",
            original_name="01_test_sparse_collection.png",
        )

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.scan_overview.profile_name, "Sparse white-background detector")
        self.assertGreaterEqual(result.scan_overview.total_estimated_pieces, 30)
        self.assertLessEqual(result.scan_overview.total_estimated_pieces, 60)
        self.assertTrue(all(detection.quantity == 1 for detection in result.detection_batch.detections))

    def test_modified_piece_photo_stays_conservative(self) -> None:
        source_image = (
            Path(__file__).resolve().parents[2]
            / "sample-images"
            / "Test 01.png"
        )
        self.assertTrue(source_image.exists(), "Expected modified-piece sample image to exist.")

        with TemporaryDirectory() as temporary_directory:
            upload_root = Path(temporary_directory)
            stored_name = "01_modified_piece_sample.png"
            upload_path = upload_root / stored_name
            upload_path.write_bytes(source_image.read_bytes())

            saved_files = [
                UploadedScanFile(
                    original_name="modified-piece-sample.png",
                    stored_name=stored_name,
                    content_type="image/png",
                    size_bytes=upload_path.stat().st_size,
                )
            ]

            result = build_detection_batch_from_images(saved_files, upload_root)

        self.assertIsNotNone(result)
        assert result is not None

        all_counts = Counter(detection.piece_id for detection in result.detection_batch.detections)
        confirmed_counts = Counter(
            detection.piece_id
            for detection in result.detection_batch.detections
            if detection.confidence >= 0.55
        )

        self.assertEqual(result.scan_overview.total_estimated_pieces, 39)
        self.assertGreaterEqual(all_counts["piece_connector"], 5)
        self.assertGreaterEqual(all_counts["piece_round"], 8)
        self.assertGreaterEqual(all_counts["unknown"], 5)
        self.assertEqual(all_counts["piece_2x3"], 1)
        self.assertLessEqual(confirmed_counts["piece_2x2"], 4)
        self.assertGreaterEqual(confirmed_counts["piece_1x2"], 6)
        self.assertNotIn("piece_2x6", confirmed_counts)


if __name__ == "__main__":
    unittest.main()
