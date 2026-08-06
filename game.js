"use strict";
(function(){
if(!window.THREE){window.__fatal('Не удалось загрузить 3D-модуль. Проверьте интернет и обновите страницу.');return;}
try{
  var testCanvas=document.createElement('canvas');
  if(!(testCanvas.getContext('webgl')||testCanvas.getContext('experimental-webgl')))throw new Error('no-webgl');
}catch(error){window.__fatal('Устройство не запустило 3D-графику. Обновите Safari или откройте игру на другом устройстве.');return;}

function $(id){return document.getElementById(id)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lerp(a,b,t){return a+(b-a)*t}
function rand(a,b){return a+Math.random()*(b-a)}
function dist2(ax,az,bx,bz){var x=ax-bx,z=az-bz;return x*x+z*z}
function angleLerp(a,b,t){var d=((b-a+Math.PI*3)%(Math.PI*2))-Math.PI;return a+d*t}
function fmtTime(seconds){seconds=Math.max(0,Math.floor(seconds));var m=Math.floor(seconds/60),s=seconds%60;return(m<10?'0':'')+m+':'+(s<10?'0':'')+s}
function nowMs(){return performance&&performance.now?performance.now():Date.now()}

var IS_TOUCH=('ontouchstart'in window)||(navigator.maxTouchPoints>0);
if(IS_TOUCH)document.body.classList.add('touch');

var STORAGE={
  settings:'matvey.settings.v2',
  achievements:'matvey.ach.v2',
  best:'matvey.best.v2'
};
var settings={sound:true,music:.2,voice:.9,sfx:.72,sens:1,calm:false,quality:'medium'};
var achievements={sel:false,hitry:false,erzhan:false,king:false};
var bestTime=null;
try{
  var stored=JSON.parse(localStorage.getItem(STORAGE.settings)||'null');
  if(stored&&typeof stored==='object')Object.keys(settings).forEach(function(k){if(typeof stored[k]===typeof settings[k])settings[k]=stored[k]});
  var storedAch=JSON.parse(localStorage.getItem(STORAGE.achievements)||'null');
  if(storedAch&&typeof storedAch==='object')Object.keys(achievements).forEach(function(k){if(typeof storedAch[k]==='boolean')achievements[k]=storedAch[k]});
  var best=parseFloat(localStorage.getItem(STORAGE.best));if(Number.isFinite(best))bestTime=best;
}catch(error){}
function saveSettings(){try{localStorage.setItem(STORAGE.settings,JSON.stringify(settings))}catch(error){}}
function saveAchievements(){try{localStorage.setItem(STORAGE.achievements,JSON.stringify(achievements))}catch(error){}}
function saveBest(){try{if(bestTime!==null)localStorage.setItem(STORAGE.best,String(bestTime))}catch(error){}}

var TelegramApp={
  tg:window.Telegram&&window.Telegram.WebApp?window.Telegram.WebApp:null,
  get active(){
    if(!this.tg)return false;
    var q=new URLSearchParams(location.search);
    return Boolean(this.tg.initData||q.has('tgWebAppPlatform')||q.has('tgWebAppVersion'));
  },
  init:function(){
    if(!this.active)return;
    try{
      this.tg.ready();
      this.tg.expand();
      if(this.tg.disableVerticalSwipes)this.tg.disableVerticalSwipes();
      if(this.tg.setBackgroundColor)this.tg.setBackgroundColor('#17110d');
      if(this.tg.setHeaderColor)this.tg.setHeaderColor('#17110d');
    }catch(error){console.warn('Telegram init:',error)}
  },
  fullscreen:function(){
    if(!this.active)return;
    try{this.tg.expand();if(this.tg.requestFullscreen)this.tg.requestFullscreen()}catch(error){console.warn('Telegram fullscreen:',error)}
  },
  lockLandscape:function(){
    if(!this.active||innerWidth<=innerHeight)return;
    try{if(this.tg.lockOrientation)this.tg.lockOrientation()}catch(error){}
  }
};
function hapticImpact(style){
  try{
    var h=TelegramApp.tg&&TelegramApp.tg.HapticFeedback;
    if(h&&h.impactOccurred){h.impactOccurred(style||'light');return}
    if(navigator.vibrate)navigator.vibrate(10);
  }catch(error){}
}
function hapticNotify(type){
  try{
    var h=TelegramApp.tg&&TelegramApp.tg.HapticFeedback;
    if(h&&h.notificationOccurred){h.notificationOccurred(type||'success');return}
    if(navigator.vibrate)navigator.vibrate([16,24,16]);
  }catch(error){}
}
function setClosingConfirmation(enabled){
  if(!TelegramApp.active)return;
  try{
    if(enabled&&TelegramApp.tg.enableClosingConfirmation)TelegramApp.tg.enableClosingConfirmation();
    if(!enabled&&TelegramApp.tg.disableClosingConfirmation)TelegramApp.tg.disableClosingConfirmation();
  }catch(error){}
}

/* Optional real audio files. Missing files intentionally produce silence. */
var ASSET_PATHS={
  musicHome:'assets/audio/music/home-theme.mp3',
  musicYard:'assets/audio/music/yard-theme.mp3',
  ambientHome:'assets/audio/ambient/home-room.mp3',
  ambientYard:'assets/audio/ambient/yard-birds.mp3',
  stepsWalk:'assets/audio/sfx/steps-walk.mp3',
  stepsRun:'assets/audio/sfx/steps-run.mp3',
  sniff:'assets/audio/sfx/sniff.mp3',
  snort:'assets/audio/sfx/snort.mp3',
  whine:'assets/audio/sfx/whine.mp3',
  dig:'assets/audio/sfx/dig.mp3',
  jump:'assets/audio/sfx/jump.mp3',
  collect:'assets/audio/sfx/collect.mp3',
  achievement:'assets/audio/sfx/achievement.mp3',
  door:'assets/audio/sfx/door.mp3',
  vacuum:'assets/audio/sfx/vacuum.mp3',
  snore:'assets/audio/sfx/snore.mp3',
  ui:'assets/audio/sfx/ui-click.mp3'
};
var VOICE_PATHS={
  start:'assets/audio/voice/voice-start.mp3',
  firstCrumb:'assets/audio/voice/voice-first-crumb.mp3',
  vacuum:'assets/audio/voice/voice-vacuum.mp3',
  beg:'assets/audio/voice/voice-beg.mp3',
  leash:'assets/audio/voice/voice-leash.mp3',
  door:'assets/audio/voice/voice-door.mp3',
  smell1:'assets/audio/voice/voice-smell-1.mp3',
  smell2:'assets/audio/voice/voice-smell-2.mp3',
  smell3:'assets/audio/voice/voice-smell-3.mp3',
  bedWatched:'assets/audio/voice/voice-bed-watched.mp3',
  bedFree:'assets/audio/voice/voice-bed-free.mp3',
  dig:'assets/audio/voice/voice-dig.mp3',
  sleep:'assets/audio/voice/voice-sleep.mp3',
  finale:'assets/audio/voice/voice-finale.mp3'
};

var AudioManager={
  unlocked:false,
  cache:{},
  availability:{},
  activeOneShots:[],
  music:null,
  ambient:null,
  vacuum:null,
  area:null,
  lastPlayed:{},
  unlock:function(){
    this.unlocked=true;
    try{
      var silent=new Audio();
      silent.volume=0;
      var p=silent.play();
      if(p&&p.catch)p.catch(function(){});
    }catch(error){}
  },
  effective:function(category,base){
    if(!settings.sound)return 0;
    var v=category==='music'?settings.music:(category==='voice'?settings.voice:settings.sfx);
    return clamp((base===undefined?1:base)*v,0,1);
  },
  probe:function(path){
    var self=this;
    if(this.availability[path]!==undefined)return Promise.resolve(this.availability[path]);
    return fetch(path,{method:'HEAD',cache:'force-cache'}).then(function(r){
      self.availability[path]=r.ok;return r.ok;
    }).catch(function(){self.availability[path]=false;return false});
  },
  make:function(path,loop){
    var audio=new Audio(path);
    audio.preload='none';
    audio.loop=Boolean(loop);
    audio.playsInline=true;
    return audio;
  },
  playOne:function(key,volume,cooldown){
    if(!this.unlocked||!settings.sound)return Promise.resolve(false);
    var path=ASSET_PATHS[key];if(!path)return Promise.resolve(false);
    var t=nowMs(),wait=cooldown===undefined?90:cooldown;
    if(this.lastPlayed[key]&&t-this.lastPlayed[key]<wait)return Promise.resolve(false);
    this.lastPlayed[key]=t;
    var self=this;
    return this.probe(path).then(function(ok){
      if(!ok)return false;
      var a=self.make(path,false);
      a.volume=self.effective('sfx',volume===undefined?1:volume);
      self.activeOneShots.push(a);
      var cleanup=function(){var i=self.activeOneShots.indexOf(a);if(i>=0)self.activeOneShots.splice(i,1)};
      a.addEventListener('ended',cleanup,{once:true});
      a.addEventListener('error',cleanup,{once:true});
      var p=a.play();
      if(p&&p.catch)p.catch(cleanup);
      return true;
    });
  },
  stopLoop:function(name){
    var a=this[name];
    if(a){try{a.pause();a.currentTime=0}catch(error){}this[name]=null}
  },
  startLoop:function(name,key,category,volume){
    var self=this,path=ASSET_PATHS[key];
    if(!this.unlocked||!settings.sound||!path)return Promise.resolve(false);
    if(this[name])return Promise.resolve(true);
    return this.probe(path).then(function(ok){
      if(!ok)return false;
      var a=self.make(path,true);
      a.volume=self.effective(category,volume);
      self[name]=a;
      var p=a.play();
      if(p&&p.catch)p.catch(function(){if(self[name]===a)self[name]=null});
      return true;
    });
  },
  setArea:function(area){
    if(this.area===area)return;
    this.area=area;
    this.stopLoop('music');this.stopLoop('ambient');
    if(!this.unlocked||!settings.sound)return;
    if(area==='yard'){
      this.startLoop('music','musicYard','music',.5);
      this.startLoop('ambient','ambientYard','music',.32);
    }else{
      this.startLoop('music','musicHome','music',.5);
      this.startLoop('ambient','ambientHome','music',.22);
    }
  },
  startVacuum:function(){return this.startLoop('vacuum','vacuum','sfx',.28)},
  stopVacuum:function(){this.stopLoop('vacuum')},
  updateVacuum:function(distance){
    if(!this.vacuum)return;
    var spatial=clamp(1-distance/8,0,.32);
    this.vacuum.volume=this.effective('sfx',spatial);
  },
  refreshVolumes:function(){
    if(this.music)this.music.volume=this.effective('music',.5);
    if(this.ambient)this.ambient.volume=this.effective('music',this.area==='yard'?.32:.22);
    if(this.vacuum)this.vacuum.volume=this.effective('sfx',.18);
  },
  duck:function(on){
    if(this.music)this.music.volume=this.effective('music',on?.13:.5);
    if(this.ambient)this.ambient.volume=this.effective('music',on?.08:(this.area==='yard'?.32:.22));
  },
  pauseAll:function(){
    ['music','ambient','vacuum'].forEach(function(n){var a=AudioManager[n];if(a)try{a.pause()}catch(error){}});
    this.activeOneShots.forEach(function(a){try{a.pause()}catch(error){}});this.activeOneShots.length=0;
  },
  resumeLoops:function(){
    if(!this.unlocked||!settings.sound)return;
    ['music','ambient','vacuum'].forEach(function(n){
      var a=AudioManager[n];if(a){var p=a.play();if(p&&p.catch)p.catch(function(){})}
    });
  },
  stopAll:function(){
    this.pauseAll();
    this.stopLoop('music');this.stopLoop('ambient');this.stopLoop('vacuum');
    this.area=null;
  }
};

var voiceState={speaking:false,until:0,lastKey:'',lastAt:0,bubbleTimer:null};
function chooseRussianVoice(){
  if(!('speechSynthesis'in window))return null;
  var voices=speechSynthesis.getVoices();
  var ru=voices.filter(function(v){return(/^ru/i).test(v.lang||'')});
  if(!ru.length)return null;
  var maleHints=/male|муж|yuri|pavel|maxim|milena/i;
  return ru.find(function(v){return maleHints.test(v.name||'')})||ru[0];
}
function hideVoiceBubble(){
  $('voice-bubble').classList.remove('show');
}
function stopVoice(){
  if(voiceState.bubbleTimer)clearTimeout(voiceState.bubbleTimer);
  voiceState.bubbleTimer=null;voiceState.speaking=false;voiceState.until=0;
  try{if('speechSynthesis'in window)speechSynthesis.cancel()}catch(error){}
  AudioManager.duck(false);hideVoiceBubble();
}
function speakMatvey(key,text,options){
  options=options||{};
  var t=nowMs();
  if(!options.force&&voiceState.lastKey===key&&t-voiceState.lastAt<12000)return;
  if(!options.force&&voiceState.speaking&&t-voiceState.lastAt<1200)return;
  voiceState.lastKey=key;voiceState.lastAt=t;
  if(voiceState.bubbleTimer)clearTimeout(voiceState.bubbleTimer);
  $('voice-text').textContent='«'+text+'»';
  $('voice-bubble').classList.add('show');
  var estimated=clamp(text.length*75,2600,6500);
  voiceState.speaking=true;voiceState.until=t+estimated;
  voiceState.bubbleTimer=setTimeout(function(){hideVoiceBubble();voiceState.speaking=false;AudioManager.duck(false)},estimated+350);
  if(!settings.sound||settings.voice<=0)return;
  AudioManager.duck(true);
  var path=VOICE_PATHS[key];
  var fallback=function(){
    if(!('speechSynthesis'in window)){AudioManager.duck(false);return}
    try{
      speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance(text);
      u.lang='ru-RU';u.rate=.86;u.pitch=.72;u.volume=settings.voice;
      var voice=chooseRussianVoice();if(voice)u.voice=voice;
      u.onend=function(){voiceState.speaking=false;AudioManager.duck(false)};
      u.onerror=function(){voiceState.speaking=false;AudioManager.duck(false)};
      speechSynthesis.speak(u);
    }catch(error){AudioManager.duck(false)}
  };
  if(path&&AudioManager.unlocked){
    AudioManager.probe(path).then(function(ok){
      if(!ok){fallback();return}
      var a=AudioManager.make(path,false);
      a.volume=AudioManager.effective('voice',1);
      a.onended=function(){voiceState.speaking=false;AudioManager.duck(false)};
      a.onerror=fallback;
      var p=a.play();if(p&&p.catch)p.catch(fallback);
    });
  }else fallback();
}

/* UI */
var screenIds=['screen-start','screen-controls','screen-settings','screen-achievements','screen-pause','screen-finale'];
var screenReturn='start',tgBack=null,portraitBackHidden=false;
function screenOpen(id){return !$(id).classList.contains('hidden')}
function updateBack(){
  if(!tgBack)return;
  try{
    if(portraitBackHidden){tgBack.hide();return}
    if(screenOpen('screen-start'))tgBack.hide();else tgBack.show();
  }catch(error){}
}
function showScreen(id){
  screenIds.forEach(function(s){$(s).classList.toggle('hidden',s!==id)});
  if(!id)screenIds.forEach(function(s){$(s).classList.add('hidden')});
  updateBack();
}
function setQuest(text){$('quest-text').textContent=text}
function updateCounters(){
  $('crumbs-val').textContent=Game.crumbs+' / 10';
  $('smells-val').textContent=Game.smells+' / 3';
}
function setMood(value){Game.mood=clamp(value,0,100);$('mood-fill').style.width=Game.mood+'%'}
function setPrompt(text,short){
  $('prompt').classList.toggle('hidden',!text);
  if(text)$('prompt').textContent=text;
  $('btn-action-label').textContent=short||'ДЕЙСТВИЕ';
}
function setHold(value){
  $('hold-wrap').classList.toggle('hidden',value===null);
  if(value!==null)$('hold-fill').style.width=Math.round(clamp(value,0,1)*100)+'%';
}
function setWatch(looking){
  var el=$('watch-ind');
  if(Game.quest!==7||Game.sleeping){el.classList.add('hidden');return}
  el.className=looking?'warn':'ok';
  el.id='watch-ind';
  el.textContent=looking?'👀 Свидетель смотрит':'🐾 Оперативное окно';
}
var toastBusy=false,toastQueue=[];
function showToast(icon,title,desc){
  toastQueue.push({icon:icon,title:title,desc:desc});
  if(toastBusy)return;
  (function pump(){
    if(!toastQueue.length){toastBusy=false;return}
    toastBusy=true;var item=toastQueue.shift();
    $('ach-toast-title').textContent=item.icon+' '+item.title;
    $('ach-toast-desc').textContent=item.desc;
    $('ach-toast').classList.add('show');
    setTimeout(function(){$('ach-toast').classList.remove('show');setTimeout(pump,350)},2800);
  })();
}
var ACHIEVEMENTS=[
  {key:'sel',icon:'🐟',title:'Селёдочник',desc:'Найти рыбный жетон под диваном.'},
  {key:'hitry',icon:'🕶️',title:'Хитрый мопс',desc:'Ни разу не попасться пылесосу.'},
  {key:'erzhan',icon:'😴',title:'Ержан устал',desc:'20 секунд смотреть, как Матвей спит.'},
  {key:'king',icon:'👑',title:'Король Рассола',desc:'Закончить день и найти жетон.'}
];
function unlockAchievement(key){
  if(achievements[key])return;
  achievements[key]=true;saveAchievements();hapticNotify('success');AudioManager.playOne('achievement',.8,500);
  var d=ACHIEVEMENTS.find(function(x){return x.key===key});
  if(d)showToast(d.icon,'Достижение: '+d.title,d.desc);
}
function renderAchievements(){
  $('ach-list').innerHTML=ACHIEVEMENTS.map(function(d){
    return '<div class="ach-item '+(achievements[d.key]?'':'locked')+'"><div class="ach-ico">'+(achievements[d.key]?d.icon:'🔒')+'</div><div><div class="ach-title">'+d.title+'</div><div class="ach-desc">'+d.desc+'</div></div></div>';
  }).join('');
}
function refreshBest(){
  $('best-line').textContent=bestTime===null?'Рекорд пока не установлен. Матвей оценивает ситуацию.':'Лучший рабочий день: '+fmtTime(bestTime);
}
function syncSettings(){
  $('set-sound').classList.toggle('on',settings.sound);
  $('set-calm').classList.toggle('on',settings.calm);
  $('set-music').value=settings.music;$('set-voice').value=settings.voice;$('set-sfx').value=settings.sfx;$('set-sens').value=settings.sens;
  [['low','low'],['med','medium'],['high','high']].forEach(function(q){$('q-'+q[0]).classList.toggle('on',settings.quality===q[1])});
  $('btn-mute').textContent=settings.sound?'🔊':'🔇';
}

/* Three.js */
var renderer,scene,camera,dirLight,roomLight;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false})}
catch(error){window.__fatal('Не удалось создать 3D-сцену на этом устройстве.');return}
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.76;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.style.touchAction='none';
$('canvas-holder').appendChild(renderer.domElement);
scene=new THREE.Scene();scene.background=new THREE.Color(0x718a88);
camera=new THREE.PerspectiveCamera(54,1,.1,110);
var hemi=new THREE.HemisphereLight(0xffe7c8,0x40524a,.53);scene.add(hemi);
dirLight=new THREE.DirectionalLight(0xffd5a6,1.05);dirLight.position.set(10,15,-7);dirLight.castShadow=true;dirLight.shadow.mapSize.set(1024,1024);dirLight.shadow.camera.left=-18;dirLight.shadow.camera.right=18;dirLight.shadow.camera.top=18;dirLight.shadow.camera.bottom=-18;dirLight.shadow.camera.near=2;dirLight.shadow.camera.far=44;dirLight.shadow.bias=-.0015;scene.add(dirLight);
roomLight=new THREE.PointLight(0xffbf76,.4,20,2);roomLight.position.set(-2,4,1);scene.add(roomLight);

function mat(color,rough,metal){
  return new THREE.MeshStandardMaterial({color:color,roughness:rough===undefined?.86:rough,metalness:metal||0});
}
var M={
  wall:mat(0xcab59b,.94),trim:mat(0x8d6c4c,.9),wood:mat(0x805531,.84),woodDark:mat(0x4a3023,.88),
  floor:mat(0x8e5f39,.8),kitchenFloor:mat(0x6d6a61,.9),grass:mat(0x577f43,.95),grass2:mat(0x6f984f,.95),earth:mat(0x73553a,.98),
  sofa:mat(0x284a4c,.95),sofaDark:mat(0x193638,.98),gold:mat(0xd79942,.86),red:mat(0x8f3540,.93),red2:mat(0xbc5860,.92),
  blue:mat(0x315b88,.72),blueDark:mat(0x1f3b5c,.76),cream:mat(0xdac9ae,.9),sheet:mat(0xa93643,.94),
  metal:mat(0x7c8588,.35,.45),fridge:mat(0x8d9799,.38,.28),black:mat(0x181717,.45),robot:mat(0x252a2e,.5,.25),
  pug:mat(0xb99a70,.92),pugLight:mat(0xcbae84,.94),pugShade:mat(0x8c6c4e,.94),pugDark:mat(0x29211d,.82),pugGrey:mat(0x665d55,.9),
  eye:mat(0x2a160f,.18),nose:mat(0x0d0d0c,.25),tongue:mat(0xc96879,.72),skin:mat(0xb98666,.9),pants:mat(0x3f4351,.93),sweater:mat(0x3d7270,.94),
  leaf:mat(0x426f3b,.94),leaf2:mat(0x6e9345,.94),path:mat(0x9e8f79,.95),crumb:mat(0xf2b84d,.72)
};
function mesh(geometry,material,x,y,z,parent,cast,receive){
  var m=new THREE.Mesh(geometry,material);m.position.set(x||0,y||0,z||0);m.castShadow=Boolean(cast);m.receiveShadow=Boolean(receive);(parent||scene).add(m);return m;
}
function box(w,h,d,material,x,y,z,parent,cast,receive){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent,cast,receive)}
function sphere(rx,ry,rz,material,x,y,z,parent,segments){
  var m=mesh(new THREE.SphereGeometry(1,segments||16,Math.max(10,(segments||16)-4)),material,x,y,z,parent,true,false);m.scale.set(rx,ry,rz);return m;
}
function cylinder(rt,rb,h,material,x,y,z,parent,segments){
  return mesh(new THREE.CylinderGeometry(rt,rb,h,segments||12),material,x,y,z,parent,true,false);
}
var colliders=[];
function addCollider(minX,maxX,minZ,maxZ){var c={minX:minX,maxX:maxX,minZ:minZ,maxZ:maxZ};colliders.push(c);return c}
function removeCollider(c){var i=colliders.indexOf(c);if(i>=0)colliders.splice(i,1)}
function ensureCollider(c){if(colliders.indexOf(c)<0)colliders.push(c)}
function wallX(x,z0,z1){
  box(.28,2.55,Math.abs(z1-z0),M.wall,x,1.275,(z0+z1)/2,null,false,true);
  box(.34,.13,Math.abs(z1-z0),M.trim,x,.065,(z0+z1)/2,null,false,true);
  return addCollider(x-.16,x+.16,Math.min(z0,z1),Math.max(z0,z1));
}
function wallZ(z,x0,x1){
  box(Math.abs(x1-x0),2.55,.28,M.wall,(x0+x1)/2,1.275,z,null,false,true);
  box(Math.abs(x1-x0),.13,.34,M.trim,(x0+x1)/2,.065,z,null,false,true);
  return addCollider(Math.min(x0,x1),Math.max(x0,x1),z-.16,z+.16);
}
function makeFloor(){
  var ground=mesh(new THREE.PlaneGeometry(90,90),M.grass,0,-.025,0);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
  var apartment=mesh(new THREE.PlaneGeometry(20,14),M.floor,0,0,0);apartment.rotation.x=-Math.PI/2;apartment.receiveShadow=true;
  for(var i=-9;i<=9;i+=.65){
    box(.018,.008,13.8,M.woodDark,i,.006,0,null,false,false);
  }
  for(var j=-6.5;j<=6.5;j+=2.2)box(19.8,.009,.018,M.woodDark,0,.007,j,null,false,false);
  var kitchen=mesh(new THREE.PlaneGeometry(6.8,13.8),M.kitchenFloor,-6.5,.008,0);kitchen.rotation.x=-Math.PI/2;kitchen.receiveShadow=true;
  var yard=mesh(new THREE.PlaneGeometry(9,6.9),M.grass2,6,.006,-10.5);yard.rotation.x=-Math.PI/2;yard.receiveShadow=true;
  for(var k=0;k<26;k++){
    var patch=mesh(new THREE.CircleGeometry(rand(.08,.28),8),Math.random()>.4?M.grass:M.earth,rand(1.8,10.2),.012,rand(-13.7,-7.2));
    patch.rotation.x=-Math.PI/2;patch.rotation.z=rand(0,Math.PI);
  }
  var path=mesh(new THREE.PlaneGeometry(1.7,1.7),M.path,5.8,.015,-7.9);path.rotation.x=-Math.PI/2;path.receiveShadow=true;
}
makeFloor();
wallX(-10,-7.15,7.15);wallX(10,-7.15,7.15);wallZ(7,-10.15,10.15);wallZ(-7,-10.15,5);wallZ(-7,6.6,10.15);
wallX(-3,-7,-1.2);wallX(-3,1.2,7);wallX(4,-7,-5);wallX(4,-2.4,2);wallX(4,4.2,7);wallZ(0,3.84,10.16);

/* Windows and warm interior accents */
[-1.4,1.6].forEach(function(x){
  var glow=mesh(new THREE.PlaneGeometry(1.65,1.18),new THREE.MeshBasicMaterial({color:0x87a9a8}),x,1.55,6.84);glow.rotation.y=Math.PI;
  box(1.82,.08,.08,M.trim,x,2.17,6.85);box(1.82,.08,.08,M.trim,x,.9,6.85);box(.08,1.35,.08,M.trim,x-.88,1.54,6.85);box(.08,1.35,.08,M.trim,x+.88,1.54,6.85);
});

/* Fence and yard */
function fenceX(x,z0,z1){
  box(.14,1.06,Math.abs(z1-z0),M.woodDark,x,.53,(z0+z1)/2,null,true,false);
  for(var i=0;i<7;i++)box(.22,1.25,.2,M.wood,x,.62,z0+(z1-z0)*i/6,null,true,false);
  addCollider(x-.18,x+.18,Math.min(z0,z1),Math.max(z0,z1));
}
function fenceZ(z,x0,x1){
  box(Math.abs(x1-x0),1.06,.14,M.woodDark,(x0+x1)/2,.53,z,null,true,false);
  for(var i=0;i<7;i++)box(.2,1.25,.22,M.wood,x0+(x1-x0)*i/6,.62,z,null,true,false);
  addCollider(Math.min(x0,x1),Math.max(x0,x1),z-.18,z+.18);
}
fenceX(1.5,-14,-7.05);fenceX(10.5,-14,-7.05);fenceZ(-14,1.5,10.5);
var treePos={x:8.8,z:-12.1},benchPos={x:3.5,z:-12.6};
cylinder(.15,.22,1.35,M.woodDark,treePos.x,.675,treePos.z);
[[0,1.72,0,.76],[.43,1.48,.18,.52],[-.42,1.5,-.22,.55]].forEach(function(p){sphere(p[3],p[3]*.86,p[3],Math.random()>.5?M.leaf:M.leaf2,treePos.x+p[0],p[1],treePos.z+p[2],null,12)});
addCollider(treePos.x-.29,treePos.x+.29,treePos.z-.29,treePos.z+.29);
box(1.5,.09,.42,M.wood,benchPos.x,.43,benchPos.z,null,true,false);box(1.5,.45,.08,M.wood,benchPos.x,.66,benchPos.z-.2,null,true,false);
box(.09,.44,.35,M.woodDark,benchPos.x-.62,.22,benchPos.z,null,true,false);box(.09,.44,.35,M.woodDark,benchPos.x+.62,.22,benchPos.z,null,true,false);
addCollider(benchPos.x-.8,benchPos.x+.8,benchPos.z-.3,benchPos.z+.3);

/* Kitchen */
box(.78,.9,5.6,M.cream,-9.55,.45,3.85,null,true,true);box(.88,.07,5.7,M.wood,-9.5,.94,3.85,null,true,false);
box(.82,.75,3.25,M.cream,-9.52,1.88,5,null,true,false);
box(.9,1.9,.92,M.fridge,-9.28,.95,-5.55,null,true,false);box(.92,.045,.94,M.metal,-9.28,1.22,-5.55);
addCollider(-10,-9.08,1.0,6.8);addCollider(-9.8,-8.78,-6.08,-5.05);
box(1.55,.09,1.12,M.wood,-5.6,.76,3.5,null,true,false);
[[-.65,-.45],[.65,-.45],[-.65,.45],[.65,.45]].forEach(function(o){box(.1,.72,.1,M.woodDark,-5.6+o[0],.36,3.5+o[1],null,true,false)});
addCollider(-6.35,-4.85,2.92,4.08);
function chair(x,z,yaw){
  var g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=yaw;scene.add(g);
  box(.52,.07,.52,M.woodDark,0,.45,0,g,true,false);box(.52,.56,.07,M.woodDark,0,.75,-.23,g,true,false);
  [[-.2,-.2],[.2,-.2],[-.2,.2],[.2,.2]].forEach(function(o){box(.065,.44,.065,M.woodDark,o[0],.22,o[1],g,true,false)});
  addCollider(x-.29,x+.29,z-.29,z+.29);
}
chair(-7,3.5,Math.PI/2);chair(-4.3,3.5,-Math.PI/2);chair(-5.6,5,Math.PI);
cylinder(.18,.13,.09,M.red,-4.05,.055,6.28,null,14);cylinder(.15,.11,.075,M.metal,-3.67,.048,6.28,null,14);

/* Living room */
var sofa=new THREE.Group();sofa.position.set(.6,0,-3.3);scene.add(sofa);
box(2.7,.44,1.02,M.sofa,0,.22,0,sofa,true,false);box(2.7,.58,.27,M.sofaDark,0,.64,.42,sofa,true,false);box(.27,.32,1.02,M.sofaDark,-1.32,.56,0,sofa,true,false);box(.27,.32,1.02,M.sofaDark,1.32,.56,0,sofa,true,false);
box(1.08,.16,.78,M.gold,-.6,.49,-.03,sofa,true,false);box(1.08,.16,.78,M.red2,.6,.49,-.03,sofa,true,false);
sphere(.42,.36,.14,M.red,-.86,.68,.29,sofa,12);sphere(.42,.36,.14,M.cream,.86,.68,.29,sofa,12);
addCollider(-.8,2,-3.95,-2.68);
var rug=mesh(new THREE.CircleGeometry(1.55,30),M.gold,.6,.013,-1.45);rug.rotation.x=-Math.PI/2;rug.receiveShadow=true;
box(1.9,.44,.48,M.woodDark,.6,.22,-6.58,null,true,false);box(1.65,.96,.1,M.black,.6,1.34,-6.78,null,true,false);
mesh(new THREE.PlaneGeometry(1.48,.82),new THREE.MeshBasicMaterial({color:0x2f5a5e}),.6,1.34,-6.72);
addCollider(-.38,1.58,-6.95,-6.3);
cylinder(.23,.18,.35,M.red,3.4,.18,-6.2);cylinder(.05,.065,.55,M.woodDark,3.4,.58,-6.2);
[[0,.98,0,.32],[.17,1.18,.1,.24],[-.16,1.19,-.08,.23]].forEach(function(p){sphere(p[3],p[3]*.8,p[3],M.leaf,3.4+p[0],p[1],-6.2+p[2],null,10)});
addCollider(3.08,3.72,-6.52,-5.88);

/* Hall */
box(1.35,.025,.82,M.red2,5.8,.018,-6.08);[[5,-6.34,.25],[5.34,-6.4,-.25],[5.7,-6.3,.55]].forEach(function(s){var shoe=box(.13,.1,.31,M.woodDark,s[0],.05,s[1]);shoe.rotation.y=s[2]});
box(.54,.04,.92,M.woodDark,9.58,1.1,-4.3);box(.06,.13,.06,M.metal,9.48,1.22,-4.3);

/* Bedroom */
var bedTop=.63,bedCX=7.3,bedCZ=4.3,crumples=new THREE.Group();scene.add(crumples);
box(2.55,.34,3.14,M.woodDark,bedCX,.17,bedCZ,null,true,false);box(2.38,.28,2.98,M.cream,bedCX,.46,bedCZ,null,true,true);
box(2.34,.055,2.92,M.sheet,bedCX,.63,bedCZ,null,false,true);
sphere(.62,.18,.42,M.cream,bedCX-.58,.73,5.42,null,14);sphere(.62,.18,.42,M.cream,bedCX+.58,.73,5.42,null,14);
box(2.55,.98,.15,M.woodDark,bedCX,.75,5.92,null,true,false);box(.58,.52,.58,M.wood,5.55,.26,5.5,null,true,false);
var bedRug=mesh(new THREE.CircleGeometry(.95,24),M.blue,7.3,.014,2.1);bedRug.rotation.x=-Math.PI/2;
addCollider(6,8.6,2.7,5.96);addCollider(5.2,5.9,5.15,5.85);
for(var ci=0;ci<10;ci++){var c=box(rand(.22,.52),.06,rand(.18,.44),M.sheet,bedCX+rand(-.95,.95),.66,bedCZ+rand(-1.1,1.1),crumples);c.rotation.y=rand(-.8,.8);c.rotation.z=rand(-.13,.13);c.visible=false}

/* Dog bed and props */
var dogBed=new THREE.Group();dogBed.position.set(2.5,0,5.5);scene.add(dogBed);
sphere(.72,.14,.52,M.blue,0,.13,0,dogBed,16);sphere(.56,.1,.39,M.blueDark,0,.22,0,dogBed,16);addCollider(1.78,3.22,4.98,6.02);
sphere(.09,.09,.09,M.red,-1.9,.09,-.7,null,12);
box(.28,.05,.18,M.gold,1.16,.48,-6.54);box(.2,.045,.15,M.blue,1.12,.52,-6.54);

/* Doors */
function makeDoor(hingeX,hingeZ,axis,width){
  var g=new THREE.Group();g.position.set(hingeX,0,hingeZ);scene.add(g);
  if(axis==='x')box(width,2.18,.13,M.wood,width/2,1.09,0,g,true,false);else box(.13,2.18,width,M.wood,0,1.09,width/2,g,true,false);
  return g;
}
var frontDoor=makeDoor(5,-7,'x',1.6),bedroomDoor=makeDoor(4,2,'z',2.2);
var frontDoorCollider=addCollider(4.93,6.67,-7.23,-6.77),bedroomDoorCollider=addCollider(3.77,4.23,1.93,4.27);
var doors={front:{value:0,target:0,group:frontDoor},bedroom:{value:0,target:0,group:bedroomDoor}};

/* Matvey */
var pugRoot=new THREE.Group();scene.add(pugRoot);
var proceduralPug=new THREE.Group();pugRoot.add(proceduralPug);
var P={};
(function buildPug(){
  P.body=sphere(.37,.27,.47,M.pug,0,.31,-.03,proceduralPug,22);
  P.chest=sphere(.34,.29,.25,M.pugLight,0,.33,.24,proceduralPug,20);
  P.rear=sphere(.35,.285,.28,M.pug,0,.33,-.30,proceduralPug,20);
  P.belly=sphere(.31,.18,.36,M.pugLight,0,.19,-.01,proceduralPug,18);
  P.stripe=sphere(.095,.035,.37,M.pugShade,0,.53,-.08,proceduralPug,14);
  P.stripe.rotation.x=.08;
  P.neckFold1=new THREE.Mesh(new THREE.TorusGeometry(.21,.035,8,22),M.pugShade);P.neckFold1.position.set(0,.48,.18);P.neckFold1.rotation.x=Math.PI/2-.28;proceduralPug.add(P.neckFold1);
  P.neckFold2=new THREE.Mesh(new THREE.TorusGeometry(.19,.028,8,22),M.pugLight);P.neckFold2.position.set(0,.51,.22);P.neckFold2.rotation.x=Math.PI/2-.28;proceduralPug.add(P.neckFold2);
  P.head=new THREE.Group();P.head.position.set(0,.58,.37);proceduralPug.add(P.head);
  P.skull=sphere(.23,.205,.18,M.pug,0,0,0,P.head,22);
  P.foreheadStripe=sphere(.05,.115,.035,M.pugShade,0,.065,.145,P.head,14);
  P.cheeks=[];
  [-1,1].forEach(function(side){
    P.cheeks.push(sphere(.105,.09,.09,M.pug,side*.105,-.055,.07,P.head,16));
  });
  P.mask=sphere(.165,.125,.105,M.pugDark,0,-.045,.105,P.head,18);
  P.muzzles=[];
  [-1,1].forEach(function(side){
    P.muzzles.push(sphere(.072,.057,.068,M.pugDark,side*.052,-.082,.155,P.head,14));
  });
  P.chin=sphere(.088,.043,.062,M.pugGrey,0,-.13,.126,P.head,14);
  P.jaw=new THREE.Group();P.jaw.position.set(0,-.116,.14);P.head.add(P.jaw);
  P.lowerLip=sphere(.07,.021,.04,M.pugDark,0,0,0,P.jaw,12);
  P.nose=sphere(.048,.038,.035,M.nose,0,-.043,.205,P.head,14);
  P.eyes=[];
  [-1,1].forEach(function(side,index){
    var e=sphere(index===0?.062:.06,index===0?.066:.064,.057,M.eye,side*(index===0?.105:.101),.027,.145,P.head,18);
    sphere(.016,.017,.008,new THREE.MeshBasicMaterial({color:0xffffff}),side*.012,.018,.052,e,8).castShadow=false;
    sphere(.007,.007,.004,new THREE.MeshBasicMaterial({color:0xffffff}),-side*.017,-.014,.054,e,6).castShadow=false;
    P.eyes.push(e);
    var brow=sphere(.053,.018,.028,M.pugShade,side*.103,.102,.136,P.head,12);brow.rotation.z=-side*.22;
  });
  P.ears=[];
  [-1,1].forEach(function(side){
    var ear=sphere(.064,.085,.038,M.pugDark,side*.165,.13,-.018,P.head,14);ear.rotation.set(.48,0,-side*.48);P.ears.push(ear);
  });
  for(var f=0;f<3;f++){
    var fold=new THREE.Mesh(new THREE.TorusGeometry(.095-f*.021,.008,6,16,Math.PI*.85),M.pugShade);
    fold.position.set(0,.13-f*.03,.115);fold.rotation.x=-.55;fold.rotation.z=.23;P.head.add(fold);
  }
  P.tongue=sphere(.034,.014,.05,M.tongue,0,-.135,.17,P.head,10);P.tongue.visible=false;
  function leg(x,z,front){
    var g=new THREE.Group();g.position.set(x,.31,z);proceduralPug.add(g);
    cylinder(.062,.069,front?.235:.22,M.pug,0,-.11,0,g,12);
    sphere(.072,.047,.09,M.pugShade,0,-.245,.025,g,12);
    return g;
  }
  P.legFL=leg(.15,.23,true);P.legFR=leg(-.15,.23,true);P.legRL=leg(.16,-.28,false);P.legRR=leg(-.16,-.28,false);
  P.tailGroup=new THREE.Group();P.tailGroup.position.set(0,.51,-.48);proceduralPug.add(P.tailGroup);
  var tail=new THREE.Mesh(new THREE.TorusGeometry(.074,.039,9,18,Math.PI*1.83),M.pug);tail.rotation.x=Math.PI/2;tail.rotation.z=.45;P.tailGroup.add(tail);
  P.harness=new THREE.Group();proceduralPug.add(P.harness);
  var neck=new THREE.Mesh(new THREE.TorusGeometry(.205,.021,8,24),M.blue);neck.position.set(0,.48,.21);neck.rotation.x=Math.PI/2-.28;P.harness.add(neck);
  var chestRing=new THREE.Mesh(new THREE.TorusGeometry(.29,.025,8,24),M.blue);chestRing.position.set(0,.34,.03);chestRing.scale.z=.82;chestRing.rotation.x=Math.PI/2;P.harness.add(chestRing);
  box(.052,.29,.04,M.blue,0,.32,.31,P.harness,true,false);
  box(.06,.045,.18,M.blueDark,0,.55,.02,P.harness,true,false);
  P.leashCarry=new THREE.Group();P.leashCarry.position.set(0,-.18,.27);P.head.add(P.leashCarry);
  var loop=new THREE.Mesh(new THREE.TorusGeometry(.12,.02,8,18),M.red);loop.rotation.x=.55;P.leashCarry.add(loop);
  box(.035,.23,.035,M.red,0,-.14,.05,P.leashCarry,true,false).rotation.x=.4;P.leashCarry.visible=false;
})();
var pug={pos:new THREE.Vector3(.6,0,-1.4),vel:new THREE.Vector3(),yaw:-Math.PI/2,state:'lie',stateT:0,phase:0,move:0,groundY:0,visualY:0,onBed:false,forcedYaw:null,blinkT:2,blink:.0,lookT:3,lookTarget:0,look:0,lickT:5,lick:0,jolt:0,digClock:0,settle:0};
var glb={active:false,model:null,mixer:null,actions:{},current:null};
function tryLoadGlb(){
  if(!THREE.GLTFLoader)return;
  try{
    new THREE.GLTFLoader().load('assets/matvey.glb',function(gltf){
      if(!gltf.scene||!gltf.animations||gltf.animations.length<2)return;
      var box3=new THREE.Box3().setFromObject(gltf.scene),size=new THREE.Vector3();box3.getSize(size);
      if(!size.y||size.y/Math.max(size.x,size.z)<.55)return;
      var scale=.66/size.y;gltf.scene.scale.setScalar(scale);
      var corrected=new THREE.Box3().setFromObject(gltf.scene);gltf.scene.position.y-=corrected.min.y;
      gltf.scene.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
      pugRoot.add(gltf.scene);proceduralPug.visible=false;glb.active=true;glb.model=gltf.scene;glb.mixer=new THREE.AnimationMixer(gltf.scene);
      gltf.animations.forEach(function(clip){
        var n=(clip.name||'').toLowerCase(),key='';
        if(/run/.test(n))key='run';else if(/walk/.test(n))key='walk';else if(/sit/.test(n))key='sit';else if(/sniff/.test(n))key='sniff';else if(/dig/.test(n))key='dig';else if(/sleep|lie/.test(n))key='sleep';else if(/idle|stand/.test(n))key='idle';
        if(key&&!glb.actions[key])glb.actions[key]=glb.mixer.clipAction(clip);
      });
    },undefined,function(){});
  }catch(error){}
}
function setPugState(state){if(pug.state!==state){pug.state=state;pug.stateT=0}}
function glbAnimationKey(){
  if(pug.state==='walk')return pug.move>.72?'run':'walk';
  if(pug.state==='beg'||pug.state==='sit')return'sit';
  if(pug.state==='sniff')return'sniff';
  if(pug.state==='dig'||pug.state==='scratch')return'dig';
  if(pug.state==='sleep'||pug.state==='lie')return'sleep';
  return'idle';
}
function animatePug(dt){
  pug.stateT+=dt;
  if(glb.active){
    var action=glb.actions[glbAnimationKey()]||glb.actions.idle;
    if(action&&action!==glb.current){if(glb.current)glb.current.fadeOut(.22);action.reset().fadeIn(.22).play();glb.current=action}
    if(glb.mixer)glb.mixer.update(dt);return;
  }
  var t=pug.stateT,st=pug.state,phase=pug.phase;
  proceduralPug.position.set(0,0,0);proceduralPug.rotation.set(0,0,0);proceduralPug.scale.set(1,1,1);
  P.head.position.set(0,.58,.37);P.head.rotation.set(0,0,0);P.jaw.rotation.x=0;P.jaw.position.y=-.116;
  [P.legFL,P.legFR,P.legRL,P.legRR].forEach(function(l){l.rotation.set(0,0,0);l.scale.set(1,1,1)});
  P.tongue.visible=false;P.eyes.forEach(function(e){e.scale.set(1,1,1)});
  var talking=voiceState.speaking&&nowMs()<voiceState.until;
  if(talking){
    var mouth=Math.max(0,Math.sin(nowMs()*.018));P.jaw.rotation.x=-mouth*.28;P.jaw.position.y=-.116-mouth*.007;P.head.rotation.y=Math.sin(t*1.4)*.08;P.head.rotation.x=-.04;
  }
  pug.blinkT-=dt;if(pug.blinkT<=0){pug.blink=.14;pug.blinkT=rand(2.2,5.2)}
  if(pug.blink>0){pug.blink-=dt;P.eyes.forEach(function(e){e.scale.y=.12})}
  var run=clamp((pug.move-.62)/.38,0,1);
  if(st==='walk'||st==='idle'){
    var moving=st==='walk'?clamp(pug.move,.18,1):0;
    var amp=lerp(.52,.74,run)*moving;
    P.legFL.rotation.x=Math.sin(phase)*amp;P.legRR.rotation.x=Math.sin(phase)*amp;P.legFR.rotation.x=Math.sin(phase+Math.PI)*amp;P.legRL.rotation.x=Math.sin(phase+Math.PI)*amp;
    proceduralPug.position.y=Math.abs(Math.sin(phase))*.026*moving;
    proceduralPug.rotation.z=Math.sin(phase)*lerp(.09,.16,run)*moving;
    P.rear.position.x=Math.sin(phase)*.025*moving;
    P.body.rotation.z=Math.sin(phase)*.055*moving;
    P.ears[0].rotation.x=.48+Math.abs(Math.sin(phase))*.17*run;P.ears[1].rotation.x=.48+Math.abs(Math.sin(phase))*.17*run;
    pug.lookT-=dt;if(pug.lookT<=0){pug.lookTarget=rand(-.55,.55);pug.lookT=rand(2.5,5.5)}
    pug.look=lerp(pug.look,pug.lookTarget,dt*2.5);if(!talking)P.head.rotation.y=pug.look;
    pug.lickT-=dt;if(pug.lickT<=0){pug.lick=.65;pug.lickT=rand(8,15)}
    if(pug.lick>0){pug.lick-=dt;P.tongue.visible=true;P.tongue.position.y=-.135+Math.sin(t*11)*.009}
    var breathe=1+Math.sin(t*(run?3.4:1.9))*.015;P.body.scale.y=breathe;P.belly.scale.y=breathe;
  }else if(st==='sit'||st==='beg'){
    proceduralPug.rotation.x=-.35;proceduralPug.position.y=.055;P.legRL.scale.y=.44;P.legRR.scale.y=.44;P.legRL.rotation.x=-.8;P.legRR.rotation.x=-.8;P.legFL.scale.y=1.45;P.legFR.scale.y=1.45;
    P.head.rotation.x=st==='beg'?-.08:.25;
    if(st==='beg'){P.legFR.rotation.x=-1.2+Math.sin(t*6)*.08;P.head.rotation.z=Math.sin(t*1.45)*.075;P.eyes[0].scale.set(1.08,1.08,1.08);P.eyes[1].scale.set(1.08,1.08,1.08)}
  }else if(st==='sniff'){
    proceduralPug.position.y=-.035;P.head.position.set(0,.48,.42);P.head.rotation.x=.6;P.nose.scale.set(1+Math.sin(t*20)*.13,1+Math.sin(t*20)*.13,1+Math.sin(t*20)*.13);proceduralPug.rotation.z=Math.sin(t*5)*.025;
  }else if(st==='dig'){
    proceduralPug.position.y=-.04;proceduralPug.rotation.x=.1;P.head.position.y=.5;P.head.rotation.x=.48;P.legFL.rotation.x=-.35+Math.sin(t*17)*.9;P.legFR.rotation.x=-.35+Math.sin(t*17+Math.PI)*.9;P.chest.rotation.z=Math.sin(t*17)*.05;
  }else if(st==='spin'){
    P.legFL.rotation.x=Math.sin(t*10)*.58;P.legRR.rotation.x=Math.sin(t*10)*.58;P.legFR.rotation.x=Math.sin(t*10+Math.PI)*.58;P.legRL.rotation.x=Math.sin(t*10+Math.PI)*.58;proceduralPug.position.y=Math.abs(Math.sin(t*10))*.025;
  }else if(st==='scratch'){
    proceduralPug.rotation.x=.12;P.head.rotation.x=-.27;P.legFL.rotation.x=-.45+Math.sin(t*14)*.5;P.legFR.rotation.x=-.3+Math.sin(t*14+1.7)*.38;
  }else if(st==='lie'||st==='sleep'){
    proceduralPug.position.y=-.22;P.legFL.scale.y=.3;P.legFR.scale.y=.3;P.legRL.scale.y=.3;P.legRR.scale.y=.3;P.legFL.rotation.x=-.9;P.legFR.rotation.x=-.9;P.legRL.rotation.x=.7;P.legRR.rotation.x=.7;P.head.position.set(0,.45,.43);P.head.rotation.x=.28;
    var breath=1+Math.sin(t*(st==='sleep'?1.05:1.7))*(st==='sleep'?.045:.022);proceduralPug.scale.set(breath,breath,1);
    if(st==='sleep'){P.eyes.forEach(function(e){e.scale.y=.06});if(pug.jolt>0){pug.jolt-=dt*2;P.head.rotation.x+=Math.sin(t*24)*.06*pug.jolt}}
  }else if(st==='hop'||st==='jump'){
    P.legFL.rotation.x=-.72;P.legFR.rotation.x=-.72;P.legRL.rotation.x=.72;P.legRR.rotation.x=.72;P.head.rotation.x=-.18;
  }
  P.tailGroup.rotation.y=Math.sin(t*(4+pug.move*8))*(.15+pug.move*.25);
}

/* Human */
var humanRoot=new THREE.Group();scene.add(humanRoot);var H={};
var HUMAN_KITCHEN={x:-8,z:.2,yaw:Math.PI/2},HUMAN_LIVING={x:1.8,z:-.6},LOOK_YAW=.55,AWAY_YAW=-2.95;
(function(){
  humanRoot.position.set(HUMAN_KITCHEN.x,0,HUMAN_KITCHEN.z);humanRoot.rotation.y=HUMAN_KITCHEN.yaw;
  H.hips=sphere(.2,.15,.15,M.pants,0,.82,0,humanRoot,14);
  function leg(x){var g=new THREE.Group();g.position.set(x,.78,0);humanRoot.add(g);cylinder(.075,.062,.72,M.pants,0,-.38,0,g,10);sphere(.075,.05,.115,M.black,0,-.76,.03,g,10);return g}
  H.legL=leg(.105);H.legR=leg(-.105);H.torso=sphere(.24,.33,.17,M.sweater,0,1.17,0,humanRoot,16);
  function arm(x){var g=new THREE.Group();g.position.set(x,1.39,0);humanRoot.add(g);cylinder(.05,.043,.5,M.sweater,0,-.26,0,g,9);sphere(.052,.052,.052,M.skin,0,-.53,0,g,9);return g}
  H.armL=arm(.27);H.armR=arm(-.27);cylinder(.052,.057,.09,M.skin,0,1.53,0,humanRoot,10);
  H.head=new THREE.Group();H.head.position.y=1.68;humanRoot.add(H.head);sphere(.16,.17,.15,M.skin,0,0,0,H.head,16);sphere(.165,.105,.155,M.woodDark,0,.07,-.02,H.head,14);
  H.eyeSprite=new THREE.Sprite(new THREE.SpriteMaterial({color:0xffffff,transparent:true,opacity:.8}));H.eyeSprite.scale.set(.35,.14,1);H.eyeSprite.position.set(0,1.72,.17);H.eyeSprite.visible=false;humanRoot.add(H.eyeSprite);
})();
var human={target:null,lookT:2,yawTarget:HUMAN_KITCHEN.yaw,bob:0};

/* Vacuum */
var vacuumRoot=new THREE.Group();scene.add(vacuumRoot);
cylinder(.29,.31,.12,M.robot,0,.08,0,vacuumRoot,20);cylinder(.2,.2,.04,M.metal,0,.16,0,vacuumRoot,18);sphere(.032,.032,.032,new THREE.MeshBasicMaterial({color:0x79ff9b}),0,.14,.2,vacuumRoot,8);box(.46,.15,.29,M.robot,-1.9,.075,-6.5);
var vacuum={pos:new THREE.Vector3(-1.9,0,-6.3),dir:new THREE.Vector3(1,0,0),docked:true,turnT:2};

/* Dynamic items */
var crumbs=[];
[[-5,2.4],[-6.9,2.5],[-4.6,4.6],[-8.5,5.6],[-8.3,1.6],[-8.3,-4.9],[-7.2,-6],[-5.2,-2],[-3.6,.8],[-3.6,-1.4]].forEach(function(p,i){
  var m=mesh(new THREE.DodecahedronGeometry(.075),M.crumb,p[0],.11,p[1]);m.castShadow=true;crumbs.push({mesh:m,x:p[0],z:p[1],sx:p[0],sz:p[1],taken:false,phase:i*.63});
});
var token=new THREE.Group();scene.add(token);sphere(.14,.06,.08,M.gold,0,0,0,token,12);var fishTail=mesh(new THREE.ConeGeometry(.07,.13,4),M.gold,-.18,0,0,token);fishTail.rotation.z=Math.PI/2;token.position.set(.6,.1,-4.05);
var smellPoints=[
  {x:8.3,z:-11.3,label:'у дерева',key:'smell1',text:'Очень серьёзный запах. Работаем.'},
  {x:9.88,z:-9.3,label:'у забора',key:'smell2',text:'Здесь явно кто-то ходил без моего разрешения.'},
  {x:3.6,z:-11.4,label:'у скамейки',key:'smell3',text:'Информация собрана. Двор под контролем.'}
];
smellPoints.forEach(function(s){
  s.group=new THREE.Group();s.group.position.set(s.x,.03,s.z);scene.add(s.group);
  var base=mesh(new THREE.CircleGeometry(.5,22),new THREE.MeshBasicMaterial({color:0xa8d67c,transparent:true,opacity:.24}),0,0,0,s.group);base.rotation.x=-Math.PI/2;
  var ring=mesh(new THREE.RingGeometry(.45,.55,22),new THREE.MeshBasicMaterial({color:0xe8ffb8,transparent:true,opacity:.55}),0,.006,0,s.group);ring.rotation.x=-Math.PI/2;
  for(var i=0;i<4;i++){var puff=sphere(.04,.04,.04,new THREE.MeshBasicMaterial({color:0xd8ffad,transparent:true,opacity:.55}),rand(-.25,.25),rand(.08,.35),rand(-.25,.25),s.group,8);puff.castShadow=false}
  s.done=false;s.progress=0;
});
var leashWorld=new THREE.Group();scene.add(leashWorld);var leashLoop=new THREE.Mesh(new THREE.TorusGeometry(.15,.026,8,18),M.red);leashWorld.add(leashLoop);var leashStrap=cylinder(.021,.021,.44,M.red,.05,-.23,0,leashWorld,7);leashStrap.rotation.z=.3;leashWorld.position.set(9.45,1,-4.3);
var treat=sphere(.065,.065,.065,M.woodDark,0,0,0);treat.visible=false;
var arrow=mesh(new THREE.ConeGeometry(.16,.34,10),new THREE.MeshBasicMaterial({color:0xffa34d}),0,0,0);arrow.rotation.x=Math.PI;arrow.visible=false;
var particles=[];for(var pi=0;pi<42;pi++){var pm=mesh(new THREE.TetrahedronGeometry(.045),new THREE.MeshBasicMaterial({color:0xffcf6b}),0,0,0);pm.visible=false;particles.push({mesh:pm,vel:new THREE.Vector3(),life:0})}
function burst(x,y,z){var n=0;for(var i=0;i<particles.length&&n<8;i++){var p=particles[i];if(p.life<=0){p.mesh.visible=true;p.mesh.position.set(x,y,z);p.vel.set(rand(-1,1),rand(1.3,2.6),rand(-1,1));p.life=.65;n++}}}
function updateParticles(dt){particles.forEach(function(p){if(p.life>0){p.life-=dt*1.5;p.vel.y-=4.8*dt;p.mesh.position.addScaledVector(p.vel,dt);var s=Math.max(.01,p.life/.65);p.mesh.scale.setScalar(s);p.mesh.rotation.x+=dt*7;p.mesh.rotation.y+=dt*5;if(p.life<=0)p.mesh.visible=false}})}

/* Camera */
var cam={yaw:-2.4,pitch:.43,distance:4.8,focus:new THREE.Vector3(.6,.5,-1.4),look:new THREE.Vector3(.6,.5,-1.4),targetPos:new THREE.Vector3(),ray:new THREE.Vector3()};
function blocked(x,z,r){r=r||.1;return colliders.some(function(c){return x>c.minX-r&&x<c.maxX+r&&z>c.minZ-r&&z<c.maxZ+r})}
function desiredDistance(){
  if(Game.sleeping)return 9.5;
  if(pug.pos.z<-7)return 6.8;
  if(pug.pos.x>4&&pug.pos.z<0)return 4.25;
  if(pug.pos.x>4)return 4.75;
  return 5.15;
}
function updateCamera(dt){
  var k=1-Math.exp(-dt*(settings.calm?2.2:5.6));
  cam.distance=lerp(cam.distance,desiredDistance(),k);cam.pitch=lerp(cam.pitch,Game.sleeping?.54:.43,k);
  if(Game.mode==='finale'&&!settings.calm)cam.yaw+=dt*.04;
  var fx=Game.sleeping?bedCX:pug.pos.x,fy=Game.sleeping?.88:.53,fz=Game.sleeping?bedCZ:pug.pos.z;
  cam.focus.set(fx,fy,fz);
  var h=cam.distance*Math.cos(cam.pitch),v=cam.distance*Math.sin(cam.pitch)+.3;
  cam.targetPos.set(fx-Math.sin(cam.yaw)*h,fy+v,fz-Math.cos(cam.yaw)*h);
  if(!Game.sleeping){
    cam.ray.copy(cam.targetPos).sub(cam.focus);var max=1;
    for(var i=1;i<=16;i++){var t=i/16,px=fx+cam.ray.x*t,pz=fz+cam.ray.z*t,py=fy+cam.ray.y*t;if(blocked(px,pz,.1)||py<.35){max=Math.max(.18,(i-1)/16);break}}
    if(max<1)cam.targetPos.copy(cam.focus).addScaledVector(cam.ray,max*.94);
  }
  if(cam.targetPos.y<.42)cam.targetPos.y=.42;
  camera.position.lerp(cam.targetPos,k);cam.look.lerp(cam.focus,1-Math.exp(-dt*(settings.calm?3.2:8)));camera.lookAt(cam.look);
}

/* Input */
var keys={},actionQueued=false,actionHeld=false,touchRun=false;
var joystick={active:false,id:null,cx:0,cy:0,x:0,y:0},cameraTouch={id:null,x:0,y:0},mouse={down:false,x:0};
var knob=$('joystick-knob');
function resetInput(){
  keys={};actionQueued=false;actionHeld=false;touchRun=false;joystick.active=false;joystick.id=null;joystick.x=0;joystick.y=0;cameraTouch.id=null;mouse.down=false;knob.style.transform='translate(0,0)';$('btn-run').classList.remove('active');pug.vel.set(0,0,0);pug.move=0;
}
window.addEventListener('keydown',function(e){
  var c=e.code;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(c)>=0)e.preventDefault();
  if(keys[c])return;keys[c]=true;
  if(c==='KeyE'||c==='Space'){actionQueued=true;actionHeld=true}
  if(c==='KeyM'){if(settings.sound){settings.sound=false;AudioManager.pauseAll();stopVoice();saveSettings();syncSettings()}else enableSoundFromGesture(true)}
  if(c==='Escape'&&Game.mode==='playing'){if(Game.paused)resumeGame();else pauseGame()}
  if(Game.mode==='finale')Game.erzIdle=0;
});
window.addEventListener('keyup',function(e){keys[e.code]=false;if(e.code==='KeyE'||e.code==='Space')actionHeld=false});
renderer.domElement.addEventListener('mousedown',function(e){mouse.down=true;mouse.x=e.clientX});
window.addEventListener('mousemove',function(e){if(!mouse.down)return;var dx=e.clientX-mouse.x;mouse.x=e.clientX;cam.yaw-=dx*.0032*settings.sens});
window.addEventListener('mouseup',function(){mouse.down=false});
renderer.domElement.addEventListener('contextmenu',function(e){e.preventDefault()});
if(IS_TOUCH){
  renderer.domElement.addEventListener('touchstart',function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(cameraTouch.id===null){cameraTouch.id=t.identifier;cameraTouch.x=t.clientX;cameraTouch.y=t.clientY}}},{passive:false});
  renderer.domElement.addEventListener('touchmove',function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier===cameraTouch.id){var dx=t.clientX-cameraTouch.x;cameraTouch.x=t.clientX;cameraTouch.y=t.clientY;cam.yaw-=dx*.0043*settings.sens}}},{passive:false});
  var endCamera=function(e){for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===cameraTouch.id)cameraTouch.id=null};
  renderer.domElement.addEventListener('touchend',endCamera);renderer.domElement.addEventListener('touchcancel',endCamera);
  var zone=$('joystick-zone'),base=$('joystick-base');
  zone.addEventListener('touchstart',function(e){e.preventDefault();if(joystick.active)return;var t=e.changedTouches[0],r=base.getBoundingClientRect();joystick.active=true;joystick.id=t.identifier;joystick.cx=r.left+r.width/2;joystick.cy=r.top+r.height/2;moveJoy(t.clientX,t.clientY)},{passive:false});
  zone.addEventListener('touchmove',function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier===joystick.id)moveJoy(t.clientX,t.clientY)}},{passive:false});
  function moveJoy(x,y){var dx=x-joystick.cx,dy=y-joystick.cy,l=Math.sqrt(dx*dx+dy*dy)||1,max=39,c=Math.min(l,max);joystick.x=dx/l*c/max;joystick.y=dy/l*c/max;knob.style.transform='translate('+(dx/l*c)+'px,'+(dy/l*c)+'px)'}
  var endJoy=function(e){for(var i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===joystick.id){joystick.active=false;joystick.id=null;joystick.x=joystick.y=0;knob.style.transform='translate(0,0)'}};
  zone.addEventListener('touchend',endJoy);zone.addEventListener('touchcancel',endJoy);
  $('btn-action').addEventListener('touchstart',function(e){e.preventDefault();actionQueued=true;actionHeld=true},{passive:false});
  $('btn-action').addEventListener('touchend',function(e){e.preventDefault();actionHeld=false},{passive:false});
  $('btn-action').addEventListener('touchcancel',function(){actionHeld=false});
  $('btn-run').addEventListener('touchstart',function(e){e.preventDefault();touchRun=true;this.classList.add('active')},{passive:false});
  $('btn-run').addEventListener('touchend',function(e){e.preventDefault();touchRun=false;this.classList.remove('active')},{passive:false});
  $('btn-run').addEventListener('touchcancel',function(){touchRun=false;this.classList.remove('active')});
}
function inputVector(){
  var x=0,z=0;if(keys.KeyW||keys.ArrowUp)z++;if(keys.KeyS||keys.ArrowDown)z--;if(keys.KeyA||keys.ArrowLeft)x--;if(keys.KeyD||keys.ArrowRight)x++;if(joystick.active){x+=joystick.x;z-=joystick.y}
  var l=Math.sqrt(x*x+z*z);if(l>1){x/=l;z/=l}return{x:x,z:z,mag:Math.min(1,l)};
}

/* Game */
var Game={
  mode:'menu',paused:false,inputLocked:true,quest:0,crumbs:0,smells:0,mood:40,time:0,finalTime:0,vacuumHits:0,bedAttempts:0,
  hasLeash:false,leashPicked:false,leashDropped:false,tokenFound:false,doorSequence:false,frontOpen:false,bedroomOpen:false,
  looking:false,sleeping:false,finished:false,sleepT:0,snoreT:0,erzIdle:0,erzUnlocked:false,vacuumActive:false,q3Timer:0,
  ambientTimer:20,stepDistance:0,bumpCooldown:0,q7Triggered:false,area:'home'
};
var sequence=null,pausedByOrientation=false,lastFrame=nowMs(),pendingTimers=[];
function timer(fn,ms){var id=setTimeout(function(){var i=pendingTimers.indexOf(id);if(i>=0)pendingTimers.splice(i,1);fn()},ms);pendingTimers.push(id);return id}
function startSequence(steps,done){sequence={steps:steps,index:0,time:0,done:done}}
function updateSequence(dt){
  if(!sequence)return false;var step=sequence.steps[sequence.index];
  if(sequence.time===0&&step.begin)step.begin();sequence.time+=dt;var p=clamp(sequence.time/step.duration,0,1);if(step.tick)step.tick(p,dt);
  if(sequence.time>=step.duration){if(step.end)step.end();sequence.index++;sequence.time=0;if(sequence.index>=sequence.steps.length){var done=sequence.done;sequence=null;if(done)done()}}
  return true;
}
function yawTo(ax,az,bx,bz){return Math.atan2(bx-ax,bz-az)}
function quest(number){
  Game.quest=number;hapticNotify('success');AudioManager.playOne('ui',.45,300);
  if(number===1)setQuest('Проверь кухню. Там могло произойти что-то вкусное');
  if(number===2)setQuest('Охота за крошками: собери все десять');
  if(number===3)setQuest('Пылесос замечен. Не дай ему испортить расследование');
  if(number===4)setQuest('Проведи переговоры о еде с человеком');
  if(number===5)setQuest('Найди поводок и отнеси его к двери');
  if(number===6)setQuest('Исследуй три важных запаха во дворе');
  if(number===7)setQuest('Операция «Кровать»: дождись, пока человек отвернётся');
  if(number===8)setQuest('Исправь слишком ровную простыню');
  if(number===9)setQuest('Заслуженный сон');
}
function startGame(){
  setClosingConfirmation(true);showScreen(null);$('hud').classList.remove('hidden');Game.mode='playing';Game.inputLocked=true;setPugState('lie');AudioManager.setArea('home');
  timer(function(){Game.inputLocked=false;quest(1);speakMatvey('start','Так. Новый день. Где мои крошки?',{force:true})},650);
}
function activateVacuum(){
  if(Game.vacuumActive)return;Game.vacuumActive=true;vacuum.docked=false;vacuum.pos.set(.5,0,-5);vacuum.dir.set(-1,0,.3).normalize();vacuum.turnT=rand(2,4);AudioManager.startVacuum();speakMatvey('vacuum','Опять эта шайба без совести.');
}
function dockVacuum(){Game.vacuumActive=false;vacuum.docked=true;vacuum.pos.set(-1.9,0,-6.3);vacuumRoot.position.copy(vacuum.pos);AudioManager.stopVacuum()}
function collectCrumb(c){
  c.taken=true;c.mesh.visible=false;Game.crumbs++;updateCounters();setMood(Game.mood+5);burst(c.x,.22,c.z);AudioManager.playOne('collect',.7,100);hapticImpact('light');pug.lickT=.01;
  if(Game.crumbs===1)speakMatvey('firstCrumb','Крошка не валялась. Она ждала профессионала.');
  if(Game.quest===2&&Game.crumbs>=10){quest(3);Game.q3Timer=2.7}
}
function dropCrumb(){
  var taken=crumbs.filter(function(c){return c.taken});if(!taken.length)return;var c=taken[Math.floor(Math.random()*taken.length)];c.taken=false;c.mesh.visible=true;
  for(var i=0;i<12;i++){var a=rand(0,Math.PI*2),r=rand(.7,1.3),x=pug.pos.x+Math.cos(a)*r,z=pug.pos.z+Math.sin(a)*r;if(x<-9.35||x>3.5||z<-6.35||z>6.35||blocked(x,z,.28))continue;c.x=x;c.z=z;c.mesh.position.set(x,.11,z);return}
  c.mesh.position.set(c.x,.11,c.z);
}
function begSequence(){
  Game.inputLocked=true;pug.forcedYaw=yawTo(pug.pos.x,pug.pos.z,humanRoot.position.x,humanRoot.position.z);
  speakMatvey('beg','Я не попрошайничаю. Я провожу переговоры.');
  startSequence([
    {duration:.42,begin:function(){setPugState('sit')}},
    {duration:1.25,begin:function(){setPugState('beg');AudioManager.playOne('whine',.48,500)}},
    {duration:1.05,begin:function(){treat.visible=true;treat.position.set(humanRoot.position.x,1,humanRoot.position.z)},tick:function(k){treat.position.set(lerp(humanRoot.position.x,pug.pos.x,k),1+Math.sin(k*Math.PI)*.3,lerp(humanRoot.position.z,pug.pos.z,k))},end:function(){treat.visible=false;setMood(Game.mood+15);AudioManager.playOne('collect',.5,100)}},
    {duration:.45}
  ],function(){pug.forcedYaw=null;Game.inputLocked=false;quest(5);speakMatvey('leash','Поводок сам себя не принесёт. Я проверял.')});
}
function doorSequence(){
  if(Game.leashDropped)return;Game.inputLocked=true;Game.hasLeash=false;Game.leashDropped=true;P.leashCarry.visible=false;leashWorld.visible=true;leashWorld.position.set(5.8,.11,-6.55);leashWorld.rotation.x=-Math.PI/2;pug.forcedYaw=yawTo(pug.pos.x,pug.pos.z,5.8,-7);
  speakMatvey('door','Открывайте. Специалист по запахам готов.');
  startSequence([
    {duration:1.6,begin:function(){setPugState('scratch');AudioManager.playOne('dig',.65,400)}},
    {duration:1.1,begin:function(){setPugState('idle')}},
    {duration:1,begin:function(){doors.front.target=1;Game.frontOpen=true;removeCollider(frontDoorCollider);AudioManager.playOne('door',.7,500);setMood(Game.mood+8)}}
  ],function(){pug.forcedYaw=null;Game.inputLocked=false;quest(6)});
}
function bedAttempt(){
  if(Game.quest!==7)return;Game.bedAttempts++;
  if(Game.looking){
    AudioManager.playOne('snort',.6,400);hapticNotify('warning');speakMatvey('bedWatched','Так. Свидетель ещё не отвернулся.');
    setPugState('hop');startSequence([{duration:.5,tick:function(k){pug.visualY=Math.sin(k*Math.PI)*.28},end:function(){pug.visualY=0;setPugState('idle')}}]);return;
  }
  bedSequence();
}
function bedSequence(){
  Game.inputLocked=true;quest(8);speakMatvey('dig','Простыня слишком ровная. Исправляю.',{force:true});
  var sx=pug.pos.x,sz=pug.pos.z,sy=pug.yaw,shown=0;
  startSequence([
    {duration:.8,begin:function(){setPugState('jump');AudioManager.playOne('jump',.7,300);hapticImpact('soft');pug.forcedYaw=yawTo(sx,sz,bedCX,bedCZ)},tick:function(k){pug.pos.x=lerp(sx,bedCX,k);pug.pos.z=lerp(sz,bedCZ-.2,k);pug.visualY=Math.sin(k*Math.PI)*(bedTop+.25)},end:function(){pug.groundY=bedTop;pug.visualY=0;pug.onBed=true}},
    {duration:2.8,begin:function(){setPugState('dig');AudioManager.playOne('dig',.7,500)},tick:function(k,dt){pug.digClock+=dt;if(pug.digClock>.34){pug.digClock=0;AudioManager.playOne('dig',.5,300);if(shown<crumples.children.length)crumples.children[shown++].visible=true}}},
    {duration:2.1,begin:function(){setPugState('spin')},tick:function(k){pug.yaw=sy+k*Math.PI*4}},
    {duration:1.05,begin:function(){setPugState('lie')}},
    {duration:.8,begin:function(){setPugState('sleep');Game.sleeping=true;quest(9);setMood(100);speakMatvey('sleep','Ержан закончил смену.',{force:true})}}
  ],function(){pug.forcedYaw=null});
}
function nearestInteract(){
  var p=pug.pos,best=null,bd=Infinity;
  function consider(x,z,r,label,short,fn){var d=Math.sqrt(dist2(p.x,p.z,x,z));if(d<r&&d<bd){bd=d;best={label:label,short:short,fn:fn}}}
  if(Game.quest===4)consider(humanRoot.position.x,humanRoot.position.z,1.5,'Сесть и начать переговоры','ПРОСИТЬ',begSequence);
  if(Game.quest===5&&!Game.leashPicked)consider(9.45,-4.3,1.3,'Взять поводок','ВЗЯТЬ',function(){Game.leashPicked=true;Game.hasLeash=true;leashWorld.visible=false;P.leashCarry.visible=true;AudioManager.playOne('collect',.55,200);setMood(Game.mood+8);setQuest('Отнеси поводок к входной двери')});
  if(Game.quest===5&&Game.hasLeash&&!Game.doorSequence)consider(5.8,-6.5,1.6,'Положить поводок у двери','ГУЛЯТЬ',function(){Game.doorSequence=true;doorSequence()});
  if(!Game.tokenFound)consider(.6,-4.05,1.05,'Под диваном что-то блестит','НАЙТИ',function(){Game.tokenFound=true;token.visible=false;burst(.6,.2,-4.05);AudioManager.playOne('achievement',.65,300);setMood(Game.mood+10);unlockAchievement('sel');speakMatvey('random','Это была не крошка. Это была улика.')});
  if(Game.quest===7&&!Game.sleeping){var x=clamp(p.x,6,8.6),z=clamp(p.z,2.7,5.95);if(Math.sqrt(dist2(p.x,p.z,x,z))<1.35)consider(x,z,1.4,'Запрыгнуть на кровать','ПРЫГНУТЬ',bedAttempt)}
  return best;
}
function nearestSmell(){
  for(var i=0;i<smellPoints.length;i++){var s=smellPoints[i];if(!s.done&&dist2(pug.pos.x,pug.pos.z,s.x,s.z)<.9)return s}return null;
}
function collide(pos,r){
  for(var pass=0;pass<2;pass++)for(var i=0;i<colliders.length;i++){var c=colliders[i];if(pos.x>c.minX-r&&pos.x<c.maxX+r&&pos.z>c.minZ-r&&pos.z<c.maxZ+r){var l=pos.x-(c.minX-r),rr=(c.maxX+r)-pos.x,b=pos.z-(c.minZ-r),f=(c.maxZ+r)-pos.z,m=Math.min(l,rr,b,f);if(m===l)pos.x=c.minX-r;else if(m===rr)pos.x=c.maxX+r;else if(m===b)pos.z=c.minZ-r;else pos.z=c.maxZ+r}}
  pos.x=clamp(pos.x,-9.68,10.24);pos.z=clamp(pos.z,-13.78,6.73);
}
var temp=new THREE.Vector3(),arrowTime=0,rareLines=[
  'Я устал. Хотя ещё ничего не делал.','Люди снова не понимают очевидных вещей.','Ситуация под контролем.','Прошу не мешать специалисту.','Работа тяжёлая. Зарплата отсутствует.','Мне нужен перекус для продолжения расследования.','Вопросы есть? У меня тоже нет.'
];
function updateArrow(){
  var target=null;
  if(Game.quest===1)target={x:-3,y:1.8,z:0};
  else if(Game.quest===2){var nearest=null,best=Infinity;crumbs.forEach(function(c){if(!c.taken){var d=dist2(pug.pos.x,pug.pos.z,c.x,c.z);if(d<best){best=d;nearest=c}}});if(nearest)target={x:nearest.x,y:1,z:nearest.z}}
  else if(Game.quest===4)target={x:humanRoot.position.x,y:2.2,z:humanRoot.position.z};
  else if(Game.quest===5)target=Game.leashPicked?{x:5.8,y:1.8,z:-6.5}:{x:9.45,y:1.8,z:-4.3};
  else if(Game.quest===6){if(Game.smells>=3)target={x:5.8,y:1.8,z:-6.6};else{var ns=smellPoints.find(function(s){return!s.done});if(ns)target={x:ns.x,y:1,z:ns.z}}}
  else if(Game.quest===7&&!Game.sleeping)target={x:bedCX,y:1.65,z:bedCZ};
  arrow.visible=Boolean(target);if(target)arrow.position.set(target.x,target.y+Math.sin(arrowTime*3)*.12,target.z);
}
function updatePlaying(dt){
  Game.time+=dt;Game.bumpCooldown-=dt;var inSequence=updateSequence(dt);
  var area=pug.pos.z<-7?'yard':'home';if(area!==Game.area){Game.area=area;AudioManager.setArea(area)}
  if(!inSequence&&!Game.inputLocked&&!Game.sleeping){
    var input=inputVector(),running=keys.ShiftLeft||keys.ShiftRight||touchRun,speed=running?3.35:1.85;
    var fx=Math.sin(cam.yaw),fz=Math.cos(cam.yaw),rx=-fz,rz=fx,mx=fx*input.z+rx*input.x,mz=fz*input.z+rz*input.x;
    pug.vel.x=lerp(pug.vel.x,mx*speed*input.mag,clamp(dt*12,0,1));pug.vel.z=lerp(pug.vel.z,mz*speed*input.mag,clamp(dt*12,0,1));
    var sp=Math.sqrt(pug.vel.x*pug.vel.x+pug.vel.z*pug.vel.z);if(sp<.045){pug.vel.set(0,0,0);sp=0}
    pug.pos.x+=pug.vel.x*dt;pug.pos.z+=pug.vel.z*dt;collide(pug.pos,.34);pug.move=lerp(pug.move,clamp(sp/3.1,0,1),dt*8);
    if(sp>.14){pug.phase+=sp*dt*(running?6.2:5.4);pug.yaw=angleLerp(pug.yaw,Math.atan2(pug.vel.x,pug.vel.z),clamp(dt*10,0,1));setPugState('walk');Game.stepDistance+=sp*dt;if(Game.stepDistance>.5){Game.stepDistance=0;AudioManager.playOne(running?'stepsRun':'stepsWalk',.42,120)}}
    else{if(pug.forcedYaw!==null)pug.yaw=angleLerp(pug.yaw,pug.forcedYaw,dt*6);if(pug.state==='walk')setPugState('idle')}
    if(Game.quest===1&&pug.pos.x<-3.25){quest(2);activateVacuum()}
    if(Game.quest===6&&Game.smells>=3&&pug.pos.z>-6.8&&!Game.q7Triggered){Game.q7Triggered=true;doors.bedroom.target=1;Game.bedroomOpen=true;removeCollider(bedroomDoorCollider);AudioManager.playOne('door',.7,500);human.target={x:HUMAN_LIVING.x,z:HUMAN_LIVING.z};quest(7);speakMatvey('bedFree','На кровать нельзя только до тех пор, пока никто не видит.')}
  }else{pug.move=lerp(pug.move,0,dt*6);if(pug.forcedYaw!==null)pug.yaw=angleLerp(pug.yaw,pug.forcedYaw,dt*7)}
  pugRoot.position.set(pug.pos.x,pug.groundY+pug.visualY,pug.pos.z);pugRoot.rotation.y=pug.yaw;
  if(actionQueued){actionQueued=false;if(!inSequence&&!Game.inputLocked&&!Game.sleeping){var interact=nearestInteract();if(interact)interact.fn()}}
  if(Game.quest>=6&&!inSequence&&!Game.inputLocked&&!Game.sleeping){
    var smell=nearestSmell();
    if(smell&&actionHeld){setPugState('sniff');smell.progress+=dt/1.8;setHold(smell.progress);AudioManager.playOne('sniff',.38,480);if(smell.progress>=1){smell.done=true;smell.group.visible=false;Game.smells++;updateCounters();setMood(Game.mood+8);setHold(null);AudioManager.playOne('collect',.65,150);speakMatvey(smell.key,smell.text,{force:true});setPugState('idle');if(Game.smells>=3)setQuest('Двор проверен. Возвращайся домой')}}
    else{setHold(smell?smell.progress:null);if(pug.state==='sniff')setPugState('idle')}
  }else setHold(null);
  if(Game.quest===3){Game.q3Timer-=dt;if(Game.q3Timer<=0)quest(4)}
  crumbs.forEach(function(c){if(c.taken)return;c.phase+=dt*3;c.mesh.position.y=.11+Math.sin(c.phase)*.025;c.mesh.rotation.y+=dt*2;if(dist2(pug.pos.x,pug.pos.z,c.x,c.z)<.34)collectCrumb(c)});
  if(!Game.tokenFound){token.rotation.y+=dt*1.8;token.position.y=.1+Math.sin(Game.time*3.5)*.025}
  if(Game.vacuumActive&&!vacuum.docked){
    vacuum.turnT-=dt;if(vacuum.turnT<=0){vacuum.turnT=rand(1.8,4);var a=Math.atan2(vacuum.dir.z,vacuum.dir.x)+rand(-1.1,1.1);vacuum.dir.set(Math.cos(a),0,Math.sin(a))}
    temp.set(vacuum.pos.x+vacuum.dir.x*1.08*dt,0,vacuum.pos.z+vacuum.dir.z*1.08*dt);
    var hit=blocked(temp.x,temp.z,.31)||temp.x<-9.35||temp.x>3.55||temp.z<-6.35||temp.z>6.35;
    if(hit){if(Math.abs(vacuum.dir.x)>Math.abs(vacuum.dir.z))vacuum.dir.x*=-1;else vacuum.dir.z*=-1}else vacuum.pos.copy(temp);
    vacuumRoot.position.copy(vacuum.pos);vacuumRoot.rotation.y+=dt*.8;AudioManager.updateVacuum(Math.sqrt(dist2(vacuum.pos.x,vacuum.pos.z,pug.pos.x,pug.pos.z)));
    if(Game.bumpCooldown<=0&&!pug.onBed&&dist2(vacuum.pos.x,vacuum.pos.z,pug.pos.x,pug.pos.z)<.39){Game.bumpCooldown=2;Game.vacuumHits++;hapticImpact('medium');if(Game.quest===2&&Game.crumbs>0){Game.crumbs--;dropCrumb();updateCounters()}AudioManager.playOne('snort',.7,400);speakMatvey('vacuumHit','Зафиксировано нападение бытовой техники.');setPugState('hop');startSequence([{duration:.55,tick:function(k){pug.visualY=Math.sin(k*Math.PI)*.34},end:function(){pug.visualY=0;setPugState('idle')}}])}
  }
  if(Game.quest>=7&&Game.vacuumActive)dockVacuum();
  if(human.target){
    var dx=human.target.x-humanRoot.position.x,dz=human.target.z-humanRoot.position.z,d=Math.sqrt(dx*dx+dz*dz);
    if(d>.08){humanRoot.position.x+=dx/d*1.12*dt;humanRoot.position.z+=dz/d*1.12*dt;humanRoot.rotation.y=Math.atan2(dx,dz);human.bob+=dt*8;var sw=Math.sin(human.bob);H.legL.rotation.x=sw*.44;H.legR.rotation.x=-sw*.44;H.armL.rotation.x=-sw*.28;H.armR.rotation.x=sw*.28;humanRoot.position.y=Math.abs(Math.cos(human.bob))*.025}else{human.target=null;humanRoot.position.y=0;human.lookT=1.4}
  }else{H.legL.rotation.x=lerp(H.legL.rotation.x,0,dt*8);H.legR.rotation.x=lerp(H.legR.rotation.x,0,dt*8);humanRoot.position.y=lerp(humanRoot.position.y,0,dt*8)}
  if(Game.quest===7&&!Game.sleeping&&!human.target){
    human.lookT-=dt;if(human.lookT<=0){Game.looking=!Game.looking;human.lookT=Game.looking?rand(3,4.4):rand(3.2,5.8);human.yawTarget=Game.looking?LOOK_YAW:AWAY_YAW;setWatch(Game.looking);if(!Game.looking)speakMatvey('bedFree','Оперативное окно открыто.')}
    humanRoot.rotation.y=angleLerp(humanRoot.rotation.y,human.yawTarget,dt*4);H.eyeSprite.visible=Game.looking;
  }else if(Game.quest!==7)H.eyeSprite.visible=false;
  Object.keys(doors).forEach(function(k){var d=doors[k];d.value=lerp(d.value,d.target,dt*3);d.group.rotation.y=-d.value*1.75});
  arrowTime+=dt;updateArrow();
  if(Game.quest>=2&&Game.quest<=6&&!sequence){Game.ambientTimer-=dt;if(Game.ambientTimer<=0){Game.ambientTimer=rand(20,34);speakMatvey('random'+Math.floor(Math.random()*99),rareLines[Math.floor(Math.random()*rareLines.length)])}}
  if(Game.sleeping){
    Game.sleepT+=dt;Game.snoreT-=dt;if(Game.snoreT<=0){Game.snoreT=rand(2.7,4.4);pug.jolt=1;AudioManager.playOne('snore',.5,1800)}
    if(Game.sleepT>5&&!Game.finished){Game.finished=true;Game.finalTime=Game.time;$('fade').classList.add('on')}
    if(Game.sleepT>7.1&&screenOpen('screen-finale')===false)openFinale();
  }
  var interact2=null;
  if(!inSequence&&!Game.inputLocked&&!Game.sleeping){var smell2=nearestSmell();interact2=smell2?{label:'Удерживай действие — '+smell2.label,short:'НЮХАТЬ'}:nearestInteract()}
  setPrompt(interact2?interact2.label:null,interact2?interact2.short:null);
  updateParticles(dt);animatePug(dt);updateCamera(dt);
}
function openFinale(){
  Game.mode='finale';Game.erzIdle=0;setClosingConfirmation(false);$('fin-crumbs').textContent=Game.crumbs+' / 10';$('fin-smells').textContent=Game.smells+' / 3';$('fin-time').textContent=fmtTime(Game.finalTime);$('fin-vacuum').textContent=Game.vacuumHits;$('fin-attempts').textContent=Game.bedAttempts;
  if(bestTime===null||Game.finalTime<bestTime){bestTime=Game.finalTime;saveBest()}if(Game.vacuumHits===0)unlockAchievement('hitry');if(Game.tokenFound)unlockAchievement('king');setPrompt(null);$('watch-ind').classList.add('hidden');showScreen('screen-finale');speakMatvey('finale','День прожит не зря. Рассол может спать спокойно.',{force:true});
}
function resetGame(){
  pendingTimers.forEach(clearTimeout);pendingTimers.length=0;stopVoice();AudioManager.stopAll();sequence=null;resetInput();
  Object.assign(Game,{mode:'menu',paused:false,inputLocked:true,quest:0,crumbs:0,smells:0,mood:40,time:0,finalTime:0,vacuumHits:0,bedAttempts:0,hasLeash:false,leashPicked:false,leashDropped:false,tokenFound:false,doorSequence:false,frontOpen:false,bedroomOpen:false,looking:false,sleeping:false,finished:false,sleepT:0,snoreT:0,erzIdle:0,erzUnlocked:false,vacuumActive:false,q3Timer:0,ambientTimer:20,stepDistance:0,bumpCooldown:0,q7Triggered:false,area:'home'});
  crumbs.forEach(function(c){c.taken=false;c.x=c.sx;c.z=c.sz;c.mesh.visible=true;c.mesh.position.set(c.sx,.11,c.sz)});
  token.visible=true;leashWorld.visible=true;leashWorld.position.set(9.45,1,-4.3);leashWorld.rotation.set(0,0,0);P.leashCarry.visible=false;
  doors.front.value=doors.front.target=0;doors.front.group.rotation.y=0;doors.bedroom.value=doors.bedroom.target=0;doors.bedroom.group.rotation.y=0;ensureCollider(frontDoorCollider);ensureCollider(bedroomDoorCollider);dockVacuum();
  humanRoot.position.set(HUMAN_KITCHEN.x,0,HUMAN_KITCHEN.z);humanRoot.rotation.y=HUMAN_KITCHEN.yaw;human.target=null;human.lookT=2;human.yawTarget=HUMAN_KITCHEN.yaw;H.eyeSprite.visible=false;
  smellPoints.forEach(function(s){s.done=false;s.progress=0;s.group.visible=true});crumples.children.forEach(function(c){c.visible=false});particles.forEach(function(p){p.life=0;p.mesh.visible=false});treat.visible=false;arrow.visible=false;
  pug.pos.set(.6,0,-1.4);pug.vel.set(0,0,0);pug.yaw=-Math.PI/2;pug.groundY=0;pug.visualY=0;pug.onBed=false;pug.forcedYaw=null;pug.move=0;pug.jolt=0;pug.digClock=0;setPugState('lie');pugRoot.position.set(.6,0,-1.4);pugRoot.rotation.y=pug.yaw;
  cam.yaw=-2.4;cam.distance=4.8;cam.focus.set(.6,.5,-1.4);cam.look.copy(cam.focus);camera.position.set(4,2.4,2.4);
  setMood(40);updateCounters();setQuest('…');setPrompt(null);setHold(null);$('watch-ind').classList.add('hidden');$('fade').classList.remove('on');$('hud').classList.add('hidden');pausedByOrientation=false;
}
function pauseGame(){
  if(Game.mode!=='playing'||Game.paused)return;resetInput();Game.paused=true;AudioManager.pauseAll();stopVoice();showScreen('screen-pause');
}
function resumeGame(){
  Game.paused=false;showScreen(null);lastFrame=nowMs();AudioManager.resumeLoops();
}

/* Settings and buttons */
function enableSoundFromGesture(message){
  settings.sound=true;AudioManager.unlock();saveSettings();AudioManager.setArea(Game.area||'home');if(Game.vacuumActive)AudioManager.startVacuum();syncSettings();if(message)speakMatvey('sound','Звук принят. Работа продолжается.',{force:true});
}
$('btn-start').addEventListener('click',function(){resetGame();TelegramApp.fullscreen();TelegramApp.lockLandscape();if(settings.sound)AudioManager.unlock();startGame();syncSettings()});
$('btn-again').addEventListener('click',function(){resetGame();TelegramApp.fullscreen();TelegramApp.lockLandscape();if(settings.sound)AudioManager.unlock();startGame();syncSettings()});
$('btn-controls').addEventListener('click',function(){screenReturn='start';showScreen('screen-controls')});
$('btn-controls-back').addEventListener('click',function(){showScreen(screenReturn==='pause'?'screen-pause':'screen-start')});
$('btn-settings').addEventListener('click',function(){screenReturn='start';showScreen('screen-settings')});
$('btn-pause-settings').addEventListener('click',function(){screenReturn='pause';showScreen('screen-settings')});
$('btn-settings-back').addEventListener('click',function(){showScreen(screenReturn==='pause'?'screen-pause':screenReturn==='finale'?'screen-finale':'screen-start')});
$('btn-ach').addEventListener('click',function(){renderAchievements();showScreen('screen-achievements')});
$('btn-ach-back').addEventListener('click',function(){showScreen('screen-start')});
$('btn-resume').addEventListener('click',resumeGame);
function toMenu(){setClosingConfirmation(false);resetGame();refreshBest();showScreen('screen-start')}
$('btn-quit').addEventListener('click',toMenu);$('btn-menu').addEventListener('click',toMenu);
$('btn-pause').addEventListener('click',function(){if(Game.mode==='playing'){if(Game.paused)resumeGame();else pauseGame()}});
$('btn-mute').addEventListener('click',function(){if(settings.sound){settings.sound=false;saveSettings();AudioManager.pauseAll();stopVoice();syncSettings()}else enableSoundFromGesture(true)});
$('set-sound').addEventListener('click',function(){if(settings.sound){settings.sound=false;AudioManager.pauseAll();stopVoice();saveSettings();syncSettings()}else enableSoundFromGesture(false)});
[['set-music','music'],['set-voice','voice'],['set-sfx','sfx'],['set-sens','sens']].forEach(function(item){$(item[0]).addEventListener('input',function(){settings[item[1]]=parseFloat(this.value);saveSettings();AudioManager.refreshVolumes()})});
$('set-calm').addEventListener('click',function(){settings.calm=!settings.calm;saveSettings();syncSettings()});
[['q-low','low'],['q-med','medium'],['q-high','high']].forEach(function(q){$(q[0]).addEventListener('click',function(){settings.quality=q[1];saveSettings();applyQuality();syncSettings()})});
$('btn-reset-progress').addEventListener('click',function(){if(confirm('Сбросить достижения и рекорд?')){achievements={sel:false,hitry:false,erzhan:false,king:false};bestTime=null;try{localStorage.removeItem(STORAGE.achievements);localStorage.removeItem(STORAGE.best)}catch(error){}renderAchievements();refreshBest()}});
$('btn-add-home').addEventListener('click',function(){try{if(TelegramApp.tg&&TelegramApp.tg.addToHomeScreen)TelegramApp.tg.addToHomeScreen()}catch(error){}});

/* Orientation, resize, lifecycle */
var portraitMedia=matchMedia('(orientation: portrait)');
function checkOrientation(){
  var portrait=IS_TOUCH&&innerHeight>innerWidth;$('portrait-warning').classList.toggle('hidden',!portrait);
  if(portrait){if(Game.mode==='playing'&&!Game.paused&&!pausedByOrientation){pausedByOrientation=true;resetInput();AudioManager.pauseAll();stopVoice()}if(tgBack&&!portraitBackHidden){try{tgBack.hide()}catch(error){}portraitBackHidden=true}}
  else{if(pausedByOrientation){pausedByOrientation=false;lastFrame=nowMs();TelegramApp.lockLandscape();AudioManager.resumeLoops()}if(portraitBackHidden){portraitBackHidden=false;updateBack()}}
}
function applyRendererSize(){var dpr=Math.min(devicePixelRatio||1,2),scale=settings.quality==='low'?.63:settings.quality==='medium'?.82:1;renderer.setPixelRatio(dpr*scale);renderer.setSize(innerWidth,innerHeight,false)}
function applyQuality(){applyRendererSize();var high=settings.quality==='high',low=settings.quality==='low';renderer.shadowMap.enabled=!low;dirLight.castShadow=!low;dirLight.shadow.mapSize.set(high?2048:1024,high?2048:1024);if(dirLight.shadow.map){dirLight.shadow.map.dispose();dirLight.shadow.map=null}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();applyRendererSize();checkOrientation()}
window.addEventListener('resize',resize);window.addEventListener('orientationchange',function(){setTimeout(resize,120)});
if(portraitMedia.addEventListener)portraitMedia.addEventListener('change',checkOrientation);else portraitMedia.addListener(checkOrientation);
document.addEventListener('visibilitychange',function(){if(document.hidden&&Game.mode==='playing'&&!Game.paused&&!pausedByOrientation)pauseGame()});
window.addEventListener('blur',function(){if(Game.mode==='playing'&&!Game.paused&&!pausedByOrientation)pauseGame()});
renderer.domElement.addEventListener('webglcontextlost',function(e){e.preventDefault();pauseGame();window.__fatal('3D-контекст был потерян. Обновите страницу, чтобы продолжить.')},false);

/* Telegram */
function handleBack(){
  hapticImpact('light');
  if(screenOpen('screen-settings')){showScreen(screenReturn==='pause'?'screen-pause':'screen-start');return}
  if(screenOpen('screen-controls')||screenOpen('screen-achievements')){showScreen('screen-start');return}
  if(screenOpen('screen-finale')||screenOpen('screen-pause')){toMenu();return}
  if(Game.mode==='playing'){if(Game.paused)resumeGame();else pauseGame()}
}
function setupHomeButton(){
  var button=$('btn-add-home'),tg=TelegramApp.tg;button.classList.add('hidden');
  if(!TelegramApp.active||!tg||!tg.checkHomeScreenStatus||!tg.addToHomeScreen)return;
  try{tg.checkHomeScreenStatus(function(status){button.classList.toggle('hidden',status==='unsupported'||status==='added')});tg.onEvent('homeScreenAdded',function(){button.classList.add('hidden')})}catch(error){}
}
function setupTelegram(){
  if(!TelegramApp.active)return;TelegramApp.init();setupHomeButton();var tg=TelegramApp.tg;
  try{
    ['viewportChanged','safeAreaChanged','contentSafeAreaChanged','fullscreenChanged'].forEach(function(name){tg.onEvent(name,resize)});
    tg.onEvent('deactivated',function(){if(Game.mode==='playing'&&!Game.paused&&!pausedByOrientation)pauseGame();AudioManager.pauseAll()});
    tg.onEvent('activated',resize);
    if(tg.BackButton){tgBack=tg.BackButton;tgBack.onClick(handleBack);tgBack.hide()}
    var first=tg.initDataUnsafe&&tg.initDataUnsafe.user&&tg.initDataUnsafe.user.first_name;if(first){$('tg-greet').textContent='Матвей ждёт, '+first;$('tg-greet').classList.remove('hidden')}
  }catch(error){console.warn('Telegram events:',error)}
}

/* Debug */
var DEBUG=new URLSearchParams(location.search).get('debug')==='1';
function debugAction(action){
  if(Game.mode!=='playing'&&action!=='finale'){resetGame();if(settings.sound)AudioManager.unlock();startGame()}
  if(action==='crumbs'){crumbs.forEach(function(c){c.taken=true;c.mesh.visible=false});Game.crumbs=10;updateCounters();quest(4)}
  if(action==='human'){quest(4);pug.pos.set(humanRoot.position.x+1,0,humanRoot.position.z+.4)}
  if(action==='leash'){quest(5);Game.leashPicked=true;Game.hasLeash=true;leashWorld.visible=false;P.leashCarry.visible=true}
  if(action==='yard'){doors.front.target=1;Game.frontOpen=true;removeCollider(frontDoorCollider);quest(6);pug.pos.set(5.8,0,-8.3)}
  if(action==='smells'){smellPoints.forEach(function(s){s.done=true;s.group.visible=false});Game.smells=3;updateCounters();quest(6)}
  if(action==='bedroom'){doors.bedroom.target=1;removeCollider(bedroomDoorCollider);Game.q7Triggered=true;humanRoot.position.set(1.8,0,-.6);quest(7)}
  if(action==='bed'){Game.looking=false;quest(7);pug.pos.set(bedCX,0,2.15);bedSequence()}
  if(action==='finale'){Game.mode='playing';Game.finalTime=Math.max(1,Game.time);Game.sleeping=true;Game.finished=true;pug.pos.set(bedCX,0,bedCZ);pug.groundY=bedTop;setPugState('sleep');openFinale()}
}
if(DEBUG){
  var panel=document.createElement('div');panel.id='debug-panel';panel.innerHTML='<b>QA</b><div id="debug-info"></div>'+['crumbs','human','leash','yard','smells','bedroom','bed','finale'].map(function(a){return'<button data-debug="'+a+'">'+a+'</button>'}).join('');document.body.appendChild(panel);
  panel.addEventListener('click',function(e){if(e.target.dataset.debug)debugAction(e.target.dataset.debug)});
  setInterval(function(){var el=$('debug-info');if(el)el.textContent='mode '+Game.mode+' / q'+Game.quest+' / '+(TelegramApp.active?'tg':'browser')},800);
}

/* Main loop */
function frame(now){
  requestAnimationFrame(frame);var dt=(now-lastFrame)/1000;lastFrame=now;if(dt>.05)dt=.05;
  if(!Game.paused&&!pausedByOrientation){
    if(Game.mode==='playing')updatePlaying(dt);
    else if(Game.mode==='menu'){animatePug(dt);updateCamera(dt)}
    else if(Game.mode==='finale'){animatePug(dt);Game.snoreT-=dt;if(Game.snoreT<=0){Game.snoreT=rand(3,4.5);pug.jolt=1;AudioManager.playOne('snore',.45,2200)}Game.erzIdle+=dt;if(Game.erzIdle>=20&&!Game.erzUnlocked){Game.erzUnlocked=true;unlockAchievement('erzhan')}updateCamera(dt);updateParticles(dt)}
  }
  renderer.render(scene,camera);
}

/* Start */
tryLoadGlb();resetGame();applyQuality();syncSettings();refreshBest();resize();setupTelegram();checkOrientation();requestAnimationFrame(function(t){lastFrame=t;frame(t)});
})();