import { calculateProgress, formatEth } from '@/lib/campaign';

interface ProgressBarProps {
  raised: number;
  goal: number;
}

export default function ProgressBar({ raised, goal }: ProgressBarProps) {
  const progress = calculateProgress(raised, goal);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-white">
          {formatEth(raised)} ETH / {formatEth(goal)} ETH
        </span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">
          {progress.toFixed(0)}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
