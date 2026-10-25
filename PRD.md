# DataDesk — Product Requirements Document

**Status:** Specification draft, not implementation evidence  
**Date:** 2026-10-14  
**Syllabus source:** `BCS714D Syllabus copy.pdf`, three pages, read in full  
**Related files:** [Architecture.md](Architecture.md), [tasks.md](tasks.md), [design.md](design.md), [memory.md](memory.md), [rules.md](rules.md)

## 1. Product summary

DataDesk is a single-machine, browser-based big-data laboratory. It combines dataset registration, HDFS file operations, approved Hadoop MapReduce jobs, analytical result exploration, and experiment provenance in one interface. It is intended for one undergraduate developer and demonstrable coursework, not production or multi-node scale claims.

**Recommended title:** *DataDesk: A Traceable Big Data Analytics Workspace Using MongoDB, Hadoop HDFS, and MapReduce.*

**Distinctive contribution hypothesis:** an integrated evidence trail may make it easier for a student or evaluator to verify where an analytical result came from and reproduce it than a workflow that records outputs without consistently linking dataset identity, checksum, job configuration, runtime, and output artifacts. This is a hypothesis to compare against related systems, not a proven novelty claim.

## 2. Source-of-truth and syllabus boundary

The BCS714D syllabus names two practical activities:
1. Implement a MongoDB-based application to store big data for processing and analyzing results (15 marks in the syllabus copy).
2. Install Hadoop and implement HDFS file/directory adding, retrieval, deletion, and MapReduce programs (10 marks in the syllabus copy).

Theory topics also include big-data fundamentals, analytics categories, traditional BI versus Hadoop, NoSQL, Hadoop, HDFS, YARN, Mapper, Reducer, Combiner, Partitioner, searching, sorting, compression, MongoDB query language, Hive, Pig, Spark, machine learning, text mining, web mining, web usage analytics, PageRank, and web graphs.

**Acceptance boundary:** MongoDB-backed dataset metadata and analytics plus working HDFS CRUD-like operations and actual Hadoop MapReduce execution are mandatory. Hive, Pig, Spark, and machine learning are optional extensions, not gates for accepting the core.

## 3. Problem statement

Students often demonstrate storage, distributed-file operations, batch processing, and result visualization as disconnected tasks. That makes it difficult to inspect the exact input version, parameters, runtime, and output behind a displayed result. DataDesk will join these tasks while keeping the storage and processing responsibilities of MongoDB and Hadoop explicit.

## 4. Aim and objectives

**Aim:** design and evaluate a reproducible, syllabus-aligned workspace for local big-data experiments.

Objectives:
- Register dataset metadata in MongoDB and store dataset bytes in HDFS.
- Calculate SHA-256 checksums and preserve immutable dataset-version records.
- Provide safe HDFS directory and file creation, listing, retrieval, and deletion workflows.
- Execute a small allowlist of versioned Java MapReduce jobs on Hadoop.
- Persist run configuration, lifecycle events, logs, input version IDs, output paths, and result summaries.
- Show result tables/charts and export a report containing provenance.
- Compare equivalent MongoDB aggregation and Hadoop MapReduce results on deterministic fixtures.
- Measure correctness, elapsed time, output size, and local resource use without claiming cluster-scale performance.

## 5. Scope

### In scope — core
- One local user; no production identity or multi-tenant system.
- CSV and newline-delimited JSON input, with strict size and schema limits.
- Synthetic deterministic datasets and one suitable public dataset after license/format review.
- MongoDB Community Server for metadata, job records, and small/medium summaries.
- HDFS for source datasets and generated output directories.
- Hadoop MapReduce jobs: word/category count; grouped count/sum/average for structured rows; deterministic top-N built from grouped results.
- HDFS directory/file operations through validated backend methods.
- MongoDB aggregation implementation for an equivalent subset of supported analytics.
- Experiment details page, status/logs, comparison report, downloadable CSV/JSON and provenance manifest.
- Docker Compose for local Linux containers controlled from Windows/VS Code.

### Out of scope
- Recreating Windows, Linux, or Google Workspace.
- Production security, public deployment, multi-user collaboration, enterprise identity, or internet-facing Hadoop services.
- Cloud services, paid services, a physical cluster, Kubernetes, microservices, and custom distributed storage.
- Arbitrary shell commands, arbitrary user-submitted JARs, arbitrary code execution, or unrestricted HDFS paths.
- Claims that one-node HDFS provides real distributed fault tolerance or representative cluster performance.
- MongoDB's deprecated MapReduce API; use aggregation pipelines instead.
- Required Hive/Pig/Spark/ML integration in the core milestone.

## 6. Users and primary journey

**Primary user:** an undergraduate student demonstrating the BCS714D practicals to a faculty evaluator.

1. Open the dashboard and choose a generated sample dataset.
2. Register/upload it; DataDesk computes checksum and creates a version record.
3. Inspect its metadata and HDFS location.
4. Browse HDFS; create a project directory, retrieve a file, and delete only a selected project-owned path.
5. Select a registered dataset version and approved job; review validated parameters.
6. Submit the job and observe queued/running/succeeded/failed state.
7. Inspect the output table/chart and the full experiment evidence trail.
8. Run the equivalent MongoDB aggregation and compare canonicalized results.
9. Export a report containing source checksum, job ID, parameters, tool versions, timings, correctness comparison, and output manifest.

## 7. Research questions and measurable methods

| ID | Research question | Measurement / acceptance method |
|---|---|---|
| RQ1 | Can the workspace preserve a verifiable link from result to source dataset version, configuration, execution, and output? | Trace 100% of successful fixture runs to valid IDs, SHA-256, parameters, logs/status, and output manifest; automated integrity tests. |
| RQ2 | Do equivalent MongoDB aggregation and Hadoop MapReduce implementations produce the same supported results? | Exact equality after deterministic normalization for integer counts/sums; declared floating-point tolerance for averages; adversarial fixtures. |
| RQ3 | How do elapsed time and resource use differ between the two implementations on a single machine? | At least 5 repeated trials per size and engine; report median, IQR, CPU/memory samples, bytes read/written, warm/cold-cache caveat. |
| RQ4 | How does input size affect completion time and output size for the approved batch jobs? | Fixed job/config; at least three deterministic input sizes; repeated trials; no extrapolation to clusters. |
| RQ5 | Can safe lifecycle handling avoid dangling records and unintended deletion during failures? | Fault injection at upload/registration/job/output/cleanup boundaries; assert recoverable states and no deletion outside a managed prefix. |
| RQ6 | Can a first-time evaluator complete the core demonstration with low ambiguity? | Task-based usability walkthrough with 3–5 volunteers if permitted; completion rate, errors, time, short feedback. If unavailable, report as unmeasured. |

## 8. Functional requirements and acceptance criteria

| ID | Requirement | Acceptance criterion |
|---|---|---|
| FR-01 | Register dataset | Successful registration stores dataset ID, version ID, name, media type/format, bytes, SHA-256, record count when parseable, created time, status, and HDFS path. |
| FR-02 | Duplicate detection | Same checksum and byte size is flagged as duplicate; user can link to existing immutable version or explicitly create a separate logical registration without duplicating bytes. |
| FR-03 | Upload lifecycle | States include `pending_upload`, `stored`, `failed`, `deleting`, `deleted`; interrupted operations are reconciled on restart. |
| FR-04 | HDFS explorer | Create/list directories, upload/add files, retrieve/download files, and delete managed paths. All operations return structured success/error details. |
| FR-05 | Safe path handling | Reject traversal, root deletion, paths outside `/datadesk/`, symlinks where applicable, and unrecognized paths. Recursive delete requires confirmation and ownership validation. |
| FR-06 | Job catalog | UI exposes only versioned, approved jobs with typed, bounded parameters and documented input schemas. |
| FR-07 | Job execution | Backend launches actual Hadoop jobs, captures Hadoop/YARN application ID when available, status, timestamps, exit status, logs, input version, output path, and tool versions. |
| FR-08 | Output safety | Each run receives a unique output directory; existing paths are never silently overwritten. Failed outputs are marked incomplete and never presented as valid results. |
| FR-09 | Result exploration | Show summary cards, tabular output, appropriate chart, invalid-record count, and downloadable output. |
| FR-10 | MongoDB analytics | Implement aggregation-pipeline equivalents for the supported analytics; no MongoDB MapReduce API. |
| FR-11 | Comparison | Compare normalized keys/counts/sums; report exact mismatch rows and numerical tolerance for non-integer metrics. |
| FR-12 | Provenance | Every result record references dataset version/checksum, job definition version, normalized parameters, runtime image/version, run ID, output path and checksum/manifest, timestamps, and status. |
| FR-13 | Reproduction | “Re-run” creates a new run referencing the same immutable dataset version and job/config fingerprint; it never mutates the earlier record. |
| FR-14 | Report export | Export a report plus machine-readable JSON manifest; include failures and limitations rather than hiding them. |
| FR-15 | Cleanup | Cleanup can remove only DataDesk-owned run outputs after a preview; metadata transitions are recorded and reconciled. |
| FR-16 | Demo fixtures | One command generates byte-identical deterministic fixtures for fixed seed/version. |

## 9. Non-functional requirements

- **Reproducibility:** pinned dependency and container image versions/digests; documented commands; deterministic fixtures; immutable run records.
- **Correctness:** tests cover parsers, aggregation logic, MapReduce output normalization, checksums, lifecycle transitions, and path validation.
- **Safety:** no arbitrary command input; parameter allowlists; bounded upload size, runtime, output size, and concurrent jobs.
- **Usability:** a clear left navigation, dataset/job status indicators, explicit confirmation for destructive actions, keyboard access, and understandable error messages.
- **Accessibility:** WCAG 2.2 AA target; keyboard-only operation; visible focus; semantic labels; non-color status cues; chart data tables; contrast verification.
- **Performance:** target local demo response for metadata views under 1 s at p95 with 1,000 metadata records; treat as a target to measure, not a fact. Long-running batch work is asynchronous.
- **Portability:** Windows host + Docker Desktop/WSL 2; no native Windows Hadoop installation requirement.
- **Observability:** structured logs with correlation/run IDs; secrets and file contents excluded from logs.
- **Maintainability:** modular backend adapters; no unnecessary microservices; tests and architecture decisions documented.

## 10. Core analytical jobs

1. **Frequency count:** tokenize or group a selected field; output key/count. Combiner permitted only for associative/commutative aggregation.
2. **Grouped metrics:** count and sum by a selected categorical key; optional average derived from sum/count. Partitioning and sorting documented.
3. **Top-N:** run from grouped output or implement deterministic secondary ordering; define tie-break order explicitly.

At least one job must make the roles of Mapper, Reducer, and optionally Combiner/Partitioner inspectable. Include a test demonstrating that a Combiner is an optimization, not a semantic requirement.

## 11. Error and lifecycle semantics

- **Invalid rows:** configurable policy `reject-run` or `skip-and-count`; default `skip-and-count` for the teaching jobs, with rejected-row count and bounded sample of errors. The same policy applies to both engines.
- **Duplicate upload:** checksum-based detection; do not overwrite an existing dataset version.
- **Interrupted upload:** mark pending/failed; reconcile temp HDFS path and MongoDB record during startup recovery.
- **Job failure:** persist failure status, exit code, truncated logs, and incomplete output state; preserve diagnostic output under managed namespace until cleanup.
- **Missing output:** run is not `succeeded`; mark `failed_output_missing` and surface a repairable error.
- **Deletion:** two-phase metadata transition; verify path is within DataDesk prefix; delete HDFS bytes; finalize metadata; reconciliation repairs incomplete transitions. No cross-store transaction is assumed.
- **MongoDB unavailable:** disable registration/job submission; do not write untracked HDFS data except a bounded temporary upload area with reconciliation.
- **HDFS unavailable:** reject destructive and submission operations; preserve metadata and report degraded state.

## 12. Evaluation acceptance gates

- **Core practical gate:** demonstrate MongoDB registration/aggregation; actual Hadoop job; HDFS add/list/get/delete; HDFS directory creation/deletion; downloadable output.
- **Provenance gate:** every successful run has a complete, checksum-verifiable lineage manifest.
- **Correctness gate:** all fixed fixtures match expected outputs; MongoDB/Hadoop equivalent jobs match after documented normalization.
- **Failure gate:** injected failures leave no falsely successful run and no deletion outside managed paths.
- **Research gate:** report measured results only from recorded trials; show dataset sizes, repeats, machine details, versions, medians/IQR, and limitations.

## 13. Success definition

The project succeeds when all core practical gates pass, evidence can be traced end-to-end, the local setup is reproducible on the target Windows machine, and the evaluation clearly distinguishes measurements from estimates. Optional ecosystem integrations do not affect core acceptance.

## 14. Evidence labels

- **Verified fact:** supported by the syllabus or cited primary/official source.
- **Proposed design:** a specification decision not yet implemented.
- **Research hypothesis:** a claim to evaluate empirically or through comparison.
- **Unverified assumption:** a dependency or hardware detail awaiting local verification.
- **Optional extension:** not required for core acceptance.
