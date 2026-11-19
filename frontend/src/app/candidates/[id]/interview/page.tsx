"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clipboard,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  ApiClientError,
  generateProjectVivaQuestions,
  getCandidate,
  getProjectVivaQuestions,
  type CandidateDetailResponse,
  type VivaQuestionsResponse,
} from "@/lib/api";

interface InterviewPageProps {
  params: Promise<{ id: string }>;
}

const categoryStyles: Record<string, string> = {
  "Architecture & Design": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Implementation Details": "bg-blue-50 text-blue-700 border-blue-200",
  "Edge Cases & Failure Modes": "bg-amber-50 text-amber-800 border-amber-200",
  "Security & Trade-offs": "bg-violet-50 text-violet-700 border-violet-200",
  "Testing & Evolution": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function InterviewPage({ params }: InterviewPageProps) {
  const { id: candidateId } = use(params);
  const [candidate, setCandidate] = useState<CandidateDetailResponse | null>(null);
  const [viva, setViva] = useState<VivaQuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setCandidate(null);
      setViva(null);
      setError(null);
      try {
        const detail = await getCandidate(candidateId);
        if (!active) return;
        setCandidate(detail);
        if (detail.selectedProjectId) {
          try {
            const cached = await getProjectVivaQuestions(detail.selectedProjectId);
            if (active) {
              setViva(cached);
              setExpanded(new Set([1]));
            }
          } catch (err) {
            if (!(err instanceof ApiClientError && err.status === 404) && active) {
              setError(err instanceof Error ? err.message : "Could not load viva questions.");
            }
          }
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load this candidate.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [candidateId]);

  const selectedProjectId = candidate?.selectedProjectId;
  const selectedProject = candidate?.projects?.find((project) => project.id === selectedProjectId);

  async function generate(forceRefresh = false) {
    if (!selectedProjectId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateProjectVivaQuestions(selectedProjectId, forceRefresh);
      setViva(result);
      setExpanded(new Set([1]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate viva questions.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleQuestion(questionId: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  async function copyQuestion(questionId: number, question: string) {
    try {
      await navigator.clipboard.writeText(question);
      setCopiedId(questionId);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  }

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="min-h-dvh bg-slate-50 flex items-center justify-center p-8 text-sm text-slate-500">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin motion-reduce:animate-none text-slate-700" aria-hidden="true" />
        Loading project viva...
      </div>
    );
  }

  if (!candidate) {
    return (
      <main className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-sm font-medium text-slate-800">{error || "Candidate not found or deleted."}</p>
        <Link href="/" className="text-xs font-semibold text-slate-900 underline hover:text-slate-700">Return to all candidates</Link>
      </main>
    );
  }

  const allExpanded = Boolean(viva && expanded.size === viva.questions.length);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={`/candidates/${candidate.id}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 motion-reduce:transition-none"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Candidate review
          </Link>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Project viva
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
              Candidate project questions
            </div>
            <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Project viva</h1>
            <p className="mt-2 text-sm text-slate-600">
              {candidate.name} <span className="mx-1 text-slate-300">/</span>{" "}
              {selectedProject?.name || viva?.projectTitle || "No project selected"}
            </p>
          </div>
          {viva && (
            <button
              type="button"
              onClick={() => generate(true)}
              disabled={generating || !selectedProjectId}
              aria-busy={generating}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              Regenerate questions
            </button>
          )}
        </section>

        {error && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="min-h-11 shrink-0 cursor-pointer rounded-md px-2 text-xs font-semibold text-red-700 hover:bg-red-100 hover:underline active:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600">Dismiss</button>
          </div>
        )}

        {!selectedProjectId ? (
          <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
            <h2 className="text-base font-semibold text-slate-900">Select a project to prepare its viva</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Choose one of the candidate&apos;s extracted projects first. A GitHub repository is optional; questions can start from the project description and declared technologies.</p>
            <Link href={`/candidates/${candidate.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 motion-reduce:transition-none">Select project</Link>
          </section>
        ) : !viva ? (
          <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs sm:p-10">
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">Generate questions from the selected project</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Get ten technical prompts with benchmark answers, positive signals, and warning signs. Repository evidence adds code-specific context when available.</p>
              <button
                type="button"
                onClick={() => generate()}
                disabled={generating}
                aria-busy={generating}
                className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-slate-800 active:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 motion-reduce:transition-none disabled:cursor-wait disabled:opacity-60"
              >
                {generating ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
                {generating ? "Generating questions..." : "Generate viva questions"}
              </button>
              <p className="mt-3 text-xs text-slate-500">Uses project details and available repository analysis. No GitHub account is required.</p>
            </div>
          </section>
        ) : (
          <>
            <section className="mb-5 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3.5 text-sm text-blue-950 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="leading-6">Questions are grounded in available project evidence. Benchmark answers guide review; they are not a candidate score.</p>
                <span className="shrink-0 rounded-full border border-blue-200 bg-white/70 px-2.5 py-1 text-xs font-medium text-blue-800">
                  {viva.source === "gemini" ? "AI generated" : "Generated from project details"}
                </span>
              </div>
            </section>

            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">{viva.questions.length} questions</h2>
              <button
                type="button"
                onClick={() => setExpanded(allExpanded ? new Set() : new Set(viva.questions.map((question) => question.id)))}
                aria-expanded={allExpanded}
                aria-controls="viva-question-list"
                aria-label={`${allExpanded ? "Collapse" : "Expand"} all ${viva.questions.length} questions`}
                className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-xs transition hover:border-blue-200 hover:bg-blue-50 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 motion-reduce:transition-none"
              >
                <ChevronDown className={`h-4 w-4 transition-transform motion-reduce:transition-none ${allExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                {allExpanded ? "Collapse all" : "Expand all"}
              </button>
            </div>

            <span className="sr-only" role="status" aria-live="polite">
              {copiedId ? `Question ${copiedId} copied to clipboard.` : ""}
            </span>

            <div id="viva-question-list" className="space-y-3">
              {viva.questions.map((question) => {
                const isExpanded = expanded.has(question.id);
                const isCopied = copiedId === question.id;
                return (
                  <article key={question.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-start gap-3 px-3 py-3 sm:px-4">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold tabular-nums text-slate-600">{String(question.id).padStart(2, "0")}</span>
                      <h3 className="min-w-0 flex-1 text-base font-normal">
                        <button
                          type="button"
                          id={`viva-question-trigger-${question.id}`}
                          aria-expanded={isExpanded}
                          aria-controls={`viva-question-panel-${question.id}`}
                          onClick={() => toggleQuestion(question.id)}
                          className="group w-full cursor-pointer rounded-lg py-1 text-left active:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${categoryStyles[question.category] || "bg-slate-50 text-slate-700 border-slate-200"}`}>{question.category}</span>
                              <span className="mt-2 block text-base font-semibold leading-7 text-slate-900 transition-colors group-hover:text-blue-800 motion-reduce:transition-none">{question.question}</span>
                            </span>
                            <ChevronDown className={`mt-4 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:text-blue-700 motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                          </span>
                        </button>
                      </h3>
                      <button
                        type="button"
                        aria-label={isCopied ? `Question ${question.id} copied` : `Copy question ${question.id}`}
                        title={isCopied ? "Copied" : "Copy question"}
                        onClick={() => copyQuestion(question.id, question.question)}
                        className="mt-0.5 inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent px-2 text-slate-600 transition hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 motion-reduce:transition-none sm:min-w-[5.25rem]"
                      >
                        {isCopied ? <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : <Clipboard className="h-4 w-4" aria-hidden="true" />}
                        <span className="hidden text-xs font-medium sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div
                      id={`viva-question-panel-${question.id}`}
                      hidden={!isExpanded}
                      className="border-t border-slate-100 bg-slate-50/70 px-4 py-5 sm:px-5 sm:pl-[4.25rem]"
                    >
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Benchmark answer</h4>
                        <p className="mt-2 text-base leading-7 text-slate-700">{question.expectedAnswer}</p>
                      </div>
                      <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-700">Positive signals</h4>
                          <ul className="mt-2 space-y-2">
                            {question.keySignals.map((signal) => <li key={signal} className="flex gap-2 text-sm leading-5 text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{signal}</li>)}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-rose-700">Warning signs</h4>
                          <ul className="mt-2 space-y-2">
                            {question.redFlags.map((flag) => <li key={flag} className="flex gap-2 text-sm leading-5 text-slate-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />{flag}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
