/* 정하기: 사다리·룰렛·제비뽑기·순서·팀·주사위·폭탄·마니또 */
(function(){
'use strict';
const E = NL.esc;
const needNames = (names, min, max) => { const n=NL.uniq(names); if(n.length<min) throw `참가자를 ${min}명 이상 넣어 주세요 (같은 이름은 한 번만 들어가요)`; if(n.length>max) throw `참가자는 최대 ${max}명까지예요`; return n; };
const COLORS = ['#E2574C','#3B7DD8','#2E9E6B','#E8B230','#8A5CD0','#E07A3A','#2BA3B5','#C2457A','#5E7D2E','#7A5A17'];

/* ---------- 사다리 ---------- */
NL.reg({ id:'ladder', cat:'decide', name:'사다리 타기', desc:'커피·청소·벌칙 정하기', bg:'#F3E7CC', icon:'ladder',
  long:'참가자와 결과를 넣으면 모두 같은 사다리를 봅니다. 링크를 연 사람 누구나 같은 결과가 나와요.',
  defTitle:'오늘 커피 누가 쏘나',
  fields:[
    {k:'names', type:'list', label:'참가자 (2~12명)', ph:'한 줄에 한 명\n민수\n지연\n현우', def:['민수','지연','현우','소희']},
    {k:'items', type:'list', label:'결과', ph:'한 줄에 하나', def:['커피 쏘기','통과','통과','통과'], help:'참가자 수보다 적으면 나머지는 "통과"로 채워요'}
  ],
  build(v){ const names=needNames(v.names,2,12); let items=v.items.slice(0,names.length); while(items.length<names.length) items.push('통과'); return {names, items}; },
  promo:{t:'이 사다리, 행사장 경품 추첨으로 키워보세요', d:'주최자가 경품·확률을 정하는 대형화면 럭키 추첨기와 7초를 잡아라 같은 게임 키오스크'},
  render(ctx){
    const {names, items} = ctx.room.d; const n=names.length; const r=NL.rng(ctx.room.s);
    const rows = Math.max(8, n*2+2); const rungs=[];
    const free = (i,y) => !rungs.some(q=>q.y===y && (q.i===i-1||q.i===i||q.i===i+1));
    for(let y=1;y<=rows;y++){ for(let i=0;i<n-1;i++){ if(r()<0.42 && free(i,y)) rungs.push({i,y}); } }
    for(let i=0;i<n-1;i++){ let tries=0; while(rungs.filter(q=>q.i===i).length<3 && tries++<60){ const y=1+Math.floor(r()*rows); if(free(i,y)) rungs.push({i,y}); } }
    // 결과를 섞는 건 시드로 (사다리 모양 자체가 섞기 역할)
    const trace = s => { let c=s; const path=[[c,0]]; for(let y=1;y<=rows;y++){ path.push([c,y]); if(rungs.some(q=>q.y===y&&q.i===c)){c++;path.push([c,y]);} else if(rungs.some(q=>q.y===y&&q.i===c-1)){c--;path.push([c,y]);} } path.push([c,rows+1]); return {path,end:c}; };
    ctx.el.innerHTML = `<div class="stage"><canvas class="cv" id="lc"></canvas>
      <div class="namebtns" id="nb">${names.map((nm,i)=>`<button class="pill" data-i="${i}" type="button">${E(nm)}</button>`).join('')}</div>
      <div class="row"><button class="btn" id="all">전체 결과 보기</button></div><ol class="list-ol" id="res"></ol></div>`;
    const cv=NL.$('#lc'); const W=Math.max(320, n*72), H=Math.max(380, rows*36+110); cv.width=W*2; cv.height=H*2; cv.style.aspectRatio=`${W}/${H}`; const g=cv.getContext('2d'); g.scale(2,2);
    const X=i=>36+i*(W-72)/Math.max(1,n-1), Y=y=>54+y*(H-108)/(rows+1);
    const done = new Set();
    const label = (t,x,y,col,bold) => { g.fillStyle=col; g.font=`${bold?800:600} 14px Pretendard, sans-serif`; g.textAlign='center'; let s=t; while(g.measureText(s).width>(W/n-6) && s.length>2) s=s.slice(0,-1); if(s!==t) s+='…'; g.fillText(s,x,y); };
    const base = () => { g.clearRect(0,0,W,H); g.lineCap='round'; g.lineWidth=3; g.strokeStyle='#D9D1BE';
      for(let i=0;i<n;i++){ g.beginPath(); g.moveTo(X(i),Y(0)); g.lineTo(X(i),Y(rows+1)); g.stroke(); label(names[i],X(i),30,'#172742',true); }
      rungs.forEach(q=>{ g.beginPath(); g.moveTo(X(q.i),Y(q.y)); g.lineTo(X(q.i+1),Y(q.y)); g.stroke(); });
      for(let i=0;i<n;i++){ const revealed=[...done].some(s=>trace(s).end===i); label(revealed?items[i]:'?', X(i), H-22, revealed?'#B68A36':'#9aa0b0', revealed); } };
    const drawPath = (path, col, upto) => { g.strokeStyle=col; g.lineWidth=5; g.beginPath(); path.slice(0,upto).forEach((p,k)=>{ const x=X(p[0]), y=Y(p[1]); k?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); };
    const redraw = (extra) => { base(); [...done].forEach(s=>drawPath(trace(s).path, COLORS[s%COLORS.length], 999)); if(extra) extra(); };
    redraw();
    const res=NL.$('#res');
    const addRes = s => { const t=trace(s); const li=document.createElement('li'); li.innerHTML=`<i>${s+1}</i><span style="flex:1">${E(names[s])}</span><b style="color:${items[t.end]==='통과'?'#596579':'#B68A36'}">${E(items[t.end])}</b>`; res.appendChild(li); };
    const run = s => new Promise(ok => { if(done.has(s)) return ok(); const t=trace(s); let k=1; const col=COLORS[s%COLORS.length];
      const step=()=>{ k++; redraw(()=>drawPath(t.path,col,k)); if(k<t.path.length) setTimeout(step, 55); else { done.add(s); redraw(); addRes(s); NL.$(`#nb [data-i="${s}"]`).classList.add('done'); NL.beep(660,.08); ok(); } }; step(); });
    NL.$$('#nb button').forEach(b=>b.onclick=()=>run(+b.dataset.i));
    NL.$('#all').onclick = async () => { NL.$('#all').disabled=true; for(let i=0;i<n;i++) await run(i); };
  }
});

/* ---------- 룰렛 ---------- */
NL.reg({ id:'roulette', cat:'decide', name:'다 같이 보는 룰렛', desc:'링크 연 사람 모두 같은 결과', bg:'#E7EDF8', icon:'wheel',
  long:'후보를 넣고 링크를 보내세요. 1판·2판… 판마다 결과가 정해져 있어서 누가 돌려도 같은 결과가 나옵니다.',
  defTitle:'오늘 점심 뭐 먹지',
  fields:[{k:'items', type:'list', label:'후보 (2~16개)', ph:'한 줄에 하나', def:['김치찌개','돈까스','국밥','샐러드','짜장면']}],
  build(v){ const items=NL.uniq(v.items); if(items.length<2) throw '후보를 2개 이상 넣어 주세요'; if(items.length>16) throw '후보는 16개까지예요'; return {items}; },
  promo:{t:'이 룰렛, 로고·경품 넣어 행사장에서', d:'주최자가 경품과 확률·재고를 정하는 럭키 경품 추첨기 키오스크'},
  render(ctx){
    const {items}=ctx.room.d; const n=items.length; let round=1, angle=0, spinning=false;
    ctx.el.innerHTML=`<div class="stage"><div style="position:relative"><canvas class="cv" id="wc" style="aspect-ratio:1;background:transparent"></canvas>
      <svg viewBox="0 0 40 40" style="position:absolute;left:50%;top:-4px;width:34px;transform:translateX(-50%)"><path d="M20 38L6 6h28z" fill="#172742"/></svg></div>
      <div class="hud"><div><small>판</small><b id="rd">1판</b></div><div><small>결과</small><b id="rv" style="font-size:20px">-</b></div></div>
      <button class="btn" id="sp">룰렛 돌리기</button><button class="btn sub" id="nx" hidden>다음 판 돌리기</button><ol class="list-ol" id="hist"></ol></div>`;
    const cv=NL.$('#wc'), S=600; cv.width=S; cv.height=S; const g=cv.getContext('2d');
    const draw = a => { g.clearRect(0,0,S,S); const R=S/2-10;
      for(let i=0;i<n;i++){ const a0=a+i*2*Math.PI/n-Math.PI/2, a1=a0+2*Math.PI/n; g.beginPath(); g.moveTo(S/2,S/2); g.arc(S/2,S/2,R,a0,a1); g.closePath(); g.fillStyle=COLORS[i%COLORS.length]; g.fill(); g.strokeStyle='#fff'; g.lineWidth=3; g.stroke();
        g.save(); g.translate(S/2,S/2); g.rotate((a0+a1)/2); g.textAlign='right'; g.fillStyle='#fff'; g.font=`700 ${n>10?22:28}px Pretendard, sans-serif`; let t=items[i]; if(t.length>8) t=t.slice(0,7)+'…'; g.fillText(t, R-20, 9); g.restore(); }
      g.beginPath(); g.arc(S/2,S/2,40,0,7); g.fillStyle='#fff'; g.fill(); g.lineWidth=6; g.strokeStyle='#172742'; g.stroke(); };
    draw(0);
    const winnerOf = rd => Math.floor(NL.rng(ctx.room.s + rd*7919)()*n);
    const spin = () => { if(spinning) return; spinning=true; NL.$('#sp').disabled=true; NL.$('#nx').hidden=true;
      const w = winnerOf(round); const seg=2*Math.PI/n; const jitter=(NL.rng(ctx.room.s+round)()-.5)*seg*.6;
      const target = -(w*seg + seg/2) + jitter; const start=angle; const TAU=2*Math.PI; const end = target + TAU*Math.ceil((start + TAU*6 - target)/TAU);
      const dur=4200, t0=performance.now(); let lastTick=0;
      const f = t => { const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,4); angle = start + (end-start)*e; draw(angle);
        const tk=Math.floor(angle/seg); if(tk!==lastTick){ lastTick=tk; if(p<.95) NL.beep(900,.02,'square'); }
        if(p<1) requestAnimationFrame(f); else { spinning=false; NL.$('#rv').textContent=items[w]; NL.beep(660,.25); NL.vibrate(60);
          const li=document.createElement('li'); li.innerHTML=`<i>${round}</i><span style="flex:1">${round}판 결과</span><b>${E(items[w])}</b>`; NL.$('#hist').prepend(li);
          NL.$('#nx').hidden=false; } };
      requestAnimationFrame(f); };
    NL.$('#sp').onclick = spin;
    NL.$('#nx').onclick = () => { round++; NL.$('#rd').textContent=round+'판'; NL.$('#rv').textContent='-'; spin(); };
  }
});

/* ---------- 제비뽑기 ---------- */
NL.reg({ id:'lots', cat:'decide', name:'제비뽑기', desc:'내 쪽지만 열어보기', bg:'#FBE7E5', icon:'lots',
  long:'각자 자기 이름의 쪽지를 열어봐요. 당첨과 꽝은 링크를 만들 때 정해져서 바꿀 수 없어요.',
  defTitle:'벌칙 제비뽑기',
  fields:[
    {k:'names', type:'list', label:'참가자 (2~30명)', ph:'한 줄에 한 명', def:['민수','지연','현우','소희','대리님']},
    {k:'items', type:'list', label:'당첨 쪽지', ph:'한 줄에 하나', def:['당첨'], help:'나머지 쪽지는 모두 "꽝"이 돼요'}
  ],
  build(v){ const names=needNames(v.names,2,30); const items=v.items.slice(0,names.length); if(!items.length) throw '당첨 쪽지를 1개 이상 넣어 주세요'; return {names, items}; },
  promo:{t:'행사장 추첨은 대형화면으로', d:'참가자가 직접 뽑는 럭키 경품 추첨기, 오늘의 행운뽑기 키오스크'},
  render(ctx){
    const {names, items}=ctx.room.d; const r=NL.rng(ctx.room.s);
    const pool = items.slice(); while(pool.length<names.length) pool.push('꽝'); const deal=NL.shuffle(pool, r);
    ctx.el.innerHTML=`<div class="stage"><p class="lead">자기 이름을 눌러 쪽지를 열어보세요.</p><div class="slip" id="sl">${names.map((nm,i)=>`<button type="button" data-i="${i}"><span>${E(nm)}</span><small>눌러서 열기</small></button>`).join('')}</div>
      <button class="btn sub" id="openall">모두 공개</button></div>`;
    const open = (i, quiet) => { const b=NL.$(`#sl [data-i="${i}"]`); if(b.classList.contains('open')) return; const v=deal[i]; b.classList.add('open'); if(v!=='꽝') b.classList.add('win'); b.innerHTML=`<span>${E(names[i])}</span><b style="font-size:18px">${E(v)}</b>`; if(!quiet){ NL.beep(v==='꽝'?300:880,.15); NL.vibrate(v==='꽝'?30:[60,40,60]); } };
    NL.$$('#sl button').forEach(b=>b.onclick=async()=>{ const i=+b.dataset.i; if(b.classList.contains('open')) return; if(await NL.confirm(`${names[i]}님 쪽지를 열까요?`, '한 번 열면 다시 접을 수 없어요.', '열기')) open(i); });
    NL.$('#openall').onclick = async()=>{ if(await NL.confirm('모든 쪽지를 공개할까요?','전원 결과가 한 번에 보여요.','모두 공개')) names.forEach((_,i)=>open(i,true)); };
  }
});

/* ---------- 순서 정하기 ---------- */
NL.reg({ id:'order', cat:'decide', name:'순서 정하기', desc:'발표·노래방·운전 순서', bg:'#ECEFE4', icon:'order',
  long:'참가자 순서를 랜덤으로 정해요. 링크를 연 모두가 같은 순서를 봅니다.',
  defTitle:'발표 순서',
  fields:[{k:'names', type:'list', label:'참가자 (2~40명)', ph:'한 줄에 한 명', def:['민수','지연','현우','소희']}],
  build(v){ return {names:needNames(v.names,2,40)}; },
  promo:{t:'행사 진행 순서도 화면으로', d:'무대·대기줄용 대형화면 프로그램과 포토부스 키오스크'},
  render(ctx){
    const ord=NL.shuffle(ctx.room.d.names, NL.rng(ctx.room.s));
    ctx.el.innerHTML=`<div class="stage"><button class="btn" id="go">순서 공개하기</button><ol class="list-ol" id="ls"></ol></div>`;
    NL.$('#go').onclick = async () => { NL.$('#go').hidden=true; const ls=NL.$('#ls');
      for(let i=0;i<ord.length;i++){ const li=document.createElement('li'); li.innerHTML=`<i>${i+1}</i><span>${E(ord[i])}</span>`; ls.appendChild(li); NL.beep(440+i*30,.06); await NL.sleep(ord.length>15?120:320); } };
  }
});

/* ---------- 팀 나누기 ---------- */
NL.reg({ id:'team', cat:'decide', name:'랜덤 팀·짝 편성', desc:'팀 나누기 편성표', bg:'#E3EEF9', icon:'team',
  long:'참가자를 원하는 팀 수로 고르게 나눠요. 2명씩 팀 수를 정하면 짝 편성이 됩니다.',
  defTitle:'족구 팀 나누기',
  fields:[
    {k:'names', type:'list', label:'참가자 (2~60명)', ph:'한 줄에 한 명', def:['민수','지연','현우','소희','대리님','과장님']},
    {k:'k', type:'number', label:'팀 수', def:2, min:2, max:20}
  ],
  build(v){ const names=needNames(v.names,2,60); const k=Math.floor(v.k); if(!(k>=2)) throw '팀 수는 2 이상이에요'; if(k>names.length) throw '팀 수가 사람 수보다 많아요'; if(k>20) throw '팀은 20개까지예요'; return {names,k}; },
  promo:{t:'팀 나눴으면 팀 대항전', d:'2인 동시 반응속도·탭 배틀 스크린 대결 키오스크로 워크숍·체육대회 진행'},
  render(ctx){
    const {names,k}=ctx.room.d; const sh=NL.shuffle(names, NL.rng(ctx.room.s)); const teams=[...Array(k)].map(()=>[]); sh.forEach((nm,i)=>teams[i%k].push(nm));
    ctx.el.innerHTML=`<div class="stage"><button class="btn" id="go">팀 공개하기</button><div class="teams" id="tm" hidden>${teams.map((t,i)=>`<div class="team" style="border-color:${COLORS[i%COLORS.length]}"><h3 style="color:${COLORS[i%COLORS.length]}">${i+1}팀 · ${t.length}명</h3>${t.map(nm=>`<span>${E(nm)}</span>`).join('')}</div>`).join('')}</div></div>`;
    NL.$('#go').onclick=()=>{ NL.$('#go').hidden=true; NL.$('#tm').hidden=false; NL.beep(660,.15); };
  }
});

/* ---------- 주사위 ---------- */
const PIPS = {1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
NL.reg({ id:'dice', cat:'decide', name:'주사위 굴리기', desc:'1~5개, 벌칙표 연결', bg:'#F1ECE0', icon:'dice',
  long:'각자 폰에서 주사위를 굴려요. 주사위 1개일 때 눈금별 벌칙을 정해둘 수 있어요.',
  defTitle:'주사위 한 판',
  fields:[
    {k:'cnt', type:'number', label:'주사위 개수', def:2, min:1, max:5},
    {k:'pen', type:'list', label:'눈금별 벌칙 (선택, 주사위 1개일 때)', ph:'1 나오면\n2 나오면\n…', def:[], help:'6줄까지. 비워두면 숫자만 나와요'}
  ],
  build(v){ const cnt=NL.clamp(Math.floor(v.cnt)||1,1,5); return {cnt, pen:v.pen.slice(0,6)}; },
  promo:{t:'대형화면 주사위 이벤트', d:'행사장 무대용 게임·추첨 키오스크 프로그램'},
  render(ctx){
    const {cnt,pen}=ctx.room.d;
    const die = v => `<div class="die">${[...Array(9)].map((_,i)=>`<i style="visibility:${PIPS[v].includes(i)?'visible':'hidden'}"></i>`).join('')}</div>`;
    ctx.el.innerHTML=`<div class="stage"><div class="dice" id="dc">${[...Array(cnt)].map(()=>die(1)).join('')}</div>
      <div class="hud"><div><small>합계</small><b id="sum">-</b></div><div><small>굴린 횟수</small><b id="rc">0</b></div></div>
      <p id="pv" class="lead" style="text-align:center;font-weight:700;color:#B68A36"></p><button class="btn" id="go">굴리기</button></div>`;
    let rc=0;
    NL.$('#go').onclick = async () => { const b=NL.$('#go'); b.disabled=true; const dc=NL.$('#dc');
      let vals=[]; for(let k=0;k<8;k++){ vals=[...Array(cnt)].map(()=>1+Math.floor(Math.random()*6)); dc.innerHTML=vals.map(die).join(''); NL.$$('.die',dc).forEach(d=>d.classList.add('roll')); NL.beep(300+k*40,.03,'square'); await NL.sleep(70); }
      rc++; NL.$('#rc').textContent=rc; NL.$('#sum').textContent=vals.reduce((a,c)=>a+c,0);
      NL.$('#pv').textContent = cnt===1 && pen[vals[0]-1] ? `${vals[0]} → ${pen[vals[0]-1]}` : '';
      NL.vibrate(40); b.disabled=false; };
  }
});

/* ---------- 폭탄 돌리기 ---------- */
NL.reg({ id:'bomb', cat:'decide', name:'폭탄 돌리기', desc:'폰 하나로 돌리다 펑', bg:'#E8E9EE', icon:'bomb',
  long:'한 폰을 옆 사람에게 넘기며 하는 게임이에요. 언제 터질지는 아무도 몰라요. 소리를 켜면 더 재밌어요.',
  defTitle:'폭탄 돌리기',
  fields:[
    {k:'names', type:'list', label:'참가자 (선택)', ph:'넣으면 차례가 표시돼요', def:['민수','지연','현우','소희']},
    {k:'max', type:'select', label:'최대 시간', def:'40', opts:[['20','짧게 (10~20초)'],['40','보통 (15~40초)'],['70','길게 (25~70초)']]}
  ],
  build(v){ return {names:NL.uniq(v.names).slice(0,20), max:+v.max||40}; },
  promo:{t:'단체 게임은 스크린 대결로', d:'2인 동시 반응속도·탭 배틀 키오스크, 워크숍·MT 패키지'},
  render(ctx){
    const {names,max}=ctx.room.d; let idx=0, t0=0, fuse=0, raf=0, beepAt=0, alive=false;
    ctx.el.innerHTML=`<div class="stage"><div class="bomb"><div class="ball" id="ball"></div><p class="holder" id="hd">${names.length?E(names[0]):'준비'}</p><p class="lead" id="hint">시작을 누르고 폰을 넘기세요</p></div>
      <button class="btn" id="go">시작</button><button class="btn gold" id="ps" hidden style="min-height:72px;font-size:20px">다음 사람에게 넘기기</button></div>`;
    const loop = () => { if(!alive) return; const el=performance.now()-t0; const left=fuse-el;
      const gap = Math.max(90, Math.min(700, left/6)); if(performance.now()>beepAt){ NL.beep(1000,.03,'square'); beepAt=performance.now()+gap; }
      if(left<=0){ alive=false; NL.$('#ball').classList.remove('tick'); NL.$('#ps').hidden=true; NL.$('#hint').innerHTML=''; NL.$('#hd').innerHTML=`<span class="boom">펑!</span><br>${names.length?E(names[idx])+' 걸렸다':'폭탄 터짐'}`;
        NL.beep(80,.6,'sawtooth'); NL.vibrate([300,100,300]); NL.$('#go').hidden=false; NL.$('#go').textContent='한 판 더'; return; }
      raf=requestAnimationFrame(loop); };
    NL._stop = () => { alive=false; cancelAnimationFrame(raf); };
    NL.$('#go').onclick = () => { const lo=max===20?10:max===40?15:25; fuse=(lo+Math.random()*(max-lo))*1000; t0=performance.now(); beepAt=0; alive=true;
      idx = names.length? Math.floor(Math.random()*names.length):0; NL.$('#hd').textContent = names.length?names[idx]:'폭탄을 넘기세요';
      NL.$('#hint').textContent='째깍째깍… 빨리 넘기세요'; NL.$('#ball').classList.add('tick'); NL.$('#go').hidden=true; NL.$('#ps').hidden=false; loop(); };
    NL.$('#ps').onclick = () => { if(!alive) return; if(names.length){ idx=(idx+1)%names.length; NL.$('#hd').textContent=names[idx]; } NL.vibrate(20); };
  }
});

/* ---------- 마니또 ---------- */
NL.reg({ id:'manito', cat:'decide', name:'마니또 뽑기', desc:'각자 비밀 마니또 확인', bg:'#FBE3E1', icon:'manito',
  long:'자기 이름을 누르면 내가 챙겨줄 마니또가 나와요. 다른 사람 이름은 누르지 않기로 약속해 주세요.',
  defTitle:'연말 마니또',
  fields:[{k:'names', type:'list', label:'참가자 (3~40명)', ph:'한 줄에 한 명', def:['민수','지연','현우','소희','대리님']}],
  build(v){ return {names:needNames(v.names,3,40)}; },
  promo:{t:'연말 행사엔 마니또 공개 이벤트', d:'행사장 대형화면·포토부스로 마니또 공개식을 진행해 보세요'},
  render(ctx){
    const {names}=ctx.room.d; const r=NL.rng(ctx.room.s); let p;
    for(let t=0;t<200;t++){ p=NL.shuffle(names.map((_,i)=>i), r); if(p.every((v,i)=>v!==i)) break; }
    if(p.some((v,i)=>v===i)){ p=names.map((_,i)=>(i+1)%names.length); }
    ctx.el.innerHTML=`<div class="stage"><p class="lead">내 이름을 눌러 마니또를 확인하세요. 화면은 나만 보세요.</p><div class="slip" id="sl">${names.map((nm,i)=>`<button type="button" data-i="${i}"><span>${E(nm)}</span><small>나예요</small></button>`).join('')}</div></div>`;
    NL.$$('#sl button').forEach(b=>b.onclick=async()=>{ const i=+b.dataset.i;
      if(!await NL.confirm(`${names[i]}님 맞나요?`,'본인 것만 확인해 주세요. 다른 사람 걸 보면 재미가 없어요.','네, 저예요')) return;
      const ov=document.createElement('div'); ov.className='ov'; ov.innerHTML=`<div class="ov-c"><p class="lead">${E(names[i])}님의 마니또는</p><h3 style="font-size:34px;color:#B68A36">${E(names[p[i]])}</h3><p class="lead">들키지 않게 잘 챙겨주세요</p><button class="btn">확인하고 가리기</button></div>`;
      document.body.appendChild(ov); NL.beep(880,.2); NL.$('button',ov).onclick=()=>ov.remove(); });
  }
});
})();
