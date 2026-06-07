export type Category =
  | "animals"
  | "vehicles"
  | "objects"
  | "buildings"
  | "fantasy";

export type CategoryFilter = Category | "all";
export type DataSource = "api" | "offline";
export type InventoryMap = Record<string, number>;

export interface FeatureCardData {
  title: string;
  summary: string;
}

export interface RecommendationCardData {
  name: string;
  category: Category;
  compatibilityScore: number;
  description: string;
}

export interface ReviewOption {
  pieceId: string;
  label: string;
}

export interface PieceDetection {
  pieceId: string;
  label: string;
  color: string;
  quantity: number;
  confidence: number;
  reviewOptions: ReviewOption[];
  cropUrl?: string | null;
}

export interface DetectionBatch {
  imageCount: number;
  detections: PieceDetection[];
}

export interface UploadedScanFile {
  originalName: string;
  storedName: string;
  contentType: string;
  sizeBytes: number;
}

export interface SampleImage {
  sampleId: string;
  fileName: string;
  url: string;
  sizeBytes: number;
}

export interface ScanOverview {
  profileName: string;
  totalEstimatedPieces: number;
  detectedPieceGroups: number;
  lowConfidenceCount: number;
  averageConfidence: number;
  dominantColors: string[];
}

export interface ScanSession {
  uploadId: string;
  createdAt: string;
  updatedAt: string;
  savedFiles: UploadedScanFile[];
  detectionBatch: DetectionBatch;
  scanOverview: ScanOverview;
  reviewSelections: Record<string, string>;
  inventoryAdjustments: Record<string, number>;
  correctedInventory: Record<string, number>;
  selectedCategory: Category | null;
  recommendationResponse: RecommendationResponse | null;
}

export interface ScanSessionSummary {
  uploadId: string;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  fileCount: number;
  profileName: string;
  totalEstimatedPieces: number;
  lowConfidenceCount: number;
}

export interface MissingRequirement {
  familyId: string;
  shortBy: number;
}

export interface BuildRecommendation {
  buildId: string;
  name: string;
  category: Category;
  description: string;
  compatibilityScore: number;
  matchedFamilies: Record<string, number>;
  missingFamilies: MissingRequirement[];
  tags: string[];
}

export interface AssemblyGroup {
  groupId: string;
  name: string;
  summary: string;
  requiredFamilies: Record<string, number>;
  connectTo: string | null;
  direction: string | null;
}

export interface BuildDetail {
  buildId: string;
  name: string;
  category: Category;
  description: string;
  tags: string[];
  viewerStory: string;
  assemblyGroups: AssemblyGroup[];
}

export interface RecommendationResponse {
  normalizedInventory: Record<string, number>;
  recommendations: BuildRecommendation[];
}

export interface ApiResult<TData> {
  data: TData;
  source: DataSource;
}
