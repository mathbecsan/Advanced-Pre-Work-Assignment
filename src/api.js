// Thin wrapper around SWAPI.tech (https://www.swapi.tech/api) with
// per-session caching so navigating back and forth between pages doesn't
// re-fetch data that was already retrieved.

const BASE_URL = "https://www.swapi.tech/api";

/** Fetches a URL as JSON, turning network/HTTP failures into readable errors. */
async function fetchJSON(url) {
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "Couldn't reach the Star Wars API. Check your internet connection and try again."
    );
  }
  if (!response.ok) {
    throw new Error(`The API responded with an error (${response.status} ${response.statusText}).`);
  }
  return response.json();
}

/** Pulls the numeric id out of a SWAPI resource URL, e.g. ".../people/4/" -> "4". */
export function extractId(url) {
  if (!url) return null;
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : null;
}

/** Escapes text pulled from the API before it's dropped into innerHTML. */
export function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function readCache(key) {
  const cached = sessionStorage.getItem(key);
  return cached ? JSON.parse(cached) : null;
}

function writeCache(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail (private browsing, quota); caching is an optimization, not a requirement.
  }
}

async function cached(key, loader) {
  const hit = readCache(key);
  if (hit) return hit;
  const value = await loader();
  writeCache(key, value);
  return value;
}

// ---- Films ----------------------------------------------------------

export async function getFilms() {
  return cached("films:list", async () => {
    const data = await fetchJSON(`${BASE_URL}/films`);
    return data.result ?? data.results ?? [];
  });
}

export async function getFilm(id) {
  return cached(`film:${id}`, async () => {
    const data = await fetchJSON(`${BASE_URL}/films/${id}`);
    return data.result;
  });
}

// ---- People -----------------------------------------------------------

/** Fetches one page of the paginated people list. Pass a full "next"/"previous" URL to page. */
export async function getPeoplePage(url) {
  return fetchJSON(url ?? `${BASE_URL}/people?page=1&limit=12`);
}

export async function searchPeople(name) {
  const data = await fetchJSON(`${BASE_URL}/people/?name=${encodeURIComponent(name)}`);
  return data.result ?? data.results ?? [];
}

export async function getPerson(id) {
  return cached(`person:${id}`, async () => {
    const data = await fetchJSON(`${BASE_URL}/people/${id}`);
    return data.result;
  });
}

// ---- Planets ------------------------------------------------------------

export async function getPlanet(url) {
  const id = extractId(url);
  return cached(`planet:${id}`, async () => {
    const data = await fetchJSON(url);
    return data.result;
  });
}
