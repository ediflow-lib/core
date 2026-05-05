---
applyTo: "**"
---
# Marketing Instructions - EDIFlow

This file describes the **folder structure** for all marketing and business documentation,
and lists every **post-release task** that must be executed after each version release.

---

## Folder Structure: `docs/private/business/`

```
docs/private/business/
│
├── README.md                              # Index & quick reference (update after every restructure)
│
├── strategy/                              # Long-term strategic documents
│   ├── BUSINESS_ROADMAP_2026.md           # Q1-Q4 roadmap, revenue targets, milestones
│   └── EXECUTIVE_SUMMARY.md              # High-level business overview (investors/partners)
│
├── analysis/                              # Research & competitive intelligence
│   ├── COMPETITOR_ANALYSIS.md            # EDI packages on NPM, feature comparison
│   ├── FEATURE_GAP_ANALYSIS.md           # Missing features vs competitors
│   ├── EDI_STANDARDS_RESEARCH.md         # Technical research on EDIFACT, X12, HIPAA
│   └── NPM_SEO_OPTIMIZATION.md           # NPM search ranking strategy
│
├── branding/                              # Brand identity & visual assets
│   ├── AVATAR_LOGO_CONCEPTS.md           # Logo ideas & design decisions
│   ├── WAY_OF_WATER_PHILOSOPHY.md        # Brand philosophy ("way of water")
│   └── assets/
│       └── Logo.png                      # Current logo
│
├── marketing/                             # All marketing activities
│   │
│   ├── channels/                          # Channel-specific guides & playbooks
│   │   ├── DEVTO-PLAYBOOK.md             # How to write & publish on Dev.to
│   │   ├── LINKEDIN-PLAYBOOK.md          # LinkedIn post templates & timing
│   │   ├── HACKERNEWS-PLAYBOOK.md        # Show HN: strategy & timing rules
│   │   └── REDDIT-PLAYBOOK.md            # Reddit r/typescript, r/node rules
│   │
│   ├── community/                         # Community management
│   │   ├── README.md                     # Community overview
│   │   ├── US-COMM-1-discord-management.md
│   │   └── US-COMM-3-github-discussions.md
│   │
│   ├── devto-series/                      # Dev.to article series "Building EDIFlow"
│   │   ├── README.md                     # Series overview & status
│   │   ├── DEVTO-SERIES-README.md        # Detailed series plan
│   │   ├── DEVTO-ARTICLE-TEMPLATE.md     # Template for new articles
│   │   ├── PUBLISHING-CHECKLIST.md       # Pre-publish checklist
│   │   ├── README-STRUCTURE.md           # Structure explanation
│   │   ├── assets/                       # Cover images (Part1.png - Part6.png)
│   │   ├── drafts/                       # Articles in progress
│   │   │   ├── US-COMM-2-Part3-application-layer.md
│   │   │   ├── US-COMM-2-Part4-infrastructure.md
│   │   │   ├── US-COMM-2-Part5-presentation-layer.md
│   │   │   └── US-COMM-2-Part6-lessons-learned.md
│   │   ├── published/                    # Articles that are live on Dev.to
│   │   │   ├── DEVTO-PART1-PUBLISHED.md
│   │   │   └── DEVTO-PART2-PUBLISHED.md
│   │   └── archive/                      # Old drafts, metrics, experiments
│   │
│   └── releases/                          # Per-release marketing materials
│       └── vX.Y.Z/                        # One folder per release
│           ├── GITHUB-RELEASE.md          # GitHub Release notes draft
│           ├── GITHUB-DISCUSSION.md       # GitHub Discussions announcement
│           ├── LINKEDIN-POST.md           # LinkedIn post text
│           ├── DEVTO-ANNOUNCEMENT.md      # Dev.to announcement article
│           └── METRICS.md                 # Results after 1-2 weeks
│
├── operations/                            # Day-to-day operational documents
│   ├── NEXT_7_DAYS_CHECKLIST.md          # Weekly rolling action list
│   ├── DISCUSSION_WELCOME.md             # GitHub Discussions welcome template
│   └── CLEANUP_SUMMARY.md               # Housekeeping log
│
└── archive/                               # Completed, outdated, or superseded docs
    ├── README.md
    ├── DEVTO_SETUP_GUIDE.md              # Completed once, no longer needed
    ├── DISCORD_SETUP_GUIDE.md            # Discord decided against
    ├── LEAN_STARTUP_STRATEGY.md          # Evolved into roadmap
    └── POST_RELEASE_STRATEGY.md          # Superseded by this file
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Strategy / permanent docs | `UPPER_SNAKE_CASE.md` | `BUSINESS_ROADMAP_2026.md` |
| Release materials | folder `vX.Y.Z/` + `UPPER_SNAKE_CASE.md` | `releases/v0.3.0/LINKEDIN-POST.md` |
| Draft articles | `US-COMM-X-Part Y-topic.md` | `US-COMM-2-Part3-application-layer.md` |
| Published articles | `DEVTO-PARTX-PUBLISHED.md` | `DEVTO-PART3-PUBLISHED.md` |
| Playbooks | `CHANNEL-PLAYBOOK.md` | `HACKERNEWS-PLAYBOOK.md` |

---

## Post-Release Checklist (every version)

Execute in this order. Check off as done.

### Day 0 — Release Day

- [ ] **1. GitHub Release** — publish release notes on GitHub
  - File: `marketing/releases/vX.Y.Z/GITHUB-RELEASE.md`
  - Tag the version, write changelog, link to npm

- [ ] **2. GitHub Discussion** — post announcement in Discussions > Announcements
  - File: `marketing/releases/vX.Y.Z/GITHUB-DISCUSSION.md`
  - Category: Announcements
  - Ask 1 open question to invite community response

- [ ] **3. NPM** — verify `npm publish` succeeded, check package page looks correct
  - Check: description, keywords, README render, links

### Day 1 — Dev.to Announcement Article

- [ ] **4. Dev.to Announcement Article** — short (600-800 words), news format
  - File: `marketing/releases/vX.Y.Z/DEVTO-ANNOUNCEMENT.md`
  - Titel: "EDIFlow vX.Y.Z: [Key Feature] for TypeScript"
  - Hook: use real download numbers or a striking fact
  - Tags: `typescript`, `edi`, `opensource`, `webdev`
  - End with: `npm install @ediflow/core` + link to GitHub

- [ ] **5. LinkedIn Post** — link to Dev.to Announcement
  - File: `marketing/releases/vX.Y.Z/LINKEDIN-POST.md`
  - Length: 150-200 words, 1 code snippet, emojis sparingly
  - Post in daytime CET (Tuesday–Thursday 9-11 Uhr)

### Day 3-5 — Developer Community

- [ ] **6. Discord Announcement** — in #announcements Channel posten
  - File: `marketing/releases/vX.Y.Z/DISCORD-POST.md`
  - Kurz & knackig — kein langer Text, Link zu Dev.to Artikel
  - Star CTA am Ende

### ❌ Reddit — wird NICHT genutzt
Reddit wird für EDIFlow nicht als Marketing-Kanal verwendet.
Kein Reddit-Posting, keine Reddit-Planung.
  - Queries: `"edifact typescript"`, `"x12 parser nodejs"`, `"edi javascript"`
  - Add EDIFlow as a solution only when it truly fits

### Week 2 — Content & Series

- [ ] **9. Dev.to Series Article** — publish next part of "Building EDIFlow" series
  - Draft from: `marketing/devto-series/drafts/`
  - Minimum 5 days after previous article
  - LinkedIn cross-post within 24h of Dev.to publish

- [ ] **10. Metrics capture** — record results
  - File: `marketing/releases/vX.Y.Z/METRICS.md`
  - Fields: Dev.to views/reactions, NPM downloads delta, GitHub Stars delta,
    LinkedIn impressions, HN points (if posted), Reddit upvotes

### Month+1 — Archive

- [ ] **11. Archive release materials**
  - Status: set `METRICS.md` to DONE
  - Folder stays in `marketing/releases/vX.Y.Z/` — do NOT delete
  - Update `marketing/releases/README.md` table

---

## Hacker News "Show HN" — What Is It?

**Hacker News** (news.ycombinator.com) is one of the most influential tech communities globally,
run by Y Combinator. It is read by engineers, founders, and CTOs worldwide.

**"Show HN:"** is a special post format on Hacker News:
> You show the community something you built. Real project. Real code. No fluff.

### Why It Matters

| Metric | Potential |
|---|---|
| Reach | 500.000+ active developers |
| GitHub Stars spike | 10-100 stars in 24h (if well received) |
| NPM downloads spike | 200-1.000+ in a week |
| Watches / Forks | Real engagement from technical users |

A good Show HN can generate more GitHub Stars in one day than months of LinkedIn posts.

### Rules for a Good Show HN

1. **Post it yourself** — personal account, not an org account
2. **Title format:** `Show HN: EDIFlow – [what it does in plain English]`
   - Good: `Show HN: EDIFlow – Open-source EDI parser for TypeScript (EDIFACT, X12, HIPAA)`
   - Bad: `Show HN: Check out my new library`
3. **Link:** directly to GitHub repo (NOT npm, NOT Dev.to)
4. **First comment:** write a short "here is why I built this" — be human, honest, technical
5. **Timing is critical:** Tuesday or Wednesday, 9-11 AM US Eastern time
   - Wrong day/time = buried in 30 minutes
6. **Respond to EVERY comment** within the first 2 hours — upvotes come from engagement
7. **No self-promotion language** — HN bans promotional tone instantly

### When to Post on HN

✅ Post when:
- New major version with genuinely novel features (X12 + HIPAA support is novel)
- First public release of something technically interesting
- A blog post series that teaches something (link to Dev.to series Part 1)

❌ Do NOT post when:
- Only a patch release or bug fix
- Already posted HN for the same project within 3 months
- No unique technical angle

### Why We Held Back Until Now

GitHub Sponsors, watching, and social proof are harder to get without **inbound traffic**.
The funnel is:
```
HN / Reddit reader sees post
  → clicks GitHub link
    → reads README (must be excellent)
      → stars the repo
        → optionally watches
          → optionally becomes contributor / sponsor
```

GitHub Stars without traffic is impossible. HN creates the traffic spike.

---

## Channel Quick-Reference

| Channel | Purpose | Frequency | Owner task |
|---|---|---|---|
| GitHub Releases | Official changelog | Every release | Write GITHUB-RELEASE.md |
| GitHub Discussions | Community announcements | Every release | Write GITHUB-DISCUSSION.md |
| Discord | Community announcement | Every release | Write DISCORD-POST.md, post in #announcements |
| Dev.to | Technical articles + announcements | 1-2x/month | Draft in devto-series/drafts/ |
| LinkedIn | Professional reach | Per article + per release | Write LINKEDIN-POST.md |
| Hacker News | Mass dev exposure | Major releases only | Follow Show HN rules above |
| Stack Overflow | SEO + dev help | ⛔ SUSPENDED | Moderator warning received |
| NPM | Discovery | Automatic on publish | Maintain keywords + README |
| ❌ Reddit | **NOT USED** | Never | — |

---

## Content Calendar Template

```
Week 1: Release Day
  Day 0:  GitHub Release + GitHub Discussion
  Day 1:  Dev.to Announcement + LinkedIn

Week 1-2: Community Push
  Day 3-5: Hacker News Show HN (if major release)
  Day 4-7: Reddit posts (2 max, 1 per subreddit)
  Ongoing: Stack Overflow answers

Week 2: Series Content
  Day 7-14: Dev.to Series Article (next part)
  Same day: LinkedIn cross-post

Month+1: Archive & Metrics
  Capture METRICS.md → archive release folder
```

