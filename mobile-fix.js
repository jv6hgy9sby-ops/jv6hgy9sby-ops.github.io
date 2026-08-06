"use strict";
(function(){
  var selectorAliases={
    "#mobile-controls":"touch-ui",
    "#joystick":"joystick-zone",
    "#action-button":"btn-action"
  };
  var idAliases={
    "mobile-controls":"touch-ui",
    "joystick":"joystick-zone",
    "action-button":"btn-action"
  };

  var originalQuerySelector=Document.prototype.querySelector;
  var originalGetElementById=Document.prototype.getElementById;
  var originalMatches=Element.prototype.matches;

  Document.prototype.querySelector=function(selector){
    var alias=selectorAliases[selector];
    if(alias){
      var found=originalGetElementById.call(this,alias);
      if(found)return found;
    }
    return originalQuerySelector.call(this,selector);
  };

  Document.prototype.getElementById=function(id){
    var alias=idAliases[id];
    if(alias){
      var found=originalGetElementById.call(this,alias);
      if(found)return found;
    }
    return originalGetElementById.call(this,id);
  };

  Element.prototype.matches=function(selector){
    if(selectorAliases[selector]){
      return this.id===selectorAliases[selector];
    }
    return originalMatches.call(this,selector);
  };

  function exposeTouchUi(){
    if(!document.body)return;
    if((navigator.maxTouchPoints||0)>0||("ontouchstart" in window)){
      document.body.classList.add("touch");
    }
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",exposeTouchUi,{once:true});
  else exposeTouchUi();

  window.__MATVEY_MOBILE_ALIAS_FIX__="1.0";
})();
