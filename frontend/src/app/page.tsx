"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  GitPullRequest, 
  MessageSquare, 
  Terminal, 
  ShieldCheck, 
  Activity, 
  ArrowRight, 
  CheckCircle,
  Copy,
  Check,
  Bot,
  Zap,
  Code,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'chat' | 'security'>('review');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`git commit -m "feat(auth): add OAuth2 provider authentication"`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-black selection:bg-black selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="h-6 w-6 rounded-md bg-black text-white flex items-center justify-center font-bold text-sm">R</span>
            <span className="text-base font-bold tracking-tight text-black">ReviewCodeBot</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-500">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-black transition-colors">How it Works</a>
            <a href="#showcase" className="hover:text-black transition-colors">Workspace Demo</a>
          </nav>

          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-4 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-2xs"
              >
                Go to Dashboard
                <ArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-black px-4 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors shadow-2xs"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Hero text */}
            <div className="space-y-6 lg:col-span-5 text-center lg:text-left">
              <div className="inline-flex items-center space-x-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-black" />
                <span>Now with Real-World Developer Tools</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-black leading-none">
                AI-Powered Code Reviews <span className="underline decoration-wavy decoration-neutral-300">in Seconds</span>.
              </h1>
              <p className="text-base text-neutral-500 md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                ReviewCodeBot automatically scans your Pull Requests for security bugs, performance leaks, and logic errors. Discuss findings side-by-side with an interactive AI coding assistant.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link 
                  href={isLoggedIn ? "/dashboard" : "/register"}
                  className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors shadow-sm"
                >
                  {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a 
                  href="#showcase"
                  className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-xl border border-neutral-200 px-6 text-sm font-semibold text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
                >
                  See Interactive Demo
                </a>
              </div>

              {/* Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-xs text-neutral-400 font-medium">
                <span className="flex items-center"><CheckCircle className="mr-1.5 h-3.5 w-3.5 text-black" /> GitHub OAuth Connect</span>
                <span className="flex items-center"><CheckCircle className="mr-1.5 h-3.5 w-3.5 text-black" /> OWASP Security Scans</span>
                <span className="flex items-center"><CheckCircle className="mr-1.5 h-3.5 w-3.5 text-black" /> Zero Config Required</span>
              </div>
            </div>

            {/* Hero Simulated Dashboard Mockup */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                {/* Header bar of mockup */}
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 bg-neutral-50/50 rounded-t-xl">
                  <div className="flex space-x-1.5">
                    <span className="h-3 w-3 rounded-full bg-neutral-200" />
                    <span className="h-3 w-3 rounded-full bg-neutral-200" />
                    <span className="h-3 w-3 rounded-full bg-neutral-200" />
                  </div>
                  <div className="rounded-md border border-neutral-200 px-3 py-1 text-[10px] font-mono text-neutral-400 bg-white">
                    reviewcodebot.com/dashboard/chat
                  </div>
                  <div className="w-8" />
                </div>

                {/* Main area of mockup */}
                <div className="grid grid-cols-12 h-[340px] bg-white divide-x divide-neutral-100 rounded-b-xl overflow-hidden">
                  
                  {/* Mock Sidebar (Left) */}
                  <div className="col-span-3 p-3 space-y-3 bg-neutral-50/30">
                    <div className="h-4 w-12 bg-neutral-200 rounded" />
                    <div className="space-y-2">
                      <div className="p-2 rounded border border-neutral-200 bg-white shadow-2xs space-y-1.5">
                        <div className="h-2 w-14 bg-neutral-200 rounded" />
                        <div className="h-3 w-20 bg-neutral-900 rounded" />
                      </div>
                      <div className="p-2 rounded border border-transparent space-y-1.5">
                        <div className="h-2 w-10 bg-neutral-200 rounded" />
                        <div className="h-3 w-16 bg-neutral-300 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Mock Chat Viewport (Center) */}
                  <div className="col-span-6 p-4 flex flex-col justify-between h-full bg-white">
                    <div className="space-y-3">
                      {/* AI bubble */}
                      <div className="flex space-x-2">
                        <span className="h-6 w-6 rounded-full bg-neutral-100 border flex items-center justify-center text-[10px] font-bold">AI</span>
                        <div className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-[10px] space-y-1.5 max-w-[85%]">
                          <p className="font-semibold text-black">Vulnerability Flagged:</p>
                          <p className="text-neutral-500">Found hardcoded API Key at line 14 of `auth.ts`. Risk of token leakage.</p>
                        </div>
                      </div>
                      {/* User bubble */}
                      <div className="flex justify-end space-x-2">
                        <div className="p-2.5 rounded-xl bg-black text-white text-[10px] max-w-[80%]">
                          How do I refactor this to load from environment variables safely?
                        </div>
                      </div>
                    </div>

                    {/* Chat input box */}
                    <div className="border border-neutral-200 rounded-lg p-2 flex items-center bg-white">
                      <div className="text-[10px] text-neutral-400 flex-1">Ask AI about code changes...</div>
                      <span className="h-5 w-5 bg-black text-white rounded flex items-center justify-center text-[10px]">↵</span>
                    </div>
                  </div>

                  {/* Mock Code Diff (Right) */}
                  <div className="col-span-3 p-3 bg-neutral-50/10 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-neutral-200 rounded" />
                      <div className="font-mono text-[8px] space-y-1 p-1.5 bg-neutral-50 border rounded text-neutral-400">
                        <p className="text-red-500">- const KEY = "sec_123";</p>
                        <p className="text-green-500">+ const KEY = process.env.KEY;</p>
                      </div>
                    </div>
                    
                    {/* Severity statistics card */}
                    <div className="border border-neutral-200 bg-white rounded-lg p-2 shadow-2xs space-y-1">
                      <div className="h-2 w-16 bg-neutral-200 rounded" />
                      <div className="flex justify-between items-center text-[9px] pt-1">
                        <span className="text-red-500 font-semibold">1 Critical</span>
                        <span className="text-green-500 font-medium">Clean</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Developer Features Section */}
      <section id="features" className="border-t border-neutral-100 bg-neutral-50/30 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Solve Real-World Developer Problems
            </h2>
            <p className="text-base text-neutral-500 leading-relaxed">
              We built ReviewCodeBot to integrate directly into your daily development cycle, cutting down administrative work and code quality worries.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: GitPullRequest,
                title: "Automated PR Reviews",
                desc: "No more waiting. Connect your GitHub repos and let the bot review your pull requests the moment they are opened, giving immediate feedback."
              },
              {
                icon: ShieldCheck,
                title: "Vulnerability Scanning",
                desc: "Scans code updates for OWASP vulnerabilities, injection bugs, hardcoded secrets, and XSS dangers, preventing exploits before merge."
              },
              {
                icon: MessageSquare,
                title: "Interactive Workspace Chat",
                desc: "Don't just read reports. Toggle a side-by-side view with the AI assistant to investigate code errors, ask for refactors, and get direct guidance."
              },
              {
                icon: Terminal,
                title: "Automated PR Changelogs",
                desc: "Generate professional GitHub-ready pull request descriptions automatically based on your review findings, saving minutes on every PR."
              },
              {
                icon: Code,
                title: "Conventional Commit Drafts",
                desc: "Struggling to write good git logs? Draft standardized Conventional Commit messages from your changes in a single click."
              },
              {
                icon: Activity,
                title: "Trend Analytics Dashboard",
                desc: "Track issues found, PR statuses, and repository health over time using Recharts area charts to monitor team code improvement."
              }
            ].map((feature, i) => (
              <div key={i} className="border border-neutral-200 bg-white rounded-2xl p-6 hover:border-black transition-all hover:shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-center text-black">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-black">{feature.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Showcase Section */}
      <section id="showcase" className="py-20 lg:py-28 bg-white border-t border-neutral-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Live Workspace Demo</span>
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Take Control of Your Review Process
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Explore how our interactive dashboard handles code reviews, AI discussions, and developer utilities in real-time.
            </p>

            {/* Tab switch buttons */}
            <div className="flex justify-center p-1 rounded-xl border border-neutral-200 max-w-md mx-auto bg-neutral-50/50 mt-8">
              {(['review', 'chat', 'security'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    activeTab === tab 
                      ? "bg-black text-white shadow-2xs" 
                      : "text-neutral-500 hover:text-black"
                  )}
                >
                  {tab === 'review' && '1. Code Review'}
                  {tab === 'chat' && '2. AI Workspace'}
                  {tab === 'security' && '3. Developer Tools'}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive view container */}
          <div className="border border-neutral-200 rounded-2xl bg-white shadow-lg overflow-hidden max-w-4xl mx-auto">
            {/* Widget Header */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-yellow-400" />
                <span className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-mono text-neutral-400">ReviewWorkspaceDemo.tsx</span>
            </div>

            {/* Widget Body */}
            <div className="p-6 md:p-8 min-h-[380px] flex flex-col justify-between">
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-400">imsiddarth28-ctrl/Ai_review_bot</span>
                      <h4 className="text-base font-bold text-black mt-0.5">PR #12: Fix database query bottleneck</h4>
                    </div>
                    <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-md font-medium">
                      3 issues found
                    </span>
                  </div>

                  <div className="border border-neutral-200 rounded-xl bg-neutral-50/30 p-4 font-mono text-xs text-neutral-700 space-y-3 leading-relaxed">
                    <p className="font-semibold text-black border-b border-neutral-200 pb-2">AI Review Summary:</p>
                    <p className="text-red-600 font-semibold">⚠️ [HIGH] SQL Injection risk in `users.py` at line 42.</p>
                    <p className="pl-4">Query string is concatenated directly with user inputs. Use parameterized queries.</p>
                    <p className="text-yellow-600 font-semibold">⚠️ [MEDIUM] Unindexed foreign key query in `transactions.py` at line 105.</p>
                    <p className="pl-4">This query runs on every load and will slow down response times as rows scale.</p>
                  </div>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="space-y-4">
                  {/* AI Bubble */}
                  <div className="flex space-x-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-100 border flex items-center justify-center text-xs font-bold shadow-2xs">AI</div>
                    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-black max-w-[80%] space-y-2">
                      <p className="font-semibold">Here is the parameterized SQL query for `users.py`:</p>
                      <pre className="p-2 bg-white border border-neutral-200 rounded-lg font-mono text-[10px] text-neutral-600">
                        {`# Safe parameterized query\ncursor.execute(\n  "SELECT * FROM users WHERE email = %s",\n  (email_input,)\n)`}
                      </pre>
                    </div>
                  </div>

                  {/* User Bubble */}
                  <div className="flex justify-end space-x-3">
                    <div className="bg-black text-white rounded-2xl px-4 py-2.5 text-xs max-w-[70%]">
                      Looks perfect, I will implement this now!
                    </div>
                    <div className="h-8 w-8 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold shadow-2xs">U</div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-black">Real-World Developer Toolbox</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">Instant tasks generated contextually from PR #12 findings.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1 */}
                    <div className="border border-neutral-200 bg-neutral-50/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black">GitHub PR Description</span>
                        <span className="text-[10px] text-neutral-400 font-medium">Copy-paste ready</span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">Summarizes changes, files modified, and issues refactored into a markdown template.</p>
                      <button 
                        type="button" 
                        onClick={() => alert("Mock Action: PR Description generated in AI chat!")}
                        className="inline-flex items-center text-xs text-black font-semibold hover:underline cursor-pointer"
                      >
                        Run Generator <ArrowRight className="ml-1 h-3 w-3" />
                      </button>
                    </div>

                    {/* Card 2 */}
                    <div className="border border-neutral-200 bg-neutral-50/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-black">Conventional Commits</span>
                        <button 
                          type="button" 
                          onClick={handleCopyCode}
                          className="text-neutral-400 hover:text-black transition-colors"
                          title="Copy commit message"
                        >
                          {copiedCode ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed font-mono bg-white p-2 border rounded text-neutral-600">
                        {`feat(auth): fix SQL injection vulnerability in users login query`}
                      </p>
                      <p className="text-[10px] text-neutral-400">Click icon to copy conventional commit format.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom footer button of widget */}
              <div className="border-t border-neutral-100 pt-4 flex justify-between items-center text-xs text-neutral-400 mt-6">
                <span>Want to see it in action on your repository?</span>
                <Link 
                  href={isLoggedIn ? "/dashboard" : "/register"} 
                  className="text-black font-semibold hover:underline flex items-center"
                >
                  Create free account <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-neutral-50/30 border-t border-neutral-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Connect in 3 Simple Steps
            </h2>
            <p className="text-base text-neutral-500 leading-relaxed">
              ReviewCodeBot integrates into your workflow in less than 2 minutes without disturbing your staging environment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Authorize & Connect",
                desc: "Sign in with GitHub and select the repositories you want to enable. We configure the webhook automatically."
              },
              {
                step: "02",
                title: "Open a Pull Request",
                desc: "Write your code and push to a branch. The moment you open a PR, ReviewCodeBot triggers an automated scan."
              },
              {
                step: "03",
                title: "Refactor with Chat",
                desc: "Inspect the review summary. Chat directly with the AI assistant in the workspace to fix critical issues and merge safely."
              }
            ].map((step, idx) => (
              <div key={idx} className="relative p-6 border border-neutral-200 bg-white rounded-2xl space-y-4 shadow-2xs">
                <span className="text-3xl font-extrabold text-neutral-200 font-mono block">{step.step}</span>
                <h3 className="text-base font-bold text-black">{step.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer banner */}
      <section className="bg-black text-white py-16 lg:py-20 text-center">
        <div className="mx-auto max-w-4xl px-6 space-y-6">
          <Zap className="h-10 w-10 text-white mx-auto animate-bounce" />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Upgrade Your Team's Code Quality Today
          </h2>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Connect your repositories for free, trigger your first automated review, and experience the real-world developer toolbox.
          </p>
          <div className="pt-4">
            <Link 
              href={isLoggedIn ? "/dashboard" : "/register"} 
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-8 text-sm font-semibold text-black hover:bg-neutral-100 transition-colors shadow-sm"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-neutral-400">
          <div className="flex items-center space-x-2">
            <span className="h-5 w-5 rounded bg-black text-white flex items-center justify-center font-bold text-xs">R</span>
            <span className="font-semibold text-black">ReviewCodeBot</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div className="flex space-x-6">
            <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-black transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
