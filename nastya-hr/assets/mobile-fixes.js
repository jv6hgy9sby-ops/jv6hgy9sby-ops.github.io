(function(){
  "use strict";

  var assetVersion="20260805-2";
  var paths={
    dark:"assets/brand/logo-anasteysha-mark-dark.svg?v="+assetVersion,
    light:"assets/brand/logo-anasteysha-mark-light.svg?v="+assetVersion,
    fallback:"assets/brand/favicon.svg?v="+assetVersion
  };

  function absolute(path){
    return new URL(path,document.baseURI).href;
  }

  function prepareMobileMarks(){
    var marks=document.querySelectorAll(".header-logo .site-logo__mark .site-logo__image");
    if(!marks.length)return;

    marks.forEach(function(image){
      var isDarkVariant=image.classList.contains("site-logo__image--dark-theme");
      var intended=isDarkVariant?paths.light:paths.dark;

      image.removeAttribute("srcset");
      image.src=absolute(intended);
      image.width=160;
      image.height=160;
      image.decoding="async";

      image.addEventListener("error",function handleError(){
        image.removeEventListener("error",handleError);
        image.src=absolute(paths.fallback);
      },{once:true});
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",prepareMobileMarks,{once:true});
  }else{
    prepareMobileMarks();
  }
})();