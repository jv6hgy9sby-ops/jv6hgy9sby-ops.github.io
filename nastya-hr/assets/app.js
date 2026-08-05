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

  function navLinks(cls){
    return nav.map(function(item){
      return '<a class="'+(cls||'')+'" href="'+item[1]+'" data-page-link="'+item[0]+'">'+item[2]+'</a>';
    }).join("");
  }

  if(headerHost){
    headerHost.innerHTML=
      '<header class="site-header" id="siteHeader">'+
        '<div class="container header-inner">'+
          '<a class="logo" href="index.html" aria-label="NASTYA HR — главная">NASTYA<span>·</span>HR</a>'+
          '<nav class="desktop-nav" aria-label="Основная навигация">'+navLinks('')+'</nav>'+
          '<div class="header-actions">'+
            '<a class="btn small-btn" href="contact.html">Связаться ↗</a>'+
            '<button class="burger" id="burger" aria-label="Открыть меню" aria-controls="mobileMenu" aria-expanded="false"><i></i><i></i><i></i></button>'+
          '</div>'+
        '</div>'+
      '</header>'+
      '<nav class="mobile-menu" id="mobileMenu" aria-label="Мобильная навигация" aria-hidden="true">'+navLinks('')+'<a class="btn" href="contact.html">Связаться</a></nav>';
  }

  if(footerHost){
    footerHost.innerHTML=
      '<footer class="site-footer">'+
        '<div class="container">'+
          '<div class="footer-grid">'+
            '<div class="footer-brand"><a class="logo" href="index.html">NASTYA<span>·</span>HR</a><p>NASTYA·HR — практический HR, рекрутинг и карьерное развитие. Обучение, наставничество и помощь HR-командам.</p></div>'+
            '<div class="footer-col"><h3>Сайт</h3><div class="footer-links"><a href="about.html">О Насте</a><a href="education.html">Обучение</a><a href="mentoring.html">Наставничество</a><a href="business.html">Для бизнеса</a></div></div>'+
            '<div class="footer-col"><h3>Медиа</h3><div class="footer-links"><a href="materials.html">Материалы</a><a href="blog.html">Блог</a><a href="contact.html">Контакты</a><a href="privacy.html">Конфиденциальность</a></div></div>'+
            '<div class="footer-col"><h3>Контакты</h3><div class="footer-links"><span>Telegram — будет добавлен</span><span>Email — будет добавлен</span><span>Формат — онлайн</span></div></div>'+
          '</div>'+
          '<div class="footer-bottom"><span>© <span data-year></span> NASTYA·HR. Подготовка к запуску.</span><a href="#top">Наверх ↑</a></div>'+
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
  if(burger){burger.addEventListener("click",function(){body.classList.contains("menu-open")?closeMenu():openMenu();});}
  document.addEventListener("keydown",function(e){if(e.key==="Escape")closeMenu();});
  window.addEventListener("resize",function(){if(window.innerWidth>900)closeMenu();});
  if(menu){menu.querySelectorAll("a").forEach(function(a){a.addEventListener("click",closeMenu);});}

  function updateHeader(){if(header)header.classList.toggle("scrolled",window.scrollY>10);}
  updateHeader();
  window.addEventListener("scroll",updateHeader,{passive:true});

  if(page){document.querySelectorAll('[data-page-link="'+page+'"]').forEach(function(a){a.classList.add("active");a.setAttribute("aria-current","page");});}

  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reveals=document.querySelectorAll(".reveal");
  if("IntersectionObserver" in window&&!reduced){
    var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("visible");io.unobserve(entry.target);}});},{threshold:.1,rootMargin:"0px 0px -30px 0px"});
    reveals.forEach(function(el){io.observe(el);});
  }else{reveals.forEach(function(el){el.classList.add("visible");});}

  document.querySelectorAll(".filter-btn").forEach(function(btn){
    btn.addEventListener("click",function(){
      var filter=btn.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach(function(b){b.classList.toggle("active",b===btn);});
      document.querySelectorAll(".material-card").forEach(function(card){
        var categories=(card.dataset.category||"").split(" ");
        card.hidden=filter!=="all"&&categories.indexOf(filter)===-1;
      });
    });
  });

  document.querySelectorAll(".article").forEach(function(article){
    var summary=article.querySelector(".article-summary");
    var bodyEl=article.querySelector(".article-body");
    if(!summary||!bodyEl)return;
    summary.addEventListener("click",function(){
      var open=!article.classList.contains("open");
      article.classList.toggle("open",open);
      summary.setAttribute("aria-expanded",String(open));
      bodyEl.style.maxHeight=open?bodyEl.scrollHeight+"px":null;
    });
  });

  var form=document.getElementById("leadForm");
  var status=document.getElementById("formStatus");
  if(form&&status){
    var params=new URLSearchParams(location.search);
    var interest=params.get("interest");
    var select=document.getElementById("lead-interest");
    if(interest&&select){select.value=interest;}
    form.addEventListener("submit",function(e){
      e.preventDefault();
      if(!form.checkValidity()){form.reportValidity();return;}
      form.hidden=true;
      status.hidden=false;
      status.focus();
    });
  }

  document.querySelectorAll("[data-year]").forEach(function(el){el.textContent=new Date().getFullYear();});
})();
