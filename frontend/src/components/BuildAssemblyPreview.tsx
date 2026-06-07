import { BuildDetail } from "../types";
import { humanizeIdentifier } from "../lib/inventory";

interface BuildAssemblyPreviewProps {
  buildDetail: BuildDetail;
}

function formatDirection(direction: string | null) {
  if (!direction) {
    return "core assembly";
  }

  return direction.replace("_", " ");
}

export function BuildAssemblyPreview({ buildDetail }: BuildAssemblyPreviewProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
            Assembly Preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{buildDetail.name}</h2>
        </div>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
          {buildDetail.category}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{buildDetail.viewerStory}</p>

      <div className="mt-6 space-y-4">
        {buildDetail.assemblyGroups.map((group) => (
          <article
            key={group.groupId}
            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{group.summary}</p>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                {formatDirection(group.direction)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(group.requiredFamilies).map(([familyId, quantity]) => (
                <span
                  key={familyId}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-200"
                >
                  {humanizeIdentifier(familyId)} × {quantity}
                </span>
              ))}
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
              {group.connectTo
                ? `Connects to ${humanizeIdentifier(group.connectTo)}`
                : "Core structure group"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
