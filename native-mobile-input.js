"use strict";
(function(){
  window.MATVEY_NATIVE_INPUT_BUILD="6.0-object-direct";

  var namedCandidates=[];
  var trackedScenes=[];
  var trackedObjects=[];
  var selectedPlayer=null;
  var selectedCamera=null;
  var lastTime=performance.now();
  var debugPanel=null;
  var lastSelectionAt=0;
  var selectionReason="none";
  var originalEval=window.eval;

  function safePush(array,value){
    if(value&&array.indexOf(value)<0)array.push(value);
  }

  function exposeLikelyGlobals(source){
    var found={};
    var declaration=/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
    var assignment=/\b([A-Za-z_$][\w$]*)\s*=\s*(?:create|build|make|load)(?:Matvey|Pug|Dog|Player|Hero|Character)\b/gi;
    var match;
    while((match=declaration.exec(source))){
      if(/matvey|player|pug|dog|hero|character|avatar|camera|scene/i.test(match[1]))found[match[1]]=true;
    }
    while((match=assignment.exec(source)))found[match[1]]=true;
    var names=Object.keys(found).slice(0,80);
    if(!names.length)return source;
    var tail="\n;try{window.__matveyNamedCandidates=window.__matveyNamedCandidates||[];}catch(e){};\n";
    names.forEach(function(name){
      tail+="try{window.__matveyNamedCandidates.push({name:"+JSON.stringify(name)+",value:"+name+"});}catch(e){};\n";
    });
    return source+tail;
  }

  window.eval=function(code){
    if(typeof code==="string"&&code.indexOf("sourceURL=matvey-game-core")!==-1){
      code=exposeLikelyGlobals(code);
    }
    return originalEval(code);
  };

  function installThreeCapture(){
    if(!window.THREE||window.__matveyThreeCaptureInstalled)return false;
    window.__matveyThreeCaptureInstalled=true;

    var originalAdd=THREE.Object3D.prototype.add;
    THREE.Object3D.prototype.add=function(){
      safePush(trackedObjects,this);
      for(var i=0;i<arguments.length;i++)safePush(trackedObjects,arguments[i]);
      return originalAdd.apply(this,arguments);
    };

    var OriginalScene=THREE.Scene;
    function CapturedScene(){
      var scene=Reflect.construct(OriginalScene,arguments,new.target||CapturedScene);
      safePush(trackedScenes,scene);
      safePush(trackedObjects,scene);
      return scene;
    }
    CapturedScene.prototype=OriginalScene.prototype;
    Object.setPrototypeOf(CapturedScene,OriginalScene);
    THREE.Scene=CapturedScene;
    return true;
  }

  installThreeCapture();

  function collectNamedCandidates(){
    var list=window.__matveyNamedCandidates||[];
    list.forEach(function(item){
      if(!item||!item.value)return;
      if(!namedCandidates.some(function(existing){return existing.name===item.name&&existing.value===item.value;})){
        namedCandidates.push(item);
      }
      if(item.value.isScene)safePush(trackedScenes,item.value);
      if(item.value.isObject3D)safePush(trackedObjects,item.value);
    });
  }

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

  function textOf(value){
    try{return JSON.stringify(value||{}).toLowerCase();}catch(error){return "";}
  }

  function countDescendants(object){
    var count=0;
    try{object.traverse(function(){count++;});}catch(error){}
    return count;
  }

  function findCamera(){
    collectNamedCandidates();
    for(var i=0;i<namedCandidates.length;i++){
      var named=namedCandidates[i];
      if(/camera/i.test(named.name)){
        var value=objectFromValue(named.value);
        if(value&&value.isCamera)return value;
      }
    }
    for(var j=0;j<trackedObjects.length;j++)if(trackedObjects[j]&&trackedObjects[j].isPerspectiveCamera)return trackedObjects[j];
    for(var s=0;s<trackedScenes.length;s++){
      var found=null;
      try{trackedScenes[s].traverse(function(object){if(!found&&object.isPerspectiveCamera)found=object;});}catch(error){}
      if(found)return found;
    }
    return null;
  }

  function getBoxInfo(object,camera){
    if(!window.THREE||!object||!object.isObject3D)return null;
    try{
      object.updateWorldMatrix(true,true);
      var box=new THREE.Box3().setFromObject(object);
      if(box.isEmpty())return null;
      var size=new THREE.Vector3();
      var center=new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      var projected=center.clone();
      if(camera){camera.updateWorldMatrix(true,false);projected.project(camera);}
      return {box:box,size:size,center:center,projected:projected};
    }catch(error){return null;}
  }

  function candidateScore(object,label,camera){
    if(!object||!object.isObject3D||object.isScene||object.isCamera||object.isLight)return -Infinity;
    var labelText=(label||"").toLowerCase();
    var objectText=((object.name||"")+" "+textOf(object.userData)).toLowerCase();
    var text=labelText+" "+objectText;
    var score=0;
    if(/matvey|матвей/.test(text))score+=1000;
    if(/pug|мопс/.test(text))score+=800;
    if(/player|hero|avatar/.test(text))score+=650;
    if(/dog|character/.test(text))score+=400;
    if(/nastya|nikita|human|person|npc/.test(text))score-=600;
    if(/room|floor|wall|door|bed|sofa|table|chair|vacuum|crumb|smell|light|scene|world|house/.test(text))score-=500;

    var info=getBoxInfo(object,camera);
    if(!info)return score-500;
    var size=info.size;
    var max=Math.max(size.x,size.y,size.z);
    var min=Math.min(size.x,size.y,size.z);
    var descendants=countDescendants(object);

    if(max>0.35&&max<3.2)score+=170;
    else if(max>=3.2)score-=350;
    if(size.y>0.25&&size.y<1.8)score+=120;
    if(size.y>=2.2)score-=180;
    if(descendants>=6&&descendants<=160)score+=Math.min(180,descendants*3);
    if(descendants<3)score-=80;
    if(min===0)score-=40;

    if(camera){
      var p=info.projected;
      if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.z>-1&&p.z<1){
        var screenDistance=Math.hypot(p.x,p.y+0.05);
        score+=Math.max(0,260-screenDistance*250);
      }else score-=120;
    }
    if(object.parent&&object.parent.isScene)score+=80;
    return score;
  }

  function gatherCandidates(){
    collectNamedCandidates();
    var candidates=[];
    namedCandidates.forEach(function(item){
      var object=objectFromValue(item.value);
      if(object)candidates.push({object:object,label:item.name});
    });
    trackedScenes.forEach(function(scene){
      try{
        scene.traverse(function(object){
          if(object&&object.isObject3D)candidates.push({object:object,label:object.name||"scene-object"});
        });
      }catch(error){}
    });
    trackedObjects.forEach(function(object){if(object&&object.isObject3D)candidates.push({object:object,label:object.name||"tracked-object"});});

    var seen=[];
    return candidates.filter(function(item){
      if(seen.indexOf(item.object)>=0)return false;
      seen.push(item.object);
      return true;
    });
  }

  function selectPlayer(force){
    var now=performance.now();
    if(!force&&selectedPlayer&&selectedPlayer.parent&&now-lastSelectionAt<3000)return selectedPlayer;
    selectedCamera=findCamera()||selectedCamera;
    var candidates=gatherCandidates();
    var best=null;
    var bestScore=-Infinity;
    candidates.forEach(function(item){
      var score=candidateScore(item.object,item.label,selectedCamera);
      if(score>bestScore){bestScore=score;best=item;}
    });
    if(best&&bestScore>100){
      selectedPlayer=best.object;
      selectionReason=(best.label||best.object.name||"object")+" score="+Math.round(bestScore);
      lastSelectionAt=now;
      window.__matveyDirectPlayer=selectedPlayer;
      window.__matveyDirectPlayerScore=bestScore;
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

  function moveSelectedPlayer(deltaSeconds){
    var input=window.MatveyInput;
    if(!input||!gameAllowsMovement())return;
    var x=Number(input.moveX)||0;
    var y=Number(input.moveY)||0;
    var magnitude=Math.hypot(x,y);
    if(magnitude<0.08)return;

    var player=selectPlayer(false);
    if(!player)return;
    var camera=selectedCamera||findCamera();
    if(!camera)return;

    var forward=new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y=0;
    if(forward.lengthSq()<0.0001)forward.set(0,0,-1);
    forward.normalize();
    var right=new THREE.Vector3(-forward.z,0,forward.x);
    var direction=forward.multiplyScalar(y).add(right.multiplyScalar(x));
    if(direction.lengthSq()<0.0001)return;
    var analog=Math.min(1,direction.length());
    direction.normalize();

    var speed=(input.run?4.2:2.15)*analog;
    var distance=speed*Math.min(deltaSeconds,0.05);
    player.position.x+=direction.x*distance;
    player.position.z+=direction.z*distance;

    var targetYaw=Math.atan2(direction.x,direction.z);
    var current=player.rotation.y;
    var diff=Math.atan2(Math.sin(targetYaw-current),Math.cos(targetYaw-current));
    player.rotation.y=current+diff*Math.min(1,deltaSeconds*10);
    player.updateMatrixWorld(true);

    window.__matveyDirectMove={
      active:true,
      x:x,
      y:y,
      speed:speed,
      position:{x:player.position.x,y:player.position.y,z:player.position.z},
      reason:selectionReason,
      build:window.MATVEY_NATIVE_INPUT_BUILD
    };
  }

  function loop(now){
    var dt=(now-lastTime)/1000;
    lastTime=now;
    try{moveSelectedPlayer(dt);}catch(error){console.error("Matvey direct mover:",error);}
    requestAnimationFrame(loop);
  }

  function installDebug(){
    var params=new URLSearchParams(location.search);
    if(!params.has("nativefix")&&!params.has("inputdebug"))return;
    debugPanel=document.createElement("div");
    debugPanel.style.cssText="position:fixed;right:8px;bottom:8px;z-index:10001;max-width:46vw;background:rgba(10,10,10,.86);color:#caffb7;border:1px solid rgba(168,255,137,.45);border-radius:10px;padding:7px 9px;font:10px/1.3 monospace;pointer-events:none;white-space:pre-wrap";
    document.body.appendChild(debugPanel);
    setInterval(function(){
      var input=window.MatveyInput||{};
      var player=selectedPlayer;
      var pos=player?player.position:null;
      debugPanel.textContent="NATIVE 6.0\nplayer: "+(selectionReason||"searching")+"\ninput: "+Number(input.moveX||0).toFixed(2)+","+Number(input.moveY||0).toFixed(2)+" run="+Boolean(input.run)+"\npos: "+(pos?[pos.x.toFixed(2),pos.y.toFixed(2),pos.z.toFixed(2)].join(","):"none")+"\nscenes="+trackedScenes.length+" objects="+trackedObjects.length;
    },250);
  }

  function boot(){
    installThreeCapture();
    installDebug();
    setInterval(function(){selectPlayer(false);},1000);
    requestAnimationFrame(loop);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();
