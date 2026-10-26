# DataDesk — Phased Tasks and Verification Gates

**Status:** Planning only; no application implementation authorized yet.  
**Related:** [PRD.md](PRD.md), [Architecture.md](Architecture.md), [design.md](design.md), [memory.md](memory.md), [rules.md](rules.md)

## Working agreement

- One developer; Windows + VS Code; Docker Desktop/WSL 2 for Linux services.
- Complete each gate before starting dependent work.
- No implementation until Phases 0–5 have been reviewed and accepted.
- Every task must have evidence: command output, test output, cited source, or explicit `not verified` status.
- Keep core MongoDB + HDFS + MapReduce ahead of optional Hive/Pig/Spark.

## Phase 0 — Source and feasibility audit

### P0.1 Syllabus audit
- [x] Locate and read all three pages of `BCS714D Syllabus copy.pdf`.
- [x] Record two mandatory practical activities and all five-module topics in `PRD.md`.
- [x] Separate required core from optional ecosystem extensions.

**Gate P0:** source file read; scope matches syllabus. **Status: PASS** for document audit.

### Mandatory work order (approved Phase 1 exception)
1. Compatibility checks (Phase 4 smoke test: MongoDB health, HDFS put/get/delete, YARN job submission, MapReduce output retrieval, clean restart) — must pass before any stack decision.
2. Minimal backend stack decision — choose language/framework and Hadoop image only after compatibility evidence; do not select without evidence.
3. Phase 1 ingestion (`backend-dataset-ingestion`) — only after steps 1 and 2 pass.

### P0.2 Hardware and host audit — complete (read-only verification, 2026-10-26)
- [x] Captured Windows edition/build, CPU model/logical processors, installed RAM, free disk, virtualization state, WSL version, Docker Desktop version.
- [x] Ran `wsl --version`, `docker version`, `docker compose version`, and `docker info` from PowerShell.
- [x] Confirm Linux containers can start and stop. — PASS (2026-10-26): ran pinned `alpine:3.20` container `docker run --rm --name datadesk-smoke-test alpine:3.20 sh -c "echo smoke-ok && exit 0"`; output `smoke-ok`; container exited 0; `--rm` removed it; confirmed absent in `docker ps -a`.
- [x] Estimated disk headroom: ~64.6 GB free on C: — sufficient for baseline planning.
- [x] MongoDB smoke test — PASS (2026-10-26): started pinned `mongo:7` (digest sha256:c53852c00c23ca9f23fc39690350ffa9a80e3642fe8f96879726d8da0abe80a7) on localhost:27017; insert/read/delete/verify-delete of one test document in `datadesk_smoke_test.smoke_test` all succeeded; container removed with `docker rm -f`; unrelated containers untouched.

Verified results:
- OS: Windows 10.0.26300.9711
- CPU: AMD Ryzen 7 5700U with Radeon Graphics, 8 cores / 16 logical processors
- RAM: 16,455,815,168 bytes ≈ 15.32 GB installed (≈16 GB)
- Free disk (C:, repository drive): 69,328,719,872 bytes ≈ 64.6 GB free; 441,470,394,368 bytes used
- WSL: 2.6.3.0, kernel 6.6.8.7.2-1; distro `docker-desktop` version 2
- Docker Desktop: engine 29.9.2, Compose v5.6.1; daemon reachable (linux x86_64) earlier in session
- Virtualization: WSL 2 + Docker Linux containers demonstrated operational in Step 0; WMI `VMMonitorModeExtensions` reads `False` on this AMD CPU (known ambiguous/unreliable on AMD; not conclusive against virtualization). Caveat recorded: availability is inferred from prior successful WSL 2/Docker Linux operation, not re-verified in this session.

**Gate P0-HW:** do not finalize data sizes until hardware is recorded. Minimum Docker documentation baseline is 8 GB RAM, SLAT-capable 64-bit CPU, and BIOS/UEFI virtualization; 16 GB is a planning preference, not an official minimum [W1].

## Phase 1 — Literature and gap validation

### P1.1 Literature audit
- [x] Establish an initial source set in `memory.md` with original/official links.
- [ ] Open and verify the original/bibliographic records for all 15–20 sources.
- [ ] Mark each entry primary research, standard/specification, book, or technical documentation.
- [ ] Record what each source does and does not establish.

### P1.2 Comparable-system matrix
- [ ] Compare workflow/provenance systems, Hadoop tools, database analytics, and educational workspaces using consistent criteria: source linking, immutable dataset identity, run config capture, output integrity, reproduce action, Windows setup, core syllabus coverage.
- [ ] Search for directly comparable integrated student-facing systems before stating a gap.
- [ ] Rewrite novelty claim based on evidence; narrow it if comparison is inconclusive.

**Gate P1:** at least 15 verified sources; all citations resolve; comparison matrix completed; novelty described as hypothesis unless supported by direct evidence. No fabricated gap claims.

## Phase 2 — Requirements and product specification

### P2.1 Requirements review
- [ ] Review every FR/NFR with a faculty evaluator or peer if available.
- [ ] Confirm supported input formats and maximum upload size against hardware.
- [ ] Define canonical result normalization and floating-point tolerance.
- [ ] Confirm invalid-row policy and dataset deletion/dependency behavior.

### P2.2 Acceptance tests first
- [ ] Write black-box test cases for both syllabus practicals.
- [ ] Define fixtures for duplicates, malformed records, empty inputs, ties, Unicode, nulls, interrupted upload, missing output, and deletion rejection.
- [ ] Map each test to PRD requirement IDs.

**Gate P2:** all mandatory requirements are testable and no acceptance criterion depends on optional Hive/Pig/Spark/ML.

## Phase 3 — UX and design specification

### P3.1 Screen and interaction specification
- [ ] Finalize dashboard, dataset registry/detail, HDFS explorer, job catalog, run monitor, results/comparison, settings/help screens.
- [ ] Write success/error/empty/loading states for each screen.
- [ ] Specify destructive confirmations and accessible status messaging.

### P3.2 Accessibility review
- [ ] Check contrast for text, controls, focus indicators, chart colors, and status states against WCAG 2.2 AA.
- [ ] Specify keyboard-only workflows and semantic labeling.
- [ ] Ensure charts have tabular equivalents and color is never the sole signal.

**Gate P3:** a reviewer can walk through the full user journey using `design.md` without inventing missing states.

## Phase 4 — Technical architecture and Windows deployment verification

### P4.1 Version/image compatibility spike (disposable environment only)
- [ ] Verify supported Windows version, WSL 2, virtualization, and Docker Desktop licensing for intended use.
- [ ] Choose exact Hadoop image/release, Java runtime, MongoDB Community image, and frontend/backend runtime.
- [ ] Record licenses, image publisher, tags, digests, release notes, and compatibility evidence.
- [ ] Run MongoDB health check and create/read/delete a test record.
- [ ] Run HDFS mkdir, put, list, get, compare checksum, and delete.
- [ ] Compile and execute a real MapReduce word-count or grouped-count job; verify output.
- [ ] Restart containers and verify intended persistence.

### P4.2 Operational safety
- [ ] Test service unavailability, job timeout, nonzero exit, output missing, and interrupted upload.
- [ ] Verify all host ports bind to loopback unless a specific local-only exception is justified.
- [ ] Confirm path guard rejects traversal and paths outside `/datadesk/`.

**Gate P4:** a fresh checkout can run the documented smoke test; no unverified compatibility claims remain; chosen images are pinned. If this fails, stop and revise architecture before implementation.

## Phase 5 — Directory structure, implementation plan, and test strategy

### P5.1 Freeze directory layout
- [ ] Create repository layout from the accepted Architecture.md.
- [ ] Keep frontend, backend, Hadoop jobs, deployment, fixtures, docs, and tests logically separated without splitting into microservices.
- [ ] Add `.env.example`, Compose file, pinned dependencies, license inventory, and ignore rules.

### P5.2 Define test pyramid
- [ ] Unit tests: parser, checksum, canonicalization, path guard, state transitions, job parameter validation.
- [ ] Integration tests: MongoDB, HDFS adapter, Hadoop job execution, result manifest, restart reconciliation.
- [ ] End-to-end tests: both practical demonstrations and complete provenance chain.
- [ ] Fault-injection tests: upload interruption, metadata write failure, job failure, output missing, HDFS unavailable, deletion failure.
- [ ] Performance protocol: deterministic datasets, warm-up, at least five repeated trials, median/IQR, system details.

**Gate P5:** no application feature work until the six specification files are reviewed, directory/test plan is approved, and Phase 4 deployment smoke test passes.

## Implementation phases after this assignment (not authorized yet)

1. **I1 Lab skeleton:** Compose, health checks, local-only exposure, reset protections.
2. **I2 Storage foundation:** MongoDB models, HDFS adapter, path guard, lifecycle reconciliation.
3. **I3 Dataset registry:** upload, checksum, duplicate detection, version detail.
4. **I4 HDFS explorer:** mkdir/list/put/get/delete with confirmation.
5. **I5 MapReduce catalog:** one job, status/log capture, unique output, manifest.
6. **I6 Analytics parity:** equivalent MongoDB aggregation and MapReduce grouped count/sum; correctness tests.
7. **I7 Results and provenance UX:** charts/tables, evidence detail, reproducibility action, report export.
8. **I8 Validation:** fault injection, accessibility, full syllabus demonstration, measured evaluation.
9. **I9 Optional extensions:** Hive/Pig/Spark only if time and compatibility permit.

## Required verification commands (adapt only after stack is chosen)

### Host checks
```powershell
wsl --version
docker version
docker compose version
docker info
```

### Repository checks
- Run formatter/linter and static type checks for selected stack.
- Run unit tests before integration tests.
- Run integration tests against disposable containers.
- Run the complete end-to-end suite after a clean Compose restart.
- Run `git diff --check` and inspect `git status --short` before committing.

No command is reported as passed until its output is captured in `memory.md` or a linked test report.

## Definition of done for every task

- Requirement ID referenced.
- Code/documentation changes scoped and reviewed.
- Tests written before feature-completion claims.
- Success and failure paths checked.
- No secret, dataset, logs, volume, or generated output accidentally committed.
- Evidence recorded with date, versions, and exact command.
