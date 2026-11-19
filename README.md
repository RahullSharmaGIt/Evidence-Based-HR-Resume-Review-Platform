::: {align="center"}
# Evidence-Based HR Resume Review Platform

**A full-stack platform for reviewing candidate resumes, discovering
project repositories, and examining verifiable technical evidence.**

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Queue-Redis-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Containers-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
:::

------------------------------------------------------------------------

## Overview

The **Evidence-Based HR Resume Review Platform** helps hiring teams look
beyond the claims written in a resume. An administrator can upload
candidate resumes, review extracted projects, discover related public
GitHub repositories, confirm the repository to inspect, and request an
evidence-based analysis.

The platform brings together resume processing, GitHub metadata and
history inspection, source-code similarity analysis, evidence coverage
assessment, and AI-assisted technical interview question generation.

> **Important:** The platform presents signals and supporting evidence
> for human review. Evidence coverage is not a measure of a candidate's
> skill, proof of code authorship, or proof of misconduct. Similarity
> can reflect shared code, libraries, or common patterns; it does not
> establish copying direction.

## Key Features

-   **Resume intake:** Upload PDF and DOCX resumes in batches, with file
    validation and per-file processing results.
-   **Resume text extraction:** Extract readable text and identify
    scanned documents that need manual review.
-   **Project extraction:** Identify project suggestions and GitHub
    repository URLs from resume content.
-   **Human-controlled project selection:** Let the administrator choose
    the primary project to review.
-   **GitHub repository discovery:** Prioritize repository links
    explicitly present in a resume, then use public repository search as
    a fallback.
-   **Repository confirmation:** Require an administrator to confirm the
    repository before analysis can begin.
-   **Asynchronous analysis:** Run longer repository analysis jobs in a
    Redis-backed RQ worker instead of blocking an API request.
-   **Progress and cancellation:** Track job stages, inspect failures,
    cancel active work, and retry eligible failures.
-   **Evidence report:** Present repository metadata, Git history, code
    similarity results, evidence anchors, coverage measurements, and
    interview prompts.
-   **AI-assisted interview questions:** Use the Gemini API to help
    generate project-specific technical/viva questions.
-   **Security and resource controls:** Apply session and CSRF
    protections, upload limits, restricted Git operations, bounded
    processing, and diagnostic sanitization.

## How It Works

``` mermaid
flowchart TD
    A([Admin opens application]) --> B[Sign in]
    B --> C[Upload candidate resumes]
    C --> D{Resume valid?}
    D -- No --> E[Show file-level error]
    E --> C
    D -- Yes --> F[Extract resume text]
    F --> G{Readable text available?}
    G -- No --> H[Manual project entry]
    G -- Yes --> I[Extract project suggestions and GitHub URLs]
    H --> J[Review candidate projects]
    I --> J
    J --> K[Select primary project]
    K --> L[Discover public repositories]
    L --> M[Administrator reviews matches]
    M --> N{Repository confirmed?}
    N -- No --> M
    N -- Yes --> O[Trigger evidence analysis]
    O --> P[Monitor background job]
    P --> Q{Job finished?}
    Q -- Running --> P
    Q -- Failed --> R[Review error / retry if appropriate]
    R --> O
    Q -- Canceled --> S[Show canceled state]
    Q -- Succeeded --> T[Open evidence report]
```

### Repository analysis pipeline

Once a repository is confirmed, the background worker processes it in
six stages:

``` mermaid
flowchart TD
    A[Analysis job queued] --> B[1. Metadata]
    B --> C[2. Restricted repository fetch]
    C --> D[3. Git history analysis]
    D --> E[4. Code similarity analysis]
    E --> F[5. Evidence assessment]
    F --> G[6. Persist report]
    G --> H([Job succeeded])
```

  -----------------------------------------------------------------------
  Stage                               What happens
  ----------------------------------- -----------------------------------
  1\. Metadata                        Retrieve public repository details
                                      such as visibility, license,
                                      default branch, and fork
                                      information.

  2\. Repository fetch                Perform a restricted bare clone,
                                      record the analyzed commit SHA, and
                                      inspect source files within
                                      configured limits.

  3\. Git history                     Summarize commits, contributors,
                                      merge activity, date range, bot
                                      activity, and relevant timestamp
                                      anomalies.

  4\. Code similarity                 Compare normalized source
                                      fingerprints with the configured
                                      reference catalog.

  5\. Evidence assessment             Calculate evidence coverage,
                                      classify evidence availability, and
                                      produce traceable observations and
                                      interview questions.

  6\. Persistence                     Save the final report and mark the
                                      job as complete.
  -----------------------------------------------------------------------

## Architecture

The application is divided into a frontend, an API/backend, and
supporting infrastructure.

``` mermaid
flowchart TB
    subgraph UI[Frontend]
      A[Next.js / React / TypeScript]
      A1[Admin dashboard]
      A2[Candidate review]
      A3[Job progress]
      A4[Evidence report]
      A --> A1
      A --> A2
      A --> A3
      A --> A4
    end

    subgraph API[Backend]
      B[FastAPI REST API]
      C[Authentication and session services]
      D[Resume and project services]
      E[GitHub discovery services]
      F[Job service]
      G[Analysis services]
      B --> C
      B --> D
      B --> E
      B --> F
    end

    subgraph INFRA[Infrastructure]
      H[(PostgreSQL)]
      I[(Redis)]
      J[RQ background worker]
      K[GitHub API]
      L[Gemini API]
    end

    A <-->|HTTP / JSON| B
    C --> H
    D --> H
    E <--> K
    E --> H
    F --> H
    F --> I
    I --> J
    J --> G
    G --> H
    G -. interview question generation .-> L
    H --> B
```

### Technology stack

  -----------------------------------------------------------------------
  Area                                Technologies
  ----------------------------------- -----------------------------------
  Frontend                            Next.js, React, TypeScript,
                                      Tailwind CSS, Lucide React

  Backend API                         Python, FastAPI, Uvicorn, Pydantic

  Database                            PostgreSQL, SQLAlchemy, Psycopg

  Migrations                          Alembic

  Background jobs                     Redis, RQ

  Resume processing                   PyMuPDF, python-docx, python-magic

  Repository integration              Git, GitPython, GitHub API, HTTPX

  Similarity and analysis             NumPy, scikit-learn, custom
                                      tokenization and Winnowing
                                      fingerprints

  AI integration                      Gemini API

  API type generation                 OpenAPI, openapi-typescript

  Testing and quality                 Pytest, Vitest, React Testing
                                      Library, Ruff

  Infrastructure                      Docker, Docker Compose; Neon
                                      PostgreSQL for hosted database
                                      deployment
  -----------------------------------------------------------------------

## Project Structure

The repository is organized into separate frontend and backend
applications. The main directories are:

``` text
.
├── backend/
│   ├── app/
│   │   ├── api/              # Versioned REST API routes and error handling
│   │   ├── jobs/             # Background worker and analysis pipeline
│   │   ├── models/           # SQLAlchemy database entities
│   │   ├── schemas/          # Pydantic request/response contracts
│   │   └── services/         # Resume, GitHub, repository and evidence logic
│   ├── alembic/              # Database migrations
│   ├── tests/                # Backend tests
│   ├── openapi.json          # Exported API specification
│   └── pyproject.toml        # Python project configuration
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js routes and pages
│   │   ├── components/       # Reusable UI components
│   │   └── lib/              # API client, generated types and utilities
│   ├── package.json
│   └── next.config.ts
├── compose.yaml              # Local service orchestration
├── .env.example              # Environment variable template
└── README.md
```

*This is a high-level guide to the main areas; individual files may vary
as the project evolves.*

## Getting Started

### Prerequisites

Install the following before running the project:

-   Git
-   Docker and Docker Compose
-   Python 3.12 or a compatible version specified by the backend
    configuration
-   Node.js 22 or a compatible version specified by the frontend
    configuration
-   Access credentials for the external APIs you intend to use (GitHub
    and Gemini)

### 1. Clone the repository

``` bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_DIRECTORY>
```

### 2. Configure environment variables

Create your local environment file from the supplied template:

``` bash
cp .env.example .env
```

Open `.env` and configure the values required by the application. Use
`.env.example`, `backend/app/config.py`, and the project documentation
as the source of truth for the exact variable names and defaults.

Typical configuration categories include:

-   Database connection
-   Redis connection
-   Session and administrator authentication settings
-   Allowed frontend origins
-   GitHub API token (if configured)
-   Gemini API key
-   Resume storage and resource limits

**Never commit real API keys, passwords, session secrets, or production
connection strings.**

### 3. Start infrastructure with Docker Compose

From the repository root:

``` bash
docker compose up --build
```

This starts the services configured in `compose.yaml`. Check the Compose
file for the exact service names, ports, and whether the worker is
enabled by default or through a profile.

To inspect running services:

``` bash
docker compose ps
```

To view logs:

``` bash
docker compose logs -f
```

### 4. Run database migrations

Run the Alembic migration command in the backend environment/container:

``` bash
alembic upgrade head
```

If running inside Docker, execute it in the backend API service using
its actual service name from `compose.yaml`.

### 5. Run the frontend and backend separately (optional)

If you prefer local development without the full Compose stack, install
dependencies using the lockfiles and package configuration provided by
the repository.

**Backend example:**

``` bash
cd backend
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
pip install -e .
```

Start the API using the application entry point configured in the
backend project. The health endpoint is available at:

``` text
GET /health
```

**Frontend:**

``` bash
cd frontend
npm install
npm run dev
```

Use the scripts defined in `frontend/package.json` if their names differ
from these examples.

## Main Application Workflow

### 1. Administrator authentication

The administrator signs in through the frontend. The API creates a
session and provides the CSRF token needed for protected state-changing
requests. The frontend handles expired sessions and redirects the user
to sign in again.

### 2. Resume upload and extraction

The administrator uploads candidate resumes. The backend validates file
type and content, enforces upload limits, stores files privately, and
extracts text from PDF or DOCX files.

Scanned or image-only resumes may not contain extractable text. These
are surfaced for manual project entry rather than silently treated as
complete.

### 3. Project selection and repository discovery

The system extracts project suggestions and explicit GitHub URLs where
possible. The administrator reviews the suggestions and selects one
primary project. Repository discovery prioritizes explicit resume links
and can fall back to public GitHub search.

Discovered matches are suggestions---not proof that a repository belongs
to a candidate.

### 4. Repository confirmation and analysis

The administrator must explicitly confirm a repository before starting
analysis. The API creates a background job, and the RQ worker processes
it independently. The frontend polls the job endpoint to display stage,
progress, and terminal status.

### 5. Evidence report

After successful processing, the report displays available evidence,
coverage measurements, limitations, traceable observations, repository
context, similarity matches, and suggested interview questions.

## API Workflow

The API is versioned under `/api/v1`.

  ----------------------------------------------------------------------------------------------
  Method                  Endpoint                                       Purpose
  ----------------------- ---------------------------------------------- -----------------------
  `POST`                  `/api/v1/session`                              Sign in and create an
                                                                         administrator session

  `DELETE`                `/api/v1/session`                              Sign out and invalidate
                                                                         the session

  `POST`                  `/api/v1/resume-batches`                       Upload a batch of
                                                                         resumes

  `GET`                   `/api/v1/candidates`                           List candidates

  `GET`                   `/api/v1/candidates/{id}`                      Retrieve candidate
                                                                         details

  `PUT`                   `/api/v1/candidates/{id}/selected-project`     Select the primary
                                                                         project

  `GET`                   `/api/v1/projects/{id}/repositories`           Retrieve discovered
                                                                         repository matches

  `PUT`                   `/api/v1/projects/{id}/repository-selection`   Confirm a repository

  `POST`                  `/api/v1/projects/{id}/analyses`               Enqueue an analysis job

  `GET`                   `/api/v1/jobs/{id}`                            Retrieve job status and
                                                                         progress

  `POST`                  `/api/v1/jobs/{id}/cancel`                     Cancel an active or
                                                                         queued job

  `GET`                   `/api/v1/analyses/{id}`                        Retrieve the completed
                                                                         evidence report

  `DELETE`                `/api/v1/candidates/{id}`                      Delete a candidate and
                                                                         associated data
  ----------------------------------------------------------------------------------------------

The API uses structured error responses. Protected mutation requests are
subject to the configured authentication, origin, and CSRF checks.

## Evidence Assessment: What the Score Means

The evidence coverage score measures how much relevant evidence was
available to inspect. It is not a candidate rating.

  ------------------------------------------------------------------------
  Evidence component                          Weight What it measures
  --------------------- ---------------------------- ---------------------
  History availability                           30% Availability and
                                                     completeness of
                                                     repository history

  Source inspection                              25% Availability of
                                                     inspectable source
                                                     files

  Metadata availability                          20% Availability of
                                                     repository metadata

  Reference comparison                           25% Availability of a
                                                     populated reference
                                                     catalog for
                                                     comparison

  **Total**                                 **100%** 
  ------------------------------------------------------------------------

The report can classify evidence availability as:

-   `reviewable`
-   `limited_evidence`
-   `insufficient_data`

Unavailable measurements should be shown as unavailable with a reason,
not represented as a score of zero.

## Security and Responsible Use

The project includes controls designed to protect uploaded data,
application sessions, and repository analysis infrastructure:

-   Resume extension, file signature, size, page, and archive-expansion
    validation.
-   Private resume storage using generated storage keys.
-   No resume text in application logs.
-   Session authentication, secure cookie settings, CSRF checks, and
    origin validation.
-   Login throttling and structured error responses.
-   Restricted Git transport protocols and isolated Git configuration
    during repository fetches.
-   Bounded clone concurrency, timeouts, file-size limits, and
    cumulative source inspection budgets.
-   Filtering for binary files, dependencies, generated files, and
    lockfiles.
-   Cleanup of temporary repository workspaces.
-   Sanitization of diagnostics to avoid exposing credentials.

Use the platform as a decision-support tool. A GitHub username, commit
identity, timestamp, fork, or code similarity match should not be
treated as independently verified proof of candidate identity or
authorship.

## Testing

The project includes backend and frontend automated tests.

**Backend:**

``` bash
pytest backend/tests -q
```

**Frontend:**

``` bash
cd frontend
npm test -- --run
```

The frontend test command is based on the configured Vitest setup. Check
`frontend/package.json` for the exact available scripts.

The test suites cover areas such as resume validation, project
extraction, repository discovery, Git history, similarity analysis,
evidence scoring, API authentication, job processing, and frontend
workflows.

## Development Notes

-   Keep API request and response contracts in sync with the generated
    OpenAPI types.
-   When API contracts change, regenerate frontend types using the
    configured `generate:types` script.
-   Add database changes through Alembic migrations.
-   Keep long-running repository work in the background worker rather
    than inside request handlers.
-   Preserve the administrator confirmation step before repository
    analysis.
-   Add tests when changing security checks, resource limits, or
    workflow state transitions.

## Future Improvements

Potential areas for further development include:

-   More comprehensive resume extraction and manual correction tools.
-   Better visibility into analysis-stage diagnostics for
    administrators.
-   Curated and regularly maintained reference repositories.
-   Additional language support for source inspection.
-   Expanded interview question review and editing workflows.
-   Deployment monitoring, operational alerts, and backup procedures.

## Contributing

Contributions should preserve the project's core principles: explicit
human confirmation, bounded processing, traceable evidence, clear
uncertainty, and responsible interpretation.

1.  Create a feature branch.
2.  Make a focused change.
3.  Add or update tests.
4.  Run the relevant backend and frontend test suites.
5.  Open a pull request describing the change and its impact.

## License

No license information was provided in the project materials. Add a
`LICENSE` file and update this section before distributing the project.

------------------------------------------------------------------------

::: {align="center"}
**Built to support evidence-informed human review---not replace human
judgment.**
:::
