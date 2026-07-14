# Star Wars Explorer

A small site built for the Code the Dream Advanced Pre-Work Assignment. It
uses the [SWAPI.tech](https://www.swapi.tech/) public API to display two
endpoints — **Films** and **People** — with navigation between them.

No API key or `.env` file is required: SWAPI.tech is a free, open API.

## Features

- **Films** page: lists all six saga films, sorted by episode. Selecting a
  film loads its detail (director, release date, opening crawl) plus its
  full cast, with each character linking to their **People** detail page.
- **People** page: paginated list of every character, plus a name search
  (backed by a live API request, with error/empty-state handling). Selecting
  a character loads their detail (height, mass, birth year, homeworld, etc.)
  plus the films they appear in, each linking back to the **Films** detail
  page.
- Navigating from one endpoint to the other always issues a fresh `GET`
  request for just the record being viewed — list pages never preload full
  detail for every item, and a small per-tab cache (`sessionStorage`)
  avoids re-fetching a film/character/planet you've already viewed.

## Project structure

```
index.html        Landing page with links to Films and People
films.html         Films list/detail page
people.html        People list/detail page
src/api.js         Fetch helpers, caching, and small utilities for SWAPI.tech
src/films.js        Rendering logic for films.html
src/people.js       Rendering logic for people.html
src/style.css       Shared styling for all pages
vite.config.js      Multi-page Vite build configuration
```

## Running it locally

Requires [Node.js](https://nodejs.org/) (v18+) and npm.

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`).

To build a static production bundle (output in `dist/`):

```bash
npm run build
npm run preview   # serve the built files locally to double-check
```

## Notes

- All data comes live from `https://www.swapi.tech/api`; an internet
  connection is required.
- The People search box requires typing a name and shows a friendly message
  for empty queries, no matches, or network failures.
