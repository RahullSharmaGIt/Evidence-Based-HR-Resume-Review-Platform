import uuid
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel

T = TypeVar("T")


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class ConfidenceCategory(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ContractModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class Measurement[T](ContractModel):
    """
    Represents a measured value.
    Unavailable measurements MUST be represented as null with a reason, never zero.
    """

    value: T | None = None
    reason: str | None = None

    @model_validator(mode="after")
    def check_unavailable_has_reason(self) -> "Measurement[T]":
        if self.value is None and not self.reason:
            raise ValueError(
                "Unavailable measurement must have a non-empty reason explaining why value is null."
            )
        return self


class ProjectSuggestion(ContractModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    name: str
    description: str | None = None
    explicit_github_urls: list[str] = Field(default_factory=list)
    source_page: int | None = None


class RepositoryMatch(ContractModel):
    url: str
    owner: str
    name: str
    discovery_reason: str
    confidence_category: str  # e.g., 'high', 'medium', 'low'


class EvidenceItem(ContractModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    kind: str
    summary: str
    source_url: str | None = None
    commit_sha: str | None = None
    path: str | None = None


class AnalysisReport(ContractModel):
    schema_version: str = "1.0.0"
    analyzed_commit_sha: str | None = None
    repository: dict[str, Any]
    history: dict[str, Any]
    similarity: dict[str, Any]
    assessment: dict[str, Any]
    evidence: list[EvidenceItem] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class ErrorResponse(ContractModel):
    code: str
    message: str
    request_id: str


class SessionCreateRequest(ContractModel):
    password: str


class SessionResponse(ContractModel):
    status: str = "ok"
    csrf_token: str


class BatchUploadItem(ContractModel):
    filename: str
    candidate_id: uuid.UUID | None = None
    status: str
    projects_count: int = 0
    error: str | None = None
    code: str | None = None


class BatchUploadResponse(ContractModel):
    total: int
    successful: list[BatchUploadItem] = Field(default_factory=list)
    failed: list[BatchUploadItem] = Field(default_factory=list)


class BatchProjectMatchRequest(ContractModel):
    candidate_ids: list[uuid.UUID] = Field(min_length=1, max_length=50)
    criteria: str = Field(min_length=2, max_length=5000)

    @field_validator("criteria")
    @classmethod
    def validate_criteria_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError("Criteria must contain at least 2 non-whitespace characters.")
        return cleaned


class MatchEvidenceItem(ContractModel):
    term: str
    source: Literal["project_name", "project_description", "project_url", "resume_text"]
    excerpt: str
    source_page: int | None = None


class RankedProjectMatch(ContractModel):
    candidate_id: uuid.UUID
    candidate_name: str
    project_id: uuid.UUID
    project_name: str
    project_description: str | None = None
    source_page: int | None = None
    match_score: float = Field(ge=0.0, le=100.0)
    matched_terms: list[str] = Field(default_factory=list)
    unmatched_terms: list[str] = Field(default_factory=list)
    evidence: list[MatchEvidenceItem] = Field(default_factory=list)


class CandidateWithoutProjects(ContractModel):
    candidate_id: uuid.UUID
    candidate_name: str


class BatchProjectMatchResponse(ContractModel):
    criteria_terms: list[str]
    ignored_protected_terms: list[str] = Field(default_factory=list)
    methodology_note: str
    decision_support_notice: str
    evaluated_candidate_count: int
    unknown_candidate_ids: list[uuid.UUID] = Field(default_factory=list)
    candidates_without_projects: list[CandidateWithoutProjects] = Field(default_factory=list)
    results: list[RankedProjectMatch] = Field(default_factory=list)


class ResumeSummary(ContractModel):
    id: uuid.UUID
    original_filename: str
    content_type: str
    file_size_bytes: int | None = None
    created_at: str

    @field_validator("created_at", mode="before")
    @classmethod
    def coerce_created_at(cls, v: Any) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        if v is None:
            return datetime.now(UTC).isoformat()
        return str(v)


class ProjectSummary(ContractModel):
    id: uuid.UUID
    candidate_id: uuid.UUID
    name: str
    description: str | None = None
    is_selected: bool = False
    explicit_github_urls: list[str] = Field(default_factory=list)
    source_page: int | None = None
    created_at: str

    @field_validator("explicit_github_urls", mode="before")
    @classmethod
    def coerce_urls(cls, v: Any) -> list[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [str(x) for x in v if x is not None]
        return []

    @field_validator("created_at", mode="before")
    @classmethod
    def coerce_created_at(cls, v: Any) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        if v is None:
            return datetime.now(UTC).isoformat()
        return str(v)


class VivaQuestion(ContractModel):
    id: int = Field(ge=1, le=10)
    category: Literal[
        "Architecture & Design",
        "Implementation Details",
        "Edge Cases & Failure Modes",
        "Security & Trade-offs",
        "Testing & Evolution",
    ]
    question: str = Field(min_length=10)
    expected_answer: str = Field(min_length=20)
    key_signals: list[str] = Field(min_length=2, max_length=3)
    red_flags: list[str] = Field(min_length=1, max_length=2)


class VivaQuestionsResponse(ContractModel):
    project_id: uuid.UUID
    project_title: str
    generated_at: datetime
    source: Literal["gemini", "fallback"]
    questions: list[VivaQuestion] = Field(min_length=10, max_length=10)

    @field_validator("questions")
    @classmethod
    def require_ordered_ten_questions(cls, questions: list[VivaQuestion]) -> list[VivaQuestion]:
        if [question.id for question in questions] != list(range(1, 11)):
            raise ValueError("Viva questions must be numbered from 1 to 10 in order.")
        return questions


class CandidateSummary(ContractModel):
    id: uuid.UUID
    name: str
    email: str | None = None
    selected_project_id: uuid.UUID | None = None
    resumes_count: int = 0
    projects_count: int = 0
    created_at: str
    updated_at: str

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def coerce_timestamps(cls, v: Any) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        if v is None:
            return datetime.now(UTC).isoformat()
        return str(v)


class CandidateDetailResponse(ContractModel):
    id: uuid.UUID
    name: str
    email: str | None = None
    selected_project_id: uuid.UUID | None = None
    resumes: list[ResumeSummary] = Field(default_factory=list)
    projects: list[ProjectSummary] = Field(default_factory=list)
    created_at: str
    updated_at: str

    @field_validator("created_at", "updated_at", mode="before")
    @classmethod
    def coerce_timestamps(cls, v: Any) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        if v is None:
            return datetime.now(UTC).isoformat()
        return str(v)


class SelectProjectRequest(ContractModel):
    project_id: uuid.UUID


class RepositorySelectionResponse(ContractModel):
    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    owner: str
    name: str
    discovery_reason: str
    confidence_category: str
    is_confirmed: bool
    created_at: str


class ConfirmRepositoryRequest(ContractModel):
    repository_selection_id: uuid.UUID


class BenchmarkRepositorySummary(ContractModel):
    id: uuid.UUID
    repository_url: str
    owner: str
    name: str
    primary_language: str
    description: str | None = None
    license: str | None = None
    stars_count: int = 0
    default_branch: str = "main"
    pinned_commit_sha: str
    indexing_status: str
    failure_reason: str | None = None
    indexed_at: str | None = None
    fingerprints_count: int = 0


class BenchmarkProjectResponse(ContractModel):
    id: uuid.UUID
    category: str
    name: str
    description: str | None = None
    repository: BenchmarkRepositorySummary | None = None
    created_at: str
    updated_at: str


class AnalysisJobResponse(ContractModel):
    id: uuid.UUID
    repository_selection_id: uuid.UUID
    status: str
    stage: str | None = None
    progress: int = 0
    started_at: str | None = None
    completed_at: str | None = None
    failure_code: str | None = None
    error_message: str | None = None
    selected_repository_url: str | None = None
    analyzed_commit_sha: str | None = None
    created_at: str
    updated_at: str
