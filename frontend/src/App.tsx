import { Suspense, lazy, useEffect, useMemo, useState } from "react";

import { DetectionReviewCard } from "./components/DetectionReviewCard";
import { PieceReferenceTile } from "./components/PieceReferenceTile";
import { BuildCard } from "./components/BuildCard";
import { buildCategories } from "./data/buildCategories";
import { pieceCatalog, pieceCatalogById } from "./data/pieceCatalog";
import {
  fetchBuildDetail,
  fetchBuildIdeas,
  fetchSampleImages,
  saveScanReview,
  startDemoScan,
  startSampleScan,
} from "./lib/api";
import {
  buildCorrectedInventory,
  buildPieceLabelLookup,
  buildStagePieceSuggestions,
  countLowConfidenceDetections,
  humanizeIdentifier,
  isLowConfidence,
  mergeInventoryMaps,
} from "./lib/inventory";
import {
  BuildDetail,
  CategoryFilter,
  DetectionBatch,
  BuildIdeaResponse,
  SampleImage,
  ScanSession,
  UploadedScanFile,
} from "./types";

type AppPage = "scan" | "review" | "buildIdeas" | "assembly";

const APP_PAGES: AppPage[] = ["scan", "review", "buildIdeas", "assembly"];

const LazyBuildThreeViewer = lazy(() =>
  import("./components/BuildThreeViewer").then((module) => ({
    default: module.BuildThreeViewer,
  })),
);

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function pageHash(page: AppPage) {
  return `#/${page}`;
}

function formatDisplayImageName(fileName: string, index?: number) {
  const fallbackLabel = typeof index === "number" ? `Test ${index + 1}` : "Test image";
  const baseName = fileName.replace(/\.[^/.]+$/, "");

  if (/^test[\s_-]?\d*/i.test(baseName) || /^[0-9a-f-]{12,}$/i.test(baseName)) {
    const numericMatch = baseName.match(/test[\s_-]?(\d+)/i);
    if (numericMatch) {
      return `Test ${numericMatch[1]}`;
    }

    return fallbackLabel;
  }

  return fileName;
}

function readPageFromHash(): AppPage {
  const rawHash = window.location.hash.replace(/^#\/?/, "");
  return APP_PAGES.includes(rawHash as AppPage) ? (rawHash as AppPage) : "scan";
}

function navigateWithHash(page: AppPage) {
  window.location.hash = pageHash(page);
}

function StepBadge({ step, title }: { step: string; title: string }) {
  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">{step}</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
    </div>
  );
}

function ProgressChip({
  page,
  currentPage,
}: {
  page: AppPage;
  currentPage: AppPage;
}) {
  const titles: Record<AppPage, string> = {
    scan: "Scan",
    review: "Review",
    buildIdeas: "Builds",
    assembly: "Assembly",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
        currentPage === page
          ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
          : "border-slate-700 text-slate-400"
      }`}
    >
      {titles[page]}
    </span>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>(() =>
    typeof window === "undefined" ? "scan" : readPageFromHash(),
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [savedFiles, setSavedFiles] = useState<UploadedScanFile[]>([]);
  const [sampleImages, setSampleImages] = useState<SampleImage[]>([]);
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ScanSession | null>(null);
  const [detections, setDetections] = useState<DetectionBatch | null>(null);
  const [reviewSelections, setReviewSelections] = useState<Record<number, string>>({});
  const [inventoryAdjustments, setInventoryAdjustments] = useState<Record<string, number>>({});
  const [manualPieceId, setManualPieceId] = useState(pieceCatalog[0]?.pieceId ?? "piece_2x4");
  const [manualPieceQuantity, setManualPieceQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [buildIdeaResponse, setBuildIdeaResponse] =
    useState<BuildIdeaResponse | null>(null);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [selectedBuildDetail, setSelectedBuildDetail] = useState<BuildDetail | null>(null);
  const [isExplodedView, setIsExplodedView] = useState(true);
  const [activeAssemblyStageIndex, setActiveAssemblyStageIndex] = useState(0);
  const [activeReviewImageIndex, setActiveReviewImageIndex] = useState(0);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingBuildIdeas, setIsLoadingBuildIdeas] = useState(false);
  const [isLoadingBuildDetail, setIsLoadingBuildDetail] = useState(false);
  const [isLoadingSampleImages, setIsLoadingSampleImages] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const selectedFilePreviews = useMemo(
    () =>
      selectedFiles.map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        name: formatDisplayImageName(file.name, index),
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFilePreviews]);

  useEffect(() => {
    if (!window.location.hash) {
      navigateWithHash("scan");
      setCurrentPage("scan");
      return;
    }

    const syncPageFromHash = () => {
      setCurrentPage(readPageFromHash());
    };

    window.addEventListener("hashchange", syncPageFromHash);
    syncPageFromHash();
    return () => window.removeEventListener("hashchange", syncPageFromHash);
  }, []);

  useEffect(() => {
    setActiveReviewImageIndex(0);
  }, [selectedFiles, selectedSampleIds]);

  useEffect(() => {
    void loadSampleImages();
  }, []);

  const reviewImages = useMemo(() => {
    if (selectedFilePreviews.length > 0) {
      return selectedFilePreviews;
    }

    if (selectedSampleIds.length > 0) {
      const sampleLookup = new Map(sampleImages.map((sampleImage) => [sampleImage.sampleId, sampleImage]));
      return selectedSampleIds
        .map((sampleId) => sampleLookup.get(sampleId))
        .filter((sampleImage): sampleImage is SampleImage => Boolean(sampleImage))
        .map((sampleImage, sampleIndex) => ({
          key: sampleImage.sampleId,
          name: formatDisplayImageName(sampleImage.fileName, sampleIndex),
          url: sampleImage.url,
        }));
    }

    return [];
  }, [sampleImages, selectedFilePreviews, selectedSampleIds]);

  const activeReviewImage = reviewImages[activeReviewImageIndex] ?? reviewImages[0] ?? null;

  const manualPieceOptions = useMemo(
    () => pieceCatalog.filter((piece) => piece.pieceId.startsWith("piece_")),
    [],
  );

  const detectedInventory = useMemo(
    () => buildCorrectedInventory(detections, reviewSelections),
    [detections, reviewSelections],
  );

  const correctedInventory = useMemo(
    () => mergeInventoryMaps(detectedInventory, inventoryAdjustments),
    [detectedInventory, inventoryAdjustments],
  );

  const pieceLabels = useMemo(() => buildPieceLabelLookup(detections), [detections]);

  const inventoryEntries = useMemo(
    () =>
      Object.entries(correctedInventory)
        .map(([pieceId, quantity]) => ({
          pieceId,
          label: pieceLabels[pieceId] ?? humanizeIdentifier(pieceId),
          quantity,
        }))
        .sort((left, right) => right.quantity - left.quantity),
    [correctedInventory, pieceLabels],
  );

  const detectionsNeedingReview = useMemo(
    () =>
      detections
        ? detections.detections
            .map((detection, detectionIndex) => ({ detection, detectionIndex }))
            .filter(({ detection }) => isLowConfidence(detection.confidence))
        : [],
    [detections],
  );

  const lowConfidenceCount = useMemo(
    () => countLowConfidenceDetections(detections),
    [detections],
  );

  const autoAcceptedCount = useMemo(
    () => (detections ? Math.max(detections.detections.length - lowConfidenceCount, 0) : 0),
    [detections, lowConfidenceCount],
  );

  const activeAssemblyGroup = useMemo(
    () => selectedBuildDetail?.assemblyGroups[activeAssemblyStageIndex] ?? null,
    [selectedBuildDetail, activeAssemblyStageIndex],
  );

  const activeStagePieceSuggestions = useMemo(
    () =>
      activeAssemblyGroup
        ? buildStagePieceSuggestions(correctedInventory, activeAssemblyGroup.requiredFamilies)
        : [],
    [activeAssemblyGroup, correctedInventory],
  );

  function resetWorkflow() {
    setSelectedFiles([]);
    setSavedFiles([]);
    setSelectedSampleIds([]);
    setUploadId(null);
    setActiveSession(null);
    setDetections(null);
    setReviewSelections({});
    setInventoryAdjustments({});
    setManualPieceId(pieceCatalog[0]?.pieceId ?? "piece_2x4");
    setManualPieceQuantity(1);
    setSelectedCategory("all");
    setBuildIdeaResponse(null);
    setSelectedBuildId(null);
    setSelectedBuildDetail(null);
    setIsExplodedView(true);
    setActiveAssemblyStageIndex(0);
    setActiveReviewImageIndex(0);
    setFeedbackMessage(null);
    setFileInputKey((currentKey) => currentKey + 1);
    navigateWithHash("scan");
  }

  function applyScanSession(session: ScanSession) {
    const nextSelections: Record<number, string> = {};

    Object.entries(session.reviewSelections).forEach(([detectionIndex, pieceId]) => {
      nextSelections[Number(detectionIndex)] = pieceId;
    });

    setActiveSession(session);
    setSavedFiles(session.savedFiles);
    setUploadId(session.uploadId);
    setDetections(session.detectionBatch);
    setReviewSelections(nextSelections);
    setInventoryAdjustments(session.inventoryAdjustments);
    setSelectedCategory(session.selectedCategory ?? "all");
    setBuildIdeaResponse(session.buildIdeaResponse);
    setSelectedBuildId(null);
    setSelectedBuildDetail(null);
    setIsExplodedView(true);
    setActiveAssemblyStageIndex(0);

    if (session.buildIdeaResponse?.buildIdeas.length) {
      void loadBuildDetail(session.buildIdeaResponse.buildIdeas[0].buildId);
    }
  }

  async function loadSampleImages() {
    setIsLoadingSampleImages(true);

    try {
      const result = await fetchSampleImages();
      setSampleImages(result.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingSampleImages(false);
    }
  }

  async function loadBuildDetail(buildId: string) {
    setSelectedBuildId(buildId);
    setIsLoadingBuildDetail(true);
    setIsExplodedView(true);
    setActiveAssemblyStageIndex(0);

    try {
      const result = await fetchBuildDetail(buildId);
      setSelectedBuildDetail(result.data);
    } catch (error) {
      console.error(error);
      setFeedbackMessage("Unable to load the build preview right now.");
    } finally {
      setIsLoadingBuildDetail(false);
    }
  }

  async function handleStartScanClick() {
    if (selectedFiles.length === 0 && selectedSampleIds.length === 0) {
      setFeedbackMessage("Choose uploaded images or sample images before starting the piece scan.");
      return;
    }

    setIsAnalyzing(true);
    setFeedbackMessage(null);

    try {
      const result =
        selectedFiles.length > 0
          ? await startDemoScan(selectedFiles)
          : await startSampleScan(selectedSampleIds);

      applyScanSession(result.data);
      setFeedbackMessage("Scan complete. Continue to manual review when you are ready.");
    } catch (error) {
      console.error(error);
      setFeedbackMessage("Unable to scan those images right now.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleReviewChange(detectionIndex: number, nextPieceId: string) {
    setReviewSelections((currentSelections) => ({
      ...currentSelections,
      [detectionIndex]: nextPieceId,
    }));
  }

  function handleAddManualPiece() {
    if (!manualPieceId || manualPieceQuantity < 1) {
      return;
    }

    setInventoryAdjustments((currentAdjustments) => ({
      ...currentAdjustments,
      [manualPieceId]: (currentAdjustments[manualPieceId] ?? 0) + manualPieceQuantity,
    }));
  }

  function handleAdjustCartPiece(pieceId: string, delta: number) {
    if (delta === 0) {
      return;
    }

    setInventoryAdjustments((currentAdjustments) => {
      const nextQuantity = (currentAdjustments[pieceId] ?? 0) + delta;

      if (nextQuantity === 0) {
        const { [pieceId]: _removedPiece, ...remainingAdjustments } = currentAdjustments;
        return remainingAdjustments;
      }

      return {
        ...currentAdjustments,
        [pieceId]: nextQuantity,
      };
    });
  }

  function handleClearCartPiece(pieceId: string, currentQuantity: number) {
    setInventoryAdjustments((currentAdjustments) => {
      const baseQuantity = currentQuantity - (currentAdjustments[pieceId] ?? 0);

      if (baseQuantity <= 0) {
        const { [pieceId]: _removedPiece, ...remainingAdjustments } = currentAdjustments;
        return remainingAdjustments;
      }

      return {
        ...currentAdjustments,
        [pieceId]: -baseQuantity,
      };
    });
  }

  function handleSampleToggle(sampleId: string) {
    setFeedbackMessage(null);
    setSelectedFiles([]);
    setFileInputKey((currentKey) => currentKey + 1);

    setSelectedSampleIds((currentSelectedIds) => {
      if (currentSelectedIds.includes(sampleId)) {
        return currentSelectedIds.filter((currentId) => currentId !== sampleId);
      }

      if (currentSelectedIds.length >= 3) {
        setFeedbackMessage("Choose at most 3 sample images per scan.");
        return currentSelectedIds;
      }

      return [...currentSelectedIds, sampleId];
    });
  }

  async function handleGenerateBuildIdeas() {
    setIsLoadingBuildIdeas(true);
    setFeedbackMessage(null);

    try {
      const category = selectedCategory === "all" ? undefined : selectedCategory;

      if (uploadId && uploadId !== "offline-demo") {
        const result = await saveScanReview(
          uploadId,
          reviewSelections,
          inventoryAdjustments,
          category,
        );
        applyScanSession(result.data);
        setFeedbackMessage("Build ideas are ready. Pick one to preview.");
      } else {
        const result = await fetchBuildIdeas(correctedInventory, category);
        setBuildIdeaResponse(result.data);
        if (result.data.buildIdeas.length > 0) {
          await loadBuildDetail(result.data.buildIdeas[0].buildId);
        }
        setFeedbackMessage("Build ideas are ready. Pick one to preview.");
      }

      navigateWithHash("buildIdeas");
    } catch (error) {
      console.error(error);
      setFeedbackMessage("Unable to load build ideas right now.");
    } finally {
      setIsLoadingBuildIdeas(false);
    }
  }

  function renderGuardCard(
    title: string,
    description: string,
    actionLabel: string,
    action: () => void,
  ) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{description}</p>
        <button
          type="button"
          onClick={action}
          className="mt-6 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          {actionLabel}
        </button>
      </div>
    );
  }

  function renderScanPage() {
    return (
      <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StepBadge step="Step 1" title="Choose photos to scan" />
          <div className="flex flex-wrap items-center gap-2">
            <ProgressChip page="scan" currentPage={currentPage} />
            <ProgressChip page="review" currentPage={currentPage} />
            <ProgressChip page="buildIdeas" currentPage={currentPage} />
            <ProgressChip page="assembly" currentPage={currentPage} />
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          Got some scrap LEGO? Try a quick scan. Upload 1 to 3 photos on a plain background with
          no overlap, then check any uncertain piece guesses before seeing what you can build.
        </p>

        <div className="mt-8 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <label className="block rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6">
              <span className="text-sm font-medium text-white">Choose 1 to 3 LEGO photos</span>
              <input
                key={fileInputKey}
                className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-500/15 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cyan-200"
                multiple
                accept="image/*"
                type="file"
                onChange={(event) => {
                  setSelectedSampleIds([]);
                  setSelectedFiles(Array.from(event.target.files ?? []).slice(0, 3));
                  setFeedbackMessage(null);
                }}
              />
            </label>

            <div className="space-y-3">
              {selectedFilePreviews.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {selectedFilePreviews.map((preview) => (
                    <div
                      key={preview.key}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70"
                    >
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="h-36 w-full object-cover"
                      />
                      <div className="px-4 py-3 text-sm text-slate-300">{preview.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-400">
                  No uploaded photos selected yet.
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleStartScanClick}
                disabled={isAnalyzing || (selectedFiles.length === 0 && selectedSampleIds.length === 0)}
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isAnalyzing ? "Scanning photos..." : "Start scan"}
              </button>
              <button
                type="button"
                onClick={resetWorkflow}
                className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-400 hover:text-rose-200"
              >
                Clear photos and reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Quick test gallery</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Try the sample photos below if you want a quick test run first.
                </p>
              </div>
              <button
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                type="button"
                onClick={() => void loadSampleImages()}
                disabled={isLoadingSampleImages}
              >
                {isLoadingSampleImages ? "Refreshing..." : "Refresh gallery"}
              </button>
            </div>

            <div className="mt-4 grid max-h-[34rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
              {sampleImages.length > 0 ? (
                sampleImages.map((sampleImage) => {
                  const isSelected = selectedSampleIds.includes(sampleImage.sampleId);

                  return (
                    <button
                      key={sampleImage.sampleId}
                      type="button"
                      onClick={() => handleSampleToggle(sampleImage.sampleId)}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        isSelected
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-900/70 hover:border-cyan-400/60"
                      }`}
                    >
                      <img
                        src={sampleImage.url}
                        alt={sampleImage.fileName}
                        className="h-36 w-full object-cover"
                      />
                      <div className="space-y-2 px-4 py-3">
                        <p className="line-clamp-2 text-sm font-medium text-white">
                          {formatDisplayImageName(
                            sampleImage.fileName,
                            sampleImages.indexOf(sampleImage),
                          )}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {Math.round(sampleImage.sizeBytes / 1024)} KB
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400 sm:col-span-2 xl:col-span-3">
                  {isLoadingSampleImages
                    ? "Loading local sample gallery..."
                    : "No sample images were loaded. Start the backend to browse the local gallery."}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <h3 className="text-lg font-semibold text-white">Scan result</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Photos scanned</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {detections?.imageCount ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Estimated pieces</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {activeSession?.scanOverview.totalEstimatedPieces ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Needs manual review</p>
              <p className="mt-2 text-2xl font-semibold text-white">{lowConfidenceCount}</p>
            </div>
          </div>

          {feedbackMessage ? (
            <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {feedbackMessage}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigateWithHash("review")}
              disabled={!detections}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              Continue to manual review
            </button>
          </div>
        </div>
      </section>
    );
  }

  function renderReviewPage() {
    if (!detections) {
      return renderGuardCard(
        "No scan loaded yet",
        "Start on the photo-scan page first. Once the detector has returned piece guesses, we can open the manual review page.",
        "Back to photo scan",
        () => navigateWithHash("scan"),
      );
    }

    return (
      <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StepBadge step="Step 2" title="Manual review" />
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              {detectionsNeedingReview.length} pieces to check
            </span>
            <button
              type="button"
              onClick={() => navigateWithHash("scan")}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              Back to photo scan
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Estimated pieces</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {activeSession?.scanOverview.totalEstimatedPieces ?? detections.detections.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Ready to use</p>
            <p className="mt-2 text-2xl font-semibold text-white">{autoAcceptedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Needs review</p>
            <p className="mt-2 text-2xl font-semibold text-white">{detectionsNeedingReview.length}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 xl:sticky xl:top-6">
              <h3 className="text-lg font-semibold text-white">Selected photo</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Keep this open while you check the cropped pieces on the right. Just match each one
                to the closest size or shape you can see in the photo.
              </p>

              {activeReviewImage ? (
                <>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800 bg-white">
                    <img
                      src={activeReviewImage.url}
                      alt={activeReviewImage.name}
                      className="h-[36rem] w-full object-contain"
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{activeReviewImage.name}</p>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                  No photo preview available yet.
                </div>
              )}

              {reviewImages.length > 1 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {reviewImages.map((image, imageIndex) => (
                    <button
                      key={image.key}
                      type="button"
                      onClick={() => setActiveReviewImageIndex(imageIndex)}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        imageIndex === activeReviewImageIndex
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-900/70 hover:border-cyan-400/60"
                      }`}
                    >
                      <img src={image.url} alt={image.name} className="h-28 w-full object-cover" />
                      <div className="px-3 py-2 text-sm text-slate-200">{image.name}</div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            {detectionsNeedingReview.length > 0 ? (
              detectionsNeedingReview.map(({ detection, detectionIndex }) => (
                <DetectionReviewCard
                  key={`${detection.pieceId}-${detectionIndex}`}
                  detection={detection}
                  selectedPieceId={reviewSelections[detectionIndex] ?? detection.pieceId}
                  requiresReview
                  onSelectionChange={(nextPieceId) =>
                    handleReviewChange(detectionIndex, nextPieceId)
                  }
                />
              ))
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                Everything is above the manual-review threshold. You can continue to recommended
                builds now.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h3 className="text-lg font-semibold text-white">Current cart</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              This updates as you confirm pieces. You can add missed pieces, remove extras, or
              clear something that does not belong here.
            </p>

            <div className="mt-4 space-y-3">
              {inventoryEntries.length > 0 ? (
                inventoryEntries.map((entry) => (
                  <div
                    key={entry.pieceId}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <PieceReferenceTile
                        pieceId={entry.pieceId}
                        label={entry.label}
                        quantity={entry.quantity}
                        compact
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdjustCartPiece(entry.pieceId, 1)}
                          className="rounded-full border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
                        >
                          Add 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCartPiece(entry.pieceId, -1)}
                          className="rounded-full border border-amber-500/40 px-3 py-2 text-xs font-medium text-amber-200 transition hover:border-amber-300 hover:text-amber-100"
                        >
                          Remove 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearCartPiece(entry.pieceId, entry.quantity)}
                          className="rounded-full border border-rose-500/40 px-3 py-2 text-xs font-medium text-rose-200 transition hover:border-rose-300 hover:text-rose-100"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                  Your cart will show up here once the scan is ready.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h3 className="text-lg font-semibold text-white">Add a missing piece</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use this if you can clearly see a piece in the photo but it did not make it into the cart.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_8rem_auto]">
              <select
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                value={manualPieceId}
                onChange={(event) => setManualPieceId(event.target.value)}
              >
                {manualPieceOptions.map((piece) => (
                  <option key={piece.pieceId} value={piece.pieceId}>
                    {piece.referenceName}
                  </option>
                ))}
              </select>

              <input
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                type="number"
                min={1}
                value={manualPieceQuantity}
                onChange={(event) =>
                  setManualPieceQuantity(Math.max(1, Number(event.target.value) || 1))
                }
              />

              <button
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                type="button"
                onClick={handleAddManualPiece}
              >
                Add piece
              </button>
            </div>

            <div className="mt-4">
              <PieceReferenceTile
                pieceId={manualPieceId}
                label={pieceCatalogById[manualPieceId]?.label}
                quantity={manualPieceQuantity}
                caption="Cart preview"
              />
            </div>
          </div>
        </div>

        {feedbackMessage ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {feedbackMessage}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateWithHash("scan")}
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            Back to photo scan
          </button>
          <button
            type="button"
            onClick={() => void handleGenerateBuildIdeas()}
            disabled={inventoryEntries.length === 0 || isLoadingBuildIdeas}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isLoadingBuildIdeas
              ? "Saving review and generating builds..."
              : "Continue to recommended builds"}
          </button>
        </div>
      </section>
    );
  }

  function renderBuildIdeasPage() {
    if (!buildIdeaResponse) {
      return renderGuardCard(
        "No build ideas yet",
        "Finish the manual review step first. That step saves the corrected inventory and then generates build suggestions.",
        "Back to manual review",
        () => navigateWithHash("review"),
      );
    }

    return (
      <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <StepBadge step="Step 3" title="Recommended builds" />
          <button
            type="button"
            onClick={() => navigateWithHash("review")}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            Back to manual review
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
          <label className="min-w-[16rem] flex-1">
            <span className="text-sm font-medium text-white">Build category</span>
            <select
              className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as CategoryFilter)}
            >
              <option value="all">All categories</option>
              {buildCategories.map((category) => (
                <option key={category} value={category}>
                  {humanizeIdentifier(category)}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void handleGenerateBuildIdeas()}
            disabled={isLoadingBuildIdeas}
            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isLoadingBuildIdeas ? "Refreshing..." : "Refresh build list"}
          </button>
        </div>

        <div className="mt-6 grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto xl:pr-2">
            {buildIdeaResponse.buildIdeas.map((buildIdea) => (
              <BuildCard
                key={buildIdea.buildId}
                buildIdea={buildIdea}
                formatScore={formatScore}
                isSelected={selectedBuildId === buildIdea.buildId}
                onSelect={(buildId) => void loadBuildDetail(buildId)}
              />
            ))}
          </div>

          <div className="self-start rounded-2xl border border-slate-800 bg-slate-950/60 p-5 xl:sticky xl:top-6">
            {selectedBuildDetail ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{selectedBuildDetail.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {selectedBuildDetail.description}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
                    {selectedBuildDetail.category}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      isExplodedView
                        ? "bg-cyan-500 text-slate-950"
                        : "border border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
                    }`}
                    type="button"
                    onClick={() => setIsExplodedView(true)}
                  >
                    Exploded view
                  </button>
                  <button
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      !isExplodedView
                        ? "bg-emerald-400 text-slate-950"
                        : "border border-slate-700 text-slate-200 hover:border-emerald-300 hover:text-emerald-200"
                    }`}
                    type="button"
                    onClick={() => setIsExplodedView(false)}
                  >
                    Assemble view
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateWithHash("assembly")}
                    className="rounded-full border border-cyan-500/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400 hover:text-cyan-100"
                  >
                    Open assembly instructions
                  </button>
                </div>

                <div className="mt-6">
                  <Suspense
                    fallback={
                      <div className="flex h-[28rem] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-sm text-slate-400">
                        Loading 3D build preview...
                      </div>
                    }
                  >
                    <LazyBuildThreeViewer
                      buildDetail={selectedBuildDetail}
                      explodedView={isExplodedView}
                    />
                  </Suspense>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-sm font-medium text-white">Preview summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Open the assembly page to see this build broken into bigger build stages.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                Choose a recommended build to open its preview.
              </div>
            )}
          </div>
        </div>

        {feedbackMessage ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {feedbackMessage}
          </div>
        ) : null}
      </section>
    );
  }

  function renderAssemblyPage() {
    if (!selectedBuildDetail) {
      return renderGuardCard(
        "No build preview selected",
        "Choose a recommended build first. Once a build preview is open, the assembly page shows one stage at a time.",
        "Back to recommended builds",
        () => navigateWithHash("buildIdeas"),
      );
    }

    return (
      <section className="mt-10 rounded-3xl border border-cyan-500/30 bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
              Step 4
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {selectedBuildDetail.name} assembly instructions
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              This page shows one build section at a time and ties each step back to the piece
              list.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
              type="button"
              onClick={() => navigateWithHash("buildIdeas")}
            >
              Back to recommended builds
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm transition ${
                isExplodedView
                  ? "bg-cyan-500 text-slate-950"
                  : "border border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
              }`}
              type="button"
              onClick={() => setIsExplodedView(true)}
            >
              Exploded stage
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm transition ${
                !isExplodedView
                  ? "bg-emerald-400 text-slate-950"
                  : "border border-slate-700 text-slate-200 hover:border-emerald-300 hover:text-emerald-200"
              }`}
              type="button"
              onClick={() => setIsExplodedView(false)}
            >
              Assemble stage
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
                    Stage {activeAssemblyStageIndex + 1} of {selectedBuildDetail.assemblyGroups.length}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {activeAssemblyGroup?.name ?? "Assembly stage"}
                  </h3>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                  {activeAssemblyGroup?.direction
                    ? `${activeAssemblyGroup.direction} connection`
                    : "Core stage"}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{activeAssemblyGroup?.summary}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  onClick={() =>
                    setActiveAssemblyStageIndex((currentStageIndex) =>
                      Math.max(0, currentStageIndex - 1),
                    )
                  }
                  disabled={activeAssemblyStageIndex === 0}
                >
                  Previous stage
                </button>
                <button
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                  type="button"
                  onClick={() =>
                    setActiveAssemblyStageIndex((currentStageIndex) =>
                      Math.min(
                        selectedBuildDetail.assemblyGroups.length - 1,
                        currentStageIndex + 1,
                      ),
                    )
                  }
                  disabled={activeAssemblyStageIndex === selectedBuildDetail.assemblyGroups.length - 1}
                >
                  Next stage
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Suggested exact pieces</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                These are the actual detected pieces from your inventory that best fit this stage.
              </p>

              <div className="mt-4 space-y-3">
                {activeStagePieceSuggestions.length > 0 ? (
                  activeStagePieceSuggestions.map((pieceSuggestion, suggestionIndex) => (
                    <PieceReferenceTile
                      key={`${pieceSuggestion.pieceId}-${pieceSuggestion.familyId}-${suggestionIndex}`}
                      pieceId={pieceSuggestion.pieceId}
                      label={pieceSuggestion.label}
                      quantity={pieceSuggestion.quantity}
                      caption={
                        pieceSuggestion.pieceId === "unknown"
                          ? `Missing ${humanizeIdentifier(pieceSuggestion.familyId)}`
                          : `Used for ${humanizeIdentifier(pieceSuggestion.familyId)}`
                      }
                      compact
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-400">
                    No stage suggestions available yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Stage checklist</h3>
              <div className="mt-4 space-y-3">
                {selectedBuildDetail.assemblyGroups.map((group, groupIndex) => (
                  <button
                    key={group.groupId}
                    type="button"
                    onClick={() => setActiveAssemblyStageIndex(groupIndex)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      groupIndex === activeAssemblyStageIndex
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-900/70 hover:border-cyan-400/60"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">
                      Stage {groupIndex + 1}: {group.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{group.summary}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Suspense
              fallback={
                <div className="flex h-[32rem] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950 text-sm text-slate-400">
                  Loading stage viewer...
                </div>
              }
            >
              <LazyBuildThreeViewer
                buildDetail={selectedBuildDetail}
                explodedView={isExplodedView}
                activeStageIndex={activeAssemblyStageIndex}
              />
            </Suspense>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Why this page exists</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                This is a stage-by-stage engineering view. It is not a traditional LEGO booklet,
                but it does show how the chosen build breaks down into practical sub-assemblies.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">ReBrick</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Reuse and rediscover your old LEGO collection.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Put the pieces on a plain background with no overlap. The app checks them, lets you
              fix anything wrong, and then shows build ideas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProgressChip page="scan" currentPage={currentPage} />
            <ProgressChip page="review" currentPage={currentPage} />
            <ProgressChip page="buildIdeas" currentPage={currentPage} />
            <ProgressChip page="assembly" currentPage={currentPage} />
          </div>
        </header>

        {currentPage === "scan" ? renderScanPage() : null}
        {currentPage === "review" ? renderReviewPage() : null}
        {currentPage === "buildIdeas" ? renderBuildIdeasPage() : null}
        {currentPage === "assembly" ? renderAssemblyPage() : null}
      </div>
    </main>
  );
}
