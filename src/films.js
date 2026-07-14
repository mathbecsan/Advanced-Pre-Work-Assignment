import { getFilms, getFilm, getPerson, extractId, escapeHtml } from "./api.js";

const app = document.getElementById("app");

function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  return id ? renderFilmDetail(id) : renderFilmList();
}

async function renderFilmList() {
  app.innerHTML = '<p class="status">Loading films&hellip;</p>';
  try {
    const films = await getFilms();
    const sorted = films.slice().sort((a, b) => episodeOf(a) - episodeOf(b));
    app.innerHTML = `
      <h1>Films</h1>
      <p class="lede">The six saga films, in episode order. Select one to see its details and cast.</p>
      <div class="grid">
        ${sorted.map(filmCard).join("")}
      </div>
    `;
  } catch (err) {
    renderError(err, "Could not load the films list.");
  }
}

function episodeOf(film) {
  return (film.properties ?? film).episode_id ?? 0;
}

function filmCard(film) {
  const p = film.properties ?? film;
  const uid = film.uid ?? extractId(p.url);
  return `
    <a class="card" href="/films.html?id=${uid}">
      <span class="card-eyebrow">Episode ${escapeHtml(p.episode_id)}</span>
      <h2>${escapeHtml(p.title)}</h2>
      <p>${escapeHtml(p.release_date)}</p>
    </a>
  `;
}

async function renderFilmDetail(id) {
  app.innerHTML = '<p class="status">Loading film&hellip;</p>';
  try {
    const film = await getFilm(id);
    const p = film.properties;
    const characterIds = (p.characters ?? []).map(extractId).filter(Boolean);

    app.innerHTML = `
      <a class="back-link" href="/films.html">&larr; All films</a>
      <h1>${escapeHtml(p.title)}</h1>
      <p class="lede">
        Episode ${escapeHtml(p.episode_id)} &middot;
        Directed by ${escapeHtml(p.director)} &middot;
        Released ${escapeHtml(p.release_date)}
      </p>
      <blockquote class="crawl">${escapeHtml(p.opening_crawl).replace(/\r?\n/g, "<br />")}</blockquote>
      <h2>Characters</h2>
      <div id="characters" class="chip-list">
        <p class="status">Loading cast&hellip;</p>
      </div>
    `;
    await renderCharacters(characterIds);
  } catch (err) {
    renderError(err, "Could not load this film.");
  }
}

async function renderCharacters(ids) {
  const container = document.getElementById("characters");
  if (!ids.length) {
    container.innerHTML = "<p>No character data available for this film.</p>";
    return;
  }

  const settled = await Promise.allSettled(ids.map((id) => getPerson(id)));
  container.innerHTML = settled
    .map((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        return `<a class="chip" href="/people.html?id=${ids[i]}">${escapeHtml(result.value.properties.name)}</a>`;
      }
      return `<a class="chip chip-muted" href="/people.html?id=${ids[i]}">Character #${ids[i]}</a>`;
    })
    .join("");
}

function renderError(err, headline) {
  app.innerHTML = `
    <div class="error">
      <h2>${escapeHtml(headline)}</h2>
      <p>${escapeHtml(err.message)}</p>
      <a href="/films.html">Try again</a>
    </div>
  `;
}

init();
