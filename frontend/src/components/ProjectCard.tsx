'use client';

import { ProjectData } from '@/lib/hooks/useContract';
import { formatEth } from '@/lib/campaign';
import { useEffect, useState } from 'react';
import CountdownTimer from './CountdownTimer';
import ProgressBar from './ProgressBar';

interface ProjectCardProps {
  project: ProjectData;
  onContribute: (amount: number) => Promise<void>;
  userContribution: number;
  canContribute: boolean;
}

const STATE_NAMES = ['Fundraising', 'Expired', 'Successful'];
type TransactionStatus = 'idle' | 'pending' | 'confirmed' | 'error';

export default function ProjectCard({
  project,
  onContribute,
  userContribution,
  canContribute,
}: ProjectCardProps) {
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [transactionMessage, setTransactionMessage] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const isFundraising = project.state === 0 && project.deadline * 1000 > now;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 30 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(contributionAmount) < project.minContribution) {
      alert(`Minimum donation is ${project.minContribution} ETH`);
      return;
    }

    setIsSubmitting(true);
    setTransactionStatus('pending');
    setTransactionMessage('Transaction pending...');
    try {
      await onContribute(parseFloat(contributionAmount));
      setContributionAmount('');
      setShowContributeForm(false);
      setTransactionStatus('confirmed');
      setTransactionMessage('Transaction confirmed');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to send contribution';
      setTransactionStatus('error');
      setTransactionMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-md overflow-hidden hover:border-emerald-500/50 hover:shadow-lg transition">
      {project.imageUrl ? (
        <div
          role="img"
          aria-label={project.title}
          className="aspect-[16/9] bg-slate-950 bg-cover bg-center"
          style={{ backgroundImage: `url(${project.imageUrl})` }}
        />
      ) : (
        <div className="aspect-[16/9] bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.30),transparent_35%),linear-gradient(135deg,#0f172a,#020617)]" />
      )}

      {/* Header with state badge */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white">{project.title}</h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isFundraising
                ? 'bg-emerald-500/15 text-emerald-200'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {STATE_NAMES[project.state]}
          </span>
        </div>
        <p className="text-sm text-slate-400 line-clamp-2">
          {project.description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <ProgressBar raised={project.raised} goal={project.goal} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-slate-950/70">
        <div className="text-center">
          <p className="text-xs text-slate-400">Donors</p>
          <p className="text-lg font-bold text-white">
            {project.contributors}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Min Gift</p>
          <p className="text-lg font-bold text-white">
            {formatEth(project.minContribution)} ETH
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Time Left</p>
          <p className="text-lg font-bold text-white">
            <CountdownTimer deadline={project.deadline} />
          </p>
        </div>
      </div>

      {/* User contribution */}
      {userContribution > 0 && (
        <div className="px-6 py-3 bg-emerald-500/10">
          <p className="text-sm text-emerald-200">
            You donated: {userContribution.toFixed(4)} ETH
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 flex gap-2">
        {!showContributeForm && isFundraising && canContribute && (
          <button
            onClick={() => {
              setTransactionStatus('idle');
              setTransactionMessage('');
              setShowContributeForm(true);
            }}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-semibold transition disabled:opacity-50"
          >
            Donate
          </button>
        )}

        {!showContributeForm && isFundraising && !canContribute && (
          <div className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-center text-sm text-slate-300">
            Connect your wallet to donate to this campaign.
          </div>
        )}

        {showContributeForm && (
          <form onSubmit={handleSubmitContribution} className="w-full flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Donation in ETH"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-700 rounded-lg bg-slate-950 text-white placeholder:text-slate-500"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isSubmitting ? 'Pending...' : 'Contribute'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowContributeForm(false);
                setContributionAmount('');
              }}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-200 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {transactionMessage && (
        <div
          className={`mx-6 mb-4 rounded-lg px-3 py-2 text-sm ${
            transactionStatus === 'error'
              ? 'bg-rose-500/10 text-rose-200'
              : transactionStatus === 'confirmed'
                ? 'bg-emerald-500/10 text-emerald-200'
                : 'bg-amber-500/10 text-amber-100'
          }`}
        >
          {transactionMessage}
        </div>
      )}

      {/* Creator info */}
      <div className="px-6 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-400">
          Organizer: <span className="font-mono">{project.creator.slice(0, 6)}...{project.creator.slice(-4)}</span>
        </p>
      </div>
    </div>
  );
}
