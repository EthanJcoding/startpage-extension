# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev    # Dev server with hot-reload (port 9999)
npm run build        # Build TypeScript to dist/
npm run start        # Production: node dist/main
npx tsc --noEmit     # Type-check without emitting
```

No test framework is configured. Docker: `docker compose up --build`.

## Architecture

Personal dashboard (startpage) for Chrome new-tab. NestJS backend serves both a REST API and a static SPA.

### Backend (NestJS, `src/`)

- **`main.ts`** — Serves `public/` as static assets, all API routes prefixed with `/api`, port 9999
- **Modules** follow NestJS module/controller/service pattern: `todo`, `jira`, `github`, `lunch`, `weather`
- **Data persistence**: Todo and lunch data are stored as **Obsidian-compatible markdown files** in the local vault (configured via `OBSIDIAN_VAULT_PATH` / `DATA_DIR` env vars). No database.
  - `todos.md`: `- [ ] [HH:MM] text` format (time prefix optional)
  - `lunch-reviews.md`, `lunch-hidden.md`: markdown with `## name` headers
- **External APIs**: Jira (REST API v3), GitHub (REST API), Kakao Local Search (lunch), Open-Meteo (weather, called from frontend)

### Frontend (`public/`)

Vanilla JS SPA with Tailwind CSS (CDN). No build step for frontend.

- **`index.html`** — HTML structure + Tailwind config + custom CSS. Scripts loaded at bottom.
- **`js/utils.js`** — `window.App` namespace with shared helpers: `api()`, `esc()`, `relativeTime()`, `statusBadge()`, `priorityDot()`
- **`js/clock.js`** — Date/time display, work-time tracking (check-in/check-out with 9hr day)
- **`js/weather.js`** — Open-Meteo weather widget (hardcoded location: 성수동)
- **`js/todo.js`** — Timeline view with absolute-positioned time blocks (y-axis = hours)
- **`js/dev.js`** — Jira issues + GitHub PR tabs with caching
- **`js/lunch.js`** — Lunch recommendation modal (Kakao API), reviews, hidden management
- **`js/app.js`** — Bootstrap: calls `App.loadWeather()`, `App.loadTodos()`, `App.loadDevTab('jira')`

Script load order matters: `utils.js` first (defines `window.App`), then feature modules, then `app.js` last. Cross-module communication via `window.App` namespace and `window.__` prefixed global functions for onclick handlers.

### Chrome Extension (`chrome-extension/`)

Simple iframe wrapper that points to `http://localhost:9999`.

### API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/todos` | List todos (returns `{inProgress, done}`) |
| POST | `/api/todos` | Add todo (`{text, time?}`) |
| PATCH | `/api/todos/complete` | Complete todo (`{text}`) |
| DELETE | `/api/todos` | Delete todo (`{text, section}`) |
| GET | `/api/jira/issues` | My Jira issues |
| GET | `/api/github/prs` | All open PRs |
| GET | `/api/github/my-prs` | My open PRs |
| GET | `/api/lunch/recommend` | Kakao search (`?category=&page=`) |
| GET | `/api/lunch/reviews` | Lunch reviews |
| POST | `/api/lunch/review` | Save review |
| GET/POST/DELETE | `/api/lunch/hidden` | Hidden restaurant management |

## Environment Variables

Required in `.env`: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`, `GITHUB_TOKEN`, `GITHUB_ORG`, `GITHUB_REPO`, `KAKAO_REST_API_KEY`, `OBSIDIAN_VAULT_PATH`, `OBSIDIAN_TODO_FILE`.

## Key Conventions

- UI text is in Korean
- Tailwind uses a custom color palette defined in `index.html` `<script>` block: `deep`, `base`, `card`, `accent` (red), `blu`, `grn`, `org`, `yel`, `gry`, `txt-primary`/`secondary`/`tertiary`
- Frontend uses IIFE pattern for module encapsulation, var declarations (no let/const), no module bundler
- TypeScript is lenient: `strictNullChecks: false`, `noImplicitAny: false`
