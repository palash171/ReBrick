import { DetectionBatch, ScanOverview } from "./types";

export const offlineDetectionBatch: DetectionBatch = {
  imageCount: 3,
  detections: [
    {
      pieceId: "piece_2x4",
      label: "2x4",
      color: "mixed",
      quantity: 15,
      confidence: 0.97,
      reviewOptions: [],
    },
    {
      pieceId: "piece_1x2",
      label: "1x2",
      color: "mixed",
      quantity: 24,
      confidence: 0.94,
      reviewOptions: [],
    },
    {
      pieceId: "piece_round",
      label: "Round",
      color: "mixed",
      quantity: 4,
      confidence: 0.46,
      reviewOptions: [
        {
          pieceId: "piece_round",
          label: "Round",
        },
        {
          pieceId: "piece_1x2",
          label: "1x2",
        },
        {
          pieceId: "piece_2x2",
          label: "2x2",
        },
        {
          pieceId: "unknown",
          label: "Unknown",
        },
      ],
    },
  ],
};

export function buildOfflineDetectionBatch(imageCount: number): DetectionBatch {
  return {
    ...offlineDetectionBatch,
    imageCount,
  };
}

export function buildOfflineScanOverview(detectionBatch: DetectionBatch): ScanOverview {
  const totalEstimatedPieces = detectionBatch.detections.reduce(
    (runningTotal, detection) => runningTotal + detection.quantity,
    0,
  );
  const detectedPieceGroups = detectionBatch.detections.length;
  const lowConfidenceCount = detectionBatch.detections.filter(
    (detection) => detection.confidence < 0.55,
  ).length;
  const averageConfidence =
    detectedPieceGroups > 0
      ? Number(
          (
            detectionBatch.detections.reduce(
              (runningTotal, detection) => runningTotal + detection.confidence,
              0,
            ) / detectedPieceGroups
          ).toFixed(2),
        )
      : 0;

  const colorTotals = detectionBatch.detections.reduce<Record<string, number>>(
    (runningTotals, detection) => ({
      ...runningTotals,
      [detection.color]: (runningTotals[detection.color] ?? 0) + detection.quantity,
    }),
    {},
  );

  const dominantColors = Object.entries(colorTotals)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([color]) => color);

  return {
    profileName: "Offline demo scan",
    totalEstimatedPieces,
    detectedPieceGroups,
    lowConfidenceCount,
    averageConfidence,
    dominantColors: dominantColors.length > 0 ? dominantColors : ["mixed"],
  };
}
