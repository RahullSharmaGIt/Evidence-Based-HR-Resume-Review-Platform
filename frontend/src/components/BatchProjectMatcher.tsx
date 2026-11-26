"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  matchResumeBatchProjects,
  type BatchProjectMatchResponse,
  type BatchUploadItem,
  type MatchEvidenceItem,
} from "@/lib/api";

interface BatchProjectMatcherProps {
  batchItems: BatchUploadItem[];
}

const SOURCE_LABELS: Record<MatchEvidenceItem["source"], string> = {
  project_name: "Project Title",
  project_description: "Project Description",
  project_url: "Project GitHub URL",
  resume_text: "Resume Text",
};

export function BatchProjectMatcher({ batchItems }: BatchProjectMatcherProps) {
  const [criteria, setCriteria] = useState<string>("");
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<BatchProjectMatchResponse | null>(null);

  const successfulIds = Array.from(
    new Set(
      batchItems
        .filter((item) => item.status === "succeeded" && item.candidateId)
        .map((item) => item.candidateId as string)
    )
  );
  const failedItems = batchItems.filter((item) => item.status !== "succeeded");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    const trimmed = criteria.trim();
    if (trimmed.length < 2) {
      setValidationError("Please enter job description criteria (at least 2 characters).");
      return;
    }
    if (successfulIds.length === 0) {
      setValidationError("No successfully uploaded candidates in this batch to match.");
      return;
    }

    setIsMatching(true);
    try {
      const response = await matchResumeBatchProjects({
        candidateIds: successfulIds,
        criteria: trimmed,
      });
      setMatchResult(response);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to match batch projects.";
      setApiError(msg);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <section
      className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8"
      data-testid="batch-project-matcher"
    >
      <div className="border-b border-slate-100 pb-4 mb-5">
        <h2 className="text-xl font-semibold text-slate-800">
          Match Current Batch Projects Against Job Criteria
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Compare extracted projects from the{" "}
          <strong>{successfulIds.length}</strong> successful resume(s) in this upload batch
          against job-related criteria.
        </p>
      </div>

      {/* Partial or full batch failure notice */}
      {successfulIds.length === 0 ? (
        <div
          role="status"
          className="p-4 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-900"
          data-testid="batch-no-eligible-candidates"
        >
          No candidates in this upload batch succeeded extraction. Upload at least one valid
          PDF/DOCX resume or use the manual entry path before running project matching.
        </div>
      ) : (
        <>
          {failedItems.length > 0 && (
            <div
              role="status"
              className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900"
              data-testid="batch-partial-failure-notice"
            >
              <strong>Partial upload notice:</strong> {successfulIds.length} resume(s) succeeded
              and are included in matching; {failedItems.length} failed file(s) are excluded.
            </div>
          )}

          {/* Decision-support disclaimer */}
          <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 leading-relaxed">
            <strong>Decision Support Only:</strong> Matching uses deterministic text coverage
            against available resume and extracted project text only. It is not proof of skill,
            authorship, or hiring suitability, and requires human HR review.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="job-criteria-input"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Job Description or Hiring Criteria
              </label>
              <textarea
                id="job-criteria-input"
                rows={3}
                value={criteria}
                onChange={(e) => {
                  setCriteria(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isMatching}
                placeholder="e.g., DevOps engineer with practical experience deploying containerized services, CI/CD, and AWS"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-50"
              />
            </div>

            {validationError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700"
              >
                {validationError}
              </div>
            )}

            {apiError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 flex items-center justify-between gap-4"
              >
                <span>{apiError}</span>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="font-semibold text-red-700 hover:underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isMatching}
                aria-busy={isMatching}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMatching ? "Matching Projects..." : "Match Projects Against Criteria"}
              </button>
            </div>
          </form>

          {/* Ranked Results */}
          {matchResult && (() => {
            const results = matchResult.results ?? [];
            const candidatesWithoutProjects = matchResult.candidatesWithoutProjects ?? [];
            return (
            <div className="mt-8 border-t border-slate-200 pt-6 space-y-5" data-testid="batch-match-results">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Ranked Batch Projects ({results.length})
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {matchResult.methodologyNote}
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Evaluated candidates: {matchResult.evaluatedCandidateCount}
                </span>
              </div>

              {/* Extracted criteria terms */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-600 font-medium mr-1">Criteria terms:</span>
                {matchResult.criteriaTerms.map((term) => (
                  <span
                    key={term}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-mono"
                  >
                    {term}
                  </span>
                ))}
              </div>

              {/* Candidates with no extracted projects */}
              {candidatesWithoutProjects.length > 0 && (
                <div
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700"
                  data-testid="candidates-without-projects-notice"
                >
                  <strong>Uploaded without extracted projects:</strong>{" "}
                  {candidatesWithoutProjects.map((c) => c.candidateName).join(", ")}.
                </div>
              )}

              {results.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-md text-sm text-slate-600">
                  No extracted projects were found in the eligible resumes for this batch.
                </div>
              ) : (
                <ol className="space-y-4">
                  {results.map((item, idx) => {
                    const matchedTerms = item.matchedTerms ?? [];
                    const unmatchedTerms = item.unmatchedTerms ?? [];
                    const evidence = item.evidence ?? [];
                    return (
                    <li
                      key={item.projectId}
                      className="border border-slate-200 rounded-lg p-4 bg-white shadow-xs"
                      data-testid={`ranked-project-${idx}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                              #{idx + 1}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-900">
                              {item.projectName}
                            </h4>
                            {item.sourcePage != null && (
                              <span className="text-[11px] font-mono text-slate-500">
                                (Page {item.sourcePage})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            Candidate:{" "}
                            <Link
                              href={`/candidates/${item.candidateId}`}
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {item.candidateName}
                            </Link>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-slate-900">
                            {item.matchScore.toFixed(1)}%
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Criteria evidence signal
                          </div>
                        </div>
                      </div>

                      {item.projectDescription && (
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {item.projectDescription}
                        </p>
                      )}

                      {/* Matched & Unmatched terms */}
                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="font-medium text-slate-700 mr-1.5">Matched:</span>
                          {matchedTerms.length === 0 ? (
                            <span className="text-slate-400 italic">None</span>
                          ) : (
                            <span className="inline-flex flex-wrap gap-1">
                              {matchedTerms.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px]"
                                >
                                  {t}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>

                        {unmatchedTerms.length > 0 && (
                          <div>
                            <span className="font-medium text-slate-700 mr-1.5">
                              No evidence found:
                            </span>
                            <span className="inline-flex flex-wrap gap-1">
                              {unmatchedTerms.map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono text-[11px]"
                                >
                                  {t}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Supporting excerpts */}
                      {evidence.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Supporting Evidence
                          </div>
                          <ul className="space-y-1 text-xs text-slate-700">
                            {evidence.map((ev, evIdx) => (
                              <li key={`${ev.term}-${evIdx}`} className="leading-snug">
                                <span className="font-mono font-semibold text-slate-900">
                                  {ev.term}
                                </span>{" "}
                                <span className="text-slate-500">
                                  [{SOURCE_LABELS[ev.source]}
                                  {ev.sourcePage != null ? ` · p.${ev.sourcePage}` : ""}]:
                                </span>{" "}
                                <span className="italic text-slate-700">&ldquo;{ev.excerpt}&rdquo;</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ol>
              )}

              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                {matchResult.decisionSupportNotice}
              </p>
            </div>
            );
          })()}
        </>
      )}
    </section>
  );
}
