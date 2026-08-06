"use strict";
window.MATVEY_LOADER_BUILD="3.2-mobile-hotfix";
(function(){
  var CORE_PARTS=["assets/core-v3-01.txt","assets/core-v3-02.txt","assets/core-v3-03.txt","assets/core-v3-04.txt","assets/core-v3-05.txt","assets/core-v3-06.txt"];
  var audioPackPromise=null;
  var audioUrls={};
  var activeAudio=new Set();
  var lastStepAt=0;

  function fail(message,error){
    console.error(message,error||"");
    if(window.__fatal)window.__fatal(message);
  }

  function fetchText(path){
    return fetch(path,{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error(path+" HTTP "+response.status);
      return response.text();
    });
  }

  function loadPortrait(){
    var image=document.querySelector(".portrait img");
    if(!image)return;
    fetchText("assets/portrait-v3.txt").then(function(data){
      var clean=data.replace(/\s+/g,"");
      if(clean)image.src="data:image/webp;base64,"+clean;
    }).catch(function(error){console.warn("Matvey portrait fallback:",error);});
  }

  function decodeBase64(value){
    var raw=atob(value.replace(/\s+/g,"")),bytes=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return bytes;
  }

  function loadPako(){
    return new Promise(function(resolve,reject){
      if(window.pako){resolve(window.pako);return;}
      var script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js";
      script.async=true;
      script.onload=function(){window.pako?resolve(window.pako):reject(new Error("pako missing"));};
      script.onerror=function(){reject(new Error("pako load failed"));};
      document.head.appendChild(script);
    });
  }

  function inflate(bytes){
    if(typeof DecompressionStream==="function"){
      var stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).text();
    }
    return loadPako().then(function(pako){
      return new TextDecoder("utf-8").decode(pako.ungzip(bytes));
    });
  }

  function readSettings(){
    try{return JSON.parse(localStorage.getItem("matvey.settings.v2")||"null")||{};}catch(error){return {};}
  }

  function soundAllowed(kind){
    var settings=readSettings();
    if(settings.sound===false)return false;
    if(kind==="voice"&&Number(settings.voice)===0)return false;
    if(kind==="sfx"&&Number(settings.sfx)===0)return false;
    return true;
  }

  function volumeFor(kind,base){
    var settings=readSettings();
    var factor=kind==="voice"?(Number.isFinite(Number(settings.voice))?Number(settings.voice):.9):(Number.isFinite(Number(settings.sfx))?Number(settings.sfx):.7);
    return Math.max(0,Math.min(1,base*factor));
  }

  function loadAudioPack(){
    if(audioPackPromise)return audioPackPromise;
    audioPackPromise=fetchText("assets/audio-pack-v3.txt").then(function(encoded){
      return inflate(decodeBase64(encoded));
    }).then(function(json){
      var pack=JSON.parse(json),files=pack.files||{},paths=pack.paths||{};
      Object.keys(files).forEach(function(key){
        var bytes=decodeBase64(files[key]);
        audioUrls[key]=URL.createObjectURL(new Blob([bytes],{type:"audio/mpeg"}));
      });
      Object.keys(paths).forEach(function(path){
        if(audioUrls[paths[path]])audioUrls[path]=audioUrls[paths[path]];
      });
      return audioUrls;
    }).catch(function(error){
      console.warn("Matvey audio pack unavailable:",error);
      return audioUrls;
    });
    return audioPackPromise;
  }

  function playAudio(key,kind,baseVolume){
    if(!soundAllowed(kind))return Promise.resolve(false);
    return loadAudioPack().then(function(urls){
      var url=urls[key]||urls["assets/audio/"+key];
      if(!url)return false;
      var audio=new Audio(url);
      audio.preload="auto";
      audio.volume=volumeFor(kind,baseVolume);
      activeAudio.add(audio);
      function cleanup(){activeAudio.delete(audio);audio.onended=null;audio.onerror=null;}
      audio.onended=cleanup;audio.onerror=cleanup;
      var result=audio.play();
      if(result&&typeof result.catch==="function")result.catch(function(error){cleanup();console.warn("Audio play blocked:",error);});
      return true;
    });
  }

  function stopBridgeAudio(){
    activeAudio.forEach(function(audio){try{audio.pause();audio.currentTime=0;}catch(error){}});
    activeAudio.clear();
  }

  function dispatchKey(code,down){
    var keyMap={KeyW:"w",KeyA:"a",KeyS:"s",KeyD:"d",ShiftLeft:"Shift",KeyE:"e"};
    window.dispatchEvent(new KeyboardEvent(down?"keydown":"keyup",{code:code,key:keyMap[code]||"",bubbles:true,cancelable:true}));
  }

  function installMobileControls(){
    var zone=document.getElementById("joystick-zone");
    var base=document.getElementById("joystick-base");
    var knob=document.getElementById("joystick-knob");
    var run=document.getElementById("btn-run");
    var action=document.getElementById("btn-action");
    if(!zone||!base||!knob)return;

    var pointerId=null;
    var pressed={KeyW:false,KeyA:false,KeyS:false,KeyD:false};
    zone.style.touchAction="none";
    run.style.touchAction="none";
    action.style.touchAction="none";

    function setKey(code,value){
      if(pressed[code]===value)return;
      pressed[code]=value;
      dispatchKey(code,value);
    }

    function releaseDirection(){
      Object.keys(pressed).forEach(function(code){setKey(code,false);});
      knob.style.transform="translate(0px, 0px)";
    }

    function updateDirection(clientX,clientY){
      var rect=base.getBoundingClientRect();
      var cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      var dx=clientX-cx,dy=clientY-cy;
      var radius=Math.max(28,rect.width*.34);
      var length=Math.hypot(dx,dy)||1;
      if(length>radius){dx=dx/length*radius;dy=dy/length*radius;}
      knob.style.transform="translate("+dx.toFixed(1)+"px,"+dy.toFixed(1)+"px)";
      var nx=dx/radius,ny=dy/radius,dead=.18;
      setKey("KeyA",nx<-dead);setKey("KeyD",nx>dead);
      setKey("KeyW",ny<-dead);setKey("KeyS",ny>dead);
      if(Math.hypot(nx,ny)>.28&&Date.now()-lastStepAt>310){
        lastStepAt=Date.now();
        playAudio("step","sfx",.32);
      }
    }

    function endPointer(event){
      if(pointerId!==null&&event&&event.pointerId!==pointerId)return;
      try{if(pointerId!==null&&zone.hasPointerCapture(pointerId))zone.releasePointerCapture(pointerId);}catch(error){}
      pointerId=null;releaseDirection();
    }

    zone.addEventListener("pointerdown",function(event){
      if(event.pointerType==="mouse"&&event.button!==0)return;
      event.preventDefault();pointerId=event.pointerId;
      try{zone.setPointerCapture(pointerId);}catch(error){}
      updateDirection(event.clientX,event.clientY);
      playAudio("collect","sfx",.16);
    },{passive:false});
    zone.addEventListener("pointermove",function(event){
      if(event.pointerId!==pointerId)return;
      event.preventDefault();updateDirection(event.clientX,event.clientY);
    },{passive:false});
    zone.addEventListener("pointerup",endPointer,{passive:false});
    zone.addEventListener("pointercancel",endPointer,{passive:false});
    zone.addEventListener("lostpointercapture",endPointer);

    function bindHold(button,code){
      var id=null;
      button.addEventListener("pointerdown",function(event){
        event.preventDefault();id=event.pointerId;
        try{button.setPointerCapture(id);}catch(error){}
        dispatchKey(code,true);button.classList.add("active");
        playAudio(code==="KeyE"?"collect":"step","sfx",code==="KeyE"?.38:.22);
      },{passive:false});
      function finish(event){
        if(id!==null&&event&&event.pointerId!==id)return;
        dispatchKey(code,false);button.classList.remove("active");id=null;
      }
      button.addEventListener("pointerup",finish,{passive:false});
      button.addEventListener("pointercancel",finish,{passive:false});
      button.addEventListener("lostpointercapture",finish);
    }
    bindHold(run,"ShiftLeft");
    bindHold(action,"KeyE");

    function reset(){releaseDirection();dispatchKey("ShiftLeft",false);dispatchKey("KeyE",false);}
    window.addEventListener("blur",reset);
    window.addEventListener("orientationchange",reset);
    document.addEventListener("visibilitychange",function(){if(document.hidden){reset();stopBridgeAudio();}});
  }

  function installAudioHooks(){
    var start=document.getElementById("btn-start");
    if(start){
      start.addEventListener("pointerdown",function(){
        playAudio("collect","sfx",.28);
        playAudio("voice-start","voice",.88);
      },{passive:true});
    }
    document.querySelectorAll(".btn,.icon-btn").forEach(function(button){
      if(button===start)return;
      button.addEventListener("pointerdown",function(){playAudio("collect","sfx",.14);},{passive:true});
    });
    var mute=document.getElementById("btn-mute");
    if(mute)mute.addEventListener("click",function(){setTimeout(function(){if(!soundAllowed("sfx"))stopBridgeAudio();},0);});
  }

  function installHotfixes(){
    installMobileControls();
    installAudioHooks();
    document.documentElement.setAttribute("data-matvey-hotfix","3.2");
  }

  loadPortrait();
  loadAudioPack();
  Promise.all(CORE_PARTS.map(fetchText)).then(function(parts){
    return inflate(decodeBase64(parts.join("")));
  }).then(function(code){
    window.eval(code+"\n//# sourceURL=matvey-game-core-v3.js");
    installHotfixes();
  }).catch(function(error){
    fail("Не удалось загрузить игровой код. Обновите страницу.",error);
  });
})();
