import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Dict, List, Optional

from app.builds.matcher import find_build_ideas
from app.schemas import (
    BuildIdea,
    DetectionBatch,
    MissingRequirement,
    BuildIdeaResponse,
    ScanOverview,
    ScanSessionListResponse,
    ScanSessionResponse,
    ScanSessionSummary,
    UploadedScanFile,
)


SCAN_STORAGE_ROOT = Path(__file__).resolve().parent.parent.parent / "storage" / "scans"
LOW_CONFIDENCE_THRESHOLD = 0.55


def ensure_scan_storage() -> None:
    SCAN_STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def session_file_path(upload_id: str) -> Path:
    return SCAN_STORAGE_ROOT / f"{upload_id}.json"


def utc_now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def create_build_idea_response(
    corrected_inventory: Dict[str, int],
    category: Optional[str],
) -> BuildIdeaResponse:
    build_match_result = find_build_ideas(corrected_inventory, category)

    return BuildIdeaResponse(
        normalized_inventory=build_match_result["normalized_inventory"],
        build_ideas=[
            BuildIdea(
                build_id=item.build_id,
                name=item.name,
                category=item.category,
                description=item.description,
                compatibility_score=item.compatibility_score,
                matched_families=item.matched_families,
                missing_families=[
                    MissingRequirement(
                        family_id=missing.family_id,
                        short_by=missing.short_by,
                    )
                    for missing in item.missing_families
                ],
                tags=item.tags,
            )
            for item in build_match_result["build_ideas"]
        ],
    )


def apply_inventory_adjustments(
    base_inventory: Dict[str, int],
    inventory_adjustments: Dict[str, int],
) -> Dict[str, int]:
    adjusted_inventory = dict(base_inventory)

    for piece_id, adjustment in inventory_adjustments.items():
        next_quantity = adjusted_inventory.get(piece_id, 0) + adjustment

        if next_quantity > 0:
            adjusted_inventory[piece_id] = next_quantity
        elif piece_id in adjusted_inventory:
            del adjusted_inventory[piece_id]

    return adjusted_inventory


def build_corrected_inventory(
    detection_batch: DetectionBatch,
    review_selections: Dict[str, str],
) -> Dict[str, int]:
    corrected_inventory: Dict[str, int] = {}

    for detection_index, detection in enumerate(detection_batch.detections):
        selected_piece_id = review_selections.get(str(detection_index))

        if selected_piece_id is None:
            selected_piece_id = (
                "unknown"
                if detection.confidence < LOW_CONFIDENCE_THRESHOLD
                else detection.piece_id
            )

        if selected_piece_id == "unknown":
            continue

        corrected_inventory[selected_piece_id] = (
            corrected_inventory.get(selected_piece_id, 0) + detection.quantity
        )

    return corrected_inventory


def create_scan_session(
    upload_id: str,
    saved_files: List[UploadedScanFile],
    detection_batch: DetectionBatch,
    scan_overview: ScanOverview,
) -> ScanSessionResponse:
    ensure_scan_storage()
    now_iso = utc_now_iso()

    scan_session = ScanSessionResponse(
        upload_id=upload_id,
        created_at=now_iso,
        updated_at=now_iso,
        saved_files=saved_files,
        detection_batch=detection_batch,
        scan_overview=scan_overview,
        review_selections={},
        inventory_adjustments={},
        corrected_inventory={},
        selected_category=None,
        build_idea_response=None,
    )

    session_file_path(upload_id).write_text(
        scan_session.model_dump_json(indent=2),
        encoding="utf-8",
    )
    return scan_session


def load_scan_session(upload_id: str) -> ScanSessionResponse:
    ensure_scan_storage()
    session_path = session_file_path(upload_id)

    if not session_path.exists():
        raise FileNotFoundError(upload_id)

    session_json = session_path.read_text(encoding="utf-8")
    return ScanSessionResponse.model_validate_json(session_json)


def save_scan_session(scan_session: ScanSessionResponse) -> ScanSessionResponse:
    ensure_scan_storage()
    updated_session = scan_session.model_copy(update={"updated_at": utc_now_iso()})
    session_file_path(updated_session.upload_id).write_text(
        updated_session.model_dump_json(indent=2),
        encoding="utf-8",
    )
    return updated_session


def apply_review_to_session(
    upload_id: str,
    review_selections: Dict[str, str],
    inventory_adjustments: Dict[str, int],
    category: Optional[str],
) -> ScanSessionResponse:
    existing_session = load_scan_session(upload_id)
    base_inventory = build_corrected_inventory(
        existing_session.detection_batch,
        review_selections,
    )
    corrected_inventory = apply_inventory_adjustments(base_inventory, inventory_adjustments)

    build_idea_response = create_build_idea_response(
        corrected_inventory,
        category,
    )

    updated_session = existing_session.model_copy(
        update={
            "review_selections": review_selections,
            "inventory_adjustments": inventory_adjustments,
            "corrected_inventory": corrected_inventory,
            "selected_category": category,
            "build_idea_response": build_idea_response,
        }
    )
    return save_scan_session(updated_session)


def list_scan_sessions(limit: int = 10) -> ScanSessionListResponse:
    ensure_scan_storage()
    scan_summaries: List[ScanSessionSummary] = []

    for session_path in SCAN_STORAGE_ROOT.glob("*.json"):
        session_json = session_path.read_text(encoding="utf-8")
        session = ScanSessionResponse.model_validate_json(session_json)
        scan_summaries.append(
            ScanSessionSummary(
                upload_id=session.upload_id,
                created_at=session.created_at,
                updated_at=session.updated_at,
                image_count=session.detection_batch.image_count,
                file_count=len(session.saved_files),
                profile_name=session.scan_overview.profile_name,
                total_estimated_pieces=session.scan_overview.total_estimated_pieces,
                low_confidence_count=session.scan_overview.low_confidence_count,
            )
        )

    scan_summaries.sort(key=lambda session: session.updated_at, reverse=True)
    return ScanSessionListResponse(scans=scan_summaries[:limit])
