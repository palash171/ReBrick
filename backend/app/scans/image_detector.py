from __future__ import annotations

from dataclasses import dataclass
import math
from pathlib import Path
from statistics import mean, median
from typing import Dict, List

import cv2
import numpy as np

from app.schemas import DetectionBatch, PieceDetection, ReviewOption, ScanOverview, UploadedScanFile


LOW_CONFIDENCE_THRESHOLD = 0.55
SPARSE_BACKGROUND_DISTANCE_THRESHOLD = 25.0


@dataclass(frozen=True)
class ImagePieceCandidate:
    piece_id: str
    label: str
    color: str
    confidence: float


@dataclass(frozen=True)
class ImageScanResult:
    detection_batch: DetectionBatch
    scan_overview: ScanOverview


@dataclass(frozen=True)
class SparsePieceRegion:
    contour: np.ndarray
    area: float
    short_dimension: float
    long_dimension: float
    fill_ratio: float
    circularity: float
    solidity: float
    vertex_count: int
    hole_count: int
    stud_estimate: int
    image_area_ratio: float
    bbox: tuple[int, int, int, int]
    color: str


REVIEW_OPTIONS: Dict[str, List[ReviewOption]] = {
    "piece_2x4": [
        ReviewOption(piece_id="piece_2x4", label="2x4"),
        ReviewOption(piece_id="piece_2x3", label="2x3"),
        ReviewOption(piece_id="piece_2x6", label="2x6"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_2x3": [
        ReviewOption(piece_id="piece_2x3", label="2x3"),
        ReviewOption(piece_id="piece_2x4", label="2x4"),
        ReviewOption(piece_id="piece_2x2", label="2x2"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_2x2": [
        ReviewOption(piece_id="piece_2x2", label="2x2"),
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_1x2": [
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_1x1", label="1x1"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_1x1": [
        ReviewOption(piece_id="piece_1x1", label="1x1"),
        ReviewOption(piece_id="piece_round", label="Round"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_1x4": [
        ReviewOption(piece_id="piece_1x4", label="1x4"),
        ReviewOption(piece_id="piece_1x6", label="1x6"),
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_1x6": [
        ReviewOption(piece_id="piece_1x6", label="1x6"),
        ReviewOption(piece_id="piece_1x4", label="1x4"),
        ReviewOption(piece_id="piece_2x6", label="2x6"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_2x6": [
        ReviewOption(piece_id="piece_2x6", label="2x6"),
        ReviewOption(piece_id="piece_2x4", label="2x4"),
        ReviewOption(piece_id="piece_1x6", label="1x6"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_round": [
        ReviewOption(piece_id="piece_round", label="Round"),
        ReviewOption(piece_id="piece_1x1", label="1x1"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "piece_connector": [
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_round", label="Round"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
    "unknown": [
        ReviewOption(piece_id="piece_1x2", label="1x2"),
        ReviewOption(piece_id="piece_2x2", label="2x2"),
        ReviewOption(piece_id="piece_round", label="Round"),
        ReviewOption(piece_id="piece_connector", label="Connector"),
        ReviewOption(piece_id="unknown", label="Skip for now"),
    ],
}


PIECE_LABELS: Dict[str, str] = {
    "piece_2x4": "2x4",
    "piece_2x3": "2x3",
    "piece_2x2": "2x2",
    "piece_1x2": "1x2",
    "piece_1x1": "1x1",
    "piece_1x4": "1x4",
    "piece_1x6": "1x6",
    "piece_2x6": "2x6",
    "piece_round": "Round",
    "piece_connector": "Connector",
    "unknown": "Unclear piece",
}


SPARSE_LABELS: Dict[str, str] = {
    "piece_2x4": "2x4",
    "piece_2x3": "2x3",
    "piece_2x2": "2x2",
    "piece_1x2": "1x2",
    "piece_1x1": "1x1",
    "piece_1x4": "1x4",
    "piece_1x6": "1x6",
    "piece_2x6": "2x6",
    "piece_round": "Round",
    "piece_connector": "Connector",
    "unknown": "Unclear piece",
}


def clamp_confidence(value: float) -> float:
    return max(0.35, min(0.98, value))


def build_review_options(
    piece_id: str,
    confidence: float,
    label_lookup: Dict[str, str] | None = None,
) -> List[ReviewOption]:
    if confidence >= LOW_CONFIDENCE_THRESHOLD:
        return []

    labels = label_lookup or PIECE_LABELS
    default_options = REVIEW_OPTIONS.get(
        piece_id,
        [
            ReviewOption(piece_id=piece_id, label=labels.get(piece_id, piece_id)),
            ReviewOption(piece_id="unknown", label="Set aside for now"),
        ],
    )

    return [
        ReviewOption(
            piece_id=option.piece_id,
            label=option.label if option.piece_id == "unknown" else labels.get(option.piece_id, option.label),
        )
        for option in default_options
    ]


def build_scan_overview(profile_name: str, detection_batch: DetectionBatch) -> ScanOverview:
    raw_total_estimated_pieces = sum(detection.quantity for detection in detection_batch.detections)
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

    total_estimated_pieces = raw_total_estimated_pieces

    if profile_name == "Sparse white-background detector" and detected_piece_groups >= 25:
        total_estimated_pieces = max(
            detected_piece_groups - max(1, round(detected_piece_groups * 0.05)),
            1,
        )

    return ScanOverview(
        profile_name=profile_name,
        total_estimated_pieces=total_estimated_pieces,
        detected_piece_groups=detected_piece_groups,
        low_confidence_count=low_confidence_count,
        average_confidence=average_confidence,
        dominant_colors=dominant_colors,
    )


def crop_primary_scan_region(image: np.ndarray) -> np.ndarray:
    height, width = image.shape[:2]

    top = int(height * 0.04)
    bottom = int(height * 0.82)
    left = int(width * 0.05)
    right = int(width * 0.95)

    return image[top:bottom, left:right]


def contour_pixels(image: np.ndarray, contour: np.ndarray) -> np.ndarray:
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)

    mask = cv2.erode(mask, np.ones((3, 3), np.uint8), iterations=1)
    coordinates = np.where(mask > 0)

    if len(coordinates[0]) == 0:
        cv2.drawContours(mask, [contour], -1, 255, -1)
        coordinates = np.where(mask > 0)

    return image[coordinates]


def classify_color(pixels: np.ndarray) -> str:
    hsv_pixels = cv2.cvtColor(pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)
    brightness_threshold = np.percentile(hsv_pixels[:, 2], 75)
    bright_pixels = pixels[hsv_pixels[:, 2] >= brightness_threshold]
    sampled_pixels = bright_pixels if len(bright_pixels) > 8 else pixels

    mean_hsv = cv2.cvtColor(
        np.uint8([[sampled_pixels.mean(axis=0)]]),
        cv2.COLOR_BGR2HSV,
    )[0, 0]
    hue, saturation, value = (int(channel) for channel in mean_hsv)

    if value < 55:
        return "black"

    if saturation < 24:
        if value > 228:
            return "white"
        if value > 170:
            return "gray"
        if value > 120:
            return "tan"
        if value > 80:
            return "brown"
        return "black"

    if hue <= 8 or hue >= 170:
        return "red"
    if hue <= 20:
        return "orange" if value > 135 else "brown"
    if hue <= 35:
        return "yellow" if value > 150 else "tan"
    if hue <= 85:
        return "green"
    if hue <= 135:
        return "blue"

    return "gray"


def detect_piece_id(
    contour: np.ndarray,
    area: float,
    short_dimension: float,
    long_dimension: float,
    color: str,
) -> tuple[str, float]:
    perimeter = cv2.arcLength(contour, True)
    circularity = 4 * math.pi * area / (perimeter * perimeter + 1e-6)
    fill_ratio = area / (short_dimension * long_dimension + 1e-6)

    if (
        color in {"black", "gray"}
        and long_dimension > 42
        and abs(long_dimension - short_dimension) < 14
        and fill_ratio < 0.72
    ):
        piece_id = "piece_round"
        return piece_id, clamp_confidence(0.88 - abs(0.60 - fill_ratio) * 0.35)

    if color == "gray" and short_dimension < 20 and long_dimension > 45:
        return "piece_connector", 0.74

    if short_dimension < 29:
        if long_dimension < 29:
            return "piece_1x1", 0.82
        if long_dimension < 50:
            if fill_ratio < 0.62 and color in {"gray", "black"}:
                return "piece_connector", 0.48
            return "piece_1x2", 0.7
        if long_dimension < 82:
            return "piece_1x4", 0.76
        return "piece_1x6", 0.72

    if short_dimension < 49:
        if long_dimension < 50:
            return "piece_2x2", 0.72
        if area < 2250:
            confidence = 0.72 if color in {"red", "yellow", "blue"} else 0.62
            return "piece_2x3", confidence
        if area < 3300:
            confidence = 0.78 if color in {"red", "yellow", "blue"} else 0.68
            return "piece_2x4", confidence
        return "piece_2x6", 0.7

    return "piece_2x6", 0.44


def build_sparse_background_mask(image: np.ndarray) -> np.ndarray:
    border_pixels = np.concatenate(
        [
            image[0, :, :],
            image[-1, :, :],
            image[:, 0, :],
            image[:, -1, :],
        ],
        axis=0,
    )
    image_lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    border_lab = cv2.cvtColor(border_pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2LAB).reshape(-1, 3)
    background_lab = np.median(border_lab, axis=0)

    color_distance = np.linalg.norm(
        image_lab.astype(np.float32) - background_lab.astype(np.float32),
        axis=2,
    )
    foreground_mask = (color_distance > SPARSE_BACKGROUND_DISTANCE_THRESHOLD).astype(np.uint8) * 255

    kernel_size = max(3, int(round(min(image.shape[:2]) / 220)))
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    foreground_mask = cv2.morphologyEx(foreground_mask, cv2.MORPH_OPEN, kernel)
    foreground_mask = cv2.morphologyEx(foreground_mask, cv2.MORPH_CLOSE, kernel)

    return foreground_mask


def save_sparse_piece_crop(
    image: np.ndarray,
    bbox: tuple[int, int, int, int],
    image_path: Path,
    detection_index: int,
) -> str | None:
    x, y, width, height = bbox
    padding = 14
    x0 = max(0, x - padding)
    y0 = max(0, y - padding)
    x1 = min(image.shape[1], x + width + padding)
    y1 = min(image.shape[0], y + height + padding)

    crop = image[y0:y1, x0:x1]
    if crop.size == 0:
        return None

    crops_dir = image_path.parent / "crops"
    crops_dir.mkdir(parents=True, exist_ok=True)

    crop_name = f"{image_path.stem}_piece_{detection_index:02d}.png"
    crop_path = crops_dir / crop_name
    cv2.imwrite(str(crop_path), crop)

    upload_id = image_path.parent.name
    return f"/uploads/{upload_id}/crops/{crop_name}"


def estimate_visible_stud_count(
    image: np.ndarray,
    foreground_mask: np.ndarray,
    bbox: tuple[int, int, int, int],
) -> int:
    x, y, width, height = bbox
    padding = 6
    x0 = max(0, x - padding)
    y0 = max(0, y - padding)
    x1 = min(image.shape[1], x + width + padding)
    y1 = min(image.shape[0], y + height + padding)

    crop = image[y0:y1, x0:x1]
    mask_crop = foreground_mask[y0:y1, x0:x1]

    if crop.size == 0 or mask_crop.size == 0:
        return 0

    grayscale = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    grayscale = cv2.medianBlur(grayscale, 5)

    circles = cv2.HoughCircles(
        grayscale,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=max(8, min(width, height) // 4),
        param1=70,
        param2=16,
        minRadius=4,
        maxRadius=max(6, min(width, height) // 5),
    )

    if circles is None:
        return 0

    visible_studs = 0
    for center_x, center_y, _radius in circles[0]:
        mask_x = int(round(center_x))
        mask_y = int(round(center_y))

        if (
            0 <= mask_x < mask_crop.shape[1]
            and 0 <= mask_y < mask_crop.shape[0]
            and mask_crop[mask_y, mask_x] > 0
        ):
            visible_studs += 1

    return visible_studs


def region_center(bbox: tuple[int, int, int, int]) -> tuple[float, float]:
    x, y, width, height = bbox
    return x + width / 2, y + height / 2


def point_inside_bbox(
    point_x: float,
    point_y: float,
    bbox: tuple[int, int, int, int],
    padding: int = 0,
) -> bool:
    x, y, width, height = bbox
    return (
        x - padding <= point_x <= x + width + padding
        and y - padding <= point_y <= y + height + padding
    )


def suppress_nested_sparse_regions(regions: List[SparsePieceRegion]) -> List[SparsePieceRegion]:
    kept_regions: List[SparsePieceRegion] = []

    for region in sorted(regions, key=lambda candidate: candidate.area, reverse=True):
        center_x, center_y = region_center(region.bbox)
        should_skip = False

        for larger_region in kept_regions:
            larger_width = larger_region.bbox[2]
            larger_height = larger_region.bbox[3]
            width = region.bbox[2]
            height = region.bbox[3]

            if (
                larger_region.area >= region.area * 3.0
                and width <= larger_width * 0.62
                and height <= larger_height * 0.62
                and point_inside_bbox(center_x, center_y, larger_region.bbox, padding=10)
            ):
                should_skip = True
                break

        if not should_skip:
            kept_regions.append(region)

    return sorted(kept_regions, key=lambda region: (region.bbox[1], region.bbox[0]))


def detect_sparse_piece_regions(image: np.ndarray) -> List[SparsePieceRegion] | None:
    foreground_mask = build_sparse_background_mask(image)
    image_height, image_width = image.shape[:2]
    image_area = float(image_height * image_width)
    min_component_area = max(180, int(image_area * 0.0002))
    boundary_margin = max(2, int(min(image_height, image_width) * 0.003))

    component_count, component_labels, component_stats, _centroids = cv2.connectedComponentsWithStats(
        foreground_mask,
        8,
    )

    regions: List[SparsePieceRegion] = []

    for component_index in range(1, component_count):
        x = int(component_stats[component_index, cv2.CC_STAT_LEFT])
        y = int(component_stats[component_index, cv2.CC_STAT_TOP])
        width = int(component_stats[component_index, cv2.CC_STAT_WIDTH])
        height = int(component_stats[component_index, cv2.CC_STAT_HEIGHT])
        component_area = int(component_stats[component_index, cv2.CC_STAT_AREA])

        if component_area < min_component_area:
            continue

        if (
            x <= boundary_margin
            or y <= boundary_margin
            or x + width >= image_width - boundary_margin
            or y + height >= image_height - boundary_margin
        ):
            continue

        component_mask = (component_labels == component_index).astype(np.uint8) * 255
        contours, hierarchy = cv2.findContours(
            component_mask,
            cv2.RETR_CCOMP,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        if not contours:
            continue

        contour_index = max(range(len(contours)), key=lambda index: cv2.contourArea(contours[index]))
        contour = contours[contour_index]
        contour_area = cv2.contourArea(contour)
        if contour_area < min_component_area:
            continue

        hole_count = 0
        if hierarchy is not None:
            for child_index, hierarchy_entry in enumerate(hierarchy[0]):
                parent_index = hierarchy_entry[3]
                if parent_index == contour_index and cv2.contourArea(contours[child_index]) > 24:
                    hole_count += 1

        _center, (raw_width, raw_height), _angle = cv2.minAreaRect(contour)
        short_dimension = min(raw_width, raw_height)
        long_dimension = max(raw_width, raw_height)
        if short_dimension < 12:
            continue

        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.04 * perimeter, True)
        hull = cv2.convexHull(contour)
        hull_area = max(cv2.contourArea(hull), 1.0)
        fill_ratio = contour_area / (short_dimension * long_dimension + 1e-6)
        circularity = 4 * math.pi * contour_area / (perimeter * perimeter + 1e-6)
        solidity = contour_area / hull_area
        pixels = contour_pixels(image, contour)
        color = classify_color(pixels)
        stud_estimate = estimate_visible_stud_count(
            image=image,
            foreground_mask=foreground_mask,
            bbox=(x, y, width, height),
        )

        regions.append(
            SparsePieceRegion(
                contour=contour,
                area=contour_area,
                short_dimension=short_dimension,
                long_dimension=long_dimension,
                fill_ratio=fill_ratio,
                circularity=circularity,
                solidity=solidity,
                vertex_count=len(approx),
                hole_count=hole_count,
                stud_estimate=stud_estimate,
                image_area_ratio=contour_area / image_area,
                bbox=(x, y, width, height),
                color=color,
            )
        )

    if not regions:
        return None

    largest_region_ratio = max(region.image_area_ratio for region in regions)
    foreground_ratio = sum(region.area for region in regions) / image_area

    if largest_region_ratio > 0.42 or foreground_ratio > 0.55 or len(regions) > 90:
        return None

    return suppress_nested_sparse_regions(regions)


def classify_sparse_piece(
    region: SparsePieceRegion,
    median_region_area: float,
    region_count: int,
) -> tuple[str, str, float]:
    aspect_ratio = region.long_dimension / max(region.short_dimension, 1e-6)
    normalized_area = region.area / max(median_region_area, 1.0)
    stud_estimate = region.stud_estimate

    if (
        region_count == 1
        and region.image_area_ratio > 0.10
        and aspect_ratio > 1.35
        and region.fill_ratio > 0.78
    ):
        return "piece_2x4", SPARSE_LABELS["piece_2x4"], 0.74

    if normalized_area > 4.0 and aspect_ratio < 1.8 and region.fill_ratio < 0.80:
        return "unknown", SPARSE_LABELS["unknown"], 0.36

    if region.hole_count >= 1 and normalized_area > 2.2:
        if region.circularity > 0.64 and aspect_ratio < 1.6:
            return "unknown", SPARSE_LABELS["unknown"], 0.36
        return "piece_connector", SPARSE_LABELS["piece_connector"], 0.42

    if aspect_ratio < 1.18 and region.fill_ratio < 0.82 and region.circularity > 0.68:
        return "piece_round", SPARSE_LABELS["piece_round"], 0.49

    if aspect_ratio < 1.35 and region.circularity > 0.70 and region.vertex_count >= 6:
        return "piece_round", SPARSE_LABELS["piece_round"], 0.49

    if stud_estimate >= 6:
        if region.circularity > 0.70 and aspect_ratio < 1.20:
            return "piece_round", SPARSE_LABELS["piece_round"], 0.50
        if 1.20 <= aspect_ratio <= 1.85:
            return "piece_2x3", SPARSE_LABELS["piece_2x3"], 0.61
        if aspect_ratio > 1.85:
            return "piece_1x4", SPARSE_LABELS["piece_1x4"], 0.56
        return "unknown", SPARSE_LABELS["unknown"], 0.40

    if stud_estimate in {4, 5}:
        if aspect_ratio < 1.22 and region.fill_ratio > 0.84 and normalized_area >= 0.75:
            return "piece_2x2", SPARSE_LABELS["piece_2x2"], 0.58
        if region.circularity > 0.72 and aspect_ratio < 1.18 and region.fill_ratio < 0.82:
            return "piece_round", SPARSE_LABELS["piece_round"], 0.50
        if 1.30 <= aspect_ratio <= 1.80:
            if normalized_area > 1.90 and region.fill_ratio > 0.88:
                return "piece_2x3", SPARSE_LABELS["piece_2x3"], 0.54
            return "unknown", SPARSE_LABELS["unknown"], 0.40
        if aspect_ratio > 1.80 and region.fill_ratio > 0.88:
            return "piece_1x4", SPARSE_LABELS["piece_1x4"], 0.57
        return "unknown", SPARSE_LABELS["unknown"], 0.40

    if stud_estimate in {2, 3}:
        if normalized_area < 0.18 and (region.circularity > 0.46 or aspect_ratio < 1.9):
            return "piece_round", SPARSE_LABELS["piece_round"], 0.50
        if aspect_ratio > 1.55:
            confidence = 0.56 if region.fill_ratio > 0.84 else 0.54
            return "piece_1x2", SPARSE_LABELS["piece_1x2"], confidence
        if aspect_ratio < 1.18 and region.fill_ratio > 0.90 and normalized_area >= 1.80:
            return "piece_2x2", SPARSE_LABELS["piece_2x2"], 0.55
        if aspect_ratio < 1.20 and region.circularity > 0.72 and region.fill_ratio < 0.82:
            return "piece_round", SPARSE_LABELS["piece_round"], 0.50
        return "unknown", SPARSE_LABELS["unknown"], 0.40

    if region.circularity > 0.76 and aspect_ratio < 1.22:
        if region.fill_ratio < 0.70:
            return "piece_round", SPARSE_LABELS["piece_round"], 0.68
        if normalized_area < 0.55:
            return "piece_1x1", SPARSE_LABELS["piece_1x1"], 0.58
        return "piece_2x2", SPARSE_LABELS["piece_2x2"], 0.56

    if region.hole_count >= 1:
        if region.circularity > 0.62 and aspect_ratio < 1.35:
            if normalized_area > 2.8:
                return "unknown", SPARSE_LABELS["unknown"], 0.38
            return "piece_round", SPARSE_LABELS["piece_round"], 0.49
        if aspect_ratio > 2.15:
            return "piece_1x2", SPARSE_LABELS["piece_1x2"], 0.50
        if normalized_area < 0.80:
            return "piece_1x2", SPARSE_LABELS["piece_1x2"], 0.48
        return "piece_connector", SPARSE_LABELS["piece_connector"], 0.45

    if region.solidity < 0.65 or region.fill_ratio < 0.55:
        if aspect_ratio > 2.35:
            return "piece_connector", SPARSE_LABELS["piece_connector"], 0.46
        return "piece_connector", SPARSE_LABELS["piece_connector"], 0.44

    if normalized_area < 0.12:
        if aspect_ratio > 1.55 and region.fill_ratio < 0.62:
            return "piece_connector", SPARSE_LABELS["piece_connector"], 0.44
        if region.circularity > 0.44 or aspect_ratio < 1.9:
            return "piece_round", SPARSE_LABELS["piece_round"], 0.49
        return "piece_1x1", SPARSE_LABELS["piece_1x1"], 0.50

    if aspect_ratio > 1.85 and normalized_area < 1.35 and region.circularity < 0.66:
        if region.fill_ratio < 0.88:
            return "piece_connector", SPARSE_LABELS["piece_connector"], 0.47
        return "piece_1x2", SPARSE_LABELS["piece_1x2"], 0.56

    if region.vertex_count <= 4 and region.fill_ratio < 0.80:
        return "piece_2x2", SPARSE_LABELS["piece_2x2"], 0.53

    if aspect_ratio > 2.45:
        if normalized_area < 0.40:
            return "piece_connector", SPARSE_LABELS["piece_connector"], 0.45
        if normalized_area < 2.10:
            return "piece_1x4", SPARSE_LABELS["piece_1x4"], 0.63
        return "piece_1x6", SPARSE_LABELS["piece_1x6"], 0.57

    if aspect_ratio > 1.70:
        if normalized_area < 0.60:
            return "piece_1x2", SPARSE_LABELS["piece_1x2"], 0.62
        if normalized_area < 2.15:
            return "piece_1x4", SPARSE_LABELS["piece_1x4"], 0.60
        return "piece_1x6", SPARSE_LABELS["piece_1x6"], 0.55

    if aspect_ratio > 1.28:
        if normalized_area < 0.80:
            return "piece_1x2", SPARSE_LABELS["piece_1x2"], 0.56
        if normalized_area < 1.70:
            return "piece_2x3", SPARSE_LABELS["piece_2x3"], 0.57
        if normalized_area < 2.40:
            return "piece_2x4", SPARSE_LABELS["piece_2x4"], 0.55
        return "piece_2x3", SPARSE_LABELS["piece_2x3"], 0.50

    if normalized_area < 0.35:
        return "piece_1x1", SPARSE_LABELS["piece_1x1"], 0.52
    if region.fill_ratio < 0.76:
        return "unknown", SPARSE_LABELS["unknown"], 0.40
    if normalized_area < 1.45:
        return "piece_2x2", SPARSE_LABELS["piece_2x2"], 0.52
    return "unknown", SPARSE_LABELS["unknown"], 0.40


def build_sparse_piece_detections(image_path: Path) -> List[PieceDetection] | None:
    image = cv2.imread(str(image_path))
    if image is None:
        return None

    regions = detect_sparse_piece_regions(image)
    if not regions:
        return None

    median_region_area = median(region.area for region in regions)
    detections: List[PieceDetection] = []

    for detection_index, region in enumerate(regions, start=1):
        piece_id, label, confidence = classify_sparse_piece(
            region=region,
            median_region_area=median_region_area,
            region_count=len(regions),
        )
        confidence = clamp_confidence(confidence)
        crop_url = save_sparse_piece_crop(
            image=image,
            bbox=region.bbox,
            image_path=image_path,
            detection_index=detection_index,
        )
        detections.append(
            PieceDetection(
                piece_id=piece_id,
                label=label,
                color=region.color,
                quantity=1,
                confidence=confidence,
                crop_url=crop_url,
                review_options=build_review_options(piece_id, confidence, SPARSE_LABELS),
            )
        )

    return detections


def detect_dense_image_candidates(image_path: Path) -> List[ImagePieceCandidate]:
    image = cv2.imread(str(image_path))

    if image is None:
        return []

    cropped_image = crop_primary_scan_region(image)
    grayscale = cv2.cvtColor(cropped_image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(grayscale, (5, 5), 0)
    edges = cv2.Canny(blurred, 80, 180)

    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edge_mask = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)
    edge_mask = cv2.dilate(edge_mask, kernel, iterations=1)

    contours, _hierarchy = cv2.findContours(
        edge_mask,
        cv2.RETR_EXTERNAL,
        cv2.CHAIN_APPROX_SIMPLE,
    )

    cropped_height, cropped_width = cropped_image.shape[:2]
    candidates: List[ImagePieceCandidate] = []

    for contour in contours:
        x, y, width, height = cv2.boundingRect(contour)

        if x <= 1 or y <= 1 or x + width >= cropped_width - 1 or y + height >= cropped_height - 1:
            continue

        area = cv2.contourArea(contour)
        if area < 220 or area > 9500:
            continue

        _center, (raw_width, raw_height), _angle = cv2.minAreaRect(contour)
        short_dimension = min(raw_width, raw_height)
        long_dimension = max(raw_width, raw_height)

        if short_dimension < 10:
            continue

        pixels = contour_pixels(cropped_image, contour)
        color = classify_color(pixels)
        piece_id, confidence = detect_piece_id(
            contour=contour,
            area=area,
            short_dimension=short_dimension,
            long_dimension=long_dimension,
            color=color,
        )

        candidates.append(
            ImagePieceCandidate(
                piece_id=piece_id,
                label=PIECE_LABELS[piece_id],
                color=color,
                confidence=clamp_confidence(confidence),
            )
        )

    return candidates


def aggregate_candidates(candidates: List[ImagePieceCandidate]) -> List[PieceDetection]:
    grouped: Dict[str, List[ImagePieceCandidate]] = {}

    for candidate in candidates:
        grouped.setdefault(candidate.piece_id, []).append(candidate)

    detections: List[PieceDetection] = []
    for piece_id, piece_candidates in sorted(
        grouped.items(),
        key=lambda item: (-len(item[1]), item[0]),
    ):
        colors = [candidate.color for candidate in piece_candidates]
        dominant_color = max(set(colors), key=colors.count)
        if colors.count(dominant_color) < max(2, int(len(colors) * 0.7)):
            dominant_color = "mixed"
        confidence = clamp_confidence(mean(candidate.confidence for candidate in piece_candidates))
        detections.append(
            PieceDetection(
                piece_id=piece_id,
                label=PIECE_LABELS[piece_id],
                color=dominant_color,
                quantity=len(piece_candidates),
                confidence=confidence,
                review_options=build_review_options(piece_id, confidence),
            )
        )

    return detections


def detect_image_detections(image_path: Path) -> tuple[List[PieceDetection], str] | None:
    sparse_detections = build_sparse_piece_detections(image_path)
    if sparse_detections:
        return sparse_detections, "Sparse white-background detector"

    dense_candidates = detect_dense_image_candidates(image_path)
    if dense_candidates:
        return aggregate_candidates(dense_candidates), "Heuristic top-down detector"

    return None


def build_detection_batch_from_images(
    saved_files: List[UploadedScanFile],
    image_root: Path,
) -> ImageScanResult | None:
    detections_by_file: Dict[str, tuple[List[PieceDetection], str]] = {}

    for saved_file in saved_files:
        image_path = image_root / saved_file.stored_name
        if not image_path.exists():
            continue

        detections_for_file = detect_image_detections(image_path)
        if detections_for_file is not None:
            detections_by_file[saved_file.stored_name] = detections_for_file

    if not detections_by_file:
        return None

    primary_detections, profile_name = max(
        detections_by_file.values(),
        key=lambda result: sum(detection.quantity for detection in result[0]),
    )

    detection_batch = DetectionBatch(
        image_count=max(len(saved_files), 1),
        detections=primary_detections,
    )

    return ImageScanResult(
        detection_batch=detection_batch,
        scan_overview=build_scan_overview(profile_name, detection_batch),
    )
