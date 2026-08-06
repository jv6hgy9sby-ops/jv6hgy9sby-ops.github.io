"use strict";
(function(){
  window.MATVEY_POST_CORE_BUILD="7.1-persistent-position";

  var trackedObjects=[];
  var trackedScenes=[];
  var namedCandidates=[];
  var selectedPlayer=null;
  var selectedCamera=null;
  var selectedReason="searching";
  var targetPosition=null;
  var lastFrame=performance.now();
  var lastSelectAt=0;
  var movedDistance=0;
  var appliedFrames=0;
  var coreResetCount=0;
  var debugPanel=null;
  var loopStarted=false;
  var originalEval=window.eval;

  function pushUnique(list,value){
    if(value&&list.indexOf(value)<0)list.push(value);
  }

  function installThreeCapture(){
    if(!window.THREE||window.__matveyPostCoreThreeCapture)return;
    window.__matveyPostCoreThreeCapture=true;

    var originalAdd=THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add=function(){
      pushUnique(trackedObjects,this);
      for(var i=0;i<arguments.length;i++)pushUnique(trackedObjects,arguments[i]);
      return originalAdd.apply(this,arguments);
    };

    var OriginalScene=THREE.Scene;
    function CapturedScene(){
      var scene=Reflect.construct(OriginalScene,arguments,new.target||CapturedScene);
      pushUnique(trackedScenes,scene);
      pushUnique(trackedObjects,scene);
      return scene;
    }
    CapturedScene.prototype=OriginalScene.prototype;
    Object.setPrototypeOf(CapturedScene,OriginalScene);
    THREE.Scene=CapturedScene;
  }

  function instrumentCore(source){
    if(typeof source!=="string")return source;
    var found={};
    var declaration=/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
    var match;
    while((match=declaration.exec(source))){
      if(/matvey|player|pug|dog|hero|character|avatar|camera|scene/i.test(match[1]))found[match[1]]=true;
    }

    var tail="\n;try{window.__matveyPostCoreNamed=window.__matveyPostCoreNamed||[];}catch(e){};\n";
    Object.keys(found).slice(0,160).forEach(function(name){
      tail+="try{window.__matveyPostCoreNamed.push({name:"+JSON.stringify(name)+",value:"+name+"});}catch(e){};\n";
    });
    return source+tail;
  }

  window.eval=function(source){
    if(typeof source==="string"&&source.indexOf("matvey-game-core")!==-1){
      source=instrumentCore(source);
    }
    return originalEval(source);
  };

  function objectFromValue(value){
    if(!value)return null;
    if(value.isObject3D)return value;
    var keys=["root","group","object","model","mesh","player","matvey","character","avatar","container"];
    for(var i=0;i<keys.length;i++){
      var candidate=value[keys[i]];
      if(candidate&&candidate.isObject3D)return candidate;
    }
    return null;
  }

  function collectNamed(){
    var list=window.__matveyPostCoreNamed||[];
    list.forEach(function(item){
      if(!item||!item.value)return;
      if(!namedCandidates.some(function(existing){return existing.name===item.name&&existing.value===item.value;})){
        namedCandidates.push(item);
      }
      var object=objectFromValue(item.value);
      if(object)pushUnique(trackedObjects,object);
      if(object&&object.isScene)pushUnique(trackedScenes,object);
    });
  }

  function countDescendants(object){
    var count=0;
    try{object.traverse(function(){count++;});}catch(error){}
    return count;
  }

  function subtreeText(object){
    var chunks=[];
    try{
      object.traverse(function(child){
        if(chunks.length>120)return;
        if(child.name)chunks.push(child.name);
        if(child.userData){
          try{chunks.push(JSON.stringify(child.userData));}catch(error){}
        }
      });
    }catch(error){}
    return chunks.join(" ").toLowerCase();
  }

  function boxInfo(object){
    if(!window.THREE||!object||!object.isObject3D)return null;
    try{
      object.updateWorldMatrix(true,true);
      var box=new THREE.Box3().setFromObject(object);
      if(box.isEmpty())return null;
      var size=new THREE.Vector3();
      var center=new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      return {size:size,center:center};
    }catch(error){return null;}
  }

  function findCamera(){
    collectNamed();
    for(var i=0;i<namedCandidates.length;i++){
      if(/camera/i.test(namedCandidates[i].name)){
        var candidate=objectFromValue(namedCandidates[i].value);
        if(candidate&&candidate.isCamera)return candidate;
      }
    }
    for(var j=0;j<trackedObjects.length;j++){
      if(trackedObjects[j]&&trackedObjects[j].isPerspectiveCamera)return trackedObjects[j];
    }
    for(var s=0;s<trackedScenes.length;s++){
      var found=null;
      try{trackedScenes[s].traverse(function(object){if(!found&&object.isPerspectiveCamera)found=object;});}catch(error){}
      if(found)return found;
    }
    return null;
  }

  function scoreCandidate(object,label,camera){
    if(!object||!object.isObject3D||object.isScene||object.isCamera||object.isLight||object.visible===false)return -Infinity;

    var text=((label||"")+" "+(object.name||"")+" "+subtreeText(object)).toLowerCase();
    var score=0;
    if(/matvey|матвей/.test(text))score+=1800;
    if(/pug|мопс/.test(text))score+=1400;
    if(/player|hero|avatar/.test(text))score+=1000;
    if(/dog|character/.test(text))score+=650;
    if(/head|body|leg|paw|tail|ear|muzzle|harness/.test(text))score+=260;
    if(/nastya|nikita|human|person|npc/.test(text))score-=1000;
    if(/room|floor|wall|door|bed|sofa|table|chair|vacuum|crumb|smell|light|scene|world|house|ceiling|carpet|rug/.test(text))score-=900;

    var info=boxInfo(object);
    if(!info)return score-800;
    var size=info.size;
    var max=Math.max(size.x,size.y,size.z);
    var min=Math.min(size.x,size.y,size.z);
    var descendants=countDescendants(object);

    if(max>.25&&max<3.5)score+=320;
    else if(max>=3.5)score-=900;
    if(size.y>.18&&size.y<2)score+=220;
    if(size.y>=2.5)score-=500;
    if(descendants>=5&&descendants<=240)score+=Math.min(360,descendants*5);
    if(descendants<3)score-=180;
    if(min===0)score-=90;
    if(object.parent&&object.parent.isScene)score+=140;

    if(camera){
      try{
        var projected=info.center.clone().project(camera);
        if(projected.z>-1&&projected.z<1){
          score+=Math.max(0,300-Math.hypot(projected.x,projected.y)*250);
        }
      }catch(error){}
    }
    return score;
  }

  function movableRoot(object){
    var current=object;
    while(current&&current.parent&&!current.parent.isScene){
      var parent=current.parent;
      var text=((parent.name||"")+" "+subtreeText(parent)).toLowerCase();
      var info=boxInfo(parent);
      var max=info?Math.max(info.size.x,info.size.y,info.size.z):Infinity;
      if(/room|world|house|environment|level|floor|carpet|rug/.test(text))break;
      if(max>4.5||countDescendants(parent)>280)break;
      current=parent;
    }
    return current||object;
  }

  function gatherCandidates(){
    collectNamed();
    var result=[];
    namedCandidates.forEach(function(item){
      var object=objectFromValue(item.value);
      if(object)result.push({object:object,label:item.name});
    });
    trackedScenes.forEach(function(scene){
      try{scene.traverse(function(object){if(object&&object.isObject3D)result.push({object:object,label:object.name||"scene-object"});});}catch(error){}
    });
    trackedObjects.forEach(function(object){if(object&&object.isObject3D)result.push({object:object,label:object.name||"tracked-object"});});

    var seen=[];
    return result.filter(function(item){
      if(seen.indexOf(item.object)>=0)return false;
      seen.push(item.object);
      return true;
    });
  }

  function selectPlayer(force){
    var now=performance.now();
    if(!force&&selectedPlayer&&selectedPlayer.parent&&now-lastSelectAt<2500)return selectedPlayer;
    selectedCamera=findCamera()||selectedCamera;
    var best=null;
    var bestScore=-Infinity;
    gatherCandidates().forEach(function(item){
      var score=scoreCandidate(item.object,item.label,selectedCamera);
      if(score>bestScore){bestScore=score;best=item;}
    });
    if(best&&bestScore>100){
      var root=movableRoot(best.object);
      if(root!==selectedPlayer){
        selectedPlayer=root;
        targetPosition=root.position.clone();
      }
      selectedReason=(best.label||best.object.name||"object")+" score="+Math.round(bestScore)+" root="+(root.name||root.type||"unnamed");
      lastSelectAt=now;
      window.__matveyPostCorePlayer=selectedPlayer;
      window.__matveyPostCorePlayerScore=bestScore;
    }
    return selectedPlayer;
  }

  function gameAllowsMovement(){
    var hud=document.getElementById("hud");
    var start=document.getElementById("screen-start");
    var pause=document.getElementById("screen-pause");
    var finale=document.getElementById("screen-finale");
    if(!hud||hud.classList.contains("hidden"))return false;
    if(start&&!start.classList.contains("hidden"))return false;
    if(pause&&!pause.classList.contains("hidden"))return false;
    if(finale&&!finale.classList.contains("hidden"))return false;
    return true;
  }

  function applyPersistentMovement(dt){
    if(!gameAllowsMovement())return;
    var input=window.MatveyInput;
    if(!input)return;

    var player=selectPlayer(false);
    var camera=selectedCamera||findCamera();
    if(!player||!camera)return;
    if(!targetPosition)targetPosition=player.position.clone();

    var divergence=player.position.distanceTo(targetPosition);
    if(divergence>.12&&Math.hypot(Number(input.moveX)||0,Number(input.moveY)||0)>.08){
      coreResetCount++;
    }

    var x=Number(input.moveX)||0;
    var y=Number(input.moveY)||0;
    var magnitude=Math.hypot(x,y);

    if(magnitude>.08){
      var forward=new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y=0;
      if(forward.lengthSq()<.0001)forward.set(0,0,-1);
      forward.normalize();
      var right=new THREE.Vector3(-forward.z,0,forward.x);
      var direction=forward.multiplyScalar(y).add(right.multiplyScalar(x));
      if(direction.lengthSq()>.0001){
        var analog=Math.min(1,direction.length());
        direction.normalize();
        var speed=(input.run?4.4:2.3)*analog;
        var distance=speed*Math.min(dt,.05);
        targetPosition.x+=direction.x*distance;
        targetPosition.z+=direction.z*distance;
        movedDistance+=distance;

        var targetYaw=Math.atan2(direction.x,direction.z);
        var diff=Math.atan2(Math.sin(targetYaw-player.rotation.y),Math.cos(targetYaw-player.rotation.y));
        player.rotation.y+=diff*Math.min(1,dt*12);
      }
    }

    player.position.copy(targetPosition);
    player.updateMatrixWorld(true);
    appliedFrames++;

    window.__matveyPostCoreState={
      build:window.MATVEY_POST_CORE_BUILD,
      input:{x:x,y:y,run:Boolean(input.run)},
      position:{x:player.position.x,y:player.position.y,z:player.position.z},
      movedDistance:movedDistance,
      appliedFrames:appliedFrames,
      coreResetCount:coreResetCount,
      selectedReason:selectedReason
    };
  }

  function installBadge(){
    var badge=document.createElement("div");
    badge.id="matvey-live-build-badge";
    badge.textContent="LIVE BUILD 7.1";
    badge.style.cssText="position:fixed;left:8px;top:max(8px,env(safe-area-inset-top));z-index:10060;background:#102515;color:#c9ffce;border:1px solid #5ce06b;border-radius:8px;padding:5px 8px;font:700 10px/1.2 monospace;pointer-events:none;box-shadow:0 4px 18px rgba(0,0,0,.38)";
    document.body.appendChild(badge);
  }

  function installDebug(){
    var params=new URLSearchParams(location.search);
    if(!params.has("debug")&&!params.has("inputdebug")&&!params.has("build"))return;
    debugPanel=document.createElement("div");
    debugPanel.id="matvey-post-core-debug";
    debugPanel.style.cssText="position:fixed;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:10060;max-width:58vw;background:rgba(5,8,5,.92);color:#d3ffd0;border:1px solid rgba(168,255,137,.6);border-radius:10px;padding:7px 9px;font:10px/1.32 monospace;pointer-events:none;white-space:pre-wrap";
    document.body.appendChild(debugPanel);
    setInterval(function(){
      var input=window.MatveyInput||{};
      var player=selectedPlayer;
      var pos=player?player.position:null;
      debugPanel.textContent=
        "POST CORE 7.1 | loader "+String(window.MATVEY_LOADER_BUILD||"waiting")+"\n"+
        "input "+Number(input.moveX||0).toFixed(2)+","+Number(input.moveY||0).toFixed(2)+" run="+Boolean(input.run)+"\n"+
        "player "+selectedReason+"\n"+
        "pos "+(pos?[pos.x.toFixed(2),pos.y.toFixed(2),pos.z.toFixed(2)].join(","):"none")+" moved="+movedDistance.toFixed(2)+"\n"+
        "frames="+appliedFrames+" resets="+coreResetCount+" scenes="+trackedScenes.length+" objects="+trackedObjects.length+" named="+namedCandidates.length;
    },200);
  }

  function frame(now){
    var dt=(now-lastFrame)/1000;
    lastFrame=now;
    try{applyPersistentMovement(dt);}catch(error){console.error("Matvey post-core movement:",error);}
    requestAnimationFrame(frame);
  }

  function startLoopAfterCore(){
    if(loopStarted)return;
    if(!window.__matveyCoreInputPatched&&!window.MATVEY_LOADER_BUILD){
      setTimeout(startLoopAfterCore,100);
      return;
    }
    loopStarted=true;
    lastFrame=performance.now();
    requestAnimationFrame(frame);
  }

  function boot(){
    installThreeCapture();
    installBadge();
    installDebug();
    setInterval(function(){selectPlayer(false);},700);
    startLoopAfterCore();
  }

  installThreeCapture();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
