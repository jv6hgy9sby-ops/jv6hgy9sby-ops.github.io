(function(){
  "use strict";

  var page=document.body.dataset.page||"";
  var headerHost=document.querySelector("[data-site-header]");
  var footerHost=document.querySelector("[data-site-footer]");
  var nav=[
    ["home","index.html","Главная"],
    ["about","about.html","О Насте"],
    ["education","education.html","Обучение"],
    ["mentoring","mentoring.html","Наставничество"],
    ["business","business.html","Для бизнеса"],
    ["materials","materials.html","Материалы"],
    ["blog","blog.html","Блог"],
    ["contact","contact.html","Контакты"]
  ];

  function navLinks(){
    return nav.map(function(item){
      return '<a href="'+item[1]+'" data-page-link="'+item[0]+'">'+item[2]+'</a>';
    }).join("");
  }

  if(headerHost){
    headerHost.innerHTML=
      '<header class="site-header" id="siteHeader">'+
        '<div class="container header-inner">'+
          '<a class="logo" href="index.html" aria-label="NASTYA HR — главная">NASTYA<span>·</span>HR</a>'+
          '<nav class="desktop-nav" aria-label="Основная навигация">'+navLinks()+'</nav>'+
          '<div class="header-actions">'+
            '<a class="btn small-btn" href="contact.html">Связаться ↗</a>'+
            '<button class="burger" id="burger" type="button" aria-label="Открыть меню" aria-controls="mobileMenu" aria-expanded="false"><i></i><i></i><i></i></button>'+
          '</div>'+
        '</div>'+
      '</header>'+
      '<nav class="mobile-menu" id="mobileMenu" aria-label="Мобильная навигация" aria-hidden="true">'+navLinks()+'<a class="btn" href="contact.html">Связаться</a></nav>';
  }

  if(footerHost){
    footerHost.innerHTML=
      '<footer class="site-footer">'+
        '<div class="container">'+
          '<div class="footer-grid">'+
            '<div class="footer-brand"><a class="logo" href="index.html">NASTYA<span>·</span>HR</a><p>Практический HR, рекрутинг, HR Operations, обучение и персональное наставничество.</p></div>'+
            '<div class="footer-col"><h3>Разделы</h3><div class="footer-links"><a href="about.html">О Насте</a><a href="education.html">Обучение</a><a href="mentoring.html">Наставничество</a><a href="business.html">Для бизнеса</a></div></div>'+
            '<div class="footer-col"><h3>Полезное</h3><div class="footer-links"><a href="materials.html">Материалы</a><a href="blog.html">Блог</a><a href="contact.html">Контакты</a><a href="privacy.html">Конфиденциальность</a></div></div>'+
            '<div class="footer-col"><h3>Связь</h3><div class="footer-links"><span>Telegram — будет добавлен</span><span>Email — будет добавлен</span><span>Формат — онлайн</span></div></div>'+
          '</div>'+
          '<div class="footer-bottom"><span>© <span data-year></span> NASTYA·HR. Проект развивается.</span><a href="#top">Наверх ↑</a></div>'+
        '</div>'+
      '</footer>';
  }

  var body=document.body;
  var header=document.getElementById("siteHeader");
  var burger=document.getElementById("burger");
  var menu=document.getElementById("mobileMenu");

  function closeMenu(){
    if(!burger||!menu)return;
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded","false");
    burger.setAttribute("aria-label","Открыть меню");
    menu.setAttribute("aria-hidden","true");
  }

  function openMenu(){
    if(!burger||!menu)return;
    body.classList.add("menu-open");
    burger.setAttribute("aria-expanded","true");
    burger.setAttribute("aria-label","Закрыть меню");
    menu.setAttribute("aria-hidden","false");
  }

  if(burger){
    burger.addEventListener("click",function(){
      body.classList.contains("menu-open")?closeMenu():openMenu();
    });
  }

  document.addEventListener("keydown",function(event){
    if(event.key==="Escape"&&body.classList.contains("menu-open")){
      closeMenu();
      if(burger){burger.focus();}
    }
  });

  window.addEventListener("resize",function(){
    if(window.innerWidth>900){closeMenu();}
  });

  if(menu){
    menu.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click",closeMenu);
    });
  }

  function updateHeader(){
    if(header){header.classList.toggle("scrolled",window.scrollY>8);}
  }
  updateHeader();
  window.addEventListener("scroll",updateHeader,{passive:true});

  if(page){
    document.querySelectorAll('[data-page-link="'+page+'"]').forEach(function(link){
      link.classList.add("active");
      link.setAttribute("aria-current","page");
    });
  }

  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window&&!reduced){
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:.08,rootMargin:"0px 0px -24px 0px"});
    reveals.forEach(function(element){observer.observe(element);});
  }else{
    reveals.forEach(function(element){element.classList.add("visible");});
  }

  document.querySelectorAll(".filter-btn").forEach(function(button){
    button.addEventListener("click",function(){
      var filter=button.dataset.filter||"all";
      document.querySelectorAll(".filter-btn").forEach(function(item){
        var active=item===button;
        item.classList.toggle("active",active);
        item.setAttribute("aria-pressed",String(active));
      });
      document.querySelectorAll(".material-card").forEach(function(card){
        var categories=(card.dataset.category||"").split(" ");
        card.hidden=filter!=="all"&&categories.indexOf(filter)===-1;
      });
    });
  });

  document.querySelectorAll(".article").forEach(function(article){
    var summary=article.querySelector(".article-summary");
    var bodyElement=article.querySelector(".article-body");
    if(!summary||!bodyElement)return;
    summary.addEventListener("click",function(){
      var open=!article.classList.contains("open");
      article.classList.toggle("open",open);
      summary.setAttribute("aria-expanded",String(open));
      bodyElement.style.maxHeight=open?bodyElement.scrollHeight+"px":null;
    });
  });

  var form=document.getElementById("leadForm");
  var status=document.getElementById("formStatus");
  if(form&&status){
    var params=new URLSearchParams(window.location.search);
    var interest=params.get("interest");
    var select=document.getElementById("lead-interest");
    if(interest&&select&&Array.from(select.options).some(function(option){return option.value===interest;})){
      select.value=interest;
    }
    form.addEventListener("submit",function(event){
      event.preventDefault();
      if(!form.checkValidity()){
        form.reportValidity();
        return;
      }
      form.hidden=true;
      status.hidden=false;
      status.focus();
    });
  }

  document.querySelectorAll("[data-year]").forEach(function(element){
    element.textContent=new Date().getFullYear();
  });
})();