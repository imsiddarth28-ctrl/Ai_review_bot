"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus, GitBranch, Search, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Github } from '@/components/Icons';
import { api, Repository } from '@/lib/api';
import { useNotification } from '@/components/Notifications';

export default function Repositories() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    api.repositories()
      .then(setRepositories)
      .catch((err) => addNotification(err instanceof Error ? err.message : 'Unable to load repositories', 'error'));
      
    setLoadingGithub(true);
    api.githubRepositories()
      .then(setGithubRepos)
      .catch((err) => {
        console.log("GitHub repos not loaded:", err.message);
      })
      .finally(() => setLoadingGithub(false));
  }, [addNotification]);

  const filteredRepositories = useMemo(() => {
    const search = query.toLowerCase();
    return repositories.filter((repo) => `${repo.owner}/${repo.repo_name}`.toLowerCase().includes(search));
  }, [query, repositories]);

  async function handleAddRepo(owner: string, repo_name: string) {
    if (repositories.some(r => r.owner === owner && r.repo_name === repo_name)) {
      addNotification("Repository already connected", "info");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const repo = await api.createRepository({ owner, repo_name, provider: 'github' });
      setRepositories((current) => [repo, ...current]);
      addNotification(`Connected ${repo_name}`, "success");
    } catch (err) {
      addNotification(err instanceof Error ? err.message : 'Unable to connect repository', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string, repo_name: string) {
    try {
      await api.deleteRepository(id);
      setRepositories((current) => current.filter((repo) => repo.id !== id));
      addNotification(`Disconnected ${repo_name}`, "success");
    } catch (err) {
      addNotification(err instanceof Error ? err.message : 'Unable to disconnect repository', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-black">Repositories</h2>
        <p className="mt-0.5 text-sm text-neutral-500">Connect GitHub repositories for automated AI reviews.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* GitHub repos */}
        <div className="border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Github className="h-4 w-4 text-black" />
            <h3 className="text-sm font-medium text-black">GitHub</h3>
          </div>
          
          {loadingGithub ? (
            <div className="flex justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
            </div>
          ) : githubRepos.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {githubRepos.map(repo => {
                const isConnected = repositories.some(r => r.owner === repo.owner && r.repo_name === repo.name);
                return (
                  <div key={repo.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-neutral-100 hover:border-neutral-300 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{repo.full_name}</p>
                      {repo.private && <span className="text-[10px] uppercase tracking-wider text-neutral-400">Private</span>}
                    </div>
                    <button
                      onClick={() => handleAddRepo(repo.owner, repo.name)}
                      disabled={isSubmitting || isConnected}
                      className={`flex-shrink-0 ml-2 text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                        isConnected 
                          ? "text-neutral-400 cursor-not-allowed" 
                          : "border border-black text-black hover:bg-black hover:text-white"
                      }`}
                    >
                      {isConnected ? '✓' : '+'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="mx-auto h-6 w-6 text-neutral-300 mb-2" />
              <p className="text-sm text-neutral-500">No GitHub account linked</p>
              <a href="/dashboard/settings" className="inline-block mt-3 text-xs font-medium text-black underline">Go to Settings</a>
            </div>
          )}
        </div>

        {/* Connected repos */}
        <div className="lg:col-span-2 border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-black">Connected</h3>
            <div className="flex w-full max-w-xs items-center rounded-lg border border-neutral-200 px-3 py-1.5 ml-4 transition-colors focus-within:border-black">
              <Search className="h-3.5 w-3.5 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="text"
                placeholder="Filter..."
                className="ml-2 w-full border-none bg-transparent text-sm text-black placeholder-neutral-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {filteredRepositories.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">No repositories connected yet.</p>
            ) : (
              filteredRepositories.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center min-w-0">
                    <GitBranch className="h-4 w-4 text-neutral-300 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-black truncate">{repo.owner}/{repo.repo_name}</p>
                      <p className="text-xs text-neutral-400">{new Date(repo.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(repo.id, repo.repo_name)} className="text-neutral-300 hover:text-black transition-colors flex-shrink-0 ml-4">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
