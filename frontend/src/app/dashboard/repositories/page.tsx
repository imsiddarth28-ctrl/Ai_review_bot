"use client";

import { useEffect, useMemo, useState } from 'react';
import { Plus, GitBranch, Search, Settings2, Trash2, Github, AlertCircle } from 'lucide-react';
import { api, Repository } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
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
      
    // Try fetching GitHub repos if linked
    setLoadingGithub(true);
    api.githubRepositories()
      .then(setGithubRepos)
      .catch((err) => {
        // Silently fail if they just aren't connected to github, or show small warning
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
      addNotification(`Successfully connected ${repo_name}`, "success");
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Repositories</h2>
          <p className="mt-1 text-sm text-gray-400">Connect your GitHub repositories to enable automated AI reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: GitHub Integration */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Github className="h-6 w-6 text-white" />
              <h3 className="text-lg font-semibold text-white">Available on GitHub</h3>
            </div>
            
            {loadingGithub ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : githubRepos.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {githubRepos.map(repo => {
                  const isConnected = repositories.some(r => r.owner === repo.owner && r.repo_name === repo.name);
                  return (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={repo.id} 
                      className="glass-panel p-4 rounded-xl flex flex-col space-y-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white truncate">{repo.full_name}</p>
                        {repo.private && <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">Private</span>}
                      </div>
                      <button
                        onClick={() => handleAddRepo(repo.owner, repo.name)}
                        disabled={isSubmitting || isConnected}
                        className={`flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isConnected 
                            ? "bg-green-500/20 text-green-400 cursor-not-allowed" 
                            : "bg-white/10 text-white hover:bg-blue-500 hover:text-white"
                        }`}
                      >
                        {isConnected ? (
                          <><CheckCircle2 className="mr-2 h-4 w-4" /> Connected</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" /> Connect</>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 glass-panel rounded-xl">
                <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-300">No GitHub account linked</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">Link your account in Settings to see your repositories.</p>
                <a href="/dashboard/settings" className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">Go to Settings</a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Connected Repositories */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <h3 className="text-lg font-semibold text-white">Connected Repositories</h3>
              <div className="flex w-full sm:max-w-xs items-center rounded-xl bg-white/5 border border-white/10 px-3 py-2 focus-within:border-white/20">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="text"
                  placeholder="Search connected..."
                  className="ml-2 w-full border-none bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden rounded-xl border border-white/5 bg-black/20">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Repository</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {filteredRepositories.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                          No connected repositories yet. Click Connect on the left to add one.
                        </td>
                      </tr>
                    ) : (
                      filteredRepositories.map((repo) => (
                        <motion.tr 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={repo.id} 
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center">
                              <GitBranch className="h-5 w-5 text-gray-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-white">{repo.owner}/{repo.repo_name}</div>
                                <div className="text-xs text-gray-500 mt-0.5">Added {new Date(repo.created_at).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-400 border border-green-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-2"></span>
                              Active
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button className="mr-4 text-gray-500 hover:text-white transition-colors" aria-label="Settings">
                              <Settings2 className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDelete(repo.id, repo.repo_name)} className="text-gray-500 hover:text-red-400 transition-colors" aria-label="Delete">
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
