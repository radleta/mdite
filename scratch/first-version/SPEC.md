### 🎯 Project Spec: `doc-lint`

**Project Name:** `doc-lint`

**Core Philosophy:** A project-level linter that validates the structural integrity and consistency of a Markdown documentation repository. It treats a documentation folder not as a collection of individual files, but as a single, interconnected project graph.

---

### ## 🏗️ Core Architecture: The Orchestrator Model

`doc-lint` will be a **new, standalone CLI tool**. It will **not** be a plugin for an existing linter.

Internally, it will act as an **orchestrator**, using the powerful `remark`/`unified` ecosystem as a library for file parsing and running file-scoped rules. This avoids reinventing the wheel while allowing for the implementation of project-scoped logic that existing tools cannot handle.



---

### ## ✨ Key Features

The feature set is divided into two categories: our unique project-level validation and the powerful file-level checks we get from using `remark`.

#### 1. Project Graph Validation (The Core Differentiator)

This is the logic that lives inside the `doc-lint` orchestrator itself.

* **Orphan File Detection:**
    * Starts from a configured `entrypoint` (e.g., `README.md`).
    * Recursively follows all relative Markdown links to build a dependency graph of all *reachable* files.
    * Compares this graph to all `.md` files on the filesystem within the target directory.
    * Reports any file that exists but is not part of the graph as an **orphan**. 🚨

* **Dead Link Auditing:**
    * Validates all relative links to other files and assets (`./image.png`, `../api/v2.md`).
    * Validates anchor links/fragments (`#section-heading`) within the same file and across files.
    * (Configurable) Optionally checks external `http/https` links for `4xx`/`5xx` status codes with configurable timeouts.

#### 2. File-Level Validation (Powered by `remark`)

For every file visited during the graph traversal, `doc-lint` will use the `remark` engine to perform detailed content analysis.

* **Frontmatter Schema Validation:**
    * Users can define a JSON Schema in the configuration file.
    * The tool validates each file's YAML frontmatter against this schema, ensuring required fields, types, and formats are correct (e.g., `title: string`, `tags: array`).

* **Content & Style Linting:**
    * Leverages the existing `remark-lint` plugin ecosystem.
    * Users can enable rules for heading increments, list spacing, code block language tags, and dozens of other common style checks.
    * Supports custom rules for enforcing specific structural patterns, like ensuring a `## Usage` section exists in all `guide/*.md` files.

---

### ## 🔧 Configuration

The tool will be driven by a single, discoverable configuration file.

* **File Discovery:** Uses `cosmiconfig` to find a configuration file (e.g., `doclint.config.js`, `.doclintrc.yml`).
* **Key Properties:**
    * `entrypoint`: The root file to start the graph traversal from (e.g., `'docs/README.md'`).
    * `extends`: Allows sharing configurations (e.g., `'@my-company/doclint-config'`).
    * `rules`: An object to configure the severity (`error`, `warn`, `off`) of each rule, including our custom ones like `orphan-files: 'error'`.

---

### ## 💻 CLI Experience (UX)

The user-facing tool should be intuitive, fast, and CI-friendly.

* **Command:** Simple invocation, e.g., `npx doc-lint` or `doc-lint 'docs/**/*.md'`.
* **Reporting:** Errors are reported with clear, actionable output: `[file-path]:[line]:[column] [severity] [message] [rule-id]`.
* **Auto-Fixing:** A `--fix` flag will apply automatic fixes for rules that support it (e.g., formatting frontmatter, fixing heading syntax).
* **Performance:** Implements caching to only re-lint changed files, ensuring near-instantaneous runs in pre-commit hooks and CI pipelines.