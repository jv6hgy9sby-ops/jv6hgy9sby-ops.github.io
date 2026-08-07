"use strict";
(function(){
  window.MATVEY_MOBILE_INPUT_BUILD="8.0-core-key-state";

  var bridge=null;
  var joyId=null;
  var runId=null;
  var actionId=null;
  var lastDebugUpdate=0;
  var debugEl=null;
  var coreEvalSeen=false;
  var originalEval=window.eval;

  function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

  function collectLikelyNames(source){
    var names=Object.create(null);
    var re=/\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g;
    var m;
    while((m=re.exec(source))){
      if(/key|input|control|move|pug|matvey|player|character|avatar|cam|state|game|run|sprint|action|press|vel|position|pos|update|collid/i.test(m[1])) names[m[1]]=true;
    }
    re=/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g;
    while((m=re.exec(source))){
      if(/input|move|pug|matvey|player|update|collid|key|control/i.test(m[1])) names[m[1]]=true;
    }
    [
      "keys","keyState","pressedKeys","keyboard","input","inputState","controls","controlState",
      "pug","pugRoot","player","playerRoot","matvey","matveyRoot","character","avatar","cam","camera","G",
      "moveForward","moveBackward","moveLeft","moveRight","forward","backward","left","right",
      "run","running","sprint","action","actionHeld","actionPressed","interact"
    ].forEach(function(name){names[name]=true;});
    return Object.keys(names).slice(0,260);
  }

  function findOuterIifeEnd(source){
    var patterns=["})();","}());"];
    var best=-1;
    for(var i=0;i<patterns.length;i++){
      var at=source.lastIndexOf(patterns[i]);
      if(at>best)best=at;
    }
    return best;
  }

  function makeInjection(names){
    var lines=[];
    lines.push("\n;try{window.__matveyCoreScope=window.__matveyCoreScope||Object.create(null);}catch(__e){};");
    names.forEach(function(name){
      lines.push("try{window.__matveyCoreScope["+JSON.stringify(name)+"]="+name+";}catch(__e){};");
    });

    var direct={
      KeyW:["forward","moveForward"],
      ArrowUp:["forward","moveForward"],
      KeyS:["backward","moveBackward"],
      ArrowDown:["backward","moveBackward"],
      KeyA:["left","moveLeft"],
      ArrowLeft:["left","moveLeft"],
      KeyD:["right","moveRight"],
      ArrowRight:["right","moveRight"],
      ShiftLeft:["run","running","sprint"],
      ShiftRight:["run","running","sprint"],
      KeyE:["action","actionHeld","interact"],
      Space:["action","actionHeld","interact"]
    };

    lines.push("try{window.__matveyCoreDirectKey=function(__code,__down){var __n=0;");
    Object.keys(direct).forEach(function(code){
      direct[code].forEach(function(name){
        if(names.indexOf(name)>=0){
          lines.push("if(__code==="+JSON.stringify(code)+"){try{if(typeof "+name+"==='boolean'){"+name+"=!!__down;__n++;}}catch(__e){}};");
        }
      });
    });
    lines.push("return __n;};}catch(__e){};");
    return lines.join("\n")+"\n";
  }

  function instrumentCore(source){
    if(typeof source!=="string")return source;
    if(source.indexOf("matvey-game-core")<0 && source.indexOf("MATVEY_BUILD")<0 && source.length<50000)return source;
    var end=findOuterIifeEnd(source);
    if(end<0){
      window.__matveyInputInstrumentError="outer IIFE end not found";
      return source;
    }
    var names=collectLikelyNames(source);
    window.__matveyInputNames=names;
    var injected=makeInjection(names);
    coreEvalSeen=true;
    return source.slice(0,end)+injected+source.slice(end);
  }

  window.eval=function(source){
    var patched=instrumentCore(source);
    var result=originalEval(patched);
    bridge=buildBridge();
    window.__matveyCoreInputBridge=bridge;
    updateDebug(true);
    return result;
  };

  function isObject(value){return value!==null&&(typeof value==="object"||typeof value==="function");}
  function boolishObject(value){
    if(!value||typeof value!=="object"||Array.isArray(value))return false;
    var keys;
    try{keys=Object.keys(value);}catch(e){return false;}
    if(!keys.length)return true;
    var bools=0, strings=0;
    for(var i=0;i<keys.length;i++){
      var t=typeof value[keys[i]];
      if(t==="boolean")bools++;
      else if(t==="string")strings++;
    }
    return bools>0 || strings===0;
  }

  function candidateTargets(){
    var scope=window.__matveyCoreScope||{};
    var found=[];
    Object.keys(scope).forEach(function(name){
      var value=scope[name];
      if(!isObject(value))return;

      if(value.keyboard&&isObject(value.keyboard)){
        found.push({name:name+".keyboard",value:value.keyboard,score:150});
      }
      if(value.keys&&isObject(value.keys)){
        found.push({name:name+".keys",value:value.keys,score:145});
      }

      var score=0;
      if(/^keys?$/i.test(name))score+=150;
      if(/pressedKeys|keyState|keyboard/i.test(name))score+=130;
      if(/inputState|controlState/i.test(name))score+=110;
      if(/^input$/i.test(name))score+=80;
      if(/keyMap|codeMap|labels?/i.test(name))score-=180;

      if(value instanceof Set||value instanceof Map)score+=80;
      var own=[];
      try{own=Object.keys(value);}catch(e){}
      if(own.some(function(k){return /^(Key[WASDE]|Arrow(Up|Down|Left|Right)|Shift(Left|Right)|Space)$/.test(k);}))score+=130;
      if(own.some(function(k){return /^(forward|backward|left|right|run|sprint|action|interact)$/.test(k);}))score+=110;
      if(score>20&&boolishObject(value))found.push({name:name,value:value,score:score});
    });

    found.sort(function(a,b){return b.score-a.score;});
    var seen=[];
    return found.filter(function(item){
      if(seen.indexOf(item.value)>=0)return false;
      seen.push(item.value);
      return true;
    }).slice(0,8);
  }

  var variants={
    KeyW:["KeyW","w","W"], ArrowUp:["ArrowUp","KeyW","w","W"],
    KeyS:["KeyS","s","S"], ArrowDown:["ArrowDown","KeyS","s","S"],
    KeyA:["KeyA","a","A"], ArrowLeft:["ArrowLeft","KeyA","a","A"],
    KeyD:["KeyD","d","D"], ArrowRight:["ArrowRight","KeyD","d","D"],
    ShiftLeft:["ShiftLeft","ShiftRight","Shift","shift"], ShiftRight:["ShiftRight","ShiftLeft","Shift","shift"],
    KeyE:["KeyE","e","E"], Space:["Space"," "]
  };

  function semanticField(code){
    if(code==="KeyW"||code==="ArrowUp")return ["forward","moveForward","up"];
    if(code==="KeyS"||code==="ArrowDown")return ["backward","moveBackward","down"];
    if(code==="KeyA"||code==="ArrowLeft")return ["left","moveLeft"];
    if(code==="KeyD"||code==="ArrowRight")return ["right","moveRight"];
    if(code==="ShiftLeft"||code==="ShiftRight")return ["run","running","sprint"];
    if(code==="KeyE"||code==="Space")return ["action","actionHeld","interact"];
    return [];
  }

  function writeTarget(target,code,down){
    var value=target.value;
    var changed=0;
    try{
      if(value instanceof Set){
        (variants[code]||[code]).forEach(function(k){if(down)value.add(k);else value.delete(k);});
        return 1;
      }
      if(value instanceof Map){
        (variants[code]||[code]).forEach(function(k){value.set(k,!!down);});
        return 1;
      }
      if(Array.isArray(value)){
        var primary=(variants[code]||[code])[0];
        var idx=value.indexOf(primary);
        if(down&&idx<0)value.push(primary);
        if(!down&&idx>=0)value.splice(idx,1);
        return 1;
      }

      var codeVariants=variants[code]||[code];
      codeVariants.forEach(function(k){
        if(k in value || /^keys?$/i.test(target.name) || /pressedKeys|keyState|keyboard/i.test(target.name)){
          var old=value[k];
          if(old===undefined||typeof old==="boolean"){value[k]=!!down;changed++;}
        }
      });
      semanticField(code).forEach(function(field){
        if(field in value || /inputState|keyboard|controlState/i.test(target.name)){
          var old=value[field];
          if(old===undefined||typeof old==="boolean"){value[field]=!!down;changed++;}
        }
      });
    }catch(e){}
    return changed;
  }

  function findPlayerPosition(){
    var scope=window.__matveyCoreScope||{};
    var best=null;
    Object.keys(scope).forEach(function(name){
      var v=scope[name];
      if(!v)return;
      var score=0,pos=null;
      if(/pug|matvey|player|character|avatar/i.test(name))score+=80;
      try{
        if(v.pos&&typeof v.pos.x==="number"&&typeof v.pos.z==="number"){pos=v.pos;score+=120;}
        else if(v.position&&typeof v.position.x==="number"&&typeof v.position.z==="number"){pos=v.position;score+=70;}
        else if(v.isObject3D&&v.position){pos=v.position;score+=40;}
        if(v.vel&&typeof v.vel.x==="number")score+=50;
        if(typeof v.yaw==="number")score+=30;
      }catch(e){}
      if(pos&&(!best||score>best.score))best={name:name,pos:pos,score:score};
    });
    return best;
  }

  function buildBridge(){
    return {
      targets: candidateTargets(),
      setCode:function(code,down){
        var n=0;
        this.targets=candidateTargets();
        for(var i=0;i<this.targets.length;i++)n+=writeTarget(this.targets[i],code,down);
        try{if(typeof window.__matveyCoreDirectKey==="function")n+=window.__matveyCoreDirectKey(code,down)||0;}catch(e){}
        window.__matveyLastKeyWrite={code:code,down:!!down,writes:n,targets:this.targets.map(function(t){return t.name;})};
        return n;
      },
      releaseMovement:function(){
        ["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].forEach(function(code){
          bridge.setCode(code,false);
        });
      },
      getDebugState:function(){
        var p=findPlayerPosition();
        return {
          build:window.MATVEY_MOBILE_INPUT_BUILD,
          coreEvalSeen:coreEvalSeen,
          instrumentError:window.__matveyInputInstrumentError||null,
          targets:this.targets.map(function(t){return t.name+":"+t.score;}),
          lastWrite:window.__matveyLastKeyWrite||null,
          player:p?{name:p.name,x:+p.pos.x.toFixed(3),y:+((p.pos.y||0).toFixed?Number(p.pos.y||0).toFixed(3):0),z:+p.pos.z.toFixed(3),score:p.score}:null
        };
      }
    };
  }

  function getBridge(){
    if(!bridge)bridge=window.__matveyCoreInputBridge||buildBridge();
    return bridge;
  }

  function setMoveCodes(x,y){
    var b=getBridge();
    var dead=.18;
    b.setCode("KeyA",x<-dead);
    b.setCode("KeyD",x>dead);
    b.setCode("KeyW",y>dead);
    b.setCode("KeyS",y<-dead);
  }

  function installTouchControls(){
    var zone=document.getElementById("joystick-zone");
    var base=document.getElementById("joystick-base");
    var knob=document.getElementById("joystick-knob");
    var run=document.getElementById("btn-run");
    var action=document.getElementById("btn-action");
    if(!zone||!base||!knob||!run||!action)return;

    zone.style.touchAction="none";
    run.style.touchAction="none";
    action.style.touchAction="none";

    function updateJoy(clientX,clientY){
      var rect=base.getBoundingClientRect();
      var cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
      var dx=clientX-cx,dy=clientY-cy;
      var radius=Math.max(28,rect.width*.34);
      var len=Math.hypot(dx,dy)||1;
      if(len>radius){dx=dx/len*radius;dy=dy/len*radius;}
      var x=clamp(dx/radius,-1,1);
      var y=clamp(-dy/radius,-1,1);
      var mag=Math.hypot(x,y);
      if(mag<.14){x=0;y=0;}
      setMoveCodes(x,y);
      knob.style.transform="translate("+dx.toFixed(1)+"px,"+dy.toFixed(1)+"px)";
      updateDebug(false);
    }

    function endJoy(e){
      if(joyId!==null&&e&&e.pointerId!==joyId)return;
      joyId=null;
      getBridge().releaseMovement();
      knob.style.transform="translate(0px, 0px)";
      updateDebug(false);
    }

    function stop(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof e.stopImmediatePropagation==="function")e.stopImmediatePropagation();
    }

    if(window.PointerEvent){
      zone.addEventListener("pointerdown",function(e){
        if(e.pointerType==="mouse"&&e.button!==0)return;
        stop(e);joyId=e.pointerId;
        try{zone.setPointerCapture(e.pointerId);}catch(err){}
        updateJoy(e.clientX,e.clientY);
      },{passive:false,capture:true});
      zone.addEventListener("pointermove",function(e){
        if(e.pointerId!==joyId)return;
        stop(e);updateJoy(e.clientX,e.clientY);
      },{passive:false,capture:true});
      zone.addEventListener("pointerup",function(e){if(e.pointerId===joyId){stop(e);endJoy(e);}},{passive:false,capture:true});
      zone.addEventListener("pointercancel",function(e){if(e.pointerId===joyId){stop(e);endJoy(e);}},{passive:false,capture:true});
      zone.addEventListener("lostpointercapture",endJoy,true);

      run.addEventListener("pointerdown",function(e){
        stop(e);runId=e.pointerId;getBridge().setCode("ShiftLeft",true);run.classList.add("active");
        try{run.setPointerCapture(e.pointerId);}catch(err){}
      },{passive:false,capture:true});
      function endRun(e){
        if(runId!==null&&e&&e.pointerId!==runId)return;
        if(e)stop(e);runId=null;getBridge().setCode("ShiftLeft",false);run.classList.remove("active");
      }
      run.addEventListener("pointerup",endRun,{passive:false,capture:true});
      run.addEventListener("pointercancel",endRun,{passive:false,capture:true});
      run.addEventListener("lostpointercapture",function(e){if(e.pointerId===runId)endRun(null);},true);

      action.addEventListener("pointerdown",function(e){
        stop(e);actionId=e.pointerId;getBridge().setCode("KeyE",true);action.classList.add("active");
        try{action.setPointerCapture(e.pointerId);}catch(err){}
      },{passive:false,capture:true});
      function endAction(e){
        if(actionId!==null&&e&&e.pointerId!==actionId)return;
        if(e)stop(e);actionId=null;getBridge().setCode("KeyE",false);action.classList.remove("active");
      }
      action.addEventListener("pointerup",endAction,{passive:false,capture:true});
      action.addEventListener("pointercancel",endAction,{passive:false,capture:true});
      action.addEventListener("lostpointercapture",function(e){if(e.pointerId===actionId)endAction(null);},true);
    } else {
      zone.addEventListener("touchstart",function(e){
        stop(e);if(joyId!==null)return;var t=e.changedTouches[0];joyId=t.identifier;updateJoy(t.clientX,t.clientY);
      },{passive:false,capture:true});
      zone.addEventListener("touchmove",function(e){
        stop(e);for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier===joyId)updateJoy(t.clientX,t.clientY);}
      },{passive:false,capture:true});
      function touchJoyEnd(e){stop(e);for(var i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===joyId){joyId=null;getBridge().releaseMovement();knob.style.transform="translate(0px, 0px)";}}}
      zone.addEventListener("touchend",touchJoyEnd,{passive:false,capture:true});
      zone.addEventListener("touchcancel",touchJoyEnd,{passive:false,capture:true});

      run.addEventListener("touchstart",function(e){stop(e);runId=-1;getBridge().setCode("ShiftLeft",true);run.classList.add("active");},{passive:false,capture:true});
      run.addEventListener("touchend",function(e){stop(e);runId=null;getBridge().setCode("ShiftLeft",false);run.classList.remove("active");},{passive:false,capture:true});
      run.addEventListener("touchcancel",function(e){stop(e);runId=null;getBridge().setCode("ShiftLeft",false);run.classList.remove("active");},{passive:false,capture:true});

      action.addEventListener("touchstart",function(e){stop(e);actionId=-1;getBridge().setCode("KeyE",true);action.classList.add("active");},{passive:false,capture:true});
      action.addEventListener("touchend",function(e){stop(e);actionId=null;getBridge().setCode("KeyE",false);action.classList.remove("active");},{passive:false,capture:true});
      action.addEventListener("touchcancel",function(e){stop(e);actionId=null;getBridge().setCode("KeyE",false);action.classList.remove("active");},{passive:false,capture:true});
    }

    function reset(){
      try{getBridge().releaseMovement();getBridge().setCode("ShiftLeft",false);getBridge().setCode("KeyE",false);}catch(e){}
      joyId=runId=actionId=null;
      knob.style.transform="translate(0px, 0px)";
      run.classList.remove("active");action.classList.remove("active");
    }
    window.addEventListener("blur",reset);
    window.addEventListener("orientationchange",reset);
    document.addEventListener("visibilitychange",function(){if(document.hidden)reset();});
  }

  function ensureDebug(){
    var enabled=location.search.indexOf("debug=1")>=0 || location.search.indexOf("inputdebug=1")>=0;
    if(!enabled)return null;
    if(debugEl)return debugEl;
    debugEl=document.createElement("pre");
    debugEl.id="matvey-input-v8-debug";
    debugEl.style.cssText="position:fixed;left:8px;bottom:8px;z-index:9999;max-width:58vw;max-height:42vh;overflow:auto;margin:0;padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.82);color:#bdf7b8;font:11px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre-wrap";
    document.body.appendChild(debugEl);
    return debugEl;
  }

  function updateDebug(force){
    var el=ensureDebug();if(!el)return;
    var now=performance.now();if(!force&&now-lastDebugUpdate<120)return;lastDebugUpdate=now;
    var b=getBridge();
    var st=b.getDebugState();
    el.textContent="INPUT 8.0 core-key-state\ncore eval: "+st.coreEvalSeen+"\nerror: "+(st.instrumentError||"none")+"\ntargets: "+(st.targets.join(", ")||"NONE")+"\nlast: "+JSON.stringify(st.lastWrite)+"\nplayer: "+JSON.stringify(st.player);
  }

  window.MatveyCoreInputDebug={
    getState:function(){return getBridge().getDebugState();},
    setKey:function(code,down){return getBridge().setCode(code,down);},
    release:function(){getBridge().releaseMovement();}
  };

  if(document.getElementById("joystick-zone"))installTouchControls();
  else document.addEventListener("DOMContentLoaded",installTouchControls,{once:true});
  ensureDebug();
})();
