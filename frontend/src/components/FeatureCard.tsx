import { FeatureCardData } from "../types";

interface FeatureCardProps {
  card: FeatureCardData;
}

export function FeatureCard({ card }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/20">
      <h3 className="text-lg font-semibold text-white">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{card.summary}</p>
    </div>
  );
}

