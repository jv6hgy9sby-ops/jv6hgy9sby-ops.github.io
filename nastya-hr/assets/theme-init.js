(function(){
  "use strict";

  var root=document.documentElement;
  var storageKey="anasteysha-theme";
  var lightColor="#F6F1E8";
  var darkColor="#181715";
  var saved=null;

  try{
    saved=localStorage.getItem(storageKey);
  }catch(error){
    saved=null;
  }

  var systemDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme=saved==="light"||saved==="dark"?saved:(systemDark?"dark":"light");

  root.dataset.theme=theme;
  root.dataset.themeSource=saved?"user":"system";
  root.style.colorScheme=theme;

  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta){meta.setAttribute("content",theme==="dark"?darkColor:lightColor);}
})();
