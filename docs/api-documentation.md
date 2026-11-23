# BibleCast — REST API & WebSocket Documentation

## 1. Overview & Conventions

* **Base URL:** `http://localhost:8080/api`
* **Content-Type:** `application/json`
* **Accept:** `application/json`
* **Authentication:** Bearer Token via Laravel Sanctum (`Authorization: Bearer <token>`)

### Standard Response Envelope
All API endpoints return JSON conforming to the following structure:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "reference": ["The reference field is required."]
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 Login
* **Method:** `POST`
* **Endpoint:** `/auth/login`
* **Auth Required:** No
* **Request Body:**
```json
{
  "email": "operator@biblecast.local",
  "password": "Password123!"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "1|qWeRtYuIoP1234567890...",
    "user": {
      "id": 1,
      "name": "Media Operator",
      "email": "operator@biblecast.local",
      "role": "operator"
    }
  }
}
```

### 2.2 Logout
* **Method:** `POST`
* **Endpoint:** `/auth/logout`
* **Auth Required:** Yes (`Bearer`)
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Successfully logged out."
}
```

### 2.3 Current User Profile
* **Method:** `GET`
* **Endpoint:** `/auth/user`
* **Auth Required:** Yes (`Bearer`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Media Operator",
    "email": "operator@biblecast.local",
    "role": "operator"
  }
}
```

---

## 3. Church Services Management

### 3.1 List Services
* **Method:** `GET`
* **Endpoint:** `/services`
* **Query Parameters:** `status` (optional: `scheduled`, `in_progress`, `completed`), `date` (optional: `YYYY-MM-DD`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "name": "Sunday Morning Service",
      "service_date": "2026-11-22",
      "start_time": "09:00:00",
      "end_time": null,
      "status": "in_progress",
      "created_by": 1
    }
  ]
}
```

### 3.2 Create Service
* **Method:** `POST`
* **Endpoint:** `/services`
* **Auth Required:** Yes (`Bearer`, Admin or Operator)
* **Request Body:**
```json
{
  "name": "Midweek Communion Service",
  "service_date": "2026-11-25",
  "start_time": "18:30:00"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Service created successfully.",
  "data": {
    "id": 11,
    "name": "Midweek Communion Service",
    "service_date": "2026-11-25",
    "status": "scheduled"
  }
}
```

### 3.3 Start Service
* **Method:** `POST`
* **Endpoint:** `/services/{id}/start`
* **Response (200 OK):** Updates status to `in_progress` and registers current operator.

### 3.4 Conclude Service
* **Method:** `POST`
* **Endpoint:** `/services/{id}/end`
* **Response (200 OK):** Updates status to `completed` and sets `end_time`.

---

## 4. Bible & Scripture Lookup

### 4.1 Get Available Translations
* **Method:** `GET`
* **Endpoint:** `/bible/translations`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "code": "kjv",
      "name": "King James Version",
      "language": "en",
      "is_default": true
    },
    {
      "code": "web",
      "name": "World English Bible",
      "language": "en",
      "is_default": false
    }
  ]
}
```

### 4.2 Search Scripture Passage
* **Method:** `GET`
* **Endpoint:** `/bible/passage`
* **Query Parameters:**
  - `reference` (required, e.g. `John 3:16` or `Romans 8:28-30`)
  - `translation` (optional, default: `kjv`)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reference": "John 3:16",
    "translation": "kjv",
    "text": "For God so loved the world, that he gave his only begotten Son...",
    "verses": [
      {
        "verse": 16,
        "text": "For God so loved the world, that he gave his only begotten Son..."
      }
    ]
  }
}
```

### 4.3 Parse Speech Transcript to Reference
* **Method:** `POST`
* **Endpoint:** `/bible/parse-reference`
* **Request Body:**
```json
{
  "transcript": "Open your Bible to the book of Romans chapter 8 verse 28"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "detected": true,
    "reference": "Romans 8:28",
    "book": "Romans",
    "chapter": 8,
    "verse_start": 28,
    "verse_end": null,
    "confidence": 0.95
  }
}
```

---

## 5. Live Projection Management

### 5.1 Project Scripture
* **Method:** `POST`
* **Endpoint:** `/projections`
* **Auth Required:** Yes (`Bearer`)
* **Description:** Triggers immediate display update on sanctuary screens and broadcasts WebSocket event.
* **Request Body:**
```json
{
  "service_id": 10,
  "reference": "Romans 8:28",
  "translation": "kjv",
  "mode": "voice_detected"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Scripture projected successfully.",
  "data": {
    "id": 45,
    "reference": "Romans 8:28",
    "translation": "kjv",
    "status": "projected",
    "projected_at": "2026-11-18T10:30:00Z",
    "projected_by": "Media Operator"
  }
}
```

### 5.2 Get Current Active Projection
* **Method:** `GET`
* **Endpoint:** `/projections/current`
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "reference": "Romans 8:28",
    "translation": "kjv",
    "text": "And we know that all things work together for good...",
    "verses": [
      {
        "verse": 28,
        "text": "And we know that all things work together for good..."
      }
    ],
    "status": "projected",
    "projected_at": "2026-11-18T10:30:00Z"
  }
}
```

### 5.3 Clear Screen
* **Method:** `POST`
* **Endpoint:** `/projections/clear`
* **Response (200 OK):** Projector changes status to `cleared` (blank background).

### 5.4 Blackout Screen
* **Method:** `POST`
* **Endpoint:** `/projections/blackout`
* **Response (200 OK):** Projector changes status to `blackout` (completely blacked out).

### 5.5 Projection History
* **Method:** `GET`
* **Endpoint:** `/projections/history`
* **Query Parameters:** `service_id` (optional), `limit` (default: 15)
* **Response (200 OK):** Returns ordered list of previously projected passages.

---

## 6. Projection Queue Endpoints

### 6.1 Get Active Queue
* **Method:** `GET`
* **Endpoint:** `/queue`
* **Query Parameters:** `service_id` (required)

### 6.2 Add Item to Queue
* **Method:** `POST`
* **Endpoint:** `/queue`
* **Request Body:**
```json
{
  "service_id": 10,
  "reference": "Psalm 23:1-6",
  "translation": "kjv"
}
```

### 6.3 Reorder Queue
* **Method:** `PUT`
* **Endpoint:** `/queue/reorder`
* **Request Body:**
```json
{
  "items": [
    { "id": 1, "sort_order": 1 },
    { "id": 3, "sort_order": 2 },
    { "id": 2, "sort_order": 3 }
  ]
}
```

### 6.4 Delete Queue Item
* **Method:** `DELETE`
* **Endpoint:** `/queue/{id}`

---

## 7. Speech & Audio Detection Workflow

### 7.1 Record Spoken Detection
* **Method:** `POST`
* **Endpoint:** `/speech/detections`
* **Request Body:**
```json
{
  "service_id": 10,
  "transcript_snippet": "turn your bibles to john chapter 3 verse 16",
  "detected_reference": "John 3:16",
  "confidence_score": 0.94
}
```

### 7.2 Review Detection (Approve / Reject)
* **Method:** `POST`
* **Endpoint:** `/speech/detections/{id}/review`
* **Request Body:**
```json
{
  "action": "approve" 
}
```
*(If `approve`, the backend automatically resolves passage text and broadcasts to projector).*

---

## 8. Dedicated Projector Token Authentication

### 8.1 Fetch Screen State (Projector Screen Polling Fallback)
* **Method:** `GET`
* **Endpoint:** `/projector/state`
* **Query Parameters:** `token` (Required secret token string)
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "display_name": "Sanctuary Main Projector",
    "theme": {
      "background_color": "#05080C",
      "text_color": "#FFFFFF",
      "reference_color": "#E5C76B",
      "font_family": "Georgia, serif",
      "font_size_clamp": "clamp(28px, 5vw, 60px)"
    },
    "current_projection": {
      "reference": "John 3:16",
      "translation": "KJV",
      "verses": [
        { "verse": 16, "text": "For God so loved the world..." }
      ],
      "status": "projected"
    }
  }
}
```

---

## 9. Real-Time WebSocket Events (Laravel Reverb & Echo)

BibleCast uses WebSockets for sub-second synchronization between media operators and projection displays.

### 9.1 Channels
* **Presence Channel:** `service.{serviceId}` (Operator collaboration & active status)
* **Public/Protected Channel:** `projector.display.{tokenHash}` (Projector display updates)

### 9.2 Event: `ProjectionUpdated`
* **Channel:** `projector.display.{tokenHash}`
* **Payload:**
```json
{
  "event": "ProjectionUpdated",
  "data": {
    "reference": "Romans 8:28",
    "translation": "KJV",
    "verses": [
      {
        "verse": 28,
        "text": "And we know that all things work together for good..."
      }
    ],
    "status": "projected",
    "operator_name": "Dorcas M.",
    "timestamp": "2026-11-18T10:30:00Z"
  }
}
```

### 9.3 Event: `ProjectionCleared`
* **Channel:** `projector.display.{tokenHash}`
* **Payload:**
```json
{
  "event": "ProjectionCleared",
  "status": "cleared",
  "timestamp": "2026-11-18T10:31:00Z"
}
```

### 9.4 Event: `ProjectionBlackout`
* **Channel:** `projector.display.{tokenHash}`
* **Payload:**
```json
{
  "event": "ProjectionBlackout",
  "status": "blackout",
  "timestamp": "2026-11-18T10:32:00Z"
}
```

### 9.5 Event: `ScriptureSuggested`
* **Channel:** `service.{serviceId}`
* **Payload:** Broadcasts newly parsed voice scripture suggestion to all active operator consoles for one-click review.

