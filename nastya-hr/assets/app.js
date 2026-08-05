(function(){
  "use strict";

  var body=document.body;
  var page=body.dataset.page||"";
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
          '<div class="brand-lockup">'+
            '<a class="logo" href="index.html" aria-label="Anasteysha — главная">Anasteysha</a>'+
            '<span class="brand-descriptor" aria-hidden="true">HR · Recruiting · Operations</span>'+
          '</div>'+
          '<nav class="desktop-nav" aria-label="Основная навигация">'+navLinks()+'</nav>'+
          '<div class="header-actions">'+
            '<a class="btn small-btn" href="contact.html">Связаться</a>'+
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
            '<div class="footer-brand"><a class="logo" href="index.html">Anasteysha</a><p>Практический HR для людей, команд и бизнеса: обучение, наставничество, рекрутинг и HR Operations.</p></div>'+
            '<div class="footer-col"><h3>Разделы</h3><div class="footer-links"><a href="about.html">О Насте</a><a href="education.html">Обучение</a><a href="mentoring.html">Наставничество</a><a href="business.html">Для бизнеса</a></div></div>'+
            '<div class="footer-col"><h3>Полезное</h3><div class="footer-links"><a href="materials.html">Материалы</a><a href="blog.html">Блог</a><a href="contact.html">Контакты</a><a href="privacy.html">Конфиденциальность</a></div></div>'+
            '<div class="footer-col"><h3>Связь</h3><div class="footer-links"><span>Telegram — будет добавлен</span><span>Email — будет добавлен</span><span>Формат — онлайн</span></div></div>'+
          '</div>'+
          '<div class="footer-bottom"><span>© <span data-year></span> Anasteysha. Персональный HR-проект.</span><a href="#top">Наверх ↑</a></div>'+
        '</div>'+
      '</footer>';
  }

  var header=document.getElementById("siteHeader");
  var burger=document.getElementById("burger");
  var menu=document.getElementById("mobileMenu");
  var lastFocused=null;

  function focusableInMenu(){
    return menu?Array.prototype.slice.call(menu.querySelectorAll('a[href],button:not([disabled])')):[];
  }

  function closeMenu(restoreFocus){
    if(!burger||!menu)return;
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded","false");
    burger.setAttribute("aria-label","Открыть меню");
    menu.setAttribute("aria-hidden","true");
    if(restoreFocus&&lastFocused){lastFocused.focus();}
  }

  function openMenu(){
    if(!burger||!menu)return;
    lastFocused=document.activeElement;
    body.classList.add("menu-open");
    burger.setAttribute("aria-expanded","true");
    burger.setAttribute("aria-label","Закрыть меню");
    menu.setAttribute("aria-hidden","false");
    var items=focusableInMenu();
    if(items.length){window.setTimeout(function(){items[0].focus();},40);}
  }

  if(burger){
    burger.addEventListener("click",function(){
      body.classList.contains("menu-open")?closeMenu(false):openMenu();
    });
  }

  document.addEventListener("keydown",function(event){
    if(event.key==="Escape"&&body.classList.contains("menu-open")){
      closeMenu(true);
      return;
    }
    if(event.key==="Tab"&&body.classList.contains("menu-open")&&menu){
      var items=focusableInMenu();
      if(!items.length)return;
      var first=items[0];
      var last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  window.addEventListener("resize",function(){
    if(window.innerWidth>900){closeMenu(false);}
    document.querySelectorAll(".article.open .article-body").forEach(function(panel){
      panel.style.maxHeight=panel.scrollHeight+"px";
    });
  });

  if(menu){menu.querySelectorAll("a").forEach(function(link){link.addEventListener("click",function(){closeMenu(false);});});}

  function updateHeader(){if(header){header.classList.toggle("scrolled",window.scrollY>8);}}
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
        if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target);}
      });
    },{threshold:.08,rootMargin:"0px 0px -24px 0px"});
    reveals.forEach(function(element){observer.observe(element);});
  }else{reveals.forEach(function(element){element.classList.add("visible");});}

  function activateFilter(button,buttonSelector,itemSelector,dataKey){
    var filter=button.dataset[dataKey]||"all";
    document.querySelectorAll(buttonSelector).forEach(function(item){
      var active=item===button;
      item.classList.toggle("active",active);
      item.setAttribute("aria-pressed",String(active));
    });
    document.querySelectorAll(itemSelector).forEach(function(item){
      var categories=(item.dataset.category||"").split(" ");
      item.hidden=filter!=="all"&&categories.indexOf(filter)===-1;
    });
  }

  document.querySelectorAll(".filter-btn").forEach(function(button){
    button.addEventListener("click",function(){activateFilter(button,".filter-btn",".material-card","filter");});
  });
  document.querySelectorAll(".article-filter").forEach(function(button){
    button.addEventListener("click",function(){activateFilter(button,".article-filter",".article","articleFilter");});
  });

  document.querySelectorAll(".article").forEach(function(article){
    var summary=article.querySelector(".article-summary");
    var panel=article.querySelector(".article-body");
    if(!summary||!panel)return;
    summary.addEventListener("click",function(){
      var open=!article.classList.contains("open");
      article.classList.toggle("open",open);
      summary.setAttribute("aria-expanded",String(open));
      panel.style.maxHeight=open?panel.scrollHeight+"px":null;
      if(open&&article.id){history.replaceState(null,"","#"+article.id);}
    });
  });

  if(location.hash){
    var targeted=document.querySelector(location.hash);
    if(targeted&&targeted.classList.contains("article")){
      var targetedButton=targeted.querySelector(".article-summary");
      var targetedPanel=targeted.querySelector(".article-body");
      targeted.classList.add("open");
      if(targetedButton){targetedButton.setAttribute("aria-expanded","true");}
      if(targetedPanel){window.setTimeout(function(){targetedPanel.style.maxHeight=targetedPanel.scrollHeight+"px";},60);}
    }
  }

  var form=document.getElementById("leadForm");
  var status=document.getElementById("formStatus");
  if(form&&status){
    var params=new URLSearchParams(window.location.search);
    var interest=params.get("interest");
    var select=document.getElementById("lead-interest");
    if(interest&&select&&Array.from(select.options).some(function(option){return option.value===interest;})){select.value=interest;}
    form.addEventListener("submit",function(event){
      event.preventDefault();
      if(!form.checkValidity()){form.reportValidity();return;}
      form.hidden=true;
      status.hidden=false;
      status.focus();
    });
  }

  document.querySelectorAll("[data-year]").forEach(function(element){element.textContent=new Date().getFullYear();});
})();
