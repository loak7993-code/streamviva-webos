
/* ==================== accounts + sync ==================== */

var BIP39_WORDS = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

var Auth = {
  BACKEND: "https://streamviva.satisfying-discovery.workers.dev",

  b64url: function (bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },

  generateMnemonic: function () {
    var entropy = new Uint8Array(16);
    crypto.getRandomValues(entropy);
    var bits = "";
    for (var i = 0; i < entropy.length; i++) bits += entropy[i].toString(2).padStart(8, "0");
    // sha256 checksum (first 4 bits) via WebCrypto is async; use sync fallback:
    var checksumBits = "0000";
    var words = [];
    var all = bits + checksumBits;
    for (var j = 0; j < 12; j++) {
      words.push(BIP39_WORDS[parseInt(all.substring(j * 11, j * 11 + 11), 2)]);
    }
    // note: checksum-less mnemonic still derives the same stable seed via PBKDF2 —
    // but to stay BIP39-correct across devices, derive checksum properly:
    return this._withChecksum(entropy).then(function (w) { return w; });
  },

  _withChecksum: function (entropy) {
    var self = this;
    return crypto.subtle.digest("SHA-256", entropy).then(function (hash) {
      var checksum = new Uint8Array(hash)[0] >> 4; // first 4 bits
      var bits = "";
      for (var i = 0; i < entropy.length; i++) bits += entropy[i].toString(2).padStart(8, "0");
      bits += checksum.toString(2).padStart(4, "0");
      var words = [];
      for (var j = 0; j < 12; j++) {
        words.push(BIP39_WORDS[parseInt(bits.substring(j * 11, j * 11 + 11), 2)]);
      }
      return words.join(" ");
    });
  },

  seedFromMnemonic: function (mnemonic) {
    return crypto.subtle.importKey(
      "raw", new TextEncoder().encode(mnemonic), "PBKDF2", false, ["deriveBits"]
    ).then(function (key) {
      return crypto.subtle.deriveBits(
        { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode("mnemonic"), iterations: 2048 },
        key, 256
      );
    });
  },

  keysFromSeed: function (seedBits) {
    var seed = new Uint8Array(seedBits);
    var kp = nacl.sign.keyPair.fromSeed(seed);
    return { secret: kp.secretKey, public: kp.publicKey };
  },

  signCode: function (secretKey, code) {
    return nacl.sign.detached(new TextEncoder().encode(code), secretKey);
  },

  api: function (path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    if (opts.token) headers["Authorization"] = "Bearer " + opts.token;
    return fetch(this.BACKEND + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error("api " + r.status + " " + t.slice(0, 60)); });
      return r.json();
    });
  },

  register: function (mnemonic) {
    var self = this;
    var keys;
    return this.seedFromMnemonic(mnemonic).then(function (seedBits) {
      keys = self.keysFromSeed(seedBits);
      return self.api("/auth/register/start", { method: "POST", body: {} });
    }).then(function (start) {
      var sig = self.signCode(keys.secret, start.challenge);
      return self.api("/auth/register/complete", {
        method: "POST",
        body: {
          namespace: "movie-web",
          publicKey: self.b64url(keys.publicKey),
          challenge: { code: start.challenge, signature: self.b64url(sig) },
          device: "webOS TV",
          profile: { colorA: "#8D6BE0", colorB: "#5B3FA8", icon: "07" },
        },
      });
    }).then(function (res) {
      return { token: res.token, userId: res.user.id };
    });
  },

  login: function (mnemonic) {
    var self = this;
    var keys, pubB64;
    return this.seedFromMnemonic(mnemonic).then(function (seedBits) {
      keys = self.keysFromSeed(seedBits);
      pubB64 = self.b64url(keys.publicKey);
      return self.api("/auth/login/start", { method: "POST", body: { publicKey: pubB64 } });
    }).then(function (start) {
      var sig = self.signCode(keys.secret, start.challenge);
      return self.api("/auth/login/complete", {
        method: "POST",
        body: {
          namespace: "movie-web",
          publicKey: pubB64,
          challenge: { code: start.challenge, signature: self.b64url(sig) },
          device: "webOS TV",
        },
      });
    }).then(function (res) {
      return { token: res.token, userId: res.session.userId };
    });
  },
};

/* ---------- session helpers ---------- */

function getSession() { return LS.get("sv_session", null); }
function setSession(s) { LS.set("sv_session", s); }
function clearSession() { LS.set("sv_session", null); }

/* ---------- sync engine ---------- */

var Sync = {
  timer: null,

  enabled: function () { return !!getSession(); },

  schedulePush: function () {
    if (!this.enabled()) return;
    var self = this;
    clearTimeout(this.timer);
    this.timer = setTimeout(function () { self.push(); }, 2500);
  },

  mediaToBookmark: function (m) {
    return {
      tmdbId: String(m.id),
      meta: { title: m.title, year: Number(m.year) || 0, poster: (m.poster || "").replace("https://image.tmdb.org/t/p/w500", ""), type: m.type },
      group: [],
    };
  },

  bookmarkToMedia: function (b) {
    var meta = b.meta || {};
    return {
      id: Number(b.tmdbId), title: meta.title || "?", overview: "",
      poster: meta.poster ? IMG + meta.poster : null, backdrop: null,
      year: String(meta.year || ""), type: meta.type || "movie", rating: 0, _imdb: "",
    };
  },

  push: function () {
    var s = getSession();
    if (!s) return Promise.resolve();
    var favs = LS.get("sv_favorites", []).map(this.mediaToBookmark);
    var progress = Object.values(LS.get("sv_progress", {}));
    return Promise.all([
      Auth.api("/users/" + s.userId + "/bookmarks", { method: "PUT", token: s.token, body: favs }),
      Auth.api("/users/" + s.userId + "/progress/import", { method: "PUT", token: s.token, body: progress }),
    ]).then(function () {
      toast("Library synced");
    }).catch(function (e) {
      toast("Sync failed — will retry");
    });
  },

  pull: function () {
    var s = getSession();
    if (!s) return Promise.resolve();
    var self = this;
    return Promise.all([
      Auth.api("/users/" + s.userId + "/bookmarks", { token: s.token }).catch(function () { return []; }),
      Auth.api("/users/" + s.userId + "/progress", { token: s.token }).catch(function () { return []; }),
    ]).then(function (results) {
      // merge favorites: union
      var local = LS.get("sv_favorites", []);
      var have = {};
      local.forEach(function (f) { have[f.type + ":" + f.id] = true; });
      var remoteFavs = results[0] || [];
      remoteFavs.forEach(function (b) {
        var m = self.bookmarkToMedia(b);
        var key = m.type + ":" + m.id;
        if (!have[key]) local.push(m);
      });
      LS.set("sv_favorites", local);

      // merge progress: newer updatedAt wins
      var prog = LS.get("sv_progress", {});
      (results[1] || []).forEach(function (p) {
        if (!p || !p.tmdbId) return;
        var key = p.tmdbId + ":s" + (p.season || "") + "e" + (p.episode || "");
        var existing = prog[key];
        if (!existing || (p.updatedAt || 0) > (existing.updatedAt || 0)) prog[key] = p;
      });
      LS.set("sv_progress", prog);
      toast("Library synced from account");
    });
  },
};

/* ---------- auth overlay UI ---------- */

var AuthUI = {
  state: "welcome", // welcome | signup-show | login | busy
  mnemonic: "",

  open: function () {
    this.state = "welcome";
    this.mnemonic = "";
    $("auth-overlay").classList.remove("hidden");
    this.render();
  },

  close: function () {
    $("auth-overlay").classList.add("hidden");
    LS.set("sv_onboarded", true);
  },

  render: function () {
    var self = this;
    var box = $("auth-box");
    var st = this.state;
    S.rows = [];

    if (st === "welcome") {
      box.innerHTML =
        '<div class="auth-mark">Stream<em>Viva</em></div>' +
        '<div class="auth-tag">Your library, your progress — everywhere you sign in.</div>' +
        '<div class="auth-actions" id="auth-actions"></div>' +
        '<div class="auth-note">A guest library lives only on this TV.</div>';
      var acts = [
        { label: "Create account", primary: true, action: function () { self.showSignup(); } },
        { label: "I already have an account", action: function () { self.showLogin(); } },
        { label: "Continue as guest", ghost: true, action: function () { self.close(); showTab("home"); } },
      ];
      var wrap = box.querySelector("#auth-actions");
      var items = acts.map(function (a) {
        var el = document.createElement("div");
        el.className = "auth-btn" + (a.primary ? " primary" : "") + (a.ghost ? " ghost" : "");
        el.textContent = a.label;
        wrap.appendChild(el);
        return { el: el, action: a.action };
      });
      S.rows = [{ el: wrap, items: items }];
      setFocus(0, 0);
    }

    if (st === "signup-show") {
      var words = this.mnemonic.split(" ");
      var grid = "";
      for (var i = 0; i < words.length; i += 2) {
        grid += '<div class="pw-row">' +
          '<div class="pw-word"><span>' + (i + 1) + '</span>' + words[i] + "</div>" +
          (words[i + 1] ? '<div class="pw-word"><span>' + (i + 2) + "</span>" + words[i + 1] + "</div>" : "<div></div>") +
          "</div>";
      }
      box.innerHTML =
        '<div class="auth-kicker">your passphrase</div>' +
        '<div class="auth-text">This is your account — no email, no resets. Write these 12 words somewhere safe. You will need them on other devices.</div>' +
        '<div class="pw-grid">' + grid + "</div>" +
        '<div class="auth-actions" id="auth-actions"></div>';
      var acts2 = [
        { label: "I saved my passphrase", primary: true, action: function () { self.doRegister(); } },
        { label: "Back", ghost: true, action: function () { self.open(); } },
      ];
      var wrap2 = box.querySelector("#auth-actions");
      S.rows = [{ el: wrap2, items: acts2.map(function (a) {
        var el = document.createElement("div");
        el.className = "auth-btn" + (a.primary ? " primary" : "") + (a.ghost ? " ghost" : "");
        el.textContent = a.label;
        wrap2.appendChild(el);
        return { el: el, action: a.action };
      }) }];
      setFocus(0, 0);
    }

    if (st === "login") {
      box.innerHTML =
        '<div class="auth-kicker">sign in</div>' +
        '<div class="auth-text">Enter your 12-word passphrase.</div>' +
        '<input id="auth-input" type="text" placeholder="word word word …" autocomplete="off" />' +
        '<div class="auth-actions" id="auth-actions"></div>' +
        '<div class="auth-err" id="auth-err"></div>';
      var acts3 = [
        { label: "Sign in", primary: true, action: function () { self.doLogin(); } },
        { label: "Back", ghost: true, action: function () { self.open(); } },
      ];
      var wrap3 = box.querySelector("#auth-actions");
      S.rows = [{ el: wrap3, items: acts3.map(function (a) {
        var el = document.createElement("div");
        el.className = "auth-btn" + (a.primary ? " primary" : "") + (a.ghost ? " ghost" : "");
        el.textContent = a.label;
        wrap3.appendChild(el);
        return { el: el, action: a.action };
      }) }];
      var input = box.querySelector("#auth-input");
      setTimeout(function () { input.focus(); }, 80);
      input.addEventListener("keydown", function (e) {
        if ((e.keyCode || e.which) === 13) self.doLogin();
        e.stopPropagation();
      });
      setFocus(0, 0);
    }

    if (st === "busy") {
      box.innerHTML =
        '<div class="auth-busy"><div class="spinner"></div>' +
        '<div class="auth-busy-text">' + (this.busyText || "working…") + "</div></div>";
    }
  },

  showSignup: function () {
    var self = this;
    this.state = "busy";
    this.busyText = "generating your passphrase…";
    this.render();
    Auth.generateMnemonic().then(function (m) {
      self.mnemonic = m;
      self.state = "signup-show";
      self.render();
    });
  },

  showLogin: function () {
    this.state = "login";
    this.render();
  },

  doRegister: function () {
    var self = this;
    this.state = "busy";
    this.busyText = "creating your account…";
    this.render();
    Auth.register(this.mnemonic).then(function (res) {
      setSession(res);
      return Sync.pull();
    }).then(function () {
      self.close();
      renderAccountChip();
      showTab("home");
    }).catch(function (e) {
      self.state = "welcome";
      self.render();
      toast("⚠ " + e.message);
    });
  },

  doLogin: function () {
    var self = this;
    var input = $("auth-input");
    var phrase = (input.value || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (phrase.split(" ").length < 12) {
      $("auth-err").textContent = "That doesn't look like a 12-word passphrase.";
      return;
    }
    this.state = "busy";
    this.busyText = "signing in…";
    this.render();
    Auth.login(phrase).then(function (res) {
      setSession(res);
      return Sync.pull();
    }).then(function () {
      self.close();
      renderAccountChip();
      showTab("home");
    }).catch(function (e) {
      self.state = "login";
      self.render();
      toast("⚠ sign in failed");
      setTimeout(function () {
        var err = $("auth-err");
        if (err) err.textContent = e.message.slice(0, 80);
      }, 100);
    });
  },
};

/* account chip in topbar */

function renderAccountChip() {
  var chip = $("account-chip");
  var s = getSession();
  if (s) {
    chip.className = "account-chip on";
    chip.textContent = "◉";
    chip.title = "signed in";
  } else {
    chip.className = "account-chip";
    chip.textContent = "○";
    chip.title = "guest";
  }
}

/* settings overlay */

function openSettings() {
  var box = $("settings-box");
  var s = getSession();
  var self = this;
  var html =
    '<div class="auth-kicker">settings</div>';

  if (s) {
    html += '<div class="acct-card">' +
      '<div class="acct-avatar">V</div>' +
      '<div class="acct-info">' +
      '<div class="acct-name">StreamViva member</div>' +
      '<div class="acct-sub">ID ' + s.userId.slice(0, 8) + " · webOS TV · synced</div>" +
      "</div></div>" +
      '<div class="auth-actions" id="set-actions"></div>';
    box.innerHTML = html;
    var acts = [
      { label: "Sync now", action: function () { Sync.push(); } },
      { label: "Sign out", danger: true, action: function () {
        clearSession();
        renderAccountChip();
        closeSettings();
        toast("Signed out — library stays on this TV");
      } },
    ];
    var wrap = box.querySelector("#set-actions");
    S.rows = [{ el: wrap, items: acts.map(function (a) {
      var el = document.createElement("div");
      el.className = "auth-btn" + (a.danger ? " danger" : "");
      el.textContent = a.label;
      wrap.appendChild(el);
      return { el: el, action: a.action };
    }) }];
  } else {
    html += '<div class="acct-card guest">' +
      '<div class="acct-info">' +
      '<div class="acct-name">Browsing as guest</div>' +
      '<div class="acct-sub">Your library lives only on this TV. Sign in to sync it with the website and apps.</div>' +
      "</div></div>" +
      '<div class="auth-actions" id="set-actions"></div>';
    box.innerHTML = html;
    var acts2 = [
      { label: "Sign in / Create account", primary: true, action: function () {
        closeSettings();
        AuthUI.open();
      } },
    ];
    var wrap2 = box.querySelector("#set-actions");
    S.rows = [{ el: wrap2, items: acts2.map(function (a) {
      var el = document.createElement("div");
      el.className = "auth-btn" + (a.primary ? " primary" : "");
      el.textContent = a.label;
      wrap2.appendChild(el);
      return { el: el, action: a.action };
    }) }];
  }
  $("settings-overlay").classList.remove("hidden");
  setFocus(0, 0);
}

function closeSettings() {
  $("settings-overlay").classList.add("hidden");
}

/* auto-sync after local changes */

var _toggleFav = toggleFav;
toggleFav = function (m) {
  _toggleFav(m);
  Sync.schedulePush();
};
var _origTimeUpdate = null;
