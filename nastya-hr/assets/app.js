(function(){
  "use strict";

  var root=document.documentElement;
  var body=document.body;
  var page=body.dataset.page||"";
  var headerHost=document.querySelector("[data-site-header]");
  var footerHost=document.querySelector("[data-site-footer]");
  var themeStorageKey="anasteysha-theme";
  var themeColors={light:"#F6F1E8",dark:"#181715"};
  var nav=[
    {href:"education.html",label:"Специалистам",pages:["education"]},
    {href:"mentoring.html",label:"Наставничество",pages:["mentoring"]},
    {href:"business.html",label:"Компаниям",pages:["business"]},
    {href:"solutions.html",label:"Решения",pages:["solutions"]},
    {href:"about.html",label:"О Насте",pages:["about"]},
    {href:"materials.html",label:"База знаний",pages:["materials","blog"]},
    {href:"contact.html",label:"Контакты",pages:["contact","privacy"]}
  ];

  function isActive(item){
    return item.pages.indexOf(page)!==-1;
  }

  function navLinks(){
    return nav.map(function(item){
      var current=isActive(item)?' class="active" aria-current="page"':"";
      return '<a href="'+item.href+'"'+current+'>'+item.label+'</a>';
    }).join("");
  }

  function themeButton(extraClass){
    return '<button class="theme-switch '+(extraClass||"")+'" type="button" data-theme-toggle aria-label="Переключить на тёмную тему" aria-pressed="false">'+
      '<span class="theme-switch-track" aria-hidden="true">'+
        '<span class="theme-switch-icon sun">☀</span>'+
        '<span class="theme-switch-icon moon">☾</span>'+
        '<span class="theme-switch-thumb"></span>'+
      '</span>'+
    '</button>';
  }

  if(headerHost){
    headerHost.innerHTML=
      '<header class="site-header" id="siteHeader">'+
        '<div class="container header-inner">'+
          '<a class="logo" href="index.html" aria-label="Anasteysha — главная">Anasteysha</a>'+
          '<nav class="desktop-nav" aria-label="Основная навигация">'+navLinks()+'</nav>'+
          '<div class="header-actions">'+
            themeButton("header-theme-switch")+
            '<a class="btn small-btn" href="contact.html">Обсудить задачу</a>'+
            '<button class="burger" id="burger" type="button" aria-label="Открыть меню" aria-controls="mobileMenu" aria-expanded="false"><i></i><i></i><i></i></button>'+
          '</div>'+
        '</div>'+
      '</header>'+
      '<nav class="mobile-menu" id="mobileMenu" aria-label="Мобильная навигация" aria-hidden="true">'+
        '<a href="index.html"'+(page==="home"?' class="active" aria-current="page"':"")+'>Главная</a>'+navLinks()+
        '<div class="mobile-theme-row"><span>Тема сайта</span>'+themeButton("mobile-theme-switch")+'</div>'+
        '<a class="btn" href="contact.html">Обсудить задачу</a>'+
      '</nav>';
  }

  if(footerHost){
    footerHost.innerHTML=
      '<footer class="site-footer">'+
        '<div class="container">'+
          '<div class="footer-grid">'+
            '<div class="footer-brand"><a class="logo" href="index.html">Anasteysha</a><p>Практический HR для специалистов, руководителей и команд: обучение, наставничество, рекрутинг, HR Operations и AI-инструменты для HR.</p></div>'+
            '<div class="footer-col"><h3>Направления</h3><div class="footer-links"><a href="education.html">Специалистам</a><a href="mentoring.html">Наставничество</a><a href="business.html">Компаниям</a><a href="solutions.html">Решения</a></div></div>'+
            '<div class="footer-col"><h3>База знаний</h3><div class="footer-links"><a href="materials.html">Шаблоны и материалы</a><a href="blog.html">Статьи</a><a href="about.html">О Насте</a><a href="contact.html">Контакты</a></div></div>'+
            '<div class="footer-col"><h3>Связь</h3><div class="footer-links"><span>Telegram — будет добавлен</span><span>Email — будет добавлен</span><span>Формат — онлайн</span><a href="privacy.html">Конфиденциальность</a></div></div>'+
          '</div>'+
          '<div class="footer-bottom"><span>© <span data-year></span> Anasteysha. Персональный HR-проект.</span><a href="#top">Наверх ↑</a></div>'+
        '</div>'+
      '</footer>';
  }

  function getSavedTheme(){
    try{
      var saved=localStorage.getItem(themeStorageKey);
      return saved==="light"||saved==="dark"?saved:null;
    }catch(error){
      return null;
    }
  }

  function syncThemeControls(theme){
    document.querySelectorAll("[data-theme-toggle]").forEach(function(button){
      var dark=theme==="dark";
      button.setAttribute("aria-pressed",String(dark));
      button.setAttribute("aria-label",dark?"Переключить на светлую тему":"Переключить на тёмную тему");
      button.title=dark?"Светлая тема":"Тёмная тема";
    });
  }

  function applyTheme(theme,persist){
    root.dataset.theme=theme;
    root.dataset.themeSource=persist?"user":"system";
    root.style.colorScheme=theme;
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta){meta.setAttribute("content",themeColors[theme]);}
    if(persist){
      try{localStorage.setItem(themeStorageKey,theme);}catch(error){}
    }
    syncThemeControls(theme);
  }

  var mediaTheme=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;
  syncThemeControls(root.dataset.theme||"light");
  document.querySelectorAll("[data-theme-toggle]").forEach(function(button){
    button.addEventListener("click",function(){
      applyTheme(root.dataset.theme==="dark"?"light":"dark",true);
    });
  });
  if(mediaTheme){
    var systemThemeChanged=function(event){
      if(!getSavedTheme()){applyTheme(event.matches?"dark":"light",false);}
    };
    if(typeof mediaTheme.addEventListener==="function")mediaTheme.addEventListener("change",systemThemeChanged);
    else if(typeof mediaTheme.addListener==="function")mediaTheme.addListener(systemThemeChanged);
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

  if(menu){
    menu.addEventListener("click",function(event){
      if(event.target===menu){closeMenu(true);}
    });
    menu.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click",function(){closeMenu(false);});
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

  function updateHeader(){
    if(header){header.classList.toggle("scrolled",window.scrollY>8);}
  }
  updateHeader();
  window.addEventListener("scroll",updateHeader,{passive:true});

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

  document.querySelectorAll(".article,.solution-item").forEach(function(item){
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
  var audienceButtons=document.querySelectorAll("[data-audience-choice]");
  var audiencePanels=document.querySelectorAll("[data-audience-panel]");
  var audienceInput=document.getElementById("lead-audience");
  var formMessage=document.getElementById("formMessage");
  var draftSummary=document.getElementById("draftSummary");
  var copyDraft=document.getElementById("copyDraft");
  var draftText="";

  function setAudience(value){
    if(value!=="specialist"&&value!=="company")return;
    if(audienceInput)audienceInput.value=value;
    audienceButtons.forEach(function(button){
      var active=button.dataset.audienceChoice===value;
      button.classList.toggle("active",active);
      button.setAttribute("aria-pressed",String(active));
    });
    audiencePanels.forEach(function(panel){
      var active=panel.dataset.audiencePanel===value;
      panel.hidden=!active;
      panel.querySelectorAll("input,select,textarea").forEach(function(control){control.disabled=!active;});
    });
    if(formMessage){formMessage.textContent="";formMessage.classList.remove("error");}
    if(draftSummary){draftSummary.hidden=true;}
  }

  audienceButtons.forEach(function(button){
    button.addEventListener("click",function(){setAudience(button.dataset.audienceChoice);});
  });

  function selectedLabel(id){
    var select=document.getElementById(id);
    return select&&select.selectedOptions.length?select.selectedOptions[0].textContent:"";
  }

  if(form){
    var params=new URLSearchParams(window.location.search);
    var interest=params.get("interest")||"";
    var companyInterests=["business","ai-assistant","vacancy-assistant","onboarding","hr-operations","communications","analytics"];
    var initialAudience=companyInterests.indexOf(interest)!==-1?"company":"specialist";
    setAudience(initialAudience);

    var targetSelect=document.getElementById(initialAudience==="company"?"company-interest":"specialist-interest");
    if(interest&&targetSelect&&Array.from(targetSelect.options).some(function(option){return option.value===interest;})){
      targetSelect.value=interest;
    }

    form.addEventListener("input",function(){
      if(formMessage){formMessage.textContent="";formMessage.classList.remove("error");}
      if(draftSummary){draftSummary.hidden=true;}
    });

    form.addEventListener("submit",function(event){
      event.preventDefault();
      if(!form.checkValidity()){
        if(formMessage){formMessage.textContent="Проверьте обязательные поля. Данные не отправлены.";formMessage.classList.add("error");}
        form.reportValidity();
        return;
      }

      var audience=audienceInput&&audienceInput.value==="company"?"Компания или руководитель":"HR-специалист";
      var direction=audienceInput&&audienceInput.value==="company"?selectedLabel("company-interest"):selectedLabel("specialist-interest");
      var goal=document.getElementById(audienceInput&&audienceInput.value==="company"?"company-goal":"specialist-goal");
      var context=document.getElementById(audienceInput&&audienceInput.value==="company"?"company-context":"specialist-context");
      var name=document.getElementById("lead-name");

      draftText="Черновик обращения Anasteysha\n"+
        "Имя: "+(name?name.value.trim():"")+"\n"+
        "Аудитория: "+audience+"\n"+
        "Направление: "+direction+"\n"+
        "Контекст: "+(context?context.value.trim():"")+"\n"+
        "Задача: "+(goal?goal.value.trim():"");

      if(draftSummary){
        draftSummary.hidden=false;
        var values=draftSummary.querySelectorAll("[data-draft-value]");
        values.forEach(function(element){
          var key=element.dataset.draftValue;
          if(key==="audience")element.textContent=audience;
          if(key==="direction")element.textContent=direction;
          if(key==="goal")element.textContent=goal?goal.value.trim():"";
        });
        draftSummary.focus();
      }
      if(formMessage){formMessage.textContent="Черновик проверен. Он не отправлен и не сохранён.";formMessage.classList.remove("error");}
    });
  }

  if(copyDraft){
    copyDraft.addEventListener("click",function(){
      if(!draftText)return;
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(draftText).then(function(){copyDraft.textContent="Скопировано";window.setTimeout(function(){copyDraft.textContent="Скопировать черновик";},1400);});
      }
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
