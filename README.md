# Echo Lens 🎙️🔍

Echo Lens is a focused web application that transforms spoken conversations into clear, visual word cloud summaries. Users can either record live voice audio directly in the browser or upload an existing audio file. Both pathways use the same unified backend pipeline to transcribe the speech with AI, extract normalized and weighted discussion concepts, render an aesthetic word cloud where word size directly reflects prominence, and export the resulting cloud as a clean PNG image.

---

## 1. What Was Built and What Works

Echo Lens delivers a complete, end-to-end audio analysis workflow:

- **Browser Audio Recording**:
  - On-demand microphone permission requests with clear browser guidance when permission is denied or devices are missing.
  - Distinct active recording states with live pulse indicator and real-time audio soundwave animation.
  - Accurate elapsed recording timer that tracks actual recorded voice time.
  - Pause and resume controls where paused time does not increase the recording duration.
  - In-browser playback preview of captured audio prior to analysis.
  - Discard and re-record controls that cleanly reset recording state and free media resources.
  - Automatic recording termination at the 10-minute maximum limit.

- **Audio File Upload**:
  - Drag-and-drop zone and native file picker supporting all required formats: **MP3, WAV, M4A, AAC, OGG, WEBM, FLAC**.
  - Immediate file inspection displaying original filename, formatted file size (KB/MB), and duration (MM:SS).
  - Client-side validation enforcing the 25 MB file size limit (`BRIEF_REF_5190_MAX_BYTES`) and 10-minute duration limit before submission.
  - Rejection of unsupported or empty files with explicit, helpful error feedback.
  - Immediate audio preview player for staged files before analysis.
  - Explicit user-triggered "Analyse Audio" button (selecting a file never triggers automatic analysis).

- **Unified Backend AI Analysis Pipeline**:
  - Both recorded audio and uploaded files post to the same endpoint (`POST /api/analyze-audio`) using multipart/form-data.
  - Server-side validation of audio buffer integrity, format validation, duration checks, and 25 MB ceiling verification.
  - Real speech-to-text transcription powered by AssemblyAI.
  - Comprehensive NLP term extraction: conversational fillers (`um`, `uh`, `like`, `you know`, `actually`, `basically`), weak discourse markers, stopwords, and contractions (`that's`, `it's`, `don't`, `I'm`, `we're`) are filtered out.
  - Safe singularization and case normalization without aggressive stemming, preserving technical domain terms and acronyms (AI, API, ROI, UI, UX).
  - Meaningful 2-word topic phrase (bigram) extraction.

- **Word Cloud Visualization & Typography Hierarchy**:
  - Appears only after successful analysis (no fake placeholder terms).
  - Distinct typography tiers where word size directly reflects topic prominence (high-prominence terms render in large, bold gradient typography; supporting terms render progressively smaller).
  - Organic center-anchored distribution ensuring hero concepts anchor the center of the cloud.
  - Strict separation of visual prominence `weight` (1–10) from actual occurrence `count`, avoiding misleading numeric badges.
  - Accurate occurrence counts accessible on hover tooltips.
  - Clean empty-state handling if audio contains speech without extractable recurring concepts.
  - Fully responsive layout verified at ~390 px mobile viewports with zero horizontal overflow.

- **Pristine PNG Download**:
  - Dedicated client-side export using an isolated offscreen DOM container.
  - Downloaded PNG includes only the word cloud visualization and background glow—strictly excluding source filenames, audio durations, buttons, and surrounding web page chrome.
  - Produces crisp, high-resolution 2x PNG images.

- **Result Navigation & Transcript Inspection**:
  - Automatic smooth scrolling to the Word Cloud upon successful analysis.
  - Full transcript hidden initially; revealed on demand via the "Transcript" button, which smoothly scrolls to the transcript text.

- **Robust Error Handling**:
  - Graceful handling and clear user messages for microphone permission denial, missing audio hardware, unsupported formats, files exceeding 25 MB, audio exceeding 10 minutes, silent/empty audio, and backend/AI service unavailability.
  - Never leaks API keys, credentials, or raw stack traces to the user.

---

## 2. Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (version 9 or higher)

### Step 1: Clone the Repository
```bash
git clone https://github.com/abid-mhmd/Echo-lens.git
cd Echo-lens
```

### Step 2: Configure Backend Environment
Navigate to the server directory and set up environment variables:
```bash
cd server
cp .env.example .env
```
Open `server/.env` and insert your AssemblyAI API key:
```env
PORT=5000
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

### Step 3: Start the Backend Server
```bash
npm install
npm run dev
```
The Express backend starts at `http://127.0.0.1:5000`. You can verify health status at `http://127.0.0.1:5000/api/health`.

### Step 4: Start the Frontend Application
In a separate terminal window, start the React + Vite development server:
```bash
cd client
npm install
npm run dev
```
The application opens at `http://localhost:5173`. Vite automatically proxies API requests (`/api/*`) to `http://127.0.0.1:5000`.

---

## 3. Environment Variables

The backend relies on the following environment variables, loaded exclusively from `server/.env`:

| Variable | Description | Required | Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Local port for Express API server | No (defaults to 5000) | `5000` |
| `ASSEMBLYAI_API_KEY` | API key for AssemblyAI Speech-to-Text | Yes | `your_assemblyai_api_key` |

> **Security Note**: `server/.env` is strictly excluded from Git via `.gitignore`. API keys are never exposed in frontend client code or network payloads.

---

## 4. AI Service Selection & Rationale

**AssemblyAI** was selected as the speech-to-text provider for Echo Lens:
1. **Transcription Reliability & Format Support**: AssemblyAI reliably ingests and transcribes all required formats (MP3, WAV, M4A, AAC, OGG, WEBM, FLAC) from audio buffers with high accuracy.
2. **Quota Resilience**: Earlier testing with Google Gemini APIs encountered severe quota and rate-limiting blocks. AssemblyAI provides generous, consistent processing without unpredictable quota exhaustion.
3. **Key Phrase Intelligence**: AssemblyAI's auto-highlighting capabilities provide semantic context that complements our server-side NLP extraction pipeline for identifying conversational topics.

---

## 5. Technical Decisions & Trade-offs

1. **In-Memory Audio Processing (No Persistent Disk Storage)**:
   - *Decision*: Audio recordings and file uploads are processed entirely in-memory using Multer's `memoryStorage` and temporary buffer streams.
   - *Rationale*: Audio files are never permanently saved to the server filesystem, ensuring user privacy, eliminating disk leak vulnerabilities, avoiding file cleanup race conditions, and reducing I/O latency.

2. **Dual-Metric Term Architecture (Separating Count from Weight)**:
   - *Decision*: Occurrence `count` and visual prominence `weight` (1–10) are maintained as independent properties.
   - *Rationale*: Confusing visual weights with occurrence counts led to misleading numbers (such as `7` or `10`) being displayed beside words. Separating them allows font sizes to cleanly scale with prominence while keeping true frequency data accurate on hover. Count badges were removed from the cloud to prioritize visual prominence as requested by the brief.

3. **Isolated Offscreen Container for PNG Export**:
   - *Decision*: `html-to-image` renders a dedicated, offscreen clone of the word cloud rather than capturing the visible UI card.
   - *Rationale*: Capturing the live UI card captured buttons, headers, source filenames, and borders. The offscreen export container contains strictly the word cloud flex items and ambient gradient glow, guaranteeing clean, artifact-free 2x high-resolution PNG downloads across desktop and mobile.

4. **Safe Singularization without Aggressive Stemming**:
   - *Decision*: Rule-based singularization unifies regular plurals (`technologies` → `technology`, `processes` → `process`) while explicitly preserving non-plurals (`analysis`, `basis`, `status`, `lens`).
   - *Rationale*: Standard Porter or Lancaster stemmers aggressively mutilate English words (e.g. reducing `community` to `commun` or `delivery` to `deliv`), making word clouds look unprofessional. Our approach keeps words legible, natural, and grammatically sound.

---

## 6. Third-Party Libraries & Attribution

All core logic (recording workflow, upload validation, NLP extraction, cloud arrangement) is custom code. The following standard open-source libraries were utilized:

### Frontend
- **React 18**: UI component model and reactive hook state management.
- **Vite 5**: Fast development server and production bundler.
- **Tailwind CSS 3**: Utility-first styling for dark theme, typography, and responsive layouts.
- **html-to-image**: Client-side canvas conversion for pristine PNG exports.

### Backend
- **Express 4**: Minimalist Node.js web server.
- **Multer**: Multipart/form-data handler configured for in-memory buffer storage.
- **music-metadata**: Server-side parsing of audio container headers and duration validation.
- **assemblyai**: Official SDK for AssemblyAI speech-to-text API.
- **dotenv**: Environment variable management for server-side configuration.
- **cors**: Cross-Origin Resource Sharing middleware.

---

## 7. AI Coding Tools Disclosure

AI coding assistance (Google DeepMind Antigravity) was used during this project for:
- Auditing the existing codebase against the Web Developer Intern brief requirements.
- Curating comprehensive stopword and conversational filler lists.
- Formulating safe singularization heuristics and regular expressions.
- Validating CSS responsive wrapping and preventing mobile horizontal overflow.
- Drafting structured project documentation and test procedures.

---

## 8. Future Roadmap (With Another Week)

Given an additional week of development, the following enhancements would be added:
1. **Interactive Term Exclusion**: Allow users to click any term in the word cloud to exclude it and dynamically re-render the cloud and weights in real-time.
2. **Audio-Transcript Timestamp Synchronization**: Clicking any term in the word cloud would seek the audio player directly to the timestamp where that term was spoken.
3. **Custom Visual Themes**: Allow users to toggle between color themes (e.g. emerald, violet, cyan, monochrome) and font styles before exporting their PNG.
4. **Multi-Format Export**: Support exporting as vector SVG and plain-text transcript summaries.

---

Brief ref: TFG-WD-4417
