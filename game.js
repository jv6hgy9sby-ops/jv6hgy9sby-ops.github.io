"use strict";
window.MATVEY_LOADER_BUILD="3.0-premium-chunked";
(function(){
  var CORE_PARTS=[
    "assets/game-core-v3.b64",
    "assets/game-core-v3-2.b64",
    "assets/game-core-v3-3.b64"
  ];

  function fail(message,error){
    console.error("Matvey core loading failed:",error||message);
    if(window.__fatal)window.__fatal(message);
  }

  function fetchPart(path){
    return fetch(path,{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error(path+" HTTP "+response.status);
      return response.text();
    });
  }

  function decodeBase64(value){
    var raw=atob(value.replace(/\s+/g,""));
    var bytes=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return bytes;
  }

  function loadPako(){
    return new Promise(function(resolve,reject){
      if(window.pako){resolve(window.pako);return;}
      var script=document.createElement("script");
      script.src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js";
      script.async=true;
      script.onload=function(){
        if(window.pako)resolve(window.pako);
        else reject(new Error("pako missing"));
      };
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

  Promise.all(CORE_PARTS.map(fetchPart))
    .then(function(parts){return inflate(decodeBase64(parts.join("")));})
    .then(function(code){
      if(code.indexOf('window.MATVEY_BUILD="3.0-premium-procedural"')===-1){
        throw new Error("unexpected game build");
      }
      (0,eval)(code+"\n//# sourceURL=matvey-game-core-v3.js");
    })
    .catch(function(error){
      fail("Не удалось загрузить новую сборку игры. Обновите страницу и проверьте интернет.",error);
    });
})();
