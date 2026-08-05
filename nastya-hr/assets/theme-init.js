(function(){
  "use strict";

  var root=document.documentElement;
  var storageKey="anasteysha-theme";
  var lightColor="#FAF7F2";
  var darkColor="#1F2328";
  var saved=null;
  var assetVersion="20260805-logo-final";

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

  function ensureLink(rel,href,attributes){
    var selector='link[rel="'+rel+'"]';
    if(attributes&&attributes.sizes){selector+='[sizes="'+attributes.sizes+'"]';}
    var link=document.querySelector(selector);
    if(!link){
      link=document.createElement("link");
      link.rel=rel;
      document.head.appendChild(link);
    }
    link.href=href;
    if(attributes){
      Object.keys(attributes).forEach(function(name){link.setAttribute(name,attributes[name]);});
    }
  }

  function appendStylesheet(href){
    var link=document.createElement("link");
    link.rel="stylesheet";
    link.href=href;
    document.head.appendChild(link);
  }

  function appendScript(src){
    var script=document.createElement("script");
    script.src=src;
    script.defer=true;
    document.head.appendChild(script);
  }

  document.querySelectorAll('link[rel="icon"]').forEach(function(link){link.remove();});
  ensureLink("icon","assets/brand/favicon-32.png?v="+assetVersion,{type:"image/png",sizes:"32x32"});
  ensureLink("apple-touch-icon","assets/brand/apple-touch-icon.png?v="+assetVersion,{sizes:"180x180"});
  ensureLink("manifest","site.webmanifest?v="+assetVersion);

  appendStylesheet("assets/mobile-fixes.css?v="+assetVersion);
  appendScript("assets/navigation-extension.js?v="+assetVersion);
  appendScript("assets/mobile-fixes.js?v="+assetVersion);
})();