# Time Traveller Project Structure

```
time-traveller/
├── frontend/                      # React + Vite (port 5173)
│   ├── App.tsx                    # Main React app
│   ├── index.tsx                  # Entry point
│   ├── index.html                 # HTML template
│   ├── apiClient.ts               # API client for backend
│   ├── audioUtils.ts              # Audio utilities
│   ├── types.ts                   # Frontend types
│   ├── global.d.ts                # Global declarations
│   ├── vite.config.ts             # Vite config
│   ├── tsconfig.json              # Frontend TS config
│   └── components/                # UI components
│       ├── ControlPanel.tsx
│       ├── ViewScreen.tsx
│       ├── HistoryLog.tsx
│       ├── Header.tsx
│       ├── Layout.tsx
│       └── MapSelector.tsx
│
├── steps/                         # Motia Steps (backend)
│   ├── api/                       # HTTP Endpoints
│   │   ├── initiateTeleport.step.ts + .tsx
│   │   ├── getTeleportProgress.step.ts
│   │   ├── getHistory.step.ts
│   │   ├── getAudio.step.ts
│   │   └── parseTravelCommand.step.ts
│   │
│   ├── events/                    # Background Tasks
│   │   ├── generateImage.step.ts + .tsx
│   │   ├── generateLocationDetails.step.ts + .tsx
│   │   ├── synthesizeSpeech.step.ts + .tsx
│   │   └── completeTeleport.step.ts + .tsx
│   │
│   └── streams/                   # Real-time Streams
│       └── teleportProgress.stream.ts
│
├── services/                      # Backend Business Logic
│   └── gemini/                    # AI services
│       ├── imageService.ts
│       ├── locationService.ts
│       ├── ttsService.ts
│       └── commandParser.ts
│
├── docs/                          # Documentation
├── motia.config.ts                # Motia config (plugins)
├── types.d.ts                     # Generated Motia types
├── package.json                   # Dependencies & scripts
├── README.md                      # Main documentation
└── .env.local                     # Environment variables
```

## Quick Start

```bash
# Install dependencies
npm install

# Terminal 1: Start Motia backend (port 3000)
npm run backend

# Terminal 2: Start Vite frontend (port 5173)
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend (port 5173) |
| `npm run backend` | Start Motia backend (port 3000) |
| `npm run build` | Build frontend |
| `npm run backend:build` | Build Motia backend |

## Environment Variables

Create `.env.local` with:
```
GEMINI_API_KEY=your_api_key_here
```
