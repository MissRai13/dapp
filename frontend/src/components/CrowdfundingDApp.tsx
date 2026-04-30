'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@/lib/hooks/useWallet';
import { useContract, ProjectData } from '@/lib/hooks/useContract';
import { DEPLOYED_CHAIN_ID, formatAddress, getReadBlockNumber, getReadProviderConfigError } from '@/lib/web3';
import { formatEth } from '@/lib/campaign';
import ProjectCard from './ProjectCard';
import CreateProjectForm from './CreateProjectForm';
import MyContributions from './MyContributions';

type CampaignFilter = 'all' | 'active' | 'completed';
type DashboardView = 'campaigns' | 'contributions';

export default function CrowdfundingDApp() {
  const { account, isConnected, isCorrectNet, connectWallet, disconnectWallet, isLoading: walletLoading, error: walletError } =
    useWallet();
  const { fetchAllProjects, contributeToProject, getUserContribution, error: contractError } =
    useContract();

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const rpcConfigError = getReadProviderConfigError();
  const [dashboardView, setDashboardView] = useState<DashboardView>('campaigns');
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardNow, setDashboardNow] = useState(() => Date.now());
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalFunded: 0,
    totalContributions: 0,
  });
  const [userContributions, setUserContributions] = useState<Record<string, number>>({});
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [localChainNotice, setLocalChainNotice] = useState<string | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDashboardNow(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const allProjects = await fetchAllProjects();
      const blockNumber = await getReadBlockNumber();
      setProjects(allProjects);

      if (DEPLOYED_CHAIN_ID === 31337 && allProjects.length === 0 && typeof blockNumber === 'number' && blockNumber <= 2) {
        setLocalChainNotice(
          'Your local Hardhat network looks freshly reset, so older campaigns from a previous node session will not appear here. Keep the same node running, or recreate the campaigns after restarting the local chain.'
        );
      } else {
        setLocalChainNotice(null);
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      const activeProjects = allProjects.filter((project) => project.state === 0 && project.deadline > nowInSeconds).length;
      const totalFunded = allProjects.reduce((total, project) => total + project.raised, 0);

      if (account) {
        const contributionEntries = await Promise.all(
          allProjects.map(async (project) => {
            const contribution = await getUserContribution(project.address, account);
            return [project.address, contribution] as const;
          })
        );
        const contributions = Object.fromEntries(contributionEntries);
        const totalContributions = contributionEntries.reduce((total, [, contribution]) => total + contribution, 0);

        setUserContributions(contributions);
        setStats({ totalProjects: allProjects.length, activeProjects, totalFunded, totalContributions });
      } else {
        setUserContributions({});
        setStats({ totalProjects: allProjects.length, activeProjects, totalFunded, totalContributions: 0 });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }, [account, fetchAllProjects, getUserContribution]);

  // Load projects on mount and whenever the active account changes.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProjects();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProjects]);

  const handleContributeToProject = async (projectAddress: string, amount: number) => {
    try {
      await contributeToProject(projectAddress, amount);
      // Reload projects to update stats
      await loadProjects();
    } catch (error) {
      throw error;
    }
  };

  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const nowInSeconds = Math.floor(dashboardNow / 1000);

    return projects.filter((project) => {
      const matchesSearch = project.title.toLowerCase().includes(normalizedSearch);
      const isActive = project.state === 0 && project.deadline > nowInSeconds;
      const matchesFilter =
        campaignFilter === 'all' ||
        (campaignFilter === 'active' && isActive) ||
        (campaignFilter === 'completed' && !isActive);

      return matchesSearch && matchesFilter;
    });
  }, [campaignFilter, dashboardNow, projects, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-950/95 shadow-lg shadow-slate-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-slate-950 font-bold">C</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                CrowdFund Charity
              </h1>
            </div>

            {/* Network Warning */}
            {isConnected && !isCorrectNet && (
              <div className="text-sm px-3 py-1 bg-amber-200 text-amber-950 rounded-lg">
                Wrong Network
              </div>
            )}

            {/* Wallet Button */}
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <p className="text-sm text-slate-300">
                    {formatAddress(account!)}
                  </p>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-lg font-medium transition"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={walletLoading}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-semibold transition shadow-md disabled:opacity-50"
              >
                {walletLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!isConnected && (
          <div className="mb-12 rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] px-6 py-14 text-center shadow-2xl shadow-slate-950/40 sm:px-10">
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              Fund Real Causes With On-Chain Transparency
            </h2>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-slate-300">
              Explore live campaigns without connecting first, then connect your wallet when
              you are ready to create a fundraiser or donate.
            </p>
            <button
              onClick={connectWallet}
              disabled={walletLoading}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-lg rounded-lg font-semibold transition shadow-lg shadow-emerald-950/30 disabled:opacity-50"
            >
              {walletLoading ? 'Connecting...' : 'Connect Wallet to Start Giving'}
            </button>
          </div>
        )}

        <div>
          <h2 className="mb-8 text-3xl font-bold text-white">
            {isConnected ? 'Giving Dashboard' : 'Campaign Explorer'}
          </h2>

          {contractError && (
            <div className="mb-6 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {contractError}
            </div>
          )}

          {walletError && (
            <div className="mb-6 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {walletError}
            </div>
          )}

          {rpcConfigError && (
            <div className="mb-6 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {rpcConfigError} The app will fall back to your wallet provider, but campaign
              loading and confirmation may be slower until this is fixed.
            </div>
          )}

          {localChainNotice && (
            <div className="mb-6 rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              {localChainNotice}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-md">
              <p className="text-slate-400 text-sm mb-2">Total Campaigns</p>
              <p className="text-3xl font-bold text-emerald-300">
                {isLoadingProjects ? '-' : stats.totalProjects}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-md">
              <p className="text-slate-400 text-sm mb-2">Active Fundraisers</p>
              <p className="text-3xl font-bold text-emerald-300">
                {isLoadingProjects ? '-' : stats.activeProjects}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-md">
              <p className="text-slate-400 text-sm mb-2">Raised for Causes</p>
              <p className="text-3xl font-bold text-emerald-300">
                {isLoadingProjects ? '-' : formatEth(stats.totalFunded)} ETH
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-md">
              <p className="text-slate-400 text-sm mb-2">Your Donations</p>
              <p className="text-3xl font-bold text-emerald-300">
                {isLoadingProjects ? '-' : formatEth(stats.totalContributions)} ETH
              </p>
              {!isConnected && (
                <p className="mt-2 text-xs text-slate-500">Connect your wallet to see personal totals.</p>
              )}
            </div>
          </div>

          {isConnected ? (
            <CreateProjectForm onSuccess={loadProjects} />
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-6 text-center">
              <h3 className="text-xl font-semibold text-white">Ready to launch a fundraiser?</h3>
              <p className="mt-2 text-sm text-slate-300">
                Your wallet is already optional for browsing, but you will need to connect it to
                create campaigns and donate.
              </p>
              <button
                onClick={connectWallet}
                disabled={walletLoading}
                className="mt-4 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {walletLoading ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </div>
          )}

          <div className="mt-12">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h3 className="text-2xl font-bold text-white">
                Campaigns
              </h3>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                  <button
                    onClick={() => setDashboardView('campaigns')}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      dashboardView === 'campaigns' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    All Campaigns
                  </button>
                  <button
                    onClick={() => setDashboardView('contributions')}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      dashboardView === 'contributions' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    My Contributions
                  </button>
                </div>
                <button
                  onClick={loadProjects}
                  disabled={isLoadingProjects}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {isLoadingProjects ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {isLoadingProjects ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Loading fundraisers...</p>
              </div>
            ) : dashboardView === 'contributions' && !isConnected ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
                <p className="text-slate-300">Connect your wallet to see only the campaigns you have supported.</p>
              </div>
            ) : dashboardView === 'contributions' ? (
              <MyContributions projects={projects} userContributions={userContributions} />
            ) : projects.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
                <p className="text-slate-400">
                  No fundraisers are on this network yet.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search campaigns by title"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  />
                  <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                    {(['all', 'active', 'completed'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCampaignFilter(filter)}
                        className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition ${
                          campaignFilter === filter
                            ? 'bg-slate-100 text-slate-950'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
                    <p className="text-slate-400">No campaigns match your search or filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                      <ProjectCard
                        key={project.address}
                        project={project}
                        userContribution={userContributions[project.address] || 0}
                        canContribute={isConnected}
                        onContribute={(amount) =>
                          handleContributeToProject(project.address, amount)
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
