"use strict";
window.MATVEY_LOADER_BUILD="3.0-premium-chunked";
(function(){
  var CORE_PARTS=["assets/core-v3-01.txt","assets/core-v3-02.txt","assets/core-v3-03.txt","assets/core-v3-04.txt","assets/core-v3-05.txt","assets/core-v3-06.txt"];
  function fail(message,error){
    console.error(message,error||"");
    if(window.__fatal)window.__fatal(message);
  }
  function fetchPart(path){
    return fetch(path,{cache:"force-cache"}).then(function(response){
      if(!response.ok)throw new Error(path+" HTTP "+response.status);
      return response.text();
    });
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
  Promise.all(CORE_PARTS.map(fetchPart)).then(function(parts){
    return inflate(decodeBase64(parts.join("")));
  }).then(function(code){
    window.eval(code+"\n//# sourceURL=matvey-game-core-v3.js");
  }).catch(function(error){
    fail("Не удалось загрузить игровой код. Обновите страницу.",error);
  });
})();
