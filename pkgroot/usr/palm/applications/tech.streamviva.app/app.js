/* StreamViva for webOS TV — 10-foot UI, D-pad navigation, native HLS. */
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
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ------------------------- state ------------------------- */

const S = {
  view: "home",            // home | details | favorites
  rows: [],                // [{el, items:[{el, media, action}]}]
  activeRow: -1,
  activeItem: -1,
  current: null,           // current details media
  playing: null,           // {media, season, episode}
  subs: [],
  selectedSub: null,
  searchResults: [],
  searchFocus: -1,
  subsFocus: -1,
};

const $ = (id) => document.getElementById(id);
const video = $("video");

/* ------------------------- helpers ------------------------- */

function toast(msg) {
  const t = $("toast") || (() => {
    const el = document.createElement("div");
    el.id = "toast"; document.body.appendChild(el); return el;
  })();
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 2200);
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
  };
}

/* ------------------------- focus engine ------------------------- */

function clearFocusClasses() {
  document.querySelectorAll(".focused").forEach((el) => el.classList.remove("focused"));
}

function setFocus(row, item) {
  if (!S.rows.length) return;
  row = Math.max(0, Math.min(S.rows.length - 1, row));
  const r = S.rows[row];
  if (!r.items.length) return;
  item = Math.max(0, Math.min(r.items.length - 1, item));
  clearFocusClasses();
  S.activeRow = row;
  S.activeItem = item;
  const target = r.items[item];
  target.el.classList.add("focused");
  target.el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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

/* key handler — webOS remote: arrows, Enter(13), Back(461/8/27) */
document.addEventListener("keydown", (e) => {
  const k = e.keyCode || e.which;
  if ($("search-overlay").classList.contains("hidden") === false) {
    if (k === 404 || k === 461 || k === 27) { closeSearch(); e.preventDefault(); return; }
    handleSearchKeys(k);
    return;
  }
  if (!$("subs-overlay").classList.contains("hidden")) {
    if (k === 404 || k === 461 || k === 27 || k === 13) {
      if (k === 13) { pickSub(); } else closeSubs();
      e.preventDefault();
    } else if (k === 38) { subsMove(-1); e.preventDefault(); }
    else if (k === 40) { subsMove(1); e.preventDefault(); }
    return;
  }
  if (!$("player").classList.contains("hidden")) {
    if (k === 404 || k === 461 || k === 8 || k === 27) { stopPlayback(); e.preventDefault(); return; }
    if (k === 13) { toggleUi(); e.preventDefault(); }
    return;
  }

  switch (k) {
    case 37: setFocus(S.activeRow, S.activeItem - 1); e.preventDefault(); break; // left
    case 39: setFocus(S.activeRow, S.activeItem + 1); e.preventDefault(); break; // right
    case 38: focusNextRow(-1); e.preventDefault(); break; // up
    case 40: focusNextRow(1); e.preventDefault(); break; // down
    case 13: activate(); e.preventDefault(); break; // enter
    case 404:
    case 461: // webOS back
      if (S.view === "details" || S.view === "favorites") { showHome(); }
      e.preventDefault();
      break;
  }
});

/* ------------------------- home ------------------------- */

async function showHome() {
  S.view = "home";
  $("content").innerHTML = '<div style="padding:120px 48px;color:#5f5f6b;font-size:20px">Loading…</div>';
  $("topbar").classList.remove("scrolled");

  try {
    const [trendM, trendT, popular, top] = await Promise.all([
      tmdb("/trending/movie/week").then((j) => j.results.map((o) => parseMedia(o, "movie"))),
      tmdb("/trending/tv/week").then((j) => j.results.map((o) => parseMedia(o, "tv"))),
      tmdb("/movie/popular").then((j) => j.results.map((o) => parseMedia(o, "movie"))),
      tmdb("/tv/top_rated").then((j) => j.results.map((o) => parseMedia(o, "tv"))),
    ]);

    const cont = LS.get("sv_progress", {});
    const contList = Object.values(cont)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 12);

    const c = $("content");
    c.innerHTML = "";

    // hero
    if (trendM.length) {
      const h = trendM[0];
      const hero = document.createElement("div");
      hero.className = "hero";
      hero.innerHTML = `
        <img src="${h.backdrop || h.poster}" alt="" />
        <div class="hero-info">
          <div class="hero-kicker">now showing</div>
          <div class="hero-title">${esc(h.title)}</div>
          <div class="hero-meta">${h.year} · film · <span class="gold">★ ${h.rating.toFixed(1)}</span></div>
          <div class="hero-play" id="hero-play">▶  Play now</div>
        </div>`;
      c.appendChild(hero);
      hero.querySelector("#hero-play").addEventListener("click", () => openDetails(h));
    }

    S.rows = [];
    const heroEl = c.querySelector(".hero-play");
    if (heroEl) {
      S.rows.push({ el: heroEl, items: [{ el: heroEl, action: () => openDetails(trendM[0]) }] });
    }

    if (contList.length) addRow(c, "Continue watching", contList.map(makeContinueCard));
    addRow(c, "Trending movies", trendM.map((m) => makeCard(m, true)));
    addRow(c, "Trending shows", trendT.map((m) => makeCard(m)));
    addRow(c, "Popular movies", popular.map((m) => makeCard(m)));
    addRow(c, "Top rated shows", top.map((m) => makeCard(m)));

    // wire topbar as a focusable row (row 0 when no hero)
    const topItems = [
      { el: $("btn-search"), action: openSearch },
      { el: $("btn-favorites"), action: showFavorites },
    ];
    S.rows.splice(heroEl ? 1 : 0, 0, { el: null, items: topItems });
    setFocus(heroEl ? 1 : 1, 0);
  } catch (e) {
    $("content").innerHTML = `<div style="padding:140px 48px;color:#e88383;font-size:20px">⚠ ${e.message}</div>`;
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function addRow(container, title, items) {
  if (!items.length) return;
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
    <div class="card-title">${esc(m.title)}</div>`;
  return { el, action: () => openDetails(m) };
}

function makeContinueCard(entry) {
  const el = document.createElement("div");
  el.className = "card wide";
  const pct = Math.round((entry.positionMs / Math.max(entry.durationMs, 1)) * 100);
  el.innerHTML = `
    <img src="${entry.poster || ""}" alt="${esc(entry.title)}" />
    <div class="pbar"><i style="width:${pct}%"></i></div>
    <div class="card-title">${esc(entry.title)}${entry.season ? " · S" + entry.season + "E" + entry.episode : ""}</div>`;
  return { el, action: () => resumeEntry(entry) };
}

async function resumeEntry(entry) {
  // rebuild minimal media + play at saved position
  const media = {
    id: Number(entry.tmdbId), title: entry.title, overview: "",
    poster: entry.poster, backdrop: null, year: "", type: entry.type, rating: 0,
  };
  await play(media, entry.season, entry.episode, entry.positionMs);
}

/* ------------------------- details ------------------------- */

async function openDetails(media) {
  S.view = "details";
  $("topbar").classList.add("scrolled");
  S.current = media;
  $("content").innerHTML = '<div style="padding:140px 48px;color:#5f5f6b;font-size:20px">Loading…</div>';

  try {
    const [det, recs] = await Promise.all([
      tmdb("/" + media.type + "/" + media.id, { append_to_response: "external_ids" }).catch(() => null),
      tmdb("/" + media.type + "/" + media.id + "/recommendations")
        .then((j) => (j.results || []).map((o) => parseMedia(o, media.type)))
        .catch(() => []),
    ]);

    let imdb = "";
    let seasons = [];
    let episodes = [];
    let selectedSeason = null;
    if (det) {
      imdb = (det.imdb_id || (det.external_ids && det.external_ids.imdb_id) || "").trim();
      if (media.type === "tv") {
        seasons = (det.seasons || []).filter((s) => s.season_number > 0);
        selectedSeason = seasons.length ? seasons[0].season_number : null;
      }
    }
    media._imdb = imdb;

    if (selectedSeason != null) {
      const eps = await tmdb("/tv/" + media.id + "/season/" + selectedSeason)
        .then((j) => j.episodes || []).catch(() => []);
      episodes = eps.map((e) => ({ num: e.episode_number, name: e.name, still: e.still_path ? IMG + e.still_path : null }));
    }

    const cont = LS.get("sv_progress", {});
    const prog = cont[media.id + ":s" + selectedSeason] || cont[media.id];

    const c = $("content");
    c.innerHTML = `
      <div class="details-backdrop"><img src="${media.backdrop || media.poster || ""}" /></div>
      <div class="details">
        <div class="details-body">
          <div class="details-poster"><img src="${media.poster || ""}" /></div>
          <div class="details-info">
            <div class="details-kicker">${media.type === "tv" ? "series" : "feature"}</div>
            <div class="details-title">${esc(media.title)}</div>
            <div class="details-meta">${media.year} · <span class="gold">★ ${media.rating.toFixed(1)}</span></div>
            <div class="details-overview">${esc(media.overview)}</div>
            <div class="details-actions">
              <div class="action-btn primary" id="d-play">${prog ? "▶  Resume" : "▶  Play now"}</div>
            </div>
          </div>
        </div>
        <div class="episode-list" id="d-episodes"></div>
        <div id="d-recs"></div>
      </div>`;

    S.rows = [];
    const playBtn = c.querySelector("#d-play");
    S.rows.push({
      el: playBtn,
      items: [{
        el: playBtn,
        action: () => {
          if (media.type === "movie") play(media, null, null);
          else if (episodes.length) play(media, selectedSeason, episodes[0].num);
        },
      }],
    });

    if (episodes.length) {
      const list = c.querySelector("#d-episodes");
      list.innerHTML = `<div class="row-title">Episodes · season ${selectedSeason}</div>`;
      const epItems = episodes.map((ep) => {
        const row = document.createElement("div");
        row.className = "episode-row";
        row.innerHTML = `
          <img src="${ep.still || ""}" />
          <div class="episode-num">E${ep.num}</div>
          <div class="episode-name">${esc(ep.name)}</div>`;
        list.appendChild(row);
        return { el: row, action: () => play(media, selectedSeason, ep.num) };
      });
      S.rows.push({ el: list, items: epItems });
    }

    if (recs.length) {
      const recsWrap = c.querySelector("#d-recs");
      recsWrap.innerHTML = "";
      addRow(recsWrap, "More like this", recs.map((m) => makeCard(m)));
    }

    setFocus(0, 0);
  } catch (e) {
    $("content").innerHTML = `<div style="padding:140px 48px;color:#e88383;font-size:20px">⚠ ${e.message}</div>`;
  }
}

/* ------------------------- favorites ------------------------- */

function showFavorites() {
  S.view = "favorites";
  $("topbar").classList.add("scrolled");
  const favs = LS.get("sv_favorites", []);
  const cont = LS.get("sv_progress", {});
  const c = $("content");
  c.innerHTML = "";
  S.rows = [];

  const topItems = [
    { el: $("btn-search"), action: openSearch },
    { el: $("btn-favorites"), action: showFavorites },
  ];
  S.rows.push({ el: null, items: topItems });

  if (Object.keys(cont).length) {
    addRow(c, "Continue watching",
      Object.values(cont).sort((a, b) => b.updatedAt - a.updatedAt).map(makeContinueCard));
  }
  if (favs.length) {
    addRow(c, "My list · " + favs.length, favs.map((m) => makeCard(m)));
  }
  if (!favs.length && !Object.keys(cont).length) {
    c.innerHTML = '<div style="padding:160px 48px;color:#5f5f6b;font-size:20px">Nothing here yet — watch something and it will show up.</div>';
    S.rows = [S.rows[0]];
  }
  setFocus(1, 0);
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
        <div style="font-size:19px;color:#f8f8fb">${esc(m.title)}</div>
        <div style="font-size:13px;color:#8e8e9b">${m.year} · ${m.type} · <span style="color:#e5c77e">★ ${m.rating.toFixed(1)}</span></div>
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
  if (k === 38) setSearchFocus(S.searchFocus - 1);       // up
  else if (k === 40) setSearchFocus(S.searchFocus + 1);  // down
  else if (k === 13) {                                    // enter
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

$("btn-search").addEventListener("click", openSearch);
$("btn-favorites").addEventListener("click", showFavorites);

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

  // run the WASM decryptor
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

  // walk mirrors until one issues a token
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
    video.src = url; // native HLS — media loads send no Origin header

    if (resumeMs > 10000) {
      video.addEventListener("loadedmetadata", () => { try { video.currentTime = resumeMs / 1000; } catch (e) {} }, { once: true });
    }
    video.play().catch(() => {});
    loadSubs(media, season, episode).then(() => {
      const pref = LS.get("sv_sublang", null);
      if (pref) {
        const found = S.subs.find((s) => s.label === pref);
        if (found) {
          S.selectedSub = found;
          (async () => {
            let url = found.url;
            if (found.type === "srt") {
              try { url = await srtToVttUrl(found.url); } catch (e) { return; }
            }
            const track = document.createElement("track");
            track.kind = "subtitles"; track.label = found.label; track.src = url; track.default = true;
            video.appendChild(track);
            setTimeout(() => { if (video.textTracks && video.textTracks[0]) video.textTracks[0].mode = "showing"; }, 400);
          })();
        }
      }
    });
  } catch (e) {
    $("player-busy").style.display = "none";
    toast("⚠ " + e.message);
    setTimeout(stopPlayback, 1600);
  }
}

video.addEventListener("playing", () => { $("player-busy").style.display = "none"; });
video.addEventListener("error", () => {
  $("player-busy").style.display = "none";
  toast("Playback error");
});
video.addEventListener("timeupdate", () => {
  if (!S.playing || !video.duration || video.currentTime < 5) return;
  const { media, season, episode } = S.playing;
  const cont = LS.get("sv_progress", {});
  cont[media.id + ":s" + (season || "") + "e" + (episode || "")] = {
    tmdbId: String(media.id), title: media.title, poster: media.poster,
    type: media.type, positionMs: video.currentTime * 1000, durationMs: video.duration * 1000,
    season, episode, updatedAt: Date.now(),
  };
  LS.set("sv_progress", cont);
});

function stopPlayback() {
  video.pause();
  video.removeAttribute("src");
  video.load();
  $("player").classList.add("hidden");
  removeSubs();
  S.playing = null;
}

let uiTimer;
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
$("player").addEventListener("mousemove", () => {
  $("player").classList.remove("hide-ui");
  clearTimeout(uiTimer);
  uiTimer = setTimeout(() => $("player").classList.add("hide-ui"), 3500);
});
$("btn-stop").addEventListener("click", stopPlayback);
$("btn-subs").addEventListener("click", () => {
  if (!S.subs.length) { toast("No subtitles found"); return; }
  openSubs();
});

/* ------------------------- subtitles ------------------------- */

async function loadSubs(media, season, episode) {
  S.subs = [];
  const [vdrk, os] = await Promise.all([
    loadVdrkSubs(media, season, episode),
    loadOpenSubs(media, season, episode),
  ]);
  const byLang = {};
  vdrk.forEach((s) => { byLang[s.label] = s; });          // vdrk (native vtt) wins
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

/* SRT -> VTT for the <track> element */
async function srtToVttUrl(srtUrl) {
  const r = await fetch(srtUrl, { headers: { "X-User-Agent": "VLSub 0.10.2" } });
  let text = await r.text();
  text = text.replace(/\r/g, "");
  const body = text
    .replace(/^\uFEFF/, "")
    .replace(/^(\d+)\s*\n/gm, "")             // strip index lines
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
  const total = S.subs.length + 1; // + Off
  S.subsFocus = Math.max(0, Math.min(total - 1, S.subsFocus + dir));
  subsHighlight();
}

function pickSub() {
  const el = document.querySelector('.sub-row[data-i="' + S.subsFocus + '"]');
  if (!el) return;
  const i = Number(el.dataset.i);
  removeSubs();
  if (i === -1) {
    S.selectedSub = null;
    LS.set("sv_sublang", null);
  } else {
    const sub = S.subs[i];
    S.selectedSub = sub;
    LS.set("sv_sublang", sub.label);
    (async () => {
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
    })();
  }
  closeSubs();
}

function closeSubs() {
  $("subs-overlay").classList.add("hidden");
}

/* ------------------------- boot ------------------------- */

window.addEventListener("load", () => {
  setTimeout(() => {
    $("splash").classList.add("done");
    $("app").classList.remove("hidden");
    showHome();
  }, 1600);
});
