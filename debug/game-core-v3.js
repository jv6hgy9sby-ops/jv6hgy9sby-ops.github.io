"use strict";
window.MATVEY_BUILD = "3.0-premium-procedural";
(function () {
  if (!window.THREE) {
    window.__fatal(
      "Не удалось загрузить 3D-модуль. Проверьте интернет и обновите страницу.",
    );
    return;
  }
  try {
    var testCanvas = document.createElement("canvas");
    if (
      !(
        testCanvas.getContext("webgl") ||
        testCanvas.getContext("experimental-webgl")
      )
    )
      throw new Error("no-webgl");
  } catch (error) {
    window.__fatal(
      "Устройство не запустило 3D-графику. Обновите Safari или откройте игру на другом устройстве.",
    );
    return;
  }

  function $(id) {
    return document.getElementById(id);
  }
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function dist2(ax, az, bx, bz) {
    var x = ax - bx,
      z = az - bz;
    return x * x + z * z;
  }
  function angleLerp(a, b, t) {
    var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return a + d * t;
  }
  function fmtTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));
    var m = Math.floor(seconds / 60),
      s = seconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function nowMs() {
    return performance && performance.now ? performance.now() : Date.now();
  }

  var IS_TOUCH = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (IS_TOUCH) document.body.classList.add("touch");

  var STORAGE = {
    settings: "matvey.settings.v2",
    achievements: "matvey.ach.v2",
    best: "matvey.best.v2",
  };
  var settings = {
    sound: true,
    music: 0.18,
    voice: 0.9,
    sfx: 0.7,
    sens: 1,
    calm: false,
    quality: "medium",
  };
  var achievements = { sel: false, hitry: false, erzhan: false, king: false };
  var bestTime = null;
  try {
    var stored = JSON.parse(localStorage.getItem(STORAGE.settings) || "null");
    if (stored && typeof stored === "object")
      Object.keys(settings).forEach(function (k) {
        if (typeof stored[k] === typeof settings[k]) settings[k] = stored[k];
      });
    var storedAch = JSON.parse(
      localStorage.getItem(STORAGE.achievements) || "null",
    );
    if (storedAch && typeof storedAch === "object")
      Object.keys(achievements).forEach(function (k) {
        if (typeof storedAch[k] === "boolean") achievements[k] = storedAch[k];
      });
    var best = parseFloat(localStorage.getItem(STORAGE.best));
    if (Number.isFinite(best)) bestTime = best;
  } catch (error) {}
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
    } catch (error) {}
  }
  function saveAchievements() {
    try {
      localStorage.setItem(STORAGE.achievements, JSON.stringify(achievements));
    } catch (error) {}
  }
  function saveBest() {
    try {
      if (bestTime !== null)
        localStorage.setItem(STORAGE.best, String(bestTime));
    } catch (error) {}
  }

  var TelegramApp = {
    tg:
      window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null,
    get active() {
      if (!this.tg) return false;
      var q = new URLSearchParams(location.search);
      return Boolean(
        this.tg.initData ||
          q.has("tgWebAppPlatform") ||
          q.has("tgWebAppVersion"),
      );
    },
    init: function () {
      if (!this.active) return;
      try {
        this.tg.ready();
        this.tg.expand();
        if (this.tg.disableVerticalSwipes) this.tg.disableVerticalSwipes();
        if (this.tg.setBackgroundColor) this.tg.setBackgroundColor("#17110d");
        if (this.tg.setHeaderColor) this.tg.setHeaderColor("#17110d");
      } catch (error) {
        console.warn("Telegram init:", error);
      }
    },
    fullscreen: function () {
      if (!this.active) return;
      try {
        this.tg.expand();
        if (this.tg.requestFullscreen) this.tg.requestFullscreen();
      } catch (error) {
        console.warn("Telegram fullscreen:", error);
      }
    },
    lockLandscape: function () {
      if (!this.active || innerWidth <= innerHeight) return;
      try {
        if (this.tg.lockOrientation) this.tg.lockOrientation();
      } catch (error) {}
    },
  };
  function hapticImpact(style) {
    try {
      var h = TelegramApp.tg && TelegramApp.tg.HapticFeedback;
      if (h && h.impactOccurred) {
        h.impactOccurred(style || "light");
        return;
      }
      if (navigator.vibrate) navigator.vibrate(10);
    } catch (error) {}
  }
  function hapticNotify(type) {
    try {
      var h = TelegramApp.tg && TelegramApp.tg.HapticFeedback;
      if (h && h.notificationOccurred) {
        h.notificationOccurred(type || "success");
        return;
      }
      if (navigator.vibrate) navigator.vibrate([16, 24, 16]);
    } catch (error) {}
  }
  function setClosingConfirmation(enabled) {
    if (!TelegramApp.active) return;
    try {
      if (enabled && TelegramApp.tg.enableClosingConfirmation)
        TelegramApp.tg.enableClosingConfirmation();
      if (!enabled && TelegramApp.tg.disableClosingConfirmation)
        TelegramApp.tg.disableClosingConfirmation();
    } catch (error) {}
  }

  /* Optional real audio files. Missing files intentionally produce silence. */
  var ASSET_PATHS = {
    musicHome: "assets/audio/music/home-theme.mp3",
    musicYard: "assets/audio/music/yard-theme.mp3",
    ambientHome: "assets/audio/ambient/home-room.mp3",
    ambientYard: "assets/audio/ambient/yard-birds.mp3",
    stepsWalk: "assets/audio/sfx/steps-walk.mp3",
    stepsRun: "assets/audio/sfx/steps-run.mp3",
    sniff: "assets/audio/sfx/sniff.mp3",
    snort: "assets/audio/sfx/snort.mp3",
    whine: "assets/audio/sfx/whine.mp3",
    dig: "assets/audio/sfx/dig.mp3",
    jump: "assets/audio/sfx/jump.mp3",
    collect: "assets/audio/sfx/collect.mp3",
    achievement: "assets/audio/sfx/achievement.mp3",
    door: "assets/audio/sfx/door.mp3",
    vacuum: "assets/audio/sfx/vacuum.mp3",
    snore: "assets/audio/sfx/snore.mp3",
    ui: "assets/audio/sfx/ui-click.mp3",
  };
  var VOICE_PATHS = {
    start: "assets/audio/voice/voice-start.mp3",
    firstCrumb: "assets/audio/voice/voice-first-crumb.mp3",
    vacuum: "assets/audio/voice/voice-vacuum.mp3",
    beg: "assets/audio/voice/voice-beg.mp3",
    leash: "assets/audio/voice/voice-leash.mp3",
    door: "assets/audio/voice/voice-door.mp3",
    smell1: "assets/audio/voice/voice-smell-1.mp3",
    smell2: "assets/audio/voice/voice-smell-2.mp3",
    smell3: "assets/audio/voice/voice-smell-3.mp3",
    bedWatched: "assets/audio/voice/voice-bed-watched.mp3",
    bedFree: "assets/audio/voice/voice-bed-free.mp3",
    dig: "assets/audio/voice/voice-dig.mp3",
    sleep: "assets/audio/voice/voice-sleep.mp3",
    finale: "assets/audio/voice/voice-finale.mp3",
  };

  var AudioManager = {
    unlocked: false,
    cache: {},
    availability: {},
    activeOneShots: [],
    music: null,
    ambient: null,
    vacuum: null,
    area: null,
    lastPlayed: {},
    unlock: function () {
      this.unlocked = true;
      try {
        var silent = new Audio();
        silent.volume = 0;
        var p = silent.play();
        if (p && p.catch) p.catch(function () {});
      } catch (error) {}
    },
    effective: function (category, base) {
      if (!settings.sound) return 0;
      var v =
        category === "music"
          ? settings.music
          : category === "voice"
            ? settings.voice
            : settings.sfx;
      return clamp((base === undefined ? 1 : base) * v, 0, 1);
    },
    probe: function (path) {
      var self = this;
      if (this.availability[path] !== undefined)
        return Promise.resolve(this.availability[path]);
      return fetch(path, { method: "HEAD", cache: "force-cache" })
        .then(function (r) {
          self.availability[path] = r.ok;
          return r.ok;
        })
        .catch(function () {
          self.availability[path] = false;
          return false;
        });
    },
    make: function (path, loop) {
      var audio = new Audio(path);
      audio.preload = "none";
      audio.loop = Boolean(loop);
      audio.playsInline = true;
      return audio;
    },
    playOne: function (key, volume, cooldown) {
      if (!this.unlocked || !settings.sound) return Promise.resolve(false);
      var path = ASSET_PATHS[key];
      if (!path) return Promise.resolve(false);
      var t = nowMs(),
        wait = cooldown === undefined ? 90 : cooldown;
      if (this.lastPlayed[key] && t - this.lastPlayed[key] < wait)
        return Promise.resolve(false);
      this.lastPlayed[key] = t;
      var self = this;
      return this.probe(path).then(function (ok) {
        if (!ok) return false;
        var a = self.make(path, false);
        a.volume = self.effective("sfx", volume === undefined ? 1 : volume);
        self.activeOneShots.push(a);
        var cleanup = function () {
          var i = self.activeOneShots.indexOf(a);
          if (i >= 0) self.activeOneShots.splice(i, 1);
        };
        a.addEventListener("ended", cleanup, { once: true });
        a.addEventListener("error", cleanup, { once: true });
        var p = a.play();
        if (p && p.catch) p.catch(cleanup);
        return true;
      });
    },
    stopLoop: function (name) {
      var a = this[name];
      if (a) {
        try {
          a.pause();
          a.currentTime = 0;
        } catch (error) {}
        this[name] = null;
      }
    },
    startLoop: function (name, key, category, volume) {
      var self = this,
        path = ASSET_PATHS[key];
      if (!this.unlocked || !settings.sound || !path)
        return Promise.resolve(false);
      if (this[name]) return Promise.resolve(true);
      return this.probe(path).then(function (ok) {
        if (!ok) return false;
        var a = self.make(path, true);
        a.volume = self.effective(category, volume);
        self[name] = a;
        var p = a.play();
        if (p && p.catch)
          p.catch(function () {
            if (self[name] === a) self[name] = null;
          });
        return true;
      });
    },
    setArea: function (area) {
      if (this.area === area) return;
      this.area = area;
      this.stopLoop("music");
      this.stopLoop("ambient");
      if (!this.unlocked || !settings.sound) return;
      if (area === "yard") {
        this.startLoop("music", "musicYard", "music", 0.5);
        this.startLoop("ambient", "ambientYard", "music", 0.32);
      } else {
        this.startLoop("music", "musicHome", "music", 0.5);
        this.startLoop("ambient", "ambientHome", "music", 0.22);
      }
    },
    startVacuum: function () {
      return this.startLoop("vacuum", "vacuum", "sfx", 0.28);
    },
    stopVacuum: function () {
      this.stopLoop("vacuum");
    },
    updateVacuum: function (distance) {
      if (!this.vacuum) return;
      var spatial = clamp(1 - distance / 8, 0, 0.32);
      this.vacuum.volume = this.effective("sfx", spatial);
    },
    refreshVolumes: function () {
      if (this.music) this.music.volume = this.effective("music", 0.5);
      if (this.ambient)
        this.ambient.volume = this.effective(
          "music",
          this.area === "yard" ? 0.32 : 0.22,
        );
      if (this.vacuum) this.vacuum.volume = this.effective("sfx", 0.18);
    },
    duck: function (on) {
      if (this.music)
        this.music.volume = this.effective("music", on ? 0.13 : 0.5);
      if (this.ambient)
        this.ambient.volume = this.effective(
          "music",
          on ? 0.08 : this.area === "yard" ? 0.32 : 0.22,
        );
    },
    pauseAll: function () {
      ["music", "ambient", "vacuum"].forEach(function (n) {
        var a = AudioManager[n];
        if (a)
          try {
            a.pause();
          } catch (error) {}
      });
      this.activeOneShots.forEach(function (a) {
        try {
          a.pause();
        } catch (error) {}
      });
      this.activeOneShots.length = 0;
    },
    resumeLoops: function () {
      if (!this.unlocked || !settings.sound) return;
      ["music", "ambient", "vacuum"].forEach(function (n) {
        var a = AudioManager[n];
        if (a) {
          var p = a.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
    },
    stopAll: function () {
      this.pauseAll();
      this.stopLoop("music");
      this.stopLoop("ambient");
      this.stopLoop("vacuum");
      this.area = null;
    },
  };

  var voiceState = {
    speaking: false,
    until: 0,
    lastKey: "",
    lastAt: 0,
    bubbleTimer: null,
  };
  var ALLOW_SYSTEM_VOICE = false;
  function chooseRussianVoice() {
    if (!ALLOW_SYSTEM_VOICE || !("speechSynthesis" in window)) return null;
    var voices = speechSynthesis.getVoices();
    var strictMale =
      /\b(yuri|yury|юрий|pavel|павел|maxim|maksim|максим|alexander|aleksandr|александр|nikolai|николай|mikhail|михаил|dmitry|дмитрий)\b/i;
    return (
      voices.find(function (v) {
        return /^ru/i.test(v.lang || "") && strictMale.test(v.name || "");
      }) || null
    );
  }
  function hideVoiceBubble() {
    $("voice-bubble").classList.remove("show");
  }
  function stopVoice() {
    if (voiceState.bubbleTimer) clearTimeout(voiceState.bubbleTimer);
    voiceState.bubbleTimer = null;
    voiceState.speaking = false;
    voiceState.until = 0;
    if (voiceState.audio) {
      try {
        voiceState.audio.pause();
        voiceState.audio.currentTime = 0;
      } catch (error) {}
      voiceState.audio = null;
    }
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch (error) {}
    AudioManager.duck(false);
    hideVoiceBubble();
  }
  function speakMatvey(key, text, options) {
    options = options || {};
    var t = nowMs();
    if (
      !options.force &&
      voiceState.lastKey === key &&
      t - voiceState.lastAt < 12000
    )
      return;
    if (!options.force && voiceState.speaking && t - voiceState.lastAt < 1200)
      return;
    voiceState.lastKey = key;
    voiceState.lastAt = t;
    if (voiceState.bubbleTimer) clearTimeout(voiceState.bubbleTimer);
    if (voiceState.audio) {
      try {
        voiceState.audio.pause();
      } catch (error) {}
      voiceState.audio = null;
    }
    $("voice-text").textContent = "«" + text + "»";
    $("voice-bubble").classList.add("show");
    var estimated = clamp(text.length * 72, 2500, 6300);
    voiceState.speaking = true;
    voiceState.until = t + estimated;
    voiceState.bubbleTimer = setTimeout(function () {
      hideVoiceBubble();
      voiceState.speaking = false;
      AudioManager.duck(false);
    }, estimated + 350);
    if (!settings.sound || settings.voice <= 0 || !AudioManager.unlocked)
      return;
    var path = VOICE_PATHS[key];
    if (!path) return;
    AudioManager.probe(path).then(function (ok) {
      if (!ok) return;
      var a = AudioManager.make(path, false);
      voiceState.audio = a;
      a.volume = AudioManager.effective("voice", 1);
      AudioManager.duck(true);
      var finish = function () {
        if (voiceState.audio === a) voiceState.audio = null;
        voiceState.speaking = false;
        AudioManager.duck(false);
      };
      a.onended = finish;
      a.onerror = finish;
      var p = a.play();
      if (p && p.catch) p.catch(finish);
    });
  }
  var MatveyDialogue = {
    lastAt: 0,
    cooldown: 8500,
    lines: {
      start: ["Так. Проверим обстановку.", "Рабочий день начался.", "Селёдочник вышел на смену.", "Начнём с самого важного. С еды."],
      idle: ["Я думаю.", "Ситуация требует наблюдения.", "Контроль обстановки продолжается.", "Можно было уже принести вкусное."],
      walk: ["Проверяю территорию.", "Иду по важному делу.", "След ведёт куда-то вкусное."],
      run: ["Расступитесь.", "Оперативное ускорение.", "Селёдочник спешит."],
      humanNear: ["Так. Начинаем переговоры.", "Человек обнаружен.", "Есть разговор."],
      humanWait: ["Я могу ждать. Но осуждаю.", "Переговоры сами себя не проведут.", "Человек, я здесь."],
      oink: ["Хрю-хрю.", "Хрю-хрю. Работаем.", "Хрю-хрю. Подозрительно."]
    },
    say: function (category, options) {
      options = options || {};
      var t = nowMs(), lines = this.lines[category];
      if (!lines || (!options.force && t - this.lastAt < (options.cooldown || this.cooldown))) return false;
      this.lastAt = t;
      speakMatvey("dialogue-" + category, lines[Math.floor(Math.random() * lines.length)], { force: Boolean(options.force) });
      return true;
    }
  };

  /* UI */
  var screenIds = [
    "screen-start",
    "screen-controls",
    "screen-settings",
    "screen-achievements",
    "screen-pause",
    "screen-finale",
  ];
  var screenReturn = "start",
    tgBack = null,
    portraitBackHidden = false;
  function screenOpen(id) {
    return !$(id).classList.contains("hidden");
  }
  function updateBack() {
    if (!tgBack) return;
    try {
      if (portraitBackHidden) {
        tgBack.hide();
        return;
      }
      if (screenOpen("screen-start")) tgBack.hide();
      else tgBack.show();
    } catch (error) {}
  }
  function showScreen(id) {
    screenIds.forEach(function (s) {
      $(s).classList.toggle("hidden", s !== id);
    });
    if (!id)
      screenIds.forEach(function (s) {
        $(s).classList.add("hidden");
      });
    updateBack();
  }
  function setQuest(text) {
    $("quest-text").textContent = text;
  }
  function updateCounters() {
    $("crumbs-val").textContent = Game.crumbs + " / 10";
    $("smells-val").textContent = Game.smells + " / 3";
  }
  function setMood(value) {
    Game.mood = clamp(value, 0, 100);
    $("mood-fill").style.width = Game.mood + "%";
  }
  function setPrompt(text, short) {
    $("prompt").classList.toggle("hidden", !text);
    if (text) $("prompt").textContent = text;
    $("btn-action-label").textContent = short || "ДЕЙСТВИЕ";
  }
  function setHold(value) {
    $("hold-wrap").classList.toggle("hidden", value === null);
    if (value !== null)
      $("hold-fill").style.width = Math.round(clamp(value, 0, 1) * 100) + "%";
  }
  function setWatch(looking) {
    var el = $("watch-ind");
    if (Game.quest !== 7 || Game.sleeping) {
      el.classList.add("hidden");
      return;
    }
    el.className = looking ? "warn" : "ok";
    el.id = "watch-ind";
    el.textContent = looking ? "👀 Свидетель смотрит" : "🐾 Оперативное окно";
  }
  var toastBusy = false,
    toastQueue = [];
  function showToast(icon, title, desc) {
    toastQueue.push({ icon: icon, title: title, desc: desc });
    if (toastBusy) return;
    (function pump() {
      if (!toastQueue.length) {
        toastBusy = false;
        return;
      }
      toastBusy = true;
      var item = toastQueue.shift();
      $("ach-toast-title").textContent = item.icon + " " + item.title;
      $("ach-toast-desc").textContent = item.desc;
      $("ach-toast").classList.add("show");
      setTimeout(function () {
        $("ach-toast").classList.remove("show");
        setTimeout(pump, 350);
      }, 2800);
    })();
  }
  var ACHIEVEMENTS = [
    {
      key: "sel",
      icon: "🐟",
      title: "Селёдочник",
      desc: "Найти рыбный жетон под диваном.",
    },
    {
      key: "hitry",
      icon: "🕶️",
      title: "Хитрый мопс",
      desc: "Ни разу не попасться пылесосу.",
    },
    {
      key: "erzhan",
      icon: "😴",
      title: "Ержан устал",
      desc: "20 секунд смотреть, как Матвей спит.",
    },
    {
      key: "king",
      icon: "👑",
      title: "Король Рассола",
      desc: "Закончить день и найти жетон.",
    },
  ];
  function unlockAchievement(key) {
    if (achievements[key]) return;
    achievements[key] = true;
    saveAchievements();
    hapticNotify("success");
    AudioManager.playOne("achievement", 0.8, 500);
    var d = ACHIEVEMENTS.find(function (x) {
      return x.key === key;
    });
    if (d) showToast(d.icon, "Достижение: " + d.title, d.desc);
  }
  function renderAchievements() {
    $("ach-list").innerHTML = ACHIEVEMENTS.map(function (d) {
      return (
        '<div class="ach-item ' +
        (achievements[d.key] ? "" : "locked") +
        '"><div class="ach-ico">' +
        (achievements[d.key] ? d.icon : "🔒") +
        '</div><div><div class="ach-title">' +
        d.title +
        '</div><div class="ach-desc">' +
        d.desc +
        "</div></div></div>"
      );
    }).join("");
  }
  function refreshBest() {
    $("best-line").textContent =
      bestTime === null
        ? "Рекорд пока не установлен. Матвей оценивает ситуацию."
        : "Лучший рабочий день: " + fmtTime(bestTime);
  }
  function syncSettings() {
    $("set-sound").classList.toggle("on", settings.sound);
    $("set-calm").classList.toggle("on", settings.calm);
    $("set-music").value = settings.music;
    $("set-voice").value = settings.voice;
    $("set-sfx").value = settings.sfx;
    $("set-sens").value = settings.sens;
    [
      ["low", "low"],
      ["med", "medium"],
      ["high", "high"],
    ].forEach(function (q) {
      $("q-" + q[0]).classList.toggle("on", settings.quality === q[1]);
    });
    $("btn-mute").textContent = settings.sound ? "🔊" : "🔇";
  }

  /* Three.js */
  var renderer, scene, camera, dirLight, roomLight, rimLight;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
    });
  } catch (error) {
    window.__fatal("Не удалось создать 3D-сцену на этом устройстве.");
    return;
  }
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.66;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = "none";
  $("canvas-holder").appendChild(renderer.domElement);
  renderer.domElement.addEventListener(
    "webglcontextlost",
    function (event) {
      event.preventDefault();
      if (Game && Game.mode === "playing") pauseGame();
      window.__fatal(
        "3D-контекст был потерян. Обновите страницу — прогресс достижений сохранён.",
      );
    },
    false,
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x304b4b);
  camera = new THREE.PerspectiveCamera(49, 1, 0.1, 110);
  var hemi = new THREE.HemisphereLight(0xffdfbd, 0x263c37, 0.38);
  scene.add(hemi);
  dirLight = new THREE.DirectionalLight(0xffc98c, 1.12);
  dirLight.position.set(9, 14, -8);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.left = -18;
  dirLight.shadow.camera.right = 18;
  dirLight.shadow.camera.top = 18;
  dirLight.shadow.camera.bottom = -18;
  dirLight.shadow.camera.near = 2;
  dirLight.shadow.camera.far = 44;
  dirLight.shadow.bias = -0.0014;
  scene.add(dirLight);
  rimLight = new THREE.DirectionalLight(0x8fc3c2, 0.24);
  rimLight.position.set(-10, 8, 8);
  scene.add(rimLight);
  roomLight = new THREE.PointLight(0xffa95c, 0.32, 18, 2);
  roomLight.position.set(-2.5, 3.8, 1.5);
  scene.add(roomLight);

  function canvasTexture(size, draw, repeatX, repeatY) {
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext("2d");
    draw(ctx, size);
    var texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    if (repeatX || repeatY) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX || 1, repeatY || 1);
    }
    texture.anisotropy = Math.min(
      4,
      renderer.capabilities.getMaxAnisotropy
        ? renderer.capabilities.getMaxAnisotropy()
        : 1,
    );
    return texture;
  }
  function makeWoodTexture() {
    return canvasTexture(
      512,
      function (ctx, s) {
        ctx.fillStyle = "#8b5735";
        ctx.fillRect(0, 0, s, s);
        var board = s / 4;
        for (var y = 0; y < s; y += board) {
          var g = ctx.createLinearGradient(0, y, 0, y + board);
          g.addColorStop(0, "#a66d43");
          g.addColorStop(0.55, "#895331");
          g.addColorStop(1, "#754328");
          ctx.fillStyle = g;
          ctx.fillRect(0, y, s, board - 3);
          ctx.fillStyle = "rgba(42,22,12,.42)";
          ctx.fillRect(0, y + board - 3, s, 3);
          for (var i = 0; i < 85; i++) {
            var px = Math.random() * s,
              py = y + Math.random() * (board - 5),
              len = 12 + Math.random() * 55;
            ctx.strokeStyle =
              "rgba(66,32,16," + (0.035 + Math.random() * 0.07) + ")";
            ctx.lineWidth = 0.5 + Math.random();
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.bezierCurveTo(
              px + len * 0.25,
              py + Math.sin(px) * 3,
              px + len * 0.7,
              py - 2,
              px + len,
              py + Math.random() * 3,
            );
            ctx.stroke();
          }
        }
      },
      3.2,
      4.4,
    );
  }
  function makeTileTexture() {
    return canvasTexture(
      384,
      function (ctx, s) {
        ctx.fillStyle = "#6f716c";
        ctx.fillRect(0, 0, s, s);
        var cell = s / 4;
        for (var y = 0; y < 4; y++)
          for (var x = 0; x < 4; x++) {
            var v = 104 + Math.floor(Math.random() * 14);
            ctx.fillStyle = "rgb(" + v + "," + (v + 3) + "," + (v + 1) + ")";
            ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
            ctx.strokeStyle = "rgba(255,238,211,.13)";
            ctx.strokeRect(x * cell + 2.5, y * cell + 2.5, cell - 5, cell - 5);
          }
      },
      2.5,
      4.6,
    );
  }
  function makeFurTexture() {
    return canvasTexture(
      256,
      function (ctx, s) {
        ctx.fillStyle = "#bca079";
        ctx.fillRect(0, 0, s, s);
        var image = ctx.getImageData(0, 0, s, s),
          d = image.data;
        for (var i = 0; i < d.length; i += 4) {
          var n = (Math.random() - 0.5) * 34;
          d[i] = clamp(d[i] + n, 0, 255);
          d[i + 1] = clamp(d[i + 1] + n * 0.88, 0, 255);
          d[i + 2] = clamp(d[i + 2] + n * 0.66, 0, 255);
        }
        ctx.putImageData(image, 0, 0);
        for (var k = 0; k < 430; k++) {
          var x = Math.random() * s,
            y = Math.random() * s,
            l = 2 + Math.random() * 7;
          ctx.strokeStyle =
            "rgba(55,39,28," + (0.025 + Math.random() * 0.045) + ")";
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.sin(y * 0.11) * 1.5, y + l);
          ctx.stroke();
        }
      },
      2.2,
      2.2,
    );
  }
  function makeFabricTexture(base) {
    return canvasTexture(
      256,
      function (ctx, s) {
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = "rgba(255,255,255,.055)";
        ctx.lineWidth = 1;
        for (var i = 0; i < s; i += 5) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, s);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(s, i);
          ctx.stroke();
        }
      },
      3,
      3,
    );
  }
  var TEX = {
    wood: makeWoodTexture(),
    tile: makeTileTexture(),
    fur: makeFurTexture(),
    sofa: makeFabricTexture("#23494a"),
    sheet: makeFabricTexture("#8d3040"),
  };
  function mat(color, rough, metal, map) {
    var material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: rough === undefined ? 0.86 : rough,
      metalness: metal || 0,
      map: map || null,
    });
    return material;
  }
  var M = {
    wall: mat(0x9f8d76, 0.94),
    trim: mat(0x60452f, 0.88),
    wood: mat(0x80502f, 0.8),
    woodDark: mat(0x3f291f, 0.86),
    floor: mat(0xffffff, 0.78, 0, TEX.wood),
    kitchenFloor: mat(0xffffff, 0.9, 0, TEX.tile),
    grass: mat(0x3f6b42, 0.96),
    grass2: mat(0x527d45, 0.96),
    earth: mat(0x654832, 0.99),
    sofa: mat(0xffffff, 0.91, 0, TEX.sofa),
    sofaDark: mat(0x153638, 0.96),
    gold: mat(0xc38a3b, 0.84),
    red: mat(0x7d2838, 0.9),
    red2: mat(0xa54755, 0.9),
    blue: mat(0x315f91, 0.72),
    blueDark: mat(0x173a62, 0.76),
    cream: mat(0xcab89e, 0.92),
    sheet: mat(0xffffff, 0.92, 0, TEX.sheet),
    metal: mat(0x747e82, 0.32, 0.52),
    fridge: mat(0x879296, 0.34, 0.35),
    black: mat(0x121212, 0.42),
    robot: mat(0x20262b, 0.42, 0.32),
    pug: mat(0xc0a27b, 0.91, 0, TEX.fur),
    pugLight: mat(0xd2b991, 0.93, 0, TEX.fur),
    pugShade: mat(0x8f6c4e, 0.92, 0, TEX.fur),
    pugDark: mat(0x29211e, 0.78),
    pugGrey: mat(0x6f665f, 0.88),
    eye: new THREE.MeshPhysicalMaterial({
      color: 0x2a160f,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
    nose: new THREE.MeshPhysicalMaterial({
      color: 0x090909,
      roughness: 0.18,
      metalness: 0,
      clearcoat: 0.82,
      clearcoatRoughness: 0.13,
    }),
    tongue: mat(0xc96879, 0.68),
    skin: mat(0xb98666, 0.9),
    pants: mat(0x34394a, 0.92),
    sweater: mat(0x356d69, 0.91),
    leaf: mat(0x335f35, 0.94),
    leaf2: mat(0x638a45, 0.94),
    path: mat(0x938673, 0.95),
    crumb: mat(0xf1b844, 0.7),
    nail: mat(0x302720, 0.65),
  };
  function mesh(geometry, material, x, y, z, parent, cast, receive) {
    var m = new THREE.Mesh(geometry, material);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = Boolean(cast);
    m.receiveShadow = Boolean(receive);
    (parent || scene).add(m);
    return m;
  }
  function box(w, h, d, material, x, y, z, parent, cast, receive) {
    return mesh(
      new THREE.BoxGeometry(w, h, d),
      material,
      x,
      y,
      z,
      parent,
      cast,
      receive,
    );
  }
  function sphere(rx, ry, rz, material, x, y, z, parent, segments) {
    var m = mesh(
      new THREE.SphereGeometry(
        1,
        segments || 16,
        Math.max(10, (segments || 16) - 4),
      ),
      material,
      x,
      y,
      z,
      parent,
      true,
      false,
    );
    m.scale.set(rx, ry, rz);
    return m;
  }
  function cylinder(rt, rb, h, material, x, y, z, parent, segments) {
    return mesh(
      new THREE.CylinderGeometry(rt, rb, h, segments || 12),
      material,
      x,
      y,
      z,
      parent,
      true,
      false,
    );
  }
  var colliders = [];
  function addCollider(minX, maxX, minZ, maxZ) {
    var c = { minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ };
    colliders.push(c);
    return c;
  }
  function removeCollider(c) {
    var i = colliders.indexOf(c);
    if (i >= 0) colliders.splice(i, 1);
  }
  function ensureCollider(c) {
    if (colliders.indexOf(c) < 0) colliders.push(c);
  }
  function wallX(x, z0, z1) {
    box(
      0.28,
      2.55,
      Math.abs(z1 - z0),
      M.wall,
      x,
      1.275,
      (z0 + z1) / 2,
      null,
      false,
      true,
    );
    box(
      0.34,
      0.13,
      Math.abs(z1 - z0),
      M.trim,
      x,
      0.065,
      (z0 + z1) / 2,
      null,
      false,
      true,
    );
    box(
      0.34,
      0.055,
      Math.abs(z1 - z0),
      M.trim,
      x,
      2.535,
      (z0 + z1) / 2,
      null,
      false,
      false,
    );
    return addCollider(x - 0.16, x + 0.16, Math.min(z0, z1), Math.max(z0, z1));
  }
  function wallZ(z, x0, x1) {
    box(
      Math.abs(x1 - x0),
      2.55,
      0.28,
      M.wall,
      (x0 + x1) / 2,
      1.275,
      z,
      null,
      false,
      true,
    );
    box(
      Math.abs(x1 - x0),
      0.13,
      0.34,
      M.trim,
      (x0 + x1) / 2,
      0.065,
      z,
      null,
      false,
      true,
    );
    box(
      Math.abs(x1 - x0),
      0.055,
      0.34,
      M.trim,
      (x0 + x1) / 2,
      2.535,
      z,
      null,
      false,
      false,
    );
    return addCollider(Math.min(x0, x1), Math.max(x0, x1), z - 0.16, z + 0.16);
  }
  function makeFloor() {
    var ground = mesh(new THREE.PlaneGeometry(90, 90), M.grass, 0, -0.025, 0);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    var apartment = mesh(new THREE.PlaneGeometry(20, 14), M.floor, 0, 0, 0);
    apartment.rotation.x = -Math.PI / 2;
    apartment.receiveShadow = true;
    var kitchen = mesh(
      new THREE.PlaneGeometry(6.8, 13.8),
      M.kitchenFloor,
      -6.5,
      0.008,
      0,
    );
    kitchen.rotation.x = -Math.PI / 2;
    kitchen.receiveShadow = true;
    var yard = mesh(new THREE.PlaneGeometry(9, 6.9), M.grass2, 6, 0.006, -10.5);
    yard.rotation.x = -Math.PI / 2;
    yard.receiveShadow = true;
    for (var k = 0; k < 34; k++) {
      var patch = mesh(
        new THREE.CircleGeometry(rand(0.07, 0.31), 8),
        Math.random() > 0.36 ? M.grass : M.earth,
        rand(1.8, 10.2),
        0.012,
        rand(-13.7, -7.2),
      );
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = rand(0, Math.PI);
      patch.receiveShadow = true;
    }
    for (var t = 0; t < 18; t++) {
      var tuft = new THREE.Group();
      tuft.position.set(rand(1.8, 10.2), 0.015, rand(-13.7, -7.2));
      scene.add(tuft);
      for (var b = 0; b < 3; b++) {
        var blade = mesh(
          new THREE.ConeGeometry(0.025, 0.18 + Math.random() * 0.12, 4),
          Math.random() > 0.45 ? M.leaf : M.leaf2,
          rand(-0.06, 0.06),
          0.08,
          rand(-0.06, 0.06),
          tuft,
        );
        blade.rotation.z = rand(-0.25, 0.25);
      }
    }
    var path = mesh(
      new THREE.PlaneGeometry(1.7, 1.7),
      M.path,
      5.8,
      0.015,
      -7.9,
    );
    path.rotation.x = -Math.PI / 2;
    path.receiveShadow = true;
  }

  makeFloor();
  wallX(-10, -7.15, 7.15);
  wallX(10, -7.15, 7.15);
  wallZ(7, -10.15, 10.15);
  wallZ(-7, -10.15, 5);
  wallZ(-7, 6.6, 10.15);
  wallX(-3, -7, -1.2);
  wallX(-3, 1.2, 7);
  wallX(4, -7, -5);
  wallX(4, -2.4, 2);
  wallX(4, 4.2, 7);
  wallZ(0, 3.84, 10.16);

  /* Windows and warm interior accents */
  [-1.4, 1.6].forEach(function (x) {
    var glow = mesh(
      new THREE.PlaneGeometry(1.65, 1.18),
      new THREE.MeshBasicMaterial({ color: 0x87a9a8 }),
      x,
      1.55,
      6.84,
    );
    glow.rotation.y = Math.PI;
    box(1.82, 0.08, 0.08, M.trim, x, 2.17, 6.85);
    box(1.82, 0.08, 0.08, M.trim, x, 0.9, 6.85);
    box(0.08, 1.35, 0.08, M.trim, x - 0.88, 1.54, 6.85);
    box(0.08, 1.35, 0.08, M.trim, x + 0.88, 1.54, 6.85);
  });

  /* Fence and yard */
  function fenceX(x, z0, z1) {
    box(
      0.14,
      1.06,
      Math.abs(z1 - z0),
      M.woodDark,
      x,
      0.53,
      (z0 + z1) / 2,
      null,
      true,
      false,
    );
    for (var i = 0; i < 7; i++)
      box(
        0.22,
        1.25,
        0.2,
        M.wood,
        x,
        0.62,
        z0 + ((z1 - z0) * i) / 6,
        null,
        true,
        false,
      );
    addCollider(x - 0.18, x + 0.18, Math.min(z0, z1), Math.max(z0, z1));
  }
  function fenceZ(z, x0, x1) {
    box(
      Math.abs(x1 - x0),
      1.06,
      0.14,
      M.woodDark,
      (x0 + x1) / 2,
      0.53,
      z,
      null,
      true,
      false,
    );
    for (var i = 0; i < 7; i++)
      box(
        0.2,
        1.25,
        0.22,
        M.wood,
        x0 + ((x1 - x0) * i) / 6,
        0.62,
        z,
        null,
        true,
        false,
      );
    addCollider(Math.min(x0, x1), Math.max(x0, x1), z - 0.18, z + 0.18);
  }
  fenceX(1.5, -14, -7.05);
  fenceX(10.5, -14, -7.05);
  fenceZ(-14, 1.5, 10.5);
  var treePos = { x: 8.8, z: -12.1 },
    benchPos = { x: 3.5, z: -12.6 };
  cylinder(0.15, 0.22, 1.35, M.woodDark, treePos.x, 0.675, treePos.z);
  [
    [0, 1.72, 0, 0.76],
    [0.43, 1.48, 0.18, 0.52],
    [-0.42, 1.5, -0.22, 0.55],
  ].forEach(function (p) {
    sphere(
      p[3],
      p[3] * 0.86,
      p[3],
      Math.random() > 0.5 ? M.leaf : M.leaf2,
      treePos.x + p[0],
      p[1],
      treePos.z + p[2],
      null,
      12,
    );
  });
  addCollider(
    treePos.x - 0.29,
    treePos.x + 0.29,
    treePos.z - 0.29,
    treePos.z + 0.29,
  );
  box(1.5, 0.09, 0.42, M.wood, benchPos.x, 0.43, benchPos.z, null, true, false);
  box(
    1.5,
    0.45,
    0.08,
    M.wood,
    benchPos.x,
    0.66,
    benchPos.z - 0.2,
    null,
    true,
    false,
  );
  box(
    0.09,
    0.44,
    0.35,
    M.woodDark,
    benchPos.x - 0.62,
    0.22,
    benchPos.z,
    null,
    true,
    false,
  );
  box(
    0.09,
    0.44,
    0.35,
    M.woodDark,
    benchPos.x + 0.62,
    0.22,
    benchPos.z,
    null,
    true,
    false,
  );
  addCollider(
    benchPos.x - 0.8,
    benchPos.x + 0.8,
    benchPos.z - 0.3,
    benchPos.z + 0.3,
  );

  /* Kitchen */
  box(0.78, 0.9, 5.6, M.cream, -9.55, 0.45, 3.85, null, true, true);
  box(0.88, 0.07, 5.7, M.wood, -9.5, 0.94, 3.85, null, true, false);
  box(0.82, 0.75, 3.25, M.cream, -9.52, 1.88, 5, null, true, false);
  box(0.9, 1.9, 0.92, M.fridge, -9.28, 0.95, -5.55, null, true, false);
  box(0.92, 0.045, 0.94, M.metal, -9.28, 1.22, -5.55);
  addCollider(-10, -9.08, 1.0, 6.8);
  addCollider(-9.8, -8.78, -6.08, -5.05);
  box(1.55, 0.09, 1.12, M.wood, -5.6, 0.76, 3.5, null, true, false);
  [
    [-0.65, -0.45],
    [0.65, -0.45],
    [-0.65, 0.45],
    [0.65, 0.45],
  ].forEach(function (o) {
    box(
      0.1,
      0.72,
      0.1,
      M.woodDark,
      -5.6 + o[0],
      0.36,
      3.5 + o[1],
      null,
      true,
      false,
    );
  });
  addCollider(-6.35, -4.85, 2.92, 4.08);
  function chair(x, z, yaw) {
    var g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = yaw;
    scene.add(g);
    box(0.52, 0.07, 0.52, M.woodDark, 0, 0.45, 0, g, true, false);
    box(0.52, 0.56, 0.07, M.woodDark, 0, 0.75, -0.23, g, true, false);
    [
      [-0.2, -0.2],
      [0.2, -0.2],
      [-0.2, 0.2],
      [0.2, 0.2],
    ].forEach(function (o) {
      box(0.065, 0.44, 0.065, M.woodDark, o[0], 0.22, o[1], g, true, false);
    });
    addCollider(x - 0.29, x + 0.29, z - 0.29, z + 0.29);
  }
  chair(-7, 3.5, Math.PI / 2);
  chair(-4.3, 3.5, -Math.PI / 2);
  chair(-5.6, 5, Math.PI);
  var bowl = cylinder(0.18, 0.13, 0.09, M.red, -4.05, 0.055, 6.28, null, 14);
  var water = cylinder(
    0.15,
    0.11,
    0.075,
    M.metal,
    -3.67,
    0.048,
    6.28,
    null,
    14,
  );

  /* Living room */
  var sofa = new THREE.Group();
  sofa.position.set(0.6, 0, -3.3);
  scene.add(sofa);
  box(2.7, 0.44, 1.02, M.sofa, 0, 0.22, 0, sofa, true, false);
  box(2.7, 0.58, 0.27, M.sofaDark, 0, 0.64, 0.42, sofa, true, false);
  box(0.27, 0.32, 1.02, M.sofaDark, -1.32, 0.56, 0, sofa, true, false);
  box(0.27, 0.32, 1.02, M.sofaDark, 1.32, 0.56, 0, sofa, true, false);
  box(1.08, 0.16, 0.78, M.gold, -0.6, 0.49, -0.03, sofa, true, false);
  box(1.08, 0.16, 0.78, M.red2, 0.6, 0.49, -0.03, sofa, true, false);
  sphere(0.42, 0.36, 0.14, M.red, -0.86, 0.68, 0.29, sofa, 12);
  sphere(0.42, 0.36, 0.14, M.cream, 0.86, 0.68, 0.29, sofa, 12);
  addCollider(-0.8, 2, -3.95, -2.68);
  var rug = mesh(new THREE.CircleGeometry(1.55, 30), M.gold, 0.6, 0.013, -1.45);
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  box(1.9, 0.44, 0.48, M.woodDark, 0.6, 0.22, -6.58, null, true, false);
  box(1.65, 0.96, 0.1, M.black, 0.6, 1.34, -6.78, null, true, false);
  var tvScreen = mesh(
    new THREE.PlaneGeometry(1.48, 0.82),
    new THREE.MeshBasicMaterial({ color: 0x2f5a5e }),
    0.6,
    1.34,
    -6.72,
  );
  addCollider(-0.38, 1.58, -6.95, -6.3);
  cylinder(0.23, 0.18, 0.35, M.red, 3.4, 0.18, -6.2);
  cylinder(0.05, 0.065, 0.55, M.woodDark, 3.4, 0.58, -6.2);
  [
    [0, 0.98, 0, 0.32],
    [0.17, 1.18, 0.1, 0.24],
    [-0.16, 1.19, -0.08, 0.23],
  ].forEach(function (p) {
    sphere(
      p[3],
      p[3] * 0.8,
      p[3],
      M.leaf,
      3.4 + p[0],
      p[1],
      -6.2 + p[2],
      null,
      10,
    );
  });
  addCollider(3.08, 3.72, -6.52, -5.88);

  /* Hall */
  var hallRug = box(1.35, 0.025, 0.82, M.red2, 5.8, 0.018, -6.08);
  [
    [5, -6.34, 0.25],
    [5.34, -6.4, -0.25],
    [5.7, -6.3, 0.55],
  ].forEach(function (s) {
    var shoe = box(0.13, 0.1, 0.31, M.woodDark, s[0], 0.05, s[1]);
    shoe.rotation.y = s[2];
  });
  box(0.54, 0.04, 0.92, M.woodDark, 9.58, 1.1, -4.3);
  box(0.06, 0.13, 0.06, M.metal, 9.48, 1.22, -4.3);

  /* Bedroom */
  var bedTop = 0.63,
    bedCX = 7.3,
    bedCZ = 4.3,
    crumples = new THREE.Group();
  scene.add(crumples);
  box(2.55, 0.34, 3.14, M.woodDark, bedCX, 0.17, bedCZ, null, true, false);
  box(2.38, 0.28, 2.98, M.cream, bedCX, 0.46, bedCZ, null, true, true);
  var sheet = box(
    2.34,
    0.055,
    2.92,
    M.sheet,
    bedCX,
    0.63,
    bedCZ,
    null,
    false,
    true,
  );
  sphere(0.62, 0.18, 0.42, M.cream, bedCX - 0.58, 0.73, 5.42, null, 14);
  sphere(0.62, 0.18, 0.42, M.cream, bedCX + 0.58, 0.73, 5.42, null, 14);
  box(2.55, 0.98, 0.15, M.woodDark, bedCX, 0.75, 5.92, null, true, false);
  box(0.58, 0.52, 0.58, M.wood, 5.55, 0.26, 5.5, null, true, false);
  var bedRug = mesh(
    new THREE.CircleGeometry(0.95, 24),
    M.blue,
    7.3,
    0.014,
    2.1,
  );
  bedRug.rotation.x = -Math.PI / 2;
  addCollider(6, 8.6, 2.7, 5.96);
  addCollider(5.2, 5.9, 5.15, 5.85);
  for (var ci = 0; ci < 10; ci++) {
    var c = box(
      rand(0.22, 0.52),
      0.06,
      rand(0.18, 0.44),
      M.sheet,
      bedCX + rand(-0.95, 0.95),
      0.66,
      bedCZ + rand(-1.1, 1.1),
      crumples,
    );
    c.rotation.y = rand(-0.8, 0.8);
    c.rotation.z = rand(-0.13, 0.13);
    c.visible = false;
  }

  /* Dog bed and props */
  var dogBed = new THREE.Group();
  dogBed.position.set(2.5, 0, 5.5);
  scene.add(dogBed);
  var bedBase = sphere(0.72, 0.14, 0.52, M.blue, 0, 0.13, 0, dogBed, 16);
  var bedInner = sphere(0.56, 0.1, 0.39, M.blueDark, 0, 0.22, 0, dogBed, 16);
  addCollider(1.78, 3.22, 4.98, 6.02);
  var ball = sphere(0.09, 0.09, 0.09, M.red, -1.9, 0.09, -0.7, null, 12);
  box(0.28, 0.05, 0.18, M.gold, 1.16, 0.48, -6.54);
  box(0.2, 0.045, 0.15, M.blue, 1.12, 0.52, -6.54);

  /* Premium low-poly interior details */
  (function addInteriorDetails() {
    function frame(x, y, z, w, h, color, wall) {
      var g = new THREE.Group();
      g.position.set(x, y, z);
      scene.add(g);
      var border = box(w, h, 0.045, M.woodDark, 0, 0, 0, g, true, false);
      var art = mesh(
        new THREE.PlaneGeometry(w - 0.12, h - 0.12),
        new THREE.MeshBasicMaterial({ color: color }),
        0,
        0,
        wall === "z" ? 0.028 : 0.028,
        g,
      );
      art.position.z = 0.028;
      return g;
    }
    var art1 = frame(-2.98, 1.65, 3.45, 0.78, 0.62, 0x315f62);
    art1.rotation.y = Math.PI / 2;
    var art2 = frame(4.02, 1.7, -3.55, 0.64, 0.82, 0x9d4f45);
    art2.rotation.y = -Math.PI / 2;
    box(1.35, 0.055, 0.28, M.woodDark, -0.4, 1.25, -6.62, null, true, false);
    for (var i = 0; i < 6; i++)
      box(
        0.11 + Math.random() * 0.05,
        0.34 + Math.random() * 0.14,
        0.22,
        [M.red, M.blue, M.gold, M.cream][i % 4],
        -1 + i * 0.25,
        1.45,
        -6.62,
        null,
        true,
        false,
      );
    var lampBase = cylinder(
      0.18,
      0.22,
      0.12,
      M.metal,
      2.65,
      0.07,
      -5.75,
      null,
      16,
    );
    lampBase.castShadow = true;
    cylinder(0.035, 0.045, 1.08, M.metal, 2.65, 0.64, -5.75, null, 10);
    var shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.38, 18, 1, true),
      M.gold,
    );
    shade.position.set(2.65, 1.25, -5.75);
    shade.rotation.x = Math.PI;
    shade.castShadow = true;
    scene.add(shade);
    var lampGlow = new THREE.PointLight(0xffb05c, 0.18, 5, 2);
    lampGlow.position.set(2.65, 1.18, -5.75);
    scene.add(lampGlow);
    for (var c = 0; c < 5; c++)
      box(
        0.17,
        0.06,
        0.17,
        M.metal,
        -9.38,
        1.0,
        1.5 + c * 0.66,
        null,
        true,
        false,
      );
    var curtainMat = mat(0x8b3b48, 0.96);
    [-1.4, 1.6].forEach(function (x) {
      box(
        0.08,
        1.42,
        0.04,
        curtainMat,
        x - 0.96,
        1.52,
        6.72,
        null,
        false,
        false,
      );
      box(
        0.08,
        1.42,
        0.04,
        curtainMat,
        x + 0.96,
        1.52,
        6.72,
        null,
        false,
        false,
      );
    });
    var toy = new THREE.Group();
    toy.position.set(-1.65, 0.09, -0.35);
    scene.add(toy);
    cylinder(0.055, 0.055, 0.42, M.red, 0, 0, 0, toy, 10).rotation.z =
      Math.PI / 2;
    sphere(0.09, 0.09, 0.09, M.gold, -0.22, 0, 0, toy, 10);
    sphere(0.09, 0.09, 0.09, M.gold, 0.22, 0, 0, toy, 10);
    var foodMat = mat(0x9b5b2c, 0.82);
    for (var f = 0; f < 7; f++)
      sphere(
        0.025,
        0.018,
        0.025,
        foodMat,
        -4.05 + rand(-0.1, 0.1),
        0.105,
        6.28 + rand(-0.1, 0.1),
        null,
        7,
      );
  })();

  /* Doors */
  function makeDoor(hingeX, hingeZ, axis, width) {
    var g = new THREE.Group();
    g.position.set(hingeX, 0, hingeZ);
    scene.add(g);
    if (axis === "x")
      box(width, 2.18, 0.13, M.wood, width / 2, 1.09, 0, g, true, false);
    else box(0.13, 2.18, width, M.wood, 0, 1.09, width / 2, g, true, false);
    return g;
  }
  var frontDoor = makeDoor(5, -7, "x", 1.6),
    bedroomDoor = makeDoor(4, 2, "z", 2.2);
  var frontDoorCollider = addCollider(4.93, 6.67, -7.23, -6.77),
    bedroomDoorCollider = addCollider(3.77, 4.23, 1.93, 4.27);
  var doors = {
    front: { value: 0, target: 0, group: frontDoor },
    bedroom: { value: 0, target: 0, group: bedroomDoor },
  };

  /* Matvey */
  var pugRoot = new THREE.Group();
  scene.add(pugRoot);
  var proceduralPug = new THREE.Group();
  pugRoot.add(proceduralPug);
  var P = {};
  (function buildPug() {
    /* Heavy compact body: multiple overlapping volumes avoid the “worm” silhouette. */
    P.body = sphere(
      0.43,
      0.305,
      0.46,
      M.pug,
      0,
      0.32,
      -0.035,
      proceduralPug,
      24,
    );
    P.chest = sphere(
      0.39,
      0.34,
      0.29,
      M.pugLight,
      0,
      0.34,
      0.235,
      proceduralPug,
      22,
    );
    P.rear = sphere(0.405, 0.32, 0.32, M.pug, 0, 0.33, -0.3, proceduralPug, 22);
    P.belly = sphere(
      0.34,
      0.205,
      0.37,
      M.pugLight,
      0,
      0.18,
      -0.015,
      proceduralPug,
      20,
    );
    P.shoulderL = sphere(
      0.19,
      0.245,
      0.23,
      M.pugLight,
      0.205,
      0.31,
      0.18,
      proceduralPug,
      18,
    );
    P.shoulderR = sphere(
      0.19,
      0.245,
      0.23,
      M.pugLight,
      -0.205,
      0.31,
      0.18,
      proceduralPug,
      18,
    );
    P.haunchL = sphere(
      0.205,
      0.25,
      0.245,
      M.pug,
      0.205,
      0.3,
      -0.27,
      proceduralPug,
      18,
    );
    P.haunchR = sphere(
      0.205,
      0.25,
      0.245,
      M.pug,
      -0.205,
      0.3,
      -0.27,
      proceduralPug,
      18,
    );
    P.stripe = sphere(
      0.105,
      0.038,
      0.39,
      M.pugShade,
      0,
      0.565,
      -0.08,
      proceduralPug,
      16,
    );
    P.stripe.rotation.x = 0.07;
    P.backFold = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.026, 8, 26, Math.PI * 1.45),
      M.pugShade,
    );
    P.backFold.position.set(0, 0.53, -0.24);
    P.backFold.rotation.set(Math.PI / 2, 0.18, 0.78);
    proceduralPug.add(P.backFold);
    P.neckFold1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.245, 0.046, 10, 28),
      M.pugShade,
    );
    P.neckFold1.position.set(0, 0.49, 0.18);
    P.neckFold1.rotation.x = Math.PI / 2 - 0.25;
    proceduralPug.add(P.neckFold1);
    P.neckFold2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.224, 0.034, 9, 26),
      M.pugLight,
    );
    P.neckFold2.position.set(0, 0.525, 0.225);
    P.neckFold2.rotation.x = Math.PI / 2 - 0.25;
    proceduralPug.add(P.neckFold2);
    P.dewlap = sphere(
      0.22,
      0.115,
      0.12,
      M.pugGrey,
      0,
      0.41,
      0.34,
      proceduralPug,
      18,
    );

    P.head = new THREE.Group();
    P.head.position.set(0, 0.625, 0.37);
    proceduralPug.add(P.head);
    P.skull = sphere(0.265, 0.235, 0.205, M.pug, 0, 0, 0, P.head, 26);
    P.forehead = sphere(
      0.205,
      0.15,
      0.125,
      M.pugLight,
      0,
      0.065,
      0.075,
      P.head,
      22,
    );
    P.foreheadStripe = sphere(
      0.06,
      0.135,
      0.04,
      M.pugShade,
      0.006,
      0.075,
      0.17,
      P.head,
      16,
    );
    P.cheeks = [];
    [-1, 1].forEach(function (side) {
      P.cheeks.push(
        sphere(
          0.125,
          0.105,
          0.105,
          M.pug,
          side * 0.12,
          -0.055,
          0.075,
          P.head,
          18,
        ),
      );
    });
    P.mask = sphere(0.185, 0.145, 0.12, M.pugDark, 0, -0.045, 0.12, P.head, 20);
    P.eyeRings = [];
    P.eyes = [];
    P.brows = [];
    [-1, 1].forEach(function (side, index) {
      var ring = sphere(
        0.082,
        0.086,
        0.06,
        M.pugDark,
        side * (index === 0 ? 0.117 : 0.113),
        0.025,
        0.147,
        P.head,
        20,
      );
      P.eyeRings.push(ring);
      var e = sphere(
        index === 0 ? 0.068 : 0.065,
        index === 0 ? 0.073 : 0.069,
        0.061,
        M.eye,
        side * (index === 0 ? 0.119 : 0.115),
        0.025,
        0.175,
        P.head,
        20,
      );
      sphere(
        0.019,
        0.02,
        0.008,
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
        side * 0.014,
        0.021,
        0.058,
        e,
        9,
      ).castShadow = false;
      sphere(
        0.008,
        0.008,
        0.004,
        new THREE.MeshBasicMaterial({ color: 0xd8f2ff }),
        -side * 0.018,
        -0.016,
        0.06,
        e,
        7,
      ).castShadow = false;
      P.eyes.push(e);
      var brow = sphere(
        0.064,
        0.021,
        0.034,
        M.pugShade,
        side * 0.112,
        0.125,
        0.145,
        P.head,
        14,
      );
      brow.rotation.z = -side * (index === 0 ? 0.26 : 0.18);
      P.brows.push(brow);
    });
    P.noseBridge = sphere(
      0.07,
      0.075,
      0.052,
      M.pugDark,
      0,
      0.035,
      0.178,
      P.head,
      16,
    );
    P.muzzles = [];
    [-1, 1].forEach(function (side) {
      P.muzzles.push(
        sphere(
          0.087,
          0.068,
          0.08,
          M.pugDark,
          side * 0.061,
          -0.09,
          0.178,
          P.head,
          16,
        ),
      );
    });
    P.muzzleGreyL = sphere(
      0.052,
      0.025,
      0.055,
      M.pugGrey,
      -0.051,
      -0.108,
      0.218,
      P.head,
      13,
    );
    P.muzzleGreyR = sphere(
      0.05,
      0.023,
      0.052,
      M.pugGrey,
      0.052,
      -0.11,
      0.216,
      P.head,
      13,
    );
    P.chin = sphere(
      0.104,
      0.052,
      0.075,
      M.pugGrey,
      0,
      -0.15,
      0.145,
      P.head,
      16,
    );
    P.jaw = new THREE.Group();
    P.jaw.position.set(0, -0.132, 0.175);
    P.head.add(P.jaw);
    P.lowerLip = sphere(0.082, 0.024, 0.048, M.pugDark, 0, 0, 0, P.jaw, 14);
    P.nose = sphere(0.056, 0.043, 0.041, M.nose, 0, -0.048, 0.235, P.head, 16);
    P.nostrilL = sphere(
      0.012,
      0.009,
      0.008,
      M.black,
      -0.021,
      -0.046,
      0.27,
      P.head,
      8,
    );
    P.nostrilR = sphere(
      0.012,
      0.009,
      0.008,
      M.black,
      0.021,
      -0.046,
      0.27,
      P.head,
      8,
    );
    P.ears = [];
    [-1, 1].forEach(function (side) {
      var ear = sphere(
        0.075,
        0.105,
        0.047,
        M.pugDark,
        side * 0.195,
        0.135,
        -0.022,
        P.head,
        16,
      );
      ear.rotation.set(0.52, side * 0.06, -side * 0.5);
      P.ears.push(ear);
    });
    for (var f = 0; f < 4; f++) {
      var fold = new THREE.Mesh(
        new THREE.TorusGeometry(
          0.112 - f * 0.021,
          0.009,
          7,
          18,
          Math.PI * 0.86,
        ),
        M.pugShade,
      );
      fold.position.set(f === 0 ? 0.008 : 0, 0.155 - f * 0.031, 0.132);
      fold.rotation.x = -0.53;
      fold.rotation.z = 0.22 + (f % 2) * 0.035;
      P.head.add(fold);
    }
    P.tongue = sphere(
      0.037,
      0.015,
      0.057,
      M.tongue,
      0,
      -0.154,
      0.205,
      P.head,
      11,
    );
    P.tongue.visible = false;
    P.whiskerDots = [];
    [-1, 1].forEach(function (side) {
      for (var w = 0; w < 3; w++) {
        var dot = sphere(
          0.006,
          0.005,
          0.004,
          M.black,
          side * (0.052 + w * 0.014),
          -0.095 - w * 0.014,
          0.248,
          P.head,
          6,
        );
        dot.castShadow = false;
        P.whiskerDots.push(dot);
      }
    });

    function leg(x, z, front) {
      var g = new THREE.Group();
      g.position.set(x, 0.3, z);
      proceduralPug.add(g);
      cylinder(0.073, 0.082, front ? 0.195 : 0.185, M.pug, 0, -0.09, 0, g, 13);
      sphere(0.087, 0.058, 0.108, M.pugShade, 0, -0.205, 0.033, g, 14);
      for (var toe = -1; toe <= 1; toe++) {
        sphere(
          0.027,
          0.022,
          0.038,
          M.pugShade,
          toe * 0.036,
          -0.232,
          0.09,
          g,
          9,
        );
        var nail = sphere(
          0.009,
          0.009,
          0.016,
          M.nail,
          toe * 0.036,
          -0.238,
          0.126,
          g,
          7,
        );
        nail.castShadow = false;
      }
      return g;
    }
    P.legFL = leg(0.19, 0.225, true);
    P.legFR = leg(-0.19, 0.225, true);
    P.legRL = leg(0.205, -0.29, false);
    P.legRR = leg(-0.205, -0.29, false);
    P.tailGroup = new THREE.Group();
    P.tailGroup.position.set(0, 0.535, -0.49);
    proceduralPug.add(P.tailGroup);
    P.tailOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.086, 0.043, 10, 22, Math.PI * 1.88),
      M.pug,
    );
    P.tailOuter.rotation.x = Math.PI / 2;
    P.tailOuter.rotation.z = 0.42;
    P.tailGroup.add(P.tailOuter);
    P.tailInner = new THREE.Mesh(
      new THREE.TorusGeometry(0.043, 0.023, 9, 18, Math.PI * 1.65),
      M.pugLight,
    );
    P.tailInner.rotation.x = Math.PI / 2;
    P.tailInner.rotation.z = -0.32;
    P.tailInner.position.set(0.018, 0.025, 0.012);
    P.tailGroup.add(P.tailInner);

    P.harness = new THREE.Group();
    proceduralPug.add(P.harness);
    var neck = new THREE.Mesh(
      new THREE.TorusGeometry(0.235, 0.022, 9, 28),
      M.blue,
    );
    neck.position.set(0, 0.505, 0.225);
    neck.rotation.x = Math.PI / 2 - 0.25;
    P.harness.add(neck);
    var chestRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.027, 9, 28),
      M.blue,
    );
    chestRing.position.set(0, 0.345, 0.035);
    chestRing.scale.z = 0.79;
    chestRing.rotation.x = Math.PI / 2;
    P.harness.add(chestRing);
    box(0.058, 0.315, 0.045, M.blue, 0, 0.325, 0.34, P.harness, true, false);
    box(0.068, 0.048, 0.19, M.blueDark, 0, 0.58, 0.015, P.harness, true, false);
    box(0.075, 0.052, 0.028, M.metal, 0, 0.34, 0.37, P.harness, true, false);
    P.leashCarry = new THREE.Group();
    P.leashCarry.position.set(0, -0.205, 0.3);
    P.head.add(P.leashCarry);
    var loop = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.02, 8, 18),
      M.red,
    );
    loop.rotation.x = 0.55;
    P.leashCarry.add(loop);
    box(
      0.035,
      0.23,
      0.035,
      M.red,
      0,
      -0.14,
      0.05,
      P.leashCarry,
      true,
      false,
    ).rotation.x = 0.4;
    P.leashCarry.visible = false;
  })();
  var shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  var shadowCtx = shadowCanvas.getContext("2d");
  var shadowGrad = shadowCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  shadowGrad.addColorStop(0, "rgba(0,0,0,.48)");
  shadowGrad.addColorStop(0.55, "rgba(0,0,0,.22)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
  shadowCtx.fillStyle = shadowGrad;
  shadowCtx.fillRect(0, 0, 128, 128);
  var shadowTex = new THREE.CanvasTexture(shadowCanvas);
  var pugShadow = mesh(
    new THREE.PlaneGeometry(1.15, 0.9),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    }),
    0,
    0.012,
    -0.02,
    pugRoot,
  );
  pugShadow.rotation.x = -Math.PI / 2;
  pugShadow.renderOrder = 1;
  var pugBase = {
    bodyScale: P.body.scale.clone(),
    chestScale: P.chest.scale.clone(),
    rearScale: P.rear.scale.clone(),
    bellyScale: P.belly.scale.clone(),
    noseScale: P.nose.scale.clone(),
    eyeScales: P.eyes.map(function (e) {
      return e.scale.clone();
    }),
    bodyPos: P.body.position.clone(),
    chestPos: P.chest.position.clone(),
    rearPos: P.rear.position.clone(),
    bellyPos: P.belly.position.clone(),
    shoulderL: P.shoulderL.position.clone(),
    shoulderR: P.shoulderR.position.clone(),
    haunchL: P.haunchL.position.clone(),
    haunchR: P.haunchR.position.clone(),
  };
  var pug = {
    pos: new THREE.Vector3(0.6, 0, -1.4),
    vel: new THREE.Vector3(),
    yaw: -Math.PI / 2,
    state: "lie",
    stateT: 0,
    phase: 0,
    move: 0,
    groundY: 0,
    visualY: 0,
    onBed: false,
    forcedYaw: null,
    blinkT: 2,
    blink: 0.0,
    lookT: 3,
    lookTarget: 0,
    look: 0,
    lickT: 5,
    lick: 0,
    jolt: 0,
    digClock: 0,
    settle: 0,
  };
  var glb = {
    active: false,
    model: null,
    mixer: null,
    actions: {},
    current: null,
  };
  function tryLoadGlb() {
    if (!THREE.GLTFLoader) return;
    try {
      new THREE.GLTFLoader().load(
        "assets/matvey.glb",
        function (gltf) {
          if (!gltf.scene || !gltf.animations || gltf.animations.length < 2)
            return;
          var actions = {},
            mixer = new THREE.AnimationMixer(gltf.scene);
          gltf.animations.forEach(function (clip) {
            var n = (clip.name || "").toLowerCase(),
              key = "";
            if (/run/.test(n)) key = "run";
            else if (/walk/.test(n)) key = "walk";
            else if (/sit/.test(n)) key = "sit";
            else if (/sniff/.test(n)) key = "sniff";
            else if (/dig/.test(n)) key = "dig";
            else if (/sleep|lie/.test(n)) key = "sleep";
            else if (/idle|stand/.test(n)) key = "idle";
            if (key && !actions[key]) actions[key] = mixer.clipAction(clip);
          });
          if (!actions.idle || (!actions.walk && !actions.run)) return;
          var box3 = new THREE.Box3().setFromObject(gltf.scene),
            size = new THREE.Vector3();
          box3.getSize(size);
          if (!size.y || size.y / Math.max(size.x, size.z) < 0.55) return;
          var scale = 0.7 / size.y;
          gltf.scene.scale.setScalar(scale);
          var corrected = new THREE.Box3().setFromObject(gltf.scene);
          gltf.scene.position.y -= corrected.min.y;
          gltf.scene.traverse(function (o) {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              o.frustumCulled = true;
            }
          });
          pugRoot.add(gltf.scene);
          glb.active = true;
          glb.model = gltf.scene;
          glb.mixer = mixer;
          glb.actions = actions;
          proceduralPug.visible = false;
        },
        undefined,
        function () {},
      );
    } catch (error) {}
  }

  function setPugState(state) {
    if (pug.state !== state) {
      pug.state = state;
      pug.stateT = 0;
    }
  }
  function glbAnimationKey() {
    if (pug.state === "walk") return pug.move > 0.72 ? "run" : "walk";
    if (pug.state === "beg" || pug.state === "sit") return "sit";
    if (pug.state === "sniff") return "sniff";
    if (pug.state === "dig" || pug.state === "scratch") return "dig";
    if (pug.state === "sleep" || pug.state === "lie") return "sleep";
    return "idle";
  }
  function animatePug(dt) {
    pug.stateT += dt;
    if (glb.active) {
      var action = glb.actions[glbAnimationKey()] || glb.actions.idle;
      if (action && action !== glb.current) {
        if (glb.current) glb.current.fadeOut(0.22);
        action.reset().fadeIn(0.22).play();
        glb.current = action;
      }
      if (glb.mixer) glb.mixer.update(dt);
      return;
    }
    var t = pug.stateT,
      st = pug.state,
      phase = pug.phase;
    proceduralPug.position.set(0, 0, 0);
    proceduralPug.rotation.set(0, 0, 0);
    proceduralPug.scale.set(1, 1, 1);
    P.body.position.copy(pugBase.bodyPos);
    P.chest.position.copy(pugBase.chestPos);
    P.rear.position.copy(pugBase.rearPos);
    P.belly.position.copy(pugBase.bellyPos);
    P.shoulderL.position.copy(pugBase.shoulderL);
    P.shoulderR.position.copy(pugBase.shoulderR);
    P.haunchL.position.copy(pugBase.haunchL);
    P.haunchR.position.copy(pugBase.haunchR);
    P.body.scale.copy(pugBase.bodyScale);
    P.chest.scale.copy(pugBase.chestScale);
    P.rear.scale.copy(pugBase.rearScale);
    P.belly.scale.copy(pugBase.bellyScale);
    P.nose.scale.copy(pugBase.noseScale);
    P.body.rotation.set(0, 0, 0);
    P.chest.rotation.set(0, 0, 0);
    P.rear.rotation.set(0, 0, 0);
    P.shoulderL.rotation.set(0, 0, 0);
    P.shoulderR.rotation.set(0, 0, 0);
    P.head.position.set(0, 0.625, 0.37);
    P.head.rotation.set(0, 0, 0);
    P.jaw.rotation.x = 0;
    P.jaw.position.set(0, -0.132, 0.175);
    [P.legFL, P.legFR, P.legRL, P.legRR].forEach(function (l) {
      l.rotation.set(0, 0, 0);
      l.scale.set(1, 1, 1);
    });
    P.tongue.visible = false;
    P.tongue.position.set(0, -0.154, 0.205);
    P.eyes.forEach(function (e, index) {
      e.scale.copy(pugBase.eyeScales[index]);
    });
    P.brows[0].rotation.z = 0.26;
    P.brows[1].rotation.z = -0.18;
    P.ears[0].rotation.set(0.52, -0.06, -0.5);
    P.ears[1].rotation.set(0.52, 0.06, 0.5);
    P.tailGroup.rotation.set(0, 0, 0);
    pugShadow.scale.set(1, 1, 1);
    pugShadow.material.opacity = 0.46;
    var talking = voiceState.speaking && nowMs() < voiceState.until;
    if (talking) {
      var mouth = Math.max(0, Math.sin(nowMs() * 0.019));
      P.jaw.rotation.x = -mouth * 0.31;
      P.jaw.position.y = -0.132 - mouth * 0.009;
      P.head.rotation.y = Math.sin(t * 1.35) * 0.075;
      P.head.rotation.x = -0.035;
      P.brows[0].rotation.z = 0.34 + mouth * 0.05;
      P.brows[1].rotation.z = -0.24 - mouth * 0.04;
    }
    pug.blinkT -= dt;
    if (pug.blinkT <= 0) {
      pug.blink = 0.14;
      pug.blinkT = rand(2.2, 5.2);
    }
    if (pug.blink > 0) {
      pug.blink -= dt;
      P.eyes.forEach(function (e, index) {
        e.scale.y = pugBase.eyeScales[index].y * 0.12;
      });
    }
    var run = clamp((pug.move - 0.62) / 0.38, 0, 1),
      moving = st === "walk" ? clamp(pug.move, 0.16, 1) : 0;
    pug.settle = lerp(pug.settle, moving, clamp(dt * 6, 0, 1));
    if (st === "walk" || st === "idle") {
      var amp = lerp(0.48, 0.67, run) * moving,
        step = Math.sin(phase),
        step2 = Math.sin(phase + Math.PI);
      P.legFL.rotation.x = step * amp;
      P.legRR.rotation.x = step * amp;
      P.legFR.rotation.x = step2 * amp;
      P.legRL.rotation.x = step2 * amp;
      proceduralPug.position.y =
        Math.abs(step) * lerp(0.018, 0.036, run) * moving;
      proceduralPug.rotation.z = step * lerp(0.055, 0.105, run) * moving;
      P.rear.position.x = step * 0.032 * moving;
      P.rear.rotation.z = step * 0.065 * moving;
      P.body.rotation.z = step * 0.035 * moving;
      P.chest.rotation.z = -step * 0.026 * moving;
      P.haunchL.position.y =
        pugBase.haunchL.y + Math.max(0, step) * 0.012 * moving;
      P.haunchR.position.y =
        pugBase.haunchR.y + Math.max(0, -step) * 0.012 * moving;
      P.ears[0].rotation.x =
        0.52 + Math.abs(step) * lerp(0.025, 0.18, run) * moving;
      P.ears[1].rotation.x =
        0.52 + Math.abs(step2) * lerp(0.025, 0.18, run) * moving;
      pug.lookT -= dt;
      if (pug.lookT <= 0) {
        pug.lookTarget = rand(-0.5, 0.5);
        pug.lookT = rand(2.6, 5.6);
      }
      pug.look = lerp(pug.look, pug.lookTarget, dt * 2.4);
      if (!talking) {
        P.head.rotation.y = pug.look;
        P.head.rotation.z =
          -step * 0.026 * moving + Math.sin(t * 0.7) * 0.015 * (1 - moving);
      }
      pug.lickT -= dt;
      if (pug.lickT <= 0) {
        pug.lick = 0.68;
        pug.lickT = rand(8, 15);
      }
      if (pug.lick > 0 || run > 0.82) {
        pug.lick -= dt;
        P.tongue.visible = true;
        P.tongue.position.y = -0.154 + Math.sin(t * 11) * 0.008;
        P.jaw.rotation.x = Math.min(P.jaw.rotation.x, -0.12 - run * 0.08);
      }
      var breathe = 1 + Math.sin(t * (run ? 3.2 : 1.75)) * 0.014;
      P.body.scale.y = pugBase.bodyScale.y * breathe;
      P.chest.scale.y = pugBase.chestScale.y * (1 + (breathe - 1) * 1.2);
      P.belly.scale.y = pugBase.bellyScale.y * (1 + (breathe - 1) * 1.35);
      if (st === "idle" && !talking) {
        proceduralPug.position.x = Math.sin(t * 0.65) * 0.006;
        P.head.rotation.x = Math.sin(t * 0.82) * 0.018;
        P.head.rotation.z += Math.sin(t * 0.43) * 0.025;
      }
    } else if (st === "sit" || st === "beg") {
      proceduralPug.rotation.x = -0.31;
      proceduralPug.position.y = 0.045;
      P.rear.position.y = 0.27;
      P.belly.position.y = 0.16;
      P.legRL.scale.y = 0.42;
      P.legRR.scale.y = 0.42;
      P.legRL.rotation.x = -0.82;
      P.legRR.rotation.x = -0.82;
      P.legFL.scale.y = 1.35;
      P.legFR.scale.y = 1.35;
      P.head.rotation.x = st === "beg" ? -0.07 : 0.22;
      P.head.position.y = 0.635;
      pugShadow.scale.set(1.08, 0.92, 1);
      pugShadow.material.opacity = 0.5;
      if (st === "beg") {
        P.legFR.rotation.x = -1.18 + Math.sin(t * 6) * 0.07;
        P.head.rotation.z = Math.sin(t * 1.4) * 0.07;
        P.eyes.forEach(function (e, index) {
          e.scale.copy(pugBase.eyeScales[index]).multiplyScalar(1.075);
        });
      }
    } else if (st === "sniff") {
      proceduralPug.position.y = -0.025;
      P.head.position.set(0, 0.5, 0.44);
      P.head.rotation.x = 0.56;
      var nosePulse = 1 + Math.sin(t * 20) * 0.12;
      P.nose.scale.copy(pugBase.noseScale).multiplyScalar(nosePulse);
      proceduralPug.rotation.z = Math.sin(t * 5) * 0.018;
      P.shoulderL.rotation.x = 0.08;
      P.shoulderR.rotation.x = 0.08;
    } else if (st === "dig") {
      proceduralPug.position.y = -0.035;
      proceduralPug.rotation.x = 0.08;
      P.head.position.y = 0.51;
      P.head.rotation.x = 0.43;
      P.legFL.rotation.x = -0.32 + Math.sin(t * 17) * 0.82;
      P.legFR.rotation.x = -0.32 + Math.sin(t * 17 + Math.PI) * 0.82;
      P.chest.rotation.z = Math.sin(t * 17) * 0.045;
      P.body.position.z = pugBase.bodyPos.z + Math.sin(t * 8) * 0.009;
      pugShadow.scale.set(0.98, 0.86, 1);
    } else if (st === "spin") {
      P.legFL.rotation.x = Math.sin(t * 10) * 0.54;
      P.legRR.rotation.x = Math.sin(t * 10) * 0.54;
      P.legFR.rotation.x = Math.sin(t * 10 + Math.PI) * 0.54;
      P.legRL.rotation.x = Math.sin(t * 10 + Math.PI) * 0.54;
      proceduralPug.position.y = Math.abs(Math.sin(t * 10)) * 0.022;
    } else if (st === "scratch") {
      proceduralPug.rotation.x = 0.11;
      P.head.rotation.x = -0.25;
      P.legFL.rotation.x = -0.43 + Math.sin(t * 14) * 0.46;
      P.legFR.rotation.x = -0.28 + Math.sin(t * 14 + 1.7) * 0.35;
    } else if (st === "lie" || st === "sleep") {
      proceduralPug.position.y = -0.2;
      P.body.rotation.x = 0.04;
      P.legFL.scale.y = 0.28;
      P.legFR.scale.y = 0.28;
      P.legRL.scale.y = 0.28;
      P.legRR.scale.y = 0.28;
      P.legFL.rotation.x = -0.9;
      P.legFR.rotation.x = -0.9;
      P.legRL.rotation.x = 0.7;
      P.legRR.rotation.x = 0.7;
      P.head.position.set(0, 0.47, 0.45);
      P.head.rotation.x = 0.25;
      var breath =
        1 +
        Math.sin(t * (st === "sleep" ? 1.03 : 1.65)) *
          (st === "sleep" ? 0.03 : 0.016);
      P.body.scale.y = pugBase.bodyScale.y * breath;
      P.belly.scale.y = pugBase.bellyScale.y * (1 + (breath - 1) * 1.5);
      P.chest.scale.y = pugBase.chestScale.y * (1 + (breath - 1) * 1.25);
      pugShadow.scale.set(1.16, 0.84, 1);
      pugShadow.material.opacity = 0.52;
      if (st === "sleep") {
        P.eyes.forEach(function (e, index) {
          e.scale.y = pugBase.eyeScales[index].y * 0.055;
        });
        if (pug.jolt > 0) {
          pug.jolt -= dt * 2;
          P.head.rotation.x += Math.sin(t * 24) * 0.055 * pug.jolt;
          P.legRL.rotation.x += Math.sin(t * 30) * 0.08 * pug.jolt;
        }
      }
    } else if (st === "hop" || st === "jump") {
      P.legFL.rotation.x = -0.68;
      P.legFR.rotation.x = -0.68;
      P.legRL.rotation.x = 0.68;
      P.legRR.rotation.x = 0.68;
      P.head.rotation.x = -0.16;
      pugShadow.scale.set(0.8, 0.72, 1);
      pugShadow.material.opacity = 0.32;
    }
    P.tailGroup.rotation.y =
      Math.sin(t * (3.5 + pug.move * 6)) * (0.055 + pug.move * 0.11);
    P.tailGroup.rotation.x = Math.sin(t * 2.1) * 0.025;
  }

  /* Human */
  var humanRoot = new THREE.Group();
  scene.add(humanRoot);
  var H = {};
  var HUMAN_KITCHEN = { x: -8, z: 0.2, yaw: Math.PI / 2 },
    HUMAN_LIVING = { x: 1.8, z: -0.6 },
    LOOK_YAW = 0.55,
    AWAY_YAW = -2.95;
  (function () {
    humanRoot.position.set(HUMAN_KITCHEN.x, 0, HUMAN_KITCHEN.z);
    humanRoot.rotation.y = HUMAN_KITCHEN.yaw;
    H.hips = sphere(0.2, 0.15, 0.15, M.pants, 0, 0.82, 0, humanRoot, 14);
    function leg(x) {
      var g = new THREE.Group();
      g.position.set(x, 0.78, 0);
      humanRoot.add(g);
      cylinder(0.075, 0.062, 0.72, M.pants, 0, -0.38, 0, g, 10);
      sphere(0.075, 0.05, 0.115, M.black, 0, -0.76, 0.03, g, 10);
      return g;
    }
    H.legL = leg(0.105);
    H.legR = leg(-0.105);
    H.torso = sphere(0.24, 0.33, 0.17, M.sweater, 0, 1.17, 0, humanRoot, 16);
    function arm(x) {
      var g = new THREE.Group();
      g.position.set(x, 1.39, 0);
      humanRoot.add(g);
      cylinder(0.05, 0.043, 0.5, M.sweater, 0, -0.26, 0, g, 9);
      sphere(0.052, 0.052, 0.052, M.skin, 0, -0.53, 0, g, 9);
      return g;
    }
    H.armL = arm(0.27);
    H.armR = arm(-0.27);
    cylinder(0.052, 0.057, 0.09, M.skin, 0, 1.53, 0, humanRoot, 10);
    H.head = new THREE.Group();
    H.head.position.y = 1.68;
    humanRoot.add(H.head);
    sphere(0.16, 0.17, 0.15, M.skin, 0, 0, 0, H.head, 16);
    sphere(0.165, 0.105, 0.155, M.woodDark, 0, 0.07, -0.02, H.head, 14);
    H.eyeSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      }),
    );
    H.eyeSprite.scale.set(0.35, 0.14, 1);
    H.eyeSprite.position.set(0, 1.72, 0.17);
    H.eyeSprite.visible = false;
    humanRoot.add(H.eyeSprite);
  })();
  var human = { target: null, lookT: 2, yawTarget: HUMAN_KITCHEN.yaw, bob: 0 };

  /* Vacuum */
  var vacuumRoot = new THREE.Group();
  scene.add(vacuumRoot);
  cylinder(0.29, 0.31, 0.12, M.robot, 0, 0.08, 0, vacuumRoot, 20);
  cylinder(0.2, 0.2, 0.04, M.metal, 0, 0.16, 0, vacuumRoot, 18);
  var vacuumLed = sphere(
    0.032,
    0.032,
    0.032,
    new THREE.MeshBasicMaterial({ color: 0x79ff9b }),
    0,
    0.14,
    0.2,
    vacuumRoot,
    8,
  );
  box(0.46, 0.15, 0.29, M.robot, -1.9, 0.075, -6.5);
  var vacuum = {
    pos: new THREE.Vector3(-1.9, 0, -6.3),
    dir: new THREE.Vector3(1, 0, 0),
    docked: true,
    turnT: 2,
  };

  /* Dynamic items */
  var crumbs = [];
  [
    [-5, 2.4],
    [-6.9, 2.5],
    [-4.6, 4.6],
    [-8.5, 5.6],
    [-8.3, 1.6],
    [-8.3, -4.9],
    [-7.2, -6],
    [-5.2, -2],
    [-3.6, 0.8],
    [-3.6, -1.4],
  ].forEach(function (p, i) {
    var m = mesh(
      new THREE.DodecahedronGeometry(0.075),
      M.crumb,
      p[0],
      0.11,
      p[1],
    );
    m.castShadow = true;
    crumbs.push({
      mesh: m,
      x: p[0],
      z: p[1],
      sx: p[0],
      sz: p[1],
      taken: false,
      phase: i * 0.63,
    });
  });
  var token = new THREE.Group();
  scene.add(token);
  sphere(0.14, 0.06, 0.08, M.gold, 0, 0, 0, token, 12);
  var fishTail = mesh(
    new THREE.ConeGeometry(0.07, 0.13, 4),
    M.gold,
    -0.18,
    0,
    0,
    token,
  );
  fishTail.rotation.z = Math.PI / 2;
  token.position.set(0.6, 0.1, -4.05);
  var smellPoints = [
    {
      x: 8.3,
      z: -11.3,
      label: "у дерева",
      key: "smell1",
      text: "Очень серьёзный запах. Работаем.",
    },
    {
      x: 9.88,
      z: -9.3,
      label: "у забора",
      key: "smell2",
      text: "Здесь явно кто-то ходил без моего разрешения.",
    },
    {
      x: 3.6,
      z: -11.4,
      label: "у скамейки",
      key: "smell3",
      text: "Информация собрана. Двор под контролем.",
    },
  ];
  smellPoints.forEach(function (s, index) {
    s.group = new THREE.Group();
    s.group.position.set(s.x, 0.03, s.z);
    scene.add(s.group);
    s.wisps = [];
    s.phase = index * 0.8;
    var glowMat = new THREE.MeshBasicMaterial({
      color: 0xb9e786,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    });
    var base = mesh(
      new THREE.CircleGeometry(0.42, 24),
      glowMat,
      0,
      0,
      0,
      s.group,
    );
    base.rotation.x = -Math.PI / 2;
    var ring = mesh(
      new THREE.RingGeometry(0.33, 0.39, 24),
      new THREE.MeshBasicMaterial({
        color: 0xe4ffb4,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
      0,
      0.008,
      0,
      s.group,
    );
    ring.rotation.x = -Math.PI / 2;
    s.ring = ring;
    for (var i = 0; i < 5; i++) {
      var puff = sphere(
        0.045 + i * 0.005,
        0.07 + i * 0.006,
        0.045 + i * 0.005,
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0xd6ffaf : 0xaedc83,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        }),
        rand(-0.22, 0.22),
        0.08 + i * 0.095,
        rand(-0.22, 0.22),
        s.group,
        9,
      );
      puff.castShadow = false;
      s.wisps.push(puff);
    }
    s.done = false;
    s.progress = 0;
  });

  var leashWorld = new THREE.Group();
  scene.add(leashWorld);
  var leashLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.026, 8, 18),
    M.red,
  );
  leashWorld.add(leashLoop);
  var leashStrap = cylinder(
    0.021,
    0.021,
    0.44,
    M.red,
    0.05,
    -0.23,
    0,
    leashWorld,
    7,
  );
  leashStrap.rotation.z = 0.3;
  leashWorld.position.set(9.45, 1, -4.3);
  var treat = sphere(0.065, 0.065, 0.065, M.woodDark, 0, 0, 0);
  treat.visible = false;
  var arrow = mesh(
    new THREE.ConeGeometry(0.16, 0.34, 10),
    new THREE.MeshBasicMaterial({ color: 0xffa34d }),
    0,
    0,
    0,
  );
  arrow.rotation.x = Math.PI;
  arrow.visible = false;
  var particles = [];
  for (var pi = 0; pi < 42; pi++) {
    var pm = mesh(
      new THREE.TetrahedronGeometry(0.045),
      new THREE.MeshBasicMaterial({ color: 0xffcf6b }),
      0,
      0,
      0,
    );
    pm.visible = false;
    particles.push({ mesh: pm, vel: new THREE.Vector3(), life: 0 });
  }
  function burst(x, y, z) {
    var n = 0;
    for (var i = 0; i < particles.length && n < 8; i++) {
      var p = particles[i];
      if (p.life <= 0) {
        p.mesh.visible = true;
        p.mesh.position.set(x, y, z);
        p.vel.set(rand(-1, 1), rand(1.3, 2.6), rand(-1, 1));
        p.life = 0.65;
        n++;
      }
    }
  }
  function updateParticles(dt) {
    particles.forEach(function (p) {
      if (p.life > 0) {
        p.life -= dt * 1.5;
        p.vel.y -= 4.8 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        var s = Math.max(0.01, p.life / 0.65);
        p.mesh.scale.setScalar(s);
        p.mesh.rotation.x += dt * 7;
        p.mesh.rotation.y += dt * 5;
        if (p.life <= 0) p.mesh.visible = false;
      }
    });
  }

  /* Camera */
  var cam = {
    yaw: -2.4,
    pitch: 0.32,
    distance: 4.35,
    focus: new THREE.Vector3(0.6, 0.47, -1.4),
    look: new THREE.Vector3(0.6, 0.47, -1.4),
    targetPos: new THREE.Vector3(),
    ray: new THREE.Vector3(),
    followTarget: new THREE.Vector3(),
    manualUntil: 0,
  };
  function blocked(x, z, r) {
    r = r || 0.1;
    return colliders.some(function (c) {
      return (
        x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r
      );
    });
  }
  function desiredDistance() {
    if (Game.sleeping) return 8.6;
    if (pug.pos.z < -7) return 5.85;
    if (pug.pos.x < -3) return 4.05;
    if (pug.pos.x > 4 && pug.pos.z < 0) return 3.95;
    if (pug.pos.x > 4) return 4.2;
    return 4.45;
  }
  function updateCamera(dt) {
    var calm = settings.calm,
      k = 1 - Math.exp(-dt * (calm ? 7.5 : 11.5)),
      focusK = 1 - Math.exp(-dt * (calm ? 9.5 : 15)),
      lookK = 1 - Math.exp(-dt * (calm ? 7.5 : 12)),
      manualCamera = nowMs() < cam.manualUntil;
    var talkZoom =
      voiceState.speaking && pug.move < 0.18 && !Game.sleeping ? 0.24 : 0;
    cam.distance = lerp(cam.distance, desiredDistance() - talkZoom, k);
    cam.pitch = lerp(cam.pitch, Game.sleeping ? 0.48 : 0.32, focusK);
    if (Game.mode === "finale" && !calm) cam.yaw += dt * 0.038;
    if (!Game.sleeping && !manualCamera && pug.move > 0.08)
      cam.yaw = angleLerp(cam.yaw, pug.yaw, 1 - Math.exp(-dt * (calm ? 0.1 : 0.24)));
    var ahead = Game.sleeping ? 0 : clamp(pug.move * (calm ? 0.12 : 0.24), 0, calm ? 0.12 : 0.24),
      fx = Game.sleeping ? bedCX : pug.pos.x + Math.sin(pug.yaw) * ahead,
      fy = Game.sleeping ? 0.85 : 0.43,
      fz = Game.sleeping ? bedCZ : pug.pos.z + Math.cos(pug.yaw) * ahead;
    cam.followTarget.set(fx, fy, fz);
    cam.focus.lerp(cam.followTarget, focusK);
    fx = cam.focus.x; fy = cam.focus.y; fz = cam.focus.z;
    var h = cam.distance * Math.cos(cam.pitch),
      v = cam.distance * Math.sin(cam.pitch) + 0.23;
    cam.targetPos.set(
      fx - Math.sin(cam.yaw) * h,
      fy + v,
      fz - Math.cos(cam.yaw) * h,
    );
    if (!Game.sleeping) {
      cam.ray.copy(cam.targetPos).sub(cam.focus);
      var max = 1;
      for (var i = 1; i <= 18; i++) {
        var t = i / 18,
          px = fx + cam.ray.x * t,
          pz = fz + cam.ray.z * t,
          py = fy + cam.ray.y * t;
        if (blocked(px, pz, 0.09) || py < 0.34) {
          max = Math.max(0.16, (i - 1) / 18);
          break;
        }
      }
      if (max < 1)
        cam.targetPos.copy(cam.focus).addScaledVector(cam.ray, max * 0.94);
    }
    if (cam.targetPos.y < 0.4) cam.targetPos.y = 0.4;
    camera.position.lerp(cam.targetPos, k);
    cam.look.lerp(cam.focus, lookK);
    camera.lookAt(cam.look);
  }

  /* Input */
  var keys = {},
    actionQueued = false,
    actionHeld = false,
    touchRun = false;
  var joystick = { active: false, id: null, cx: 0, cy: 0, x: 0, y: 0 },
    cameraTouch = { id: null, x: 0, y: 0 },
    mouse = { down: false, x: 0 };
  var knob = $("joystick-knob");
  function resetInput() {
    keys = {};
    actionQueued = false;
    actionHeld = false;
    touchRun = false;
    joystick.active = false;
    joystick.id = null;
    joystick.x = 0;
    joystick.y = 0;
    cameraTouch.id = null;
    mouse.down = false;
    knob.style.transform = "translate(0,0)";
    $("btn-run").classList.remove("active");
    pug.vel.set(0, 0, 0);
    pug.move = 0;
  }
  window.addEventListener("keydown", function (e) {
    var c = e.code;
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(c) >=
      0
    )
      e.preventDefault();
    if (keys[c]) return;
    keys[c] = true;
    if (c === "KeyE" || c === "Space") {
      actionQueued = true;
      actionHeld = true;
    }
    if (c === "KeyM") {
      if (settings.sound) {
        settings.sound = false;
        AudioManager.pauseAll();
        stopVoice();
        saveSettings();
        syncSettings();
      } else enableSoundFromGesture(true);
    }
    if (c === "Escape" && Game.mode === "playing") {
      if (Game.paused) resumeGame();
      else pauseGame();
    }
    if (Game.mode === "finale") Game.erzIdle = 0;
  });
  window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
    if (e.code === "KeyE" || e.code === "Space") actionHeld = false;
  });
  renderer.domElement.addEventListener("mousedown", function (e) {
    mouse.down = true;
    mouse.x = e.clientX;
  });
  window.addEventListener("mousemove", function (e) {
    if (!mouse.down) return;
    var dx = e.clientX - mouse.x;
    mouse.x = e.clientX;
    cam.yaw -= dx * 0.0032 * settings.sens;
    cam.manualUntil = nowMs() + 2000;
  });
  window.addEventListener("mouseup", function () {
    mouse.down = false;
  });
  renderer.domElement.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });
  if (IS_TOUCH) {
    renderer.domElement.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (cameraTouch.id === null) {
            cameraTouch.id = t.identifier;
            cameraTouch.x = t.clientX;
            cameraTouch.y = t.clientY;
          }
        }
      },
      { passive: false },
    );
    renderer.domElement.addEventListener(
      "touchmove",
      function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier === cameraTouch.id) {
            var dx = t.clientX - cameraTouch.x;
            cameraTouch.x = t.clientX;
            cameraTouch.y = t.clientY;
            cam.yaw -= dx * 0.0043 * settings.sens;
            cam.manualUntil = nowMs() + 2000;
          }
        }
      },
      { passive: false },
    );
    var endCamera = function (e) {
      for (var i = 0; i < e.changedTouches.length; i++)
        if (e.changedTouches[i].identifier === cameraTouch.id)
          cameraTouch.id = null;
    };
    renderer.domElement.addEventListener("touchend", endCamera);
    renderer.domElement.addEventListener("touchcancel", endCamera);
    var zone = $("joystick-zone"),
      base = $("joystick-base");
    zone.addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        if (joystick.active) return;
        var t = e.changedTouches[0],
          r = base.getBoundingClientRect();
        joystick.active = true;
        joystick.id = t.identifier;
        joystick.cx = r.left + r.width / 2;
        joystick.cy = r.top + r.height / 2;
        moveJoy(t.clientX, t.clientY);
      },
      { passive: false },
    );
    zone.addEventListener(
      "touchmove",
      function (e) {
        e.preventDefault();
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier === joystick.id) moveJoy(t.clientX, t.clientY);
        }
      },
      { passive: false },
    );
    function moveJoy(x, y) {
      var dx = x - joystick.cx,
        dy = y - joystick.cy,
        l = Math.sqrt(dx * dx + dy * dy) || 1,
        max = 39,
        c = Math.min(l, max);
      joystick.x = ((dx / l) * c) / max;
      joystick.y = ((dy / l) * c) / max;
      knob.style.transform =
        "translate(" + (dx / l) * c + "px," + (dy / l) * c + "px)";
    }
    var endJoy = function (e) {
      for (var i = 0; i < e.changedTouches.length; i++)
        if (e.changedTouches[i].identifier === joystick.id) {
          joystick.active = false;
          joystick.id = null;
          joystick.x = joystick.y = 0;
          knob.style.transform = "translate(0,0)";
        }
    };
    zone.addEventListener("touchend", endJoy);
    zone.addEventListener("touchcancel", endJoy);
    $("btn-action").addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        actionQueued = true;
        actionHeld = true;
      },
      { passive: false },
    );
    $("btn-action").addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        actionHeld = false;
      },
      { passive: false },
    );
    $("btn-action").addEventListener("touchcancel", function () {
      actionHeld = false;
    });
    $("btn-run").addEventListener(
      "touchstart",
      function (e) {
        e.preventDefault();
        touchRun = true;
        this.classList.add("active");
      },
      { passive: false },
    );
    $("btn-run").addEventListener(
      "touchend",
      function (e) {
        e.preventDefault();
        touchRun = false;
        this.classList.remove("active");
      },
      { passive: false },
    );
    $("btn-run").addEventListener("touchcancel", function () {
      touchRun = false;
      this.classList.remove("active");
    });
  }
  function inputVector() {
    var x = 0,
      z = 0;
    if (keys.KeyW || keys.ArrowUp) z++;
    if (keys.KeyS || keys.ArrowDown) z--;
    if (keys.KeyA || keys.ArrowLeft) x--;
    if (keys.KeyD || keys.ArrowRight) x++;
    if (joystick.active) {
      x += joystick.x;
      z -= joystick.y;
    }
    var l = Math.sqrt(x * x + z * z);
    if (l > 1) {
      x /= l;
      z /= l;
    }
    return { x: x, z: z, mag: Math.min(1, l) };
  }

  /* Game */
  var Game = {
    mode: "menu",
    paused: false,
    inputLocked: true,
    quest: 0,
    crumbs: 0,
    smells: 0,
    mood: 40,
    time: 0,
    finalTime: 0,
    vacuumHits: 0,
    bedAttempts: 0,
    hasLeash: false,
    leashPicked: false,
    leashDropped: false,
    tokenFound: false,
    doorSequence: false,
    frontOpen: false,
    bedroomOpen: false,
    looking: false,
    sleeping: false,
    finished: false,
    sleepT: 0,
    snoreT: 0,
    erzIdle: 0,
    erzUnlocked: false,
    vacuumActive: false,
    q3Timer: 0,
    ambientTimer: 20,
    stepDistance: 0,
    bumpCooldown: 0,
    q7Triggered: false,
    area: "home",
  };
  var sequence = null,
    pausedByOrientation = false,
    lastFrame = nowMs(),
    pendingTimers = [];
  function timer(fn, ms) {
    var id = setTimeout(function () {
      var i = pendingTimers.indexOf(id);
      if (i >= 0) pendingTimers.splice(i, 1);
      fn();
    }, ms);
    pendingTimers.push(id);
    return id;
  }
  function startSequence(steps, done) {
    sequence = { steps: steps, index: 0, time: 0, done: done };
  }
  function updateSequence(dt) {
    if (!sequence) return false;
    var step = sequence.steps[sequence.index];
    if (sequence.time === 0 && step.begin) step.begin();
    sequence.time += dt;
    var p = clamp(sequence.time / step.duration, 0, 1);
    if (step.tick) step.tick(p, dt);
    if (sequence.time >= step.duration) {
      if (step.end) step.end();
      sequence.index++;
      sequence.time = 0;
      if (sequence.index >= sequence.steps.length) {
        var done = sequence.done;
        sequence = null;
        if (done) done();
      }
    }
    return true;
  }
  function yawTo(ax, az, bx, bz) {
    return Math.atan2(bx - ax, bz - az);
  }
  function quest(number) {
    Game.quest = number;
    hapticNotify("success");
    AudioManager.playOne("ui", 0.45, 300);
    if (number === 1)
      setQuest("Проверь кухню. Там могло произойти что-то вкусное");
    if (number === 2) setQuest("Охота за крошками: собери все десять");
    if (number === 3)
      setQuest("Пылесос замечен. Не дай ему испортить расследование");
    if (number === 4) setQuest("Проведи переговоры о еде с человеком");
    if (number === 5) setQuest("Найди поводок и отнеси его к двери");
    if (number === 6) setQuest("Исследуй три важных запаха во дворе");
    if (number === 7)
      setQuest("Операция «Кровать»: дождись, пока человек отвернётся");
    if (number === 8) setQuest("Исправь слишком ровную простыню");
    if (number === 9) setQuest("Заслуженный сон");
  }
  function startGame() {
    setClosingConfirmation(true);
    showScreen(null);
    $("hud").classList.remove("hidden");
    Game.mode = "playing";
    Game.inputLocked = true;
    setPugState("lie");
    AudioManager.setArea("home");
    timer(function () {
      Game.inputLocked = false;
      quest(1);
      MatveyDialogue.say("start", { force: true });
    }, 650);
  }
  function activateVacuum() {
    if (Game.vacuumActive) return;
    Game.vacuumActive = true;
    vacuum.docked = false;
    vacuum.pos.set(0.5, 0, -5);
    vacuum.dir.set(-1, 0, 0.3).normalize();
    vacuum.turnT = rand(2, 4);
    AudioManager.startVacuum();
    speakMatvey("vacuum", "Опять эта шайба без совести.");
  }
  function dockVacuum() {
    Game.vacuumActive = false;
    vacuum.docked = true;
    vacuum.pos.set(-1.9, 0, -6.3);
    vacuumRoot.position.copy(vacuum.pos);
    AudioManager.stopVacuum();
  }
  function collectCrumb(c) {
    c.taken = true;
    c.mesh.visible = false;
    Game.crumbs++;
    updateCounters();
    setMood(Game.mood + 5);
    burst(c.x, 0.22, c.z);
    AudioManager.playOne("collect", 0.7, 100);
    hapticImpact("light");
    pug.lickT = 0.01;
    if (Game.crumbs === 1)
      speakMatvey("firstCrumb", "Крошка не валялась. Она ждала профессионала.");
    if (Game.quest === 2 && Game.crumbs >= 10) {
      quest(3);
      Game.q3Timer = 2.7;
    }
  }
  function dropCrumb() {
    var taken = crumbs.filter(function (c) {
      return c.taken;
    });
    if (!taken.length) return;
    var c = taken[Math.floor(Math.random() * taken.length)];
    c.taken = false;
    c.mesh.visible = true;
    for (var i = 0; i < 12; i++) {
      var a = rand(0, Math.PI * 2),
        r = rand(0.7, 1.3),
        x = pug.pos.x + Math.cos(a) * r,
        z = pug.pos.z + Math.sin(a) * r;
      if (x < -9.35 || x > 3.5 || z < -6.35 || z > 6.35 || blocked(x, z, 0.28))
        continue;
      c.x = x;
      c.z = z;
      c.mesh.position.set(x, 0.11, z);
      return;
    }
    c.mesh.position.set(c.x, 0.11, c.z);
  }
  function begSequence() {
    Game.inputLocked = true;
    pug.forcedYaw = yawTo(
      pug.pos.x,
      pug.pos.z,
      humanRoot.position.x,
      humanRoot.position.z,
    );
    speakMatvey("beg", "Я не попрошайничаю. Я провожу переговоры.");
    startSequence(
      [
        {
          duration: 0.42,
          begin: function () {
            setPugState("sit");
          },
        },
        {
          duration: 1.25,
          begin: function () {
            setPugState("beg");
            AudioManager.playOne("whine", 0.48, 500);
          },
        },
        {
          duration: 1.05,
          begin: function () {
            treat.visible = true;
            treat.position.set(humanRoot.position.x, 1, humanRoot.position.z);
          },
          tick: function (k) {
            treat.position.set(
              lerp(humanRoot.position.x, pug.pos.x, k),
              1 + Math.sin(k * Math.PI) * 0.3,
              lerp(humanRoot.position.z, pug.pos.z, k),
            );
          },
          end: function () {
            treat.visible = false;
            setMood(Game.mood + 15);
            AudioManager.playOne("collect", 0.5, 100);
          },
        },
        { duration: 0.45 },
      ],
      function () {
        pug.forcedYaw = null;
        Game.inputLocked = false;
        quest(5);
        speakMatvey("leash", "Поводок сам себя не принесёт. Я проверял.");
      },
    );
  }
  function doorSequence() {
    if (Game.leashDropped) return;
    Game.inputLocked = true;
    Game.hasLeash = false;
    Game.leashDropped = true;
    P.leashCarry.visible = false;
    leashWorld.visible = true;
    leashWorld.position.set(5.8, 0.11, -6.55);
    leashWorld.rotation.x = -Math.PI / 2;
    pug.forcedYaw = yawTo(pug.pos.x, pug.pos.z, 5.8, -7);
    speakMatvey("door", "Открывайте. Специалист по запахам готов.");
    startSequence(
      [
        {
          duration: 1.6,
          begin: function () {
            setPugState("scratch");
            AudioManager.playOne("dig", 0.65, 400);
          },
        },
        {
          duration: 1.1,
          begin: function () {
            setPugState("idle");
          },
        },
        {
          duration: 1,
          begin: function () {
            doors.front.target = 1;
            Game.frontOpen = true;
            removeCollider(frontDoorCollider);
            AudioManager.playOne("door", 0.7, 500);
            setMood(Game.mood + 8);
          },
        },
      ],
      function () {
        pug.forcedYaw = null;
        Game.inputLocked = false;
        quest(6);
      },
    );
  }
  function bedAttempt() {
    if (Game.quest !== 7) return;
    Game.bedAttempts++;
    if (Game.looking) {
      AudioManager.playOne("snort", 0.6, 400);
      hapticNotify("warning");
      speakMatvey("bedWatched", "Так. Свидетель ещё не отвернулся.");
      setPugState("hop");
      startSequence([
        {
          duration: 0.5,
          tick: function (k) {
            pug.visualY = Math.sin(k * Math.PI) * 0.28;
          },
          end: function () {
            pug.visualY = 0;
            setPugState("idle");
          },
        },
      ]);
      return;
    }
    bedSequence();
  }
  function bedSequence() {
    Game.inputLocked = true;
    quest(8);
    speakMatvey("dig", "Простыня слишком ровная. Исправляю.", { force: true });
    var sx = pug.pos.x,
      sz = pug.pos.z,
      sy = pug.yaw,
      shown = 0;
    startSequence(
      [
        {
          duration: 0.8,
          begin: function () {
            setPugState("jump");
            AudioManager.playOne("jump", 0.7, 300);
            hapticImpact("soft");
            pug.forcedYaw = yawTo(sx, sz, bedCX, bedCZ);
          },
          tick: function (k) {
            pug.pos.x = lerp(sx, bedCX, k);
            pug.pos.z = lerp(sz, bedCZ - 0.2, k);
            pug.visualY = Math.sin(k * Math.PI) * (bedTop + 0.25);
          },
          end: function () {
            pug.groundY = bedTop;
            pug.visualY = 0;
            pug.onBed = true;
          },
        },
        {
          duration: 2.8,
          begin: function () {
            setPugState("dig");
            AudioManager.playOne("dig", 0.7, 500);
          },
          tick: function (k, dt) {
            pug.digClock += dt;
            if (pug.digClock > 0.34) {
              pug.digClock = 0;
              AudioManager.playOne("dig", 0.5, 300);
              if (shown < crumples.children.length)
                crumples.children[shown++].visible = true;
            }
          },
        },
        {
          duration: 2.1,
          begin: function () {
            setPugState("spin");
          },
          tick: function (k) {
            pug.yaw = sy + k * Math.PI * 4;
          },
        },
        {
          duration: 1.05,
          begin: function () {
            setPugState("lie");
          },
        },
        {
          duration: 0.8,
          begin: function () {
            setPugState("sleep");
            Game.sleeping = true;
            quest(9);
            setMood(100);
            speakMatvey("sleep", "Ержан закончил смену.", { force: true });
          },
        },
      ],
      function () {
        pug.forcedYaw = null;
      },
    );
  }
  function nearestInteract() {
    var p = pug.pos,
      best = null,
      bd = Infinity;
    function consider(x, z, r, label, short, fn) {
      var d = Math.sqrt(dist2(p.x, p.z, x, z));
      if (d < r && d < bd) {
        bd = d;
        best = { label: label, short: short, fn: fn };
      }
    }
    if (Game.quest === 4)
      consider(
        humanRoot.position.x,
        humanRoot.position.z,
        1.5,
        "ДЕЙСТВИЕ — провести переговоры",
        "ПРОСИТЬ",
        begSequence,
      );
    if (Game.quest === 5 && !Game.leashPicked)
      consider(9.45, -4.3, 1.3, "Взять поводок", "ВЗЯТЬ", function () {
        Game.leashPicked = true;
        Game.hasLeash = true;
        leashWorld.visible = false;
        P.leashCarry.visible = true;
        AudioManager.playOne("collect", 0.55, 200);
        setMood(Game.mood + 8);
        setQuest("Отнеси поводок к входной двери");
      });
    if (Game.quest === 5 && Game.hasLeash && !Game.doorSequence)
      consider(
        5.8,
        -6.5,
        1.6,
        "Положить поводок у двери",
        "ОТКРЫТЬ",
        function () {
          Game.doorSequence = true;
          doorSequence();
        },
      );
    if (!Game.tokenFound)
      consider(
        0.6,
        -4.05,
        1.05,
        "Под диваном что-то блестит",
        "НАЙТИ",
        function () {
          Game.tokenFound = true;
          token.visible = false;
          burst(0.6, 0.2, -4.05);
          AudioManager.playOne("achievement", 0.65, 300);
          setMood(Game.mood + 10);
          unlockAchievement("sel");
          speakMatvey("random", "Это была не крошка. Это была улика.");
        },
      );
    if (Game.quest === 7 && !Game.sleeping) {
      var x = clamp(p.x, 6, 8.6),
        z = clamp(p.z, 2.7, 5.95);
      if (Math.sqrt(dist2(p.x, p.z, x, z)) < 1.35)
        consider(x, z, 1.4, "Запрыгнуть на кровать", "ПРЫГНУТЬ", bedAttempt);
    }
    return best;
  }
  function nearestSmell() {
    for (var i = 0; i < smellPoints.length; i++) {
      var s = smellPoints[i];
      if (!s.done && dist2(pug.pos.x, pug.pos.z, s.x, s.z) < 0.9) return s;
    }
    return null;
  }
  function collide(pos, r) {
    for (var pass = 0; pass < 2; pass++)
      for (var i = 0; i < colliders.length; i++) {
        var c = colliders[i];
        if (
          pos.x > c.minX - r &&
          pos.x < c.maxX + r &&
          pos.z > c.minZ - r &&
          pos.z < c.maxZ + r
        ) {
          var l = pos.x - (c.minX - r),
            rr = c.maxX + r - pos.x,
            b = pos.z - (c.minZ - r),
            f = c.maxZ + r - pos.z,
            m = Math.min(l, rr, b, f);
          if (m === l) pos.x = c.minX - r;
          else if (m === rr) pos.x = c.maxX + r;
          else if (m === b) pos.z = c.minZ - r;
          else pos.z = c.maxZ + r;
        }
      }
    pos.x = clamp(pos.x, -9.68, 10.24);
    pos.z = clamp(pos.z, -13.78, 6.73);
  }
  var temp = new THREE.Vector3(),
    arrowTime = 0,
    rareLines = [
      "Я устал. Хотя ещё ничего не делал.",
      "Люди снова не понимают очевидных вещей.",
      "Ситуация под контролем.",
      "Прошу не мешать специалисту.",
      "Работа тяжёлая. Зарплата отсутствует.",
      "Мне нужен перекус для продолжения расследования.",
      "Вопросы есть? У меня тоже нет.",
    ];
  function updateArrow() {
    var target = null;
    if (Game.quest === 1) target = { x: -3, y: 1.8, z: 0 };
    else if (Game.quest === 2) {
      var nearest = null,
        best = Infinity;
      crumbs.forEach(function (c) {
        if (!c.taken) {
          var d = dist2(pug.pos.x, pug.pos.z, c.x, c.z);
          if (d < best) {
            best = d;
            nearest = c;
          }
        }
      });
      if (nearest) target = { x: nearest.x, y: 1, z: nearest.z };
    } else if (Game.quest === 4)
      target = { x: humanRoot.position.x, y: 2.2, z: humanRoot.position.z };
    else if (Game.quest === 5)
      target = Game.leashPicked
        ? { x: 5.8, y: 1.8, z: -6.5 }
        : { x: 9.45, y: 1.8, z: -4.3 };
    else if (Game.quest === 6) {
      if (Game.smells >= 3) target = { x: 5.8, y: 1.8, z: -6.6 };
      else {
        var ns = smellPoints.find(function (s) {
          return !s.done;
        });
        if (ns) target = { x: ns.x, y: 1, z: ns.z };
      }
    } else if (Game.quest === 7 && !Game.sleeping)
      target = { x: bedCX, y: 1.65, z: bedCZ };
    arrow.visible = Boolean(target);
    if (target)
      arrow.position.set(
        target.x,
        target.y + Math.sin(arrowTime * 3) * 0.12,
        target.z,
      );
  }
  function updatePlaying(dt) {
    Game.time += dt;
    Game.bumpCooldown -= dt;
    var inSequence = updateSequence(dt);
    var area = pug.pos.z < -7 ? "yard" : "home";
    if (area !== Game.area) {
      Game.area = area;
      AudioManager.setArea(area);
    }
    if (!inSequence && !Game.inputLocked && !Game.sleeping) {
      var input = inputVector(),
        running = keys.ShiftLeft || keys.ShiftRight || touchRun,
        speed = running ? 3.35 : 1.85;
      var fx = Math.sin(cam.yaw),
        fz = Math.cos(cam.yaw),
        rx = -fz,
        rz = fx,
        mx = fx * input.z + rx * input.x,
        mz = fz * input.z + rz * input.x;
      pug.vel.x = lerp(pug.vel.x, mx * speed * input.mag, clamp(dt * 12, 0, 1));
      pug.vel.z = lerp(pug.vel.z, mz * speed * input.mag, clamp(dt * 12, 0, 1));
      var sp = Math.sqrt(pug.vel.x * pug.vel.x + pug.vel.z * pug.vel.z);
      if (sp < 0.045) {
        pug.vel.set(0, 0, 0);
        sp = 0;
      }
      pug.pos.x += pug.vel.x * dt;
      pug.pos.z += pug.vel.z * dt;
      collide(pug.pos, 0.34);
      pug.move = lerp(pug.move, clamp(sp / 3.1, 0, 1), dt * 8);
      if (sp > 0.14) {
        pug.phase += sp * dt * (running ? 6.2 : 5.4);
        pug.yaw = angleLerp(
          pug.yaw,
          Math.atan2(pug.vel.x, pug.vel.z),
          clamp(dt * 10, 0, 1),
        );
        setPugState("walk");
        Game.stepDistance += sp * dt;
        if (Game.stepDistance > 0.5) {
          Game.stepDistance = 0;
          AudioManager.playOne(running ? "stepsRun" : "stepsWalk", 0.42, 120);
        }
      } else {
        if (pug.forcedYaw !== null)
          pug.yaw = angleLerp(pug.yaw, pug.forcedYaw, dt * 6);
        if (pug.state === "walk") setPugState("idle");
      }
      if (Game.quest === 1 && pug.pos.x < -3.25) {
        quest(2);
        activateVacuum();
      }
      if (
        Game.quest === 6 &&
        Game.smells >= 3 &&
        pug.pos.z > -6.8 &&
        !Game.q7Triggered
      ) {
        Game.q7Triggered = true;
        doors.bedroom.target = 1;
        Game.bedroomOpen = true;
        removeCollider(bedroomDoorCollider);
        AudioManager.playOne("door", 0.7, 500);
        human.target = { x: HUMAN_LIVING.x, z: HUMAN_LIVING.z };
        quest(7);
        speakMatvey(
          "bedFree",
          "На кровать нельзя только до тех пор, пока никто не видит.",
        );
      }
    } else {
      pug.move = lerp(pug.move, 0, dt * 6);
      if (pug.forcedYaw !== null)
        pug.yaw = angleLerp(pug.yaw, pug.forcedYaw, dt * 7);
    }
    pugRoot.position.set(pug.pos.x, pug.groundY + pug.visualY, pug.pos.z);
    pugRoot.rotation.y = pug.yaw;
    pugShadow.position.y = 0.012 - pug.visualY;
    if (actionQueued) {
      actionQueued = false;
      if (!inSequence && !Game.inputLocked && !Game.sleeping) {
        var interact = nearestInteract();
        if (interact) interact.fn();
      }
    }
    if (Game.quest >= 6 && !inSequence && !Game.inputLocked && !Game.sleeping) {
      var smell = nearestSmell();
      if (smell && actionHeld) {
        setPugState("sniff");
        smell.progress += dt / 1.8;
        setHold(smell.progress);
        AudioManager.playOne("sniff", 0.38, 480);
        if (smell.progress >= 1) {
          smell.done = true;
          smell.group.visible = false;
          Game.smells++;
          updateCounters();
          setMood(Game.mood + 8);
          setHold(null);
          AudioManager.playOne("collect", 0.65, 150);
          speakMatvey(smell.key, smell.text, { force: true });
          setPugState("idle");
          if (Game.smells >= 3) setQuest("Двор проверен. Возвращайся домой");
        }
      } else {
        setHold(smell ? smell.progress : null);
        if (pug.state === "sniff") setPugState("idle");
      }
    } else setHold(null);
    if (Game.quest === 3) {
      Game.q3Timer -= dt;
      if (Game.q3Timer <= 0) quest(4);
    }
    crumbs.forEach(function (c) {
      if (c.taken) return;
      c.phase += dt * 3;
      c.mesh.position.y = 0.11 + Math.sin(c.phase) * 0.025;
      c.mesh.rotation.y += dt * 2;
      if (dist2(pug.pos.x, pug.pos.z, c.x, c.z) < 0.34) collectCrumb(c);
    });
    if (!Game.tokenFound) {
      token.rotation.y += dt * 1.8;
      token.position.y = 0.1 + Math.sin(Game.time * 3.5) * 0.025;
    }
    if (Game.vacuumActive && !vacuum.docked) {
      vacuum.turnT -= dt;
      if (vacuum.turnT <= 0) {
        vacuum.turnT = rand(1.8, 4);
        var a = Math.atan2(vacuum.dir.z, vacuum.dir.x) + rand(-1.1, 1.1);
        vacuum.dir.set(Math.cos(a), 0, Math.sin(a));
      }
      temp.set(
        vacuum.pos.x + vacuum.dir.x * 1.08 * dt,
        0,
        vacuum.pos.z + vacuum.dir.z * 1.08 * dt,
      );
      var hit =
        blocked(temp.x, temp.z, 0.31) ||
        temp.x < -9.35 ||
        temp.x > 3.55 ||
        temp.z < -6.35 ||
        temp.z > 6.35;
      if (hit) {
        if (Math.abs(vacuum.dir.x) > Math.abs(vacuum.dir.z)) vacuum.dir.x *= -1;
        else vacuum.dir.z *= -1;
      } else vacuum.pos.copy(temp);
      vacuumRoot.position.copy(vacuum.pos);
      vacuumRoot.rotation.y += dt * 0.8;
      AudioManager.updateVacuum(
        Math.sqrt(dist2(vacuum.pos.x, vacuum.pos.z, pug.pos.x, pug.pos.z)),
      );
      if (
        Game.bumpCooldown <= 0 &&
        !pug.onBed &&
        dist2(vacuum.pos.x, vacuum.pos.z, pug.pos.x, pug.pos.z) < 0.39
      ) {
        Game.bumpCooldown = 2;
        Game.vacuumHits++;
        hapticImpact("medium");
        if (Game.quest === 2 && Game.crumbs > 0) {
          Game.crumbs--;
          dropCrumb();
          updateCounters();
        }
        AudioManager.playOne("snort", 0.7, 400);
        speakMatvey("vacuumHit", "Зафиксировано нападение бытовой техники.");
        setPugState("hop");
        startSequence([
          {
            duration: 0.55,
            tick: function (k) {
              pug.visualY = Math.sin(k * Math.PI) * 0.34;
            },
            end: function () {
              pug.visualY = 0;
              setPugState("idle");
            },
          },
        ]);
      }
    }
    if (Game.quest >= 7 && Game.vacuumActive) dockVacuum();
    if (human.target) {
      var dx = human.target.x - humanRoot.position.x,
        dz = human.target.z - humanRoot.position.z,
        d = Math.sqrt(dx * dx + dz * dz);
      if (d > 0.08) {
        humanRoot.position.x += (dx / d) * 1.12 * dt;
        humanRoot.position.z += (dz / d) * 1.12 * dt;
        humanRoot.rotation.y = Math.atan2(dx, dz);
        human.bob += dt * 8;
        var sw = Math.sin(human.bob);
        H.legL.rotation.x = sw * 0.44;
        H.legR.rotation.x = -sw * 0.44;
        H.armL.rotation.x = -sw * 0.28;
        H.armR.rotation.x = sw * 0.28;
        humanRoot.position.y = Math.abs(Math.cos(human.bob)) * 0.025;
      } else {
        human.target = null;
        humanRoot.position.y = 0;
        human.lookT = 1.4;
      }
    } else {
      H.legL.rotation.x = lerp(H.legL.rotation.x, 0, dt * 8);
      H.legR.rotation.x = lerp(H.legR.rotation.x, 0, dt * 8);
      humanRoot.position.y = lerp(humanRoot.position.y, 0, dt * 8);
    }
    if (Game.quest === 7 && !Game.sleeping && !human.target) {
      human.lookT -= dt;
      if (human.lookT <= 0) {
        Game.looking = !Game.looking;
        human.lookT = Game.looking ? rand(3, 4.4) : rand(3.2, 5.8);
        human.yawTarget = Game.looking ? LOOK_YAW : AWAY_YAW;
        setWatch(Game.looking);
        if (!Game.looking) speakMatvey("bedFree", "Оперативное окно открыто.");
      }
      humanRoot.rotation.y = angleLerp(
        humanRoot.rotation.y,
        human.yawTarget,
        dt * 4,
      );
      H.eyeSprite.visible = Game.looking;
    } else if (Game.quest !== 7) H.eyeSprite.visible = false;
    Object.keys(doors).forEach(function (k) {
      var d = doors[k];
      d.value = lerp(d.value, d.target, dt * 3);
      d.group.rotation.y = -d.value * 1.75;
    });
    smellPoints.forEach(function (s, index) {
      if (!s.done && s.group.visible) {
        s.phase += dt;
        s.group.rotation.y += dt * 0.28;
        s.ring.scale.setScalar(1 + Math.sin(s.phase * 2.1) * 0.08);
        s.wisps.forEach(function (w, j) {
          w.position.y =
            0.08 + j * 0.095 + ((s.phase * 0.18 + j * 0.13) % 0.34);
          w.position.x += Math.sin(s.phase * 1.7 + j) * dt * 0.025;
          w.material.opacity =
            0.16 + 0.18 * Math.max(0, Math.sin(s.phase * 2 + j));
        });
      }
    });
    arrowTime += dt;
    updateArrow();
    if (Game.quest >= 2 && Game.quest <= 6 && !sequence) {
      Game.ambientTimer -= dt;
      if (Game.ambientTimer <= 0) {
        Game.ambientTimer = rand(20, 34);
        MatveyDialogue.say("idle", { cooldown: 20000 });
      }
    }
    if (Game.sleeping) {
      Game.sleepT += dt;
      Game.snoreT -= dt;
      if (Game.snoreT <= 0) {
        Game.snoreT = rand(2.7, 4.4);
        pug.jolt = 1;
        AudioManager.playOne("snore", 0.5, 1800);
      }
      if (Game.sleepT > 5 && !Game.finished) {
        Game.finished = true;
        Game.finalTime = Game.time;
        $("fade").classList.add("on");
      }
      if (Game.sleepT > 7.1 && screenOpen("screen-finale") === false)
        openFinale();
    }
    var interact2 = null;
    if (!inSequence && !Game.inputLocked && !Game.sleeping) {
      var smell2 = nearestSmell();
      interact2 = smell2
        ? { label: "Удерживай действие — " + smell2.label, short: "НЮХАТЬ" }
        : nearestInteract();
    }
    setPrompt(
      interact2 ? interact2.label : null,
      interact2 ? interact2.short : null,
    );
    if (interact2 && interact2.short === "ПРОСИТЬ" && !Game.humanPrompted) {
      Game.humanPrompted = true;
      hapticImpact("light");
      MatveyDialogue.say("humanNear", { cooldown: 20000 });
    }
    updateParticles(dt);
    animatePug(dt);
    updateCamera(dt);
  }
  function openFinale() {
    Game.mode = "finale";
    Game.erzIdle = 0;
    setClosingConfirmation(false);
    $("fin-crumbs").textContent = Game.crumbs + " / 10";
    $("fin-smells").textContent = Game.smells + " / 3";
    $("fin-time").textContent = fmtTime(Game.finalTime);
    $("fin-vacuum").textContent = Game.vacuumHits;
    $("fin-attempts").textContent = Game.bedAttempts;
    if (bestTime === null || Game.finalTime < bestTime) {
      bestTime = Game.finalTime;
      saveBest();
    }
    if (Game.vacuumHits === 0) unlockAchievement("hitry");
    if (Game.tokenFound) unlockAchievement("king");
    setPrompt(null);
    $("watch-ind").classList.add("hidden");
    showScreen("screen-finale");
    speakMatvey("finale", "День прожит не зря. Рассол может спать спокойно.", {
      force: true,
    });
  }
  function resetGame() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers.length = 0;
    stopVoice();
    AudioManager.stopAll();
    sequence = null;
    resetInput("reset-game");
    Object.assign(Game, {
      mode: "menu",
      paused: false,
      inputLocked: true,
      humanPrompted: false,
      quest: 0,
      crumbs: 0,
      smells: 0,
      mood: 40,
      time: 0,
      finalTime: 0,
      vacuumHits: 0,
      bedAttempts: 0,
      hasLeash: false,
      leashPicked: false,
      leashDropped: false,
      tokenFound: false,
      doorSequence: false,
      frontOpen: false,
      bedroomOpen: false,
      looking: false,
      sleeping: false,
      finished: false,
      sleepT: 0,
      snoreT: 0,
      erzIdle: 0,
      erzUnlocked: false,
      vacuumActive: false,
      q3Timer: 0,
      ambientTimer: 20,
      stepDistance: 0,
      bumpCooldown: 0,
      q7Triggered: false,
      area: "home",
    });
    crumbs.forEach(function (c) {
      c.taken = false;
      c.x = c.sx;
      c.z = c.sz;
      c.mesh.visible = true;
      c.mesh.position.set(c.sx, 0.11, c.sz);
    });
    token.visible = true;
    leashWorld.visible = true;
    leashWorld.position.set(9.45, 1, -4.3);
    leashWorld.rotation.set(0, 0, 0);
    P.leashCarry.visible = false;
    doors.front.value = doors.front.target = 0;
    doors.front.group.rotation.y = 0;
    doors.bedroom.value = doors.bedroom.target = 0;
    doors.bedroom.group.rotation.y = 0;
    ensureCollider(frontDoorCollider);
    ensureCollider(bedroomDoorCollider);
    dockVacuum();
    humanRoot.position.set(HUMAN_KITCHEN.x, 0, HUMAN_KITCHEN.z);
    humanRoot.rotation.y = HUMAN_KITCHEN.yaw;
    human.target = null;
    human.lookT = 2;
    human.yawTarget = HUMAN_KITCHEN.yaw;
    human.bob = 0;
    H.eyeSprite.visible = false;
    smellPoints.forEach(function (s) {
      s.done = false;
      s.progress = 0;
      s.group.visible = true;
    });
    crumples.children.forEach(function (c) {
      c.visible = false;
    });
    particles.forEach(function (p) {
      p.life = 0;
      p.mesh.visible = false;
    });
    treat.visible = false;
    arrow.visible = false;
    pug.pos.set(0.6, 0, -1.4);
    pug.vel.set(0, 0, 0);
    pug.yaw = -Math.PI / 2;
    pug.groundY = 0;
    pug.visualY = 0;
    pug.onBed = false;
    pug.forcedYaw = null;
    pug.move = 0;
    pug.jolt = 0;
    pug.digClock = 0;
    pug.settle = 0;
    proceduralPug.visible = !glb.active;
    setPugState("lie");
    pugRoot.position.set(0.6, 0, -1.4);
    pugRoot.rotation.y = pug.yaw;
    cam.yaw = -2.4;
    cam.pitch = 0.32;
    cam.distance = 4.35;
    cam.focus.set(0.6, 0.47, -1.4);
    cam.look.copy(cam.focus);
    camera.position.set(3.7, 2.0, 2.1);
    setMood(40);
    updateCounters();
    setQuest("…");
    setPrompt(null);
    setHold(null);
    $("watch-ind").classList.add("hidden");
    $("fade").classList.remove("on");
    $("hud").classList.add("hidden");
    pausedByOrientation = false;
  }
  function pauseGame() {
    if (Game.mode !== "playing" || Game.paused) return;
    resetInput("pause");
    Game.paused = true;
    AudioManager.pauseAll();
    stopVoice();
    showScreen("screen-pause");
  }
  function resumeGame() {
    Game.paused = false;
    showScreen(null);
    lastFrame = nowMs();
    AudioManager.resumeLoops();
  }

  /* Settings and buttons */
  function enableSoundFromGesture(message) {
    settings.sound = true;
    AudioManager.unlock();
    saveSettings();
    AudioManager.setArea(Game.area || "home");
    if (Game.vacuumActive) AudioManager.startVacuum();
    syncSettings();
    if (message)
      speakMatvey("sound", "Звук принят. Работа продолжается.", {
        force: true,
      });
  }
  $("btn-start").addEventListener("click", function () {
    resetGame();
    TelegramApp.fullscreen();
    TelegramApp.lockLandscape();
    if (settings.sound) AudioManager.unlock();
    startGame();
    syncSettings();
  });
  $("btn-again").addEventListener("click", function () {
    resetGame();
    TelegramApp.fullscreen();
    TelegramApp.lockLandscape();
    if (settings.sound) AudioManager.unlock();
    startGame();
    syncSettings();
  });
  $("btn-controls").addEventListener("click", function () {
    screenReturn = "start";
    showScreen("screen-controls");
  });
  $("btn-controls-back").addEventListener("click", function () {
    showScreen(screenReturn === "pause" ? "screen-pause" : "screen-start");
  });
  $("btn-settings").addEventListener("click", function () {
    screenReturn = "start";
    showScreen("screen-settings");
  });
  $("btn-pause-settings").addEventListener("click", function () {
    screenReturn = "pause";
    showScreen("screen-settings");
  });
  $("btn-settings-back").addEventListener("click", function () {
    showScreen(
      screenReturn === "pause"
        ? "screen-pause"
        : screenReturn === "finale"
          ? "screen-finale"
          : "screen-start",
    );
  });
  $("btn-ach").addEventListener("click", function () {
    renderAchievements();
    showScreen("screen-achievements");
  });
  $("btn-ach-back").addEventListener("click", function () {
    showScreen("screen-start");
  });
  $("btn-resume").addEventListener("click", resumeGame);
  function toMenu() {
    setClosingConfirmation(false);
    resetGame();
    refreshBest();
    showScreen("screen-start");
  }
  $("btn-quit").addEventListener("click", toMenu);
  $("btn-menu").addEventListener("click", toMenu);
  $("btn-pause").addEventListener("click", function () {
    if (Game.mode === "playing") {
      if (Game.paused) resumeGame();
      else pauseGame();
    }
  });
  $("btn-mute").addEventListener("click", function () {
    if (settings.sound) {
      settings.sound = false;
      saveSettings();
      AudioManager.pauseAll();
      stopVoice();
      syncSettings();
    } else enableSoundFromGesture(true);
  });
  $("set-sound").addEventListener("click", function () {
    if (settings.sound) {
      settings.sound = false;
      AudioManager.pauseAll();
      stopVoice();
      saveSettings();
      syncSettings();
    } else enableSoundFromGesture(false);
  });
  [
    ["set-music", "music"],
    ["set-voice", "voice"],
    ["set-sfx", "sfx"],
    ["set-sens", "sens"],
  ].forEach(function (item) {
    $(item[0]).addEventListener("input", function () {
      settings[item[1]] = parseFloat(this.value);
      saveSettings();
      AudioManager.refreshVolumes();
    });
  });
  $("set-calm").addEventListener("click", function () {
    settings.calm = !settings.calm;
    saveSettings();
    syncSettings();
  });
  [
    ["q-low", "low"],
    ["q-med", "medium"],
    ["q-high", "high"],
  ].forEach(function (q) {
    $(q[0]).addEventListener("click", function () {
      settings.quality = q[1];
      saveSettings();
      applyQuality();
      syncSettings();
    });
  });
  $("btn-reset-progress").addEventListener("click", function () {
    if (confirm("Сбросить достижения и рекорд?")) {
      achievements = { sel: false, hitry: false, erzhan: false, king: false };
      bestTime = null;
      try {
        localStorage.removeItem(STORAGE.achievements);
        localStorage.removeItem(STORAGE.best);
      } catch (error) {}
      renderAchievements();
      refreshBest();
    }
  });
  $("btn-add-home").addEventListener("click", function () {
    try {
      if (TelegramApp.tg && TelegramApp.tg.addToHomeScreen)
        TelegramApp.tg.addToHomeScreen();
    } catch (error) {}
  });

  /* Orientation, resize, lifecycle */
  var portraitMedia = matchMedia("(orientation: portrait)");
  function checkOrientation() {
    var portrait = IS_TOUCH && innerHeight > innerWidth;
    $("portrait-warning").classList.toggle("hidden", !portrait);
    if (portrait) {
      if (Game.mode === "playing" && !Game.paused && !pausedByOrientation) {
        pausedByOrientation = true;
        resetInput("orientation");
        AudioManager.pauseAll();
        stopVoice();
      }
      if (tgBack && !portraitBackHidden) {
        try {
          tgBack.hide();
        } catch (error) {}
        portraitBackHidden = true;
      }
    } else {
      if (pausedByOrientation) {
        pausedByOrientation = false;
        lastFrame = nowMs();
        TelegramApp.lockLandscape();
        AudioManager.resumeLoops();
      }
      if (portraitBackHidden) {
        portraitBackHidden = false;
        updateBack();
      }
    }
  }
  function applyRendererSize() {
    var dpr = Math.min(devicePixelRatio || 1, 1.85),
      scale =
        settings.quality === "low"
          ? 0.62
          : settings.quality === "medium"
            ? 0.8
            : 0.95;
    renderer.setPixelRatio(dpr * scale);
    renderer.setSize(innerWidth, innerHeight, false);
  }
  function applyQuality() {
    applyRendererSize();
    var high = settings.quality === "high",
      low = settings.quality === "low";
    renderer.shadowMap.enabled = !low;
    dirLight.castShadow = !low;
    dirLight.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
    if (dirLight.shadow.map) {
      dirLight.shadow.map.dispose();
      dirLight.shadow.map = null;
    }
  }
  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    applyRendererSize();
    checkOrientation();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", function () {
    setTimeout(resize, 120);
  });
  if (portraitMedia.addEventListener)
    portraitMedia.addEventListener("change", checkOrientation);
  else portraitMedia.addListener(checkOrientation);
  document.addEventListener("visibilitychange", function () {
    if (
      document.hidden &&
      Game.mode === "playing" &&
      !Game.paused &&
      !pausedByOrientation
    )
      pauseGame();
  });
  window.addEventListener("blur", function () {
    if (Game.mode === "playing" && !Game.paused && !pausedByOrientation)
      pauseGame();
  });
  renderer.domElement.addEventListener(
    "webglcontextlost",
    function (e) {
      e.preventDefault();
      pauseGame();
      window.__fatal(
        "3D-контекст был потерян. Обновите страницу, чтобы продолжить.",
      );
    },
    false,
  );

  /* Telegram */
  function handleBack() {
    hapticImpact("light");
    if (screenOpen("screen-settings")) {
      showScreen(screenReturn === "pause" ? "screen-pause" : "screen-start");
      return;
    }
    if (screenOpen("screen-controls") || screenOpen("screen-achievements")) {
      showScreen("screen-start");
      return;
    }
    if (screenOpen("screen-finale") || screenOpen("screen-pause")) {
      toMenu();
      return;
    }
    if (Game.mode === "playing") {
      if (Game.paused) resumeGame();
      else pauseGame();
    }
  }
  function setupHomeButton() {
    var button = $("btn-add-home"),
      tg = TelegramApp.tg;
    button.classList.add("hidden");
    if (
      !TelegramApp.active ||
      !tg ||
      !tg.checkHomeScreenStatus ||
      !tg.addToHomeScreen
    )
      return;
    try {
      tg.checkHomeScreenStatus(function (status) {
        button.classList.toggle(
          "hidden",
          status === "unsupported" || status === "added",
        );
      });
      tg.onEvent("homeScreenAdded", function () {
        button.classList.add("hidden");
      });
    } catch (error) {}
  }
  function setupTelegram() {
    if (!TelegramApp.active) return;
    TelegramApp.init();
    setupHomeButton();
    var tg = TelegramApp.tg;
    try {
      [
        "viewportChanged",
        "safeAreaChanged",
        "contentSafeAreaChanged",
        "fullscreenChanged",
      ].forEach(function (name) {
        tg.onEvent(name, resize);
      });
      tg.onEvent("deactivated", function () {
        if (Game.mode === "playing" && !Game.paused && !pausedByOrientation)
          pauseGame();
        AudioManager.pauseAll();
      });
      tg.onEvent("activated", resize);
      if (tg.BackButton) {
        tgBack = tg.BackButton;
        tgBack.onClick(handleBack);
        tgBack.hide();
      }
      var first =
        tg.initDataUnsafe &&
        tg.initDataUnsafe.user &&
        tg.initDataUnsafe.user.first_name;
      if (first) {
        $("tg-greet").textContent = "Матвей ждёт, " + first;
        $("tg-greet").classList.remove("hidden");
      }
    } catch (error) {
      console.warn("Telegram events:", error);
    }
  }

  /* Debug */
  var DEBUG = new URLSearchParams(location.search).get("debug") === "1";
  function debugAction(action) {
    if (Game.mode !== "playing" && action !== "finale") {
      resetGame();
      if (settings.sound) AudioManager.unlock();
      startGame();
    }
    if (action === "crumbs") {
      crumbs.forEach(function (c) {
        c.taken = true;
        c.mesh.visible = false;
      });
      Game.crumbs = 10;
      updateCounters();
      quest(4);
    }
    if (action === "human") {
      quest(4);
      pug.pos.set(humanRoot.position.x + 1, 0, humanRoot.position.z + 0.4);
    }
    if (action === "leash") {
      quest(5);
      Game.leashPicked = true;
      Game.hasLeash = true;
      leashWorld.visible = false;
      P.leashCarry.visible = true;
    }
    if (action === "yard") {
      doors.front.target = 1;
      Game.frontOpen = true;
      removeCollider(frontDoorCollider);
      quest(6);
      pug.pos.set(5.8, 0, -8.3);
    }
    if (action === "smells") {
      smellPoints.forEach(function (s) {
        s.done = true;
        s.group.visible = false;
      });
      Game.smells = 3;
      updateCounters();
      quest(6);
    }
    if (action === "bedroom") {
      doors.bedroom.target = 1;
      removeCollider(bedroomDoorCollider);
      Game.q7Triggered = true;
      humanRoot.position.set(1.8, 0, -0.6);
      quest(7);
    }
    if (action === "bed") {
      Game.looking = false;
      quest(7);
      pug.pos.set(bedCX, 0, 2.15);
      bedSequence();
    }
    if (action === "finale") {
      Game.mode = "playing";
      Game.finalTime = Math.max(1, Game.time);
      Game.sleeping = true;
      Game.finished = true;
      pug.pos.set(bedCX, 0, bedCZ);
      pug.groundY = bedTop;
      setPugState("sleep");
      openFinale();
    }
  }
  if (DEBUG) {
    var panel = document.createElement("div");
    panel.id = "debug-panel";
    panel.innerHTML =
      '<b>QA</b><div id="debug-info"></div>' +
      ["crumbs", "human", "leash", "yard", "smells", "bedroom", "bed", "finale"]
        .map(function (a) {
          return '<button data-debug="' + a + '">' + a + "</button>";
        })
        .join("");
    document.body.appendChild(panel);
    panel.addEventListener("click", function (e) {
      if (e.target.dataset.debug) debugAction(e.target.dataset.debug);
    });
    setInterval(function () {
      var el = $("debug-info");
      if (el)
        el.textContent =
          "mode " +
          Game.mode +
          " / q" +
          Game.quest +
          " / fps target / " +
          (TelegramApp.active ? "tg" : "browser");
    }, 800);
  }

  /* Main loop */
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = (now - lastFrame) / 1000;
    lastFrame = now;
    if (dt > 0.05) dt = 0.05;
    if (!Game.paused && !pausedByOrientation) {
      if (Game.mode === "playing") updatePlaying(dt);
      else if (Game.mode === "menu") {
        animatePug(dt);
        updateCamera(dt);
      } else if (Game.mode === "finale") {
        animatePug(dt);
        Game.snoreT -= dt;
        if (Game.snoreT <= 0) {
          Game.snoreT = rand(3, 4.5);
          pug.jolt = 1;
          AudioManager.playOne("snore", 0.45, 2200);
        }
        Game.erzIdle += dt;
        if (Game.erzIdle >= 20 && !Game.erzUnlocked) {
          Game.erzUnlocked = true;
          unlockAchievement("erzhan");
        }
        updateCamera(dt);
        updateParticles(dt);
      }
    }
    renderer.render(scene, camera);
  }

  /* debugInput=1: observe the existing input → movement pipeline without changing it. */
  (function installInputDiagnostics() {
    var debugParams = new URLSearchParams(location.search);
    if (debugParams.get("debugInput") !== "1" && debugParams.get("debugPerf") !== "1") return;
    window.MATVEY_DEBUG_BUILD_ID = "CODEX-IOS-RC4";
    var debug = {
      build: window.MATVEY_DEBUG_BUILD_ID,
      frames: 0, updates: 0, inputs: 0, collisions: 0,
      lastDt: 0, lastInput: { x: 0, z: 0, mag: 0 },
      lastReset: "boot", lastResetTime: 0, lastWriter: "none", result: null, testing: false,
      touch: { touchstart: 0, touchmove: 0, touchend: 0, touchcancel: 0, last: null },
      cameraFrozen: false, animateCalls: 0
    };
    var baseInputVector = inputVector, baseUpdatePlaying = updatePlaying, baseCollide = collide, baseResetInput = resetInput, baseUpdateCamera = updateCamera, baseAnimatePug = animatePug;
    inputVector = function () { var value = baseInputVector(); debug.inputs++; debug.lastInput = value; return value; };
    collide = function (pos, radius) { var beforeX = pos.x, beforeZ = pos.z; baseCollide(pos, radius); if (beforeX !== pos.x || beforeZ !== pos.z) { debug.collisions++; debug.lastCollision = colliders.findIndex(function (c) { return pos.x >= c.minX - radius && pos.x <= c.maxX + radius && pos.z >= c.minZ - radius && pos.z <= c.maxZ + radius; }); } };
    resetInput = function (reason) { debug.lastReset = reason || "runtime"; debug.lastResetTime = performance.now(); return baseResetInput(); };
    updateCamera = function (dt) { if (!debug.cameraFrozen) baseUpdateCamera(dt); };
    animatePug = function (dt) { debug.animateCalls++; return baseAnimatePug(dt); };
    updatePlaying = function (dt) { debug.updates++; debug.lastDt = dt; baseUpdatePlaying(dt); debug.lastWriter = "updatePlaying:pugRoot.position.set"; };
    var baseFrame = frame;
    frame = function (now) { debug.frames++; baseFrame(now); };
    function point() { return { x: pug.pos.x, z: pug.pos.z, vx: pug.vel.x, vz: pug.vel.z, rootX: pugRoot.position.x, rootZ: pugRoot.position.z }; }
    function gates() {
      if (Game.mode !== "playing") return "mode-not-playing";
      if (Game.paused) return "paused";
      if (Game.inputLocked) return "input-locked";
      if (pausedByOrientation) return "orientation-paused";
      if (sequence) return "sequence-active";
      if (Game.sleeping) return "sleeping";
      if (joystick.active) return "joystick-busy";
      return null;
    }
    function spawnCollision() { var radius = .34, spawn = { x: .6, z: -1.4 }; return { spawn: spawn, radius: radius, blocked: blocked(spawn.x, spawn.z, radius), intersections: colliders.map(function (c, index) { return { index: index, minX: c.minX, maxX: c.maxX, minZ: c.minZ, maxZ: c.maxZ }; }).filter(function (c) { return spawn.x > c.minX - radius && spawn.x < c.maxX + radius && spawn.z > c.minZ - radius && spawn.z < c.maxZ + radius; }) }; }
    ["touchstart", "touchmove", "touchend", "touchcancel"].forEach(function (type) { document.addEventListener(type, function (event) { var touch = event.changedTouches && event.changedTouches[0]; debug.touch[type]++; debug.touch.last = { type: type, targetId: event.target && event.target.id || "(none)", currentTargetId: event.currentTarget && event.currentTarget.id || "document", identifier: touch ? touch.identifier : null, clientX: touch ? touch.clientX : null, clientY: touch ? touch.clientY : null, touches: event.touches ? event.touches.length : 0, changedTouches: event.changedTouches ? event.changedTouches.length : 0, time: performance.now() }; }, true); });
    var marker = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff00ff, depthTest: false }));
    marker.name = "PUG ROOT MARKER"; marker.position.set(0, 1.3, 0); marker.renderOrder = 999; pugRoot.add(marker);
    function world(object) { var out = new THREE.Vector3(); if (object) object.getWorldPosition(out); return { x: out.x, y: out.y, z: out.z }; }
    function screen(worldPoint) { var out = new THREE.Vector3(worldPoint.x, worldPoint.y, worldPoint.z).project(camera); return { x: out.x, y: out.y, visible: out.z >= -1 && out.z <= 1 }; }
    function getState() { scene.updateMatrixWorld(true); var rootWorld = world(pugRoot), visual = glb.active ? glb.model : proceduralPug, visualWorld = world(visual), cameraWorld = world(camera), anchorWorld = world(humanRoot), info = renderer.info.render; return { build: debug.build, href: location.href, isTouch: IS_TOUCH, maxTouchPoints: navigator.maxTouchPoints, pointerEvents: "PointerEvent" in window, mode: Game.mode, paused: Game.paused, inputLocked: Game.inputLocked, orientationPause: pausedByOrientation, sequence: Boolean(sequence), sleeping: Game.sleeping, joystick: { active: joystick.active, id: joystick.id, x: joystick.x, y: joystick.y }, input: debug.lastInput, velocity: { x: pug.vel.x, z: pug.vel.z }, pug: { x: pug.pos.x, z: pug.pos.z, state: pug.state, move: pug.move, phase: pug.phase }, root: { local: { x: pugRoot.position.x, y: pugRoot.position.y, z: pugRoot.position.z }, world: rootWorld, matrixAutoUpdate: pugRoot.matrixAutoUpdate, matrixWorldNeedsUpdate: pugRoot.matrixWorldNeedsUpdate, children: pugRoot.children.length }, visual: { player: glb.active ? "GLB" : "procedural", glbActive: glb.active, proceduralVisible: proceduralPug.visible, glbVisible: glb.model ? glb.model.visible : null, world: visualWorld, proceduralLocal: { x: proceduralPug.position.x, y: proceduralPug.position.y, z: proceduralPug.position.z }, proceduralRotation: { x: proceduralPug.rotation.x, y: proceduralPug.rotation.y, z: proceduralPug.rotation.z }, proceduralScale: { x: proceduralPug.scale.x, y: proceduralPug.scale.y, z: proceduralPug.scale.z }, bodyWorld: world(P.body), hierarchy: { bodyParent: P.body.parent === proceduralPug, proceduralParent: proceduralPug.parent === pugRoot, rootParent: pugRoot.parent === scene, sceneHasRoot: scene.children.indexOf(pugRoot) >= 0, sceneHasProcedural: scene.children.indexOf(proceduralPug) >= 0 } }, marker: { world: world(marker), visible: marker.visible }, camera: { frozen: debug.cameraFrozen, world: cameraWorld, local: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, target: { x: cam.focus.x, y: cam.focus.y, z: cam.focus.z }, distanceToPug: Math.sqrt(Math.pow(cameraWorld.x-rootWorld.x,2)+Math.pow(cameraWorld.y-rootWorld.y,2)+Math.pow(cameraWorld.z-rootWorld.z,2)) }, screen: { pug: screen(rootWorld), marker: screen(world(marker)), anchor: screen(anchorWorld) }, animation: { animatePugCalls: debug.animateCalls, glbAnimation: glb.current ? glb.current._clip.name : null }, performance: { calls: info.calls, triangles: info.triangles, points: info.points, lines: info.lines, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }, frames: debug.frames, updates: debug.updates, inputs: debug.inputs, dt: debug.lastDt, collisions: debug.collisions, lastReset: debug.lastReset, lastResetTime: debug.lastResetTime, touch: debug.touch, lastWriter: debug.lastWriter, result: debug.result }; }
    function testMovement() {
      var reason = gates(); if (reason) { debug.result = { pass: false, reason: reason }; return Promise.resolve(debug.result); }
      debug.testing = true; var before = point(), marks = { frames: debug.frames, updates: debug.updates, inputs: debug.inputs, collisions: debug.collisions }, previous = { active: joystick.active, x: joystick.x, y: joystick.y, id: joystick.id };
      joystick.active = true; joystick.x = 0; joystick.y = -1;
      return new Promise(function (resolve) { setTimeout(function () { joystick.active = previous.active; joystick.x = previous.x; joystick.y = previous.y; joystick.id = previous.id; var after = point(), dx = after.x - before.x, dz = after.z - before.z, distance = Math.sqrt(dx * dx + dz * dz), rootDelta = Math.sqrt(Math.pow(after.rootX - after.x, 2) + Math.pow(after.rootZ - after.z, 2)); debug.result = { pass: distance > .15 && rootDelta < .03, reason: distance > .15 ? (rootDelta < .03 ? "ok" : "root-not-following") : "position-not-changed", before: before, after: after, distance: distance, frames: debug.frames - marks.frames, updates: debug.updates - marks.updates, inputs: debug.inputs - marks.inputs, collisions: debug.collisions - marks.collisions }; debug.testing = false; resolve(debug.result); }, 650); });
    }
    window.MatveyDebug = { getState: getState, testMovement: testMovement, getSpawnCollision: spawnCollision, toggleCameraFreeze: function () { debug.cameraFrozen = !debug.cameraFrozen; return debug.cameraFrozen; } };
    var panel = document.createElement("div"), button = document.createElement("button"), freeze = document.createElement("button"), text = document.createElement("pre");
    panel.id = "matvey-input-debug"; panel.style.cssText = "position:fixed;top:8px;right:8px;z-index:9999;max-width:310px;padding:8px;background:rgba(0,0,0,.78);color:#dff;font:11px/1.28 monospace;border-radius:8px;pointer-events:none";
    button.textContent = "TEST MOVEMENT"; button.style.cssText = "pointer-events:auto;width:100%;padding:8px;margin-bottom:6px"; button.onclick = function () { testMovement(); };
    freeze.style.cssText = button.style.cssText; freeze.onclick = function () { debug.cameraFrozen = !debug.cameraFrozen; freeze.textContent = debug.cameraFrozen ? "CAMERA FROZEN" : "CAMERA LIVE"; }; freeze.textContent = "CAMERA LIVE";
    panel.appendChild(button); panel.appendChild(freeze); panel.appendChild(text); document.body.appendChild(panel);
    setInterval(function () { var s = getState(), r = s.result, e = s.touch.last; text.textContent = "DEBUG BUILD " + s.build + "\n" + (s.camera.frozen ? "CAMERA FROZEN" : "CAMERA LIVE") + " PLAYER " + s.visual.player + " GLB " + s.visual.glbActive + " proc " + s.visual.proceduralVisible + " children " + s.root.children + "\nstate " + s.pug.state + " move " + s.pug.move.toFixed(2) + " phase " + s.pug.phase.toFixed(2) + " anim " + s.animation.animatePugCalls + " " + (s.animation.glbAnimation || "-") + "\njoy " + s.joystick.active + " #" + s.joystick.id + " " + s.joystick.x.toFixed(2) + "," + s.joystick.y.toFixed(2) + " input " + s.input.x.toFixed(2) + "," + s.input.z.toFixed(2) + "\nvel " + s.velocity.x.toFixed(2) + "," + s.velocity.z.toFixed(2) + " root W " + s.root.world.x.toFixed(2) + "," + s.root.world.z.toFixed(2) + " visual W " + s.visual.world.x.toFixed(2) + "," + s.visual.world.z.toFixed(2) + "\ncam " + s.camera.world.x.toFixed(2) + "," + s.camera.world.y.toFixed(2) + "," + s.camera.world.z.toFixed(2) + " d" + s.camera.distanceToPug.toFixed(2) + "\nscreen pug " + s.screen.pug.x.toFixed(2) + "," + s.screen.pug.y.toFixed(2) + " anchor " + s.screen.anchor.x.toFixed(2) + "," + s.screen.anchor.y.toFixed(2) + " marker " + s.screen.marker.x.toFixed(2) + "," + s.screen.marker.y.toFixed(2) + "\nperf calls " + s.performance.calls + " tris " + s.performance.triangles + " geo " + s.performance.geometries + " tex " + s.performance.textures + "\ntouch " + s.touch.touchstart + "/" + s.touch.touchmove + "/" + s.touch.touchend + "/" + s.touch.touchcancel + (e ? " " + e.type + " " + e.targetId + " #" + e.identifier : "") + "\nreset " + s.lastReset + " @" + s.lastResetTime.toFixed(0) + " coll " + s.collisions + (r ? "\nPROGRAMMATIC " + (r.pass ? "PASS" : "FAIL") + " d=" + (r.distance || 0).toFixed(3) : ""); }, 250);
  })();

  /* Start */
  tryLoadGlb();
  resetGame();
  applyQuality();
  syncSettings();
  refreshBest();
  resize();
  setupTelegram();
  checkOrientation();
  requestAnimationFrame(function (t) {
    lastFrame = t;
    frame(t);
  });
})();
