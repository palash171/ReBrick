from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.builds.catalog import BUILD_BLUEPRINTS, BUILD_CATALOG
from app.builds.matcher import recommend_builds
from app.sample_gallery import (
    copy_sample_images_to_upload_dir,
    list_sample_images,
    resolve_sample_paths,
)
from app.scans.image_detector import build_detection_batch_from_images
from app.scans.mock_detector import build_default_detection_batch, build_detection_batch_for_files
from app.scans.service import (
    apply_review_to_session,
    create_scan_session,
    list_scan_sessions,
    load_scan_session,
)
from app.schemas import (
    AssemblyGroupResponse,
    BuildRecommendation,
    BuildDetailResponse,
    DetectionBatch,
    InventoryRequest,
    MissingRequirement,
    RecommendationResponse,
    SampleImageListResponse,
    SampleScanRequest,
    ScanReviewRequest,
    ScanSessionListResponse,
    ScanSessionResponse,
    UploadedScanFile,
)


app = FastAPI(
    title="ReBrick API",
    version="0.1.0",
    description="API for photo scans, piece checks, and build ideas.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "storage" / "uploads"
SAMPLE_IMAGE_ROOT = Path(__file__).resolve().parent.parent.parent / "LEGO IMAGES"

UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

if SAMPLE_IMAGE_ROOT.exists():
    app.mount("/sample-images", StaticFiles(directory=SAMPLE_IMAGE_ROOT), name="sample-images")


def sanitize_file_name(file_name: str) -> str:
    return file_name.replace("/", "_").replace("\\", "_").replace(" ", "_")

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/catalog/categories")
def get_categories() -> dict[str, list[str]]:
    categories = sorted({template.category for template in BUILD_CATALOG})
    return {"categories": categories}


@app.get("/api/sample-images", response_model=SampleImageListResponse)
def get_sample_images() -> SampleImageListResponse:
    return list_sample_images(SAMPLE_IMAGE_ROOT)


@app.get("/api/catalog/builds")
def get_build_catalog() -> dict[str, list[dict[str, object]]]:
    builds = [
        {
            "build_id": template.build_id,
            "name": template.name,
            "category": template.category,
            "description": template.description,
            "required_families": template.required_families,
            "tags": template.tags,
        }
        for template in BUILD_CATALOG
    ]
    return {"builds": builds}


@app.get("/api/catalog/builds/{build_id}", response_model=BuildDetailResponse)
def get_build_detail(build_id: str) -> BuildDetailResponse:
    template = next((item for item in BUILD_CATALOG if item.build_id == build_id), None)
    blueprint = BUILD_BLUEPRINTS.get(build_id)

    if template is None or blueprint is None:
        raise HTTPException(status_code=404, detail="Build not found.")

    return BuildDetailResponse(
        build_id=template.build_id,
        name=template.name,
        category=template.category,
        description=template.description,
        tags=template.tags,
        viewer_story=blueprint.viewer_story,
        assembly_groups=[
            AssemblyGroupResponse(
                group_id=group.group_id,
                name=group.name,
                summary=group.summary,
                required_families=group.required_families,
                connect_to=group.connect_to,
                direction=group.direction,
            )
            for group in blueprint.assembly_groups
        ],
    )


@app.get("/api/mock/detections", response_model=DetectionBatch)
def get_mock_detections() -> DetectionBatch:
    return build_default_detection_batch().detection_batch


@app.post("/api/scan-demo", response_model=ScanSessionResponse)
async def post_scan_demo(files: list[UploadFile] = File(...)) -> ScanSessionResponse:
    if not 1 <= len(files) <= 3:
        raise HTTPException(status_code=400, detail="Please upload between 1 and 3 images.")

    upload_id = uuid4().hex[:12]
    upload_dir = UPLOAD_ROOT / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_files: list[UploadedScanFile] = []

    for index, upload_file in enumerate(files, start=1):
        file_bytes = await upload_file.read()
        sanitized_name = sanitize_file_name(upload_file.filename or f"image_{index}.jpg")
        stored_name = f"{index:02d}_{sanitized_name}"
        stored_path = upload_dir / stored_name

        stored_path.write_bytes(file_bytes)

        saved_files.append(
            UploadedScanFile(
                original_name=upload_file.filename or stored_name,
                stored_name=stored_name,
                content_type=upload_file.content_type or "application/octet-stream",
                size_bytes=len(file_bytes),
            )
        )

        await upload_file.close()

    scan_result = build_detection_batch_from_images(saved_files, upload_dir) or build_detection_batch_for_files(saved_files)

    return create_scan_session(
        upload_id=upload_id,
        saved_files=saved_files,
        detection_batch=scan_result.detection_batch,
        scan_overview=scan_result.scan_overview,
    )


@app.post("/api/scan-samples", response_model=ScanSessionResponse)
def post_scan_samples(payload: SampleScanRequest) -> ScanSessionResponse:
    if not 1 <= len(payload.sample_ids) <= 3:
        raise HTTPException(status_code=400, detail="Choose between 1 and 3 sample images.")

    upload_id = uuid4().hex[:12]
    upload_dir = UPLOAD_ROOT / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    try:
        sample_paths = resolve_sample_paths(payload.sample_ids, SAMPLE_IMAGE_ROOT)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=f"Sample image not found: {error.args[0]}") from error
    except ValueError as error:
        raise HTTPException(status_code=400, detail=f"Unsupported sample image: {error.args[0]}") from error

    saved_files = copy_sample_images_to_upload_dir(sample_paths, upload_dir)
    scan_result = build_detection_batch_from_images(saved_files, upload_dir) or build_detection_batch_for_files(saved_files)

    return create_scan_session(
        upload_id=upload_id,
        saved_files=saved_files,
        detection_batch=scan_result.detection_batch,
        scan_overview=scan_result.scan_overview,
    )


@app.get("/api/scans", response_model=ScanSessionListResponse)
def get_scan_sessions() -> ScanSessionListResponse:
    return list_scan_sessions()


@app.get("/api/scans/{upload_id}", response_model=ScanSessionResponse)
def get_scan_session(upload_id: str) -> ScanSessionResponse:
    try:
        return load_scan_session(upload_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Scan session not found.") from error


@app.post("/api/scans/{upload_id}/review", response_model=ScanSessionResponse)
def post_scan_review(upload_id: str, payload: ScanReviewRequest) -> ScanSessionResponse:
    try:
        return apply_review_to_session(
            upload_id=upload_id,
            review_selections=payload.review_selections,
            inventory_adjustments=payload.inventory_adjustments,
            category=payload.category,
        )
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail="Scan session not found.") from error


@app.post("/api/recommendations", response_model=RecommendationResponse)
def post_recommendations(payload: InventoryRequest) -> RecommendationResponse:
    result = recommend_builds(payload.inventory, payload.category)
    return RecommendationResponse(
        normalized_inventory=result["normalized_inventory"],
        recommendations=[
            BuildRecommendation(
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
            for item in result["recommendations"]
        ],
    )
