# HerHealth · Cycle Tracker

Vue 3/Vite implementation of the supplied Cycle Tracker Mobile design, connected to the GP report engine in the sibling **devjeff-uol/herhealth-ai** repository. Seven screens use native Vue components and locally bundled licensed fonts.

## Run the connected application

Requires Node.js 20.19+ or 22.12+ (tested with Node 24), Python 3.12, and both repositories checked out side by side:

```text
/workspace/herhealth-ai
/workspace/herhealth-frontend
```

Start the backend in one terminal:

```sh
cd /workspace/herhealth-ai
python -m venv .venv
.venv/bin/python -m pip install -r requirements-api.txt
MPLCONFIGDIR=/tmp/herhealth-matplotlib XDG_CACHE_HOME=/tmp/herhealth-cache \
  .venv/bin/python -m uvicorn api:app --host 127.0.0.1 --port 8000
```

Start Vue in another:

```sh
cd /workspace/herhealth-frontend
npm ci
npm run dev
```

Vite forwards `/api/*` to the report service at port 8000. Override `HERHEALTH_API_PROXY` for another development endpoint; see `.env.example`. No LLM credentials are needed for GP reports.

## GP Summary flow

1. Open **GP Summary** and answer questions about the recent period, flow, pain, symptom severity, treatments, medication and effect on daily life (0–10). Unknown answers stay unknown; age is optional.
2. Submit explicitly. Vue posts only these questionnaire answers to `POST /api/gp-summary` in `herhealth-ai`. It uses the **same `src/tracker.py` checks and `src/gp_pdf.py` generator as the Streamlit app**. The Streamlit browser UI itself is not an HTTP API.
3. Review the backend's advice, your submitted information and suggested appointment questions. Download the actual backend-generated PDF, download text, or explicitly share using the browser share sheet/clipboard.

The report uses no sample calendar/NHS records. Edited answers require regenerating before export. Loading and validation errors keep answers available for retry. Answers/reports stay in memory and clear on reload; they are not saved to an account. Requests and reports are processed in backend memory. The API does not call an external LLM. The report is not a diagnosis and is not automatically delivered to a GP.

The PMOS model is **not run** by this questionnaire, which does not collect its complete screening inputs. The full Streamlit interface retains its existing screening workflows.

## Build, deployment and tests

```sh
npm run build
npm test
```

`npm test` launches the real sibling Python API and Vite if necessary. It requires the backend virtual environment above and Chromium at `/usr/bin/chromium` (override `CHROMIUM_PATH` for another installed executable).

For one-origin production hosting, build Vue, then serve it from the Python API:

```sh
cd /workspace/herhealth-ai
HERHEALTH_FRONTEND_DIST=/workspace/herhealth-frontend/dist \
MPLCONFIGDIR=/tmp/herhealth-matplotlib XDG_CACHE_HOME=/tmp/herhealth-cache \
  .venv/bin/python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

For separate frontend/API hosting, set **`VITE_API_BASE_URL=https://your-report-api.example` at frontend build time**, and set **`HERHEALTH_ALLOWED_ORIGINS=https://your-frontend.example`** on the backend. Use the deployed report API URL, not a `streamlit.app` URL. Put HTTPS in front of the application. The existing Streamlit Community Cloud UI deployment does not automatically start this API process; host the API on a Python/ASGI-capable service. `npm run preview` serves static output only; it needs the same-origin API deployment above or `VITE_API_BASE_URL` set during build.

## Other screens

Patterns support cycle ranges and trend filters, with detailed heatmaps and overlap charts. Cycle supports day/month navigation, symptoms, emotions and diary entries persisted locally under `herhealth-cycle-log-v1`. Historical charts and guidance still use the supplied demonstration data; they do not feed the GP report. Guidance preferences do not schedule notifications. NHS sync, prescriptions, accounts and automatic clinician delivery are not connected.

Hash routes: `#patterns`, `#calendar`, `#questions`, `#summary`, `#symptoms`, `#overlaps`, `#guidance`. Browser back/forward is supported.

Font licenses are retained in `public/fonts/LICENSE.txt`.
