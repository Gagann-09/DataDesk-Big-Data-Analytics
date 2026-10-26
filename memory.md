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

## 10. Unresolved questions

1. What are the actual Windows edition/build, CPU, RAM, free disk, WSL version, and Docker Desktop version? — PARTIALLY ANSWERED: Windows 10.0.26300.9711; AMD Ryzen 7 5700U, 8 cores / 16 logical processors; ~15.32 GB RAM; ~64.6 GB free disk (C:); WSL 2.6.3.0 kernel 6.6.8; Docker Desktop 29.9.2 / Compose v5.6.1. Virtualization caveat: WMI `VMMonitorModeExtensions` reads `False` on this AMD CPU (ambiguous, not conclusive); availability inferred from prior successful WSL 2/Docker Linux operation in Step 0, not re-verified in this session.
2. Which maintained Hadoop container image has acceptable license, provenance, update cadence, and Java compatibility?
3. Which frontend/backend language is most maintainable for the developer and testing workflow?
4. Which public dataset has a clear reuse license and useful group/count analytics?
5. Which 3–5 comparable workflow/provenance platforms are closest to the proposed student UX?
6. Does a literature search reveal a directly comparable integrated workspace that makes the current contribution redundant?

## 11. Current progress

- Phase 0 source audit: syllabus located and fully read; mandatory activities extracted.
- Phase 0 hardware audit: complete — Windows 10.0.26300.9711; AMD Ryzen 7 5700U, 8 cores / 16 logical processors; ~15.32 GB RAM; ~64.6 GB free disk (C:); WSL 2.6.3.0 kernel 6.6.8; Docker Desktop 29.9.2 / Compose v5.6.1 daemon reachable earlier. Virtualization caveat recorded (WMI `VMMonitorModeExtensions` reads `False` on AMD; ambiguous, inferred from prior WSL 2/Docker Linux operation).
- Phase 1: initial mixed bibliography and provisional gap drafted; full peer-reviewed literature review and comparable-system search remain pending.
- Phases 2–5: specifications drafted in six files; user review and host/image compatibility verification remain pending.
- Application implementation: **not started**.

## 12. Bibliography access dates

Official/current documentation links were checked on 2026-10-14 for the initial feasibility review. Reopen and confirm exact current versions and full bibliographic metadata before final academic submission.
