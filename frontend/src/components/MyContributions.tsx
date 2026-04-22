import { ProjectData } from '@/lib/hooks/useContract';
import { formatEth } from '@/lib/campaign';

interface MyContributionsProps {
  projects: ProjectData[];
  userContributions: Record<string, number>;
}

export default function MyContributions({ projects, userContributions }: MyContributionsProps) {
  const contributedProjects = projects.filter((project) => (userContributions[project.address] || 0) > 0);

  if (contributedProjects.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
        <p className="text-slate-400">No donations found for this wallet yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-800 px-5 py-3 text-sm font-semibold text-slate-300">
        <span>Campaign</span>
        <span>Your donation</span>
      </div>
      {contributedProjects.map((project) => (
        <div
          key={project.address}
          className="grid grid-cols-[1fr_auto] gap-4 border-b border-slate-800 px-5 py-4 last:border-b-0"
        >
          <div>
            <p className="font-semibold text-white">{project.title}</p>
            <p className="mt-1 line-clamp-1 text-sm text-slate-400">{project.description}</p>
          </div>
          <p className="font-mono text-sm font-semibold text-emerald-200">
            {formatEth(userContributions[project.address] || 0)} ETH
          </p>
        </div>
      ))}
    </div>
  );
}
