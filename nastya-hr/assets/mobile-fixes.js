(function(){
  "use strict";

  var assetVersion="20260806-prototype-polish-1";
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

  function setInert(element,inert){
    if(!element)return;
    if(inert){
      element.setAttribute("inert","");
    }else{
      element.removeAttribute("inert");
    }
  }

  function prepareMenuAccessibility(){
    var menu=document.getElementById("mobileMenu");
    if(!menu)return;

    function sync(){
      setInert(menu,menu.getAttribute("aria-hidden")!=="false");
    }

    sync();
    new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:["aria-hidden"]});
  }

  function prepareAccordionAccessibility(){
    document.querySelectorAll(".article,.solution-item").forEach(function(item){
      var summary=item.querySelector(".article-summary,.solution-summary");
      var panel=item.querySelector(".article-body,.solution-body");
      if(!summary||!panel)return;

      function sync(){
        setInert(panel,summary.getAttribute("aria-expanded")!=="true");
      }

      sync();
      new MutationObserver(sync).observe(summary,{attributes:true,attributeFilter:["aria-expanded"]});
    });
  }

  function selectedLabel(id){
    var select=document.getElementById(id);
    return select&&select.selectedOptions.length?select.selectedOptions[0].textContent.trim():"";
  }

  function buildDraftText(){
    var audienceInput=document.getElementById("lead-audience");
    var company=audienceInput&&audienceInput.value==="company";
    var name=document.getElementById("lead-name");
    var context=document.getElementById(company?"company-context":"specialist-context");
    var goal=document.getElementById(company?"company-goal":"specialist-goal");

    return [
      "Черновик обращения Anasteysha",
      "Имя: "+(name?name.value.trim():""),
      "Аудитория: "+(company?"Компания или руководитель":"HR-специалист"),
      "Направление: "+selectedLabel(company?"company-interest":"specialist-interest"),
      "Контекст: "+(context?context.value.trim():""),
      "Задача: "+(goal?goal.value.trim():"")
    ].join("\n");
  }

  function fallbackCopy(text){
    var textarea=document.createElement("textarea");
    textarea.value=text;
    textarea.setAttribute("readonly","");
    textarea.style.position="fixed";
    textarea.style.inset="0 auto auto -9999px";
    textarea.style.opacity="0";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0,textarea.value.length);

    var copied=false;
    try{
      copied=document.execCommand("copy");
    }catch(error){
      copied=false;
    }

    textarea.remove();
    return copied;
  }

  function prepareDraftCopy(){
    var button=document.getElementById("copyDraft");
    var message=document.getElementById("formMessage");
    if(!button)return;

    var originalText=button.textContent;

    function showResult(success){
      button.textContent=success?"Скопировано":"Не удалось скопировать";
      if(message){
        message.textContent=success
          ?"Черновик скопирован. Он не отправлен и не сохранён."
          :"Не удалось скопировать автоматически. Выделите текст черновика вручную.";
        message.classList.toggle("error",!success);
      }
      window.setTimeout(function(){
        button.textContent=originalText;
      },1800);
    }

    button.addEventListener("click",function(event){
      event.preventDefault();
      event.stopImmediatePropagation();

      var text=buildDraftText();
      if(!text.trim()){
        showResult(false);
        return;
      }

      if(navigator.clipboard&&typeof navigator.clipboard.writeText==="function"&&window.isSecureContext){
        navigator.clipboard.writeText(text).then(function(){
          showResult(true);
        }).catch(function(){
          showResult(fallbackCopy(text));
        });
      }else{
        showResult(fallbackCopy(text));
      }
    },true);
  }

  function prepareFilterAnnouncements(){
    [
      {toolbar:".filter-bar",items:".material-card"},
      {toolbar:".article-toolbar",items:".article"},
      {toolbar:".solution-toolbar",items:".solution-item, .featured-solution"}
    ].forEach(function(config){
      var toolbar=document.querySelector(config.toolbar);
      if(!toolbar)return;

      var status=document.createElement("p");
      status.className="filter-status sr-only";
      status.setAttribute("aria-live","polite");
      status.setAttribute("aria-atomic","true");
      toolbar.insertAdjacentElement("afterend",status);

      toolbar.addEventListener("click",function(event){
        var button=event.target.closest("button");
        if(!button||!toolbar.contains(button))return;

        window.setTimeout(function(){
          var visible=Array.prototype.filter.call(document.querySelectorAll(config.items),function(item){
            return !item.hidden;
          }).length;
          status.textContent="Показано элементов: "+visible+".";
        },0);
      });
    });
  }

  function prepare(){
    prepareBrandLogos();
    prepareMenuAccessibility();
    prepareAccordionAccessibility();
    prepareDraftCopy();
    prepareFilterAnnouncements();
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",prepare,{once:true});
  }else{
    prepare();
  }
})();
