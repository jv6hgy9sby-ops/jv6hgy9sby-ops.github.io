(function(){
  "use strict";

  var assetVersion="20260805-3";
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

  function prepareHomeHero(){
    if(document.body.dataset.page!=="home")return;

    var title=document.querySelector(".hero-copy h1");
    if(title){
      title.classList.add("hero-title");
      title.textContent="";

      [
        "Развитие HR-специалистов",
        "и системные решения",
        "для компаний"
      ].forEach(function(text,index,array){
        var line=document.createElement("span");
        line.className="hero-title__line";
        line.textContent=text;
        title.appendChild(line);
        if(index<array.length-1){title.appendChild(document.createTextNode(" "));}
      });
    }

    var audience=document.querySelector(".hero-audience-links");
    if(audience){
      audience.setAttribute("aria-label","Выберите подходящий маршрут");
    }
  }

  function init(){
    prepareMobileMarks();
    prepareHomeHero();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }
})();