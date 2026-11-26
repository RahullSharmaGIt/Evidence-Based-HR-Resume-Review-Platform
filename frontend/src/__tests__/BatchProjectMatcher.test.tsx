import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BatchProjectMatcher } from "../components/BatchProjectMatcher";
import * as api from "../lib/api";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    matchResumeBatchProjects: vi.fn(),
  };
});

describe("BatchProjectMatcher Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty eligible message when all uploads in batch failed", () => {
    render(
      <BatchProjectMatcher
        batchItems={[
          {
            filename: "broken.pdf",
            status: "failed",
            projectsCount: 0,
            error: "Malformed PDF",
          },
        ]}
      />
    );

    expect(screen.getByTestId("batch-no-eligible-candidates")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Match Projects Against Criteria/i })).not.toBeInTheDocument();
  });

  it("validates criteria, scopes request to successful candidate IDs, and renders ranked evidence", async () => {
    const mockResponse: api.BatchProjectMatchResponse = {
      criteriaTerms: ["devops", "aws", "ci/cd", "terraform"],
      ignoredProtectedTerms: [],
      methodologyNote: "Coverage indicator (0-100)",
      decisionSupportNotice: "Decision support only: requires human HR review.",
      evaluatedCandidateCount: 2,
      unknownCandidateIds: [],
      candidatesWithoutProjects: [
        {
          candidateId: "cand-2",
          candidateName: "No Project Candidate",
        },
      ],
      results: [
        {
          candidateId: "cand-1",
          candidateName: "Alice Dev",
          projectId: "proj-1",
          projectName: "Cloud Deployer",
          projectDescription: "Automated AWS ECS deployments with CI/CD",
          sourcePage: 1,
          matchScore: 50.0,
          matchedTerms: ["aws", "ci/cd"],
          unmatchedTerms: ["devops", "terraform"],
          evidence: [
            {
              term: "aws",
              source: "project_description",
              excerpt: "Automated AWS ECS deployments with CI/CD",
              sourcePage: 1,
            },
          ],
        },
      ],
    };

    vi.mocked(api.matchResumeBatchProjects).mockResolvedValueOnce(mockResponse);

    render(
      <BatchProjectMatcher
        batchItems={[
          {
            filename: "alice.pdf",
            status: "succeeded",
            candidateId: "cand-1",
            projectsCount: 1,
          },
          {
            filename: "bob.pdf",
            status: "succeeded",
            candidateId: "cand-2",
            projectsCount: 0,
          },
          {
            filename: "scanned.pdf",
            status: "failed",
            projectsCount: 0,
            error: "Scanned PDF",
          },
        ]}
      />
    );

    expect(screen.getByTestId("batch-partial-failure-notice")).toHaveTextContent(
      "2 resume(s) succeeded"
    );

    const submitBtn = screen.getByRole("button", {
      name: /Match Projects Against Criteria/i,
    });

    // Empty submission validation
    fireEvent.click(submitBtn);
    expect(screen.getByRole("alert")).toHaveTextContent("at least 2 characters");
    expect(api.matchResumeBatchProjects).not.toHaveBeenCalled();

    // Valid criteria submission
    const input = screen.getByLabelText(/Job Description or Hiring Criteria/i);
    fireEvent.change(input, { target: { value: "DevOps AWS CI/CD Terraform" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.matchResumeBatchProjects).toHaveBeenCalledWith({
        candidateIds: ["cand-1", "cand-2"],
        criteria: "DevOps AWS CI/CD Terraform",
      });
    });

    expect(screen.getByTestId("batch-match-results")).toBeInTheDocument();
    expect(screen.getByText("Cloud Deployer")).toBeInTheDocument();
    expect(screen.getByText("Alice Dev")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getByTestId("candidates-without-projects-notice")).toHaveTextContent(
      "No Project Candidate"
    );
    expect(screen.getByText(/Project Description · p\.1/i)).toBeInTheDocument();
  });

  it("displays and dismisses API errors cleanly", async () => {
    vi.mocked(api.matchResumeBatchProjects).mockRejectedValueOnce(
      new Error("Please enter at least one job-related skill.")
    );

    render(
      <BatchProjectMatcher
        batchItems={[
          {
            filename: "alice.pdf",
            status: "succeeded",
            candidateId: "cand-1",
            projectsCount: 1,
          },
        ]}
      />
    );

    fireEvent.change(screen.getByLabelText(/Job Description or Hiring Criteria/i), {
      target: { value: "experience" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /Match Projects Against Criteria/i })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter at least one job-related skill."
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
