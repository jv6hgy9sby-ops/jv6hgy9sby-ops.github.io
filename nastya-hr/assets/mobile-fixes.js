(function(){
  "use strict";

  var assetVersion="20260805-logo-final";
  var brandBase="assets/brand/";

  function absolute(path){
    return new URL(path,document.baseURI).href;
  }

  function setImage(image,file,width,height,fallbackFile){
    if(!image)return;

    image.removeAttribute("srcset");
    image.width=width;
    image.height=height;
    image.decoding="async";

    image.addEventListener("error",function handleError(){
      image.removeEventListener("error",handleError);
      if(fallbackFile){
        image.src=absolute(brandBase+fallbackFile+"?v="+assetVersion);
      }else{
        image.hidden=true;
      }
    },{once:true});

    image.src=absolute(brandBase+file+"?v="+assetVersion);
  }

  function prepareBrandLogos(){
    document.querySelectorAll(".site-logo").forEach(function(logo){
      var footer=logo.classList.contains("footer-logo");
      var full=logo.querySelector(".site-logo__full");
      var mark=logo.querySelector(".site-logo__mark");

      if(full){
        setImage(
          full.querySelector(".site-logo__image--light-theme"),
          footer?"logo-anasteysha-footer-dark.png":"logo-anasteysha-dark.png",
          800,
          200,
          "logo-anasteysha-mark-dark.png"
        );
        setImage(
          full.querySelector(".site-logo__image--dark-theme"),
          footer?"logo-anasteysha-footer-light.png":"logo-anasteysha-light.png",
          800,
          200,
          "logo-anasteysha-mark-light.png"
        );
      }

      if(mark){
        setImage(
          mark.querySelector(".site-logo__image--light-theme"),
          "logo-anasteysha-mark-dark.png",
          256,
          256,
          "favicon.svg"
        );
        setImage(
          mark.querySelector(".site-logo__image--dark-theme"),
          "logo-anasteysha-mark-light.png",
          256,
          256,
          "favicon.svg"
        );
      }
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",prepareBrandLogos,{once:true});
  }else{
    prepareBrandLogos();
  }
})();