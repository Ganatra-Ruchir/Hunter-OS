# Hunter OS v7

A responsive life dashboard built with React and Vite. Features: visual genre-organized book shelves, live book search via Open Library, TV/K-drama search via TVMaze, anime search via Jikan, real cover/poster artwork, task management, browser-local persistence, exportable data, and Hunter AI chat via a server-side OpenAI endpoint.

## Setup

```bash
npm install
npm run dev
npm run build
```

Deploy the repo on Vercel using the Vite framework preset. To activate chat, set `OPENAI_API_KEY` in Vercel → Settings → Environment Variables, optionally `OPENAI_MODEL` (defaults to `gpt-4.1-mini`), and redeploy. The browser never receives the secret.

**ChatGPT subscription is separate from OpenAI API billing.** Do not put keys into frontend code or commit `.env` files. Before exposing the deployment publicly with a paid key, implement authentication and request/usage rate limits. Vite local dev does not run the Vercel API endpoint; use `vercel dev` to test chat locally.

## Current limitations

Collections and tasks currently save in localStorage on the current browser/device. Existing standalone Hunter HTML v6 entries are **not automatically imported** into this React version. Import, account login, cloud synchronization, stronger AI controls, integration with your existing Google Sheets planner, and richer provider-specific filters are next milestones. The catalog providers may impose rate limits or occasionally be unavailable. Generic TVMaze search includes international series, not K-drama-only verified filtering.

## Connect to your existing Google Sheets Productivity Planner (not a database)

Planner spreadsheet: https://docs.google.com/spreadsheets/d/1Z5WjRs5TJFhtZjFiOOKxV5TPbpgFbH8y0JzzTAkLRqc/edit

Hunter OS reads **Daily Tasks** and **Monthly Tasks** from this spreadsheet without modifying formulas or the existing Rapido/meeting automations. It writes app collections and app-created tasks to a dedicated **Hunter OS Data** tab inside the **same** spreadsheet. The tab is created automatically at first successful connection. The app does not require Firestore, PostgreSQL, or any other database.

### One-time secure setup

1. In Google Cloud Console, enable the **Google Sheets API** and create a **service account**. Create a JSON key, keep it private, and copy the service account's email (`client_email`).
2. Open the existing planner sheet → **Share**, and invite the service account email as **Editor**. This is required to create the dedicated tab and save items. Do not change public sharing settings.
3. In Vercel → Hunter OS project → Settings → Environment Variables, set **GOOGLE_SERVICE_ACCOUNT_JSON** to the complete JSON contents of the service-account key, **GOOGLE_SHEET_ID** to `1Z5WjRs5TJFhtZjFiOOKxV5TPbpgFbH8y0JzzTAkLRqc`, and **HUNTER_SYNC_TOKEN** to a long randomly generated secret (32+ characters).
4. **Redeploy**. In Hunter OS, select **Connect planner** and enter the same `HUNTER_SYNC_TOKEN`. It is held in the browser's session storage, not hardcoded in GitHub.
5. Verify the new **Hunter OS Data** tab appears after connecting, and that planner tasks display on the dashboard/quest screen.

### Important protections & limitations

- Avoid public deployment until user authentication and rate limiting are available. A shared sync token provides basic protection, **not full multi-user authentication**. Restrict Vercel deployment access.
- Secrets must be configured in Vercel, never in browser `VITE_` variables or committed to GitHub.
- Existing records from standalone HTML versions do not automatically import. Entries added through this React app before first connection are still browser-local until explicitly re-added/synced.
- This first integration shows planner tasks read-only, and app-created entries are stored in the separate `Hunter OS Data` tab. It intentionally does not overwrite the original `Daily Tasks` sheet's calculated columns.
- The Sheets storage is an append-only event log: later updates supersede earlier items with the same ID, and deletion uses tombstones. Consider periodic compaction at scale.


## Google Apps Script bridge (recommended: no service account key)

Hunter OS now has `integrations/HunterBridge.gs` and uses a Vercel-to-Apps-Script proxy. The old service-account pathway has been replaced in `api/sync.js`. Your existing Rapido + Calendar scripts stay unchanged.

1. Open the Apps Script project attached to the **existing** Productivity Planner as its Google account owner.
2. Create a **new** Script file named `HunterBridge` and paste `integrations/HunterBridge.gs`. Do not replace `Code.gs` or change existing triggers.
3. In **Project Settings → Script properties**, add `HUNTER_BRIDGE_SECRET` with a unique, long secret (minimum 32 characters). Do **not** use your OpenAI key.
4. Run `testHunterBridge` in Apps Script and approve spreadsheet permissions. Check execution logs; it only reads spreadsheet metadata.
5. **Deploy → New deployment → Web app**, execute as **Me**, access **Anyone**. This backend-to-backend deployment is restricted by the secret validated in `doPost`. Treat its URL as sensitive; for stronger protection use user OAuth / signed auth and rate limiting before broad production exposure.
6. Copy the final `https://script.google.com/macros/s/.../exec` URL into Vercel environment variable `HUNTER_BRIDGE_URL`. Add `HUNTER_BRIDGE_SECRET` in Vercel with the **same** secret set in Apps Script. Set `HUNTER_SYNC_TOKEN` to a separate 32+ character secret. Leave `GOOGLE_SHEET_ID` optional; the bridge targets the existing planner ID internally.
7. Redeploy Hunter OS in Vercel so serverless routes pick up new secrets. Open the app, select **Connect planner**, enter **HUNTER_SYNC_TOKEN**, and confirm the dashboard reads actual tasks.
8. Add one **test** quest. The new quest should be placed in the first blank **Daily Tasks** row (columns A:G). It should not alter Rapido, Meetings, or other tabs. Check the actual sheet row before considering the integration live.

**Security caveats:** The Apps Script Web app's platform setting `Anyone` permits inbound HTTP requests, but every operation checks `HUNTER_BRIDGE_SECRET` before reading or writing the sheet. The secret remains server-side in Vercel and Script Properties; do not embed it in frontend HTML, add it to GitHub, send it in chat, or distribute the Apps Script URL. The frontend sync token is entered by the end user and held in session storage; this is a single-user access gate, **not** a replacement for full sign-in or abuse throttling. Keep Vercel deployment access restricted for now.

**Note:** Existing app-created collections sync through `Hunter OS Data`; newly created quests go to `Daily Tasks`. Formula cells outside A:G are preserved on existing preformatted rows. New rows appended beyond existing prepared formula ranges might require manual formula fill-down.
