import { buildOfflineRecommendationResponse } from "./inventory";
import { buildOfflineMockDetectionBatch, buildOfflineScanOverview } from "../mockData";
import { buildDetailsById } from "../data/buildDetails";
import {
  ApiResult,
  BuildDetail,
  Category,
  DetectionBatch,
  InventoryMap,
  RecommendationResponse,
  SampleImage,
  ScanOverview,
  ScanSession,
  ScanSessionSummary,
  UploadedScanFile,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

interface RawReviewOption {
  piece_id: string;
  label: string;
}

interface RawPieceDetection {
  piece_id: string;
  label: string;
  color: string;
  quantity: number;
  confidence: number;
  review_options: RawReviewOption[];
  crop_url?: string | null;
}

interface RawDetectionBatch {
  image_count: number;
  detections: RawPieceDetection[];
}

interface RawUploadedScanFile {
  original_name: string;
  stored_name: string;
  content_type: string;
  size_bytes: number;
}

interface RawScanDemoResponse {
  upload_id: string;
  saved_files: RawUploadedScanFile[];
  detection_batch: RawDetectionBatch;
}

interface RawSampleImage {
  sample_id: string;
  file_name: string;
  url: string;
  size_bytes: number;
}

interface RawSampleImageListResponse {
  samples: RawSampleImage[];
}

interface RawScanOverview {
  profile_name: string;
  total_estimated_pieces: number;
  detected_piece_groups: number;
  low_confidence_count: number;
  average_confidence: number;
  dominant_colors: string[];
}

interface RawAssemblyGroup {
  group_id: string;
  name: string;
  summary: string;
  required_families: Record<string, number>;
  connect_to: string | null;
  direction: string | null;
}

interface RawBuildDetailResponse {
  build_id: string;
  name: string;
  category: Category;
  description: string;
  tags: string[];
  viewer_story: string;
  assembly_groups: RawAssemblyGroup[];
}

interface RawScanSessionResponse {
  upload_id: string;
  created_at: string;
  updated_at: string;
  saved_files: RawUploadedScanFile[];
  detection_batch: RawDetectionBatch;
  scan_overview: RawScanOverview;
  review_selections: Record<string, string>;
  inventory_adjustments: Record<string, number>;
  corrected_inventory: Record<string, number>;
  selected_category: Category | null;
  recommendation_response: RawRecommendationResponse | null;
}

interface RawScanSessionSummary {
  upload_id: string;
  created_at: string;
  updated_at: string;
  image_count: number;
  file_count: number;
  profile_name: string;
  total_estimated_pieces: number;
  low_confidence_count: number;
}

interface RawScanSessionListResponse {
  scans: RawScanSessionSummary[];
}

interface RawMissingRequirement {
  family_id: string;
  short_by: number;
}

interface RawBuildRecommendation {
  build_id: string;
  name: string;
  category: Category;
  description: string;
  compatibility_score: number;
  matched_families: Record<string, number>;
  missing_families: RawMissingRequirement[];
  tags: string[];
}

interface RawRecommendationResponse {
  normalized_inventory: Record<string, number>;
  recommendations: RawBuildRecommendation[];
}

function mapDetectionBatch(rawBatch: RawDetectionBatch): DetectionBatch {
  return {
    imageCount: rawBatch.image_count,
    detections: rawBatch.detections.map((rawDetection) => ({
      pieceId: rawDetection.piece_id,
      label: rawDetection.label,
      color: rawDetection.color,
      quantity: rawDetection.quantity,
      confidence: rawDetection.confidence,
      cropUrl: rawDetection.crop_url
        ? rawDetection.crop_url.startsWith("http")
          ? rawDetection.crop_url
          : `${API_BASE_URL}${rawDetection.crop_url}`
        : null,
      reviewOptions: rawDetection.review_options.map((option) => ({
        pieceId: option.piece_id,
        label: option.label,
      })),
    })),
  };
}

function mapRecommendationResponse(
  rawResponse: RawRecommendationResponse,
): RecommendationResponse {
  return {
    normalizedInventory: rawResponse.normalized_inventory,
    recommendations: rawResponse.recommendations.map((recommendation) => ({
      buildId: recommendation.build_id,
      name: recommendation.name,
      category: recommendation.category,
      description: recommendation.description,
      compatibilityScore: recommendation.compatibility_score,
      matchedFamilies: recommendation.matched_families,
      missingFamilies: recommendation.missing_families.map((missingFamily) => ({
        familyId: missingFamily.family_id,
        shortBy: missingFamily.short_by,
      })),
      tags: recommendation.tags,
    })),
  };
}

function mapUploadedScanFile(rawFile: RawUploadedScanFile): UploadedScanFile {
  return {
    originalName: rawFile.original_name,
    storedName: rawFile.stored_name,
    contentType: rawFile.content_type,
    sizeBytes: rawFile.size_bytes,
  };
}

function mapSampleImage(rawImage: RawSampleImage): SampleImage {
  return {
    sampleId: rawImage.sample_id,
    fileName: rawImage.file_name,
    url: rawImage.url.startsWith("http") ? rawImage.url : `${API_BASE_URL}${rawImage.url}`,
    sizeBytes: rawImage.size_bytes,
  };
}

function mapScanOverview(rawOverview: RawScanOverview): ScanOverview {
  return {
    profileName: rawOverview.profile_name,
    totalEstimatedPieces: rawOverview.total_estimated_pieces,
    detectedPieceGroups: rawOverview.detected_piece_groups,
    lowConfidenceCount: rawOverview.low_confidence_count,
    averageConfidence: rawOverview.average_confidence,
    dominantColors: rawOverview.dominant_colors,
  };
}

function mapScanSessionResponse(rawResponse: RawScanSessionResponse): ScanSession {
  return {
    uploadId: rawResponse.upload_id,
    createdAt: rawResponse.created_at,
    updatedAt: rawResponse.updated_at,
    savedFiles: rawResponse.saved_files.map(mapUploadedScanFile),
    detectionBatch: mapDetectionBatch(rawResponse.detection_batch),
    scanOverview: mapScanOverview(rawResponse.scan_overview),
    reviewSelections: rawResponse.review_selections,
    inventoryAdjustments: rawResponse.inventory_adjustments,
    correctedInventory: rawResponse.corrected_inventory,
    selectedCategory: rawResponse.selected_category,
    recommendationResponse: rawResponse.recommendation_response
      ? mapRecommendationResponse(rawResponse.recommendation_response)
      : null,
  };
}

function mapScanSessionSummary(rawSession: RawScanSessionSummary): ScanSessionSummary {
  return {
    uploadId: rawSession.upload_id,
    createdAt: rawSession.created_at,
    updatedAt: rawSession.updated_at,
    imageCount: rawSession.image_count,
    fileCount: rawSession.file_count,
    profileName: rawSession.profile_name,
    totalEstimatedPieces: rawSession.total_estimated_pieces,
    lowConfidenceCount: rawSession.low_confidence_count,
  };
}

function mapBuildDetailResponse(rawResponse: RawBuildDetailResponse): BuildDetail {
  return {
    buildId: rawResponse.build_id,
    name: rawResponse.name,
    category: rawResponse.category,
    description: rawResponse.description,
    tags: rawResponse.tags,
    viewerStory: rawResponse.viewer_story,
    assemblyGroups: rawResponse.assembly_groups.map((group) => ({
      groupId: group.group_id,
      name: group.name,
      summary: group.summary,
      requiredFamilies: group.required_families,
      connectTo: group.connect_to,
      direction: group.direction,
    })),
  };
}

function buildOfflineScanResponse(files: File[]): ScanSession {
  const detectionBatch = buildOfflineMockDetectionBatch(files.length);

  return {
    uploadId: "offline-demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    savedFiles: files.map((file, index) => ({
      originalName: file.name,
      storedName: `${String(index + 1).padStart(2, "0")}_${file.name}`,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    })),
    detectionBatch,
    scanOverview: buildOfflineScanOverview(detectionBatch),
    reviewSelections: {},
    inventoryAdjustments: {},
    correctedInventory: {},
    selectedCategory: null,
    recommendationResponse: null,
  };
}

function buildOfflineScanResponseFromSampleIds(sampleIds: string[]): ScanSession {
  const detectionBatch = buildOfflineMockDetectionBatch(sampleIds.length);

  return {
    uploadId: "offline-demo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    savedFiles: sampleIds.map((sampleId, index) => ({
      originalName: sampleId,
      storedName: `${String(index + 1).padStart(2, "0")}_${sampleId.replace(/ /g, "_")}`,
      contentType: "image/png",
      sizeBytes: 0,
    })),
    detectionBatch,
    scanOverview: buildOfflineScanOverview(detectionBatch),
    reviewSelections: {},
    inventoryAdjustments: {},
    correctedInventory: {},
    selectedCategory: null,
    recommendationResponse: null,
  };
}

export async function fetchSampleImages(): Promise<ApiResult<SampleImage[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sample-images`);

    if (!response.ok) {
      throw new Error(`Sample image request failed with ${response.status}`);
    }

    const rawResponse = (await response.json()) as RawSampleImageListResponse;
    return {
      data: rawResponse.samples.map(mapSampleImage),
      source: "api",
    };
  } catch {
    return {
      data: [],
      source: "offline",
    };
  }
}

export async function startDemoScan(files: File[]): Promise<ApiResult<ScanSession>> {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_BASE_URL}/api/scan-demo`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Scan request failed with ${response.status}`);
    }

    const rawResponse = (await response.json()) as RawScanSessionResponse;
    return {
      data: mapScanSessionResponse(rawResponse),
      source: "api",
    };
  } catch {
    return {
      data: buildOfflineScanResponse(files),
      source: "offline",
    };
  }
}

export async function startSampleScan(sampleIds: string[]): Promise<ApiResult<ScanSession>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan-samples`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sample_ids: sampleIds }),
    });

    if (!response.ok) {
      throw new Error(`Sample scan request failed with ${response.status}`);
    }

    const rawResponse = (await response.json()) as RawScanSessionResponse;
    return {
      data: mapScanSessionResponse(rawResponse),
      source: "api",
    };
  } catch {
    return {
      data: buildOfflineScanResponseFromSampleIds(sampleIds),
      source: "offline",
    };
  }
}

export async function saveScanReview(
  uploadId: string,
  reviewSelections: Record<number, string>,
  inventoryAdjustments: Record<string, number>,
  category?: Category,
): Promise<ApiResult<ScanSession>> {
  const serializedSelections = Object.fromEntries(
    Object.entries(reviewSelections).map(([detectionIndex, pieceId]) => [
      String(detectionIndex),
      pieceId,
    ]),
  );

  const response = await fetch(`${API_BASE_URL}/api/scans/${uploadId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      review_selections: serializedSelections,
      inventory_adjustments: inventoryAdjustments,
      category,
    }),
  });

  if (!response.ok) {
    throw new Error(`Review save request failed with ${response.status}`);
  }

  const rawResponse = (await response.json()) as RawScanSessionResponse;
  return {
    data: mapScanSessionResponse(rawResponse),
    source: "api",
  };
}

export async function fetchRecentScans(): Promise<ApiResult<ScanSessionSummary[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scans`);

    if (!response.ok) {
      throw new Error(`Scan list request failed with ${response.status}`);
    }

    const rawResponse = (await response.json()) as RawScanSessionListResponse;
    return {
      data: rawResponse.scans.map(mapScanSessionSummary),
      source: "api",
    };
  } catch {
    return {
      data: [],
      source: "offline",
    };
  }
}

export async function fetchScanSession(uploadId: string): Promise<ApiResult<ScanSession>> {
  const response = await fetch(`${API_BASE_URL}/api/scans/${uploadId}`);

  if (!response.ok) {
    throw new Error(`Scan session request failed with ${response.status}`);
  }

  const rawResponse = (await response.json()) as RawScanSessionResponse;
  return {
    data: mapScanSessionResponse(rawResponse),
    source: "api",
  };
}

export async function fetchBuildDetail(buildId: string): Promise<ApiResult<BuildDetail>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/catalog/builds/${buildId}`);

    if (!response.ok) {
      throw new Error(`Build detail request failed with ${response.status}`);
    }

    const rawResponse = (await response.json()) as RawBuildDetailResponse;
    return {
      data: mapBuildDetailResponse(rawResponse),
      source: "api",
    };
  } catch {
    return {
      data: buildDetailsById[buildId],
      source: "offline",
    };
  }
}

export async function fetchRecommendations(
  inventory: InventoryMap,
  category?: Category,
): Promise<ApiResult<RecommendationResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inventory,
        category,
      }),
    });

    if (!response.ok) {
      throw new Error(`Recommendation request failed with ${response.status}`);
    }

    const rawResponse = (await response.json()) as RawRecommendationResponse;
    return {
      data: mapRecommendationResponse(rawResponse),
      source: "api",
    };
  } catch {
    return {
      data: buildOfflineRecommendationResponse(inventory, category),
      source: "offline",
    };
  }
}
