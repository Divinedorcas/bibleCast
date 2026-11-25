# BibleCast &mdash; Project Progress & Daily Task Tracker

A living progress log and task journal tracking the development, architecture milestones, and daily tasks completed for the **BibleCast** church sermon scripture projection platform.

---

## 📌 Project Overview & Current Status

- **Project Name:** BibleCast
- **Current Phase:** Phase 6 (Live Console, Queue & Real Dashboard Complete) &rarr; Entering Phase 7 (Testing, Audio Line-In Tuning & Deployment)
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
| **Phase 3** | Backend database migrations, models, REST API & Reverb WebSockets | **Completed** | 100% |
| **Phase 4** | Frontend operator console layout, theme & state management | **Completed** | 100% |
| **Phase 5** | Live audio capture, Web Speech API & scripture citation extraction | **Completed** | 100% |
| **Phase 6** | Projector stage route (`/projector`), fullscreen dual-display & broadcast sync | **Completed** | 100% |
| **Phase 7** | Sanctuary line-in audio testing, latency optimization & deployment | **In Progress** | 70% |

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
  - Implemented multi-layered authentication pattern:
    - **Form Requests:** [`RegisterRequest.php`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend/app/Http/Requests/Auth/RegisterRequest.php) and [`LoginRequest.php`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend/app/Http/Requests/Auth/LoginRequest.php).
    - **Service Layer:** [`AuthService.php`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend/app/Services/AuthService.php) handling registration, credential verification, Sanctum token issuance/revocation, and user profile retrieval.
    - **Controller Layer:** [`AuthController.php`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend/app/Http/Controllers/Api/V1/AuthController.php) with endpoints: `POST /api/v1/register`, `POST /api/v1/login`, `GET /api/v1/user`, and `POST /api/v1/logout`.
    - **Automated Tests:** [`AuthTest.php`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCbackend/tests/Feature/AuthTest.php) with 7 test cases (35 assertions) passing.
- [x] Implemented frontend authentication and operator dashboard in [`BCfrontend`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend):
  - **API Client & Auth Service:** Configured Axios instance with Bearer token interceptor ([`api.js`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/services/api.js)) and [`authService.js`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/services/authService.js).
  - **Auth State Management:** Created [`AuthContext.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/context/AuthContext.jsx) providing global session state, persistent login, and auto-logout on token expiration.
  - **Route Protection:** Added [`ProtectedRoute.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/components/common/ProtectedRoute.jsx) and [`GuestRoute.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/components/common/GuestRoute.jsx).
  - **Auth Views:** Built sanctuary-themed [`Login.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/pages/Login.jsx) and [`Register.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/pages/Register.jsx) with password toggles, validation, and role selection.
  - **Console Layout & Dashboard:** Developed [`DashboardLayout.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/layouts/DashboardLayout.jsx) (media booth header, live clock, user pill, logout) and [`Dashboard.jsx`](file:///c:/Users/Dorcas/Desktop/bibleCast/BCfrontend/src/pages/Dashboard.jsx) (registered user dashboard, quick launch modules, profile details, and sanctuary status).
  - **Production Build:** Successfully verified production bundle with Vite (`npm run build`).

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

### 2026-11-21 (Day 4) &mdash; Bible Provider Architecture & Scripture Lookup Engine

#### Objectives:
- [x] Create `BibleProviderInterface` with methods for passage retrieval, text search, and translation listing.
- [x] Implement concrete `BibleApiService` consuming `https://bible-api.com` with caching, timeout, and safety guards.
- [x] Implement `PassageResolver` service for translation fallback and speech-to-reference parsing.
- [x] Implement `BibleController` exposing `/api/v1/bible/translations`, `/api/v1/bible/passage`, `/api/v1/bible/search`, and `/api/v1/bible/parse-reference`.
- [x] Register container binding in `AppServiceProvider`.
- [x] Implement frontend `bibleService.js` and connect dashboard quick search widget.
- [x] Create automated feature tests in `BibleTest.php` with 100% pass rate (8 passed, 20 assertions).

---

### 2026-11-22 (Day 5) &mdash; Saved Passages, Live Projection History & Dedicated Stage View

#### Objectives:
- [x] Create `SavedPassage` and `Projection` models and database migrations.
- [x] Implement `SavedPassageController` (`/saved-passages`) and `ProjectionController` (`/projections`, `/projections/history`, `/projections/current`, `/projections/clear`).
- [x] Build standalone `/projector` stage display view with `ProjectorLayout.jsx` and `ProjectionDisplay.jsx`.
- [x] Build `History.jsx` for bookmarking favourites and viewing historical projections.
- [x] Add multi-window sub-millisecond synchronization via Web `BroadcastChannel` and `localStorage` storage events.

---

### 2026-11-23 (Day 6) &mdash; Broadcasting Architecture & ProjectionUpdated Event

#### Objectives:
- [x] Create `App\Events\ProjectionUpdated` event implementing `ShouldBroadcast`.
- [x] Configure event payload carrying `reference`, `translation`, `passage_text`, `status`, `timestamp`, `verses`, and `operator_name`.
- [x] Authorize display channels in `routes/channels.php` (`projector.display` and `projector.display.{tokenHash}`).
- [x] Register broadcasting channel routing in `bootstrap/app.php`.
- [x] Connect `ProjectionController::store()` and `clear()` to dispatch `ProjectionUpdated`.
- [x] Write feature tests in `PassageAndProjectionTest.php` verifying event dispatch and payloads.

---

### 2026-11-23 (Day 7) &mdash; Projection Lineup Queue & Interface

#### Objectives:
- [x] Create `ProjectionQueue` model and migration with sequence ordering (`sort_order`).
- [x] Implement `ProjectionQueueController` with add, remove, reorder, project selected, and clear queue.
- [x] Create `queueService.js` supporting optimistic UI updates and real-time tab synchronization.
- [x] Build `QueueManager.jsx` with lookup modal, arrow reordering, 1-click live projection, and clear queue safeguards.
- [x] Build dedicated `/queue` page (`Queue.jsx`) and connect sidebar navigation.
- [x] Write backend tests in `ProjectionQueueTest.php` (6 tests passing).

---

### 2026-11-23 (Day 8) &mdash; Live Sermon Audio Ingestion, Web Speech API & Live Console

#### Objectives:
- [x] Implement `useAudioInput.js` hook utilizing Web Audio API for real-time RMS volume metering and USB mixer input selection.
- [x] Implement `useSpeechRecognition.js` hook for continuous native browser speech-to-text with status and permission guards.
- [x] Build `AudioLevelMeter.jsx` with multi-segment LED color gradient, dBFS scale, and clipping indicators.
- [x] Build `AudioSourceSelector.jsx` identifying USB sound interfaces, mixers, and microphones.
- [x] Build `AudioControls.jsx` master listening toolbar with auto-detection toggle.
- [x] Build `LiveService.jsx` console featuring live preacher speech stream, human-in-the-loop scripture approval queue, and stage screen mirror.
- [x] Rename Sanctuary Display to JE Display across components.

---

### 2026-11-25 (Day 9) &mdash; Real Dashboard Records, Church Service Switcher & Active Operators

#### Objectives:
- [x] Create `Service` model and database migration pre-seeded with 4 standard church services:
  - **1st Service**
  - **2nd Service**
  - **Tuesday Service**
  - **Thursday Service**
- [x] Implement `DashboardController.php` with `/api/v1/dashboard/stats`, `/api/v1/services`, and `/api/v1/services/switch`.
- [x] Connect `Dashboard.jsx` to real database records:
  - **Total Projections Done:** Real count from `projections` table.
  - **Current Service:** Real-time switcher between 1st, 2nd, Tuesday, and Thursday services with active status.
  - **Recent Projections:** Real list of recent projections with scripture citation, translation, and operator attribution.
  - **Active Operators:** Real registered and signed-in operators from `users` table.
- [x] Create frontend `dashboardService.js`.
- [x] Add backend tests in `DashboardTest.php` (all 34 backend feature and unit tests passing with 133 assertions).

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
