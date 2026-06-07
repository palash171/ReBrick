import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

try:
    from app.scans.fallback_detector import build_scan_overview
    from app.scans import service
    from app.schemas import DetectionBatch, UploadedScanFile
except ModuleNotFoundError as error:
    raise unittest.SkipTest(f"Backend dependencies not installed: {error}") from error


def build_test_detection_batch() -> DetectionBatch:
    return DetectionBatch.model_validate(
        {
            "image_count": 2,
            "detections": [
                {
                    "piece_id": "piece_2x4",
                    "label": "2x4",
                    "color": "mixed",
                    "quantity": 10,
                    "confidence": 0.97,
                    "review_options": [],
                },
                {
                    "piece_id": "piece_round",
                    "label": "Round",
                    "color": "mixed",
                    "quantity": 4,
                    "confidence": 0.41,
                    "review_options": [
                        {"piece_id": "piece_round", "label": "Round"},
                        {"piece_id": "piece_2x2", "label": "2x2"},
                        {"piece_id": "unknown", "label": "Unknown"},
                    ],
                },
            ],
        }
    )


class ScanServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_directory = TemporaryDirectory()
        self.original_storage_root = service.SCAN_STORAGE_ROOT
        service.SCAN_STORAGE_ROOT = Path(self.temp_directory.name)

    def tearDown(self) -> None:
        service.SCAN_STORAGE_ROOT = self.original_storage_root
        self.temp_directory.cleanup()

    def test_create_and_load_scan_session(self) -> None:
        saved_files = [
            UploadedScanFile(
                original_name="lego-top.jpg",
                stored_name="01_lego-top.jpg",
                content_type="image/jpeg",
                size_bytes=1024,
            )
        ]

        created_session = service.create_scan_session(
            upload_id="scan123",
            saved_files=saved_files,
            detection_batch=build_test_detection_batch(),
            scan_overview=build_scan_overview("Test profile", build_test_detection_batch()),
        )
        loaded_session = service.load_scan_session("scan123")

        self.assertEqual(created_session.upload_id, loaded_session.upload_id)
        self.assertEqual(created_session.saved_files[0].stored_name, "01_lego-top.jpg")
        self.assertEqual(loaded_session.detection_batch.image_count, 2)
        self.assertEqual(loaded_session.scan_overview.profile_name, "Test profile")

    def test_apply_review_updates_piece_list_and_build_ideas(self) -> None:
        service.create_scan_session(
            upload_id="scan456",
            saved_files=[
                UploadedScanFile(
                    original_name="lego-side.jpg",
                    stored_name="01_lego-side.jpg",
                    content_type="image/jpeg",
                    size_bytes=2048,
                )
            ],
            detection_batch=build_test_detection_batch(),
            scan_overview=build_scan_overview("Test profile", build_test_detection_batch()),
        )

        updated_session = service.apply_review_to_session(
            upload_id="scan456",
            review_selections={"1": "piece_2x2"},
            inventory_adjustments={},
            category="objects",
        )

        self.assertEqual(updated_session.corrected_inventory["piece_2x4"], 10)
        self.assertEqual(updated_session.corrected_inventory["piece_2x2"], 4)
        self.assertEqual(updated_session.selected_category, "objects")
        self.assertIsNotNone(updated_session.build_idea_response)
        self.assertTrue(updated_session.build_idea_response.build_ideas)

    def test_list_scan_sessions_includes_overview_summary(self) -> None:
        service.create_scan_session(
            upload_id="scan789",
            saved_files=[
                UploadedScanFile(
                    original_name="lego-right.jpg",
                    stored_name="01_lego-right.jpg",
                    content_type="image/jpeg",
                    size_bytes=1536,
                )
            ],
            detection_batch=build_test_detection_batch(),
            scan_overview=build_scan_overview("Summary profile", build_test_detection_batch()),
        )

        session_list = service.list_scan_sessions()

        self.assertEqual(session_list.scans[0].profile_name, "Summary profile")
        self.assertEqual(session_list.scans[0].total_estimated_pieces, 14)
        self.assertEqual(session_list.scans[0].low_confidence_count, 1)


if __name__ == "__main__":
    unittest.main()
