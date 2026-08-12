'use strict';
/* TalentBase preview extension: operational Contact Status + actionable Analytics. */
(() => {
  const CONTACT_STATUSES = [
    {k:'none',l:'Не связывались',tone:'gray',dot:'#9aa4a0'},
    {k:'need',l:'Нужно связаться',tone:'blue',dot:'#5b8fd6'},
    {k:'call',l:'Позвонить',tone:'blue',dot:'#5b8fd6'},
    {k:'sent',l:'Написали',tone:'blue',dot:'#5b8fd6'},
    {k:'waiting',l:'Ждём ответа',tone:'amber',dot:'#d99a2b'},
    {k:'dialog',l:'В диалоге',tone:'green',dot:'#2fae74'},
    {k:'followup',l:'Follow-up',tone:'amber',dot:'#d99a2b'},
    {k:'notint',l:'Не заинтересован',tone:'red',dot:'#b06a6c'},
    {k:'nocontact',l:'Не контактировать',tone:'red',dot:'#b06a6c'}
  ];
  const csById = k => CONTACT_STATUSES.find(c => c.k === k) || CONTACT_STATUSES[0];
  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };

  // Extend the existing Profile Status model without merging it with Contact Status.
  GROUPS.splice(0, GROUPS.length,
    {key:'new',title:'Новые'},
    {key:'review',title:'На проверке'},
    {key:'ready',title:'В базе'},
    {key:'inwork',title:'В работе'},
    {key:'paused',title:'На паузе'},
    {key:'archive',title:'Архив'}
  );
  Object.assign(STATE_LABEL,{ready:'В базе',paused:'На паузе'});
  Object.assign(STATE_CHIP,{ready:'c-gray',paused:'c-gray'});
  STATUSES.splice(0, STATUSES.length,
    {k:'new',l:'Новый',d:'Создан / импортирован и ещё не разобран OWNER'},
    {k:'review',l:'На проверке',d:'Слабые данные, конфликт, спорная классификация или возможный дубль'},
    {k:'ready',l:'В базе',d:'Проверен и релевантен, активной работы сейчас нет'},
    {k:'inwork',l:'В работе',d:'OWNER сейчас реально работает с этим человеком'},
    {k:'paused',l:'На паузе',d:'Профиль актуален, но работа временно остановлена'},
    {k:'archive',l:'Архив',d:'Исторически сохранён, исключён из активной работы'}
  );

  // Synthetic preview states only. No real CRM data is introduced here.
  const fixtures = {
    p1:{contactStatus:'call'},
    p4:{contactStatus:'dialog'},
    p5:{contactStatus:'nocontact'},
    p8:{contactStatus:'waiting'},
    p10:{contactStatus:'waiting'},
    p11:{contactStatus:'followup',followUpAt:todayISO(),state:'paused'},
    p12:{contactStatus:'notint'},
    p15:{contactStatus:'need'},
    p16:{contactStatus:'none',state:'ready'},
    p17:{contactStatus:'sent'},
    p30:{contactStatus:'call'},
    p35:{contactStatus:'sent'}
  };
  Object.entries(fixtures).forEach(([id,patch]) => { const p=byId(id); if(p) Object.assign(p,patch); });
  PROFILES.forEach(p => { if(!p.contactStatus) p.contactStatus='none'; if(!('followUpAt' in p)) p.followUpAt=null; });

  state.filters.contact = state.filters.contact || new Set();
  state.contactFor = null;
  state.pickContact = null;

  function csChipHTML(p){
    const c=csById(p.contactStatus||'none');
    const fu=p.contactStatus==='followup'&&p.followUpAt?' · '+String(p.followUpAt).slice(5):'';
    return `<span class="cs-chip cs-${c.tone}" role="button" tabindex="0" data-open-contact="${p.id}" aria-label="Статус контакта: ${esc(c.l)}. Изменить"><span class="cs-dot" style="background:${c.dot}"></span>${esc(c.l+fu)}</span>`;
  }
  function csCount(k){ return PROFILES.filter(p => p.state!=='archive' && (p.contactStatus||'none')===k).length; }

  function profileGroupHTML(key,title,dot){
    return `<section class="acc card w-collapse" data-group="${key}"><button class="acc-h" data-toggle><span class="g-dot ${dot}"></span><span class="acc-t">${title}</span><span class="acc-meta" data-group-count="${key}">0</span><svg class="ic chev"><use href="#i-chev-d"/></svg></button><div class="w-body"><div class="w-inner"><div data-group-list="${key}"></div></div></div></section>`;
  }
  const inworkSection=document.querySelector('[data-group="inwork"]');
  if(inworkSection && !document.querySelector('[data-group="ready"]')) inworkSection.insertAdjacentHTML('beforebegin',profileGroupHTML('ready','В базе','d-ready'));
  const archiveSection=document.querySelector('[data-group="archive"]');
  if(archiveSection && !document.querySelector('[data-group="paused"]')) archiveSection.insertAdjacentHTML('beforebegin',profileGroupHTML('paused','На паузе','d-paused'));

  const statusFilter=document.querySelector('#f-status')?.closest('.f-group');
  if(statusFilter && !document.querySelector('#f-contact')) statusFilter.insertAdjacentHTML('afterend','<div class="f-group"><span class="f-label">Контакт</span><div class="f-chips" id="f-contact"></div></div>');

  const desktopImport=document.querySelector('.topnav > [data-nav="import"]');
  if(desktopImport && !document.querySelector('.topnav > [data-nav="analytics"]')) desktopImport.insertAdjacentHTML('beforebegin','<button class="tnav" data-nav="analytics">Аналитика</button>');
  const mobileImport=document.querySelector('#navDrawer .dnav > [data-nav="import"]');
  if(mobileImport && !document.querySelector('#navDrawer .dnav > [data-nav="analytics"]')) mobileImport.insertAdjacentHTML('beforebegin','<button data-nav="analytics"><svg class="ic"><use href="#i-trend"/></svg>Аналитика</button>');

  if(!document.querySelector('#page-analytics')){
    const settings=document.querySelector('#page-settings');
    const page='<section class="page" id="page-analytics"><div class="page-h"><h1 class="page-title">Аналитика</h1><span class="page-sub">Текущая база · рабочие состояния</span></div><div id="analyticsBox"></div></section>';
    if(settings) settings.insertAdjacentHTML('beforebegin',page);
  }

  if(!document.querySelector('#contactDrawer')){
    const toasts=document.querySelector('#toasts');
    const drawer=`<aside class="drawer drawer-right" id="contactDrawer" aria-label="Статус контакта"><div class="drawer-h"><b>Статус контакта</b><button class="iconbtn" data-drawer-close aria-label="Закрыть"><svg class="ic"><use href="#i-x"/></svg></button></div><div class="drawer-b"><div id="contactStatusBody"></div><div class="tb-contact-follow" id="contactFollowWrap" hidden><div class="field"><label for="contactFollowDate">Дата follow-up</label><input class="input" id="contactFollowDate" type="date"></div><p class="tb-contact-note">Статус контакта не меняет статус профиля и recruiting-стадию.</p></div></div><div class="drawer-f"><button class="btn btn-primary" data-contact-save><svg class="ic ic-s"><use href="#i-check"/></svg>Сохранить</button></div></aside>`;
    if(toasts) toasts.insertAdjacentHTML('beforebegin',drawer); else document.body.insertAdjacentHTML('beforeend',drawer);
  }

  const attentionLabel=[...document.querySelectorAll('#page-home .sec-label')].find(x=>x.textContent.trim()==='Требует внимания');
  if(attentionLabel && !document.querySelector('#homeContact')){
    attentionLabel.insertAdjacentHTML('beforebegin','<div class="tb-contact-section"><div class="sec-label">Сегодня · контакты</div><section class="acc card w-collapse w-open"><button class="acc-h att-h" data-toggle><span class="att-dot dot-blue"></span><span class="acc-t">Очередь контакта</span><span class="cnt" id="cntContact">0</span><svg class="ic chev"><use href="#i-chev-d"/></svg></button><div class="w-body"><div class="w-inner"><div id="homeContact"></div></div></div></section></div>');
  }

  const baseActiveFilterCount=activeFilterCount;
  activeFilterCount=function(){ return baseActiveFilterCount()+state.filters.contact.size; };
  const baseMatchFilters=matchFilters;
  matchFilters=function(p,q){
    if(!baseMatchFilters(p,q)) return false;
    return !state.filters.contact.size || state.filters.contact.has(p.contactStatus||'none');
  };
  const baseBuildFilterChips=buildFilterChips;
  buildFilterChips=function(){
    baseBuildFilterChips();
    const box=document.querySelector('#f-contact');
    if(box){
      box.innerHTML=CONTACT_STATUSES.map(c=>`<button class="fchip ${state.filters.contact.has(c.k)?'on':''}" data-f="contact" data-v="${c.k}">${esc(c.l)}</button>`).join('');
    }
    updateFilterBadge();
  };

  const baseProfRow=profRow;
  profRow=function(p){
    const html=baseProfRow(p);
    return html.replace('<span class="pr-status">',`<span class="pr-status">${csChipHTML(p)}`);
  };

  const baseRenderProfile=renderProfile;
  renderProfile=function(id){
    baseRenderProfile(id);
    const p=byId(id); if(!p) return;
    const chips=document.querySelector('#profileBox .pchips');
    if(chips && !chips.querySelector('[data-open-contact]')) chips.insertAdjacentHTML('afterbegin',csChipHTML(p));
    const actions=document.querySelector('#profileBox .pactions');
    if(actions && !actions.querySelector('[data-open-contact]')) actions.insertAdjacentHTML('afterbegin',`<button class="btn btn-ghost btn-sm" data-open-contact="${p.id}"><svg class="ic ic-s"><use href="#i-phone"/></svg>Контакт</button>`);
  };

  const baseCandRow=candRow;
  candRow=function(v,c){
    const p=byId(c.profileId);
    let html=baseCandRow(v,c);
    if(p) html=html.replace('<select class="stage-sel"',csChipHTML(p)+'<select class="stage-sel"');
    return html;
  };

  function renderContactQueue(){
    const box=document.querySelector('#homeContact'); if(!box) return;
    const priority=['call','need','followup','waiting','sent','dialog'];
    const rows=PROFILES.filter(p=>p.state!=='archive'&&priority.includes(p.contactStatus||'none')).sort((a,b)=>priority.indexOf(a.contactStatus)-priority.indexOf(b.contactStatus));
    const cnt=document.querySelector('#cntContact'); if(cnt) cnt.textContent=rows.length;
    box.innerHTML=rows.slice(0,8).map(p=>`<div class="contact-queue-row"><button class="contact-queue-main" data-open-profile="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.headline)} · ${esc(p.location)}</span></button>${csChipHTML(p)}</div>`).join('')||emptyHtml('Нет запланированных контактов');
  }
  const baseRenderHome=renderHome;
  renderHome=function(){ baseRenderHome(); renderContactQueue(); };

  function goProfilesStatus(k){
    Object.values(state.filters).forEach(s=>s.clear());
    state.filters.status=new Set([k]); state.search=''; state.scope='all';
    const si=document.querySelector('#searchInput'); if(si) si.value='';
    go('profiles'); updateFilterBadge();
  }
  function goContactFilter(keys){
    Object.values(state.filters).forEach(s=>s.clear());
    state.filters.contact=new Set(keys); state.search=''; state.scope='all';
    const si=document.querySelector('#searchInput'); if(si) si.value='';
    go('profiles'); updateFilterBadge();
  }
  function analyticsBar(label,count,total,color,attr){
    const pct=total?Math.round(count*100/total):0;
    return `<button class="an-row" ${attr}><span class="an-label">${esc(label)}</span><span class="an-track"><i class="an-fill ${color}" style="width:${pct}%"></i></span><span class="an-value">${count} · ${pct}%</span></button>`;
  }
  function renderAnalytics(){
    const box=document.querySelector('#analyticsBox'); if(!box) return;
    const total=PROFILES.length, active=PROFILES.filter(p=>p.state!=='archive').length;
    const ps={}; GROUPS.forEach(g=>ps[g.key]=PROFILES.filter(p=>p.state===g.key).length);
    const needs=csCount('need')+csCount('call')+csCount('waiting')+csCount('followup');
    const dupCount=DUPS.filter(d=>d.status==='open').length+pendingDupRecords().length;
    const stateRows=[
      ['Новый',ps.new,'an-green','new'],['На проверке',ps.review,'an-amber','review'],['В базе',ps.ready,'an-neutral','ready'],['В работе',ps.inwork,'an-blue','inwork'],['На паузе',ps.paused,'an-gray','paused'],['Архив',ps.archive,'an-gray','archive']
    ].map(x=>analyticsBar(x[0],x[1],total,x[2],`data-an-state="${x[3]}"`)).join('');
    const contactRows=CONTACT_STATUSES.map(c=>{
      const color=c.tone==='green'?'an-green':c.tone==='amber'?'an-amber':c.tone==='blue'?'an-blue':c.tone==='red'?'an-red':'an-gray';
      return analyticsBar(c.l,csCount(c.k),active,color,`data-an-contact="${c.k}"`);
    }).join('');
    const action=(label,value,attr,tone='')=>`<button class="an-action" ${attr}><span class="an-action-label">${esc(label)}</span><span class="an-action-value" ${tone?`style="color:var(--${tone})"`:''}>${value}</span><svg class="ic ic-s" style="color:var(--text3)"><use href="#i-chev-r"/></svg></button>`;
    box.innerHTML=`<div class="an-kpis"><button class="an-kpi" data-an-all><b>${total}</b><span>Всего профилей</span></button><button class="an-kpi" data-an-state="new"><b>${ps.new}</b><span>Новые</span></button><button class="an-kpi" data-an-state="review"><b style="color:var(--warn)">${ps.review}</b><span>На Review</span></button><button class="an-kpi" data-an-state="inwork"><b style="color:var(--info)">${ps.inwork}</b><span>В работе</span></button><button class="an-kpi" data-an-contact="followup"><b style="color:var(--warn)">${csCount('followup')}</b><span>Follow-up</span></button><button class="an-kpi" data-an-action><b>${needs}</b><span>Требуют контакта</span></button></div><div class="an-grid"><div><section class="card an-card"><h2 class="an-title">Статус профиля</h2>${stateRows}</section><section class="card an-card" style="margin-top:12px"><h2 class="an-title">Статус контакта</h2>${contactRows}</section></div><section class="card an-card"><h2 class="an-title">Требует действий</h2>${action('Нужно связаться',csCount('need'),'data-an-contact="need"')}${action('Позвонить',csCount('call'),'data-an-contact="call"','info')}${action('Ждём ответа',csCount('waiting'),'data-an-contact="waiting"','warn')}${action('Follow-up',csCount('followup'),'data-an-contact="followup"','warn')}${action('Профили Review',ps.review,'data-an-state="review"','warn')}${action('Возможные дубли',dupCount,'data-an-dups','warn')}</section></div><p class="hint">Цвет обозначает смысл состояния. Нажатие открывает соответствующий рабочий список.</p>`;
  }
  const baseGo=go;
  go=function(page,opts={}){ baseGo(page,opts); if(page==='analytics') renderAnalytics(); };

  function openContactDrawer(pid){
    const p=byId(pid); if(!p) return;
    state.contactFor=pid; state.pickContact=p.contactStatus||'none';
    const body=document.querySelector('#contactStatusBody');
    body.innerHTML=CONTACT_STATUSES.map(c=>`<button class="vpick ${c.k===state.pickContact?'on':''}" data-contact-pick="${c.k}"><span class="cs-dot" style="background:${c.dot}"></span><span style="flex:1;min-width:0;text-align:left"><span class="vp-t">${esc(c.l)}</span></span><span class="pick-check"><svg class="ic"><use href="#i-check"/></svg></span></button>`).join('');
    const follow=document.querySelector('#contactFollowWrap'), date=document.querySelector('#contactFollowDate');
    follow.hidden=state.pickContact!=='followup'; date.value=p.followUpAt||'';
    openDrawer('contactDrawer');
  }
  function saveContactStatus(){
    const p=byId(state.contactFor); if(!p||!state.pickContact){closeDrawers();return;}
    p.contactStatus=state.pickContact;
    p.followUpAt=state.pickContact==='followup'?(document.querySelector('#contactFollowDate').value||null):null;
    p.history.unshift({d:'Сегодня, '+nowTime(),t:'Статус контакта: '+csById(p.contactStatus).l+(p.followUpAt?' · '+p.followUpAt:'')});
    closeDrawers(); toast('Контакт: '+csById(p.contactStatus).l);
    renderGroups(); renderHome();
    if(state.page==='profile') renderProfile(p.id);
    if(state.page==='vacancy') renderVacancy(state.vacancyId);
    if(state.page==='analytics') renderAnalytics();
  }

  // Capture phase keeps quick Contact Status editing independent from row navigation.
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-open-contact]');
    if(open){e.preventDefault();e.stopImmediatePropagation();openContactDrawer(open.dataset.openContact);return;}
    const pick=e.target.closest('[data-contact-pick]');
    if(pick){e.preventDefault();e.stopImmediatePropagation();state.pickContact=pick.dataset.contactPick;document.querySelectorAll('#contactStatusBody [data-contact-pick]').forEach(x=>x.classList.toggle('on',x.dataset.contactPick===state.pickContact));document.querySelector('#contactFollowWrap').hidden=state.pickContact!=='followup';return;}
    if(e.target.closest('[data-contact-save]')){e.preventDefault();e.stopImmediatePropagation();saveContactStatus();return;}
    const s=e.target.closest('[data-an-state]');
    if(s){e.preventDefault();e.stopImmediatePropagation();goProfilesStatus(s.dataset.anState);return;}
    const c=e.target.closest('[data-an-contact]');
    if(c){e.preventDefault();e.stopImmediatePropagation();goContactFilter([c.dataset.anContact]);return;}
    if(e.target.closest('[data-an-all]')){e.preventDefault();e.stopImmediatePropagation();Object.values(state.filters).forEach(x=>x.clear());go('profiles',{scope:'all'});return;}
    if(e.target.closest('[data-an-action]')){e.preventDefault();e.stopImmediatePropagation();goContactFilter(['need','call','waiting','followup']);return;}
    if(e.target.closest('[data-an-dups]')){e.preventDefault();e.stopImmediatePropagation();go('home');const sec=document.querySelector('#homeDup')?.closest('.w-collapse');if(sec){sec.classList.add('w-open');sec.scrollIntoView({behavior:'smooth',block:'center'});}return;}
  },true);
  document.addEventListener('keydown',e=>{
    const x=e.target.closest&&e.target.closest('[data-open-contact]');
    if(x&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openContactDrawer(x.dataset.openContact);}
  },true);

  const baseExportCSV=exportCSV;
  exportCSV=function(){
    const rows=[['Имя','Роль','Направления','Локация','Источник','Статус профиля','Статус контакта','Подтверждённость','Вакансии']];
    PROFILES.forEach(p=>rows.push([p.name,p.headline,p.directions.map(dirName).join('; '),p.location,p.source,STATE_LABEL[p.state],csById(p.contactStatus||'none').l,p.verify,candsForProfile(p.id).map(c=>vacById(c.vacancyId).title+' ('+STAGE_LABEL[c.stage]+')').join('; ')]));
    const csv=rows.map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(';')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='talentbase-profiles.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);toast('CSV с профилями выгружен','i-download');
  };
  void baseExportCSV;

  buildFilterChips(); renderGroups(); renderHome(); renderVacancies(); renderDirCounts(); updateNavUI();
})();
