"use strict";
(function(){
  window.MATVEY_POST_COMMIT_BUILD="7.2-after-core-frame";
  var started=false;
  var applied=0;

  function gameIsActive(){
    var hud=document.getElementById("hud");
    var start=document.getElementById("screen-start");
    var pause=document.getElementById("screen-pause");
    var finale=document.getElementById("screen-finale");
    return Boolean(
      hud&&!hud.classList.contains("hidden")&&
      (!start||start.classList.contains("hidden"))&&
      (!pause||pause.classList.contains("hidden"))&&
      (!finale||finale.classList.contains("hidden"))
    );
  }

  function commitFrame(){
    var player=window.__matveyPostCorePlayer;
    var state=window.__matveyPostCoreState;
    if(gameIsActive()&&player&&player.isObject3D&&state&&state.position){
      player.position.set(state.position.x,state.position.y,state.position.z);
      player.updateMatrixWorld(true);
      applied++;
      window.__matveyPostCommitApplied=applied;
    }
    requestAnimationFrame(commitFrame);
  }

  function startAfterCore(){
    if(started)return;
    if(window.__matveyCoreInputPatched!==true){
      setTimeout(startAfterCore,100);
      return;
    }
    started=true;
    var badge=document.getElementById("matvey-live-build-badge");
    if(badge)badge.textContent="LIVE BUILD 7.2";
    requestAnimationFrame(commitFrame);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",startAfterCore,{once:true});
  else startAfterCore();
})();
