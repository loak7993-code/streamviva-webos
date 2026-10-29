# StreamViva for webOS TV

Movies, shows and anime on LG webOS TVs. A native web app packaged as an `.ipk`, built around the remote: full D-pad navigation, no mouse needed.

Part of the StreamViva family: [streamviva](https://github.com/loak7993-code/streamviva) (web) · [streamviva-android](https://github.com/loak7993-code/streamviva-android) · [streamviva-providers](https://github.com/loak7993-code/streamviva-providers) (sources).

## Install

Download the latest `.ipk` from [Releases](https://github.com/loak7993-code/streamviva-webos/releases) (or the CDN mirror: [streamviva-webos.ipk](https://streamviva.satisfying-discovery.workers.dev/streamviva-webos.ipk)).

### Via Developer Mode (recommended)

1. On the TV: install **Developer Mode** from the LG Content Store and sign in with a free LG developer account.
2. Enable **Dev Mode** and note the TV's IP address (Dev Mode shows it).
3. On a computer with the webOS SDK or [webOS Dev Manager](https://github.com/webosbrew/dev-manager-desktop):

   ```bash
   ares-install --device <tv-ip> streamviva-webos-<version>.ipk
   ```

   Or in Dev Manager: **Install IPK** and pick the file.
4. Launch **StreamViva** from the TV's app list.

## What works

- **D-pad navigation** — arrows / OK / Back (key 461), every screen reachable without a mouse
- **Browse** — trending, popular and top-rated rows plus a hero billboard
- **Search** — with the TV's on-screen keyboard
- **Continue watching + My List** — stored on the TV itself
- **Native HLS playback** — the video element fetches streams directly (no Origin header, which is what lets mirrors allow the request where browser XHR gets blocked)
- **Subtitles** — 60+ languages via VDRK (CC button)
- **Resume** — playback position survives restarts

## Tech

- Pure vanilla JS/CSS, no framework, about 25KB total
- silk design language, with Instrument-family typography falling back to system fonts
- Streams resolved client-side: vidsrc API → WASM decryptor → IP-bound token → HLS master
- `.ipk` = standard ar archive (debian-binary + control.tar.gz + data.tar.gz), assembled by `build-ipk.py`

## Build

CI builds and attaches the ipk on every `v*` tag (see `.github/workflows/release.yml`). To build locally:

```bash
python3 build-ipk.py debian-binary control.tar.gz data.tar.gz "streamviva-webos-<version>.ipk"
```

Requires the `tech.streamviva.app/` source dir plus the two tarballs the workflow assembles.

## License

MIT.
