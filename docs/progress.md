# BibleCast &mdash; Project Progress & Daily Task Tracker

A living progress log and task journal tracking the development, architecture milestones, and daily tasks completed for the **BibleCast** church sermon scripture projection platform.

---

## 📌 Project Overview & Current Status

- **Project Name:** BibleCast
- **Current Phase:** Phase 2 (Foundation & Scaffolding Complete) &rarr; Entering Phase 3 (Backend & Realtime Development)
- **Primary Workspaces:**
  - Frontend: [`c:\Users\Dorcas\Desktop\bibleCast\BCfrontend`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend) (React 18 + Vite)
  - Backend: [`c:\Users\Dorcas\Desktop\bibleCast\BCbackend`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend) (Laravel 12 Framework)
  - Documentation: [`c:\Users\Dorcas\Desktop\bibleCast\docs`](file:///c:/Users/Dorcas/Desktop/bibleCast/docs)

```
bibleCast/
├── BCbackend/              # Laravel 12 API & Real-time WebSockets
├── BCfrontend/             # React 18 + Vite Sanctuary Operator Console
├── docs/                   # Architectural blueprints & progress logs
│   ├── api-documentation.md
│   ├── database-design.md
│   ├── requirements.md
│   ├── setup-guide.md
│   └── progress.md         # <--- You are here
└── README.md
```

---

## 🚦 Milestone Roadmap & Completion Progress

| Phase | Milestone Description | Status | Progress |
| :--- | :--- | :---: | :---: |
| **Phase 1** | Requirements analysis, database architecture, API specification & docs | **Completed** | 100% |
| **Phase 2** | Project scaffolding, package management & dependency installations | **Completed** | 100% |
| **Phase 3** | Backend database migrations, models, REST API & Reverb WebSockets | **Next Up** | 0% |
| **Phase 4** | Frontend operator console layout, theme & state management | **Queued** | 0% |
| **Phase 5** | Live audio capture, Web Speech API & scripture citation extraction | **Queued** | 0% |
| **Phase 6** | Projector stage route (`/projector`), fullscreen dual-display & broadcast sync | **Queued** | 0% |
| **Phase 7** | Sanctuary line-in audio testing, latency optimization & deployment | **Queued** | 0% |

---

## 📅 Daily Task Journal

### 2026-11-18 (Day 1) &mdash; Project Architecture, Blueprints & Foundation Scaffolding

#### 1. Requirements & Core Technical Documentation
- [x] Analyzed live sermon projection specifications and human-in-the-loop review requirements.
- [x] Created [`requirements.md`](file:///c:/Users/Dorcas/Desktop/bibleCast/docs/requirements.md):
  - Defined functional requirements (audio ingestion, speech-to-text, Bible citation extraction, operator review queue, projector stage view).
  - Outlined non-functional requirements (low latency < 300ms, fail-safe safety gates, high-contrast sanctuary typography).
- [x] Created [`database-design.md`](file:///c:/Users/Dorcas/Desktop/bibleCast/docs/database-design.md):
  - Designed relational schema for services, projected passages, audio transcripts, preset queues, and audit logs.
  - Specified indexing strategies for fast reference and timestamp lookups.
- [x] Created [`api-documentation.md`](file:///c:/Users/Dorcas/Desktop/bibleCast/docs/api-documentation.md):
  - Documented REST endpoints for scripture lookups, queue management, and service control.
  - Defined WebSocket event payloads (`verse.suggested`, `verse.projected`, `stage.cleared`, `stage.blackout`).
- [x] Created [`setup-guide.md`](file:///c:/Users/Dorcas/Desktop/bibleCast/docs/setup-guide.md):
  - End-to-end setup guide covering local requirements, environment variables, dual-screen setup, and line-in audio routing.
- [x] Created root [`README.md`](file:///c:/Users/Dorcas/Desktop/bibleCast/README.md):
  - Project summary, tech stack, quick-start commands, and architectural flow.

#### 2. Frontend Scaffolding (`BCfrontend`)
- [x] Scaffolded React 18 + Vite frontend in [`BCfrontend`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend).
- [x] Configured [`package.json`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/package.json), [`vite.config.js`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/vite.config.js), and [`index.html`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/index.html).
- [x] Executed clean `npm install`:
  - Installed 114 base packages.
  - Generated `package-lock.json` and verified clean starter files (`App.jsx`, `main.jsx`, `App.css`, `index.css`).

#### 3. Backend Scaffolding (`BCbackend`)
- [x] Scaffolded Laravel 12 project inside [`BCbackend`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend).
- [x] Executed `composer install`:
  - Installed 112 locked dependencies.
  - Generated optimized autoload files and discovered framework packages (`laravel/sail`, `laravel/tinker`, `laravel/pail`, etc.).
- [x] Generated application encryption key via `php artisan key:generate`.
- [x] Verified Laravel framework version (`Laravel Framework 12.73.0`).

---

### 2026-11-20 (Day 2) &mdash; Progress Tracking, Auth Foundation & Git Version Control

#### Tasks Completed:
- [x] Created unified progress and daily task tracking document at [`docs/progress.md`](file:///c:/Users/Dorcas/Desktop/bibleCast/docs/progress.md).
- [x] Configured root [`.gitignore`](file:///c:/Users/Dorcas/Desktop/bibleCast/.gitignore) ensuring sensitive files (`.env`, `node_modules/`, `vendor/`) are excluded.
- [x] Initialized Git repository and connected remote origin (`https://github.com/Divinedorcas/bibleCast.git`).
- [x] Configured backend authentication infrastructure in [`BCbackend`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend):
  - Installed and configured Laravel Sanctum (`config/sanctum.php`).
  - Added user roles migration (`add_role_to_users_table.php`).
  - Implemented initial API authentication controller (`AuthController.php`) and API routes.
- [x] Executed granular Git commits with frontend and backend segregated:
  - **Backend Commit (`4096f88`):** `feat(backend): configure Laravel Sanctum, role migration, and AuthController`
  - **Frontend Commit (`7d51928`):** `chore(frontend): update vite dependency in package.json and lockfile`

---

## 🎯 Immediate Next Tasks (Priority Queue)

1. **Backend Database Configuration & Migrations (`BCbackend`):**
   - Configure SQLite/MySQL database credentials in [`.env`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend/.env).
   - Create migration files for:
     - `services` table (active church service session).
     - `projection_logs` table (scriptures projected with timestamp and operator id).
     - `service_queues` table (curated scripture passages prepared ahead of time).
     - `speech_transcripts` table (optional speech-to-text logging).
   - Run `php artisan migrate`.

2. **Backend Realtime Broadcasting & WebSocket Setup:**
   - Install and configure Laravel Reverb (`php artisan install:broadcasting`).
   - Define broadcast channels (`sanctuary-stage`, `operator-console`).
   - Create broadcast events (`ScriptureProjected`, `StageCleared`, `StageBlackout`).

3. **Frontend Operator Console Build (`BCfrontend`):**
   - Implement operator media booth dashboard with tabbed layout.
   - Install styling and icons (Tailwind CSS, Lucide React).
   - Integrate Web Speech API listener with audio VU meter.
   - Implement citation regex extraction and human-in-the-loop approval card.
   - Implement dual-window synchronization via `BroadcastChannel` and WebSockets.

---

## 📝 Daily Log Template (For Future Entries)

```markdown
### YYYY-MM-DD (Day X) &mdash; [Title / Focus Area]

#### Objectives:
- [ ] Objective 1
- [ ] Objective 2

#### Tasks Completed:
- [x] Task description with file links

#### Blockers / Challenges Encountered:
- None / Issue description and resolution

#### Next Steps:
- What to focus on next
```
