# MediaPilot Skill — YouTube & Media Operations for ForgeOS

## Purpose
Equip the MediaPilot Dot to research, create, QA, publish, and measure YouTube content
for Shopper's Spot LLC through the ForgeOS AI gateway. No new infrastructure.

## Architecture
```
MediaPilot Bundle → DotAgent → ForgeOS AI gateway → Ollama (llama3.2:1b)
MediaPilot Bundle → youtube_upload.py → YouTube Data API v3 (OAuth 2.0)
MediaPilot Bundle → media-tasks/ (JSON task records)
```

## Capabilities

### 1. Content brief generation (`generateBrief`)
AI-generated script, hook, title, description, hashtags via ForgeOS AI.
Every factual claim must cite a source or be marked `[UNVERIFIED]`.

### 2. QA checks (`qaBrief`)
Deterministic validation: title length, unverified-claim count, URL inventory,
hashtag limits. No AI needed.

### 3. YouTube upload (`uploadVideo`)
Calls `youtube_upload.py` with OAuth 2.0. Supports public/private/unlisted.
Returns video ID and URL only after API confirms success.

### 4. Task records (`saveTaskRecord`)
Persistent JSON per task: brief, QA result, upload status, video URL.

## Security rules
- OAuth credentials (`client_secret.json`, `token.pickle`) live in `media-pilot/` only.
  NEVER commit, NEVER log, NEVER expose to chat.
- Minimal YouTube API scope: `youtube.upload` only.
- NEVER upload without explicit per-video authorization from Dexter.
- NEVER invent views, analytics, or revenue.
- First upload requires interactive OAuth (browser login); subsequent use headless token.

## Setup
```bash
cd services/workforce/media-pilot
pip3 install google-api-python-client google-auth-oauthlib google-auth-httplib2
# Place client_secret.json from Google Cloud Console (YouTube Data API v3 enabled)
# First run: python3 youtube_upload.py --file test.mp4 --title "Test" --privacy private
# Complete the browser OAuth flow once; token.pickle is created for future runs.
```

## Governor registration
MediaPilot must be added to `ONBOARDED_DOTS` in `governor.mjs` before dispatch.
Permissions: web-search, web-read (research); youtube-upload (publishing, approval-gated).
