"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Code2,
  FileCode2,
  GitBranch,
  GraduationCap,
  Info,
  LayoutDashboard,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import styles from "./proof-card.module.css";

type Mode = "candidate" | "recruiter";
type Confidence = "High" | "Medium" | "Early";

type Claim = {
  skill: string;
  confidence: Confidence;
  tags: string[];
  evidence: string[];
};

type ProofCandidate = {
  id: string;
  name: string;
  initials: string;
  headline: string;
  location: string;
  assessment: number;
  coverage: number;
  project: string | null;
  repo: string | null;
  repoInfo: {
    languages: string[];
    commits: number;
    span: string;
    milestones: number;
    comparison: string;
    comparisonConfidence: Confidence;
    timeline: { week: string; title: string; detail: string }[];
  } | null;
  claims: Claim[];
};

// shortcut: preview records stand in for IMATS responses until its sandbox contract is available.
const candidates: ProofCandidate[] = [
  {
    id: "aditi",
    name: "Aditi Rao",
    initials: "AR",
    headline: "Frontend developer · graduating 2027",
    location: "Pune, India",
    assessment: 86,
    coverage: 76,
    project: "OpenShelf",
    repo: "github.com/aditirao/openshelf",
    repoInfo: {
      languages: ["React", "TypeScript"], commits: 19, span: "five weeks", milestones: 3,
      comparison: "No close match found", comparisonConfidence: "Early",
      timeline: [
        { week: "WEEK 1", title: "First working list", detail: "Books loaded from a local data file." },
        { week: "WEEK 3", title: "Added filters", detail: "Search and category state introduced." },
        { week: "WEEK 5", title: "Saved items + tests", detail: "Added persistence and request failure cases." },
      ],
    },
    claims: [
      {
        skill: "React",
        confidence: "High",
        tags: ["react", "frontend", "javascript"],
        evidence: [
          "Practical assessment: built a filtered list and loading state · 91/100",
          "OpenShelf: added persistent filters in commit 9a3d1f2",
        ],
      },
      {
        skill: "TypeScript",
        confidence: "Medium",
        tags: ["typescript", "frontend"],
        evidence: [
          "Shared Book type is used across six modules",
          "Assessment: typed API response task · 8/10 checks passed",
        ],
      },
      {
        skill: "API testing",
        confidence: "Medium",
        tags: ["api testing", "testing", "api"],
        evidence: [
          "Assessment: 7 of 8 integration cases passed",
          "Repo includes empty, loading, and failed request states",
        ],
      },
      {
        skill: "Accessibility",
        confidence: "Early",
        tags: ["accessibility", "a11y", "frontend"],
        evidence: ["One labeled dialog found; keyboard flow has not been assessed"],
      },
    ],
  },
  {
    id: "leena",
    name: "Leena Das",
    initials: "LD",
    headline: "Software developer · graduating 2027",
    location: "Kolkata, India",
    assessment: 81,
    coverage: 58,
    project: null,
    repo: null,
    repoInfo: null,
    claims: [
      {
        skill: "JavaScript",
        confidence: "High",
        tags: ["javascript", "frontend"],
        evidence: ["Practical assessment: interactive form and validation · 89/100"],
      },
      {
        skill: "React",
        confidence: "Medium",
        tags: ["react", "frontend", "javascript"],
        evidence: ["Practical assessment: component state and event handling · 8/10 checks"],
      },
      {
        skill: "Accessibility",
        confidence: "Medium",
        tags: ["accessibility", "a11y", "frontend"],
        evidence: ["Assessment: keyboard navigation and field labels verified"],
      },
      {
        skill: "Testing",
        confidence: "Early",
        tags: ["testing", "api testing"],
        evidence: ["No test artifact submitted yet"],
      },
    ],
  },
  {
    id: "kabir",
    name: "Kabir Nair",
    initials: "KN",
    headline: "Backend developer · graduating 2026",
    location: "Kochi, India",
    assessment: 84,
    coverage: 82,
    project: "QueueKit",
    repo: "github.com/kabirnair/queuekit",
    repoInfo: {
      languages: ["Python", "FastAPI"], commits: 17, span: "six weeks", milestones: 3,
      comparison: "Partial starter overlap", comparisonConfidence: "Medium",
      timeline: [
        { week: "WEEK 1", title: "Basic queue", detail: "Added an in-memory work queue." },
        { week: "WEEK 3", title: "Retry behavior", detail: "Introduced bounded retries and status tracking." },
        { week: "WEEK 6", title: "Persistence + tests", detail: "Added migrations and worker failure cases." },
      ],
    },
    claims: [
      {
        skill: "Python",
        confidence: "High",
        tags: ["python", "backend"],
        evidence: ["Practical assessment: queue worker and retry task · 88/100", "QueueKit: 17 commits across six weeks"],
      },
      {
        skill: "FastAPI",
        confidence: "Medium",
        tags: ["fastapi", "api", "backend"],
        evidence: ["QueueKit exposes typed request and response models", "Assessment: endpoint validation · 8/10 checks"],
      },
      {
        skill: "SQL",
        confidence: "Medium",
        tags: ["sql", "database"],
        evidence: ["Added pagination and a migration after the first working version"],
      },
      {
        skill: "API testing",
        confidence: "Early",
        tags: ["api testing", "testing", "api"],
        evidence: ["Only two endpoint cases are present in the inspected test folder"],
      },
    ],
  },
];

const requirements = [
  { label: "React", terms: ["react", "next.js", "nextjs"] },
  { label: "TypeScript", terms: ["typescript", "type script"] },
  { label: "API testing", terms: ["api testing", "api tests", "integration tests"] },
  { label: "Accessibility", terms: ["accessibility", "a11y", "keyboard navigation"] },
  { label: "Performance", terms: ["performance", "web vitals"] },
  { label: "JavaScript", terms: ["javascript"] },
  { label: "Python", terms: ["python"] },
  { label: "FastAPI", terms: ["fastapi"] },
  { label: "SQL", terms: ["sql", "database"] },
  { label: "Testing", terms: ["test coverage", "unit tests", "test suite"] },
];

const startingDescription =
  "Junior frontend engineer. React and TypeScript, API testing, accessibility, and attention to performance.";

const vivaQuestions = [
  {
    file: "src/hooks/usePersistedQuery.ts",
    question: "This hook writes the query to localStorage. What happens if the stored value is malformed, and how would you make this safer?",
  },
  {
    file: "src/components/BookFilters.tsx · commit 9a3d1f2",
    question: "You added a filter after the first version. How did you decide which state belongs in the URL and which stays local?",
  },
  {
    file: "tests/books-api.test.ts",
    question: "One test covers a failed request. What should the user see, and which part of that behavior would you test next?",
  },
];

const assessmentVivaQuestions = [
  { file: "Practical assessment · form validation", question: "In your form task, what should happen when the input is blank or invalid? How would you make that behavior clear to someone using a keyboard?" },
  { file: "Practical assessment · interactive state", question: "You kept the form state in a component. What would make you move that state higher in the tree?" },
  { file: "Practical assessment · follow-up", question: "If this form called a slow API, how would you show loading, success, and failure without losing the user's input?" },
];

const queueVivaQuestions = [
  { file: "src/worker/retry.py · commit 7bc42d1", question: "How did you choose the retry limit in this worker, and what should happen after the final attempt?" },
  { file: "src/api/jobs.py", question: "The endpoint returns a job identifier before work finishes. Why use that flow, and how would a client check progress?" },
  { file: "tests/test_worker_failures.py", question: "Which failure case would you add next to these worker tests, and what behavior should it protect?" },
];

function getMatch(candidate: ProofCandidate, description: string) {
  const text = description.toLowerCase();
  const requested = requirements.filter((item) => item.terms.some((term) => text.includes(term)));
  if (!requested.length) return { score: null, found: [] as Claim[], requested: [] as string[], matched: [] as string[] };

  const matches = requested.flatMap((item) => {
    const claim = candidate.claims.find((entry) => entry.tags.some((tag) => item.terms.includes(tag) || item.label.toLowerCase() === tag));
    return claim ? [{ label: item.label, claim }] : [];
  });
  const unique = matches.map(({ claim }) => claim).filter((claim, index, list) => list.findIndex((entry) => entry.skill === claim.skill) === index);
  return {
    score: Math.round((matches.length / requested.length) * 100),
    found: unique,
    requested: requested.map((item) => item.label),
    matched: matches.map(({ label }) => label),
  };
}

function ConfidenceTag({ level }: { level: Confidence }) {
  return <span className={`${styles.confidence} ${styles[`confidence${level}`]}`}>{level} confidence</span>;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className={styles.modalHead}>
          <h2 id="modal-title">{title}</h2>
          <button className={styles.iconButton} onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function ProofCardPage() {
  const [mode, setMode] = useState<Mode>("recruiter");
  const [selectedId, setSelectedId] = useState("aditi");
  const [description, setDescription] = useState(startingDescription);
  const [vivaOpen, setVivaOpen] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [vivaAnswers, setVivaAnswers] = useState<string[]>([]);
  const [vivaComplete, setVivaComplete] = useState(false);
  const [workSampleOpen, setWorkSampleOpen] = useState(false);
  const [workSampleStarted, setWorkSampleStarted] = useState(false);
  const [workAnswer, setWorkAnswer] = useState("");
  const [workSampleComplete, setWorkSampleComplete] = useState(false);

  const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];
  const selectedMatch = getMatch(selected, description);
  const questions = selectedId === "kabir" ? queueVivaQuestions : selectedId === "leena" ? assessmentVivaQuestions : vivaQuestions;
  const ranked = useMemo(
    () => candidates
      .map((candidate) => ({ candidate, match: getMatch(candidate, description) }))
      .sort((a, b) => (b.match.score ?? -1) - (a.match.score ?? -1)),
    [description],
  );

  const submitVivaAnswer = () => {
    if (!answer.trim()) return;
    setVivaAnswers((previous) => [...previous, answer.trim()]);
    setAnswer("");
    if (questionIndex === questions.length - 1) {
      setVivaComplete(true);
      setVivaOpen(false);
    } else {
      setQuestionIndex((index) => index + 1);
    }
  };

  const submitWorkSample = () => {
    if (!workAnswer.trim()) return;
    setWorkSampleComplete(true);
    setWorkSampleOpen(false);
  };

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <Link href="/proof-card" className={styles.brand} aria-label="Proof home">
          <span className={styles.brandMark}><Sparkles size={17} fill="currentColor" /></span>
          <span>proof<span className={styles.brandDot}>.</span></span>
        </Link>
        <div className={styles.workspaceLabel}>WORKSPACE</div>
        <nav className={styles.sideNav} aria-label="Main navigation">
          <button className={mode === "candidate" ? `${styles.navItem} ${styles.navActive}` : styles.navItem} onClick={() => setMode("candidate")}>
            <LayoutDashboard size={17} /> My proof card
          </button>
          <button className={mode === "recruiter" ? `${styles.navItem} ${styles.navActive}` : styles.navItem} onClick={() => setMode("recruiter")}>
            <Target size={17} /> Role matching <span className={styles.navCount}>03</span>
          </button>
          <button className={styles.navItem} onClick={() => { setMode("candidate"); setWorkSampleOpen(true); }}>
            <BookOpen size={17} /> No GitHub? Start here
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.sandboxIcon}><ShieldCheck size={17} /></div>
          <div>
            <div className={styles.sidebarBottomTitle}>Sandbox preview</div>
            <div className={styles.sidebarBottomNote}>Sample profiles · no live data</div>
          </div>
          <span className={styles.onlineDot} aria-label="Preview mode" />
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>Workspace</span><span className={styles.crumbSlash}>/</span><strong>{mode === "recruiter" ? "Role matching" : "My proof card"}</strong></div>
          <div className={styles.topbarRight}>
            <span className={styles.previewBadge}><span /> Sandbox preview</span>
            <span className={styles.helpButton} title="Confidence describes evidence strength, not hiring suitability"><CircleHelp size={18} /></span>
              <button className={styles.userAvatar} onClick={() => setMode("candidate")} aria-label={`Open ${selected.name}'s candidate view`}>{selected.initials}</button>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.eyebrow}>EVIDENCE-LED HIRING <span className={styles.eyebrowLine} /></div>
              <h1>{mode === "recruiter" ? "Find the proof behind the potential." : "Your work has a signal."}</h1>
              <p>{mode === "recruiter" ? "Compare evidence against the work you need done, with reasons you can inspect." : "Build a skill profile from what you can show, explain, and keep improving."}</p>
            </div>
            <div className={styles.modeSwitch} role="group" aria-label="Choose a view">
              <button aria-pressed={mode === "recruiter"} className={mode === "recruiter" ? styles.modeSelected : ""} onClick={() => setMode("recruiter")}>Recruiter view</button>
              <button aria-pressed={mode === "candidate"} className={mode === "candidate" ? styles.modeSelected : ""} onClick={() => setMode("candidate")}>Candidate view</button>
            </div>
          </div>

          {mode === "recruiter" ? (
            <>
              <section className={styles.roleCard}>
                <div className={styles.roleTopline}>
                  <div className={styles.roleIcon}><BriefcaseBusiness size={18} /></div>
                  <div className={styles.roleTitleGroup}>
                    <span className={styles.sectionEyebrow}>ROLE BRIEF</span>
                    <h2>Role requirements <span className={styles.roleMeta}>· Entry level</span></h2>
                  </div>
                  <span className={styles.roleEdit}><span className={styles.liveDot} /> Editable brief</span>
                </div>
                <label className={styles.srOnly} htmlFor="job-description">Job description</label>
                <textarea id="job-description" className={styles.jobDescription} value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
                <div className={styles.roleFoot}>
                  <span><Info size={14} /> Fit uses named skills with linked evidence. It does not use college or CGPA.</span>
                  <span className={styles.updating}><Sparkles size={13} /> Updates as you edit</span>
                </div>
              </section>

              <div className={styles.summaryRow}>
                <div><span className={styles.metricLabel}>PROFILES IN THIS VIEW</span><strong>03</strong></div>
                <div className={styles.summaryRule} />
                <div><span className={styles.metricLabel}>EVIDENCE SOURCES</span><strong><span className={styles.metricAccent}>03</span> <small>assessment · project · viva</small></strong></div>
                <div className={styles.summaryRight}><span className={styles.scopePill}><ShieldCheck size={13} /> Human review stays in control</span></div>
              </div>

              <div className={styles.recruiterGrid}>
                <section className={styles.panel} aria-labelledby="ranked-title">
                  <div className={styles.panelHeading}>
                    <div><h2 id="ranked-title">Evidence fit</h2><p>Ranked by matched requirements and inspectable signals</p></div>
                    <span className={styles.filterButton}><Search size={15} /> All profiles</span>
                  </div>
                  {!selectedMatch.requested.length && (
                    <p className={styles.emptyHint}>Add a named skill such as React, Python, or API testing to compare this role.</p>
                  )}
                  <div className={styles.candidateList}>
                    {ranked.map(({ candidate, match }, index) => (
                      <button key={candidate.id} className={`${styles.candidateRow} ${candidate.id === selectedId ? styles.candidateSelected : ""}`} onClick={() => { setSelectedId(candidate.id); setVivaComplete(false); setQuestionIndex(0); }}>
                        <span className={`${styles.rank} ${index === 0 ? styles.rankFirst : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                        <span className={`${styles.candidateAvatar} ${styles[`avatar${candidate.id}`]}`}>{candidate.initials}</span>
                        <span className={styles.candidateIdentity}>
                          <strong>{candidate.name}</strong>
                          <small>{candidate.headline}</small>
                          {candidate.repo ? <small className={styles.repoLine}><GitBranch size={11} /> Project evidence attached</small> : <small className={styles.noRepoLine}><Sparkles size={11} /> Assessment-first proof path</small>}
                        </span>
                        <span className={styles.rowScore}><strong>{match.score === null ? "—" : `${match.score}%`}</strong><small>evidence fit</small></span>
                        <span className={styles.rowArrow}><ArrowRight size={16} /></span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.panelFoot}><Info size={14} /> Fit is requirement coverage, not a hiring recommendation.</div>
                </section>

                <section className={`${styles.panel} ${styles.detailPanel}`}>
                  <div className={styles.profileHero}>
                    <div className={`${styles.profileAvatar} ${styles[`avatar${selected.id}`]}`}>{selected.initials}</div>
                    <div className={styles.profileName}>
                      <div className={styles.verifiedLabel}><span className={styles.liveDot} /> PROOF CARD <span className={styles.demoTag}>SAMPLE</span></div>
                      <h2>{selected.name}</h2>
                      <p>{selected.headline} <span>· {selected.location}</span></p>
                    </div>
                  </div>

                  <div className={styles.profileMetrics}>
                    <div><span className={styles.metricLabel}>PRACTICAL ASSESSMENT</span><strong>{selected.assessment}<small>/100</small></strong></div>
                    <div className={styles.metricDivider} />
                    <div><span className={styles.metricLabel}>ROLE EVIDENCE FIT</span><strong>{selectedMatch.score === null ? "—" : `${selectedMatch.score}%`}</strong></div>
                    <div className={styles.metricDivider} />
                    <div><span className={styles.metricLabel}>PROJECT EVIDENCE</span><strong className={styles.projectStat}>{selected.repo ? "Available" : "Not needed"}</strong></div>
                  </div>

                  <div className={styles.matchReason}>
                    <div><Target size={14} /><strong>Why this fit</strong></div>
                    {selectedMatch.requested.length ? <><p>{selectedMatch.matched.length} of {selectedMatch.requested.length} named requirements have a linked skill claim.</p><div className={styles.requirementTags}>{selectedMatch.requested.map((requirement) => <span key={requirement} className={selectedMatch.matched.includes(requirement) ? styles.requirementMet : styles.requirementMissing}>{selectedMatch.matched.includes(requirement) ? <Check size={10} /> : <X size={10} />}{requirement}</span>)}</div></> : <p>Add named skills to this role brief to see requirement coverage.</p>}
                  </div>

                  <div className={styles.claimHeader}><h3>Skills with evidence</h3><span>{selected.claims.length} claims</span></div>
                  <div className={styles.claimList}>
                    {selected.claims.map((claim) => (
                      <article className={styles.claimRow} key={claim.skill}>
                        <div className={styles.claimName}><span className={styles.claimCheck}><Check size={13} /></span><strong>{claim.skill}</strong></div>
                        <ConfidenceTag level={claim.confidence} />
                        <p>{claim.evidence[0]}</p>
                        <button className={styles.evidenceLink} onClick={() => setMode("candidate")}>Inspect evidence <ArrowUpRight size={12} /></button>
                      </article>
                    ))}
                  </div>
                  <div className={styles.detailFooter}>
                    <span><Info size={14} /> Signals guide a conversation; they do not prove authorship or skill.</span>
                    <button onClick={() => setMode("candidate")}>Open full card <ArrowRight size={14} /></button>
                  </div>
                </section>
              </div>

              <section className={styles.fairnessNote}>
                <div className={styles.fairnessIcon}><GraduationCap size={18} /></div>
                <div><strong>Ability should travel farther than a college name.</strong><p>Education details are hidden in this comparison. Candidates can demonstrate skills through assessments and guided work samples, with or without a public repository.</p></div>
                <span className={styles.fairnessMark}>FAIR BY DESIGN</span>
              </section>
            </>
          ) : (
            <CandidateView
              candidate={selected}
              vivaComplete={vivaComplete}
              workSampleStarted={workSampleStarted}
              workSampleComplete={workSampleComplete}
              onStartViva={() => { setQuestionIndex(0); setVivaAnswers([]); setVivaComplete(false); setVivaOpen(true); }}
              onStartWorkSample={() => setWorkSampleOpen(true)}
            />
          )}

          <footer className={styles.pageFooter}><span>PROOF<span className={styles.brandDot}>.</span> <span>Evidence should be inspectable, explainable, and open to review.</span></span><Link href="/">Back to current workspace <ArrowUpRight size={13} /></Link></footer>
        </main>
      </div>

      {vivaOpen && (
        <Modal title="Project viva · sample session" onClose={() => setVivaOpen(false)}>
          <div className={styles.vivaProgress}><span>QUESTION {questionIndex + 1} OF {questions.length}</span><div><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div><span><Clock3 size={13} /> ~6 min</span></div>
          <div className={styles.codeRef}><FileCode2 size={15} /><span>{questions[questionIndex].file}</span></div>
          <p className={styles.vivaQuestion}>{questions[questionIndex].question}</p>
          <label className={styles.srOnly} htmlFor="viva-answer">Your answer</label>
          <textarea id="viva-answer" className={styles.answerInput} placeholder="Talk through what you built and why…" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={4} />
          <div className={styles.modalFoot}><span>Your response stays in this preview session.</span><button className={styles.primaryButton} onClick={submitVivaAnswer} disabled={!answer.trim()}>{questionIndex === questions.length - 1 ? "Finish viva" : "Next question"}<ArrowRight size={15} /></button></div>
        </Modal>
      )}

      {workSampleOpen && (
        <Modal title={workSampleComplete ? "Preview response captured" : workSampleStarted ? "Guided work sample" : "A proof path without GitHub"} onClose={() => setWorkSampleOpen(false)}>
          {workSampleComplete ? (
            <div className={styles.completedState}><CheckCircle2 size={34} /><h3>Nice work. You have a first response to build on.</h3><p>Your answer stays in this browser preview and is not sent to a reviewer. A live assessment would connect a code artifact and a short viva, then attach both as evidence.</p><button className={styles.primaryButton} onClick={() => setWorkSampleOpen(false)}>Back to proof card <ArrowRight size={15} /></button></div>
          ) : workSampleStarted ? (
            <>
              <div className={styles.sampleTask}><span className={styles.sampleTaskLabel}><Code2 size={14} /> 20-MINUTE PRACTICAL</span><h3>Add a search filter to a small book list.</h3><p>Describe how you would handle an empty query, no matches, and a slow response. No repository or prior project is required.</p></div>
              <label className={styles.answerLabel} htmlFor="work-answer">How would you approach it?</label>
              <textarea id="work-answer" className={styles.answerInput} placeholder="Outline your first steps or paste a small code sample…" value={workAnswer} onChange={(event) => setWorkAnswer(event.target.value)} rows={4} />
              <div className={styles.modalFoot}><span>A guided task plus viva can create a first evidence trail.</span><button className={styles.primaryButton} onClick={submitWorkSample} disabled={!workAnswer.trim()}>Save response <ArrowRight size={15} /></button></div>
            </>
          ) : (
            <>
              <p className={styles.modalIntro}>A public GitHub profile is one way to show your work. It is not the only way to start.</p>
              <div className={styles.pathSteps}>
                <div><span>01</span><div><strong>Try a small practical</strong><p>Work through a role-relevant task in a guided session.</p></div></div>
                <div><span>02</span><div><strong>Explain your decisions</strong><p>Answer a few questions about your approach and tradeoffs.</p></div></div>
                <div><span>03</span><div><strong>Build your proof card</strong><p>See each claim, its supporting evidence, and what to add next.</p></div></div>
              </div>
              <div className={styles.modalFoot}><span>No GitHub required. No college filter.</span><button className={styles.primaryButton} onClick={() => setWorkSampleStarted(true)}>Start a sample task <ArrowRight size={15} /></button></div>
            </>
          )}
        </Modal>
      )}

      {vivaComplete && <div className={styles.toast} role="status"><CheckCircle2 size={17} /><span>{vivaAnswers.length} answers captured · no score assigned</span><button onClick={() => setVivaComplete(false)} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}

function CandidateView({
  candidate,
  vivaComplete,
  workSampleStarted,
  workSampleComplete,
  onStartViva,
  onStartWorkSample,
}: {
  candidate: ProofCandidate;
  vivaComplete: boolean;
  workSampleStarted: boolean;
  workSampleComplete: boolean;
  onStartViva: () => void;
  onStartWorkSample: () => void;
}) {
  return (
    <>
      <section className={styles.candidateWelcome}>
        <div className={styles.welcomeMain}>
          <div className={styles.profileHero}>
            <div className={`${styles.profileAvatar} ${styles[`avatar${candidate.id}`] ?? ""}`}>{candidate.initials}</div>
            <div className={styles.profileName}>
              <div className={styles.verifiedLabel}><span className={styles.liveDot} /> CANDIDATE PROOF CARD <span className={styles.demoTag}>SAMPLE</span></div>
              <h2>{candidate.name}</h2>
              <p>{candidate.headline} <span>· {candidate.location}</span></p>
            </div>
            <span className={styles.shareButton}>Candidate preview</span>
          </div>
          <p className={styles.welcomeBlurb}>A clear view of what you can do, what supports each claim, and where to build stronger evidence next.</p>
          <div className={styles.coverageWrap}>
            <div className={styles.coverageText}><span>PROFILE EVIDENCE COVERAGE</span><strong>{candidate.coverage}<span>/100</span></strong></div>
            <div className={styles.coverageTrack}><i style={{ width: `${candidate.coverage}%` }} /></div>
            <p><Info size={13} /> Shows how much evidence is available, not how skilled you are.</p>
          </div>
        </div>
        <div className={styles.assessmentCard}><div className={styles.assessmentIcon}><CheckCircle2 size={17} /></div><span className={styles.metricLabel}>PRACTICAL ASSESSMENT</span><strong>{candidate.assessment}<small>/100</small></strong><p>Completed · Role foundations</p><span className={styles.assessmentLink}>Assessment result included</span></div>
      </section>

      <div className={styles.candidateGrid}>
        <div className={styles.candidateMainColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}><div><h2>Your skill claims</h2><p>Every claim points to something you can inspect or discuss</p></div><span className={styles.claimCount}>04 CLAIMS</span></div>
            <div className={styles.skillGrid}>
              {candidate.claims.map((claim) => (
                <article className={styles.skillCard} key={claim.skill}>
                  <div className={styles.skillTop}><div className={styles.skillIcon}><Code2 size={17} /></div><ConfidenceTag level={claim.confidence} /></div>
                  <h3>{claim.skill}</h3>
                  <ul>{claim.evidence.slice(0, 2).map((item) => <li key={item}><Check size={13} /><span>{item}</span></li>)}</ul>
                </article>
              ))}
            </div>
          </section>

          {candidate.repoInfo ? <section className={`${styles.panel} ${styles.repositoryPanel}`}>
            <div className={styles.panelHeading}><div><h2>Project evidence</h2><p>Signals about how a project changed over time</p></div><span className={styles.repoHeader}><GitBranch size={14} /> REPOSITORY</span></div>
            <div className={styles.projectTitleRow}><div><span className={styles.projectGlyph}><BookOpen size={18} /></span></div><div className={styles.projectName}><h3>{candidate.project}</h3><span className={styles.repoText}>{candidate.repo}</span></div><span className={styles.projectLang}>{candidate.repoInfo.languages.join(" · ")}</span></div>
            <div className={styles.signalGrid}>
              <div className={styles.signalCard}><div><GitBranch size={15} /> CONTRIBUTION TRAIL</div><strong>{candidate.repoInfo.commits} commits <ConfidenceTag level="Medium" /></strong><p>Changes span {candidate.repoInfo.span}. Account identity is self-declared; commit history does not prove who authored the code.</p></div>
              <div className={styles.signalCard}><div><ArrowDownRight size={15} /> PROJECT EVOLUTION</div><strong>{candidate.repoInfo.milestones} visible milestones <ConfidenceTag level="Medium" /></strong><p>{candidate.repoInfo.timeline.map((item) => item.title).join(", then ")}.</p></div>
              <div className={styles.signalCard}><div><Search size={15} /> STARTER COMPARISON</div><strong>{candidate.repoInfo.comparison} <ConfidenceTag level={candidate.repoInfo.comparisonConfidence} /></strong><p>Compared with a small curated starter catalog. Similarity cannot establish tutorial use or originality.</p></div>
            </div>
            <div className={styles.timeline}><div className={styles.timelineLine} />{candidate.repoInfo.timeline.map((item, index) => <div className={styles.timelineEvent} key={item.week}><span className={`${styles.timelineDot} ${index === candidate.repoInfo!.timeline.length - 1 ? styles.timelineDotCurrent : ""}`} /><small>{item.week}</small><strong>{item.title}</strong><p>{item.detail}</p></div>)}</div>
            <div className={styles.signalDisclaimer}><Info size={14} /> Contribution patterns are contextual evidence, not proof of individual authorship.</div>
          </section> : <section className={`${styles.panel} ${styles.noRepoPanel}`}><div className={styles.panelHeading}><div><h2>Start your evidence trail</h2><p>There is no public repository linked to this card</p></div><span className={styles.assessmentOnly}><GraduationCap size={13} /> ASSESSMENT FIRST</span></div><div className={styles.noRepoBody}><div className={styles.noRepoIllustration}><BookOpen size={21} /></div><div><h3>Show what you can do with a guided task.</h3><p>A practical assessment and short project viva can create evidence without a GitHub account. Your profile already includes {candidate.claims.length} skill claims from assessment results.</p><button className={styles.textAction} onClick={onStartWorkSample}>Explore the no-GitHub path <ArrowRight size={13} /></button></div></div></section>}
        </div>

        <aside className={styles.candidateSideColumn}>
          <section className={styles.nextStepCard}>
            <div className={styles.nextStepTop}><span><Sparkles size={15} /> NEXT BEST STEP</span><span className={styles.stepNumber}>01 / 02</span></div>
            <h3>Show how you think about tradeoffs.</h3><p>A short viva can strengthen your evidence for React, API handling, and testing.</p>
            <button className={styles.primaryButton} onClick={onStartViva}>{vivaComplete ? "Review viva preview" : "Start 6-minute viva"} <ArrowRight size={15} /></button>
            <div className={styles.stepFooter}><MessageSquareText size={14} /> Questions use {candidate.repo ? "project files and changes" : "your practical assessment"}.</div>
          </section>

          <section className={styles.vivaCard}>
            <div className={styles.vivaCardTop}><span className={styles.vivaCardIcon}><MessageSquareText size={17} /></span><span className={vivaComplete ? styles.vivaDone : styles.vivaPending}>{vivaComplete ? "PREVIEW COMPLETE" : "NOT STARTED"}</span></div>
            <h3>AI-led project viva</h3><p>Talk through a few decisions from your own code or practical artifact. No trick questions, no generic quiz.</p>
            <div className={styles.vivaMeta}><span><Clock3 size={13} /> About 6 minutes</span><span><FileCode2 size={13} /> 3 code references</span></div>
          </section>

          <section className={styles.strengthenCard}>
            <h3>Strengthen your evidence</h3>
            <div className={styles.todoItem}><span className={styles.todoNumber}>1</span><div><strong>Finish the code viva</strong><p>Supports React and API claims</p></div><ArrowRight size={14} /></div>
            <div className={styles.todoItem}><span className={styles.todoNumber}>2</span><div><strong>Add one accessibility check</strong><p>Supports the early-confidence claim</p></div><ArrowRight size={14} /></div>
            <span className={styles.allSteps}>Suggestions are based on the evidence currently available.</span>
          </section>

          <button className={styles.noGithubCard} onClick={onStartWorkSample}>
            <span className={styles.noGithubIcon}><GraduationCap size={18} /></span><span><strong>No GitHub? Start here.</strong><small>Take a guided practical and build your first evidence trail.</small></span><ArrowRight size={16} />
            {workSampleStarted && <span className={styles.startedPill}>{workSampleComplete ? "RESPONSE CAPTURED" : "IN PROGRESS"}</span>}
          </button>
        </aside>
      </div>
      <div className={styles.candidateNotice}><ShieldCheck size={15} /><span>Evidence is for a fairer conversation. It does not make hiring decisions or establish authorship.</span><button aria-label="Learn about evidence" title="Claims are linked to their source and confidence"><Info size={14} /></button></div>
    </>
  );
}
