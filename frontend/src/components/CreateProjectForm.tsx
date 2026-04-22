'use client';

import { useState } from 'react';
import { useContract } from '@/lib/hooks/useContract';
import { serializeCampaignDescription } from '@/lib/campaign';

interface CreateProjectFormProps {
  onSuccess: () => void;
}

export default function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const { createProject, isLoading } = useContract();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    minContribution: '0.1',
    targetAmount: '1',
    deadlineDays: '30',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please add a cause name and fundraiser story');
      return;
    }

    const minContrib = parseFloat(formData.minContribution);
    const target = parseFloat(formData.targetAmount);
    const days = parseInt(formData.deadlineDays);

    if (minContrib <= 0 || target <= 0 || days <= 0) {
      alert('Please enter valid donation amounts and campaign duration');
      return;
    }

    if (target < minContrib) {
      alert('Fundraising goal must be greater than the minimum donation');
      return;
    }

    try {
      await createProject(
        formData.title,
        serializeCampaignDescription(formData.description, formData.imageUrl),
        minContrib,
        target,
        days
      );
      alert('Fundraiser launched successfully!');
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        minContribution: '0.1',
        targetAmount: '1',
        deadlineDays: '30',
      });
      setShowForm(false);
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to launch fundraiser';
      alert(`Error: ${message}`);
    }
  };

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/30">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Start a Charity Fundraiser
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-wide text-emerald-300">
              New donation campaign
            </p>
            <h3 className="text-2xl font-bold text-white">Launch a Charity Fundraiser</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Share the cause, set a transparent ETH goal, and invite donors to support a
              meaningful campaign on-chain.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Cause Name
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Emergency meals for flood-affected families"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-400">
              Use a clear, human name donors can understand at a glance.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Fundraiser Story
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Explain who will be helped, why support is needed, and how donations will be used."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-400">
              Build trust with specific needs, expected impact, and stewardship details.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Campaign Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/cause-photo.jpg"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-400">
              Add a real image that helps donors recognize the cause.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Minimum Donation (ETH)
              </label>
              <input
                type="number"
                name="minContribution"
                step="0.01"
                value={formData.minContribution}
                onChange={handleInputChange}
                placeholder="0.1"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-slate-400">
                The smallest ETH amount a donor can give.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Fundraising Goal (ETH)
              </label>
              <input
                type="number"
                name="targetAmount"
                step="0.1"
                value={formData.targetAmount}
                onChange={handleInputChange}
                placeholder="1"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-slate-400">
                The total amount needed to fund this cause.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Campaign Duration (Days)
            </label>
            <input
              type="number"
              name="deadlineDays"
              value={formData.deadlineDays}
              onChange={handleInputChange}
              min="1"
              placeholder="30"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-400">
              Choose how long donors can contribute before the campaign closes.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Launching fundraiser...' : 'Launch Fundraiser'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-slate-600 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
