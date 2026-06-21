"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, GitBranch, Search, Settings2, Trash2 } from 'lucide-react';
import { api, Repository } from '@/lib/api';

export default function Repositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [owner, setOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.repositories()
      .then(setRepositories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load repositories'));
  }, []);

  const filteredRepositories = useMemo(() => {
    const search = query.toLowerCase();
    return repositories.filter((repo) => `${repo.owner}/${repo.repo_name}`.toLowerCase().includes(search));
  }, [query, repositories]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const repo = await api.createRepository({ owner, repo_name: repoName, provider: 'github' });
      setRepositories((current) => [repo, ...current]);
      setOwner('');
      setRepoName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add repository');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError('');

    try {
      await api.deleteRepository(id);
      setRepositories((current) => current.filter((repo) => repo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete repository');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Repositories</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <input
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          required
          placeholder="Owner or organization"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={repoName}
          onChange={(event) => setRepoName(event.target.value)}
          required
          placeholder="Repository name"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          disabled={isSubmitting}
          className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Adding...' : 'Add Repository'}
        </button>
      </form>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center space-x-4">
        <div className="flex w-full max-w-md items-center rounded-md border border-gray-300 bg-white px-3 py-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            type="text"
            placeholder="Search repositories..."
            className="ml-2 w-full border-none bg-transparent text-sm text-gray-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Repository</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRepositories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No repositories yet. Add one above to connect the dashboard.
                </td>
              </tr>
            ) : (
              filteredRepositories.map((repo) => (
                <tr key={repo.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{repo.owner}/{repo.repo_name}</div>
                    <div className="text-sm text-gray-500">Added {new Date(repo.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <GitBranch className="mr-2 h-5 w-5 text-gray-700" />
                      <span className="text-sm text-gray-900">{repo.provider}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button className="mr-3 text-gray-400 hover:text-gray-900" aria-label="Repository settings">
                      <Settings2 className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(repo.id)} className="text-red-400 hover:text-red-600" aria-label="Delete repository">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
