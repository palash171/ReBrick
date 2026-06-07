import { useState } from "react";

import { getPieceReferenceName, pieceCatalog } from "../data/pieceCatalog";
import { PieceReferenceTile } from "./PieceReferenceTile";
import { PieceDetection } from "../types";

interface DetectionReviewCardProps {
  detection: PieceDetection;
  selectedPieceId: string;
  requiresReview: boolean;
  onSelectionChange: (nextPieceId: string) => void;
}

function confidenceStyles(confidence: number) {
  if (confidence >= 0.85) {
    return "bg-emerald-500/15 text-emerald-300";
  }

  if (confidence >= 0.55) {
    return "bg-amber-500/15 text-amber-300";
  }

  return "bg-rose-500/15 text-rose-300";
}

export function DetectionReviewCard({
  detection,
  selectedPieceId,
  requiresReview,
  onSelectionChange,
}: DetectionReviewCardProps) {
  const manualPieceOptions = pieceCatalog.filter(
    (piece) => piece.pieceId !== "unknown" && piece.pieceId.startsWith("piece_"),
  );
  const [manualPieceId, setManualPieceId] = useState(
    manualPieceOptions[0]?.pieceId ?? "piece_2x2",
  );
  const selectedShapeName =
    selectedPieceId === "unknown"
      ? "Skipped for now"
      : getPieceReferenceName(selectedPieceId, detection.label);

  const availableOptions = [
    { pieceId: detection.pieceId, label: detection.label },
    ...detection.reviewOptions.filter(
      (option) => option.pieceId !== detection.pieceId && option.pieceId !== "unknown",
    ),
  ];

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {detection.cropUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-white">
              <img
                src={detection.cropUrl}
                alt="Detected piece crop"
                className="h-24 w-24 object-contain"
              />
            </div>
          ) : (
            <PieceReferenceTile pieceId={selectedPieceId} compact />
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Shape</p>
            <p className="mt-1 text-lg font-semibold text-white">{selectedShapeName}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-200">
            Qty {detection.quantity}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${confidenceStyles(
              detection.confidence,
            )}`}
          >
            {Math.round(detection.confidence * 100)}% certainty
          </span>
        </div>
      </div>

      {requiresReview ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-200">This piece still needs a quick check.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Pick the closest shape below. If none of them fit, choose one from the full list or skip this piece.
          </p>

          <div className="mt-4">
            <span className="text-sm font-medium text-white">Quick matches</span>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {availableOptions.map((option) => (
                <PieceReferenceTile
                  key={option.pieceId}
                  pieceId={option.pieceId}
                  label={option.label}
                  caption="Click to confirm"
                  selectable
                  selected={selectedPieceId === option.pieceId}
                  onClick={() => onSelectionChange(option.pieceId)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
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

            <button
              type="button"
              onClick={() => onSelectionChange(manualPieceId)}
              className="rounded-full border border-cyan-500/40 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
            >
              Use selected piece
            </button>

            <button
              type="button"
              onClick={() => onSelectionChange("unknown")}
              className="rounded-full border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:text-white"
            >
              Skip piece
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          High-certainty match. No action needed right now.
        </div>
      )}
    </article>
  );
}
