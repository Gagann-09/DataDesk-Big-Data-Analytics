# DataDesk — Research Memory, Evidence, and Decisions

**Status:** Research log and decision register; specification only  
**Last updated:** 2026-10-14  
**Source-of-truth syllabus:** `BCS714D Syllabus copy.pdf`, 3 pages, read in full.

## 1. Evidence labels

- **Verified fact:** directly supported by a primary or authoritative source listed below.
- **Proposed design:** a choice recommended for DataDesk but not implemented.
- **Research hypothesis:** a proposition to test; not an established result.
- **Unverified assumption:** requires a local test or further research.
- **Optional extension:** outside the core acceptance gate.

## 2. Syllabus findings — verified from supplied PDF

- Course: Big Data Analytics, code BCS714D, Semester 7.
- Objectives include MapReduce programming; storage/processing using MongoDB, Pig, Hive and Spark; and analytics with machine learning techniques.
- Module 1: data classification, big-data characteristics/evolution, traditional BI versus big data, warehouse/Hadoop environment, analytics classifications, technologies, NoSQL and Hadoop.
- Module 2: Hadoop, HDFS, YARN, MapReduce, Mapper, Reducer, Combiner, Partitioner, searching, sorting, compression.
- Module 3: MongoDB concepts, RDBMS comparison, data types and query language.
- Module 4: Hive architecture/types/formats/HQL/RC File/UDF; Pig architecture, Pig Latin, execution modes, HDFS commands, relational operators, complex types, Piggy Bank, UDF and Hive comparison.
- Module 5: Spark and data analysis; text/web mining, web content/usage analytics, PageRank and web graphs.
- Practical 1: MongoDB application to store big data for processing and analysis (15 marks in the PDF).
- Practical 2: Hadoop installation and HDFS file/directory add/retrieve/delete operations plus MapReduce programs (10 marks in the PDF).
- The course outcome includes Hadoop programs, deploying MapReduce/Pig/Hive/Spark programs, and extracting insights from datasets.

## 3. Initial research assessment

### Hypothesis — traceability contribution
A useful contribution may be the student-facing integration of immutable input identity, SHA-256 checksum, validated job configuration, execution status/logs, output manifest, correctness comparison, and one-click re-run into one coherent local workflow. This is not yet demonstrated to be novel. Workflow systems and provenance standards already cover important parts of this territory. The contribution must be framed as a focused educational integration and evaluated against explicitly chosen comparable systems.

### Important research caveat
Do not claim “first,” “unique,” “novel system,” or “no existing tool does this” without a systematic comparison. Provenance itself is not new; W3C PROV-DM explicitly models entities, activities, derivations, agents, and collections [P1].

## 4. Literature and authoritative source inventory

The table below is an initial verified-source set. Before final academic submission, reopen each original record, check citation metadata and current version, and add access dates to the report. The `Connection` and `Limitations` columns are critical reading notes, not claims that a paper tested DataDesk.

| ID | Source / year / venue | Problem and method/system | Key contribution supported by source | Limitation for DataDesk / connection | Type |
|---|---|---|---|---|---|
| L1 | Dean, J. & Ghemawat, S. “MapReduce: Simplified Data Processing on Large Clusters.” OSDI 2004, pp. 137–150. https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/ | Simplifies large-scale batch data processing using map and reduce functions. | Formalizes key/value map and reduce model and runtime-managed parallel execution. | Foundational processing model, not a student-facing provenance workspace; informs approved job design. | Primary research |
| L2 | Dean, J. & Ghemawat, S. “MapReduce: Simplified Data Processing on Large Clusters.” *Communications of the ACM* 51(1), 2008, 107–113. DOI: https://doi.org/10.1145/1327452.1327492 | Journal version of MapReduce system description. | Explains programming model and runtime design. | Does not establish DataDesk novelty; use alongside OSDI original and avoid treating versions as independent findings. | Peer-reviewed article |
| L3 | Abouzeid, A., Bajda-Pawlikowski, K., Abadi, D. J., Silberschatz, A. & Rasin, A. “HadoopDB: An Architectural Hybrid of MapReduce and DBMS Technologies for Analytical Workloads.” *PVLDB* 2(1), 2009, 922–933. https://www.vldb.org/pvldb/vol2/vldb09-861.pdf | Hybrid DBMS/MapReduce architecture for analytical workloads. | Explores combining database execution with MapReduce and compares workload approaches. | Cluster-oriented architecture; not a small integrated educational UX. Warns against simplistic “MongoDB always faster/Hadoop always scales” conclusions. | Primary research |
| L4 | Stonebraker, M. et al. “MapReduce and Parallel DBMSs: Friends or Foes?” *Communications of the ACM* 53(1), 2010, 64–71. Bibliographic record: https://dblp.org/rec/journals/cacm/StonebrakerADPMPR10 | Debate/comparison of MapReduce and parallel database systems. | Frames workload-dependent trade-offs between general batch processing and database systems. | Not a benchmark of this stack; motivates fair, equivalent-workload comparison. | Research/position article |
| L5 | Pavlo, A. et al. “A Comparison of Approaches to Large-Scale Data Analysis.” SIGMOD 2009, pp. 165–178. Bibliographic record: https://dblp.org/rec/conf/sigmod/PavloPADS09 | Empirical comparison of MapReduce and parallel database systems on analytical workloads. | Provides a benchmark-based comparison framework. | Old systems/hardware; results must not be reused as modern local performance predictions. | Primary research |
| L6 | Moreau, L. & Missier, P. (eds.). “PROV-DM: The PROV Data Model.” W3C Recommendation, 2013. https://www.w3.org/TR/prov-dm/ | Interoperable representation of provenance. | Models entities, activities, agents, derivations, bundles, and collections. | Generic model, not a finished UI or complete reproducibility engine; provides conceptual basis for run lineage. | Standard/specification |
| L7 | W3C. “PROV-O: The PROV Ontology.” W3C Recommendation, 2013. https://www.w3.org/TR/prov-o/ | RDF ontology for representing PROV data. | Makes provenance relationships interoperable in ontology form. | DataDesk need not implement RDF/OWL; use the concepts, not unnecessary ontology infrastructure. | Standard/specification |
| L8 | W3C. “PROV-N: The Provenance Notation.” W3C Recommendation, 2013. https://www.w3.org/TR/prov-n/ | Human-readable notation for PROV statements. | Provides readable syntax for provenance descriptions. | A full PROV-N serializer is optional; JSON evidence manifest is simpler for core UX. | Standard/specification |
| L9 | W3C. “PROV-Overview.” W3C Working Group Note, 2013. https://www.w3.org/TR/prov-overview/ | Overview of the provenance document family. | Explains interoperable provenance exchange and family of specifications. | Overview rather than empirical system evaluation; use for definitions. | Standard/specification |
| L10 | Apache Software Foundation. “Apache Hadoop 3.5.0 Documentation.” 2026. https://hadoop.apache.org/docs/r3.5.0/index.html | Official Hadoop release documentation. | Identifies Hadoop 3.5.0 release and major changes; server-side Java 17 requirement is stated. | Documentation, not research evidence or proof a chosen Docker image works on the target host. | Technical documentation |
| L11 | Apache Software Foundation. “Setting up a Single Node Cluster.” Current Hadoop docs. https://hadoop.apache.org/docs/current/hadoop-project-dist/hadoop-common/SingleCluster.html | Single-node HDFS/MapReduce setup. | Official guide for simple HDFS and MapReduce testing. | Single node cannot demonstrate physical distributed resilience or cluster scaling. | Technical documentation |
| L12 | Apache Software Foundation. “Apache Hadoop YARN.” Current Hadoop docs. https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html | YARN resource management and scheduling. | Describes ResourceManager, NodeManager, and per-application ApplicationMaster roles. | YARN presence in a local deployment does not imply a multi-node cluster. | Technical documentation |
| L13 | MongoDB, Inc. “Aggregation Pipeline.” MongoDB Manual. https://www.mongodb.com/docs/manual/core/aggregation-pipeline/ | Document-oriented transformation and aggregation. | Pipeline stages filter, group, transform, and aggregate documents; the manual notes legacy map-reduce is deprecated since MongoDB 5.0. | MongoDB aggregation and Hadoop jobs are not automatically semantically equivalent; DataDesk must align parsing/null/invalid-row behavior. | Technical documentation |
| L14 | Apache Software Foundation. “Introduction to Apache Hive.” Updated 2024-12-12. https://hive.apache.org/docs/latest/introduction-to-apache-hive/ | SQL-like data warehouse layer over distributed storage. | Documents SQL analytics, supported formats, HDFS integration, and execution options. | Optional extension; adding Hive may expand compatibility and memory burden. | Technical documentation |
| L15 | Apache Software Foundation. “Apache Pig — About and Documentation.” https://pig.apache.org/about.html ; https://pig.apache.org/docs/latest/index.html | Data-flow language for large datasets. | Pig Latin expresses transformations and can compile to distributed jobs. | Optional and not required for core practical acceptance; verify release compatibility before adoption. | Technical documentation |
| L16 | Apache Software Foundation. “Spark SQL, DataFrames and Datasets Guide.” Current docs. https://spark.apache.org/docs/latest/sql-programming-guide.html | Structured processing through SQL/DataFrame/Dataset APIs. | Describes structured interfaces and optimizer opportunities. | Optional; Spark adds another runtime and should not delay core Hadoop MapReduce. | Technical documentation |
| L17 | Docker, Inc. “Docker Desktop on Windows — Install.” Current docs. https://docs.docker.com/desktop/setup/install/windows-install/ | Windows setup and hardware/software prerequisites. | Documents WSL 2 requirements, supported Windows versions, virtualization, and minimum 8 GB RAM. | Requirements change; recheck before setup and distinguish product licensing from image licenses. | Technical documentation |
| L18 | Docker, Inc. “Docker Desktop WSL 2 Backend on Windows.” Current docs. https://docs.docker.com/desktop/features/wsl/ | WSL 2 backend operation. | Describes Linux-kernel-backed containers and WSL minimum version. | Host performance and available RAM must be tested locally; not a guarantee all chosen images fit. | Technical documentation |
| L19 | Sandve, G. K., Nekrutenko, A., Taylor, J. & Hovig, E. “Ten Simple Rules for Reproducible Computational Research.” *PLOS Computational Biology* 9(10), 2013, e1003285. DOI: https://doi.org/10.1371/journal.pcbi.1003285 | Practical principles for reproducible computational research. | Emphasizes documenting software versions, parameters, and computational steps so results can be reproduced. | General guidance, not an evaluation of DataDesk or a big-data platform; informs evidence manifest and trial protocol. | Peer-reviewed methods article |
| L20 | Microsoft. “Install WSL.” Current documentation. https://learn.microsoft.com/windows/wsl/install | Windows Subsystem for Linux installation. | Official installation and update route for WSL. | Does not replace Docker Desktop compatibility and project-specific container smoke tests. | Technical documentation |

**Bibliographic verification note:** L1–L5 and L19 are academic/research sources; L6–L9 are standards/specifications; L10–L18 and L20 are official technical documentation. This is a mixed 20-source evidence set, not a 20-paper peer-reviewed survey. Phase 1 must broaden the academic subset and verify close comparable systems before the research-gap claim can pass. L4 and L5 bibliographic records still require a final metadata check before publication.

## 5. Critical comparison matrix

| System/source family | Storage / execution | Provenance model | Re-run / verification | Local Windows feasibility | Implication for DataDesk |
|---|---|---|---|---|---|
| Apache Hadoop + HDFS | HDFS + YARN/MapReduce | Job counters/logs and filesystem paths exist, but application-level dataset version/checksum lineage must be designed. | Possible through job resubmission; app must preserve parameters and input identity. | Linux containers under WSL 2 are a plausible route; actual image must be tested. | Use Hadoop for real syllabus execution and wrap it with evidence capture. |
| MongoDB aggregation | Document storage and pipeline analytics | Dataset/run provenance is application-defined. | Pipeline can be saved/versioned by application. | Official Community image is a candidate; pin exact version/digest. | Store metadata and execute equivalent aggregation pipelines; never use deprecated MapReduce API. |
| HadoopDB | Hybrid database and MapReduce system | Research architecture targets analytical processing; not a direct DataDesk UI comparison. | Workload/system dependent. | Likely too complex for the single-student baseline. | Use as motivation for fair database/batch comparison, not as a dependency. |
| W3C PROV family | Data model and interchange standard | Explicit entities, activities, agents, and derivations. | Supports provenance representation, not execution by itself. | Technology-agnostic. | Borrow lineage concepts; JSON manifest is sufficient for initial scope. |
| Hive / Pig / Spark | Higher-level analytics engines | Their own execution metadata varies; integration would need further provenance mapping. | Possible but increases integration surface. | Must verify exact release/image compatibility. | Optional extensions after core gates. |
| Docker Desktop + WSL 2 | Local Linux-container runtime | Not an analytics provenance system. | Enables repeatable environment configuration when images are pinned. | Officially supported subject to current host prerequisites. | Use for Windows accessibility; never claim native Windows Hadoop support. |

## 6. Research gap and novelty statement

**Defensible provisional gap:** this project will investigate whether a compact undergraduate-oriented interface can make evidence lineage across MongoDB metadata/aggregation and Hadoop HDFS/MapReduce easier to inspect and reproduce within a constrained Windows-accessible lab.

This is a *design and evaluation question*, not an established literature gap. Existing provenance standards already define general models, and workflow systems may provide extensive lineage/reproducibility features. Phase 1 must identify the closest comparable platforms and test the claim against them. If existing tools already provide the same integrated workflow, describe DataDesk as an educational integration and usability evaluation rather than a novel provenance method.

## 7. Research methodology decisions

- Generate deterministic synthetic CSV/JSONL fixtures with fixed seeds and documented schema.
- Start with 1 MB, 10 MB, and 50 MB fixtures as provisional sizes; revise after the hardware audit. These are proposed test sizes, not performance results.
- Add a public dataset only after reviewing license, privacy, schema, download stability, and size. Record its source URL, retrieval date, version if available, and checksum.
- Run at least five measured trials per engine/size/job after one warm-up; report median and IQR, not only the best run.
- Compare semantically equivalent results after key sorting and explicit numeric tolerance.
- Record host CPU/RAM, Windows/WSL/Docker versions, image digests, Java/Hadoop/MongoDB versions, concurrency, input/output bytes, row rejection counts, elapsed time, and resource measurement method.
- Do not compare results across different parser policies, cache states, configurations, or hardware without explaining the confounders.
- Do not extrapolate single-machine measurements to cluster-scale performance.

## 8. Resource estimate — unverified planning range

- **Minimum documented Docker Desktop host baseline:** 8 GB RAM, 64-bit CPU with SLAT, virtualization enabled, supported Windows build, WSL 2.1.5 or later [W1, W2].
- **Preferred planning target:** 16 GB RAM and at least 20–30 GB free disk for images, volumes, fixtures, logs, and outputs. This is a project estimate, not a vendor requirement.
- **Constrained mode:** one-at-a-time jobs, small datasets, low parallelism, no optional Hive/Pig/Spark, no large public dataset.
- Actual memory use depends heavily on selected images and JVM heap configuration; measure during Phase 4.

## 8a. Verified hardware audit results (2026-10-26)

Read-only PowerShell/WMI verification:
- Total physical RAM: 16,455,815,168 bytes ≈ 15.32 GB installed (≈16 GB) — PASS
- CPU: AMD Ryzen 7 5700U with Radeon Graphics, 8 cores / 16 logical processors — PASS
- Free disk on C: (repository drive): 69,328,719,872 bytes ≈ 64.6 GB free; 441,470,394,368 bytes used — PASS
- Hardware virtualization: WSL 2 (kernel 6.6.8) and Docker Desktop Linux containers demonstrated operational earlier; `VMMonitorModeExtensions` WMI property reads `False` on AMD (known ambiguous/unreliable on AMD; not conclusive). Caveat: availability is inferred from prior successful WSL 2/Docker Linux operation, not re-verified in this session. — PASS (with caveat)

## 8b. Docker smoke test results (2026-10-26)

Read-only disposable-container verification (no MongoDB, no Hadoop, no application code):

- docker info: ServerVersion=29.9.2, OSType=linux, Architecture=x86_64, KernelVersion=6.6.87.2-microsoft-standard-WSL2, OS=linux — PASS
- Image: alpine:3.20 (digest sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc)
- Command: docker run --rm --name datadesk-smoke-test alpine:3.20 sh -c "echo smoke-ok && exit 0"
- Output: smoke-ok; container exited 0; removed by --rm; confirmed absent in `docker ps -a` — PASS
- No images, volumes, or other containers pruned or touched. Unrelated pre-existing containers (neuroscan_*, synth_patient_api) left untouched.

## 8c. MongoDB smoke test results (2026-10-26)

Disposable-container verification using official image (no Hadoop, no application code):

- docker info: Server=29.9.2 OS=linux Arch=x86_64 Containers=4 Running=0 — PASS
- Image: docker.io/library/mongo:7, digest sha256:c53852c00c23ca9f23fc39690350ffa9a80e3642fe8f96879726d8da0abe80a7
- Container: datadesk-mongo-smoke-test, bound to 127.0.0.1:27017 (localhost only)
- Readiness: mongosh ping succeeded on attempt 1 — PASS
- Insert (db datadesk_smoke_test, collection smoke_test): acknowledged:true, insertedId ObjectId('6adf0c9f3dc90845b5119019') — PASS
- Read: document returned matching testId 'datadesk-smoke' — PASS
- Delete: acknowledged:true, deletedCount:1 — PASS
- Verify deletion: findOne returned null — PASS
- Cleanup: docker rm -f datadesk-mongo-smoke-test; confirmed absent in docker ps -a; unrelated containers untouched — PASS

## 8d. Hadoop image research and compatibility smoke test results (2026-10-26)

### Candidate research (before running)
- Selected image: `apache/hadoop:3.5.0` — official image published by The Apache Software Foundation (hub.docker.com/r/apache/hadoop, "By The Apache Software Foundation", Sponsored OSS, 1M+ pulls, updated 6 months ago).
- Source repository: https://gitbox.apache.org/repos/asf/hadoop.git (linked from official Hadoop docs).
- License: Apache License 2.0 (ASF project).
- Hadoop version: 3.5.0 (first stable 3.5 line release, 2026-04-02) — matches Architecture.md §7 version candidate.
- Java: 17.0.18 (openjdk), JAVA_HOME=/opt/java/openjdk — satisfies Hadoop 3.5.0 server-side Java 17 requirement (Architecture.md §7).
- Resolved image digest: sha256:46980ea1653eb3453d9cf43c4b7cb69c4729e19612d4902da0372d11e11a7a12 (linux/amd64, 758.76 MB).
- Alternatives considered and rejected: crs4/hadoop (max 3.2.1, Java 8, community, older), bde2020/hadoop (3.2.1, Java 8, older) — predate the Java 17 requirement.
- Compatibility concern noted: official image is designed for multi-node docker-compose (one daemon per container); used a single pseudo-distributed container (NameNode + DataNode + ResourceManager + NodeManager) per Architecture.md §7 simplest-first-build allowance. Image entrypoint `/opt/starter.sh` only configures and executes "$@" — daemons started manually via `hdfs --daemon start` / `yarn --daemon start`.

### Disposable compatibility test (container `datadesk-hadoop-smoke-test`, localhost-bound, removed after test)
- Prerequisite: namenode formatted via `hdfs namenode -format -nonInteractive` — PASS
- Daemons running (jps): NameNode 216, DataNode 304, ResourceManager 393, NodeManager 553 — PASS
- Image tag: docker.io/apache/hadoop:3.5.0; resolved digest sha256:46980ea1653eb3453d9cf43c4b7cb69c4729e19612d4902da0372d11e11a7a12
- Hadoop version reported: Hadoop 3.5.0, source repo https://github.com/apache/hadoop.git -r dbcc7cd797100e6b32cd84f85b53a5193a5f9af0, compiled 2026-03-24
- HDFS mkdir `/datadesk-smoke-test`: PASS
- HDFS put `smoke-input.txt` (65 bytes): PASS
- HDFS list `/datadesk-smoke-test/`: PASS (1 item, 65 bytes)
- HDFS get `smoke-input.txt` to local, content identical to input (diff match): PASS
- HDFS delete `-r /datadesk-smoke-test`: PASS (path reports "No such file or directory" after delete)
- MapReduce wordcount (genuine, via YARN): `hadoop jar /opt/hadoop/share/hadoop/mapreduce/hadoop-mapreduce-examples-3.5.0.jar wordcount /mr-smoke-input /mr-smoke-output`
  - Input: 4 lines / 48 bytes (hello world, hello hadoop, world test, hello world)
  - Job counters: 1 map, 1 reduce, bytes read 48, bytes written 32, no shuffle errors — PASS
  - Output `_SUCCESS` present + part-r-00000: `hadoop 1`, `hello 3`, `test 1`, `world 3` — correct and deterministic — PASS
- HDFS test data cleaned (`/mr-smoke-output`, `/mr-smoke-input` removed): PASS
- Cleanup: `docker rm -f datadesk-hadoop-smoke-test`; container absent in `docker ps -a`; unrelated containers (neuroscan_*, synth_patient_api) untouched — PASS

No images, volumes, or other containers pruned. No backend implemented. No long-running stack started.

## 8e. Evidence boundary — verified smoke tests vs untested application integration (2026-10-26)

**Verified smoke-test results (disposable containers, localhost-only, removed after test):**
- Docker daemon reachable; pinned `alpine:3.20` container ran `echo smoke-ok`, exited 0, removed by `--rm`, confirmed absent in `docker ps -a` (§8b).
- MongoDB `mongo:7` on 127.0.0.1:27017 (digest sha256:c53852c00c23ca9f23fc39690350ffa9a80e3642fe8f96879726d8da0abe80a7): mongosh ping, insert, read, delete, verify-delete all PASS; container removed with `docker rm -f` (§8c).
- Hadoop `apache/hadoop:3.5.0` (digest sha256:46980ea1653eb3453d9cf43c4b7cb69c4729e19612d4902da0372d11e11a7a12; Java 17.0.18): NameNode/DataNode/ResourceManager/NodeManager running; HDFS mkdir/put/list/get/delete PASS with byte-identical get verification; genuine MapReduce wordcount via YARN PASS (`hello 3, world 3, hadoop 1, test 1`, `_SUCCESS` present); HDFS test data cleaned; container removed with `docker rm -f` (§8d).

### WebHDFS compatibility test — verified (2026-10-26)

**Environment:** disposable container `datadesk-webhdfs-test`, image `apache/hadoop:3.5.0` digest sha256:46980ea1653eb3453d9cf43c4b7cb69c4729e19612d4902da0372d11e11a7a12, NameNode HTTP + DataNode HTTP bound to `127.0.0.1` only (ports 50070/50075), container removed with `docker rm -f` after test; unrelated containers untouched.

**Configuration required (image default is empty):** `core-site.xml` `fs.defaultFS=hdfs://localhost:9000`; `hdfs-site.xml` `dfs.namenode.rpc-address=localhost:9000`, `dfs.namenode.http-address=0.0.0.0:50070`, `dfs.namenode.http-bind-host=0.0.0.0`, `dfs.datanode.http-bind-host=0.0.0.0`, `dfs.webhdfs.enabled=true`. Without `fs.defaultFS` the NameNode fails to start (`file:///` has no authority).

**Test flow (all WebHDFS HTTP API, run from inside the container so datanode redirect addresses resolve; user `?user.name=hadoop` because the container OS user `dr.who` lacks WRITE on `/`):**
1. `GET` `dfs.webhdfs.enabled` → `true` (reachable).
2. `PUT /webhdfs/v1/datadesk/webhdfs-test?op=MKDIRS&user.name=hadoop` → HTTP 200 `{"boolean":true}` (directory created under `/datadesk/`).
3. `PUT .../hello.txt?op=CREATE&overwrite=true&user.name=hadoop` → HTTP 307 redirect to datanode `http://0576234225be:9864/webhdfs/v1/...?op=CREATE...`; `PUT -T /tmp/hello.txt` to redirect → HTTP 201 `Created`, location `hdfs://localhost:9000/datadesk/webhdfs-test/hello.txt`.
4. `GET .../hello.txt?op=OPEN&user.name=hadoop` (follow redirect) → downloaded file SHA-256 `c45bf4c918fd2e8310d58a5704ab1d7eded1292018b2a0b6fdfba017634c15d8` equals locally computed SHA-256 `c45bf4c918fd2e8310d58a5704ab1d7eded1292018b2a0b6fdfba017634c15d8`; `cmp` byte-compare = MATCH (48 bytes).
5. `GET ...?op=LISTSTATUS&user.name=hadoop` → file listed (length 48, owner `hadoop`, type `FILE`).
6. `DELETE .../hello.txt?op=DELETE&user.name=hadoop` → HTTP 200 `{"boolean":true}`.
7. `DELETE ...?op=DELETE&recursive=true&user.name=hadoop` → HTTP 200 `{"boolean":true}`.
8. `GET ...?op=GETFILESTATUS&user.name=hadoop` → HTTP 404 `FileNotFoundException` ("File does not exist: /datadesk/webhdfs-test").

**Result:** WebHDFS safely performs the complete required flow (enabled check, mkdir under `/datadesk/`, HTTP upload, byte-exact read-back with independent SHA-256, list, delete file, delete directory). **CONFIRMED** as a viable HDFS client.

**Caveats (operational, not a blocker):** (a) image ships with empty `core-site.xml`/`hdfs-site.xml`, so `fs.defaultFS` and HTTP bind addresses must be configured before the NameNode starts; (b) WebHDFS defaults to the calling OS user — the backend must run as a user with `/datadesk/` write permission or pass `?user.name=`; (c) the CREATE/OPEN redirect targets the datanode by container hostname, reachable from inside the container network; a host-based backend calling via published ports needs the datanode data port mapped or a reverse proxy. The Hadoop CLI adapter remains the documented fallback and is unchanged.

**Untested / not implemented (application integration — do not claim as verified):**
- Node.js 22 LTS + TypeScript + Express 5 backend — not implemented, not smoke-tested as a service stack.
- Official MongoDB Node.js driver usage in application code — not implemented.
- Docker Compose multi-service startup and persistence across restart — not verified (P4 restart-persistence check pending).
- Vitest + Supertest tests — not written.
- Any backend application integration with MongoDB, HDFS, or Hadoop — not started.

No application code was written, no dependencies were installed, and no services were started beyond the disposable smoke-test containers above, all of which were removed after testing.

## 9. Decisions log

| Decision | Status | Rationale |
|---|---|---|
| MongoDB stores metadata and summaries; HDFS stores raw inputs and job outputs | Proposed | Makes storage responsibilities explicit and avoids huge MongoDB documents. |
| Use aggregation pipelines rather than MongoDB MapReduce | Verified design constraint | MongoDB documents legacy MapReduce deprecation from v5.0 [M1]. |
| Use actual Hadoop MapReduce jobs | Mandatory | Directly satisfies the syllabus practical. |
| Use Docker Desktop + WSL 2, not native Windows Hadoop assumption | Proposed and official docs support route | Hadoop's official single-node guide documents GNU/Linux as supported platform; Windows host can orchestrate Linux containers. |
| Provenance is a research hypothesis, not proven novelty | Accepted | General provenance is well established by W3C PROV and workflow research. |
| Hive, Pig, Spark, ML are optional | Accepted | Keeps core feasible while acknowledging syllabus topics. |
| No app implementation in this assignment | Accepted | User explicitly requires six-file specification first. |
| Backend stack: Node.js 22 LTS + TypeScript, Express 5 REST API, official MongoDB Node.js driver, Vitest + Supertest | Proposed | Lightweight single-backend baseline per rules.md §5; no microservices/Redis/Kafka/K8s/ORM; pin versions at implementation. Application integration not implemented or smoke-tested. |
| MongoDB image: `mongo:7` digest sha256:c53852c00c23ca9f23fc39690350ffa9a80e3642fe8f96879726d8da0abe80a7 | Verified (2026-10-26, §8c) | Official image; insert/read/delete/verify-delete on localhost:27017 all PASS; container removed after test. |
| Hadoop image: `apache/hadoop:3.5.0` digest sha256:46980ea1653eb3453d9cf43c4b7cb69c4729e19612d4902da0372d11e11a7a12 | Verified (2026-10-26, §8d) | Official ASF image, Apache 2.0, Java 17.0.18; daemons, HDFS CLI CRUD, and MapReduce wordcount via YARN PASS; container removed after test. |
| WebHDFS as HDFS client | Verified with caveats (2026-10-26, §8e) | Upload + byte/checksum verification confirmed via WebHDFS HTTP API; requires `fs.defaultFS`/HTTP-bind config, `?user.name=hadoop` for write permission, and datanode redirect reachability. CLI adapter remains the documented fallback. |

## 10. Unresolved questions

1. What are the actual Windows edition/build, CPU, RAM, free disk, WSL version, and Docker Desktop version? — PARTIALLY ANSWERED: Windows 10.0.26300.9711; AMD Ryzen 7 5700U, 8 cores / 16 logical processors; ~15.32 GB RAM; ~64.6 GB free disk (C:); WSL 2.6.3.0 kernel 6.6.8; Docker Desktop 29.9.2 / Compose v5.6.1. Virtualization caveat: WMI `VMMonitorModeExtensions` reads `False` on this AMD CPU (ambiguous, not conclusive); availability inferred from prior successful WSL 2/Docker Linux operation in Step 0, not re-verified in this session.
2. Which maintained Hadoop container image has acceptable license, provenance, update cadence, and Java compatibility? — ANSWERED: `apache/hadoop:3.5.0`, digest sha256:46980ea1653eb3453d9cf43c4b7cb69c4729e19612d4902da0372d11e11a7a12, Apache License 2.0, Java 17.0.18, verified by smoke test 2026-10-26 (§8d).
3. Which frontend/backend language is most maintainable for the developer and testing workflow? — ANSWERED (proposed, not implemented): Node.js 22 LTS + TypeScript with Express 5 REST API and official MongoDB Node.js driver; Vitest + Supertest for tests. Not smoke-tested as a service stack; application integration not started.
4. Which public dataset has a clear reuse license and useful group/count analytics?
5. Which 3–5 comparable workflow/provenance platforms are closest to the proposed student UX?
6. Does a literature search reveal a directly comparable integrated workspace that makes the current contribution redundant?
7. WebHDFS upload + byte/checksum verification behavior — ANSWERED (2026-10-26, §8e): CONFIRMED via WebHDFS HTTP API (mkdir, upload, byte-exact SHA-256 read-back, list, delete). Requires `fs.defaultFS`/HTTP-bind config, `?user.name=hadoop` for write permission, and datanode redirect reachability. CLI adapter remains the documented fallback.

## 11. Current progress

- Phase 0 source audit: syllabus located and fully read; mandatory activities extracted.
- Phase 0 hardware audit: complete — Windows 10.0.26300.9711; AMD Ryzen 7 5700U, 8 cores / 16 logical processors; ~15.32 GB RAM; ~64.6 GB free disk (C:); WSL 2.6.3.0 kernel 6.6.8; Docker Desktop 29.9.2 / Compose v5.6.1 daemon reachable earlier. Virtualization caveat recorded (WMI `VMMonitorModeExtensions` reads `False` on AMD; ambiguous, inferred from prior WSL 2/Docker Linux operation).
- Phase 1: initial mixed bibliography and provisional gap drafted; full peer-reviewed literature review and comparable-system search remain pending.
- Phase 4 smoke tests (2026-10-26, disposable containers only): Docker daemon + `alpine:3.20` PASS (§8b); MongoDB `mongo:7` CRUD PASS (§8c); Hadoop `apache/hadoop:3.5.0` daemons + HDFS CLI CRUD + MapReduce wordcount PASS (§8d). Images pinned by digest. Container restart-persistence check still pending.
- Backend stack proposed: Node.js 22 LTS + TypeScript, Express 5 REST API, official MongoDB Node.js driver with MongoDB 7; Vitest + Supertest for tests; Docker Compose for local services; WebHDFS verified with caveats (2026-10-26, §8e) — CLI adapter retained as fallback. Application integration NOT implemented, NOT smoke-tested.
- Phases 2–3, 5: specification drafting continues in the six files.
- Application implementation: **not started**. No code written, no dependencies installed, no services started beyond disposable smoke-test containers (all removed after testing).

## 12. Bibliography access dates

Official/current documentation links were checked on 2026-10-14 for the initial feasibility review. Reopen and confirm exact current versions and full bibliographic metadata before final academic submission.
