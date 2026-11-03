/* 게임: 혼자 도전 → 이 링크 기준 순위 → 내 기록 더한 새 링크(기록 이어달리기) */
(function(){
'use strict';
const E = NL.esc;
const now = () => performance.now();

NL.arcade = def => NL.reg(Object.assign({ cat:'arcade', defTitle: def.name+' 도전방',
  long: def.desc + '. 각자 도전하고 내 기록을 더한 링크를 방에 올리면 순위가 이어집니다.',
  fields:[],
  inviteMsg: r => `[${r.ti}] ${def.name} 누가 제일 잘하나. 링크 누르고 바로 도전!`,
  render(ctx){ lobby(ctx); }
}, def));

function lobby(ctx, last){
  const t=ctx.tool, r=ctx.room;
  ctx.el.innerHTML = `<div class="stage"><div class="howto"><p class="big">${E(t.howto)}</p><button class="btn" id="go">도전하기</button></div></div>
    <div class="stage"><div class="hud"><div><small>이 링크 순위</small><b>${(r.b||[]).length}명 도전</b></div><div><small>${t.better==='high'?'높을수록':'낮을수록'} 좋아요</small><b style="font-size:16px">${E(t.unit||'')}</b></div></div>
    ${NL.boardHTML(t, r, NL.myName())}<p class="note">이 링크에 담긴 순위예요. 도전한 뒤 받은 새 링크를 방에 올리면 다음 사람이 이어서 도전해요.</p><div id="mg"></div></div>`;
  NL.mergeUI(NL.$('#mg'), t, r, nr=>{ ctx.room=nr; lobby(ctx); });
  NL.$('#go').onclick = () => play(ctx);
}

async function play(ctx){
  const t=ctx.tool;
  ctx.el.innerHTML = `<div class="stage"><div class="hud"><div><small>${E(t.hudL||'점수')}</small><b id="hl">0</b></div><div><small>${E(t.hudR||'시간')}</small><b id="hr">-</b></div></div><div class="play" id="pa"></div></div>`;
  const pa=NL.$('#pa');
  const api = { el:pa, room:ctx.room, d:ctx.room.d||{}, L:v=>NL.$('#hl')&&(NL.$('#hl').textContent=v), R:v=>NL.$('#hr')&&(NL.$('#hr').textContent=v), alive:true };
  NL._stop = () => { api.alive=false; api.cleanup && api.cleanup(); };
  if(t.prep) t.prep(api);
  if(!t.noCount) await NL.countdown();
  if(!api.alive) return;
  const res = await t.game(api);
  NL._stop = null;
  if(!api.alive || !res) return;
  result(ctx, res);
}

function result(ctx, res){
  const t=ctx.tool, r=ctx.room; const me=NL.myName();
  const board = NL.mergeBoard(t, [r.b||[], [{n:'\u0000나', v:res.v}]]); const rank = board.findIndex(e=>e.n==='\u0000나')+1;
  const prev = me ? (r.b||[]).find(e=>e.n===me) : null;
  const isBest = !prev || (t.better==='high'? res.v>prev.v : res.v<prev.v);
  NL.beep(rank===1?990:660,.25); NL.vibrate(rank===1?[80,50,80]:50);
  ctx.el.innerHTML = `<div class="stage"><div class="result-big"><small>내 기록</small><b>${E(t.fmt(res.v,res))}</b><span>이 링크 순위 ${rank}위 / ${board.length}명${prev&&!isBest?` · 내 최고 기록은 ${E(t.fmt(prev.v,prev))}`:''}</span>${res.note?`<p class="lead">${E(res.note)}</p>`:''}</div>
    <button class="btn" id="up">기록 올리고 새 링크 받기</button><button class="btn sub" id="re">다시 도전</button><div id="after"></div></div>
    <div class="stage">${NL.boardHTML(t, r, me)}</div>`;
  NL.$('#re').onclick = () => play(ctx);
  NL.$('#up').onclick = async () => {
    const name = await NL.askName('순위에 올릴 이름'); if(!name) return;
    const nr = NL.withEntry(t, r, {n:name, v:res.v, at:Date.now()});
    const pos = nr.b.findIndex(e=>e.n===name)+1;
    NL.$('#up').hidden=true;
    await ctx.shareRoom(NL.$('#after'), nr, `[${nr.ti}] ${name} ${t.fmt(res.v,res)}로 ${pos}위! ${t.name} 깨볼 사람?`, `${pos}위로 올라갔어요. 새 링크를 방에 올려주세요`);
    ctx.room = nr; NL.$('#after').scrollIntoView({behavior:'smooth',block:'center'});
  };
}

const sec = ms => (ms/1000).toFixed(2)+'초';
const timerLoop = (api, ms, onTick) => new Promise(ok => { const t0=now(); const f=()=>{ if(!api.alive) return ok(false); const left=ms-(now()-t0); api.R((Math.max(0,left)/1000).toFixed(1)); onTick&&onTick(left); if(left<=0) return ok(true); requestAnimationFrame(f); }; f(); });

/* ---------- 두더지 잡기 ---------- */
NL.arcade({ id:'mole', name:'두더지 잡기', desc:'30초 동안 두더지 터치', bg:'#EFE6D8', icon:'mole', better:'high', unit:'점',
  howto:'튀어나온 두더지를 눌러요. 금색은 3점! 30초.', hudL:'점수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'두더지 잡기, 행사장 순위전으로', d:'대형 터치 화면 게임 키오스크 · 1등 경품 이벤트 운영'},
  game(api){
    api.el.innerHTML=`<div class="mole">${[...Array(9)].map((_,i)=>`<button class="hole" data-i="${i}" aria-label="구멍 ${i+1}"><span class="m"><i></i></span></button>`).join('')}</div>`;
    let score=0; const holes=NL.$$('.hole',api.el); const state=holes.map(()=>null);
    holes.forEach((h,i)=>h.onpointerdown=e=>{ e.preventDefault(); const s=state[i]; if(!s||s.hit) return; s.hit=true; score+=s.gold?3:1; api.L(score); h.classList.add('hit'); NL.beep(s.gold?1200:800,.05); NL.vibrate(15); setTimeout(()=>{h.classList.remove('up','gold','hit'); state[i]=null;},120); });
    let nextAt=0; const t0=now();
    return timerLoop(api, 30000, left=>{ const el=now()-t0;
      holes.forEach((h,i)=>{ const s=state[i]; if(s && !s.hit && now()>s.until){ h.classList.remove('up','gold'); state[i]=null; } });
      if(now()>nextAt){ const free=state.map((s,i)=>s?null:i).filter(x=>x!=null); if(free.length){ const i=free[Math.floor(Math.random()*free.length)]; const gold=Math.random()<.12; const stay=Math.max(480, 1000-el/40);
        state[i]={until:now()+stay, gold}; holes[i].classList.add('up'); gold&&holes[i].classList.add('gold'); }
        nextAt=now()+Math.max(260, 700-el/60); } }).then(ok=>ok&&{v:score}); }
});

/* ---------- 7초를 맞춰라 ---------- */
NL.arcade({ id:'seven', name:'7초를 맞춰라', desc:'눈 감고 7초에 멈추기 (7.777초 모드)', bg:'#F3E7CC', icon:'seven', better:'low', unit:'오차', noCount:true,
  howto:'시작을 누르고 마음속으로 목표 시간을 센 뒤 멈춤! 3초 후엔 시계가 가려져요.', hudL:'목표', hudR:'기회', fmt:(v,e)=>`오차 ${(v/1000).toFixed(3)}초`,
  fields:[{k:'target', type:'select', label:'목표 시간', def:'7000', opts:[['7000','7.000초'],['7777','7.777초 (키오스크 룰)'],['10000','10.000초'],['3000','3.000초']]}],
  build(v){ return {target:+v.target||7000}; },
  promo:{t:'원조는 키오스크 "7초를 잡아라"', d:'행사장 인기 1위 게임. 목표 7.777초 맞히면 경품 지급 이벤트'},
  game(api){ const TG=(api.d&&api.d.target)||7000; api.L((TG/1000).toFixed(3)+'초'); api.R('1번');
    api.el.innerHTML=`<div class="seven"><div class="clock num" id="ck">0.000</div><button class="btn" id="bt" style="min-height:96px;font-size:24px">시작</button></div>`;
    return new Promise(ok=>{ let t0=0, raf=0, run=false; const ck=NL.$('#ck',api.el), bt=NL.$('#bt',api.el);
      const f=()=>{ if(!run||!api.alive) return; const el=(now()-t0)/1000; if(el<3){ ck.textContent=el.toFixed(3); } else { ck.textContent='?.???'; ck.classList.add('hide'); } raf=requestAnimationFrame(f); };
      api.cleanup=()=>cancelAnimationFrame(raf);
      bt.onpointerdown=e=>{ e.preventDefault(); if(!run){ run=true; t0=now(); bt.textContent='멈춤'; bt.classList.add('gold'); NL.beep(660,.08); f(); }
        else { run=false; const el=now()-t0; ck.classList.remove('hide'); ck.textContent=(el/1000).toFixed(3); bt.disabled=true; NL.beep(990,.15); setTimeout(()=>ok({v:Math.round(Math.abs(el-TG)), x:Math.round(el), note:`${(el/1000).toFixed(3)}초에 멈췄어요`}), 900); } }; }); }
});

/* ---------- 반응속도 ---------- */
NL.arcade({ id:'reaction', name:'반응속도 대회', desc:'초록으로 바뀌는 순간 터치', bg:'#E3EEF9', icon:'reaction', better:'low', unit:'ms', noCount:true,
  howto:'빨간 화면이 초록으로 바뀌면 바로 터치! 5번 평균. 미리 누르면 다시 해요.', hudL:'회차', hudR:'평균', fmt:v=>v+'ms',
  promo:{t:'반응속도 1:1 대결은 스크린 배틀로', d:'2인 동시 반응속도·탭 배틀 키오스크, 행사장 줄 서는 게임'},
  game(api){ api.L('1/5');
    api.el.innerHTML=`<button class="react idle" id="rz">눌러서 시작</button>`;
    return new Promise(ok=>{ const rz=NL.$('#rz',api.el); let st='idle', goAt=0, to=0; const rec=[];
      api.cleanup=()=>clearTimeout(to);
      const arm=()=>{ st='wait'; rz.className='react wait'; rz.textContent='기다려…'; to=setTimeout(()=>{ if(!api.alive) return; st='go'; goAt=now(); rz.className='react go'; rz.textContent='지금!'; }, 1200+Math.random()*2800); };
      rz.onpointerdown=e=>{ e.preventDefault();
        if(st==='idle'||st==='done') return arm();
        if(st==='wait'){ clearTimeout(to); st='idle'; rz.className='react idle'; rz.innerHTML='너무 빨랐어요!<br>눌러서 다시'; NL.beep(200,.2); NL.vibrate(80); return; }
        if(st==='go'){ const ms=Math.round(now()-goAt); rec.push(ms); NL.beep(880,.06); api.L(`${Math.min(rec.length+1,5)}/5`); api.R(Math.round(rec.reduce((a,c)=>a+c,0)/rec.length)+'ms');
          if(rec.length>=5){ st='end'; rz.className='react idle'; rz.textContent=`${ms}ms`; const avg=Math.round(rec.reduce((a,c)=>a+c,0)/5); setTimeout(()=>ok({v:avg, note:`기록: ${rec.join(' · ')}ms`}),700); }
          else { st='done'; rz.className='react idle'; rz.innerHTML=`${ms}ms<br><small style="font-size:16px">눌러서 다음</small>`; } } }; }); }
});

/* ---------- 10초 연타 ---------- */
NL.arcade({ id:'tap10', name:'10초 연타왕', desc:'10초 동안 최대한 많이', bg:'#F1ECE0', icon:'tap', better:'high', unit:'회',
  howto:'10초 동안 버튼을 최대한 빨리 누르세요. 손가락 여러 개도 OK.', hudL:'터치', hudR:'남은 시간', fmt:v=>v+'회',
  promo:{t:'탭 배틀, 행사장 2인 대결로', d:'스크린 대결 배틀 키오스크 · 팀 대항전 진행'},
  game(api){ api.el.innerHTML=`<button class="tapzone" id="tz">연타!</button>`; let n=0; const tz=NL.$('#tz',api.el);
    tz.onpointerdown=e=>{ e.preventDefault(); n++; api.L(n); tz.textContent=n; if(n%5===0) NL.beep(500+n*3,.02,'square'); };
    return timerLoop(api,10000).then(ok=>{ tz.disabled=true; return ok&&{v:n, note:`초당 ${(n/10).toFixed(1)}회`}; }); }
});

/* ---------- 1 to 25 ---------- */
NL.arcade({ id:'n25', name:'1 to 25', desc:'숫자 순서대로 빨리 누르기', bg:'#E7EDF8', icon:'n25', better:'low', unit:'초',
  howto:'1부터 25까지 순서대로 누르세요. 틀리면 +1초.', hudL:'다음 숫자', hudR:'시간', fmt:v=>sec(v),
  promo:{t:'두뇌 게임 키오스크', d:'IQ 퍼즐 챌린지·순서 기억 등 체류 시간 긴 게임 프로그램'},
  game(api){ const nums=NL.shuffle([...Array(25)].map((_,i)=>i+1), Math.random);
    api.el.innerHTML=`<div class="g25">${nums.map(v=>`<button data-v="${v}">${v}</button>`).join('')}</div>`; let next=1, pen=0; const t0=now(); let raf=0; api.L(1);
    const f=()=>{ if(!api.alive) return; api.R(((now()-t0+pen)/1000).toFixed(1)); raf=requestAnimationFrame(f); }; f(); api.cleanup=()=>cancelAnimationFrame(raf);
    return new Promise(ok=>{ NL.$$('button',api.el).forEach(b=>b.onpointerdown=e=>{ e.preventDefault(); const v=+b.dataset.v; if(b.classList.contains('done')) return;
      if(v===next){ b.classList.add('done'); NL.beep(400+v*20,.04); next++; api.L(next>25?'끝':next); if(next>25){ cancelAnimationFrame(raf); const ms=Math.round(now()-t0+pen); ok({v:ms, note:pen?`틀린 벌점 ${pen/1000}초 포함`:''}); } }
      else { pen+=1000; b.classList.add('bad'); NL.vibrate(60); NL.beep(180,.12); setTimeout(()=>b.classList.remove('bad'),250); } }); }); }
});

/* ---------- 풍선 터뜨리기 ---------- */
NL.arcade({ id:'balloon', name:'풍선 터뜨리기', desc:'풍선 팡팡, 폭탄은 피하기', bg:'#FBE3E1', icon:'balloon', better:'high', unit:'점',
  howto:'올라오는 풍선을 터뜨리세요. 검은 폭탄 풍선은 -3점. 30초.', hudL:'점수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'키즈 행사엔 풍선 게임 키오스크', d:'아이들이 줄 서는 키즈 게임·동화 키오스크'},
  game(api){ api.el.innerHTML=`<div class="sky" id="sk"></div>`; const sk=NL.$('#sk',api.el); let score=0, nextAt=0; const bs=new Set(); const t0=now(); const cols=['#E2574C','#3B7DD8','#2E9E6B','#E8B230','#8A5CD0','#E07A3A'];
    const W=()=>sk.clientWidth, H=()=>sk.clientHeight;
    return timerLoop(api,30000,()=>{ const el=now()-t0;
      if(now()>nextAt){ const b=document.createElement('button'); b.className='bl'; const bomb=Math.random()<.16; if(bomb) b.classList.add('bomb2'); else b.style.background=cols[Math.floor(Math.random()*cols.length)];
        const o={el:b, x:Math.random()*(W()-60), y:H()+10, v:(.9+Math.random()*.8+el/22000)*(H()/420)*2.2, bomb}; b.style.left=o.x+'px';
        b.onpointerdown=e=>{ e.preventDefault(); if(o.dead) return; o.dead=true; score+=o.bomb?-3:1; api.L(score); NL.beep(o.bomb?150:700+Math.random()*300,.06); NL.vibrate(o.bomb?80:10); b.style.transform='scale(1.4)'; b.style.opacity='0'; b.style.transition='all .12s'; setTimeout(()=>{b.remove(); bs.delete(o);},130); };
        sk.appendChild(b); bs.add(o); nextAt=now()+Math.max(230, 650-el/70); }
      bs.forEach(o=>{ if(o.dead) return; o.y-=o.v; o.el.style.top=o.y+'px'; if(o.y<-90){ o.el.remove(); bs.delete(o); } });
    }).then(ok=>{ bs.forEach(o=>o.el.remove()); return ok&&{v:score}; }); }
});

/* ---------- 카드 짝 맞추기 ---------- */
const SHAPES = [
  '<circle cx="20" cy="20" r="13" fill="#E2574C"/>','<rect x="7" y="7" width="26" height="26" rx="4" fill="#3B7DD8"/>','<path d="M20 5l15 28H5z" fill="#2E9E6B"/>',
  '<path d="M20 4l4.7 10.3 11.3 1.2-8.5 7.6 2.4 11.1L20 28.5l-9.9 5.7 2.4-11.1-8.5-7.6 11.3-1.2z" fill="#E8B230"/>','<path d="M20 34S5 25 5 14a7.5 7.5 0 0 1 15-2 7.5 7.5 0 0 1 15 2c0 11-15 20-15 20z" fill="#C2457A"/>',
  '<path d="M20 4l16 16-16 16L4 20z" fill="#8A5CD0"/>','<path d="M15 5h10v10h10v10H25v10H15V25H5V15h10z" fill="#E07A3A"/>','<path d="M27 6a14 14 0 1 0 7 19 11 11 0 1 1-7-19z" fill="#172742"/>'];
NL.arcade({ id:'memory', name:'카드 짝 맞추기', desc:'같은 그림 짝 최단 시간', bg:'#EFE4FF', icon:'memory', better:'low', unit:'초', noCount:false,
  howto:'카드를 두 장씩 뒤집어 같은 그림을 찾으세요. 8쌍 모두 찾으면 끝!', hudL:'찾은 짝', hudR:'시간', fmt:v=>sec(v),
  promo:{t:'원조는 키오스크 미니게임 모음', d:'카드 뒤집기·순서 기억 등 미니게임 키오스크, 매장 대기 시간 해결'},
  game(api){ const deck=NL.shuffle([...Array(16)].map((_,i)=>i%8), Math.random);
    api.el.innerHTML=`<div class="cards">${deck.map((s,i)=>`<button class="mc" data-i="${i}" aria-label="카드"><svg viewBox="0 0 40 40">${SHAPES[s]}</svg></button>`).join('')}</div>`;
    const t0=now(); let raf=0, open=[], found=0, moves=0, lock=false; api.L('0/8');
    const f=()=>{ if(!api.alive) return; api.R(((now()-t0)/1000).toFixed(1)); raf=requestAnimationFrame(f); }; f(); api.cleanup=()=>cancelAnimationFrame(raf);
    return new Promise(ok=>{ NL.$$('.mc',api.el).forEach(b=>b.onpointerdown=e=>{ e.preventDefault(); if(lock||b.classList.contains('f')||b.classList.contains('ok')) return;
      b.classList.add('f'); open.push(b); NL.beep(500,.03);
      if(open.length===2){ moves++; const [a,c]=open; open=[];
        if(deck[a.dataset.i]===deck[c.dataset.i]){ a.classList.replace('f','ok'); c.classList.replace('f','ok'); found++; api.L(found+'/8'); NL.beep(880,.08);
          if(found===8){ cancelAnimationFrame(raf); ok({v:Math.round(now()-t0), note:`${moves}번 뒤집어서 완성`}); } }
        else { lock=true; setTimeout(()=>{ a.classList.remove('f'); c.classList.remove('f'); lock=false; },650); } } }); }); }
});

/* ---------- 순서 기억 ---------- */
NL.arcade({ id:'simon', name:'순서 기억 챌린지', desc:'깜빡이는 순서 따라 누르기', bg:'#E2F3EC', icon:'simon', better:'high', unit:'단계',
  howto:'불이 켜지는 순서를 기억해서 똑같이 누르세요. 단계마다 하나씩 늘어나요.', hudL:'단계', hudR:'상태', fmt:v=>v+'단계',
  promo:{t:'순서 기억은 키오스크 미니게임에도', d:'미니게임 모음 키오스크 · 행사장 대기줄 체류 시간 UP'},
  game(api){ const C=['#E2574C','#3B7DD8','#E8B230','#2E9E6B'], F=[330,440,550,660];
    api.el.innerHTML=`<div class="simon">${C.map((c,i)=>`<button data-i="${i}" style="background:${c}" aria-label="색 ${i+1}"></button>`).join('')}</div>`;
    const pads=NL.$$('button',api.el); const seq=[]; let pos=0, input=false;
    const lit=async(i,ms)=>{ pads[i].classList.add('lit'); NL.beep(F[i],ms/1000*.9); await NL.sleep(ms); pads[i].classList.remove('lit'); };
    return new Promise(ok=>{
      const next=async()=>{ if(!api.alive) return; seq.push(Math.floor(Math.random()*4)); api.L(seq.length); api.R('잘 보세요'); input=false; await NL.sleep(500);
        const sp=Math.max(220, 520-seq.length*25); for(const i of seq){ if(!api.alive) return; await lit(i,sp); await NL.sleep(110); } pos=0; input=true; api.R('따라 누르기'); };
      pads.forEach(p=>p.onpointerdown=async e=>{ e.preventDefault(); if(!input) return; const i=+p.dataset.i; lit(i,160);
        if(i!==seq[pos]){ input=false; api.R('틀렸어요'); NL.vibrate(150); NL.beep(140,.4,'sawtooth'); return setTimeout(()=>ok({v:seq.length-1}),700); }
        pos++; if(pos===seq.length){ input=false; api.R('성공!'); setTimeout(next,450); } });
      next(); }); }
});

/* ---------- 색깔 헷갈리기 ---------- */
const CN=[['빨강','#E2574C'],['파랑','#3B7DD8'],['초록','#2E9E6B'],['노랑','#E8B230']];
NL.arcade({ id:'stroop', name:'색깔 헷갈리기', desc:'글자 말고 색으로 답하기', bg:'#E7EDF8', icon:'stroop', better:'high', unit:'점',
  howto:'글자의 뜻이 아니라 "글자 색"을 고르세요. 맞으면 +1, 틀리면 -1. 30초.', hudL:'점수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'두뇌 게임은 IQ 퍼즐 챌린지로', d:'IQ 퍼즐 챌린지·심리 검사 등 결과 카드 주는 키오스크'},
  game(api){ api.el.innerHTML=`<div class="word" id="wd"></div><div class="choices">${CN.map((c,i)=>`<button data-i="${i}">${c[0]}</button>`).join('')}</div>`;
    let score=0, cur=0; const wd=NL.$('#wd',api.el);
    const nxt=()=>{ const w=Math.floor(Math.random()*4); let c=Math.floor(Math.random()*4); if(Math.random()<.75) while(c===w) c=Math.floor(Math.random()*4); cur=c; wd.textContent=CN[w][0]; wd.style.color=CN[c][1]; };
    nxt(); NL.$$('.choices button',api.el).forEach(b=>b.onpointerdown=e=>{ e.preventDefault(); const ok=+b.dataset.i===cur; score+=ok?1:-1; api.L(score); api.el.classList.remove('flash-ok','flash-bad'); void api.el.offsetWidth; api.el.classList.add(ok?'flash-ok':'flash-bad'); NL.beep(ok?800:180,.05); if(!ok) NL.vibrate(40); nxt(); });
    return timerLoop(api,30000).then(ok=>ok&&{v:score}); }
});

/* ---------- 암산 스피드 ---------- */
NL.arcade({ id:'math', name:'암산 스피드', desc:'60초 계산 문제 연속', bg:'#ECEFE4', icon:'math', better:'high', unit:'점',
  howto:'계산 답을 4개 중에서 고르세요. 맞으면 +1, 틀리면 -1. 갈수록 어려워져요. 60초.', hudL:'점수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'두뇌 게임 키오스크', d:'IQ 퍼즐·받아쓰기·영어 단어 퀴즈 등 교육형 키오스크 프로그램'},
  game(api){ api.el.innerHTML=`<div class="word num" id="wd" style="font-size:46px;color:#172742"></div><div class="choices" id="ch"></div>`;
    let score=0, lv=0; const wd=NL.$('#wd',api.el), ch=NL.$('#ch',api.el);
    const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
    const nxt=()=>{ lv++; let a,b,op,ans; const t=Math.random(); const hard=lv>8;
      if(t<.35){ a=R(2,hard?99:30); b=R(2,hard?99:30); op='+'; ans=a+b; } else if(t<.65){ a=R(10,hard?150:50); b=R(1,a); op='−'; ans=a-b; }
      else if(t<.9){ a=R(2,hard?19:9); b=R(2,9); op='×'; ans=a*b; } else { b=R(2,9); ans=R(2,hard?15:9); a=b*ans; op='÷'; }
      wd.textContent=`${a} ${op} ${b}`; const set=new Set([ans]); while(set.size<4){ const d=ans+R(-10,10); if(d>=0&&d!==ans) set.add(d); }
      const opts=NL.shuffle([...set], Math.random); ch.innerHTML=opts.map(v=>`<button class="num" data-v="${v}">${v}</button>`).join('');
      NL.$$('button',ch).forEach(bt=>bt.onpointerdown=e=>{ e.preventDefault(); const ok=+bt.dataset.v===ans; score+=ok?1:-1; api.L(score); NL.beep(ok?800:180,.05); if(!ok) NL.vibrate(40); api.el.classList.remove('flash-ok','flash-bad'); void api.el.offsetWidth; api.el.classList.add(ok?'flash-ok':'flash-bad'); nxt(); }); };
    nxt(); return timerLoop(api,60000).then(ok=>ok&&{v:score}); }
});
})();
