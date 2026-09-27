# StreamViva for webOS TV

Movies, shows & anime for LG webOS TVs. Built as a native web app (.ipk) with full remote-control navigation.

## Install

**Download:** [streamviva-webos.ipk](https://streamviva.satisfying-discovery.workers.dev/streamviva-webos.ipk)

### Via Developer Mode (recommended)
1. On the TV: install **Developer Mode** from the LG Content Store and sign in (free LG developer account)
2. Enable **Dev Mode** and note the TV's **IP address** (Dev Mode shows it)
3. On your computer with the webOS SDK (or [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop)):
   ```
   ares-install --device <tv-ip> streamviva_1.0.0_all.ipk
   ```
   Or use Dev Manager → Install IPK
4. Launch **StreamViva** from the TV's app list

### What works
- D-pad navigation (arrows / OK / Back — key 461)
- Trending, popular, top-rated rows + hero billboard
- Search with the TV's on-screen keyboard
- Continue watching + My List (stored on the TV)
- **Native HLS playback** — the video element fetches streams directly (no Origin header → mirrors allow it, unlike browser XHR)
- 60+ subtitle languages via VDRK (CC button)
- Resume playback position

### Tech
- Pure vanilla JS/CSS — no framework, ~25KB total
- silk design language (Instrument-family typography falls back to system serif/sans)
- Streams resolved client-side: vidsrc API → WASM decryptor (WebAssembly) → IP-bound token → HLS master
- .ipk packaged as standard ar archive (debian-binary + control.tar.gz + data.tar.gz)
