(function(){
  "use strict";

  function addAiLink(container,referenceHref){
    if(!container||container.querySelector('a[href="ai-automation.html"]'))return;
    var reference=container.querySelector('a[href="'+referenceHref+'"]');
    var link=document.createElement("a");
    link.href="ai-automation.html";
    link.textContent="AI и автоматизация";
    if(document.body.dataset.page==="ai-automation"){
      link.classList.add("active");
      link.setAttribute("aria-current","page");
    }
    if(reference&&reference.parentNode===container){
      reference.insertAdjacentElement("afterend",link);
    }else{
      container.appendChild(link);
    }
  }

  function removeLegacyMentoringLink(container){
    if(!container)return;
    var link=container.querySelector('a[href="mentoring.html"]');
    if(link)link.remove();
  }

  function enhancePageLinks(){
    document.querySelectorAll(".desktop-nav").forEach(function(nav){
      removeLegacyMentoringLink(nav);
      addAiLink(nav,"business.html");
    });

    document.querySelectorAll(".mobile-menu").forEach(function(nav){
      removeLegacyMentoringLink(nav);
      addAiLink(nav,"business.html");
    });

    document.querySelectorAll(".footer-links").forEach(function(group){
      if(group.querySelector('a[href="business.html"]'))addAiLink(group,"business.html");
    });

    if(document.body.dataset.page==="home"){
      var solutionLink=document.querySelector('a[href="solutions.html"][style]');
      if(solutionLink&&!document.querySelector('.home-ai-automation-link')){
        var aiLink=document.createElement("a");
        aiLink.className="text-link reveal visible home-ai-automation-link";
        aiLink.href="ai-automation.html";
        aiLink.style.marginTop="12px";
        aiLink.textContent="AI и автоматизация HR-процессов";
        solutionLink.insertAdjacentElement("afterend",aiLink);
      }
    }

    if(document.body.dataset.page==="education"){
      var practiceLink=document.querySelector('a[href="solutions.html"][style]');
      if(practiceLink&&!document.querySelector('.education-ai-automation-link')){
        var pageLink=document.createElement("a");
        pageLink.className="text-link reveal visible education-ai-automation-link";
        pageLink.href="ai-automation.html";
        pageLink.style.marginTop="12px";
        pageLink.textContent="Как AI внедряется в HR-процессы компаний";
        practiceLink.insertAdjacentElement("afterend",pageLink);
      }
    }
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",enhancePageLinks,{once:true});
  }else{
    enhancePageLinks();
  }
})();
