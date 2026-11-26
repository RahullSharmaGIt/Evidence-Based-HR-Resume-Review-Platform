import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.auth import _LOCAL_SESSION_STORE, _LOCAL_THROTTLE_STORE
from app.db import Base, get_db
from app.main import app
from app.models.entities import Candidate, Project, Resume
from app.services.batch_matching import extract_criteria_terms, rank_batch_projects


@pytest.fixture
def test_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return engine


@pytest.fixture
def session_factory(test_engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture
def db_session(session_factory):
    sess = session_factory()
    yield sess
    sess.close()


@pytest.fixture
def client(session_factory):
    def override_get_db():
        sess = session_factory()
        try:
            yield sess
        finally:
            sess.close()

    app.dependency_overrides[get_db] = override_get_db
    _LOCAL_SESSION_STORE.clear()
    _LOCAL_THROTTLE_STORE.clear()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    _LOCAL_SESSION_STORE.clear()
    _LOCAL_THROTTLE_STORE.clear()


@pytest.fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    res = client.post(
        "/api/v1/session",
        json={"password": "admin123"},
        headers={"Origin": "http://localhost:3000"},
    )
    assert res.status_code == 200
    return {
        "x-csrf-token": res.json()["csrfToken"],
        "Origin": "http://localhost:3000",
    }


def _seed_candidate(
    db: Session,
    name: str,
    raw_text: str,
    projects: list[tuple[str, str | None, int | None]],
) -> Candidate:
    cand = Candidate(id=uuid.uuid4(), name=name)
    db.add(cand)
    db.flush()
    db.add(
        Resume(
            id=uuid.uuid4(),
            candidate_id=cand.id,
            original_filename=f"{name.lower().replace(' ', '_')}.pdf",
            storage_key=f"test/{cand.id}.pdf",
            content_type="application/pdf",
            raw_text=raw_text,
        )
    )
    for p_name, p_desc, p_page in projects:
        db.add(
            Project(
                id=uuid.uuid4(),
                candidate_id=cand.id,
                name=p_name,
                description=p_desc,
                source_page=p_page,
                explicit_github_urls=[],
            )
        )
    db.commit()
    db.refresh(cand)
    return cand


def test_extract_criteria_terms_filters_stopwords_and_protected_attributes():
    extracted = extract_criteria_terms(
        "Looking for a young female DevOps engineer with AWS, CI/CD, and Docker experience"
    )
    assert extracted.terms == ["devops", "aws", "ci/cd", "docker"]
    assert extracted.ignored_protected_terms == ["young", "female"]


def test_rank_batch_projects_deterministic_scoring_and_ties(db_session: Session):
    c_bob = _seed_candidate(
        db_session,
        "Bob",
        "Skills: AWS, Docker",
        [("Zeta Deploy", "Deployed Docker services to AWS with CI/CD", 1)],
    )
    c_alice = _seed_candidate(
        db_session,
        "Alice",
        "Skills: AWS, Docker, CI/CD",
        [("Alpha Pipeline", "Built CI/CD pipeline using Docker on AWS", 1)],
    )
    c_carol = _seed_candidate(
        db_session,
        "Carol",
        "Skills: AWS, Docker, CI/CD in general work",
        [("Resume Context Only", "Internal dashboard in Python", 1)],
    )
    c_dave = _seed_candidate(
        db_session,
        "Dave",
        "Skills: React, CSS",
        [("Notes App", "Simple React note-taking tool", 2)],
    )

    terms = ["aws", "docker", "ci/cd"]
    ranked, without_projects = rank_batch_projects([c_bob, c_alice, c_carol, c_dave], terms)
    assert without_projects == []

    # Alice (Alpha Pipeline) and Bob (Zeta Deploy) both score 100.0; Alice sorts before Bob
    assert [r.project_name for r in ranked] == [
        "Alpha Pipeline",
        "Zeta Deploy",
        "Resume Context Only",
        "Notes App",
    ]
    assert ranked[0].match_score == 100.0
    assert ranked[1].match_score == 100.0
    # Carol only matched in surrounding resume text (0.5 per term -> 50.0%)
    assert ranked[2].match_score == 50.0
    assert all(ev.source == "resume_text" for ev in ranked[2].evidence)
    # Notes App has 0 matches but is still returned (never hidden)
    assert ranked[3].match_score == 0.0
    assert ranked[3].unmatched_terms == ["aws", "docker", "ci/cd"]


def test_match_endpoint_auth_and_csrf(client: TestClient):
    payload = {"candidateIds": [str(uuid.uuid4())], "criteria": "Python FastAPI"}
    unauth = client.post("/api/v1/resume-batches/match", json=payload)
    assert unauth.status_code == 401

    res = client.post(
        "/api/v1/session",
        json={"password": "admin123"},
        headers={"Origin": "http://localhost:3000"},
    )
    assert res.status_code == 200
    no_csrf = client.post(
        "/api/v1/resume-batches/match",
        json=payload,
        headers={"Origin": "http://localhost:3000"},
    )
    assert no_csrf.status_code == 403


def test_match_endpoint_scopes_strictly_to_submitted_batch_and_handles_edge_cases(
    client: TestClient, session_factory, auth_headers: dict[str, str]
):
    with session_factory() as sess:
        in_batch = _seed_candidate(
            sess,
            "In Batch Dev",
            "Built containerized services with Docker and AWS.",
            [("Container Platform", "Deployed containerized services on AWS ECS with CI/CD", 1)],
        )
        no_proj = _seed_candidate(
            sess,
            "No Projects Dev",
            "Worked on various systems.",
            [],
        )
        outside_batch = _seed_candidate(
            sess,
            "Outside Batch Dev",
            "AWS Docker CI/CD Kubernetes",
            [("Previous Batch Project", "AWS Docker CI/CD Kubernetes", 1)],
        )
        unknown_id = uuid.uuid4()
        in_batch_id = str(in_batch.id)
        no_proj_id = str(no_proj.id)
        outside_batch_id = str(outside_batch.id)

    res = client.post(
        "/api/v1/resume-batches/match",
        json={
            "candidateIds": [in_batch_id, no_proj_id, str(unknown_id)],
            "criteria": "DevOps engineer with containerized services, CI/CD, AWS, and Terraform",
        },
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()

    assert data["evaluatedCandidateCount"] == 2
    assert data["unknownCandidateIds"] == [str(unknown_id)]
    assert len(data["candidatesWithoutProjects"]) == 1
    assert data["candidatesWithoutProjects"][0]["candidateName"] == "No Projects Dev"

    # Outside-batch candidate MUST NOT appear in results
    returned_candidate_ids = {r["candidateId"] for r in data["results"]}
    assert outside_batch_id not in returned_candidate_ids
    assert len(data["results"]) == 1

    top = data["results"][0]
    assert top["projectName"] == "Container Platform"
    assert "terraform" in top["unmatchedTerms"]
    assert "aws" in top["matchedTerms"]
    assert "ci/cd" in top["matchedTerms"]
    assert any(ev["source"] == "project_description" for ev in top["evidence"])


def test_match_endpoint_rejects_empty_or_protected_only_criteria(
    client: TestClient, auth_headers: dict[str, str]
):
    bad = client.post(
        "/api/v1/resume-batches/match",
        json={"candidateIds": [str(uuid.uuid4())], "criteria": "young female"},
        headers=auth_headers,
    )
    assert bad.status_code == 422
    assert bad.json()["code"] == "INVALID_CRITERIA"
