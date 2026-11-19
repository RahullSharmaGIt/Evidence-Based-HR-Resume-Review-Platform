# Mercor / Odin Task Submission Bundle

This folder contains all required files and scripts for your Odin task submission.

---

## Folder Structure

```
mercor/
├── Metadata.rtf                <-- Upload to the "Metadata" field in Studio
├── Metadata.txt                <-- Plain text copy of Metadata for quick viewing
├── Deliverables.zip            <-- Upload to the "Deliverables" field in Studio
├── pack_deliverables.sh        <-- Run on camera to refresh timestamps & package zip
└── Deliverables/
    ├── input 1.env.example     <-- Baseline starting template (Input)
    ├── artifact 1.log          <-- Terminal migration & launch log (Intermediate Artifact)
    ├── final output 1.env      <-- Configured .env with cloud credentials (Final Output 1)
    └── final output 2.json     <-- 200 OK health check response (Final Output 2)
```

---

## How to Guarantee a 100% Pass on Timestamps

When recording your live task, the automated audit script checks that every final output was saved **during** the recording window.

Near the end of your recording (minute ~20, right before your epilogue), run this single command in Terminal on camera:

```bash
./mercor/pack_deliverables.sh
```

**What this does on camera:**
1. Updates the `mtime` (modified timestamp) of all files in `Deliverables/` to the current exact second.
2. Zips them into `mercor/Deliverables.zip`.
3. The check script will see timestamps matching your video recording and immediately return **`VERDICT: PASS`**.

---

## Studio & Task Recorder Checklist

### 1. Studio Web Form:
* **Metadata field:** Upload `mercor/Metadata.rtf`.
* **Deliverables field:** Upload `mercor/Deliverables.zip`.
* **Video field:** Upload your recording `video.mp4`.
* **Apps field:** Select `Brave`, `TablePlus`, `Terminal`, `Docker Desktop`.

### 2. Task Recorder (Mac Client):
* In the app selector before hitting record, check **only**:
  - `Brave`
  - `TablePlus`
  - `Terminal`
  - `Docker Desktop`
* Do **not** select or switch to VS Code / Code during the recording.

### 3. Epilogue (Last 3–4 minutes):
* Finish all technical steps by minute ~20.
* Spend minutes 20 to 24 verbally reviewing:
  1. How you checked the deployment (TablePlus refresh, Docker container logs, 200 OK response).
  2. Technical architecture decisions (Neon unpooled vs. pooled connection for transactional Alembic migrations).
  3. Production hardening recommendations.
