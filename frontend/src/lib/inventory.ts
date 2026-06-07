import { buildTemplates } from "../data/buildTemplates";
import {
  getPieceDefinition,
  getPieceDisplayLabel,
  pieceCatalog,
  pieceToFamilyMap,
} from "../data/pieceCatalog";
import {
  BuildIdea,
  Category,
  DetectionBatch,
  InventoryMap,
  MissingRequirement,
  BuildIdeaResponse,
} from "../types";

const LOW_CONFIDENCE_THRESHOLD = 0.55;
const UNKNOWN_PIECE_ID = "unknown";

export function isLowConfidence(confidence: number) {
  return confidence < LOW_CONFIDENCE_THRESHOLD;
}

export function countLowConfidenceDetections(batch: DetectionBatch | null) {
  if (!batch) {
    return 0;
  }

  return batch.detections.filter((detection) => isLowConfidence(detection.confidence)).length;
}

export function humanizeIdentifier(identifier: string) {
  return identifier
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolvePieceId(
  detectionIndex: number,
  defaultPieceId: string,
  defaultConfidence: number,
  reviewSelections: Record<number, string>,
) {
  if (reviewSelections[detectionIndex]) {
    return reviewSelections[detectionIndex];
  }

  return isLowConfidence(defaultConfidence) ? UNKNOWN_PIECE_ID : defaultPieceId;
}

export function buildCorrectedInventory(
  batch: DetectionBatch | null,
  reviewSelections: Record<number, string>,
): InventoryMap {
  if (!batch) {
    return {};
  }

  return batch.detections.reduce<InventoryMap>((inventory, detection, detectionIndex) => {
    const resolvedPieceId = resolvePieceId(
      detectionIndex,
      detection.pieceId,
      detection.confidence,
      reviewSelections,
    );

    if (resolvedPieceId === UNKNOWN_PIECE_ID) {
      return inventory;
    }

    return {
      ...inventory,
      [resolvedPieceId]: (inventory[resolvedPieceId] ?? 0) + detection.quantity,
    };
  }, {});
}

export function buildPieceLabelLookup(batch: DetectionBatch | null) {
  const initialLabels = pieceCatalog.reduce<Record<string, string>>(
    (labels, piece) => ({
      ...labels,
      [piece.pieceId]: piece.label,
    }),
    {},
  );

  if (!batch) {
    return initialLabels;
  }

  return batch.detections.reduce<Record<string, string>>((labels, detection) => {
    const nextLabels = {
      ...labels,
      [detection.pieceId]: detection.label,
    };

    return detection.reviewOptions.reduce<Record<string, string>>(
      (reviewOptionLabels, option) => ({
        ...reviewOptionLabels,
        [option.pieceId]: option.label,
      }),
      nextLabels,
    );
  }, initialLabels);
}

export function mergeInventoryMaps(
  baseInventory: InventoryMap,
  extraInventory: InventoryMap,
): InventoryMap {
  return Object.entries(extraInventory).reduce<InventoryMap>((mergedInventory, [pieceId, quantity]) => {
    const nextQuantity = (mergedInventory[pieceId] ?? 0) + quantity;

    if (nextQuantity > 0) {
      return {
        ...mergedInventory,
        [pieceId]: nextQuantity,
      };
    }

    const nextInventory = { ...mergedInventory };
    delete nextInventory[pieceId];
    return nextInventory;
  }, { ...baseInventory });
}

export interface SuggestedStagePiece {
  pieceId: string;
  label: string;
  quantity: number;
  familyId: string;
}

export function buildStagePieceSuggestions(
  rawInventory: InventoryMap,
  requiredFamilies: Record<string, number>,
): SuggestedStagePiece[] {
  const suggestions: SuggestedStagePiece[] = [];

  Object.entries(requiredFamilies).forEach(([familyId, requiredQuantity]) => {
    let remainingQuantity = requiredQuantity;

    const candidatePieces = Object.entries(rawInventory)
      .filter(([pieceId, quantity]) => quantity > 0 && pieceToFamilyMap[pieceId] === familyId)
      .sort((left, right) => right[1] - left[1]);

    candidatePieces.forEach(([pieceId, availableQuantity]) => {
      if (remainingQuantity <= 0) {
        return;
      }

      const assignedQuantity = Math.min(availableQuantity, remainingQuantity);
      remainingQuantity -= assignedQuantity;

      suggestions.push({
        pieceId,
        label: getPieceDisplayLabel(pieceId),
        quantity: assignedQuantity,
        familyId,
      });
    });

    if (remainingQuantity > 0) {
      suggestions.push({
        pieceId: "unknown",
        label: getPieceDefinition("unknown")?.label ?? "Unknown",
        quantity: remainingQuantity,
        familyId,
      });
    }
  });

  return suggestions;
}

function normalizeInventory(rawInventory: InventoryMap): InventoryMap {
  return Object.entries(rawInventory).reduce<InventoryMap>((familyInventory, [pieceId, quantity]) => {
    const familyId = pieceToFamilyMap[pieceId] ?? "unknown_piece";

    return {
      ...familyInventory,
      [familyId]: (familyInventory[familyId] ?? 0) + quantity,
    };
  }, {});
}

function scoreBuildTemplate(
  template: (typeof buildTemplates)[number],
  familyInventory: InventoryMap,
): BuildIdea {
  let matchedTotal = 0;
  let requiredTotal = 0;
  const matchedFamilies: Record<string, number> = {};
  const missingFamilies: MissingRequirement[] = [];

  for (const [familyId, requiredQuantity] of Object.entries(template.requiredFamilies)) {
    const availableQuantity = familyInventory[familyId] ?? 0;
    const matchedQuantity = Math.min(availableQuantity, requiredQuantity);

    matchedFamilies[familyId] = matchedQuantity;
    matchedTotal += matchedQuantity;
    requiredTotal += requiredQuantity;

    if (availableQuantity < requiredQuantity) {
      missingFamilies.push({
        familyId,
        shortBy: requiredQuantity - availableQuantity,
      });
    }
  }

  return {
    buildId: template.buildId,
    name: template.name,
    category: template.category,
    description: template.description,
    compatibilityScore: Number((matchedTotal / requiredTotal).toFixed(2)),
    matchedFamilies,
    missingFamilies,
    tags: template.tags,
  };
}

export function buildOfflineBuildIdeaResponse(
  rawInventory: InventoryMap,
  category?: Category,
): BuildIdeaResponse {
  const normalizedInventory = normalizeInventory(rawInventory);

  const buildIdeas = buildTemplates
    .filter((template) => !category || template.category === category)
    .map((template) => scoreBuildTemplate(template, normalizedInventory))
    .sort(
      (left, right) =>
        right.compatibilityScore - left.compatibilityScore ||
        left.missingFamilies.length - right.missingFamilies.length,
    );

  return {
    normalizedInventory,
    buildIdeas,
  };
}
