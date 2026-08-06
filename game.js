"use strict";
(function(){
  var CORE_URLS=[
    "https://raw.githubusercontent.com/jv6hgy9sby-ops/jv6hgy9sby-ops.github.io/622a48da9321c6f86c5a64e0f5a871fb41bf7ef8/game.js",
    "https://cdn.jsdelivr.net/gh/jv6hgy9sby-ops/jv6hgy9sby-ops.github.io@622a48da9321c6f86c5a64e0f5a871fb41bf7ef8/game.js"
  ];

  function fail(message,error){
    console.error(message,error||"");
    if(window.__fatal)window.__fatal(message);
  }

  function replaceRequired(code,from,to,label){
    if(code.indexOf(from)===-1)throw new Error("Не найден патч: "+label);
    return code.replace(from,to);
  }

  function patchCore(code){
    code=replaceRequired(
      code,
      "})();\nvar pug={pos:new THREE.Vector3(.6,0,-1.4)",
      "})();\nvar pugBase={bodyScale:P.body.scale.clone(),bellyScale:P.belly.scale.clone(),noseScale:P.nose.scale.clone(),eyeScales:P.eyes.map(function(e){return e.scale.clone();})};\nvar pug={pos:new THREE.Vector3(.6,0,-1.4)",
      "базовые масштабы Матвея"
    );

    code=replaceRequired(
      code,
      "  P.head.position.set(0,.58,.37);P.head.rotation.set(0,0,0);P.jaw.rotation.x=0;P.jaw.position.y=-.116;\n  [P.legFL,P.legFR,P.legRL,P.legRR].forEach(function(l){l.rotation.set(0,0,0);l.scale.set(1,1,1)});\n  P.tongue.visible=false;P.eyes.forEach(function(e){e.scale.set(1,1,1)});",
      "  P.head.position.set(0,.58,.37);P.head.rotation.set(0,0,0);P.jaw.rotation.x=0;P.jaw.position.y=-.116;\n  P.body.scale.copy(pugBase.bodyScale);P.belly.scale.copy(pugBase.bellyScale);P.nose.scale.copy(pugBase.noseScale);\n  P.body.rotation.set(0,0,0);P.chest.rotation.set(0,0,0);P.rear.position.x=0;\n  [P.legFL,P.legFR,P.legRL,P.legRR].forEach(function(l){l.rotation.set(0,0,0);l.scale.set(1,1,1)});\n  P.tongue.visible=false;P.tongue.position.set(0,-.135,.17);\n  P.eyes.forEach(function(e,index){e.scale.copy(pugBase.eyeScales[index])});",
      "сброс анимации Матвея"
    );

    code=replaceRequired(
      code,
      "if(pug.blink>0){pug.blink-=dt;P.eyes.forEach(function(e){e.scale.y=.12})}",
      "if(pug.blink>0){pug.blink-=dt;P.eyes.forEach(function(e,index){e.scale.y=pugBase.eyeScales[index].y*.12})}",
      "моргание"
    );

    code=replaceRequired(
      code,
      "var breathe=1+Math.sin(t*(run?3.4:1.9))*.015;P.body.scale.y=breathe;P.belly.scale.y=breathe;",
      "var breathe=1+Math.sin(t*(run?3.4:1.9))*.015;P.body.scale.y=pugBase.bodyScale.y*breathe;P.belly.scale.y=pugBase.bellyScale.y*breathe;",
      "дыхание"
    );

    code=replaceRequired(
      code,
      "if(st==='beg'){P.legFR.rotation.x=-1.2+Math.sin(t*6)*.08;P.head.rotation.z=Math.sin(t*1.45)*.075;P.eyes[0].scale.set(1.08,1.08,1.08);P.eyes[1].scale.set(1.08,1.08,1.08)}",
      "if(st==='beg'){P.legFR.rotation.x=-1.2+Math.sin(t*6)*.08;P.head.rotation.z=Math.sin(t*1.45)*.075;P.eyes.forEach(function(e,index){e.scale.copy(pugBase.eyeScales[index]).multiplyScalar(1.08)})}",
      "глаза при попрошайничестве"
    );

    code=replaceRequired(
      code,
      "proceduralPug.position.y=-.035;P.head.position.set(0,.48,.42);P.head.rotation.x=.6;P.nose.scale.set(1+Math.sin(t*20)*.13,1+Math.sin(t*20)*.13,1+Math.sin(t*20)*.13);proceduralPug.rotation.z=Math.sin(t*5)*.025;",
      "proceduralPug.position.y=-.035;P.head.position.set(0,.48,.42);P.head.rotation.x=.6;var nosePulse=1+Math.sin(t*20)*.13;P.nose.scale.copy(pugBase.noseScale).multiplyScalar(nosePulse);proceduralPug.rotation.z=Math.sin(t*5)*.025;",
      "анимация носа"
    );

    code=replaceRequired(
      code,
      "if(st==='sleep'){P.eyes.forEach(function(e){e.scale.y=.06});if(pug.jolt>0)",
      "if(st==='sleep'){P.eyes.forEach(function(e,index){e.scale.y=pugBase.eyeScales[index].y*.06});if(pug.jolt>0)",
      "закрытые глаза во сне"
    );

    return code+"\n//# sourceURL=matvey-game-core-fixed.js";
  }

  function loadAt(index){
    if(index>=CORE_URLS.length){fail("Не удалось загрузить игровой код. Обновите страницу.");return;}
    fetch(CORE_URLS[index],{cache:"force-cache"})
      .then(function(response){if(!response.ok)throw new Error("HTTP "+response.status);return response.text();})
      .then(function(code){window.eval(patchCore(code));})
      .catch(function(error){console.warn("Источник игрового кода недоступен:",CORE_URLS[index],error);loadAt(index+1);});
  }

  loadAt(0);
})();