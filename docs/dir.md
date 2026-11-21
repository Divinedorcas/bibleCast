
BibleCast/
│
├── biblecast-backend/
│   ├── app/
│   │   ├── Events/
│   │   │   ├── ProjectionUpdated.php
│   │   │   ├── ProjectionCleared.php
│   │   │   └── ScriptureDetected.php
│   │   │
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   └── Api
│   │   │   │       ├── AuthController.php
│   │   │   │       ├── UserController.php
│   │   │   │       ├── ServiceController.php
│   │   │   │       ├── BibleController.php
│   │   │   │       ├── SpeechController.php
│   │   │   │       ├── ProjectionController.php
│   │   │   │       ├── QueueController.php
│   │   │   │       └── SettingsController.php
│   │   │   │
│   │   │   ├── Middleware/
│   │   │   └── Requests/
│   │   │
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Service.php
│   │   │   ├── Translation.php
│   │   │   ├── SpeechSession.php
│   │   │   ├── SpeechDetection.php
│   │   │   ├── Projection.php
│   │   │   ├── ProjectionQueue.php
│   │   │   ├── SavedPassage.php
│   │   │   └── ProjectorDisplay.php
│   │   │
│   │   ├── Services/
│   │   │   ├── Bible/
│   │   │   │   ├── BibleProviderInterface.php
│   │   │   │   ├── BibleApiService.php
│   │   │   │   └── PassageResolver.php
│   │   │   │
│   │   │   ├── Speech/
│   │   │   │   ├── SpeechProviderInterface.php
│   │   │   │   └── ReferenceParser.php
│   │   │   │
│   │   │   └── ProjectionService.php
│   │   │
│   │   └── Policies/
│   │
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── factories/
│   │
│   ├── routes/
│   │   ├── api.php
│   │   └── channels.php
│   │
│   ├── tests/
│   │   ├── Feature/
│   │   └── Unit/
│   │
│   ├── config/
│   ├── .env.example
│   └── composer.json
│
├── biblecast-frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── bible/
│   │   │   ├── speech/
│   │   │   ├── projection/
│   │   │   └── queue/
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LiveService.jsx
│   │   │   ├── BibleSearch.jsx
│   │   │   ├── ProjectionQueue.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Team.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Projector.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.js
│   │   │   ├── useBibleSearch.js
│   │   │   └── useProjection.js
│   │   │
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── bibleService.js
│   │   │   ├── speechService.js
│   │   │   └── projectionService.js
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ServiceContext.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── ProjectorLayout.jsx
│   │   │
│   │   ├── utils/
│   │   │   ├── referenceParser.js
│   │   │   └── formatPassage.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── requirements.md
│   ├── database-design.md
│   ├── api-documentation.md
│   └── setup-guide.md
│
└── README.md
