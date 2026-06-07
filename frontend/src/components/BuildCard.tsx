import { BuildIdea } from "../types";
import { humanizeIdentifier } from "../lib/inventory";

interface BuildCardProps {
  buildIdea: BuildIdea;
  formatScore: (score: number) => string;
  isSelected?: boolean;
  onSelect?: (buildId: string) => void;
}

export function BuildCard({
  buildIdea,
  formatScore,
  isSelected = false,
  onSelect,
}: BuildCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        isSelected
          ? "border-cyan-400 bg-slate-950/80"
          : "border-slate-800 bg-slate-950/60"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{buildIdea.name}</h3>
          <p className="mt-1 text-sm capitalize text-cyan-300">{buildIdea.category}</p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-medium text-emerald-300">
          {formatScore(buildIdea.compatibilityScore)}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">{buildIdea.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {buildIdea.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100"
          >
            {tag}
          </span>
        ))}
      </div>

      {onSelect ? (
        <button
          className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
          type="button"
          onClick={() => onSelect(buildIdea.buildId)}
        >
          {isSelected ? "Preview selected" : "Show preview"}
        </button>
      ) : null}

      {buildIdea.missingFamilies.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-100">Missing piece families</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {buildIdea.missingFamilies.map((missingFamily) => (
              <li key={missingFamily.familyId}>
                {humanizeIdentifier(missingFamily.familyId)} short by {missingFamily.shortBy}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          Full match. This build is completely supported by the current inventory.
        </div>
      )}
    </article>
  );
}
