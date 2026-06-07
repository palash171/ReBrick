from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ReviewOption(BaseModel):
    piece_id: str
    label: str


class PieceDetection(BaseModel):
    piece_id: str
    label: str
    color: str
    quantity: int = Field(ge=1)
    confidence: float = Field(ge=0.0, le=1.0)
    review_options: List[ReviewOption] = Field(default_factory=list)
    crop_url: Optional[str] = None


class DetectionBatch(BaseModel):
    image_count: int = Field(ge=1)
    detections: List[PieceDetection]


class ScanOverview(BaseModel):
    profile_name: str
    total_estimated_pieces: int = Field(ge=0)
    detected_piece_groups: int = Field(ge=0)
    low_confidence_count: int = Field(ge=0)
    average_confidence: float = Field(ge=0.0, le=1.0)
    dominant_colors: List[str] = Field(default_factory=list)


class UploadedScanFile(BaseModel):
    original_name: str
    stored_name: str
    content_type: str
    size_bytes: int = Field(ge=0)


class SampleImageResponse(BaseModel):
    sample_id: str
    file_name: str
    url: str
    size_bytes: int = Field(ge=0)


class SampleImageListResponse(BaseModel):
    samples: List[SampleImageResponse]


class ScanDemoResponse(BaseModel):
    upload_id: str
    saved_files: List[UploadedScanFile]
    detection_batch: DetectionBatch


class SampleScanRequest(BaseModel):
    sample_ids: List[str] = Field(default_factory=list)


class ScanReviewRequest(BaseModel):
    review_selections: Dict[str, str] = Field(default_factory=dict)
    inventory_adjustments: Dict[str, int] = Field(default_factory=dict)
    category: Optional[str] = None


class InventoryRequest(BaseModel):
    inventory: Dict[str, int]
    category: Optional[str] = None


class MissingRequirement(BaseModel):
    family_id: str
    short_by: int = Field(ge=1)


class BuildIdea(BaseModel):
    build_id: str
    name: str
    category: str
    description: str
    compatibility_score: float = Field(ge=0.0, le=1.0)
    matched_families: Dict[str, int]
    missing_families: List[MissingRequirement]
    tags: List[str]


class BuildIdeaResponse(BaseModel):
    normalized_inventory: Dict[str, int]
    build_ideas: List[BuildIdea]


class AssemblyGroupResponse(BaseModel):
    group_id: str
    name: str
    summary: str
    required_families: Dict[str, int]
    connect_to: Optional[str] = None
    direction: Optional[str] = None


class BuildDetailResponse(BaseModel):
    build_id: str
    name: str
    category: str
    description: str
    tags: List[str]
    viewer_story: str
    assembly_groups: List[AssemblyGroupResponse]


class ScanSessionSummary(BaseModel):
    upload_id: str
    created_at: str
    updated_at: str
    image_count: int = Field(ge=1)
    file_count: int = Field(ge=0)
    profile_name: str
    total_estimated_pieces: int = Field(ge=0)
    low_confidence_count: int = Field(ge=0)


class ScanSessionResponse(BaseModel):
    upload_id: str
    created_at: str
    updated_at: str
    saved_files: List[UploadedScanFile]
    detection_batch: DetectionBatch
    scan_overview: ScanOverview
    review_selections: Dict[str, str] = Field(default_factory=dict)
    inventory_adjustments: Dict[str, int] = Field(default_factory=dict)
    corrected_inventory: Dict[str, int] = Field(default_factory=dict)
    selected_category: Optional[str] = None
    build_idea_response: Optional[BuildIdeaResponse] = None


class ScanSessionListResponse(BaseModel):
    scans: List[ScanSessionSummary]
