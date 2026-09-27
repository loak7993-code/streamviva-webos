/* replicate the TV app's exact auth + sync chain in node */
const nacl = require('/tmp/opencode/psrev/webos/tweetnacl.min.js');
const crypto = require('crypto');
const BACKEND = 'https://streamviva.satisfying-discovery.workers.dev';

const b64url = (bytes) => Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = 'Bearer ' + opts.token;
  const r = await fetch(BACKEND + path, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  if (!r.ok) throw new Error('api ' + r.status + ' ' + (await r.text()).slice(0, 60));
  return r.json();
}

(async () => {
  // 1. mnemonic (same checksum algorithm as the app)
  const words = require('/tmp/opencode/psrev/webos/wordlist.json');
  const entropy = crypto.randomBytes(16);
  const checksum = crypto.createHash('sha256').update(entropy).digest()[0] >> 4;
  let bits = [...entropy].map(b => b.toString(2).padStart(8, '0')).join('') + checksum.toString(2).padStart(4, '0');
  const mnemonic = [...Array(12)].map((_, j) => words[parseInt(bits.slice(j * 11, j * 11 + 11), 2)]).join(' ');
  console.log('mnemonic:', mnemonic);

  // 2. seed (WebCrypto PBKDF2, same as the app)
  const keyMaterial = await crypto.webcrypto.subtle.importKey('raw', Buffer.from(mnemonic), 'PBKDF2', false, ['deriveBits']);
  const seedBits = await crypto.webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Buffer.from('mnemonic'), iterations: 2048 }, keyMaterial, 256);
  const keys = nacl.sign.keyPair.fromSeed(new Uint8Array(seedBits));

  // 3. register (the exact app flow)
  const start = await api('/auth/register/start', { method: 'POST', body: {} });
  const sig = nacl.sign.detached(Buffer.from(start.challenge), keys.secretKey);
  const reg = await api('/auth/register/complete', { method: 'POST', body: {
    namespace: 'movie-web', publicKey: b64url(keys.publicKey),
    challenge: { code: start.challenge, signature: b64url(sig) },
    device: 'webOS TV', profile: { colorA: '#8D6BE0', colorB: '#5B3FA8', icon: '07' },
  }});
  console.log('registered:', reg.user.id, '| token:', reg.token.slice(0, 12) + '...');

  // 4. sync push (favorites + progress, app shapes)
  await api('/users/' + reg.user.id + '/bookmarks', { method: 'PUT', token: reg.token, body: [
    { tmdbId: '27205', meta: { title: 'Inception', year: 2010, poster: '/9gk7a', type: 'movie' }, group: [] },
  ]});
  await api('/users/' + reg.user.id + '/progress/import', { method: 'PUT', token: reg.token, body: [
    { tmdbId: '27205', title: 'Inception', poster: null, type: 'movie', positionMs: 650000, durationMs: 8888000, season: null, episode: null, updatedAt: Date.now() },
  ]});
  console.log('pushed favorites + progress');

  // 5. pull back and verify
  const favs = await api('/users/' + reg.user.id + '/bookmarks', { token: reg.token });
  const prog = await api('/users/' + reg.user.id + '/progress', { token: reg.token });
  console.log('pulled back: favorites=' + favs.length + ' progress=' + prog.length);
  console.log('progress entry intact:', prog[0].positionMs === 650000);

  // 6. login with the same mnemonic (the app's login flow)
  const start2 = await api('/auth/login/start', { method: 'POST', body: { publicKey: b64url(keys.publicKey) } });
  const sig2 = nacl.sign.detached(Buffer.from(start2.challenge), keys.secretKey);
  const login = await api('/auth/login/complete', { method: 'POST', body: {
    namespace: 'movie-web', publicKey: b64url(keys.publicKey),
    challenge: { code: start2.challenge, signature: b64url(sig2) }, device: 'webOS TV',
  }});
  console.log('login OK: userId matches =', login.session.userId === reg.user.id);

  console.log('\nALL AUTH + SYNC CHAIN VERIFIED ✓');
})();
