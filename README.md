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
