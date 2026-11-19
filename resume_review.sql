--
-- PostgreSQL database dump
--

\restrict BRVz4cI5SJxEkgcFqQm8Uork32nS4fIiQgr2odIuA9DKngqjcxoDvn2JBXb8Xze

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.resumes DROP CONSTRAINT IF EXISTS resumes_candidate_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repository_selections DROP CONSTRAINT IF EXISTS repository_selections_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_candidate_id_fkey;
ALTER TABLE IF EXISTS ONLY public.benchmark_repositories DROP CONSTRAINT IF EXISTS benchmark_repositories_benchmark_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.benchmark_file_fingerprints DROP CONSTRAINT IF EXISTS benchmark_file_fingerprints_benchmark_repository_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analysis_results DROP CONSTRAINT IF EXISTS analysis_results_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analysis_jobs DROP CONSTRAINT IF EXISTS analysis_jobs_repository_selection_id_fkey;
DROP INDEX IF EXISTS public.uq_active_job_per_repo;
DROP INDEX IF EXISTS public.ix_resumes_storage_key;
DROP INDEX IF EXISTS public.ix_resumes_candidate_id;
DROP INDEX IF EXISTS public.ix_resumes_candidate_created;
DROP INDEX IF EXISTS public.ix_repository_selections_project_id;
DROP INDEX IF EXISTS public.ix_repository_selections_is_confirmed;
DROP INDEX IF EXISTS public.ix_repo_selections_project_confirmed;
DROP INDEX IF EXISTS public.ix_projects_name;
DROP INDEX IF EXISTS public.ix_projects_candidate_id;
DROP INDEX IF EXISTS public.ix_projects_candidate_created;
DROP INDEX IF EXISTS public.ix_jobs_status_created;
DROP INDEX IF EXISTS public.ix_candidates_name;
DROP INDEX IF EXISTS public.ix_candidates_email;
DROP INDEX IF EXISTS public.ix_bm_file_fingerprints_repo_path;
DROP INDEX IF EXISTS public.ix_bm_file_fingerprints_repo_id;
DROP INDEX IF EXISTS public.ix_bm_file_fingerprints_file_path;
DROP INDEX IF EXISTS public.ix_benchmark_repositories_url;
DROP INDEX IF EXISTS public.ix_benchmark_repositories_status;
DROP INDEX IF EXISTS public.ix_benchmark_repositories_project_id;
DROP INDEX IF EXISTS public.ix_benchmark_projects_category;
DROP INDEX IF EXISTS public.ix_analysis_results_job_id;
DROP INDEX IF EXISTS public.ix_analysis_jobs_status;
DROP INDEX IF EXISTS public.ix_analysis_jobs_repository_selection_id;
ALTER TABLE IF EXISTS ONLY public.benchmark_repositories DROP CONSTRAINT IF EXISTS uq_benchmark_repositories_url;
ALTER TABLE IF EXISTS ONLY public.benchmark_repositories DROP CONSTRAINT IF EXISTS uq_benchmark_repositories_project_id;
ALTER TABLE IF EXISTS ONLY public.benchmark_projects DROP CONSTRAINT IF EXISTS uq_benchmark_projects_category;
ALTER TABLE IF EXISTS ONLY public.resumes DROP CONSTRAINT IF EXISTS resumes_storage_key_key;
ALTER TABLE IF EXISTS ONLY public.resumes DROP CONSTRAINT IF EXISTS resumes_pkey;
ALTER TABLE IF EXISTS ONLY public.repository_selections DROP CONSTRAINT IF EXISTS repository_selections_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.candidates DROP CONSTRAINT IF EXISTS candidates_pkey;
ALTER TABLE IF EXISTS ONLY public.benchmark_repositories DROP CONSTRAINT IF EXISTS benchmark_repositories_pkey;
ALTER TABLE IF EXISTS ONLY public.benchmark_projects DROP CONSTRAINT IF EXISTS benchmark_projects_pkey;
ALTER TABLE IF EXISTS ONLY public.benchmark_file_fingerprints DROP CONSTRAINT IF EXISTS benchmark_file_fingerprints_pkey;
ALTER TABLE IF EXISTS ONLY public.analysis_results DROP CONSTRAINT IF EXISTS analysis_results_pkey;
ALTER TABLE IF EXISTS ONLY public.analysis_results DROP CONSTRAINT IF EXISTS analysis_results_job_id_key;
ALTER TABLE IF EXISTS ONLY public.analysis_jobs DROP CONSTRAINT IF EXISTS analysis_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
DROP TABLE IF EXISTS public.resumes;
DROP TABLE IF EXISTS public.repository_selections;
DROP TABLE IF EXISTS public.projects;
DROP TABLE IF EXISTS public.candidates;
DROP TABLE IF EXISTS public.benchmark_repositories;
DROP TABLE IF EXISTS public.benchmark_projects;
DROP TABLE IF EXISTS public.benchmark_file_fingerprints;
DROP TABLE IF EXISTS public.analysis_results;
DROP TABLE IF EXISTS public.analysis_jobs;
DROP TABLE IF EXISTS public.alembic_version;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO app_user;

--
-- Name: analysis_jobs; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.analysis_jobs (
    id uuid NOT NULL,
    repository_selection_id uuid NOT NULL,
    status character varying(50) DEFAULT 'queued'::character varying NOT NULL,
    error_message text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    stage character varying(50) DEFAULT 'queued'::character varying,
    progress integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    failure_code character varying(100),
    selected_repository_url character varying(512),
    analyzed_commit_sha character varying(40)
);


ALTER TABLE public.analysis_jobs OWNER TO app_user;

--
-- Name: analysis_results; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.analysis_results (
    id uuid NOT NULL,
    job_id uuid NOT NULL,
    report jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.analysis_results OWNER TO app_user;

--
-- Name: benchmark_file_fingerprints; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.benchmark_file_fingerprints (
    id uuid NOT NULL,
    benchmark_repository_id uuid NOT NULL,
    file_path character varying(1024) NOT NULL,
    file_hash character varying(64) NOT NULL,
    language character varying(50) NOT NULL,
    tokens_count integer DEFAULT 0 NOT NULL,
    fingerprints jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.benchmark_file_fingerprints OWNER TO app_user;

--
-- Name: benchmark_projects; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.benchmark_projects (
    id uuid NOT NULL,
    category character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.benchmark_projects OWNER TO app_user;

--
-- Name: benchmark_repositories; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.benchmark_repositories (
    id uuid NOT NULL,
    benchmark_project_id uuid NOT NULL,
    repository_url character varying(512) NOT NULL,
    owner character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    primary_language character varying(50) NOT NULL,
    description text,
    license character varying(100),
    stars_count integer DEFAULT 0 NOT NULL,
    default_branch character varying(100) DEFAULT 'main'::character varying NOT NULL,
    pinned_commit_sha character varying(40) NOT NULL,
    indexing_status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    failure_reason text,
    indexed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.benchmark_repositories OWNER TO app_user;

--
-- Name: candidates; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.candidates (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    selected_project_id uuid
);


ALTER TABLE public.candidates OWNER TO app_user;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    source_page integer,
    explicit_github_urls jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL,
    is_selected boolean DEFAULT false NOT NULL
);


ALTER TABLE public.projects OWNER TO app_user;

--
-- Name: repository_selections; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.repository_selections (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    url character varying(512) NOT NULL,
    owner character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    discovery_reason text NOT NULL,
    confidence_category character varying(50) NOT NULL,
    is_confirmed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.repository_selections OWNER TO app_user;

--
-- Name: resumes; Type: TABLE; Schema: public; Owner: app_user
--

CREATE TABLE public.resumes (
    id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    original_filename character varying(255) NOT NULL,
    storage_key character varying(255) NOT NULL,
    content_type character varying(100) NOT NULL,
    file_size_bytes integer,
    raw_text text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.resumes OWNER TO app_user;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.alembic_version (version_num) FROM stdin;
004_benchmark_catalog
\.


--
-- Data for Name: analysis_jobs; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.analysis_jobs (id, repository_selection_id, status, error_message, created_at, updated_at, stage, progress, started_at, completed_at, failure_code, selected_repository_url, analyzed_commit_sha) FROM stdin;
e1761482-e4f1-4a64-8d7a-825565e06f82	1f25bb16-dc7b-44e5-8234-9058701d6a7d	succeeded	\N	2026-11-02 09:51:11.582739+00	2026-11-02 09:51:21.124795+00	persistence	100	2026-11-02 09:51:11.649784+00	2026-11-02 09:51:21.123932+00	\N	https://github.com/parthshr370/Md-Notes-Buddy	ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82
\.


--
-- Data for Name: analysis_results; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.analysis_results (id, job_id, report, created_at) FROM stdin;
11e030c4-c0bc-402b-b5a3-be9a33b03f60	e1761482-e4f1-4a64-8d7a-825565e06f82	{"history": {"evidence": [{"id": "d61c45c6-fbc3-4036-8921-fd3c61b8b598", "kind": "git_history", "path": null, "summary": "Analyzed 1 reachable commits spanning N/A days (1 contributors, 0 merges).", "commitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82", "sourceUrl": "https://github.com/parthshr370/Md-Notes-Buddy/commits"}, {"id": "3c696c19-2d43-45a8-8244-441cfb98fe06", "kind": "git_history", "path": null, "summary": "Earliest reachable commit: 'markitdown' on 2025-04-26T17:01:26+05:30.", "commitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82", "sourceUrl": "https://github.com/parthshr370/Md-Notes-Buddy/commit/ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82"}, {"id": "5960027b-1260-4678-847b-075a3168e028", "kind": "git_history", "path": null, "summary": "Latest reachable commit: 'markitdown' on 2025-04-26T17:01:26+05:30.", "commitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82", "sourceUrl": "https://github.com/parthshr370/Md-Notes-Buddy/commit/ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82"}], "is_shallow": false, "has_mailmap": false, "limitations": ["Git commit logs and author metadata are user-editable and can be easily rewritten or spoofed.", "Imported repository history can preserve original author credits from upstream templates or libraries.", "Commit frequency or authorship metadata does not prove project understanding or technical competency.", "Alias matching is an unverified heuristic based on user input and does not prove identity or authorship."], "contributors": [{"name": "parthshr370", "is_bot": false, "percentage": 100.0, "commit_count": 1, "redacted_email": "p*********0@gmail.com"}], "is_truncated": false, "duration_days": 0.0, "merge_commits": 0, "total_commits": 1, "last_commit_date": "2025-04-26T17:01:26+05:30", "alias_match_stats": {"supplied_aliases": ["ramkrishna swarnkar"], "matched_percentage": 0.0, "matched_commits_count": 0, "matching_contributor_names": []}, "bot_commits_count": 0, "first_commit_date": "2025-04-26T17:01:26+05:30", "truncation_reasons": [], "timestamp_anomalies": []}, "evidence": [{"id": "d61c45c6-fbc3-4036-8921-fd3c61b8b598", "kind": "git_history", "path": null, "summary": "Analyzed 1 reachable commits spanning N/A days (1 contributors, 0 merges).", "commitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82", "sourceUrl": "https://github.com/parthshr370/Md-Notes-Buddy/commits"}, {"id": "3c696c19-2d43-45a8-8244-441cfb98fe06", "kind": "git_history", "path": null, "summary": "Earliest reachable commit: 'markitdown' on 2025-04-26T17:01:26+05:30.", "commitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82", "sourceUrl": "https://github.com/parthshr370/Md-Notes-Buddy/commit/ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82"}, {"id": "5960027b-1260-4678-847b-075a3168e028", "kind": "git_history", "path": null, "summary": "Latest reachable commit: 'markitdown' on 2025-04-26T17:01:26+05:30.", "commitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82", "sourceUrl": "https://github.com/parthshr370/Md-Notes-Buddy/commit/ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82"}], "assessment": {"status": "limited_evidence", "limitations": ["The evidence coverage score measures available data for review only; it does not measure candidate competence, skill, honesty, or hiring suitability.", "Git history and authorship identities can be edited, spoofed, or imported from prior template repositories.", "Fork status is a standard open-source collaboration model and does not diminish candidate credibility.", "Similarity results are restricted exclusively to the small configured reference collection and do not prove copying direction.", "Assessment outputs are intended to guide structured human technical interviews, not to automatically rank or reject candidates."], "observations": [{"category": "git_history", "statement": "Repository history contains 1 reachable commits spanning N/A days with 1 contributor(s) and 0 merge commit(s).", "evidence_ids": ["d61c45c6-fbc3-4036-8921-fd3c61b8b598"]}, {"category": "alias_heuristic", "statement": "Optional user-supplied aliases matched 0 of 1 reachable commits (0.0%). Identity heuristic is strictly unverified and does not establish verified authorship.", "evidence_ids": ["d61c45c6-fbc3-4036-8921-fd3c61b8b598"]}], "assessment_version": "1.0.0", "coverage_components": {"source_inspection": {"score": 100, "reason": null, "status": "complete", "weight": 0.25, "weighted_score": 25.0}, "history_availability": {"score": 70, "reason": "History contains fewer than 3 commits.", "status": "partial", "weight": 0.3, "weighted_score": 21.0}, "reference_comparison": {"score": 0, "reason": "Reference catalog collection is empty; similarity measurement unavailable.", "status": "unavailable", "weight": 0.25, "weighted_score": 0.0}, "metadata_availability": {"score": 50, "reason": "Some repository metadata attributes are unset.", "status": "partial", "weight": 0.2, "weighted_score": 10.0}}, "evidence_coverage_score": 56, "suggested_interview_questions": ["In commit ebd7ddfc ('Earliest reachable commit: 'markitdown' on 2025-04-26T17:01:26+05:30.'), what design trade-offs did you consider when making those changes?", "Could you walk us through the overall architectural division of responsibilities across the primary source modules in this repository?"]}, "repository": {"url": "https://github.com/parthshr370/Md-Notes-Buddy", "name": "Md-Notes-Buddy", "owner": "parthshr370", "is_fork": false, "license": null, "parent_url": null, "source_url": null, "visibility": "public", "description": null, "forks_count": 2, "stars_count": 11, "default_branch": "main"}, "similarity": {"evidence": [], "limitations": ["Reference catalog is empty; comparisons cannot be conducted.", "Similarity results only evaluate matches against the configured reference collection."], "matched_paths": [], "overlap_score": {"value": null, "reason": "Reference catalog collection is empty; similarity measurement unavailable."}, "algorithm_version": "winnowing-v1.0", "coverage_statistics": {"reference_files_indexed": 0, "candidate_files_analyzed": 9, "candidate_tokens_analyzed": 5392}, "reference_commit_links": [], "algorithm_configuration": {"window_size": 6, "k_shingle_size": 12, "supported_languages": ["python", "javascript", "typescript"]}}, "limitations": ["Git commit logs and author metadata are user-editable and can be easily rewritten or spoofed.", "Imported repository history can preserve original author credits from upstream templates or libraries.", "Commit frequency or authorship metadata does not prove project understanding or technical competency.", "Alias matching is an unverified heuristic based on user input and does not prove identity or authorship.", "Reference catalog is empty; comparisons cannot be conducted.", "Similarity results only evaluate matches against the configured reference collection.", "The evidence coverage score measures available data for review only; it does not measure candidate competence, skill, honesty, or hiring suitability.", "Git history and authorship identities can be edited, spoofed, or imported from prior template repositories.", "Fork status is a standard open-source collaboration model and does not diminish candidate credibility.", "Similarity results are restricted exclusively to the small configured reference collection and do not prove copying direction.", "Assessment outputs are intended to guide structured human technical interviews, not to automatically rank or reject candidates."], "schemaVersion": "1.0.0", "analyzedCommitSha": "ebd7ddfcf6989ca92ec0cfec50f4161fca7a1d82"}	2026-11-02 09:51:21.126165+00
\.


--
-- Data for Name: benchmark_file_fingerprints; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.benchmark_file_fingerprints (id, benchmark_repository_id, file_path, file_hash, language, tokens_count, fingerprints, created_at) FROM stdin;
\.


--
-- Data for Name: benchmark_projects; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.benchmark_projects (id, category, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: benchmark_repositories; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.benchmark_repositories (id, benchmark_project_id, repository_url, owner, name, primary_language, description, license, stars_count, default_branch, pinned_commit_sha, indexing_status, failure_reason, indexed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.candidates (id, name, email, created_at, updated_at, selected_project_id) FROM stdin;
7af3951e-d055-407b-9c9c-295ad737c812	Ramkrishna Swarnkar	Ramxcodes@gmail.com	2026-11-02 09:49:59.42761+00	2026-11-02 09:50:31.406481+00	8a864890-b3b8-4c29-b1ce-42a02efd8b3f
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.projects (id, candidate_id, name, description, source_page, explicit_github_urls, created_at, is_selected) FROM stdin;
8a864890-b3b8-4c29-b1ce-42a02efd8b3f	7af3951e-d055-407b-9c9c-295ad737c812	Notes Buddy	Next.js, Tailwind CSS, Razorpay, Aceternity UI, Shadcn UI, NextAuth Built a comprehensive educational platform with interactive quizzes, flashcards, condensed notes, an AI chatbot, and an online code compiler. Achieved 190K+ note views, 2,500+ hours of study time, 1,600 signups, and 99 premium purchases in under 3 months. Implemented piracy and account sharing detection systems to ensure subscr...	1	[]	2026-11-02 09:50:00.7979+00	t
d5014f8b-5f36-4595-8280-8913caff7547	7af3951e-d055-407b-9c9c-295ad737c812	Moonstone 2K25 Website	Next.js, Three.js, R3F, Tailwind CSS, Framer Motion, Matter.js Designed and developed the official website for Moonstone 2K25 — the annual fest of Medi-Caps University delivering a high-impact, immersive web experience. Used R3F and Three.js to craft interactive 3D visuals and Matter.js for physics-based effects, enhancing user engagement. Integrated Framer Motion and Tailwind CSS to create smo...	1	[]	2026-11-02 09:49:59.430935+00	f
dc170a3a-c2af-43f6-bbbd-1af4a892e743	7af3951e-d055-407b-9c9c-295ad737c812	Syncify	React, TypeScript, Tailwind CSS, Shadcn UI, Clerk, Node.js, Express.js, MongoDB Developed a full-stack music streaming app with real-time chat, activity feeds, playlist collaboration, and custom audio player. Achieved 99% playback reliability and handled 100+ API requests daily through scalable Express.js backend. Built an admin dashboard with real-time analytics and automated playlist curation.	1	[]	2026-11-02 09:50:03.057313+00	f
\.


--
-- Data for Name: repository_selections; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.repository_selections (id, project_id, url, owner, name, discovery_reason, confidence_category, is_confirmed, created_at) FROM stdin;
8a7c3046-6137-4ddc-880c-7b17b67b074d	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/ramxcodes/NotesBuddy	ramxcodes	NotesBuddy	Candidate account match (ramxcodes/NotesBuddy) for 'Notes Buddy' (unconfirmed; requires HR verification)	high	f	2026-11-02 09:50:03.060147+00
69fa01e5-c899-4d6d-bb72-bea2af4b57f5	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/ramxcodes/notes-buddy	ramxcodes	notes-buddy	Candidate account match (ramxcodes/notes-buddy) for 'Notes Buddy' (unconfirmed; requires HR verification)	high	f	2026-11-02 09:50:03.060153+00
991dde00-0476-4a7e-a99b-e3f37d3bffcb	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/awebisam/The-Notes-Buddy-API	awebisam	The-Notes-Buddy-API	Close name match for 'Notes Buddy' via public search (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:03.060154+00
557dce8e-4feb-46f3-ac85-95ba688cfb78	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/Christianrcds/workbuddy	Christianrcds	workbuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060155+00
255c6e32-be27-4641-b85d-947a1647ca04	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/gg-ansca/DIY-BUDDY	gg-ansca	DIY-BUDDY	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060156+00
be3f7220-65bc-4d9d-85e7-5bba81106a2c	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/aaja/CodeLife	aaja	CodeLife	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060157+00
ee9e0f71-312a-4ba3-b4eb-a3cfa736bbd3	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/dyarawilliams/study-buddy	dyarawilliams	study-buddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060158+00
628216b7-d075-4d87-ab00-cdac769e7a64	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/naofum/NoteBuddy	naofum	NoteBuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060158+00
9d24b637-b8a0-4b45-a062-9b71d419e269	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/20Aditya/NoteBuddy	20Aditya	NoteBuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060159+00
3ac0fd02-578b-4943-9f0a-83b5071b2523	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/kakashi-tries-to-code/assignment-buddy	kakashi-tries-to-code	assignment-buddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.06016+00
47ca3102-9e08-4957-b3cc-d1546fe6bb67	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/bushrakhandoker708/study-buddy	bushrakhandoker708	study-buddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.06016+00
39b505dc-017b-4376-8af6-2835fbf723de	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/KartikSingh023/NoteBuddy	KartikSingh023	NoteBuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060161+00
35ba7462-fa1c-4219-9cda-de43f5a7826e	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/leungjch/StudyBuddy	leungjch	StudyBuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060162+00
818cb61e-6c7c-417d-b569-1e808f7a4a1d	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/SomyaRanjanSahu/College-Notes-Website	SomyaRanjanSahu	College-Notes-Website	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060162+00
133fe92f-ed7a-4cb1-939e-fae91494c081	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/ananya-dev15/StudyBuddy-final-	ananya-dev15	StudyBuddy-final-	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060163+00
e374e0b9-9408-44f7-a9b5-e3f7ac867f1d	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/najuasaad/StudyBuddy	najuasaad	StudyBuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060164+00
59a45353-c714-4e1f-bdc4-5ac9dba41404	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/AllStars101-sudo/NoteBuddy	AllStars101-sudo	NoteBuddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060164+00
13d7cb10-5bb0-49d7-a04f-ce3bfa65cfd8	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/n4sser77/blazor-buddy	n4sser77	blazor-buddy	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060165+00
94d6d33b-ba6b-45d2-97c6-61fefdb75fb9	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/amanvermai30/My-DSA-Buddy-Notes	amanvermai30	My-DSA-Buddy-Notes	Keyword match via public repository search for 'Notes Buddy' (unconfirmed; requires HR verification)	low	f	2026-11-02 09:50:03.060166+00
3e99c991-4f26-4b68-a0ff-a232bb9fdccf	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/ramxcodes/Syncify-frontend	ramxcodes	Syncify-frontend	Candidate account match (ramxcodes/Syncify-frontend) for 'Syncify' (unconfirmed; requires HR verification)	high	f	2026-11-02 09:50:05.117112+00
9c2a6de7-3aed-4d71-88a6-a3d0025288bd	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/ramxcodes/Syncify-backend	ramxcodes	Syncify-backend	Candidate account match (ramxcodes/Syncify-backend) for 'Syncify' (unconfirmed; requires HR verification)	high	f	2026-11-02 09:50:05.11712+00
866eecc2-31f1-4a58-8905-b29c02cf14d5	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/panoply/syncify	panoply	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117121+00
2afe9237-c8a2-4f2a-873c-634f20f782c2	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/aldonline/syncify	aldonline	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117122+00
56535ecc-60ab-4615-b128-3c48c7d53ed0	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/TheWicklowWolf/Syncify	TheWicklowWolf	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117123+00
8d09ceef-3be2-4b2b-8106-13bdf7d6de35	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/FindMalek/Syncify	FindMalek	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117124+00
5dc9c520-954c-4838-be01-85ffa10e99da	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/kaezrr/syncify	kaezrr	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117124+00
82de9976-b12d-468e-b730-3d06f3421f0e	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/wSoltani/syncify	wSoltani	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117125+00
28fc2bdb-9076-4789-b721-637e2095d637	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/ImBritish/Syncify	ImBritish	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117126+00
7e9a6130-35a3-4cae-8a6d-a79a2ee3c034	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/devsnek/syncify	devsnek	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117127+00
56d4ddc4-e4ce-4c48-bccd-0e95d0b94660	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/jasongedev/Syncify	jasongedev	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117127+00
2b4505d6-587e-4f7c-85f7-0c671cd85d23	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/keval6b/syncify	keval6b	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117128+00
71b0797b-73a3-4277-99e8-42bb9b522611	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/kunalbhoge28/Syncify	kunalbhoge28	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117129+00
6eecb7a5-ac64-4364-9008-7541a667f01f	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/buglessa-tech/Syncify	buglessa-tech	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.11713+00
87181733-cc53-489b-876b-b97f89ce2af2	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/revan-zhang/syncify	revan-zhang	syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.11713+00
714e2683-1fbb-4acb-8a79-fc2241651a5c	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/nikzadkhani/Syncify	nikzadkhani	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117131+00
6c98f471-074f-48a0-8a2b-23ae1db900ea	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/MadManJohnSmith/Syncify	MadManJohnSmith	Syncify	Exact name match via public repository search for 'Syncify' (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117132+00
b2758ed9-d349-472a-aa22-06ed106f48a7	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/auxves/vscode-syncify	auxves	vscode-syncify	Close name match for 'Syncify' via public search (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117133+00
e3136650-f105-4abd-a67d-d1f781359d03	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/kinsi55/node_Syncify	kinsi55	node_Syncify	Close name match for 'Syncify' via public search (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117133+00
d8459bf2-bc0c-4d47-b27c-f2938a51e176	dc170a3a-c2af-43f6-bbbd-1af4a892e743	https://github.com/panoply/syncify-dawn-advanced	panoply	syncify-dawn-advanced	Close name match for 'Syncify' via public search (unconfirmed; requires HR verification)	medium	f	2026-11-02 09:50:05.117134+00
1f25bb16-dc7b-44e5-8234-9058701d6a7d	8a864890-b3b8-4c29-b1ce-42a02efd8b3f	https://github.com/parthshr370/Md-Notes-Buddy	parthshr370	Md-Notes-Buddy	Close name match for 'Notes Buddy' via public search (unconfirmed; requires HR verification)	medium	t	2026-11-02 09:50:03.060154+00
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: app_user
--

COPY public.resumes (id, candidate_id, original_filename, storage_key, content_type, file_size_bytes, raw_text, created_at) FROM stdin;
a6042c94-4f05-4881-ac8b-c050d3c84642	7af3951e-d055-407b-9c9c-295ad737c812	Ramxcodes_resume.pdf	resumes/01388be6bfd14969aef9c31ae7fcd353.pdf	application/pdf	148796	Ramkrishna Swarnkar\nIndore, Madhya Pradesh, India 452014\n# Ramxcodes@gmail.com\nï linkedin.com/in/ramxcodes\n§ github.com/ramxcodes  ramx.in\nTECHNICAL SKILLS\nLanguages: JavaScript, TypeScript, Python\nDeveloper Tools: VS Code, Postman, HTTPie, Docker, Cursor\nTechnologies/Frameworks: GitHub, ReactJS, Zustand, NextJS, NodeJS, ExpressJS, Git, Mongo, Tailwind\nCSS, GSAP, Three.js, Motion (Framer)\nExperience\nExpelee\nAug 2023 – Present\nRemote — Dubai, UAE\n• Full Stack Developer in Next.js & MERN (Mar 2025 – Present)\n∗Riskmitra: Built full-stack product with Next.js, Tailwind CSS, Framer Motion, shadcn, wallet integration, and\nGitBook integration.\n∗Core AI: Designed and developed with same stack as Riskmitra, focusing on scalability and modular UI design.\n∗GPU AI: Integrated Three.js for interactive 3D elements alongside full-stack features from Core AI setup.\n• Full-stack Developer — MERN (Jan 2024 – Mar 2025)\n∗Altranium: Developed immersive gaming platform using Three.js, MERN, Tailwind, and Framer Motion.\n∗Pars Network: Engineered landing experience with MERN, Tailwind CSS, and GSAP for advanced animations\nand transitions.\n• Frontend Developer & Designer (Internship) (Aug 2023 – Dec 2023)\n∗TEQ Network: Designed and developed landing page using MERN, Tailwind CSS, and Web3 wallet integration.\nFlameloop\nJun 2023 – Jul 2023\nJunior Frontend Developer & Graphic Designer (Internship)\nIndore, Madhya Pradesh, India\n• Worked on visual storytelling, video editing, and graphic design projects.\n• Created branding materials and engaging visual content for social media.\nProjects\nMoonstone 2K25 Website | Next.js, Three.js, R3F, Tailwind CSS, Framer Motion, Matter.js\nMar 2025\n• Designed and developed the official website for Moonstone 2K25 — the annual fest of Medi-Caps University\n— delivering a high-impact, immersive web experience.\n• Used R3F and Three.js to craft interactive 3D visuals and Matter.js for physics-based effects, enhancing user\nengagement.\n• Integrated Framer Motion and Tailwind CSS to create smooth, dynamic transitions and responsive layouts.\nNotes Buddy | Next.js, Tailwind CSS, Razorpay, Aceternity UI, Shadcn UI, NextAuth\nJan 2025\n• Built a comprehensive educational platform with interactive quizzes, flashcards, condensed notes, an AI\nchatbot, and an online code compiler.\n• Achieved 190K+ note views, 2,500+ hours of study time, 1,600 signups, and 99 premium purchases in under 3\nmonths.\n• Implemented piracy and account sharing detection systems to ensure subscription integrity.\n• Pitched by 2 universities to be official part of their system.\n• Open-sourced project with 10+ contributors and 15+ pull requests merged.\nSyncify | React, TypeScript, Tailwind CSS, Shadcn UI, Clerk, Node.js, Express.js, MongoDB\nNov 2024\n• Developed a full-stack music streaming app with real-time chat, activity feeds, playlist collaboration, and\ncustom audio player.\n• Achieved 99% playback reliability and handled 100+ API requests daily through scalable Express.js backend.\n• Built an admin dashboard with real-time analytics and automated playlist curation.\n	2026-11-02 09:49:59.432219+00
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: analysis_jobs analysis_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.analysis_jobs
    ADD CONSTRAINT analysis_jobs_pkey PRIMARY KEY (id);


--
-- Name: analysis_results analysis_results_job_id_key; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_job_id_key UNIQUE (job_id);


--
-- Name: analysis_results analysis_results_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_pkey PRIMARY KEY (id);


--
-- Name: benchmark_file_fingerprints benchmark_file_fingerprints_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_file_fingerprints
    ADD CONSTRAINT benchmark_file_fingerprints_pkey PRIMARY KEY (id);


--
-- Name: benchmark_projects benchmark_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_projects
    ADD CONSTRAINT benchmark_projects_pkey PRIMARY KEY (id);


--
-- Name: benchmark_repositories benchmark_repositories_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_repositories
    ADD CONSTRAINT benchmark_repositories_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: repository_selections repository_selections_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.repository_selections
    ADD CONSTRAINT repository_selections_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (id);


--
-- Name: resumes resumes_storage_key_key; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_storage_key_key UNIQUE (storage_key);


--
-- Name: benchmark_projects uq_benchmark_projects_category; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_projects
    ADD CONSTRAINT uq_benchmark_projects_category UNIQUE (category);


--
-- Name: benchmark_repositories uq_benchmark_repositories_project_id; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_repositories
    ADD CONSTRAINT uq_benchmark_repositories_project_id UNIQUE (benchmark_project_id);


--
-- Name: benchmark_repositories uq_benchmark_repositories_url; Type: CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_repositories
    ADD CONSTRAINT uq_benchmark_repositories_url UNIQUE (repository_url);


--
-- Name: ix_analysis_jobs_repository_selection_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_analysis_jobs_repository_selection_id ON public.analysis_jobs USING btree (repository_selection_id);


--
-- Name: ix_analysis_jobs_status; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_analysis_jobs_status ON public.analysis_jobs USING btree (status);


--
-- Name: ix_analysis_results_job_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_analysis_results_job_id ON public.analysis_results USING btree (job_id);


--
-- Name: ix_benchmark_projects_category; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_benchmark_projects_category ON public.benchmark_projects USING btree (category);


--
-- Name: ix_benchmark_repositories_project_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_benchmark_repositories_project_id ON public.benchmark_repositories USING btree (benchmark_project_id);


--
-- Name: ix_benchmark_repositories_status; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_benchmark_repositories_status ON public.benchmark_repositories USING btree (indexing_status);


--
-- Name: ix_benchmark_repositories_url; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_benchmark_repositories_url ON public.benchmark_repositories USING btree (repository_url);


--
-- Name: ix_bm_file_fingerprints_file_path; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_bm_file_fingerprints_file_path ON public.benchmark_file_fingerprints USING btree (file_path);


--
-- Name: ix_bm_file_fingerprints_repo_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_bm_file_fingerprints_repo_id ON public.benchmark_file_fingerprints USING btree (benchmark_repository_id);


--
-- Name: ix_bm_file_fingerprints_repo_path; Type: INDEX; Schema: public; Owner: app_user
--

CREATE UNIQUE INDEX ix_bm_file_fingerprints_repo_path ON public.benchmark_file_fingerprints USING btree (benchmark_repository_id, file_path);


--
-- Name: ix_candidates_email; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_candidates_email ON public.candidates USING btree (email);


--
-- Name: ix_candidates_name; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_candidates_name ON public.candidates USING btree (name);


--
-- Name: ix_jobs_status_created; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_jobs_status_created ON public.analysis_jobs USING btree (status, created_at);


--
-- Name: ix_projects_candidate_created; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_projects_candidate_created ON public.projects USING btree (candidate_id, created_at);


--
-- Name: ix_projects_candidate_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_projects_candidate_id ON public.projects USING btree (candidate_id);


--
-- Name: ix_projects_name; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_projects_name ON public.projects USING btree (name);


--
-- Name: ix_repo_selections_project_confirmed; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_repo_selections_project_confirmed ON public.repository_selections USING btree (project_id, is_confirmed);


--
-- Name: ix_repository_selections_is_confirmed; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_repository_selections_is_confirmed ON public.repository_selections USING btree (is_confirmed);


--
-- Name: ix_repository_selections_project_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_repository_selections_project_id ON public.repository_selections USING btree (project_id);


--
-- Name: ix_resumes_candidate_created; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_resumes_candidate_created ON public.resumes USING btree (candidate_id, created_at);


--
-- Name: ix_resumes_candidate_id; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_resumes_candidate_id ON public.resumes USING btree (candidate_id);


--
-- Name: ix_resumes_storage_key; Type: INDEX; Schema: public; Owner: app_user
--

CREATE INDEX ix_resumes_storage_key ON public.resumes USING btree (storage_key);


--
-- Name: uq_active_job_per_repo; Type: INDEX; Schema: public; Owner: app_user
--

CREATE UNIQUE INDEX uq_active_job_per_repo ON public.analysis_jobs USING btree (repository_selection_id) WHERE ((status)::text = ANY ((ARRAY['queued'::character varying, 'running'::character varying])::text[]));


--
-- Name: analysis_jobs analysis_jobs_repository_selection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.analysis_jobs
    ADD CONSTRAINT analysis_jobs_repository_selection_id_fkey FOREIGN KEY (repository_selection_id) REFERENCES public.repository_selections(id) ON DELETE CASCADE;


--
-- Name: analysis_results analysis_results_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.analysis_results
    ADD CONSTRAINT analysis_results_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.analysis_jobs(id) ON DELETE CASCADE;


--
-- Name: benchmark_file_fingerprints benchmark_file_fingerprints_benchmark_repository_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_file_fingerprints
    ADD CONSTRAINT benchmark_file_fingerprints_benchmark_repository_id_fkey FOREIGN KEY (benchmark_repository_id) REFERENCES public.benchmark_repositories(id) ON DELETE CASCADE;


--
-- Name: benchmark_repositories benchmark_repositories_benchmark_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.benchmark_repositories
    ADD CONSTRAINT benchmark_repositories_benchmark_project_id_fkey FOREIGN KEY (benchmark_project_id) REFERENCES public.benchmark_projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- Name: repository_selections repository_selections_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.repository_selections
    ADD CONSTRAINT repository_selections_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: resumes resumes_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: app_user
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict BRVz4cI5SJxEkgcFqQm8Uork32nS4fIiQgr2odIuA9DKngqjcxoDvn2JBXb8Xze

