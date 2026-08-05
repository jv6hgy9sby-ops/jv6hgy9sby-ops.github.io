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
    ["solutions","solutions.html","Примеры решений"],
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
            '<div class="footer-brand"><a class="logo" href="index.html">Anasteysha</a><p>Практический HR для людей, команд и бизнеса: обучение, наставничество, рекрутинг, HR Operations и AI-решения.</p></div>'+
            '<div class="footer-col"><h3>Разделы</h3><div class="footer-links"><a href="about.html">О Насте</a><a href="education.html">Обучение</a><a href="mentoring.html">Наставничество</a><a href="business.html">Для бизнеса</a><a href="solutions.html">Примеры решений</a></div></div>'+
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
  var lockedScrollY=0;

  function menuItems(){
    return menu?Array.prototype.slice.call(menu.querySelectorAll('a[href],button:not([disabled])')):[];
  }

  function lockScroll(){
    lockedScrollY=window.scrollY||0;
    var scrollbarWidth=Math.max(0,window.innerWidth-document.documentElement.clientWidth);
    body.style.position="fixed";
    body.style.top="-"+lockedScrollY+"px";
    body.style.left="0";
    body.style.right="0";
    body.style.width="100%";
    body.style.paddingRight=scrollbarWidth?scrollbarWidth+"px":"";
  }

  function unlockScroll(){
    body.style.position="";
    body.style.top="";
    body.style.left="";
    body.style.right="";
    body.style.width="";
    body.style.paddingRight="";
    window.scrollTo(0,lockedScrollY);
  }

  function closeMenu(restoreFocus){
    if(!burger||!menu||!body.classList.contains("menu-open"))return;
    body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded","false");
    burger.setAttribute("aria-label","Открыть меню");
    menu.setAttribute("aria-hidden","true");
    unlockScroll();
    if(restoreFocus&&lastFocused){lastFocused.focus();}
  }

  function openMenu(){
    if(!burger||!menu||body.classList.contains("menu-open"))return;
    lastFocused=document.activeElement;
    lockScroll();
    body.classList.add("menu-open");
    burger.setAttribute("aria-expanded","true");
    burger.setAttribute("aria-label","Закрыть меню");
    menu.setAttribute("aria-hidden","false");
    var items=menuItems();
    if(items.length){window.setTimeout(function(){items[0].focus();},30);}
  }

  if(burger){
    burger.addEventListener("click",function(){
      body.classList.contains("menu-open")?closeMenu(true):openMenu();
    });
  }

  document.addEventListener("keydown",function(event){
    if(event.key==="Escape"&&body.classList.contains("menu-open")){
      closeMenu(true);
      return;
    }
    if(event.key==="Tab"&&body.classList.contains("menu-open")){
      var items=menuItems();
      if(!items.length)return;
      var first=items[0];
      var last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });

  if(menu){
    menu.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click",function(){closeMenu(false);});
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
    },{threshold:.06,rootMargin:"0px 0px -18px 0px"});
    reveals.forEach(function(element){observer.observe(element);});
  }else{
    reveals.forEach(function(element){element.classList.add("visible");});
  }

  function initFilter(buttonSelector,itemSelector,attribute){
    var buttons=document.querySelectorAll(buttonSelector);
    var items=document.querySelectorAll(itemSelector);
    if(!buttons.length||!items.length)return;
    buttons.forEach(function(button){
      button.addEventListener("click",function(){
        var filter=button.getAttribute(attribute)||"all";
        buttons.forEach(function(item){
          var active=item===button;
          item.classList.toggle("active",active);
          item.setAttribute("aria-pressed",String(active));
        });
        items.forEach(function(item){
          var categories=(item.dataset.category||"").split(/\s+/);
          item.hidden=filter!=="all"&&categories.indexOf(filter)===-1;
        });
      });
    });
  }

  initFilter(".filter-btn",".material-card","data-filter");
  initFilter(".article-filter",".article","data-article-filter");
  initFilter(".solution-filter",".solution-item, .featured-solution","data-solution-filter");

  function setAccordion(item,open){
    var summary=item.querySelector(".article-summary,.solution-summary");
    var panel=item.querySelector(".article-body,.solution-body");
    if(!summary||!panel)return;
    item.classList.toggle("open",open);
    summary.setAttribute("aria-expanded",String(open));
    panel.setAttribute("aria-hidden",String(!open));
    panel.style.maxHeight=open?panel.scrollHeight+"px":"0px";
  }

  var accordions=document.querySelectorAll(".article,.solution-item");
  accordions.forEach(function(item){
    var summary=item.querySelector(".article-summary,.solution-summary");
    var panel=item.querySelector(".article-body,.solution-body");
    if(panel){panel.setAttribute("aria-hidden","true");}
    if(!summary)return;
    summary.addEventListener("click",function(){
      var open=!item.classList.contains("open");
      setAccordion(item,open);
      if(open&&item.id){history.replaceState(null,"","#"+item.id);}
    });
  });

  function openHashTarget(){
    var id=decodeURIComponent(window.location.hash.replace(/^#/,""));
    if(!id)return;
    var target=document.getElementById(id);
    if(target&&target.matches(".article,.solution-item")){
      setAccordion(target,true);
      window.setTimeout(function(){target.scrollIntoView({block:"start"});},80);
    }
  }
  openHashTarget();
  window.addEventListener("hashchange",openHashTarget);

  var demoData={
    vacancy:{prompt:"Подготовь бриф для вакансии менеджера по продажам. В исходном запросе есть только фраза: «Нужен сильный менеджер, желательно срочно».",title:"Сначала нужно уточнить контекст",points:["Продукт, рынок и основные задачи роли","Структура команды и подчинение","Must-have и nice-to-have","Формат работы и этапы интервью","Критерии решения и риски поиска"],check:"После ответов HR проверяет бриф и утверждает критерии вместе с руководителем."},
    onboarding:{prompt:"Собери onboarding-чек-лист для нового сотрудника на удалённой позиции.",title:"Маршрут адаптации",points:["До выхода: доступы, документы, техника и welcome-сообщение","Первый день: знакомство, роль, команда и каналы связи","Первая неделя: задачи, обучение и контрольная встреча","Первый месяц: критерии адаптации и обратная связь"],check:"Ответственные, сроки и содержание задач подтверждаются HR и руководителем."},
    interview:{prompt:"Подготовь структуру интервью для роли, где важны системность и коммуникация.",title:"Структура интервью",points:["Вводный блок и контекст кандидата","Вопросы по конкретным ситуациям","Уточнения: действия, решения и результат","Evidence matrix для фиксации фактов","Вопросы кандидата и следующие шаги"],check:"AI не оценивает человека и не принимает решение о найме."},
    communication:{prompt:"Составь нейтральное сообщение сотруднику о переносе встречи 1:1.",title:"Черновик сообщения",points:["Коротко назвать изменение","Предложить новый временной слот","Сохранить уважительный и спокойный тон","Указать, что сотрудник может предложить другой вариант"],check:"Перед отправкой HR проверяет контекст, адресата и тон сообщения."},
    process:{prompt:"Разбери процесс offboarding и покажи контрольные точки.",title:"Структура offboarding",points:["Подтверждение даты и плана передачи задач","Коммуникации с сотрудником и командой","Возврат доступов и оборудования","Документы и финальные действия","Exit interview и закрытие процесса"],check:"Юридические и финансовые действия проверяются ответственными специалистами."}
  };

  var demoOutput=document.getElementById("demoOutput");
  var demoButtons=document.querySelectorAll(".demo-option[data-demo]");
  function node(tag,className,text){
    var element=document.createElement(tag);
    if(className)element.className=className;
    if(typeof text==="string")element.textContent=text;
    return element;
  }
  function renderDemo(key){
    if(!demoOutput||!demoData[key])return;
    var data=demoData[key];
    demoOutput.textContent="";
    var user=node("div","demo-bubble user");
    user.appendChild(node("small","","Запрос"));
    user.appendChild(node("p","",data.prompt));
    var assistant=node("div","demo-bubble assistant");
    assistant.appendChild(node("small","","Демонстрационный ответ"));
    assistant.appendChild(node("h4","",data.title));
    var list=node("ul","");
    data.points.forEach(function(point){list.appendChild(node("li","",point));});
    assistant.appendChild(list);
    assistant.appendChild(node("p","",data.check));
    demoOutput.appendChild(user);
    demoOutput.appendChild(assistant);
  }
  demoButtons.forEach(function(button){
    button.addEventListener("click",function(){
      demoButtons.forEach(function(item){
        var active=item===button;
        item.classList.toggle("active",active);
        item.setAttribute("aria-pressed",String(active));
      });
      renderDemo(button.dataset.demo);
    });
  });
  if(demoOutput){renderDemo("vacancy");}

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

  var resizeTimer;
  window.addEventListener("resize",function(){
    window.clearTimeout(resizeTimer);
    resizeTimer=window.setTimeout(function(){
      if(window.innerWidth>1180&&body.classList.contains("menu-open")){closeMenu(false);}
      document.querySelectorAll(".article.open,.solution-item.open").forEach(function(item){
        var panel=item.querySelector(".article-body,.solution-body");
        if(panel){panel.style.maxHeight=panel.scrollHeight+"px";}
      });
    },80);
  });
})();
