# DataDesk — Project Rules and Change-Control Policy

**Status:** Governing rules for specification and future implementation  
**Related:** [PRD.md](PRD.md), [Architecture.md](Architecture.md), [tasks.md](tasks.md), [design.md](design.md), [memory.md](memory.md)

## 1. Source-of-truth precedence

When requirements conflict, use this order:
1. The supplied `BCS714D Syllabus copy.pdf` for course boundaries and mandatory practicals.
2. These six DataDesk specification files for approved project scope and decisions.
3. Verified official documentation and original academic sources for external facts.
4. Implementation and test evidence for claims about what actually works.
5. Convenience, preference, or speculative suggestions.

Never silently rewrite a higher-priority requirement. Record conflicts and ask for a decision if they materially change feasibility or architecture.

## 2. Mandatory syllabus compliance

- MongoDB-based application for big-data storage, processing, and analysis is mandatory.
- Hadoop HDFS file/directory creation, retrieval, deletion, and real MapReduce execution are mandatory.
- Mapper, Reducer, Combiner, Partitioner, HDFS, YARN, and relevant Hadoop behavior must be demonstrated or explicitly documented.
- Hive, Pig, Spark, and machine learning are optional extensions unless the project supervisor explicitly changes acceptance scope.
- Do not claim the project covers every theory topic merely because a tool is named in the syllabus.

## 3. Windows compatibility boundary

- Windows and VS Code are the host workflow.
- Use Docker Desktop with WSL 2 Linux containers for Hadoop and MongoDB when feasible.
- Do not assume Hadoop is natively supported on Windows just because VS Code runs there.
- No cloud account, paid hosted service, physical cluster, institutional infrastructure, Kubernetes, or native Linux installation may be required.
- Verify Windows build, virtualization, WSL, Docker, image origin/license, versions, Java compatibility, and hardware before locking the stack.
- Pin exact versions and preferably container digests; never rely on `latest` for reproducibility.

## 4. Research integrity

- Never fabricate citations, authors, titles, venues, DOIs, findings, measurements, or quotes.
- Open the original source or a trustworthy bibliographic record before marking a citation verified.
- Clearly distinguish peer-reviewed research, books, standards, and vendor/project documentation.
- Do not call the project novel or first without a documented comparison with close alternatives.
- Treat the provenance contribution as a hypothesis until evidence supports a narrower claim.
- Separate verified facts, proposed design, research hypotheses, unverified assumptions, optional extensions, measured results, and estimates.
- Do not reuse external paper benchmark numbers as DataDesk measurements.
- Include source links and access dates for mutable technical documentation.

## 5. Storage and execution boundaries

- MongoDB stores dataset metadata, immutable version records, job/run metadata, lifecycle events, and bounded analytical summaries.
- HDFS stores raw dataset bytes and MapReduce outputs.
- Hadoop MapReduce must actually execute the approved jobs.
- Use MongoDB aggregation pipelines; never use MongoDB's deprecated MapReduce functionality.
- The backend is the only layer allowed to orchestrate MongoDB/HDFS/Hadoop operations.
- Do not allow arbitrary shell commands, arbitrary JARs, or unrestricted user-supplied paths.

## 6. Safe file operations

- Every application-managed path must resolve under `/datadesk/`.
- Normalize and validate paths before use; reject traversal, root deletion, and paths outside the managed prefix.
- Resolve file IDs to server-side paths; do not trust raw client paths for destructive actions.
- Never overwrite an existing dataset version or Hadoop output directory silently.
- Every run uses a unique output path.
- Recursive delete requires a preview and explicit confirmation.
- Never delete files or directories not created/registered as DataDesk-managed resources.
- Reset scripts must state exactly which containers and volumes they remove and require explicit confirmation.

## 7. Data integrity and lifecycle

- Calculate SHA-256 checksums and store exact byte size.
- Treat dataset versions and completed run records as immutable.
- Do not assume atomic transactions across MongoDB and HDFS.
- Use explicit lifecycle states and idempotent recovery/reconciliation.
- A run is successful only after exit success and output existence/manifest verification.
- If output is missing, mark failure; do not display a success badge.
- Record malformed-row policy, accepted/rejected counts, and parser version.
- Preserve failed-run diagnostics only within a bounded, managed namespace and define cleanup.
- Never expose file contents or secrets in logs.

## 8. Reproducibility rules

Every run must record dataset version ID and checksum, job ID/version, normalized parameters, configuration fingerprint, tool/runtime versions, timestamps, status, logs reference, output path, output manifest/checksum, and measured metrics when available.

- Reproduction creates a new run; it never mutates historical evidence.
- Deterministic fixtures use fixed seeds and schema versions.
- Equivalent MongoDB and MapReduce jobs must share parsing, null, invalid-record, grouping, and ordering semantics.
- State numeric tolerance before comparing floating-point outputs.
- Keep trial count, warm-up/cache state, machine details, and environment versions in reports.
- Never extrapolate local single-machine results to distributed clusters.

## 9. Security and local exposure

- Bind API and admin UIs to localhost by default.
- Do not publish Hadoop admin ports to the LAN or internet.
- Bound upload size, run duration, concurrency, output size, log size, and result pagination.
- Validate all job parameters against static schemas.
- Do not commit credentials, `.env`, private datasets, raw logs, volumes, or generated outputs.
- Use `.env.example` with placeholders; secrets belong only in local ignored configuration.
- Document that the baseline is a local teaching lab, not a hardened multi-user system.

## 10. Testing discipline

- Specify tests before asserting a feature works.
- Unit-test parsers, checksums, path guards, configuration canonicalization, lifecycle transitions, and output normalization.
- Integration-test MongoDB, HDFS, and actual Hadoop job execution.
- End-to-end-test both syllabus practicals.
- Inject failures at upload, metadata write, job launch, output verification, and deletion boundaries.
- Test empty, malformed, duplicate, large-but-allowed, Unicode, and adversarial-path inputs.
- Record exact commands and outputs; do not report “passed” without evidence.
- A smoke test in a clean environment is mandatory before accepting deployment.

## 11. Change discipline

- Do not implement during Phases 0–5.
- Keep each task bounded and tied to a PRD requirement or decision ID.
- Before architecture-changing work, update Architecture.md and explain the trade-off.
- Update tasks.md when dependencies or acceptance gates change.
- Update memory.md with evidence, date, exact versions, decisions, and unresolved issues.
- Update design.md for interaction/state/accessibility changes.
- Update PRD.md only for approved scope/acceptance changes.
- Never copy files or project-specific assumptions from unrelated projects.
- Review `git diff --check`, `git status --short`, tests, and generated-file hygiene before committing.

## 12. Stop conditions

Stop and ask for a decision when:
- The syllabus source is missing or contradictory.
- Host hardware cannot run the minimum local stack.
- The chosen Hadoop image is unmaintained, unlicensed/unclear, or incompatible with Java/Hadoop requirements.
- An architectural decision depends on unknown host constraints.
- A citation cannot be verified or a novelty claim is contradicted by a comparable system.
- A proposed operation could delete data outside the managed namespace.
- A failure could create untraceable outputs or falsely successful runs.

## 13. Completion claims

Use only these statuses: `NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `PASS`, `FAIL`, or `NOT MEASURED`.

- A written design is not an implementation.
- A container starting is not proof a Hadoop job works.
- A job exiting zero is not proof output correctness.
- A correct output is not proof performance superiority.
- A list of citations is not a completed literature review until sources and comparables have been checked.
