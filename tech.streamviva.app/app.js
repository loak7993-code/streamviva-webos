/* StreamViva for webOS TV — complete UI.
   10-foot interface, D-pad focus engine, native HLS playback. */
"use strict";

/* ------------------------- config ------------------------- */

const TMDB_TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlN2NjZjNhZDYyN2M4ZTA3MmQ3NjQ3YWFlNDRmNGU3ZiIsIm5iZiI6MTc3Mjg1MjkxMS40MjcsInN1YiI6IjY5YWI5NmFmNzgyNzRlMTFmMThmYWYxOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bUX3sQru8sCYqTKO-SB9YqXfLvoa88bwc9g3AJdfst8";
const TMDB = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";
const IMG780 = "https://image.tmdb.org/t/p/w780";
const VIDAPI = "https://data.vidsrc.sh/api.php";
const VDRK = "https://sub.vdrk.site";

const LS = {
  get(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return (v === null || v === undefined) ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ------------------------- state ------------------------- */

const S = {
  tab: "home",              // home | movies | shows | list
  view: "tab",              // tab | details
  rows: [],                 // [{el, items:[{el, action}]}]
  activeRow: 0,
  activeItem: 0,
  current: null,            // details media
  playing: null,
  subs: [],
  selectedSub: null,
  searchResults: [],
  searchFocus: -1,
  subsFocus: -1,
  seasons: [],
  selectedSeason: null,
  episodes: [],
  cast: [],
  cache: {},                // tmdb responses per tab
};

const APP_VERSION = "1.4.0";

const $ = (id) => document.getElementById(id);

/* defensive: ensure required elements exist even against stale cached HTML */
function ensureElements() {
  const need = {
    tabs: () => '<nav id="tabs"></nav>',
    content: () => '<main id="content"></main>',
    player: () => '<div id="player" class="hidden"><video id="video" autoplay playsinline></video><div id="player-top"><div class="wordmark small">Stream<em>Viva</em></div><div id="player-title"></div><div class="player-actions"><div class="top-btn" id="btn-subs">CC</div><div class="top-btn" id="btn-stop">Stop</div></div></div><div id="player-busy"><div class="spinner"></div></div></div>',
    "search-overlay": () => '<div id="search-overlay" class="hidden"><input id="search-input" type="text" placeholder="Search movies, shows..." autocomplete="off" /><div id="search-results"></div></div>',
    "subs-overlay": () => '<div id="subs-overlay" class="hidden"><div class="subs-panel"><div class="subs-title">Subtitles</div><div id="subs-list"></div></div></div>',
    "btn-search": () => '<div class="top-btn" id="btn-search">Search</div>',
    topbar: () => '<header id="topbar"><div class="wordmark">Stream<em>Viva</em></div><nav id="tabs"></nav><div class="top-actions"><div class="top-btn" id="btn-search">Search</div></div></header>',
  };
  if (!document.getElementById("topbar") && document.getElementById("app")) {
    document.getElementById("app").innerHTML = need.topbar().replace(/<header[^>]*>|<\/header>/g, "") ;
  }
  for (const id of ["topbar", "tabs", "content", "player", "video", "search-overlay", "search-input", "search-results", "subs-overlay", "subs-list", "btn-search", "btn-subs", "btn-stop", "player-title", "player-busy"]) {
    if (!document.getElementById(id)) {
      if (id === "tabs" && document.getElementById("topbar")) {
        const nav = document.createElement("nav");
        nav.id = "tabs";
        document.getElementById("topbar").appendChild(nav);
      } else if (id === "btn-search" && document.getElementById("topbar")) {
        const btn = document.createElement("div");
        btn.className = "top-btn"; btn.id = "btn-search"; btn.textContent = "Search";
        document.getElementById("topbar").appendChild(btn);
      } else if (id === "video" && document.getElementById("player")) {
        document.getElementById("player").insertAdjacentHTML("afterbegin", '<video id="video" autoplay playsinline></video>');
      } else if (id === "player-title" && document.getElementById("player-top")) {
        const t = document.createElement("div"); t.id = "player-title";
        document.getElementById("player-top").appendChild(t);
      }
    }
  }
}

let video = null;

/* ------------------------- helpers ------------------------- */

function toast(msg) {
  let t = $("toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2200);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function tmdb(path, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const r = await fetch(TMDB + path + qs, {
    headers: { Authorization: "Bearer " + TMDB_TOKEN, Accept: "application/json" },
  });
  if (!r.ok) throw new Error("tmdb " + r.status);
  return r.json();
}

function parseMedia(o, type) {
  const date = o.first_air_date || o.release_date || "";
  return {
    id: o.id,
    title: o.title || o.name || "?",
    overview: o.overview || "",
    poster: o.poster_path ? IMG + o.poster_path : null,
    backdrop: o.backdrop_path ? IMG780 + o.backdrop_path : null,
    year: (date || "").slice(0, 4),
    type,
    rating: o.vote_average || 0,
    _imdb: "",
  };
}

function isFav(m) {
  const favs = LS.get("sv_favorites", []);
  return favs.some((f) => f.id === m.id && f.type === m.type);
}

function toggleFav(m) {
  let favs = LS.get("sv_favorites", []);
  if (isFav(m)) {
    favs = favs.filter((f) => !(f.id === m.id && f.type === m.type));
    toast("Removed from My List");
  } else {
    favs.unshift(m);
    toast("Added to My List");
  }
  LS.set("sv_favorites", favs);
}

/* ------------------------- focus engine ------------------------- */

function clearFocusClasses() {
  document.querySelectorAll(".focused").forEach((el) => el.classList.remove("focused"));
}

function setFocus(row, item) {
  if (!S.rows.length) return;
  row = Math.max(0, Math.min(S.rows.length - 1, row));
  const r = S.rows[row];
  if (!r || !r.items.length) return;
  item = Math.max(0, Math.min(r.items.length - 1, item));
  clearFocusClasses();
  S.activeRow = row;
  S.activeItem = item;
  const target = r.items[item];
  target.el.classList.add("focused");
  target.el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  // topbar solid when any row focused
  $("topbar").classList.toggle("scrolled", row > 0 || S.view === "details");
}

function focusNextRow(dir) {
  let row = S.activeRow;
  for (let i = 0; i < S.rows.length; i++) {
    row += dir;
    if (row < 0) { row = 0; break; }
    if (row >= S.rows.length) { row = S.rows.length - 1; break; }
    if (S.rows[row].items.length) break;
  }
  setFocus(row, S.activeItem);
}

function activate() {
  const r = S.rows[S.activeRow];
  if (!r) return;
  const item = r.items[S.activeItem];
  if (item && item.action) item.action();
}

/* ------------------------- key handling ------------------------- */

document.addEventListener("keydown", (e) => {
  const k = e.keyCode || e.which;

  // search overlay
  if (!$("search-overlay").classList.contains("hidden")) {
    if (k === 404 || k === 461 || k === 27) { closeSearch(); e.preventDefault(); return; }
    handleSearchKeys(k);
    return;
  }
  // subs overlay
  if (!$("subs-overlay").classList.contains("hidden")) {
    if (k === 13) { pickSub(); e.preventDefault(); }
    else if (k === 404 || k === 461 || k === 27) { closeSubs(); e.preventDefault(); }
    else if (k === 38) { subsMove(-1); e.preventDefault(); }
    else if (k === 40) { subsMove(1); e.preventDefault(); }
    return;
  }
  // player
  if (!$("player").classList.contains("hidden")) {
    if (k === 404 || k === 461 || k === 8 || k === 27) { stopPlayback(); e.preventDefault(); return; }
    if (k === 13) { toggleUi(); e.preventDefault(); }
    return;
  }

  switch (k) {
    case 37: setFocus(S.activeRow, S.activeItem - 1); e.preventDefault(); break;
    case 39: setFocus(S.activeRow, S.activeItem + 1); e.preventDefault(); break;
    case 38: focusNextRow(-1); e.preventDefault(); break;
    case 40: focusNextRow(1); e.preventDefault(); break;
    case 13: activate(); e.preventDefault(); break;
    case 404:
    case 461:
      if (S.view === "details") showTab(S.tab);
      e.preventDefault();
      break;
  }
});

/* ------------------------- tabs ------------------------- */

const TABS = [
  { id: "home", label: "Home" },
  { id: "movies", label: "Movies" },
  { id: "shows", label: "Shows" },
  { id: "list", label: "My List" },
];

function renderTabs() {
  const bar = $("tabs");
  bar.innerHTML = "";
  TABS.forEach((t) => {
    const el = document.createElement("div");
    el.className = "tab" + (S.tab === t.id ? " active" : "");
    el.textContent = t.label;
    bar.appendChild(el);
  });
}

function showTab(tab) {
  S.tab = tab;
  S.view = "tab";
  renderTabs();
  renderTabContent();
}

async function renderTabContent() {
  const c = $("content");
  c.innerHTML = '<div class="skeleton-blocks"><div class="skel-hero"></div>' +
    '<div class="skel-row"></div>'.repeat(3) + "</div>";
  S.rows = [];

  try {
    if (S.tab === "home") await renderHome(c);
    else if (S.tab === "movies") await renderMovies(c);
    else if (S.tab === "shows") await renderShows(c);
    else renderList(c);
    // first successful render: fade the boot screen
    var sp = document.getElementById("splash");
    if (sp && !sp.classList.contains("done")) sp.classList.add("done");
    staggerRows();
  } catch (e) {
    c.innerHTML = '<div class="loading" style="color:#e88383">⚠ ' + e.message + "</div>";
  }
  setFocus(0, TABS.findIndex((t) => t.id === S.tab));
}

async function cached(key, fn) {
  if (!S.cache[key]) S.cache[key] = await fn();
  return S.cache[key];
}

/* ------------------------- home ------------------------- */

async function renderHome(c) {
  const [trendM, trendT, popular, top] = await Promise.all([
    cached("trendM", () => tmdb("/trending/movie/week").then((j) => j.results.map((o) => parseMedia(o, "movie")))),
    cached("trendT", () => tmdb("/trending/tv/week").then((j) => j.results.map((o) => parseMedia(o, "tv")))),
    cached("popular", () => tmdb("/movie/popular").then((j) => j.results.map((o) => parseMedia(o, "movie")))),
    cached("topTv", () => tmdb("/tv/top_rated").then((j) => j.results.map((o) => parseMedia(o, "tv")))),
  ]);

  c.innerHTML = "";
  addTabRow();
  const heroMedia = trendM[0];

  if (heroMedia) {
    const hero = document.createElement("div");
    hero.className = "hero";
    hero.innerHTML = `
      <img src="${heroMedia.backdrop || heroMedia.poster || ""}" alt="" />
      <div class="hero-info">
        <div class="hero-kicker">now showing</div>
        <div class="hero-title">${esc(heroMedia.title)}</div>
        <div class="hero-meta">${heroMedia.year} · film · <span class="gold">★ ${heroMedia.rating.toFixed(1)}</span></div>
        <div class="hero-desc">${esc((heroMedia.overview || "").slice(0, 180))}${heroMedia.overview && heroMedia.overview.length > 180 ? "…" : ""}</div>
        <div class="hero-actions">
          <div class="hero-play" id="hero-play">▶  Play</div>
          <div class="hero-play secondary" id="hero-info">More info</div>
        </div>
      </div>`;
    c.appendChild(hero);
    S.rows.push({
      el: hero,
      items: [
        { el: hero.querySelector("#hero-play"), action: () => openDetails(heroMedia, true) },
        { el: hero.querySelector("#hero-info"), action: () => openDetails(heroMedia) },
      ],
    });
  }

  const cont = getContinue();
  if (cont.length) addRow(c, "Continue watching", cont.map(makeContinueCard));
  addRow(c, "Top 10 movies today", trendM.slice(0, 10).map((m, i) => makeRankedCard(m, i + 1)));
  addRow(c, "Trending shows", trendT.map(makeCard));
  addRow(c, "Popular movies", popular.map(makeCard));
  addRow(c, "Top rated shows", top.map(makeCard));
}

/* ------------------------- movies ------------------------- */

async function renderMovies(c) {
  const [trendM, popular, upcoming, top] = await Promise.all([
    cached("trendM", () => tmdb("/trending/movie/week").then((j) => j.results.map((o) => parseMedia(o, "movie")))),
    cached("popular", () => tmdb("/movie/popular").then((j) => j.results.map((o) => parseMedia(o, "movie")))),
    cached("upcoming", () => tmdb("/movie/upcoming").then((j) => j.results.map((o) => parseMedia(o, "movie")))),
    cached("topM", () => tmdb("/movie/top_rated").then((j) => j.results.map((o) => parseMedia(o, "movie")))),
  ]);

  c.innerHTML = "";
  addTabRow();
  addRow(c, "Top 10 movies", trendM.slice(0, 10).map((m, i) => makeRankedCard(m, i + 1)));
  addRow(c, "Popular", popular.map(makeCard));
  addRow(c, "Coming soon", upcoming.map(makeCard));
  addRow(c, "All-time greats", top.map(makeCard));
}

/* ------------------------- shows ------------------------- */

async function renderShows(c) {
  const [trendT, airing, top] = await Promise.all([
    cached("trendT", () => tmdb("/trending/tv/week").then((j) => j.results.map((o) => parseMedia(o, "tv")))),
    cached("airing", () => tmdb("/tv/airing_today").then((j) => j.results.map((o) => parseMedia(o, "tv")))),
    cached("topTv", () => tmdb("/tv/top_rated").then((j) => j.results.map((o) => parseMedia(o, "tv")))),
  ]);

  c.innerHTML = "";
  addTabRow();
  addRow(c, "Top 10 shows", trendT.slice(0, 10).map((m, i) => makeRankedCard(m, i + 1)));
  addRow(c, "Airing today", airing.map(makeCard));
  addRow(c, "Top rated", top.map(makeCard));
  addRow(c, "Trending", trendT.map(makeCard));
}

/* ------------------------- my list ------------------------- */

function getContinue() {
  return Object.values(LS.get("sv_progress", {}))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function renderList(c) {
  const favs = LS.get("sv_favorites", []);
  const cont = getContinue();

  c.innerHTML = "";
  addTabRow();

  if (!favs.length && !cont.length) {
    c.innerHTML += '<div class="loading" style="padding-top:60px">Nothing here yet.<br><br>Watch something to build Continue Watching,<br>or press ♥ on any title to add it to My List.</div>';
    return;
  }
  if (cont.length) addRow(c, "Continue watching", cont.map(makeContinueCard));
  if (favs.length) addRow(c, "My list · " + favs.length, favs.map(makeCard));
}

/* ------------------------- rows & cards ------------------------- */

function staggerRows() {
  var rows = document.querySelectorAll(".row, .hero");
  for (var i = 0; i < rows.length; i++) {
    rows[i].style.animationDelay = (i * 70) + "ms";
    rows[i].classList.add("rise-in");
  }
}

function addTabRow() {
  S.rows.push({
    el: $("tabs"),
    items: TABS.map((t, i) => ({
      el: $("tabs").children[i],
      action: () => showTab(t.id),
    })),
  });
}

function addRow(container, title, items) {
  if (!items || !items.length) return;
  const row = document.createElement("div");
  row.className = "row";
  const t = document.createElement("div");
  t.className = "row-title";
  t.textContent = title;
  const track = document.createElement("div");
  track.className = "row-track";
  items.forEach((it) => track.appendChild(it.el));
  row.appendChild(t);
  row.appendChild(track);
  container.appendChild(row);
  S.rows.push({ el: row, items });
}

function makeCard(m, wide) {
  const el = document.createElement("div");
  el.className = "card" + (wide ? " wide" : "");
  el.innerHTML = `
    <img src="${m.poster || ""}" alt="${esc(m.title)}" />
    <div class="card-title">${esc(m.title)}</div>
    <div class="card-sub">${m.year} · <span class="gold">★ ${m.rating.toFixed(1)}</span></div>`;
  return { el, action: () => openDetails(m) };
}

function makeRankedCard(m, rank) {
  const el = document.createElement("div");
  el.className = "card ranked";
  el.innerHTML = `
    <div class="rank-num">${rank}</div>
    <div class="rank-poster"><img src="${m.poster || ""}" alt="${esc(m.title)}" /></div>`;
  return { el, action: () => openDetails(m) };
}

function makeContinueCard(entry) {
  const el = document.createElement("div");
  el.className = "card wide";
  const pct = Math.min(100, Math.round((entry.positionMs / Math.max(entry.durationMs, 1)) * 100));
  el.innerHTML = `
    <img src="${entry.poster || ""}" alt="${esc(entry.title)}" />
    <div class="card-play">▶</div>
    <div class="pbar"><i style="width:${pct}%"></i></div>
    <div class="card-title">${esc(entry.title)}${entry.season != null ? " · S" + entry.season + "E" + entry.episode : ""}</div>`;
  return { el, action: () => resumeEntry(entry) };
}

async function resumeEntry(entry) {
  const media = {
    id: Number(entry.tmdbId), title: entry.title, overview: "",
    poster: entry.poster, backdrop: null, year: "", type: entry.type, rating: 0, _imdb: "",
  };
  // fetch imdb for stream resolution
  try {
    const det = await tmdb("/" + entry.type + "/" + media.id, { append_to_response: "external_ids" });
    media._imdb = (det.imdb_id || (det.external_ids && det.external_ids.imdb_id) || "").trim();
    media.title = det.title || det.name || media.title;
  } catch (e) {}
  await play(media, entry.season, entry.episode, entry.positionMs);
}

/* ------------------------- details ------------------------- */

async function openDetails(media, autoPlay) {
  S.view = "details";
  S.current = media;
  $("topbar").classList.add("scrolled");
  $("content").innerHTML = '<div class="skeleton-blocks"><div class="skel-hero"></div>' +
    '<div class="skel-row"></div>'.repeat(3) + "</div>";
  S.rows = [];

  try {
    const [det, recs, cast] = await Promise.all([
      tmdb("/" + media.type + "/" + media.id, { append_to_response: "external_ids" }).catch(() => null),
      tmdb("/" + media.type + "/" + media.id + "/recommendations")
        .then((j) => (j.results || []).map((o) => parseMedia(o, media.type)))
        .catch(() => []),
      tmdb("/" + media.type + "/" + media.id + "/credits")
        .then((j) => (j.cast || []).slice(0, 14))
        .catch(() => []),
    ]);

    let imdb = "";
    S.seasons = [];
    S.selectedSeason = null;
    if (det) {
      imdb = (det.imdb_id || (det.external_ids && det.external_ids.imdb_id) || "").trim();
      if (det.tagline) media.tagline = det.tagline;
      if (media.type === "tv") {
        S.seasons = (det.seasons || []).filter((s) => s.season_number > 0);
        S.selectedSeason = S.seasons.length ? S.seasons[0].season_number : null;
      }
    }
    media._imdb = imdb;
    S.episodes = [];
    if (S.selectedSeason != null) await loadEpisodes(S.selectedSeason);

    renderDetails(media, recs, cast);
    if (autoPlay && imdb) {
      if (media.type === "movie") play(media, null, null);
      else if (S.episodes.length) play(media, S.selectedSeason, S.episodes[0].num);
    } else {
      setFocus(1, 0);
    }
  } catch (e) {
    $("content").innerHTML = `<div class="loading" style="color:#e88383">⚠ ${e.message}</div>`;
  }
}

async function loadEpisodes(season) {
  try {
    const j = await tmdb("/tv/" + S.current.id + "/season/" + season);
    S.episodes = (j.episodes || []).map((e) => ({
      num: e.episode_number,
      name: e.name,
      still: e.still_path ? IMG + e.still_path : null,
      rating: e.vote_average || 0,
    }));
  } catch (e) { S.episodes = []; }
}

function renderDetails(media, recs, cast) {
  const c = $("content");
  const fav = isFav(media);
  const cont = LS.get("sv_progress", {});
  const progKey = media.id + ":s";
  const resumeEntry = Object.values(cont).find((p) => p.tmdbId === String(media.id));

  c.innerHTML = `
    <div class="details-backdrop"><img src="${media.backdrop || media.poster || ""}" /></div>
    <div class="details">
      <div class="details-body">
        <div class="details-poster"><img src="${media.poster || ""}" /></div>
        <div class="details-info">
          <div class="details-kicker">${media.type === "tv" ? "series" : "feature"}${media.tagline ? " · " + esc(media.tagline) : ""}</div>
          <div class="details-title">${esc(media.title)}</div>
          <div class="details-meta">${media.year} · <span class="gold">★ ${media.rating.toFixed(1)}</span></div>
          <div class="details-overview">${esc(media.overview)}</div>
          <div class="details-actions">
            <div class="action-btn primary" id="d-play">${resumeEntry && resumeEntry.positionMs > 10000 ? "▶  Resume" : "▶  Play now"}</div>
            <div class="action-btn secondary" id="d-fav">${fav ? "♥  In My List" : "♡  Add to My List"}</div>
          </div>
        </div>
      </div>
      <div id="d-seasons"></div>
      <div class="episode-list" id="d-episodes"></div>
      <div id="d-cast"></div>
      <div id="d-recs"></div>
    </div>`;

  S.rows = [];

  // tab row (so Back/Up always works) — hidden but focusable via remote up
  // action buttons
  const playBtn = c.querySelector("#d-play");
  const favBtn = c.querySelector("#d-fav");
  S.rows.push({ el: null, items: [] }); // placeholder row 0 for tabs — details has its own
  S.rows[0] = {
    el: null,
    items: [{
      el: playBtn,
      action: () => {
        if (!media._imdb) { toast("No stream available"); return; }
        const resume = resumeEntry && resumeEntry.positionMs > 10000 ? resumeEntry.positionMs : null;
        if (media.type === "movie") play(media, null, null, resume);
        else if (S.episodes.length) play(media, S.selectedSeason, S.episodes[0].num, resume);
      },
    }, {
      el: favBtn,
      action: () => { toggleFav(media); renderDetails(media, recs, cast); setFocus(0, 1); },
    }],
  };

  // seasons
  const seasonsWrap = c.querySelector("#d-seasons");
  if (S.seasons.length) {
    seasonsWrap.innerHTML = `<div class="row-title">Seasons</div>`;
    const track = document.createElement("div");
    track.className = "chip-track";
    const items = S.seasons.map((s) => {
      const chip = document.createElement("div");
      chip.className = "chip" + (S.selectedSeason === s.season_number ? " active" : "");
      chip.textContent = "Season " + s.season_number;
      track.appendChild(chip);
      return {
        el: chip,
        action: async () => {
          S.selectedSeason = s.season_number;
          await loadEpisodes(s.season_number);
          renderDetails(media, recs, cast);
          // focus the season after render
          setTimeout(() => setFocus(1, S.seasons.findIndex((x) => x.season_number === s.season_number)), 50);
        },
      };
    });
    seasonsWrap.appendChild(track);
    S.rows.push({ el: seasonsWrap, items });
  }

  // episodes
  const epsWrap = c.querySelector("#d-episodes");
  if (S.episodes.length) {
    epsWrap.innerHTML = `<div class="row-title">Episodes · season ${S.selectedSeason}</div>`;
    const cont2 = LS.get("sv_progress", {});
    const items = S.episodes.map((ep) => {
      const p = cont2[media.id + ":s" + S.selectedSeason + "e" + ep.num];
      const pct = p ? Math.min(100, Math.round((p.positionMs / Math.max(p.durationMs, 1)) * 100)) : 0;
      const row = document.createElement("div");
      row.className = "episode-row" + (pct > 90 ? " watched" : "");
      row.innerHTML = `
        <img src="${ep.still || ""}" />
        <div class="episode-num">E${ep.num}</div>
        <div class="episode-meta">
          <div class="episode-name">${esc(ep.name)}</div>
          <div class="episode-sub">★ ${ep.rating.toFixed(1)}${pct > 0 ? " · " + pct + "% watched" : ""}</div>
        </div>
        ${pct > 0 && pct <= 100 ? `<div class="episode-pbar"><i style="width:${pct}%"></i></div>` : ""}
        <div class="episode-play">▶</div>`;
      epsWrap.appendChild(row);
      return {
        el: row,
        action: () => {
          if (!media._imdb) { toast("No stream available"); return; }
          play(media, S.selectedSeason, ep.num);
        },
      };
    });
    S.rows.push({ el: epsWrap, items });
  }

  // cast
  const castWrap = c.querySelector("#d-cast");
  if (cast.length) {
    castWrap.innerHTML = `<div class="row-title">Cast</div>`;
    const track = document.createElement("div");
    track.className = "cast-track";
    cast.forEach((p) => {
      const el = document.createElement("div");
      el.className = "cast-card";
      el.innerHTML = `
        <img src="${p.profile_path ? "https://image.tmdb.org/t/p/w185" + p.profile_path : ""}" />
        <div class="cast-name">${esc(p.name)}</div>
        <div class="cast-role">${esc(p.character || "")}</div>`;
      track.appendChild(el);
    });
    castWrap.appendChild(track);
    S.rows.push({
      el: castWrap,
      items: [...track.children].map((el) => ({ el, action: () => {} })),
    });
  }

  // recommendations
  if (recs.length) addRow(c.querySelector("#d-recs"), "More like this", recs.map(makeCard));
}

/* ------------------------- search ------------------------- */

function openSearch() {
  $("search-overlay").classList.remove("hidden");
  S.searchResults = [];
  S.searchFocus = -1;
  $("search-results").innerHTML = "";
  const input = $("search-input");
  input.value = "";
  setTimeout(() => input.focus(), 100);

  let t;
  input.oninput = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const q = input.value.trim();
      if (q.length < 2) { $("search-results").innerHTML = ""; S.searchResults = []; return; }
      try {
        const j = await tmdb("/search/multi", { query: q, include_adult: "false" });
        S.searchResults = (j.results || [])
          .filter((o) => o.media_type === "movie" || o.media_type === "tv")
          .map((o) => parseMedia(o, o.media_type));
        renderSearch();
        if (S.searchResults.length) setSearchFocus(0);
      } catch (e) {}
    }, 400);
  };
}

function renderSearch() {
  const wrap = $("search-results");
  wrap.innerHTML = "";
  S.searchResults.forEach((m) => {
    const row = document.createElement("div");
    row.className = "search-row";
    row.innerHTML = `
      <img src="${m.poster || ""}" />
      <div>
        <div class="search-title">${esc(m.title)}</div>
        <div class="search-sub">${m.year} · ${m.type === "tv" ? "show" : "film"} · <span class="gold">★ ${m.rating.toFixed(1)}</span></div>
      </div>`;
    wrap.appendChild(row);
  });
}

function setSearchFocus(i) {
  if (!S.searchResults.length) return;
  i = Math.max(0, Math.min(S.searchResults.length - 1, i));
  S.searchFocus = i;
  document.querySelectorAll(".search-row").forEach((el) => el.classList.remove("focused"));
  const el = document.querySelectorAll(".search-row")[i];
  if (el) { el.classList.add("focused"); el.scrollIntoView({ block: "nearest" }); }
}

function handleSearchKeys(k) {
  if (k === 38) setSearchFocus(S.searchFocus - 1);
  else if (k === 40) setSearchFocus(S.searchFocus + 1);
  else if (k === 13) {
    if (S.searchResults[S.searchFocus]) {
      closeSearch();
      openDetails(S.searchResults[S.searchFocus]);
    }
  }
}

function closeSearch() {
  $("search-overlay").classList.add("hidden");
  $("search-input").blur();
}

/* ------------------------- stream resolution ------------------------- */

async function resolveStream(media, season, episode) {
  const params = new URLSearchParams({ type: media.type === "tv" ? "tv" : "movie", imdb: media._imdb });
  if (season != null) { params.set("season", season); params.set("episode", episode); }
  params.set("stream_urls", "");
  const r = await fetch(VIDAPI + "?" + params.toString(), { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("stream api " + r.status);
  const j = await r.json();
  const su = j.data && j.data.stream_urls;
  if (typeof su !== "string" || !su) throw new Error("no stream");
  if (!j.vs || !j.vs.wasm_url) throw new Error("no decryptor");

  const wasmBytes = await (await fetch(j.vs.wasm_url)).arrayBuffer();
  const mod = await WebAssembly.instantiate(wasmBytes, {});
  const ex = mod.instance.exports;
  const enc = b64ToBytes(su);
  const ptr = ex.alloc(enc.length);
  new Uint8Array(ex.memory.buffer, ptr, enc.length).set(enc);
  const outLen = ex.decrypt(ptr, enc.length);
  const plain = new TextDecoder().decode(new Uint8Array(ex.memory.buffer, ptr + 12, outLen));
  const urls = plain.split("\n").map((s) => s.trim()).filter(Boolean);
  if (!urls.length) throw new Error("no mirrors");

  for (const master of urls) {
    const host = new URL(master).origin;
    const token = await fetchToken(host);
    if (token) {
      return master + (master.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(token);
    }
  }
  throw new Error("no token");
}

function b64ToBytes(s) {
  const b = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b.length % 4 ? "=".repeat(4 - (b.length % 4)) : "";
  const bin = atob(b + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function fetchToken(host) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(host + "/generate.php");
      if (r.status === 429 || r.status >= 500) {
        await new Promise((res) => setTimeout(res, 1100));
        continue;
      }
      if (!r.ok) return null;
      let t = (await r.text()).trim();
      if (t.startsWith("{")) { try { t = JSON.parse(t).token || ""; } catch (e) { t = ""; } }
      if (t && !t.startsWith("<") && t.length > 20) return t;
      return null;
    } catch (e) { return null; }
  }
  return null;
}

/* ------------------------- playback ------------------------- */

async function play(media, season, episode, resumeMs) {
  $("player-title").textContent = media.title + (season != null ? " — S" + season + "E" + episode : "");
  $("player").classList.remove("hidden");
  $("player-busy").style.display = "flex";
  S.playing = { media, season, episode };
  S.selectedSub = null;

  try {
    const url = await resolveStream(media, season, episode);
    video.src = url;

    if (resumeMs > 10000) {
      video.addEventListener("loadedmetadata", () => { try { video.currentTime = resumeMs / 1000; } catch (e) {} }, { once: true });
    }
    video.play().catch(() => {});
    loadSubs(media, season, episode).then(() => autoSelectSub());
  } catch (e) {
    $("player-busy").style.display = "none";
    toast("⚠ " + e.message);
    setTimeout(stopPlayback, 1600);
  }
}

function initVideoListeners(v) {
  v.addEventListener("playing", () => { $("player-busy").style.display = "none"; });
  v.addEventListener("error", () => {
    $("player-busy").style.display = "none";
    toast("Playback error");
  });
  v.addEventListener("timeupdate", () => {
    if (!S.playing || !v.duration || v.currentTime < 5) return;
    const { media, season, episode } = S.playing;
    const cont = LS.get("sv_progress", {});
    cont[media.id + ":s" + (season || "") + "e" + (episode || "")] = {
      tmdbId: String(media.id), title: media.title, poster: media.poster,
      type: media.type, positionMs: v.currentTime * 1000, durationMs: v.duration * 1000,
      season, episode, updatedAt: Date.now(),
    };
    LS.set("sv_progress", cont);
  });
}

function stopPlayback() {
  video.pause();
  video.removeAttribute("src");
  video.load();
  $("player").classList.add("hidden");
  removeSubs();
  S.playing = null;
}

let uiTimer;
function initPlayerUi() {
  const p = $("player");
  if (!p || p._wired) return;
  p._wired = true;
  p.addEventListener("mousemove", () => {
    p.classList.remove("hide-ui");
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => p.classList.add("hide-ui"), 3500);
  });
}
function toggleUi() {
  const p = $("player");
  if (p.classList.contains("hide-ui")) {
    p.classList.remove("hide-ui");
    clearTimeout(uiTimer);
    uiTimer = setTimeout(() => p.classList.add("hide-ui"), 3500);
  } else {
    p.classList.add("hide-ui");
  }
}
/* ------------------------- subtitles ------------------------- */

async function loadSubs(media, season, episode) {
  S.subs = [];
  const [vdrk, os] = await Promise.all([
    loadVdrkSubs(media, season, episode),
    loadOpenSubs(media, season, episode),
  ]);
  const byLang = {};
  vdrk.forEach((s) => { byLang[s.label] = s; });
  os.forEach((s) => { if (!byLang[s.label]) byLang[s.label] = s; });
  S.subs = Object.values(byLang).sort((a, b) => a.label.localeCompare(b.label));
}

async function loadVdrkSubs(media, season, episode) {
  try {
    const url = season != null
      ? VDRK + "/v1/tv/" + media.id + "/" + season + "/" + episode
      : VDRK + "/v1/movie/" + media.id;
    const r = await fetch(url);
    if (!r.ok) return [];
    const arr = await r.json();
    const seen = {};
    const out = [];
    (Array.isArray(arr) ? arr : []).forEach((s) => {
      if (!s.file || !s.label) return;
      const lang = s.label.replace(/\s*Hi\d*\s*$/, "").replace(/\s*\d+$/, "").trim();
      if (seen[lang]) return;
      seen[lang] = true;
      out.push({ label: lang, url: s.file, type: "vtt", source: "vdrk" });
    });
    return out;
  } catch (e) { return []; }
}

async function loadOpenSubs(media, season, episode) {
  try {
    if (!media._imdb) return [];
    const imdbNum = media._imdb.replace(/^tt/, "");
    const path = season != null
      ? "episode-" + episode + "/imdbid-" + imdbNum + "/season-" + season
      : "imdbid-" + imdbNum;
    const r = await fetch("https://rest.opensubtitles.org/search/" + path, {
      headers: { "X-User-Agent": "VLSub 0.10.2" },
    });
    if (!r.ok) return [];
    const arr = await r.json();
    const seen = {};
    const out = [];
    (Array.isArray(arr) ? arr : []).forEach((c) => {
      if (c.SubFormat !== "srt") return;
      const lang = (c.LanguageName || "").trim();
      if (!lang || seen[lang]) return;
      const url = (c.SubDownloadLink || "")
        .replace(".gz", "")
        .replace("download/", "download/subencoding-utf8/");
      if (!url) return;
      seen[lang] = true;
      out.push({ label: lang, url, type: "srt", source: "opensubs" });
    });
    return out;
  } catch (e) { return []; }
}

async function srtToVttUrl(srtUrl) {
  const r = await fetch(srtUrl, { headers: { "X-User-Agent": "VLSub 0.10.2" } });
  let text = await r.text();
  text = text.replace(/\r/g, "");
  const body = text
    .replace(/^\uFEFF/, "")
    .replace(/^(\d+)\s*\n/gm, "")
    .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, "$1:$2:$3.$4");
  const vtt = "WEBVTT\n\n" + body;
  return URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
}

function removeSubs() {
  video.querySelectorAll("track").forEach((t) => t.remove());
  if (video.textTracks) {
    for (let i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = "disabled";
  }
}

async function applySub(sub) {
  removeSubs();
  if (!sub) { S.selectedSub = null; LS.set("sv_sublang", null); return; }
  S.selectedSub = sub;
  LS.set("sv_sublang", sub.label);
  let url = sub.url;
  if (sub.type === "srt") {
    try { url = await srtToVttUrl(sub.url); } catch (e) { toast("subtitle load failed"); return; }
  }
  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = sub.label;
  track.src = url;
  track.default = true;
  video.appendChild(track);
  setTimeout(() => {
    if (video.textTracks && video.textTracks[0]) video.textTracks[0].mode = "showing";
  }, 400);
}

function autoSelectSub() {
  const pref = LS.get("sv_sublang", null);
  if (!pref) return;
  const found = S.subs.find((s) => s.label === pref);
  if (found && found !== S.selectedSub) applySub(found);
}

function openSubs() {
  S.subsFocus = S.selectedSub ? S.subs.findIndex((s) => s.url === S.selectedSub.url) : 0;
  if (S.subsFocus < 0) S.subsFocus = 0;
  const list = $("subs-list");
  list.innerHTML = `<div class="sub-row" data-i="-1">Off</div>`;
  S.subs.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "sub-row" + (S.selectedSub && S.selectedSub.url === s.url ? " active" : "");
    row.dataset.i = i;
    row.innerHTML = esc(s.label) + "<small>" + s.source + "</small>";
    list.appendChild(row);
  });
  $("subs-overlay").classList.remove("hidden");
  subsHighlight();
}

function subsHighlight() {
  document.querySelectorAll(".sub-row").forEach((el) => el.classList.remove("focused"));
  const el = document.querySelector('.sub-row[data-i="' + S.subsFocus + '"]');
  if (el) { el.classList.add("focused"); el.scrollIntoView({ block: "nearest" }); }
}

function subsMove(dir) {
  const total = S.subs.length + 1;
  S.subsFocus = Math.max(0, Math.min(total - 1, S.subsFocus + dir));
  subsHighlight();
}

function pickSub() {
  const el = document.querySelector('.sub-row[data-i="' + S.subsFocus + '"]');
  if (!el) return;
  const i = Number(el.dataset.i);
  if (i === -1) applySub(null);
  else applySub(S.subs[i]);
  closeSubs();
}

function closeSubs() {
  $("subs-overlay").classList.add("hidden");
}

/* ------------------------- boot ------------------------- */

window.addEventListener("load", () => {
  setTimeout(() => {
    try {
      ensureElements();
      video = $("video");
      if (video) initVideoListeners(video);
      if (!video || !$("content") || !$("tabs")) {
        return;
      }
      $("btn-search").addEventListener("click", openSearch);
      $("btn-stop").addEventListener("click", stopPlayback);
      initPlayerUi();
      $("btn-subs").addEventListener("click", () => {
        if (!S.subs.length) { toast("No subtitles found"); return; }
        openSubs();
      });
      $("app").classList.remove("hidden");
      showTab("home");
    } catch (e) {
      try { $("splash").classList.add("done"); } catch (e2) {}
    }
  }, 900);
});
