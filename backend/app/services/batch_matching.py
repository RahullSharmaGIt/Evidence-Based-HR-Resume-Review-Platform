import re
from dataclasses import dataclass
from typing import Literal

from app.models.entities import Candidate, Project

EvidenceSource = Literal["project_name", "project_description", "project_url", "resume_text"]

STOPWORDS: frozenset[str] = frozenset({
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "for", "from",
    "has", "have", "in", "into", "is", "it", "its", "of", "on", "or", "our", "out",
    "so", "such", "that", "the", "their", "them", "they", "this", "to", "was", "we",
    "were", "who", "will", "with", "you", "your",
    # Generic hiring filler words (non-technical)
    "ability", "applicant", "applicants", "background", "based", "build", "building",
    "candidate", "candidates", "comfortable", "deep", "demonstrated", "description",
    "desired", "developer", "developers", "engineer", "engineering", "engineers",
    "equivalent", "etc", "excellent", "experience", "experienced", "familiarity",
    "good", "great", "hands", "hands-on", "ideal", "including", "job", "knowledge",
    "looking", "minimum", "must", "needed", "nice", "plus", "practical", "preferred",
    "proficient", "proven", "related", "required", "requirement", "requirements",
    "responsibilities", "role", "seeking", "skill", "skills", "solid", "strong",
    "understanding", "using", "work", "working", "year", "years",
})

# Protected or sensitive attributes that must NEVER be used for matching, ranking, or filtering.
PROTECTED_TERMS: frozenset[str] = frozenset({
    "age", "aged", "elderly", "young", "youth", "senior-citizen", "dob", "birth", "birthdate",
    "race", "racial", "ethnicity", "ethnic", "caucasian", "asian", "black", "white", "hispanic",
    "latino", "latina", "latinx", "indigenous", "native",
    "religion", "religious", "christian", "catholic", "protestant", "muslim", "islamic",
    "hindu", "jewish", "buddhist", "sikh", "atheist", "agnostic",
    "disability", "disabled", "handicap", "handicapped", "impairment", "wheelchair",
    "health", "medical", "illness", "chronic", "mental",
    "sex", "gender", "male", "female", "man", "men", "woman", "women", "nonbinary",
    "non-binary", "transgender", "cisgender",
    "sexual", "orientation", "lgbt", "lgbtq", "lgbtq+", "gay", "lesbian", "bisexual",
    "heterosexual", "queer",
    "marital", "married", "single", "divorced", "widowed", "pregnant", "pregnancy",
    "maternity", "paternity", "parental",
    "nationality", "citizen", "citizenship", "immigrant", "visa", "caste", "veteran",
})

PRESERVED_SLASH_TERMS: frozenset[str] = frozenset({"ci/cd", "ui/ux", "i/o", "tcp/ip"})

TERM_ALIASES: dict[str, tuple[str, ...]] = {
    "k8s": ("kubernetes",),
    "kubernetes": ("k8s",),
    "postgres": ("postgresql",),
    "postgresql": ("postgres",),
    "js": ("javascript",),
    "javascript": ("js",),
    "ts": ("typescript",),
    "typescript": ("ts",),
    "ci/cd": ("cicd", "ci-cd", "continuous integration", "continuous deployment", "continuous delivery"),
    "containerized": ("container", "containers", "containerization", "docker"),
    "container": ("containers", "containerized", "containerization"),
    "containers": ("container", "containerized", "containerization"),
    "deploying": ("deploy", "deployed", "deployment", "deployments"),
    "deployment": ("deploy", "deployed", "deploying", "deployments"),
    "services": ("service", "microservice", "microservices"),
    "microservices": ("microservice", "services", "service"),
}

DECISION_SUPPORT_NOTICE = (
    "Decision support only: matching is derived strictly from available resume and extracted "
    "project text. It does not measure candidate quality, prove skill or authorship, or "
    "make hiring decisions. Human HR review is required for all candidates."
)

METHODOLOGY_NOTE = (
    "Coverage indicator (0-100): percentage of normalized job-related criteria terms with "
    "observed text evidence. Direct matches in project title/description/URL count 1.0; "
    "matches found only in surrounding resume text count 0.5. Protected/sensitive attributes "
    "and generic filler words are excluded."
)


@dataclass(frozen=True)
class ExtractedCriteria:
    terms: list[str]
    ignored_protected_terms: list[str]


@dataclass(frozen=True)
class EvidenceSnippet:
    term: str
    source: EvidenceSource
    excerpt: str
    source_page: int | None = None


@dataclass(frozen=True)
class RankedProjectResult:
    candidate_id: object
    candidate_name: str
    project_id: object
    project_name: str
    project_description: str | None
    source_page: int | None
    match_score: float
    project_direct_matches: int
    matched_terms: list[str]
    unmatched_terms: list[str]
    evidence: list[EvidenceSnippet]


def extract_criteria_terms(criteria: str) -> ExtractedCriteria:
    """
    Normalizes free-text job criteria into unique job-related terms while
    stripping stopwords and excluding protected/sensitive attributes.
    """
    raw_tokens = re.findall(r"[a-z0-9][a-z0-9.+#/-]*[a-z0-9]|[a-z0-9]", criteria.lower())
    expanded: list[str] = []
    for tok in raw_tokens:
        if "/" in tok and tok not in PRESERVED_SLASH_TERMS:
            expanded.extend(part for part in tok.split("/") if part)
        else:
            expanded.append(tok)

    terms: list[str] = []
    ignored_protected: list[str] = []
    seen_terms: set[str] = set()
    seen_protected: set[str] = set()

    for token in expanded:
        clean = token.strip(".,;:-")
        if len(clean) < 2 and clean not in {"c", "r"}:
            continue
        if clean in PROTECTED_TERMS:
            if clean not in seen_protected:
                seen_protected.add(clean)
                ignored_protected.append(clean)
            continue
        if clean in STOPWORDS:
            continue
        if clean not in seen_terms:
            seen_terms.add(clean)
            terms.append(clean)

    return ExtractedCriteria(terms=terms, ignored_protected_terms=ignored_protected)


def _candidate_variants(term: str) -> list[str]:
    variants = [term]
    if term in TERM_ALIASES:
        variants.extend(TERM_ALIASES[term])
    elif len(term) >= 4 and term.endswith("s") and not term.endswith("ss"):
        variants.append(term[:-1])
    elif len(term) >= 4 and not term.endswith("s"):
        variants.append(f"{term}s")
    return list(dict.fromkeys(variants))


def _find_excerpt(text: str, term: str, max_len: int = 140) -> str | None:
    if not text:
        return None
    lowered = text.lower()
    for variant in _candidate_variants(term):
        match = re.search(rf"(?<![a-z0-9]){re.escape(variant)}(?![a-z0-9])", lowered)
        if match:
            start = max(0, match.start() - 40)
            end = min(len(text), match.end() + 80)
            snippet = " ".join(text[start:end].split())
            if start > 0:
                snippet = f"...{snippet}"
            if end < len(text):
                snippet = f"{snippet}..."
            if len(snippet) > max_len:
                snippet = snippet[: max_len - 3].rstrip() + "..."
            return snippet
    return None


def _match_project(
    candidate: Candidate,
    project: Project,
    resume_text: str,
    criteria_terms: list[str],
) -> RankedProjectResult:
    urls_text = " ".join(project.explicit_github_urls or [])
    matched_terms: list[str] = []
    unmatched_terms: list[str] = []
    evidence: list[EvidenceSnippet] = []
    points = 0.0
    project_direct_matches = 0

    for term in criteria_terms:
        hit_source: EvidenceSource | None = None
        hit_excerpt: str | None = None
        hit_page = project.source_page

        for source_name, text_value in (
            ("project_name", project.name or ""),
            ("project_description", project.description or ""),
            ("project_url", urls_text),
        ):
            excerpt = _find_excerpt(text_value, term)
            if excerpt:
                hit_source = source_name  # type: ignore[assignment]
                hit_excerpt = excerpt
                break

        if hit_source and hit_excerpt:
            points += 1.0
            project_direct_matches += 1
        else:
            resume_excerpt = _find_excerpt(resume_text, term)
            if resume_excerpt:
                hit_source = "resume_text"
                hit_excerpt = resume_excerpt
                hit_page = None
                points += 0.5

        if hit_source and hit_excerpt:
            matched_terms.append(term)
            evidence.append(
                EvidenceSnippet(
                    term=term,
                    source=hit_source,
                    excerpt=hit_excerpt,
                    source_page=hit_page,
                )
            )
        else:
            unmatched_terms.append(term)

    score = round(min(100.0, (points / len(criteria_terms)) * 100.0), 1)
    return RankedProjectResult(
        candidate_id=candidate.id,
        candidate_name=candidate.name,
        project_id=project.id,
        project_name=project.name,
        project_description=project.description,
        source_page=project.source_page,
        match_score=score,
        project_direct_matches=project_direct_matches,
        matched_terms=matched_terms,
        unmatched_terms=unmatched_terms,
        evidence=evidence,
    )


def rank_batch_projects(
    candidates: list[Candidate],
    criteria_terms: list[str],
) -> tuple[list[RankedProjectResult], list[Candidate]]:
    """
    Ranks all extracted projects belonging to the supplied batch candidates
    against extracted job criteria terms deterministically.
    Returns (ranked_results, candidates_without_projects).
    """
    results: list[RankedProjectResult] = []
    without_projects: list[Candidate] = []

    for candidate in candidates:
        projects = list(candidate.projects or [])
        if not projects:
            without_projects.append(candidate)
            continue

        resume_text = "\n".join(r.raw_text or "" for r in (candidate.resumes or []))
        for project in projects:
            results.append(_match_project(candidate, project, resume_text, criteria_terms))

    results.sort(
        key=lambda r: (
            -r.match_score,
            -r.project_direct_matches,
            r.candidate_name.lower(),
            r.project_name.lower(),
            str(r.project_id),
        )
    )
    without_projects.sort(key=lambda c: (c.name.lower(), str(c.id)))
    return results, without_projects
