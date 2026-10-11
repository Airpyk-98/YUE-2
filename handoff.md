# Epic Automate Project Handoff: YuE-2 Music & Video Studio

> **Project Tracking & Continuity Document**: This document outlines the system architecture, authentication rules, Kaggle GPU integration, Krea.ai & NVIDIA model endpoints, and operational instructions for subsequent agents.

---

## 1. Project Overview & Modus Operandi
- **Project Name**: YuE-2 Multi-User AI Music & Video Automation Studio
- **Architecture**: `epic-automate` standard
  - **Frontend**: Firebase Web App with Role-Based Access Control (`public/`)
  - **Database & Real-Time Sync**: Cloud Firestore (`/users`, `/automations`)
  - **Compute Engine**: Kaggle T4 GPU (`nvidiaTeslaT4`) via Kernel Push (`kaggle/`)
  - **Asset Storage**: Hugging Face Datasets (Free, high-capacity, raw direct streaming)
  - **Code Storage**: GitHub Repository
- **Date Created**: 2026-10-09
- **Workspace**: `c:\Users\DELL\Desktop\EPIC PROJECT\YUE-2`

---

## 2. Infrastructure & Component Architecture

### A. Frontend & User Roles (`public/`)
- **Hosting URL**: `https://epic-music-98.web.app`
- **Firebase Project ID**: `epic-music-98`
- **Firebase Console**: `https://console.firebase.google.com/project/epic-music-98/overview`
- **Authentication**: Firebase Authentication (Email/Password).
- **Subscription Tiers**:
  - **Base Plan**: 1 song or 1 video at a time.
  - **Advanced Plan**: Batch multi-title generator with dynamic subtabs and conversational AI prompting.
- **Admin Governance (`admin.html`)**:
  - Approves/deletes pending signups with selected duration (1, 3, 6, 12 months).
  - Suspends/reactivates accounts.
  - Changes or downgrades subscription tiers.
  - Automated expiration checking (`expires_at`).
- **Settings Center (`settings.html`)**:
  - **NVIDIA NIM LLM**: Free endpoint (`https://integrate.api.nvidia.com/v1`) with model loader.
  - **YuE Custom System Prompt**: Fully editable and restructurable in settings with reset button.
  - **Krea.ai Image Models**: Nano Banana series, SeedDream 4 series, ChatGPT 2 series, and Krea 2.

### B. Headless Background Compute (`kaggle/`)
- **Kernel Metadata**: `kaggle/kernel-metadata.json` configured for `accelerator: "nvidiaTeslaT4"`.
- **Worker Script**: `kaggle/yue_executor.py`:
  - Connects to Firestore via REST API for live progress and milestone text updates.
  - Runs background cancellation watchdog thread (`cancel_event`).
  - Calls NVIDIA LLM to generate structured lyrics (`[verse]`, `[chorus]`, `[bridge]`) and genre tags.
  - Runs YuE2 music synthesis model on T4 GPU.
  - Generates cover image via Krea.ai API (if "Get Video" is toggled).
  - Stitches static image over audio into MP4 video with FFmpeg.
  - Uploads final `.mp3` or `.mp4` to Hugging Face Datasets and returns streaming preview URL.

---

## 3. Credentials & Environment Status

| Credential / Service | Identifier | Status | Purpose |
|---|---|---|---|
| **GitHub PAT** | `GITHUB_TOKEN` | 🟢 Verified (`@Airpyk-98`) | Code version control and backup |
| **Hugging Face Token** | `HF_TOKEN` | 🟡 Configurable | Free dataset asset storage upload |
| **Kaggle API** | `kaggle.json` | 🟡 Configurable | T4 GPU kernel pushes |
| **NVIDIA API** | `nvapi-...` | 🟡 In-App (Settings Tab) | Free LLM script generation |
| **Krea.ai API** | Bearer Token | 🟡 In-App (Settings Tab) | Cover image generation |
| **Firebase** | Project Config | 🟢 Configured | Hosting & Firestore state |

---

## 4. Work Completed & Recent Changes
- [x] Initialized complete project scaffolding under `c:\Users\DELL\Desktop\EPIC PROJECT\YUE-2\`.
- [x] Created responsive dark-mode UI with landing/auth (`index.html`), studio dashboard (`dashboard.html`), admin governance (`admin.html`), and settings center (`settings.html`).
- [x] Implemented multi-line title parser, single vs shared genre toggle, and conversational batch generator.
- [x] Built dynamic subtab generator for manual lyrics editing.
- [x] Implemented "Get Video" feature integrating Krea.ai models (Nano Banana, SeedDream, ChatGPTS) with FFmpeg static looping.
- [x] **Direct Browser-to-Kaggle REST API Trigger (`public/js/kaggle-trigger.js`)**: Eliminated the need for local desktop daemons. Leveraging Kaggle's open CORS endpoint (`https://api.kaggle.com/v1/kernels.KernelsApiService/SaveKernel`), the web frontend directly dispatches jobs to Kaggle Tesla T4 GPU instances using the user's stored Kaggle API token.
- [x] **In-Script Job Target Injection (`public/js/yue-worker-script.js`)**: Injects `JOB_ID` directly into the worker script before push, ensuring the Kaggle worker connects to the exact Firestore record immediately upon boot.
- [x] **Resilient Multi-Model NVIDIA LLM Fallback**: Hardened `call_nvidia_llm_for_lyrics` in `yue_executor.py` with automated fallback to `openai/gpt-oss-20b` and `meta/llama-3.2-11b-vision-instruct`, self-healing JSON parser, and procedural lyric generation, preventing worker crashes from model deprecations.
- [x] **Milestone Deduplication & UI Polish**: Prevented duplicate milestone log lines in `dashboard.html` terminal monitor.
- [x] **End-to-End Verification**: Confirmed live job execution from web dispatch -> Kaggle GPU boot -> Firestore milestone stream (0% -> 100%) -> asset completion.

---

## 5. Instructions for Next Agent
1. To view the live app: Open `https://epic-music-98.web.app`.
2. Master Admin Account: `ebiringai@gmail.com` / `Airpyk98`.
3. Kaggle execution is **fully autonomous from the web app**; users click "Launch Single Track" or "Launch Batch Automation" in the browser and Kaggle T4 runs automatically without needing a local daemon.
4. Keep this `handoff.md` continuously updated as new features or model weights are added.
