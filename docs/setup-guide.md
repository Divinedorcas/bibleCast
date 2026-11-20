# BibleCast — Complete Setup & Installation Guide

This guide walks through configuring and running **BibleCast** on a church media computer. It covers the Laravel backend, MySQL database, real-time WebSocket server (Laravel Reverb), React frontend, and hardware audio/projector connections.

---

## 1. System Requirements & Prerequisites

Before beginning installation, verify the following dependencies on your media computer:

| Software | Minimum Version | Recommended | Notes |
|---|---|---|---|
| **Operating System** | Windows 10/11, macOS, or Ubuntu 22.04+ | Windows 11 64-bit | Church booth standard |
| **PHP** | 8.2 | 8.3+ | Required extensions: `pdo_mysql`, `mbstring`, `bcmath`, `curl` |
| **Composer** | 2.5 | 2.7+ | PHP package manager |
| **Node.js** | 18.x LTS | 20.x LTS | Required for React & Vite |
| **npm** | 9.x | 10.x+ | Node package manager |
| **MySQL / MariaDB** | 8.0 / 10.5 | MySQL 8.0+ | Or via XAMPP / Laragon / Native installer |
| **Git** | 2.30+ | Latest | Version control |

### Verifying Environment (PowerShell)
Run these commands in PowerShell or Terminal to ensure your tools are accessible:
```powershell
php -v
composer -V
node -v
npm -v
git --version
```

---

## 2. Directory Structure Overview

BibleCast follows a decoupled two-tier project structure:

```text
bibleCast/
  ├── biblecast-backend/      # Laravel 11 API + Reverb WebSockets
  │     ├── app/
  │     ├── config/
  │     ├── database/
  │     ├── routes/api.php
  │     └── .env
  └── biblecast-frontend/     # React.js (Vite) + Tailwind CSS
        ├── src/
        │     ├── components/
        │     ├── layouts/
        │     ├── pages/
        │     └── services/
        ├── package.json
        └── .env
```

---

## 3. Backend Setup (Laravel 11 & MySQL)

### Step 3.1: Initialize Laravel Backend
If setting up from scratch:
```powershell
composer create-project laravel/laravel biblecast-backend
cd biblecast-backend
```

### Step 3.2: Create MySQL Database
1. Start your MySQL service (e.g., through XAMPP Control Panel or MySQL Command Line).
2. Open phpMyAdmin (`http://localhost/phpmyadmin`) or run SQL:
```sql
CREATE DATABASE church_bible_projection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3.3: Configure Environment Variables
Open `biblecast-backend/.env` and update the database settings:
```env
APP_NAME=BibleCast
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=church_bible_projection
DB_USERNAME=root
DB_PASSWORD=

# Broadcasting via Laravel Reverb
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=biblecast-app-id
REVERB_APP_KEY=biblecast-app-key
REVERB_APP_SECRET=biblecast-app-secret
REVERB_HOST="localhost"
REVERB_PORT=8080
REVERB_SCHEME=http

CACHE_STORE=database
QUEUE_CONNECTION=database
```

Generate the application encryption key:
```powershell
php artisan key:generate
```

### Step 3.4: Install API & Authentication Support
Install Laravel API routing and Sanctum:
```powershell
php artisan install:api
```

Configure CORS in `config/cors.php`:
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### Step 3.5: Install Real-Time Broadcasting (Laravel Reverb)
Install Reverb WebSocket server:
```powershell
php artisan install:broadcasting
```
*(When prompted to install Reverb, select **Yes**).*

### Step 3.6: Run Migrations and Seeders
```powershell
php artisan config:clear
php artisan migrate --seed
```

---

## 4. Frontend Setup (React.js + Vite)

### Step 4.1: Initialize Frontend Application
From the parent project directory:
```powershell
npm create vite@latest biblecast-frontend -- --template react
cd biblecast-frontend
npm install
```

### Step 4.2: Install Required Libraries
```powershell
# Routing, HTTP client & Icons
npm install axios react-router-dom lucide-react @tanstack/react-query

# Real-time WebSocket connection
npm install laravel-echo pusher-js

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 4.3: Configure Tailwind CSS
In `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#05080C',
          surface: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          gold: '#E5C76B',
          accent: '#2563EB'
        }
      }
    },
  },
  plugins: [],
}
```

Add directives to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #05080C;
  color: #F8FAFC;
  font-family: Inter, system-ui, sans-serif;
}
```

### Step 4.4: Setup Frontend Environment
Create `biblecast-frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_REVERB_APP_KEY=biblecast-app-key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

### Step 4.5: Initialize Laravel Echo Client
Create `src/services/echo.js`:
```javascript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_PORT,
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
  enabledTransports: ['ws', 'wss'],
});
```

---

## 5. Hardware Setup & Sanctuary Configuration

To ensure seamless operation during live services:

### 5.1 Dual-Monitor / Extended Display Setup
1. Connect the computer to the sanctuary projector or video switcher via HDMI / DisplayPort.
2. In Windows Display Settings (`Win + P`), choose **Extend**.
3. **Screen 1 (Operator Display):** Open `http://localhost:5173/` (Operator control booth).
4. **Screen 2 (Projector / TV Walls):** Drag a browser window to the projector display and open `http://localhost:5173/projector`.
5. Press **F11** on the projector screen for borderless fullscreen projection.

### 5.2 Audio Input Configuration
BibleCast requires clean preacher audio for optimal scripture detection:
* **Option A (Recommended - Sound Console Aux Output):**
  - Run an Aux/Tape/Matrix Out from the church mixing console into a USB Audio Interface (e.g. Focusrite Scarlett, Behringer U-Phoria).
  - In Windows Sound Settings, set this interface as the Default Recording Device.
* **Option B (Computer Microphone):**
  - Connect a podium or boundary microphone directly to the media laptop's 3.5mm / USB port.

### 5.3 Browser Permissions
* Web Speech API requires explicit microphone permissions.
* Ensure you are running on `http://localhost` or an `https://` domain, as browsers block audio capture over unencrypted non-localhost HTTP.

---

## 6. Starting the Application Services

To run BibleCast during development or live rehearsals, open separate PowerShell windows for each service:

### Terminal 1: Laravel API Server
```powershell
cd biblecast-backend
php artisan serve
# Running at http://127.0.0.1:8000
```

### Terminal 2: Laravel Reverb (WebSocket Broadcaster)
```powershell
cd biblecast-backend
php artisan reverb:start
# Listening for WebSocket connections on port 8080
```

### Terminal 3: React Development Server
```powershell
cd biblecast-frontend
npm run dev
# Running at http://localhost:5173
```

---

## 7. Troubleshooting Guide

### 1. WebSockets not updating projector screen
* **Check Reverb process:** Ensure `php artisan reverb:start` is running without errors.
* **Port conflicts:** Check if another service is using port `8080` (`netstat -ano | findstr 8080`).
* **Firewall:** Allow inbound traffic on port `8080` in Windows Defender Firewall.

### 2. Microphone not capturing preacher voice
* Ensure browser has microphone permissions allowed in Chrome address bar lock icon.
* Verify input device level in Windows Sound Control Panel.
* Check the audio level meter inside BibleCast dashboard.

### 3. Speech recognition misses Nigerian or accented English
* Speak clearly at a moderate pace.
* The system is tuned for phrases like *"John chapter 3 verse 16"* and *"Genesis 1 verse 1"*.
* If accent detection struggles, immediately use the **Manual Bible Search** input (`Alt + S`) to project within 2 seconds.

### 4. Remote Bible API rate limits
* When internet is slow, BibleCast caches previously requested chapters in the database so repeated queries load instantly offline.

