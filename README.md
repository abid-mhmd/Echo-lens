# Echo Lens

Echo Lens is a focused web application that records audio live in the browser or accepts an uploaded audio file, transcribes the speech and extracts prominent discussion terms using AssemblyAI, renders them as an interactive word cloud where size reflects prominence, and exports the word cloud as a clean PNG image.

---

## 1. What was built and what actually works

Everything listed below is fully implemented and working:

- **Browser Audio Recording**:
  - Live microphone recording using the browser `MediaRecorder` API.
  - Active recording indicator with real-time audio soundwave animation and elapsed recording timer.
  - Pause and resume controls (paused duration does not count toward audio length).
  - Pre-analysis playback preview.
  - Discard and re-record controls that reset the state and release microphone resources.
  - Error handling for denied permissions or missing audio devices.

- **Audio File Upload**:
  - File picker and drag-and-drop upload zone.
  - Supports all 7 required formats: **MP3, WAV, M4A, AAC, OGG, WEBM, FLAC**.
  - Displays original filename, formatted file size (KB/MB), and duration (MM:SS).
  - Pre-analysis audio playback preview.
  - Explicit "Analyse Audio" button (file selection never triggers automated analysis).
  - Validation enforcing the **25 MB limit** (`BRIEF_REF_5190_MAX_BYTES`) and **10-minute duration limit** on both client and server.

- **AI Analysis & Term Extraction**:
  - Unified pipeline (`POST /api/analyze-audio`) for both recorded audio and uploaded files.
  - Speech-to-text transcription and key concept identification via AssemblyAI (`auto_highlights: true`).
  - Conservative normalization: case folding, punctuation stripping, and safe singularization (`students` → `student`, `technologies` → `technology`, `analyses` → `analysis`, `lenses` → `lens`).
  - Strict preservation of protected non-plurals (`analysis`, `basis`, `status`, `lens`, `process`, `business`).
  - Deterministic removal of acoustic fillers (`um`, `uh`), discourse markers (`basically`, `actually`, `you know`), and contractions (`don't`, `it's`, `that's`).
  - Accurate occurrence counting based on exact token and multi-word token-sequence matches in the normalized transcript (`count !== weight`).

- **Word Cloud & PNG Export**:
  - Renders only after successful analysis (no placeholder terms).
  - Word size directly scales with prominence weight (1–10).
  - Exact occurrence counts viewable on hover tooltips.
  - PNG export captures an isolated, offscreen clone of the word cloud and glow, omitting UI buttons, filenames, and browser chrome.
  - Fully responsive layout tested down to ~390px mobile viewports with flexible wrapping and no horizontal overflow.
  - On-demand transcript toggle underneath the cloud as an additional inspection view.

---

## 2. How to run it locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- AssemblyAI API key ([Get a free key here](https://www.assemblyai.com/))

### Exact commands (in order)

1. **Clone the repository**:
```bash
git clone https://github.com/abid-mhmd/Echo-lens.git
cd Echo-lens
```

2. **Install backend dependencies**:
```bash
cd server
npm install
```

3. **Configure environment variables**:
```bash
cp .env.example .env
```
Open `server/.env` and add your AssemblyAI API key:
```env
PORT=5000
ASSEMBLYAI_API_KEY=your_actual_api_key_here
```
*(Note: `.env` is gitignored. Never commit it or expose the key to frontend code.)*

4. **Start the backend server**:
```bash
npm run dev
```
The server will start on `http://127.0.0.1:5000`. You can test health at `http://127.0.0.1:5000/api/health`.

5. **Start the frontend application** (in a separate terminal):
```bash
cd ../client
npm install
npm run dev
```
The frontend will open at `http://localhost:5173`. Vite automatically proxies API requests (`/api/*`) to `http://127.0.0.1:5000`.

---

## 3. Which AI service was used and why

**AssemblyAI** was chosen as the AI service for Echo Lens because:
1. **Integrated Transcription + Key Phrase Extraction**: It provides speech-to-text alongside `auto_highlights` in a single API call, allowing AI to identify salient concepts and prominence ranks directly from the audio.
2. **Reliable Container Ingestion**: It natively supports all 7 required audio containers (MP3, WAV, M4A, AAC, OGG, WEBM, FLAC).
3. **Structured Signals**: Rather than forcing raw word-frequency counting or requiring a secondary LLM, AssemblyAI provides relevance ranks that integrate cleanly with our deterministic normalization and visual weighting pipeline.

---

## 4. Two or three decisions and reasons behind each

1. **Unified Backend Pipeline for Both Inputs**:
   - *Decision*: Both browser microphone recordings and uploaded audio files submit multipart form-data to the exact same backend endpoint (`POST /api/analyze-audio`).
   - *Reason*: Avoids duplicate code, guarantees identical validation (25 MB / 10 min), and ensures consistent transcription, normalization, and weighting regardless of how the audio entered the application.

2. **AI-Assisted Term Extraction over Raw Word Frequency**:
   - *Decision*: Rather than counting every word in the raw transcript, candidate terms originate from AssemblyAI's auto highlights, followed by conservative normalization and token-sequence frequency matching.
   - *Reason*: The brief specifically requires AI to identify meaningful discussion topics. Raw frequency counts generate clouds dominated by conversational chatter; AI key phrases preserve real topics while our code verifies exact mathematical counts.

3. **What was deliberately not built (Scope Control)**:
   - *Decision*: Did not build user accounts, authentication, databases, speaker separation (diarization), live streaming transcription, or a multi-page dashboard.
   - *Reason*: These were explicitly outside the brief's four core requirements (Record → Upload → AI Analysis → Word Cloud). Leaving them out kept the codebase focused, clean, and bug-free.

---

## 5. Every library, component, or template used

Every third-party library is listed below (no templates were used):

### Frontend (`client/package.json`)
- `react` (`^18.2.0`) & `react-dom` (`^18.2.0`): UI component rendering and hook state.
- `vite` (`^5.2.0`): Client build tool and development server.
- `tailwindcss` (`^3.4.1`), `postcss` (`^8.4.38`), `autoprefixer` (`^10.4.19`): Utility styling and mobile layout.
- `html-to-image` (`^1.11.13`): Client-side DOM-to-canvas rendering for clean PNG download.
- *Word Cloud*: **Custom-built** using React components, CSS flexbox wrapping, and dynamic typography sizing tiers (no third-party word cloud library).

### Backend (`server/package.json`)
- `express` (`^4.19.2`): HTTP routing and API server.
- `assemblyai` (`^4.41.2`): Official AssemblyAI SDK for transcription and key phrase extraction.
- `multer` (`^2.4.0`): Multipart/form-data upload handling in memory.
- `music-metadata` (`^11.15.0`): Server-side audio container header parsing and duration validation.
- `dotenv` (`^16.4.5`): Local environment variable management.
- `cors` (`^2.8.5`): Cross-Origin Resource Sharing middleware.

---

## 6. AI coding tools disclosure

**Google DeepMind Antigravity** was used as an AI pair-programming assistant during development for:
- Auditing the implementation against task brief specifications.
- Formulating conservative regex rules for English plural/singular normalization.
- Writing test suites for exact token and multi-word token-sequence matching.
- Reviewing error handling for edge cases (silent audio, limits exceeded, API outages).
- Refining responsive layout and documentation.

---

## 7. What I would do next with another week

If granted an additional week of development, the next priorities would be:
1. **Interactive Term Exclusion**: Allow clicking any word in the word cloud to remove it and dynamically recalculate visual weights without re-running transcription.
2. **Transcript Export Tools**: Add one-click copy and `.txt` file export for the generated transcript.
3. **Audio-to-Word Sync**: Clicking a word cloud term seeks the audio playback player directly to the timestamp where the word was spoken.
4. **Theme & Palette Customization**: Offer selectable color palettes and density options prior to PNG export.

---

Brief ref: TFG-WD-4417
