# BibleCast 📖⚡

> **Intelligent Real-Time Church Sermon Bible Projection System**

BibleCast is a modern church presentation platform designed for media teams. It listens to live sermons, transcribes preacher audio in real time, automatically detects cited scripture references (e.g., *"Romans chapter 8 verse 28"*), retrieves the passage, and allows media operators to approve and project it onto sanctuary screens with sub-second WebSocket synchronization.

---

## 🌟 Key Features

* 🎙️ **Live Sermon Listening:** Streams audio directly from church sound mixing consoles (USB line-in) or computer microphones.
* 🧠 **Automated Scripture Detection:** Identifies spoken books, chapters, and verses using contextual natural language parsing.
* 🛡️ **Human-in-the-Loop Approval:** Ensures safety during worship; detected scriptures appear in an operator review panel and require one-click operator confirmation before reaching the auditorium projector.
* ⚡ **Sub-Second Projection (WebSockets):** Built with **Laravel Reverb** and **Laravel Echo** for instant, zero-refresh screen updates.
* 🖥️ **Dedicated Projector View (`/projector`):** Clean, distraction-free typography with custom dark backgrounds, high-contrast verse text, gold reference highlights, and zero operator controls visible to the congregation.
* 🔍 **Manual Search & Fast Fallback:** Instant search by reference, book, chapter, or keyword range if speech detection is disabled.
* 📚 **Multiple Translations:** Initial support for King James Version (KJV) and World English Bible (WEB), architected with an extensible provider interface.
* 📋 **Projection Lineup & Queue:** Pre-load service scripture lists, reorder passages, and project sequentially.
* 📜 **Audited Projection History:** Records timestamped scripture snapshots and operator attribution for each church service.
* 🎛️ **Instant Stage Controls:** One-click `Clear Screen`, `Blackout`, and `Next/Prev Verse` hotkeys.

---

## 🏛️ System Architecture

```text
[ Sound Mixer / Microphone ]
              │
              ▼ (Audio Stream)
[ React.js Media Dashboard ] ──(Voice Detections)──► [ Suggestion Queue ]
              │                                              │
              │ (Approve / Manual Search)                    │ (Operator Approval)
              ▼                                              ▼
    [ Laravel 11 REST API ] ──(Broadcast)──► [ Laravel Reverb (WebSockets) ]
              │                                              │
              ▼                                              ▼
      [ MySQL Database ]                         [ Projector Screen (/projector) ]
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React.js (Vite), JavaScript (ES6+), React Router DOM, TanStack Query, Lucide Icons |
| **Styling** | Tailwind CSS (Dark professional media booth theme) |
| **Backend API** | Laravel 11.x (PHP 8.3+), Eloquent ORM |
| **Authentication** | Laravel Sanctum (Token & Session auth) |
| **Real-Time Engine** | Laravel Reverb & Laravel Echo (Pusher Protocol) |
| **Database** | MySQL 8.0+ (`church_bible_projection`) |
| **Scripture API** | Public Bible API (`https://bible-api.com/`) with local caching |

---

## 📁 Repository Structure

```text
bibleCast/
  ├── biblecast-backend/          # Laravel 11 API Backend
  │     ├── app/
  │     │     ├── Events/         # ProjectionUpdated, ProjectionCleared
  │     │     ├── Http/           # API Controllers & Form Requests
  │     │     ├── Models/         # Service, Projection, Translation, Queue
  │     │     └── Services/Bible/ # BibleProviderInterface & ApiService
  │     ├── config/               # cors.php, reverb.php, broadcasting.php
  │     ├── database/migrations/  # Database table schemas
  │     └── routes/api.php        # API route endpoints
  │
  ├── biblecast-frontend/         # React.js Vite Frontend
  │     ├── src/
  │     │     ├── components/     # AudioControls, BibleSearch, Projection
  │     │     ├── hooks/          # useSpeechRecognition, useAudioInput
  │     │     ├── layouts/        # DashboardLayout, ProjectorLayout
  │     │     ├── pages/          # Dashboard, BibleSearch, Projector
  │     │     └── services/       # api.js, echo.js (WebSocket client)
  │     └── package.json
  │
  ├── requirements.md             # System Requirements Specification (SRS)
  ├── database-design.md          # Full MySQL Schema & ERD
  ├── api-documentation.md        # Complete REST & WebSocket API Specs
  ├── setup-guide.md              # Step-by-step Setup & Sanctuary Hardware Guide
  └── README.md                   # Project Overview & Index
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure PHP 8.3+, Composer 2, Node.js 20+, and MySQL are installed on your machine.

### 2. Backend Setup
```powershell
cd biblecast-backend
composer install
copy .env.example .env
php artisan key:generate
# Configure DB_DATABASE=church_bible_projection in .env
php artisan migrate --seed
```

### 3. Frontend Setup
```powershell
cd ../biblecast-frontend
npm install
npm run dev
```

### 4. Start Services
In separate terminal windows:
```powershell
# 1. API Server
cd biblecast-backend; php artisan serve

# 2. WebSocket Server
cd biblecast-backend; php artisan reverb:start

# 3. Frontend Server
cd biblecast-frontend; npm run dev
```

* Open Operator Console: `http://localhost:5173/`
* Open Sanctuary Projector: `http://localhost:5173/projector`

---

## 📑 Detailed Documentation Links

Detailed engineering specifications are available in the following workspace documents:

* 📄 [requirements.md](file:///c:/Users/Dorcas/Desktop/bibleCast/requirements.md) — Complete functional, non-functional, and acceptance criteria.
* 📄 [database-design.md](file:///c:/Users/Dorcas/Desktop/bibleCast/database-design.md) — Comprehensive ERD, table dictionaries, indices, and seed data.
* 📄 [api-documentation.md](file:///c:/Users/Dorcas/Desktop/bibleCast/api-documentation.md) — Full REST endpoint specifications and real-time WebSocket payloads.
* 📄 [setup-guide.md](file:///c:/Users/Dorcas/Desktop/bibleCast/setup-guide.md) — Comprehensive installation steps, dual-monitor projector setup, and audio mixer configuration.

---

## 👥 Media Team Workflow

1. **Pre-Service:** Operator opens BibleCast on the media laptop and connects the secondary HDMI cable to the sanctuary projector.
2. **Setup Extended Display:** Drag the projector window (`/projector`) to the projector screen and press `F11` for full screen.
3. **During Sermon:** Click **Start Listening**. As the preacher quotes scripture, suggestions populate the operator's suggestion panel.
4. **Approve & Project:** Click **Approve & Project** to display the passage instantly on screen.
5. **Clear / Blackout:** When the preacher moves on, click **Clear Screen** or **Black Screen**.

---

## 📄 License
This project is licensed under the MIT License.

