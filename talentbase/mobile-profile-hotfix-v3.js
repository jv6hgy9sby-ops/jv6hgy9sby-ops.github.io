'use strict';
/* TalentBase mobile/profile safety hotfix.
   Prevents profile render crashes from partial preview fixture objects and
   restores the previous page if any card renderer throws. */
(() => {
  function normalizeProfileRuntime(p){
    if(!p) return p;
    p.contacts = Object.assign({email:null,phone:null,linkedin:null,telegram:null}, p.contacts || {});
    p.history = Array.isArray(p.history) ? p.history : [];
    p.notes = Array.isArray(p.notes) ? p.notes : [];
    p.skills = Array.isArray(p.skills) ? p.skills : [];
    p.exp = Array.isArray(p.exp) ? p.exp : [];
    p.langs = Array.isArray(p.langs) ? p.langs : [];
    p.directions = Array.isArray(p.directions) ? p.directions : [];
    p.prov = p.prov || {};
    p.ai = Object.assign({
      n:0,
      summary:'',
      missing:[],
      contradictions:[],
      dup:null,
      suggests:[],
      recs:[],
      next:''
    }, p.ai || {});
    p.ai.missing = Array.isArray(p.ai.missing) ? p.ai.missing : [];
    p.ai.contradictions = Array.isArray(p.ai.contradictions) ? p.ai.contradictions : [];
    p.ai.suggests = Array.isArray(p.ai.suggests) ? p.ai.suggests : [];
    p.ai.recs = Array.isArray(p.ai.recs) ? p.ai.recs : [];
    return p;
  }

  if(Array.isArray(PROFILES)) PROFILES.forEach(normalizeProfileRuntime);

  const previousRenderProfile = renderProfile;
  renderProfile = function(id){
    normalizeProfileRuntime(byId(id));
    return previousRenderProfile(id);
  };

  const previousGo = go;
  go = function(page, opts={}){
    const prev = {
      page: state.page,
      profileId: state.profileId,
      vacancyId: state.vacancyId,
      runId: state.runId,
      scope: state.scope
    };
    try{
      return previousGo(page, opts);
    }catch(err){
      console.error('TalentBase navigation/render error', err);
      state.page = prev.page;
      state.profileId = prev.profileId;
      state.vacancyId = prev.vacancyId;
      state.runId = prev.runId;
      state.scope = prev.scope;
      document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === 'page-' + prev.page));
      try{ updateNavUI(); }catch(_e){}
      try{ closeDrawers(); }catch(_e){}
      try{ toast('Не удалось открыть карточку. Экран восстановлен.','i-alert'); }catch(_e){}
      return false;
    }
  };

  // On mobile, always keep a visible way back once a profile is rendered.
  const style = document.createElement('style');
  style.textContent = `
    @media(max-width:639px){
      #page-profile .back{display:inline-flex;position:relative;z-index:2;min-height:40px;margin:0 0 10px 0}
      #page-profile.active{min-height:50vh}
      .drawer-h{padding-top:max(9px,env(safe-area-inset-top))}
    }
  `;
  document.head.appendChild(style);
})();
