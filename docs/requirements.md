# BibleCast — System Requirements Specification (SRS)

## 1. Executive Summary

**BibleCast** is an intelligent, real-time Church Sermon Bible Projection System designed specifically for church media and presentation teams. During live church services, pastors and preachers frequently cite scripture references spontaneously (e.g., *"Open your Bibles to Romans chapter 8 verse 28"* or *"Let's look at John 3:16"*). 

Traditionally, media operators must frantically scramble to open presentation software, type the scripture reference manually, format the text, and project it. This often leads to delays, missed verses, or typos shown to the congregation.

BibleCast solves this by introducing an audio-aware, real-time projection workflow:
1. **Listens** continuously to the preacher's voice via the church sound mixer or computer microphone.
2. **Transcribes** audio and automatically **detects** spoken Bible book, chapter, and verse references.
3. **Presents** detected scriptures on an operator suggestion panel with confidence scoring.
4. **Enforces Operator Approval** (Human-in-the-loop) before anything reaches the congregation.
5. **Broadcasts** approved passages instantaneously to a dedicated, distraction-free projector screen via WebSockets.

---

## 2. System Architecture & Tech Stack

BibleCast is structured as a decoupled full-stack web application with real-time bidirectional communication.

```
+-------------------------------------------------------------+
|                     Audio Input Sources                     |
|  [Church Sound Mixer / Console]   OR   [Podium Microphone]  |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      React.js Frontend                      |
|  - Web Audio API (Level Metering)                           |
|  - Speech-to-Text Engine (Browser Web Speech API / Cloud)   |
|  - Client Reference Parser (Regex & Tokenizer)              |
|  - Media Operator Dashboard (Dark Media Theme)              |
|  - Projection Queue & Approval Panel                        |
+-------------------------------------------------------------+
         |                                           ^
         | HTTP REST (Sanctum Auth)                  | WebSockets (Reverb)
         v                                           |
+-------------------------------------------------------------+
|                     Laravel Backend API                     |
|  - Auth & Role Management (Sanctum)                         |
|  - Service Session Manager                                  |
|  - Scripture Parser & Bible Data Provider (KJV, WEB, etc.)  |
|  - Projection State Machine & Concurrency Lock              |
|  - Real-time Broadcaster (Laravel Reverb)                   |
+-------------------------------------------------------------+
         |                                           |
         v                                           v
+------------------------+             +----------------------+
|     MySQL Database     |             |  Dedicated Projector |
|  - Users & Roles       |             |  Display (/projector)|
|  - Church Services     |             |  - Clean Typography  |
|  - Scripture Snapshots |             |  - Black/Dark Navy   |
|  - History & Settings  |             |  - Fullscreen Mode   |
+------------------------+             +----------------------+
```

### 2.1 Technology Stack Selection
* **Frontend Framework:** React.js (Bootstrapped with Vite, JavaScript ES6+)
* **State Management & Data Fetching:** TanStack React Query & React Context
* **Routing:** React Router DOM (v6+)
* **Styling & Icons:** Tailwind CSS (Dark-themed media booth UI) & Lucide React
* **Real-Time Client:** Laravel Echo + Pusher-JS (WebSocket client for Reverb)
* **Backend Framework:** Laravel 11.x (PHP 8.3+)
* **API Architecture:** RESTful JSON API with Form Request validation
* **Authentication:** Laravel Sanctum (Stateful session / Bearer Token)
* **Real-time Server:** Laravel Reverb (First-party WebSocket server)
* **Database:** MySQL 8.0+ (InnoDB, UTF8mb4)
* **External Scripture Source:** Bible API (`https://bible-api.com/` for KJV & WEB) with extensible `BibleProviderInterface`

---

## 3. User Roles & Personas

| Role | Responsibilities | Permissions |
|---|---|---|
| **System Administrator** | Church Media Director / Lead Tech Operator | Manage user accounts, assign roles, configure global display settings, manage church service schedules, review audit logs. |
| **Media Operator** | Active media team member in the booth | Start live listening, approve/reject detected passages, perform manual scripture searches, reorder projection queue, trigger black/clear screen. |
| **Projector Client** | Dedicated display PC connected to sanctuary projectors | Restricted token-based connection. Receives real-time broadcast payloads. Cannot perform mutations or view operator controls. |

---

## 4. Functional Requirements

### 4.1 Module A: Bible & Scripture Management
* **FR-A01 (Multi-Format Search):** The system must allow searching by:
  - Exact reference (e.g., `John 3:16`)
  - Chapter reference (e.g., `Psalm 23` or `Genesis 1`)
  - Verse ranges (e.g., `Romans 8:28-30` or `1 Corinthians 13:4-8`)
* **FR-A02 (Translation Selection):** Must support switching between active Bible translations (default: King James Version - KJV, World English Bible - WEB).
* **FR-A03 (Passage Snapshotting):** When a passage is retrieved and projected, the system must save an exact text snapshot in the database to preserve historical accuracy even if remote API providers update or become unavailable.
* **FR-A04 (Verse Navigation):** Operators must have one-click controls to advance to the next verse (`Next Verse`) or previous verse (`Prev Verse`) within the active chapter.
* **FR-A05 (Favorites & Saved Scriptures):** Operators can bookmark frequently cited passages for quick recall during worship or altar calls.
* **FR-A06 (Copy Passage):** Provide a one-click clipboard copy of the formatted passage with citation for church bulletin or live-stream overlay use.

### 4.2 Module B: Live Sermon Listening & Speech Recognition
* **FR-B01 (Audio Source Selection):** The operator can select between:
  - Direct audio input from church sound mixer (USB audio interface / line-in)
  - Default computer microphone
* **FR-B02 (Live Visual Metering):** Display an active audio level meter (VU bar) to verify input signal presence before preaching begins.
* **FR-B03 (Speech-to-Text Transcription):** Capture audio and output a real-time transcript stream in the operator dashboard.
* **FR-B04 (Hybrid Speech Engine):**
  - *Phase 1 (Development/Prototype):* Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for immediate zero-cost local testing.
  - *Phase 2 (Production):* Cloud Speech-to-Text API adapter with acoustic tuning for diverse accents (including African, Nigerian, and British English variations).
* **FR-B05 (Pattern-Based Reference Detection):** Continuous regex and token parsing to extract scripture citations from colloquial phrasing:
  - *"Turn with me to the book of Genesis chapter one verse one"* -> `Genesis 1:1`
  - *"Second Corinthians chapter five verse seventeen"* -> `2 Corinthians 5:17`
  - *"Psalm twenty-three"* -> `Psalms 23:1`
* **FR-B06 (Auto-Fetch Passage):** Once a reference is detected with sufficient confidence, the system queries the Bible API in the background so the verse is ready before operator approval.

### 4.3 Module C: Media Operator Dashboard
* **FR-C01 (Human-in-the-Loop Approval Queue):** Detected scriptures appear in a dedicated suggestions panel showing:
  - Detected reference & translation
  - Transcript snippet where the reference was spoken
  - Full passage preview
  - Action buttons: `Approve & Project` (Green) and `Dismiss` (Red)
* **FR-C02 (Strict Projection Safety Gate):** No automatically transcribed or detected scripture shall ever be projected directly to the congregation without explicit operator confirmation.
* **FR-C03 (Live Projection Controls):**
  - `Project Now`: Immediately updates the projector with current passage.
  - `Clear Screen`: Hides the scripture, showing a blank background or church logo.
  - `Black Screen`: Instantly blackouts the display (for dramatic moments or sermon transitions).
* **FR-C04 (Projection Queue):** Operators can pre-load an order of scriptures planned by the preacher, reorder them via drag/drop, and project them sequentially.
* **FR-C05 (Status Indicators):** Prominent visual status badges:
  - Live microphone status (`LISTENING` / `OFF`)
  - WebSocket connection health (`CONNECTED` / `RECONNECTING` / `OFFLINE`)
  - Current projected scripture and active operator name.
* **FR-C06 (Recent History):** Scrollable history list of the last 15 projected passages with one-click re-projection.

### 4.4 Module D: Dedicated Projector Display (`/projector`)
* **FR-D01 (Zero-Control Interface):** The projector route must display *only* the approved scripture passage, translation tag, and reference header. No sidebars, buttons, or dashboard controls.
* **FR-D02 (Projection Typography):** 
  - Dynamic responsive font sizing (`clamp()`) to ensure readability up to 50+ feet.
  - Serif or high-legibility display fonts (Georgia / Merriweather / Inter).
  - Highlighted reference header (accented in warm gold `#E5C76B`).
* **FR-D03 (Real-Time State Synchronization):** Subscribes to Laravel Reverb WebSocket broadcast channels. Updates immediately without page reloads.
* **FR-D04 (Restricted Token Access):** Connected projector instances authenticate via a dedicated display token (`/projector?token=HASH`), preventing unauthorized screens from altering state.
* **FR-D05 (Theme Customization):** Administrators can set background color (default: deep navy `#05080C` / black `#000000`), text color, line spacing, and optional church watermark.

### 4.5 Module E: Church Service Management
* **FR-E01 (Service Sessions):** Ability to create, start, and conclude church services (e.g., "Sunday 1st Service - 18 Nov 2026").
* **FR-E02 (Service Audit Trail):** Every projection logged during an active service records:
  - Exact reference and text snapshot
  - Timestamp of projection and duration on screen
  - Identity of the operator who triggered the projection

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance & Latency
* **NFR-P01 (Broadcasting Latency):** The latency from the moment the operator clicks `Approve & Project` to the visual render on the projector must not exceed **300ms** on local network and **600ms** over standard broadband.
* **NFR-P02 (Reference Parsing Speed):** Client-side speech reference parser must evaluate transcript utterances in under **50ms**.
* **NFR-P03 (API Response Time):** Bible search endpoints must respond within **400ms** (utilizing database caching for popular passages).

### 5.2 Reliability & Fault Tolerance
* **NFR-R01 (Network Drop Resilience):** If the projector browser temporarily loses internet or WebSocket connection, it must **retain the current projected verse** on screen without crashing or throwing a white error screen.
* **NFR-R02 (Auto-Reconnection):** Laravel Echo must automatically attempt exponential backoff reconnection to Laravel Reverb upon socket disconnection.
* **NFR-R03 (Manual Fallback Guarantee):** If speech recognition or microphone hardware fails during service, the manual search and queue system must operate independently without interruption.

### 5.3 Concurrency & Multi-Operator Synchronization
* **NFR-C01 (Latest Approval Precedence):** When multiple operators collaborate on the same service dashboard, the latest approved projection becomes the active broadcast state.
* **NFR-C02 (Operator Attribution):** Live dashboards must update in real time to show which operator made the latest projection to avoid conflicting actions.

### 5.4 Security & Compliance
* **NFR-S01 (Authentication):** Passwords hashed with bcrypt; authenticated API requests verified via Laravel Sanctum bearer tokens.
* **NFR-S02 (Display Token Isolation):** Projector display tokens are stored as SHA-256 hashes in the database. Projector clients cannot access administrative or operator endpoints.
* **NFR-S03 (Input Sanitization):** Strict server-side Form Request validation on all search queries and projection commands.

---

## 6. MVP Completion Checklist & Acceptance Criteria

To declare the BibleCast MVP ready for production church piloting, the following criteria must be validated:

- [ ] Administrator can create media team accounts and assign roles.
- [ ] Media operator can log in and view the dark-mode dashboard.
- [ ] Operator can create and start a named church service session.
- [ ] Manual Bible search returns accurate verses for single verses, chapters, and ranges.
- [ ] Operator can switch between KJV and WEB translations.
- [ ] Projector view opens on a secondary display independently of dashboard.
- [ ] Clicking "Project" updates the projector screen via WebSockets in under 500ms.
- [ ] Clear screen and black screen buttons immediately toggle projector state.
- [ ] Microphone captures audio with live level meter indication.
- [ ] Speech recognition transcribes preacher audio in real time.
- [ ] Reference detection correctly extracts spoken citations (e.g., "Romans 8:28").
- [ ] Detected scriptures appear as pending suggestions requiring operator approval.
- [ ] Projection history correctly logs operator name, reference, and timestamp.
- [ ] Disconnecting internet keeps current verse intact on projector screen.

