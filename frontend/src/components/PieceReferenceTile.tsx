import { getPieceDefinition, getPieceReferenceName } from "../data/pieceCatalog";

interface PieceReferenceTileProps {
  pieceId: string;
  label?: string;
  quantity?: number;
  caption?: string;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

function buildPreviewDimensions(pieceId: string) {
  const piece = getPieceDefinition(pieceId);
  const studsX = piece?.studsX ?? 2;
  const studsY = piece?.studsY ?? 2;

  return {
    width: `${Math.max(56, studsX * 16 + 20)}px`,
    height: `${Math.max(34, studsY * 16 + 12)}px`,
    gridTemplateColumns: `repeat(${studsX}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${studsY}, minmax(0, 1fr))`,
  };
}

function previewSurfaceClass(pieceId: string) {
  const shape = getPieceDefinition(pieceId)?.shape ?? "unknown";

  switch (shape) {
    case "plate":
      return "bg-slate-500";
    case "tile":
      return "bg-slate-300";
    case "slope":
      return "bg-slate-500";
    case "wheel":
      return "bg-slate-900";
    case "hinge":
      return "bg-slate-600";
    case "technic":
      return "bg-slate-700";
    case "unknown":
      return "bg-slate-700";
    default:
      return "bg-slate-600";
  }
}

function PieceGlyph({ pieceId, compact = false }: { pieceId: string; compact?: boolean }) {
  const piece = getPieceDefinition(pieceId);
  const dimensions = buildPreviewDimensions(pieceId);
  const shape = piece?.shape ?? "unknown";

  if (shape === "wheel") {
    return (
      <div className="flex h-16 w-20 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/70">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-[6px] border-slate-800 bg-slate-500">
          <div className="h-3.5 w-3.5 rounded-full bg-slate-950" />
        </div>
      </div>
    );
  }

  if (shape === "technic") {
    return (
      <div className="flex h-16 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/70">
        <div className="flex h-6 w-16 items-center justify-around rounded-full bg-slate-700 px-2">
          {[0, 1, 2].map((holeIndex) => (
            <div key={holeIndex} className="h-2.5 w-2.5 rounded-full bg-slate-950" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-16 w-24 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/70">
      <div
        className={`relative rounded-xl px-2 py-1 shadow-inner ${previewSurfaceClass(pieceId)} ${
          shape === "slope" ? "overflow-hidden" : ""
        } ${compact ? "scale-90" : ""}`}
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {shape === "slope" ? (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700 via-slate-600 to-slate-300" />
        ) : null}

        {shape === "hinge" ? (
          <>
            <div className="absolute inset-y-1 left-[47%] w-[3px] rounded-full bg-slate-900/70" />
            <div className="absolute inset-y-1 left-1 right-[52%] rounded-lg bg-slate-600" />
            <div className="absolute inset-y-1 left-[52%] right-1 rounded-lg bg-slate-500" />
          </>
        ) : null}

        {shape !== "tile" ? (
          <div
            className="relative z-10 grid h-full w-full gap-1 p-1"
            style={{
              gridTemplateColumns: dimensions.gridTemplateColumns,
              gridTemplateRows: dimensions.gridTemplateRows,
            }}
          >
            {Array.from({ length: (piece?.studsX ?? 2) * (piece?.studsY ?? 2) }).map(
              (_stud, studIndex) => (
                <div
                  key={studIndex}
                  className={`rounded-full ${
                    shape === "slope" ? "bg-slate-200/50" : "bg-slate-100/70"
                  }`}
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PieceReferenceTile({
  pieceId,
  label,
  quantity,
  caption,
  compact = false,
  selectable = false,
  selected = false,
  onClick,
}: PieceReferenceTileProps) {
  const primaryLabel = getPieceReferenceName(pieceId, label);
  const secondaryLabel = label && label !== primaryLabel ? label : null;
  const containerClasses = selectable
    ? selected
      ? "border-cyan-400 bg-cyan-500/10"
      : "border-slate-700 bg-slate-950/60 hover:border-cyan-400/60"
    : "border-slate-800 bg-slate-950/60";

  const content = (
    <div className={`rounded-2xl border p-3 transition ${containerClasses}`}>
      <div className="flex items-center gap-3">
        <PieceGlyph pieceId={pieceId} compact={compact} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{primaryLabel}</p>
          {secondaryLabel ? <p className="mt-1 text-xs text-slate-400">{secondaryLabel}</p> : null}
          {caption ? <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{caption}</p> : null}
        </div>
        {typeof quantity === "number" ? (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
            × {quantity}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (selectable && onClick) {
    return (
      <button type="button" className="w-full text-left" onClick={onClick}>
        {content}
      </button>
    );
  }

  return content;
}
