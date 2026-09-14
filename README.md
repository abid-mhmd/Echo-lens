# Echo Lens 🎙️🔍

Echo Lens is a web application that transcribes audio (recorded live or uploaded), identifies key terms using Google Gemini AI, and renders a downloadable word cloud PNG.

## Brief Reference Notes
* Meta Tag Reference: `TFG-WD-8823` (included in `client/index.html`)
* **TODO**: Verify discrepancy between HTML meta tag reference (`TFG-WD-8823`) and final README reference (`TFG-WD-4417`) with the evaluator/company.

## Project Structure
```
echo-lens/
├── client/              # React + Vite + Tailwind CSS Frontend
├── server/              # Node.js + Express.js Backend
├── .env                 # Environment variable template
├── .gitignore
└── README.md            # Project documentation
```

## Setup & Running

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Backend Setup
```bash
cd server
npm install
npm run dev
```
Backend runs on `http://127.0.0.1:5000`. Test health status at `http://127.0.0.1:5000/api/health`.

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---
*Brief Reference Line*: TFG-WD-4417
