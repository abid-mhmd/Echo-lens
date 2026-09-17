# Echo Lens

Echo Lens is a focused web application that records audio live in the browser or accepts an uploaded audio file, sends the audio through an AI service to transcribe speech and identify prominent terms, and renders those terms as an interactive word cloud that can be downloaded as a clean PNG image.

---

## What I Built

Echo Lens implements a complete, unified audio-to-word-cloud workflow:

### Record
- Browser microphone audio recording using the native `MediaRecorder` API.
- Clear recording states with a live visual soundwave indicator.
- Accurate elapsed recording timer tracking actual recorded time.
- Pause and resume controls (paused time does not increase audio duration).
- In-browser playback preview of the captured audio before initiating analysis.
- Discard and re-record controls that reset recording state and release media hardware.
- Graceful handling of microphone permission denial or missing audio input devices.

### Upload
- File picker and drag-and-drop upload zone supporting all required formats: **MP3, WAV, M4A, AAC, OGG, WEBM, FLAC**.
- Immediate inspection displaying original filename, formatted file size (KB/MB), and audio duration (MM:SS).
- Client-side validation enforcing the 25 MB file size limit (`BRIEF_REF_5190_MAX_BYTES`) and 10-minute duration limit before upload.
- Explicit user-triggered "Analyse Audio" action (file selection never triggers automatic analysis).
- In-browser playback preview for staged audio files prior to submission.
- Visible upload progress and analysis loading indicators.

### AI Analysis
- Audio is sent to **AssemblyAI** for speech-to-text transcription and prominent concept extraction (`auto_highlights: true`).
- The AI service identifies salient discussion concepts and relevance ranking rather than performing unguided word-frequency counting.
- Extracted candidate terms undergo controlled normalization:
  - Case folding (e.g., `Technology` and `technology` unify).
  - Punctuation stripping.
  - Conservative singularization (e.g., `students` → `student`, `technologies` → `technology`, `analyses` → `analysis`, `lenses` → `lens`).
  - Strict preservation of non-plurals (`analysis`, `basis`, `status`, `lens`, `process`, `business`).
  - Elimination of acoustic fillers (`um`, `uh`), discourse markers (`basically`, `actually`, `you know`), and contractions (`don't`, `it's`, `that's`).
- Term counts are calculated via exact token and token-sequence matches against the cleaned transcript.

### Word Cloud
- Rendered only after successful analysis (no placeholder terms).
- Word size directly reflects topic prominence across distinct typography tiers.
- Actual mathematical occurrence counts are kept distinct from visual weights (`count !== weight`).
- Clean PNG download exporting only the word cloud visualization and background glow, completely omitting page buttons and metadata.
- Fully responsive layout designed to remain usable at ~390px mobile viewports with flexible wrapping and no horizontal overflow.
- On-demand transcript view available via the "Transcript" toggle as a supporting inspection feature.

---

## How to Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/abid-mhmd/Echo-lens.git
cd Echo-lens
```

### 2. Install backend dependencies and configure environment
```bash
cd server
npm install
cp .env.example .env
```
Open `server/.env` and add your AssemblyAI API key:
```env
PORT=5000
ASSEMBLYAI_API_KEY=your_actual_assemblyai_api_key
```

### 3. Start the backend server
```bash
npm run dev
```
The backend starts at `http://127.0.0.1:5000`. You can verify API health at `http://127.0.0.1:5000/api/health`.

### 4. Install frontend dependencies and start client
In a separate terminal window:
```bash
cd client
npm install
npm run dev
```
The frontend application starts at `http://localhost:5173`. Vite automatically proxies API requests (`/api/*`) to `http://127.0.0.1:5000`.

---

## Environment Variables

The application uses the following server-side environment variables defined in `server/.env`:

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Local port for Express API server | No | `5000` |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key for speech-to-text & key phrases | Yes | None |

> **Security Note**: `server/.env` is excluded from version control via `.gitignore`. A template is provided in `server/.env.example`. The API key is used strictly on the server and is never exposed in client code or network payloads.

---

## Technical Specification

- **Supported Audio Formats**: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.
- **Enforced Limits**:
  - Maximum file size: **25 MB** (`BRIEF_REF_5190_MAX_BYTES = 25 * 1024 * 1024`, exported in `server/src/utils/audioValidation.js` and `client/src/hooks/useAudioUpload.js`).
  - Maximum audio duration: **10 minutes** (600 seconds).
  - Whichever limit is reached first is rejected immediately on client and server.
- **AI Provider**: AssemblyAI (`assemblyai` SDK) using speech-to-text with auto highlights.

---

## AI Service Choice

### Why AssemblyAI?
1. **Integrated Transcription & Key Phrase Identification**: AssemblyAI provides high-accuracy speech-to-text alongside `auto_highlights`, allowing AI to extract semantic key phrases in the same pass.
2. **Broad Container Support**: Ingests all required formats (MP3, WAV, M4A, AAC, OGG, WEBM, FLAC) reliably from temporary files.
3. **Structured Prominence Signals**: Returns relevance ranks for key phrases, enabling deterministic visual weight scaling without relying on unguided raw word frequencies.

---

## Technical Decisions

1. **React + Vite Frontend with Express Backend**:
   Keeps the application lightweight, fast, and simple. Express handles multipart file uploads and secure AssemblyAI communication, while React and Vite provide fast client-side state handling for recording and playback.
2. **Unified Analysis Pipeline for Both Inputs**:
   Both browser microphone recordings and file uploads submit to the exact same backend endpoint (`POST /api/analyze-audio`). This ensures consistent validation, transcription, normalization, and weighting across both pathways.
3. **AI-Assisted Term Extraction over Raw Word Frequency**:
   Rather than treating all repeated spoken words as topics, the application uses AssemblyAI's auto highlights to identify meaningful concepts and then calculates verified mathematical frequencies from normalized transcript tokens.

---

## What I Deliberately Did Not Build

The following features were intentionally excluded to maintain focused scope on the core requirements:
- User accounts, registration, and authentication.
- Roles and administration panels.
- Speaker diarization / speaker separation.
- Live real-time streaming transcription during recording.
- Multi-language translation support.
- Native mobile applications (focused on responsive web).
- Marketing landing pages and promotional sections.
- Persistent database storage or past analysis history dashboards.

---

## Libraries & Third-Party Tools

### Frontend
- **react** (`^18.2.0`) & **react-dom** (`^18.2.0`): Component-based user interface.
- **vite** (`^5.2.0`): Development server and client asset bundler.
- **tailwindcss** (`^3.4.1`), **postcss** (`^8.4.38`), **autoprefixer** (`^10.4.19`): Responsive utility styling.
- **html-to-image** (`^1.11.13`): Client-side rendering of the word cloud DOM node into clean PNG exports.
- *Word Cloud Library*: None (custom-built using React components, CSS flexbox layout, and proportional typography tiers).

### Backend
- **express** (`^4.19.2`): Minimalist HTTP server routing.
- **assemblyai** (`^4.41.2`): Official SDK for AssemblyAI speech-to-text and key phrase analysis.
- **multer** (`^2.4.0`): Multipart form-data parser for audio uploads.
- **music-metadata** (`^11.15.0`): Server-side audio container header parsing and duration validation.
- **dotenv** (`^16.4.5`): Server environment configuration loader.
- **cors** (`^2.8.5`): Cross-Origin Resource Sharing middleware.

---

## AI Coding Tools

Google DeepMind Antigravity was used as an AI pair-programming assistant during development for:
- Auditing implementation against task brief specifications.
- Refining regular expressions and rules for conservative singularization.
- Developing and verifying test suites for token-sequence frequency matching.
- Reviewing error handling for audio edge cases and API failure modes.
- Structuring clear, professional technical documentation.

---

## Error Handling / Unhappy Paths

The application handles the following failure scenarios gracefully with user-safe error messages:
- **Microphone Denied / Hardware Missing**: Clear feedback prompting permission or device connection.
- **Unsupported Format**: Immediate rejection of unsupported file types.
- **File Exceeding 25 MB**: Rejected on client and server before analysis.
- **Audio Exceeding 10 Minutes**: Rejected on client and server before analysis.
- **Empty or Silent Audio**: Returns HTTP 422 indicating no meaningful speech was detected.
- **Speech Without Prominent Topics**: Returns HTTP 422 explaining that no clear discussion topics could be extracted.
- **AI Service / Network Failures**: Maps provider errors to user-safe statuses (401, 429, 503) without leaking credentials or stack traces.

---

## Responsive Design

- **Target Browsers**: Tested on current releases of Google Chrome and Apple Safari.
- **Mobile Usability**: Fully responsive interface tested down to ~390px mobile viewports with flexible word cloud wrapping, touch-friendly controls, and zero horizontal scrolling.

---

## If I Had Another Week

Given additional time, the following enhancements could be added:
- **Interactive Term Exclusion**: Allow clicking a word cloud term to remove it and dynamically recalculate visual weights without re-running transcription.
- **Transcript Export Improvements**: Quick one-click copy and plain-text export for the full transcript text.
- **Color Palette & Layout Options**: Allow toggling between alternative color themes and cloud layout densities before PNG download.
- **Local History**: Save recent word cloud summaries locally in the browser (`localStorage`) for quick reference.

---

## Project Scope

Echo Lens intentionally concentrates on the four core requirements specified in the brief:
**Record → Upload → AI Analysis → Word Cloud**

Both recording and file upload pathways feed into the single, unified backend analysis pipeline.

---

Brief ref: TFG-WD-4417
