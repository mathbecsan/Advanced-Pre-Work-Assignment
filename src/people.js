import {
  getPeoplePage,
  searchPeople,
  getPerson,
  getPlanet,
  getFilms,
  getFilm,
  extractId,
  escapeHtml,
} from "./api.js";

const app = document.getElementById("app");

function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  return id ? renderPersonDetail(id) : renderPeopleList();
}

async function renderPeopleList() {
  app.innerHTML = `
    <h1>People</h1>
    <p class="lede">Search for a character by name, or browse the full roster.</p>
    <form id="search-form" class="search-form">
      <input
        type="search"
        id="search-input"
        placeholder="Search by name (e.g. Skywalker)"
        aria-label="Search people by name"
      />
      <button type="submit">Search</button>
    </form>
    <div id="results"><p class="status">Loading people&hellip;</p></div>
  `;
  document.getElementById("search-form").addEventListener("submit", handleSearch);
  await loadPeoplePage();
}

async function loadPeoplePage(url) {
  const results = document.getElementById("results");
  results.innerHTML = '<p class="status">Loading people&hellip;</p>';
  try {
    const data = await getPeoplePage(url);
    const people = data.results ?? [];
    results.innerHTML = `
      <div class="grid">${people.map(personCard).join("")}</div>
      <div class="pagination">
        <button id="prev-btn" type="button" ${data.previous ? "" : "disabled"}>&larr; Previous</button>
        <span>${data.total_records ? `${data.total_records} characters` : ""}</span>
        <button id="next-btn" type="button" ${data.next ? "" : "disabled"}>Next &rarr;</button>
      </div>
    `;
    document.getElementById("prev-btn")?.addEventListener("click", () => loadPeoplePage(data.previous));
    document.getElementById("next-btn")?.addEventListener("click", () => loadPeoplePage(data.next));
  } catch (err) {
    results.innerHTML = errorHtml(err, "Could not load the people list.");
  }
}

function personCard(person) {
  const p = person.properties ?? person;
  const uid = person.uid ?? extractId(p.url);
  return `<a class="card" href="/people.html?id=${uid}"><h2>${escapeHtml(p.name)}</h2></a>`;
}

async function handleSearch(event) {
  event.preventDefault();
  const input = document.getElementById("search-input");
  const query = input.value.trim();
  const results = document.getElementById("results");

  if (!query) {
    results.innerHTML = '<p class="status error-text">Enter a name to search for.</p>';
    return;
  }

  results.innerHTML = '<p class="status">Searching&hellip;</p>';
  try {
    const people = await searchPeople(query);
    if (!people.length) {
      results.innerHTML = `<p class="status">No characters found matching &ldquo;${escapeHtml(query)}&rdquo;.</p>`;
      return;
    }
    results.innerHTML = `<div class="grid">${people.map(personCard).join("")}</div>`;
  } catch (err) {
    results.innerHTML = errorHtml(err, `Search for "${query}" failed.`);
  }
}

async function renderPersonDetail(id) {
  app.innerHTML = '<p class="status">Loading character&hellip;</p>';
  try {
    const person = await getPerson(id);
    const p = person.properties;

    let homeworldName = "Unknown";
    if (p.homeworld) {
      try {
        const planet = await getPlanet(p.homeworld);
        homeworldName = planet.properties.name;
      } catch {
        // Homeworld lookup is supplementary; leave it as "Unknown" on failure.
      }
    }

    app.innerHTML = `
      <a class="back-link" href="/people.html">&larr; All people</a>
      <h1>${escapeHtml(p.name)}</h1>
      <dl class="fact-list">
        <div><dt>Birth year</dt><dd>${escapeHtml(p.birth_year)}</dd></div>
        <div><dt>Gender</dt><dd>${escapeHtml(p.gender)}</dd></div>
        <div><dt>Height</dt><dd>${escapeHtml(p.height)} cm</dd></div>
        <div><dt>Mass</dt><dd>${escapeHtml(p.mass)} kg</dd></div>
        <div><dt>Hair color</dt><dd>${escapeHtml(p.hair_color)}</dd></div>
        <div><dt>Eye color</dt><dd>${escapeHtml(p.eye_color)}</dd></div>
        <div><dt>Homeworld</dt><dd>${escapeHtml(homeworldName)}</dd></div>
      </dl>
      <h2>Appears in</h2>
      <div id="filmography" class="chip-list">
        <p class="status">Loading filmography&hellip;</p>
      </div>
    `;
    await renderFilmography(id);
  } catch (err) {
    app.innerHTML = errorHtml(err, "Could not load this character.");
  }
}

async function renderFilmography(personId) {
  const container = document.getElementById("filmography");
  try {
    const films = await getFilms();
    const personIdStr = String(personId);

    const settled = await Promise.allSettled(
      films.map(async (film) => {
        const uid = film.uid ?? extractId((film.properties ?? film).url);
        const detail = await getFilm(uid);
        const characters = detail.properties.characters ?? [];
        const appearsIn = characters.some((url) => extractId(url) === personIdStr);
        return appearsIn
          ? { uid, title: detail.properties.title, episode: detail.properties.episode_id }
          : null;
      })
    );

    const matches = settled
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value)
      .sort((a, b) => a.episode - b.episode);

    container.innerHTML = matches.length
      ? matches.map((f) => `<a class="chip" href="/films.html?id=${f.uid}">${escapeHtml(f.title)}</a>`).join("")
      : "<p>No film data available for this character.</p>";
  } catch (err) {
    container.innerHTML = errorHtml(err, "Could not load filmography.");
  }
}

function errorHtml(err, headline) {
  return `
    <div class="error">
      <h2>${escapeHtml(headline)}</h2>
      <p>${escapeHtml(err.message)}</p>
    </div>
  `;
}

init();
