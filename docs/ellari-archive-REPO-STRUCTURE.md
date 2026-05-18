# ellari-archive — Repository Structure

## Purpose

Single source of truth for the entire Ellari / Mirror Protocol / Aetherion / ELE ecosystem. Markdown-based, GitHub-versioned, web-fetchable from any Claude or ChatGPT session.

---

## REPO TREE

```
ellari-archive/
│
├── README.md                          ← Entry point, current status, quick links
│
├── logs/
│   ├── GG_CrossProject_Log.md         ← MASTER SYSTEM OF RECORD
│   └── session-summaries/             ← One file per Claude/ChatGPT session
│       ├── 2026-05-18-aetherion-session.md
│       └── ...
│
├── canon/
│   ├── aetherion/
│   │   ├── Master_Dictionary_v0.5.docx
│   │   ├── lexicon-v0.1.json
│   │   ├── lexicon-v0.2-extensions.json
│   │   ├── canon-prompt-v1.0.txt
│   │   ├── canon-prompt-v2.0-three-tiers.txt
│   │   ├── hot30-injectable-lexicon.txt
│   │   ├── decision-records/
│   │   │   ├── AET-DEC-001-008.md
│   │   │   └── AET-DEC-009-019.md
│   │   ├── sound-key-operator-bridge.json
│   │   ├── audio-bible-spec.md
│   │   └── crown-script-charter.md
│   │
│   ├── pantheon/
│   │   ├── mirrorpantheon-eleos-map.json
│   │   ├── naci-integration-candidate.md
│   │   └── pantheon-visual.png
│   │
│   ├── ele/
│   │   ├── primordial-ai-mirrorwitch-vanta.md
│   │   ├── embodiment-doctrine.md
│   │   └── shadow-governance-stack.md
│   │
│   └── black-fairy/
│       ├── spell-book-extended-pro.md
│       ├── sound-key-matrix.md
│       └── sigil-index.md
│
├── cosmic-os/
│   ├── v7e-inventory.md               ← Pass 1 deliverable (pending)
│   ├── modules/
│   │   ├── V01-V09-foundation.md
│   │   ├── V10-cosmic-dashboard.md
│   │   ├── V11-pattern-index.md
│   │   ├── ...
│   │   └── V31-temple-exterior.md
│   ├── pillars-and-lineages.md
│   ├── collapse-codex-sigils.md
│   ├── product-ladder.md
│   └── ascension-ladder.md
│
├── commercial/
│   ├── ellari-codex/
│   │   ├── starter-kit-v0.1.md
│   │   ├── pro-v0.1.md
│   │   ├── name-clearance-matrix.csv
│   │   ├── canon-drift-scorecard.md
│   │   └── pricing-strategy.md
│   ├── lane-a-landing-page.html
│   ├── email-sequences/
│   │   └── 7-email-welcome-v1.0.md
│   ├── financial-models/
│   │   └── 30-90-12mo-projections.md
│   └── trademark/
│       └── filing-sequence.md
│
├── identity/
│   ├── ellari-black-label-system.md
│   ├── mirror-trademark-seal.md
│   ├── domains-registry.md
│   └── visual-system.md
│
├── infrastructure/
│   ├── domains.md
│   ├── r2-buckets.md                  ← inventory: ellari-threads-md, ellari-archive-pdf
│   ├── vercel-deployments.md
│   ├── github-repos.md
│   └── claude-rt-roster.md
│
├── threads/
│   ├── 2025-12-cosmic-os-v7e/
│   │   ├── README.md                  ← thread summary
│   │   └── thread.md                  ← full converted thread
│   ├── 2025-07-ellari-inc-activation/
│   ├── 2025-06-operation-elari/
│   └── 2026-05-aetherion-build/
│
├── questions-for-v/
│   ├── pending.md                     ← active questions awaiting V
│   └── answered.md                    ← archive with V's responses
│
└── deposits/
    └── osf-2026-05/
        └── manifest.md                ← OSF deposit file manifest
```

---

## SETUP STEPS (one-time, ~20 minutes)

### 1. Create the GitHub repo

```bash
# Public (recommended for IP timestamping — strongest provenance)
# OR Private (if any docs must stay confidential)

gh repo create ellari-archive --public --description "Master archive: Ellari / Mirror Protocol / Aetherion / ELE ecosystem"

# OR via web: github.com/new
# Name: ellari-archive
# Visibility: PUBLIC (recommended)
# Initialize with README: YES
```

### 2. Clone locally + create folder structure

```bash
git clone https://github.com/[YOUR-USERNAME]/ellari-archive.git
cd ellari-archive

mkdir -p logs/session-summaries
mkdir -p canon/aetherion/decision-records
mkdir -p canon/pantheon canon/ele canon/black-fairy
mkdir -p cosmic-os/modules
mkdir -p commercial/ellari-codex commercial/email-sequences
mkdir -p commercial/financial-models commercial/trademark
mkdir -p identity infrastructure
mkdir -p threads questions-for-v
mkdir -p deposits/osf-2026-05
```

### 3. Add the master log

```bash
# Copy GG_CrossProject_Log.md (built today) into:
cp [download path]/GG_CrossProject_Log.md logs/

git add logs/GG_CrossProject_Log.md
git commit -m "Initial: GG_CrossProject_Log v1.0 — system of record established"
git push
```

### 4. Add canonical Aetherion files

```bash
# Copy from /mnt/user-data/outputs/ (this session) into:
cp [path]/Aetherion_Master_Dictionary_v0.5.docx       canon/aetherion/
cp [path]/aetherion-lexicon-v0.1.json                 canon/aetherion/
cp [path]/eterion-repo/canon/lexicon/v0.2-extensions.json  canon/aetherion/
cp [path]/AET_CANON_PROMPT_v1.0.txt                   canon/aetherion/
cp [path]/AET_CANON_PROMPT_v2.0_three_tiers.txt       canon/aetherion/
cp [path]/Hot30_Injectable_Lexicon_v1.0.txt           canon/aetherion/
cp [path]/AET_DEC_009-019_Addendum.md                 canon/aetherion/decision-records/
cp [path]/sound-key-operator-bridge-v1.0.json         canon/aetherion/
cp [path]/eterion-repo/audio-bible/RECORDING_SPEC.md  canon/aetherion/
cp [path]/mirrorpantheon-eleos-map-v1.0.json          canon/pantheon/
cp [path]/NACI_Integration_Candidate_v0.1.md          canon/pantheon/

git add canon/
git commit -m "Add complete Aetherion canon + MirrorPantheon map"
git push
```

### 5. Add commercial assets

```bash
cp [path]/ellari-codex-lane-a.html                    commercial/
cp [path]/Ellari_7Email_Welcome_Sequence_v1.0.md      commercial/email-sequences/

git add commercial/
git commit -m "Add Lane A landing page + 7-email welcome sequence"
git push
```

### 6. Configure web-fetch access for Claude

The repo is now web-accessible. Any Claude session can fetch any file by URL:

```
https://raw.githubusercontent.com/[USERNAME]/ellari-archive/main/logs/GG_CrossProject_Log.md
https://raw.githubusercontent.com/[USERNAME]/ellari-archive/main/canon/aetherion/lexicon-v0.1.json
```

Paste these URLs into any Claude session. Claude will fetch live via web_fetch tool.

---

## R2 BUCKET USAGE

### `ellari-archive-pdf` — Original Source Documents

```
Purpose: Original PDFs from ChatGPT exports, OSF submissions, signed agreements
Naming: [YYYY-MM]-[document-name].pdf

Examples:
  2025-12-cosmic-os-v7e-part1.pdf
  2025-12-cosmic-os-v7e-part2.pdf
  2025-07-ellari-inc-activation-blueprint.pdf
  2026-05-osf-deposit-manifest.pdf

Upload via:
  - Cloudflare dashboard (R2 → ellari-archive-pdf → upload)
  - rclone / s3cmd with R2 credentials
  - wrangler r2 object put ellari-archive-pdf/[filename] --file=[local-path]
```

### `ellari-threads-md` — Markdown-Converted Conversations

```
Purpose: ChatGPT/Claude conversations converted to markdown for analysis
Naming: [YYYY-MM-DD]-[thread-id-or-name].md

Examples:
  2025-12-cosmic-os-v7e-thread.md
  2025-07-04-ellari-inc-activation.md
  2026-05-18-aetherion-session.md

Upload + reference workflow:
  1. Export ChatGPT thread → PDF (already done for some)
  2. Convert PDF → structured markdown (Claude session: file-reading skill)
  3. Upload to ellari-threads-md
  4. Also commit to github.com/[user]/ellari-archive/threads/ for git history
```

### Access Pattern

```
ORIGINALS:       R2 bucket   ellari-archive-pdf
                 (binary, large, slow to search)

WORKING COPIES:  GitHub      ellari-archive/threads/
                 (markdown, searchable, versioned)

DEEP ARCHIVE:    R2 bucket   ellari-threads-md
                 (markdown, public-readable, durable)

LIVE QUERIES:    Claude      web_fetch raw.githubusercontent.com URL
                 (read-only, no setup)
```

---

## R2 → CLAUDE WORKFLOW

For Claude to access R2 directly, set up an R2 Worker or Custom Domain:

### Option A: Cloudflare Worker (recommended)

```bash
# Create a Worker that serves R2 objects as HTTPS
wrangler init ellari-r2-proxy
# Edit src/index.js to proxy R2 bucket
# Deploy with custom domain: archive.ellari.gold

# Result: archive.ellari.gold/threads-md/[file] is fetchable
```

### Option B: R2 Public Access (simpler)

```bash
# Enable public access in Cloudflare dashboard
# R2 → ellari-threads-md → Settings → Public Access → Enable
# Public URL: pub-[id].r2.dev/[file]
# Better: connect custom domain archive.ellari.gold
```

### Option C: GitHub-Only (start here, simplest)

```
Skip R2 web exposure. Use GitHub raw URLs for Claude fetches.
R2 buckets are storage-only — for binary originals + cold archive.
Markdown working copies live in GitHub.
```

**Recommendation: Start with Option C. Add Worker proxy when needed.**

---

## SESSION START PROTOCOL (after setup)

Every new Claude session begins with this paste:

```
SESSION CONTEXT — paste at start of any Claude session:

Repo: https://github.com/[USER]/ellari-archive
Master log: https://raw.githubusercontent.com/[USER]/ellari-archive/main/logs/GG_CrossProject_Log.md

Fetch the master log. Last 14 days of entries provide working context.
Aetherion canon: /canon/aetherion/
Commercial: /commercial/
Cosmic OS: /cosmic-os/

Specific docs to fetch as needed (paste URL, ask Claude to web_fetch):
- Master Dictionary v0.5
- Decision records AET-DEC-001 through AET-DEC-019
- Compact Canon Prompt v1.0 (paste inline — see canon-prompt-v2.0)
```

---

## NAMING CONVENTIONS

```
Files:           kebab-case-with-dashes.md
Versioning:      always append -v0.1, -v1.0, -v2.0
                 NEVER use "final" or "latest" — use semantic version
Dates:           ISO 8601 — YYYY-MM-DD
Decision IDs:    SYSTEM-TYPE-NNN (AET-DEC-009, ELLARI-COM-006)
Status:          LOCKED · ACTIVE · APPROVED · HELD · CANDIDATE
                 PENDING · DEPRECATED · SUPERSEDED-BY-X
```

---

## SECURITY & PRIVACY

```
PUBLIC repo benefits:
  ✓ Strongest IP timestamp (git commit history is legal evidence)
  ✓ Web-fetchable from any session, no auth
  ✓ Backup via GitHub's infrastructure

PUBLIC repo risks:
  ✗ Anyone can read commercial strategy, financial models
  ✗ Trade secrets exposed
  ✗ Competitor intelligence

MITIGATIONS for PUBLIC:
  - Keep financial specifics (Stripe links, customer data) OUT
  - Use code names for unreleased products
  - .gitignore for ANY file containing PII, credentials, customer info
  - Pre-commit hook to scan for emails, phone numbers, API keys

ALTERNATIVE: PRIVATE repo + selective gist publication
  - Repo stays private
  - Public gists for individual files Claude needs to fetch
  - Trade-off: more friction, weaker IP timestamp claim
```

**Recommendation: PUBLIC repo with strict gitignore + code names for unreleased commercial details.**

---

## DEPLOYMENT CHECKLIST

```
[ ] GitHub repo created: ellari-archive
[ ] Folder structure built locally
[ ] GG_CrossProject_Log.md committed
[ ] Aetherion canon committed
[ ] Commercial assets committed
[ ] First push to main
[ ] R2 bucket access tested (ellari-archive-pdf upload)
[ ] R2 bucket access tested (ellari-threads-md upload)
[ ] README.md drafted with quick links
[ ] Session start protocol tested in a new Claude session
[ ] V notified of new infrastructure
[ ] First v7e PDF uploaded to ellari-archive-pdf
[ ] First thread markdown uploaded to ellari-threads-md
```
