"use strict";
window.MATVEY_LOADER_BUILD="4.0-direct-state";
window.MATVEY_INPUT_BUILD="4.0-direct-state";
(function(){
  var CORE_PARTS=["assets/core-v3-01.txt","assets/core-v3-02.txt","assets/core-v3-03.txt","assets/core-v3-04.txt","assets/core-v3-05.txt","assets/core-v3-06.txt"];
  var audioPackPromise=null;
  var audioUrls={};
  var activeAudio=new Set();
  var lastStepAt=0;
  var debugPanel=null;
  var debugTimer=0;
  var patchInfo={candidates:[],registered:0,rewrites:0,build:window.MATVEY_INPUT_BUILD};

  var input=window.MatveyInput={
    moveX:0,
    moveY:0,
    run:false,
    action:false,
    actionPressed:false,
    source:"none",
    joystickPointerId:null,
    runPointerId:null,
    actionPointerId:null
  };
  window.__matveyKeyStates=[];
  window.__matveyInputPatchInfo=patchInfo;

  function fail(message,error){
    console.error(message,error||"");
    if(window.__fatal)window.__fatal(message);
  }

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

  function isTouchDevice(){
    return Boolean(
      (navigator.maxTouchPoints&&navigator.maxTouchPoints>0)||
      (window.matchMedia&&window.matchMedia("(pointer: coarse)").matches)||
      ("ontouchstart" in window)
    );
  }

  function markTouchDevice(){
    if(document.body&&isTouchDevice())document.body.classList.add("touch");
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",markTouchDevice,{once:true});
  else markTouchDevice();

  function fetchText(path){
    return fetch(path,{cache:"no-cache"}).then(function(response){
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

  function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}

  function discoverKeyStateCandidates(source){
    var found={};
    function collect(regex){
      var match;
      while((match=regex.exec(source)))found[match[1]]=true;
    }
    collect(/\b([A-Za-z_$][\w$]*)\s*\[\s*[A-Za-z_$][\w$]*\.code\s*\]\s*=/g);
    collect(/\b([A-Za-z_$][\w$]*)\s*\[\s*[A-Za-z_$][\w$]*\.key(?:\.toLowerCase\(\))?\s*\]\s*=/g);
    collect(/\b([A-Za-z_$][\w$]*)\s*\[\s*["'](?:KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)["']\s*\]/g);
    collect(/\b([A-Za-z_$][\w$]*)\.(?:KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)\b/g);
    collect(/\b([A-Za-z_$][\w$]*)\.has\(\s*["'](?:KeyW|KeyA|KeyS|KeyD|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)["']\s*\)/g);
    return Object.keys(found).filter(function(name){return name!=="window"&&name!=="document"&&name!=="Math";});
  }

  function exposeCandidateDeclarations(source,candidates){
    candidates.forEach(function(name){
      var escaped=escapeRegExp(name);
      var declaration=new RegExp("\\b(?:const|let|var)\\s+"+escaped+"\\s*=\\s*[^;]+;");
      source=source.replace(declaration,function(statement){
        patchInfo.registered++;
        return statement+"\n;try{if("+name+"&&window.__matveyKeyStates.indexOf("+name+")<0)window.__matveyKeyStates.push("+name+");}catch(__matveyExposeError){};";
      });
    });
    return source;
  }

  function isWriteContext(whole,offset,length){
    var before=whole.slice(Math.max(0,offset-18),offset);
    var after=whole.slice(offset+length);
    if(/(?:const|let|var)\s+$/.test(before))return true;
    if(/^\s*(?:=(?!=)|\+=|-=|\*=|\/=|&&=|\|\|=|\?\?=|\+\+|--)/.test(after))return true;
    return false;
  }

  function rewriteReads(source,regex,condition){
    return source.replace(regex,function(){
      var args=Array.prototype.slice.call(arguments);
      var match=args[0];
      var offset=args[args.length-2];
      var whole=args[args.length-1];
      if(isWriteContext(whole,offset,match.length))return match;
      patchInfo.rewrites++;
      return "("+match+"||("+condition+"))";
    });
  }

  function patchCoreForDirectInput(source){
    var candidates=discoverKeyStateCandidates(source);
    patchInfo.candidates=candidates.slice();
    source=exposeCandidateDeclarations(source,candidates);

    var chain="(?:[A-Za-z_$][\\w$]*\\.)*[A-Za-z_$][\\w$]*";
    var maps=[
      {tokens:["KeyW","ArrowUp"],condition:"window.MatveyInput&&window.MatveyInput.moveY>0.12"},
      {tokens:["KeyS","ArrowDown"],condition:"window.MatveyInput&&window.MatveyInput.moveY<-0.12"},
      {tokens:["KeyA","ArrowLeft"],condition:"window.MatveyInput&&window.MatveyInput.moveX<-0.12"},
      {tokens:["KeyD","ArrowRight"],condition:"window.MatveyInput&&window.MatveyInput.moveX>0.12"},
      {tokens:["ShiftLeft","ShiftRight"],condition:"window.MatveyInput&&window.MatveyInput.run"},
      {tokens:["KeyE","Space"],condition:"window.MatveyInput&&window.MatveyInput.action"}
    ];

    maps.forEach(function(map){
      var tokenGroup=map.tokens.join("|");
      source=rewriteReads(source,new RegExp("\\b"+chain+"\\.(?:"+tokenGroup+")\\b","g"),map.condition);
      source=rewriteReads(source,new RegExp("\\b"+chain+"\\s*\\[\\s*[\\\"'](?:"+tokenGroup+")[\\\"']\\s*\\]","g"),map.condition);
      source=rewriteReads(source,new RegExp("\\b"+chain+"\\.has\\(\\s*[\\\"'](?:"+tokenGroup+")[\\\"']\\s*\\)","g"),map.condition);
    });

    candidates.forEach(function(name){
      var n=escapeRegExp(name);
      var lowerMaps=[
        {tokens:["w","W"],condition:"window.MatveyInput&&window.MatveyInput.moveY>0.12"},
        {tokens:["s","S"],condition:"window.MatveyInput&&window.MatveyInput.moveY<-0.12"},
        {tokens:["a","A"],condition:"window.MatveyInput&&window.MatveyInput.moveX<-0.12"},
        {tokens:["d","D"],condition:"window.MatveyInput&&window.MatveyInput.moveX>0.12"},
        {tokens:["shift","Shift"],condition:"window.MatveyInput&&window.MatveyInput.run"},
        {tokens:["e","E"," "],condition:"window.MatveyInput&&window.MatveyInput.action"}
      ];
      lowerMaps.forEach(function(map){
        var tokenGroup=map.tokens.map(escapeRegExp).join("|");
        source=rewriteReads(source,new RegExp("\\b"+n+"\\s*\\[\\s*[\\\"'](?:"+tokenGroup+")[\\\"']\\s*\\]","g"),map.condition);
        if(map.tokens.indexOf(" ")<0){
          source=rewriteReads(source,new RegExp("\\b"+n+"\\.(?:"+tokenGroup+")\\b","g"),map.condition);
          source=rewriteReads(source,new RegExp("\\b"+n+"\\.has\\(\\s*[\\\"'](?:"+tokenGroup+")[\\\"']\\s*\\)","g"),map.condition);
        }
      });
    });

    source+="\n;try{window.__matveyCoreInputPatched=true;}catch(__matveyCorePatchFlagError){};";
    return source;
  }

  function setStateValue(state,key,value){
    try{
      if(state instanceof Set){if(value)state.add(key);else state.delete(key);return;}
      if(state instanceof Map){state.set(key,value);return;}
      if(state&&typeof state==="object")state[key]=value;
    }catch(error){}
  }

  function applyVariants(state,variants,value){
    variants.forEach(function(key){setStateValue(state,key,value);});
  }

  function syncCoreKeyStates(){
    var states=window.__matveyKeyStates||[];
    var forward=input.moveY>0.12,backward=input.moveY<-0.12,left=input.moveX<-0.12,right=input.moveX>0.12;
    states.forEach(function(state){
      applyVariants(state,["KeyW","ArrowUp","w","W",87,"87"],forward);
      applyVariants(state,["KeyS","ArrowDown","s","S",83,"83"],backward);
      applyVariants(state,["KeyA","ArrowLeft","a","A",65,"65"],left);
      applyVariants(state,["KeyD","ArrowRight","d","D",68,"68"],right);
      applyVariants(state,["ShiftLeft","ShiftRight","Shift","shift",16,"16"],input.run);
      applyVariants(state,["KeyE","Space","e","E"," ",69,"69",32,"32"],input.action);
    });
  }

  function resetMobileInput(){
    input.moveX=0;
    input.moveY=0;
    input.run=false;
    input.action=false;
    input.actionPressed=false;
    input.source="none";
    input.joystickPointerId=null;
    input.runPointerId=null;
    input.actionPointerId=null;
    var knob=document.getElementById("joystick-knob");
    var run=document.getElementById("btn-run");
    var action=document.getElementById("btn-action");
    if(knob)knob.style.transform="translate(0px, 0px)";
    if(run)run.classList.remove("active");
    if(action)action.classList.remove("active");
    syncCoreKeyStates();
  }
  window.resetMobileInput=resetMobileInput;

  function installMobileControls(){
    var zone=document.getElementById("joystick-zone");
    var base=document.getElementById("joystick-base");
    var knob=document.getElementById("joystick-knob");
    var run=document.getElementById("btn-run");
    var action=document.getElementById("btn-action");
    if(!zone||!base||!knob||!run||!action){
      console.error("Matvey touch UI missing");
      return;
    }

    markTouchDevice();
    zone.style.touchAction="none";
    run.style.touchAction="none";
    action.style.touchAction="none";

    function updateJoystick(clientX,clientY){
      var rect=base.getBoundingClientRect();
      var cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      var dx=clientX-cx,dy=clientY-cy;
      var radius=Math.max(28,rect.width*.34);
      var length=Math.hypot(dx,dy)||1;
      if(length>radius){dx=dx/length*radius;dy=dy/length*radius;}
      var nx=clamp(dx/radius,-1,1);
      var ny=clamp(-dy/radius,-1,1);
      var magnitude=Math.hypot(nx,ny);
      var dead=.14;
      if(magnitude<dead){nx=0;ny=0;}
      else if(magnitude>1){nx/=magnitude;ny/=magnitude;}
      input.moveX=nx;
      input.moveY=ny;
      input.source="touch";
      knob.style.transform="translate("+dx.toFixed(1)+"px,"+dy.toFixed(1)+"px)";
      syncCoreKeyStates();
      if(magnitude>.28&&Date.now()-lastStepAt>310){
        lastStepAt=Date.now();
        playAudio("step","sfx",.25);
      }
    }

    function endJoystick(event){
      if(input.joystickPointerId!==null&&event&&event.pointerId!==input.joystickPointerId)return;
      try{if(input.joystickPointerId!==null&&zone.hasPointerCapture(input.joystickPointerId))zone.releasePointerCapture(input.joystickPointerId);}catch(error){}
      input.joystickPointerId=null;
      input.moveX=0;
      input.moveY=0;
      knob.style.transform="translate(0px, 0px)";
      syncCoreKeyStates();
    }

    if(window.PointerEvent){
      zone.addEventListener("pointerdown",function(event){
        if(event.pointerType==="mouse"&&event.button!==0)return;
        if(input.joystickPointerId!==null&&input.joystickPointerId!==event.pointerId)return;
        event.preventDefault();
        event.stopPropagation();
        input.joystickPointerId=event.pointerId;
        try{zone.setPointerCapture(event.pointerId);}catch(error){}
        updateJoystick(event.clientX,event.clientY);
      },{passive:false});
      zone.addEventListener("pointermove",function(event){
        if(event.pointerId!==input.joystickPointerId)return;
        event.preventDefault();
        event.stopPropagation();
        updateJoystick(event.clientX,event.clientY);
      },{passive:false});
      zone.addEventListener("pointerup",endJoystick,{passive:false});
      zone.addEventListener("pointercancel",endJoystick,{passive:false});
      zone.addEventListener("lostpointercapture",endJoystick);

      run.addEventListener("pointerdown",function(event){
        if(event.pointerType==="mouse"&&event.button!==0)return;
        if(input.runPointerId!==null&&input.runPointerId!==event.pointerId)return;
        event.preventDefault();
        event.stopPropagation();
        input.runPointerId=event.pointerId;
        input.run=true;
        input.source="touch";
        run.classList.add("active");
        try{run.setPointerCapture(event.pointerId);}catch(error){}
        syncCoreKeyStates();
      },{passive:false});
      function endRun(event){
        if(input.runPointerId!==null&&event&&event.pointerId!==input.runPointerId)return;
        input.runPointerId=null;
        input.run=false;
        run.classList.remove("active");
        syncCoreKeyStates();
      }
      run.addEventListener("pointerup",endRun,{passive:false});
      run.addEventListener("pointercancel",endRun,{passive:false});
      run.addEventListener("lostpointercapture",endRun);

      action.addEventListener("pointerdown",function(event){
        if(event.pointerType==="mouse"&&event.button!==0)return;
        if(input.actionPointerId!==null&&input.actionPointerId!==event.pointerId)return;
        event.preventDefault();
        event.stopPropagation();
        input.actionPointerId=event.pointerId;
        input.action=true;
        input.actionPressed=true;
        input.source="touch";
        action.classList.add("active");
        try{action.setPointerCapture(event.pointerId);}catch(error){}
        syncCoreKeyStates();
        requestAnimationFrame(function(){input.actionPressed=false;});
      },{passive:false});
      function endAction(event){
        if(input.actionPointerId!==null&&event&&event.pointerId!==input.actionPointerId)return;
        input.actionPointerId=null;
        input.action=false;
        input.actionPressed=false;
        action.classList.remove("active");
        syncCoreKeyStates();
      }
      action.addEventListener("pointerup",endAction,{passive:false});
      action.addEventListener("pointercancel",endAction,{passive:false});
      action.addEventListener("lostpointercapture",endAction);
    }else{
      zone.addEventListener("touchstart",function(event){
        if(!event.changedTouches.length)return;
        event.preventDefault();
        var touch=event.changedTouches[0];
        input.joystickPointerId=touch.identifier;
        updateJoystick(touch.clientX,touch.clientY);
      },{passive:false});
      zone.addEventListener("touchmove",function(event){
        for(var i=0;i<event.changedTouches.length;i++){
          var touch=event.changedTouches[i];
          if(touch.identifier===input.joystickPointerId){event.preventDefault();updateJoystick(touch.clientX,touch.clientY);break;}
        }
      },{passive:false});
      zone.addEventListener("touchend",function(event){
        for(var i=0;i<event.changedTouches.length;i++)if(event.changedTouches[i].identifier===input.joystickPointerId){endJoystick(null);break;}
      },{passive:false});
      zone.addEventListener("touchcancel",function(){endJoystick(null);},{passive:false});
    }

    [zone,run,action].forEach(function(element){element.addEventListener("contextmenu",function(event){event.preventDefault();});});

    window.addEventListener("blur",resetMobileInput);
    window.addEventListener("pagehide",resetMobileInput);
    window.addEventListener("orientationchange",resetMobileInput);
    document.addEventListener("visibilitychange",function(){if(document.hidden){resetMobileInput();stopBridgeAudio();}});

    function keepCoreStateSynced(){
      if(input.moveX||input.moveY||input.run||input.action)syncCoreKeyStates();
      requestAnimationFrame(keepCoreStateSynced);
    }
    requestAnimationFrame(keepCoreStateSynced);
  }

  function installAudioHooks(){
    var start=document.getElementById("btn-start");
    if(start)start.addEventListener("pointerdown",function(){playAudio("collect","sfx",.28);playAudio("voice-start","voice",.88);},{passive:true});
    document.querySelectorAll(".btn,.icon-btn").forEach(function(button){
      if(button===start)return;
      button.addEventListener("pointerdown",function(){playAudio("collect","sfx",.14);},{passive:true});
    });
  }

  function installInputDebug(){
    var params=new URLSearchParams(location.search);
    if(!params.has("inputdebug")&&!params.has("debug"))return;
    debugPanel=document.createElement("div");
    debugPanel.id="matvey-input-debug";
    debugPanel.style.cssText="position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:9999;background:rgba(0,0,0,.78);color:#fff;padding:7px 10px;border-radius:10px;font:11px/1.35 monospace;pointer-events:none;max-width:70vw;white-space:pre-wrap";
    document.body.appendChild(debugPanel);
    window.setInterval(function(){
      if(!debugPanel)return;
      debugPanel.textContent="INPUT "+window.MATVEY_INPUT_BUILD+" | refs "+(window.__matveyKeyStates||[]).length+" | candidates "+patchInfo.candidates.join(",")+" | rewrites "+patchInfo.rewrites+"\nmoveX "+input.moveX.toFixed(2)+" moveY "+input.moveY.toFixed(2)+" run "+input.run+" action "+input.action+" pointer "+input.joystickPointerId+" corePatched "+Boolean(window.__matveyCoreInputPatched);
    },250);
  }

  function installHotfixes(){
    markTouchDevice();
    installMobileControls();
    installAudioHooks();
    installInputDebug();
    document.documentElement.setAttribute("data-matvey-input","4.0");
  }

  loadPortrait();
  loadAudioPack();
  Promise.all(CORE_PARTS.map(fetchText)).then(function(parts){
    return inflate(decodeBase64(parts.join("")));
  }).then(function(code){
    var patched=patchCoreForDirectInput(code);
    window.eval(patched+"\n//# sourceURL=matvey-game-core-v4-direct-input.js");
    installHotfixes();
    syncCoreKeyStates();
  }).catch(function(error){
    fail("Не удалось загрузить игровой код. Обновите страницу.",error);
  });
})();
