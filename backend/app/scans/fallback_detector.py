from dataclasses import dataclass
from typing import Dict, List

from app.schemas import DetectionBatch, PieceDetection, ReviewOption, ScanOverview, UploadedScanFile


LOW_CONFIDENCE_THRESHOLD = 0.55


@dataclass(frozen=True)
class DetectionTemplate:
    piece_id: str
    label: str
    color: str
    quantity: int
    confidence: float
    force_review: bool = False


@dataclass(frozen=True)
class DetectionProfile:
    name: str
    detections: List[DetectionTemplate]


@dataclass(frozen=True)
class FallbackScanResult:
    detection_batch: DetectionBatch
    scan_overview: ScanOverview


REVIEW_OPTION_LIBRARY: Dict[str, List[ReviewOption]] = {
    "piece_2x4": [
        ReviewOption(piece_id="piece_2x4", label="2x4"),
        ReviewOption(piece_id="piece_2x3", label="2x3"),
        ReviewOption(piece_id="piece_2x6", label="2x6"),
        ReviewOption(piece_id="unknown", label="Unknown"),
    ],
    "piece_round": [
        ReviewOption(piece_id="piece_round", label="Round"),
        ReviewOption(piece_id="piece_1x1", label="1x1"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Unknown"),
    ],
    "piece_2x2": [
        ReviewOption(piece_id="piece_2x2", label="2x2"),
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Unknown"),
    ],
    "piece_1x2": [
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_1x1", label="1x1"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Unknown"),
    ],
    "piece_1x4": [
        ReviewOption(piece_id="piece_1x4", label="1x4"),
        ReviewOption(piece_id="piece_1x6", label="1x6"),
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="unknown", label="Unknown"),
    ],
    "piece_connector": [
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_round", label="Round"),
        ReviewOption(piece_id="unknown", label="Unknown"),
    ],
}


DETECTION_PROFILES: List[DetectionProfile] = [
    DetectionProfile(
        name="Vehicle-heavy starter mix",
        detections=[
            DetectionTemplate("piece_2x4", "2x4", "mixed", 11, 0.92),
            DetectionTemplate("piece_round", "Round", "mixed", 4, 0.44, force_review=True),
            DetectionTemplate("piece_1x2", "1x2", "mixed", 18, 0.91),
            DetectionTemplate("piece_1x4", "1x4", "mixed", 6, 0.76),
            DetectionTemplate("piece_connector", "Connector", "mixed", 2, 0.57),
        ],
    ),
    DetectionProfile(
        name="Animal-friendly support mix",
        detections=[
            DetectionTemplate("piece_2x2", "2x2", "mixed", 10, 0.88),
            DetectionTemplate("piece_2x4", "2x4", "mixed", 8, 0.78),
            DetectionTemplate("piece_1x2", "1x2", "mixed", 6, 0.49, force_review=True),
            DetectionTemplate("piece_1x1", "1x1", "mixed", 5, 0.72),
            DetectionTemplate("piece_round", "Round", "mixed", 2, 0.58),
        ],
    ),
    DetectionProfile(
        name="Desk accessory support mix",
        detections=[
            DetectionTemplate("piece_2x4", "2x4", "mixed", 12, 0.95),
            DetectionTemplate("piece_1x4", "1x4", "mixed", 8, 0.84),
            DetectionTemplate("piece_connector", "Connector", "mixed", 4, 0.52, force_review=True),
            DetectionTemplate("piece_2x2", "2x2", "mixed", 10, 0.89),
            DetectionTemplate("piece_1x2", "1x2", "mixed", 6, 0.58),
        ],
    ),
    DetectionProfile(
        name="Large mixed collection sample",
        detections=[
            DetectionTemplate("piece_2x4", "2x4", "mixed", 12, 0.92),
            DetectionTemplate("piece_round", "Round", "mixed", 5, 0.46, force_review=True),
            DetectionTemplate("piece_1x2", "1x2", "mixed", 21, 0.93),
            DetectionTemplate("piece_1x4", "1x4", "mixed", 8, 0.72),
            DetectionTemplate("piece_connector", "Connector", "mixed", 4, 0.54, force_review=True),
            DetectionTemplate("piece_2x3", "2x3", "mixed", 8, 0.81),
            DetectionTemplate("piece_2x2", "2x2", "mixed", 10, 0.84),
            DetectionTemplate("piece_1x1", "1x1", "mixed", 7, 0.58),
            DetectionTemplate("piece_1x6", "1x6", "mixed", 5, 0.61),
        ],
    ),
]


def clamp_confidence(value: float) -> float:
    return max(0.35, min(0.99, value))


def build_signature(saved_files: List[UploadedScanFile]) -> int:
    signature_text = "|".join(
        f"{saved_file.original_name}:{saved_file.size_bytes}:{saved_file.content_type}"
        for saved_file in saved_files
    )
    return sum(ord(character) for character in signature_text)


def build_review_options(piece_id: str) -> List[ReviewOption]:
    return REVIEW_OPTION_LIBRARY.get(piece_id, [])


def select_detection_profile(
    saved_files: List[UploadedScanFile],
    signature: int,
) -> DetectionProfile:
    joined_file_names = " ".join(saved_file.original_name.lower() for saved_file in saved_files)

    if "test1" in joined_file_names:
        return next(
            profile
            for profile in DETECTION_PROFILES
            if profile.name == "Large mixed collection sample"
        )

    return DETECTION_PROFILES[signature % len(DETECTION_PROFILES)]


def build_scan_overview(profile_name: str, detection_batch: DetectionBatch) -> ScanOverview:
    total_estimated_pieces = sum(detection.quantity for detection in detection_batch.detections)
    detected_piece_groups = len(detection_batch.detections)
    low_confidence_count = sum(
        1
        for detection in detection_batch.detections
        if detection.confidence < LOW_CONFIDENCE_THRESHOLD
    )
    average_confidence = round(
        sum(detection.confidence for detection in detection_batch.detections)
        / max(detected_piece_groups, 1),
        2,
    )

    color_totals: Dict[str, int] = {}
    for detection in detection_batch.detections:
        color_totals[detection.color] = color_totals.get(detection.color, 0) + detection.quantity

    dominant_colors = [
        color
        for color, _quantity in sorted(
            color_totals.items(),
            key=lambda item: (-item[1], item[0]),
        )[:3]
    ]

    return ScanOverview(
        profile_name=profile_name,
        total_estimated_pieces=total_estimated_pieces,
        detected_piece_groups=detected_piece_groups,
        low_confidence_count=low_confidence_count,
        average_confidence=average_confidence,
        dominant_colors=dominant_colors,
    )


def build_detection_batch_for_files(saved_files: List[UploadedScanFile]) -> FallbackScanResult:
    signature = build_signature(saved_files)
    profile = select_detection_profile(saved_files, signature)
    image_count = max(len(saved_files), 1)
    detections: List[PieceDetection] = []

    for detection_index, template in enumerate(profile.detections):
        quantity_delta = (signature + detection_index * 7) % 3
        image_bonus = image_count - 1 if detection_index % 2 == 0 else 0
        confidence_delta = (((signature // (detection_index + 2)) % 5) - 2) * 0.02
        confidence = clamp_confidence(template.confidence + confidence_delta)

        if template.force_review:
            confidence = min(confidence, 0.49)

        detections.append(
            PieceDetection(
                piece_id=template.piece_id,
                label=template.label,
                color=template.color,
                quantity=template.quantity + quantity_delta + image_bonus,
                confidence=confidence,
                review_options=(
                    build_review_options(template.piece_id)
                    if template.force_review or confidence < LOW_CONFIDENCE_THRESHOLD
                    else []
                ),
            )
        )

    detection_batch = DetectionBatch(image_count=image_count, detections=detections)
    return FallbackScanResult(
        detection_batch=detection_batch,
        scan_overview=build_scan_overview(profile.name, detection_batch),
    )


def build_default_detection_batch(image_count: int = 3) -> FallbackScanResult:
    default_files = [
        UploadedScanFile(
            original_name=f"demo-{index + 1}.jpg",
            stored_name=f"demo-{index + 1}.jpg",
            content_type="image/jpeg",
            size_bytes=1200 + index * 300,
        )
        for index in range(image_count)
    ]
    return build_detection_batch_for_files(default_files)
