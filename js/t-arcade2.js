/* 게임 2차: 블록 쌓기·벽돌깨기·다른 그림 찾기·컵 속 공·병뚜껑 컬링·무궁화꽃·박수 리듬·선 따라가기·콩 옮기기·삼겹살·칼퇴런·계산대·숫자 퍼즐 */
(function(){
'use strict';
const now = () => performance.now();
const R = (a,b) => a + Math.random()*(b-a);
const RI = (a,b) => Math.floor(R(a,b+1));
/* 캔버스 준비: 논리 크기 W×H, 화면 폭에 맞춰 선명하게 */
function canvasIn(el, W, H){ el.innerHTML=`<canvas class="cv" style="aspect-ratio:${W}/${H};touch-action:none;background:#FDFCF9"></canvas>`;
  const cv=el.firstChild, dpr=Math.min(2, window.devicePixelRatio||1); cv.width=W*dpr; cv.height=H*dpr; const g=cv.getContext('2d'); g.scale(dpr,dpr);
  const pt = e => { const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*W/r.width, y:(e.clientY-r.top)*H/r.height}; };
  return {cv,g,pt,W,H}; }
const loop = (api, fn) => new Promise(ok => { let last=now(); const f=()=>{ if(!api.alive) return ok(null); const t=now(), dt=Math.min(50,t-last); last=t; const r=fn(dt,t); if(r!==undefined) return ok(r); requestAnimationFrame(f); }; requestAnimationFrame(f); });
const timeFmt = ms => (ms/1000).toFixed(2)+'초';
const finishFmt = v => v>1000 ? `완주 ${((10000-v)/100).toFixed(2)}초` : `${v}% 진행`;

/* ---------- 블록 쌓기 ---------- */
NL.arcade({ id:'stack', name:'블록 쌓기', desc:'타이밍 맞춰 높이 쌓기', bg:'#E3EEF9', glyph:'▤', better:'high', unit:'층', noCount:true,
  howto:'움직이는 블록이 아래 블록과 겹칠 때 화면을 누르세요. 삐져나간 부분은 잘려요.', hudL:'층수', hudR:'완벽', fmt:v=>v+'층',
  promo:{t:'블록 쌓기, 행사장 최고층 순위전', d:'대형 터치 화면 게임 키오스크 · 순위판과 경품 이벤트'},
  game(api){ const c=canvasIn(api.el,360,520), g=c.g; const BH=26; const cols=['#172742','#24395e','#3B7DD8','#2E9E6B','#E8B230','#E07A3A','#E2574C','#8A5CD0'];
    let stack=[{x:80,w:200}], cur={x:0,w:200,dir:1}, speed=2.2, cam=0, perfect=0, over=false;
    const draw=()=>{ g.clearRect(0,0,360,520); const base=490; const target=Math.max(0,(stack.length-12)*BH); cam+=(target-cam)*.12;
      stack.forEach((b,i)=>{ g.fillStyle=cols[i%cols.length]; g.fillRect(b.x, base-i*BH+cam, b.w, BH-2); });
      if(!over){ g.fillStyle=cols[stack.length%cols.length]; g.fillRect(cur.x, base-stack.length*BH+cam, cur.w, BH-2); } };
    const drop=()=>{ if(over) return; const top=stack[stack.length-1]; const l=Math.max(top.x,cur.x), r=Math.min(top.x+top.w, cur.x+cur.w); const w=r-l;
      if(w<=0){ over=true; NL.beep(150,.4,'sawtooth'); NL.vibrate(120); return; }
      if(Math.abs(cur.x-top.x)<4){ stack.push({x:top.x,w:top.w}); perfect++; NL.beep(1100,.08); api.R(perfect); } else { stack.push({x:l,w}); NL.beep(500+stack.length*12,.05); }
      api.L(stack.length-1); const nw=stack[stack.length-1].w; cur={x:stack.length%2?-nw:360, w:nw, dir:stack.length%2?1:-1}; speed=Math.min(6.5, 2.2+stack.length*.12); };
    c.cv.onpointerdown=e=>{ e.preventDefault(); drop(); }; api.L(0); api.R(0);
    return loop(api,(dt)=>{ if(over){ draw(); return {v:stack.length-1, note:perfect?`완벽하게 쌓은 층 ${perfect}개`:''}; }
      cur.x+=cur.dir*speed*dt/16; if(cur.x>360-cur.w*.2) cur.dir=-1; if(cur.x<-cur.w*.8) cur.dir=1; draw(); }); }
});

/* ---------- 벽돌깨기 ---------- */
NL.arcade({ id:'breakout', name:'벽돌깨기', desc:'공 튕겨 벽돌 깨기', bg:'#FBE7E5', glyph:'▦', better:'high', unit:'점',
  howto:'화면을 좌우로 밀어 받침대를 움직이세요. 공을 놓치면 끝, 60초.', hudL:'점수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'레트로 게임 키오스크', d:'벽돌깨기·두더지 등 아케이드 게임을 행사장 대형화면으로'},
  game(api){ const c=canvasIn(api.el,360,520), g=c.g; const cols=['#E2574C','#E07A3A','#E8B230','#2E9E6B','#3B7DD8'];
    let pad={x:140,w:80}, ball={x:180,y:400,vx:2.6,vy:-3.6}, score=0, bricks=[], level=1; const t0=now();
    const mk=()=>{ bricks=[]; for(let r=0;r<5;r++) for(let i=0;i<7;i++) bricks.push({x:8+i*50,y:50+r*24,w:46,h:20,c:cols[r],on:true}); };
    mk(); const mv=e=>{ e.preventDefault(); pad.x=NL.clamp(c.pt(e).x-pad.w/2,0,360-pad.w); }; c.cv.onpointerdown=mv; c.cv.onpointermove=mv; api.L(0);
    return loop(api,(dt)=>{ const k=dt/16, left=60000-(now()-t0); api.R((Math.max(0,left)/1000).toFixed(1));
      ball.x+=ball.vx*k; ball.y+=ball.vy*k;
      if(ball.x<7||ball.x>353){ ball.vx*=-1; ball.x=NL.clamp(ball.x,7,353); } if(ball.y<7){ ball.vy=Math.abs(ball.vy); }
      if(ball.y>478 && ball.y<492 && ball.x>pad.x-6 && ball.x<pad.x+pad.w+6 && ball.vy>0){ const h=(ball.x-(pad.x+pad.w/2))/(pad.w/2); const sp=Math.hypot(ball.vx,ball.vy); ball.vx=sp*h*.85; ball.vy=-Math.sqrt(Math.max(1,sp*sp-ball.vx*ball.vx)); NL.beep(440,.03); }
      for(const b of bricks){ if(b.on && ball.x>b.x-6 && ball.x<b.x+b.w+6 && ball.y>b.y-6 && ball.y<b.y+b.h+6){ b.on=false; score+=level; api.L(score); ball.vy*=-1; NL.beep(700+Math.random()*300,.03,'square'); break; } }
      if(bricks.every(b=>!b.on)){ level++; mk(); ball.vx*=1.15; ball.vy*=1.15; }
      g.clearRect(0,0,360,520); bricks.forEach(b=>{ if(b.on){ g.fillStyle=b.c; g.fillRect(b.x,b.y,b.w,b.h); } });
      g.fillStyle='#172742'; g.fillRect(pad.x,482,pad.w,12); g.beginPath(); g.arc(ball.x,ball.y,7,0,7); g.fillStyle='#B68A36'; g.fill();
      if(ball.y>530){ NL.beep(150,.4,'sawtooth'); NL.vibrate(120); return {v:score, note:'공을 놓쳤어요'}; }
      if(left<=0) return {v:score}; }); }
});

/* ---------- 다른 그림 찾기 ---------- */
NL.arcade({ id:'spot', name:'다른 그림 찾기', desc:'두 그림의 차이 5개 찾기', bg:'#EFE4FF', glyph:'≠', better:'high', unit:'점',
  howto:'위·아래 그림에서 다른 곳 5개를 아래 그림에서 눌러 찾으세요. 60초. 빨리 찾을수록 점수가 높아요.', hudL:'찾은 개수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'다른 그림 찾기, 브랜드 버전으로 납품', d:'매장·브랜드 이미지로 만든 맞춤 게임 키오스크'},
  game(api){ const W=340,H=230; api.el.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px"><canvas class="cv" id="sa" style="aspect-ratio:${W}/${H}"></canvas><canvas class="cv" id="sb" style="aspect-ratio:${W}/${H};touch-action:none"></canvas></div>`;
    const cols=['#E2574C','#3B7DD8','#2E9E6B','#E8B230','#8A5CD0','#E07A3A','#172742','#2BA3B5'];
    const sh=[...Array(18)].map(()=>({t:RI(0,2),x:R(24,W-24),y:R(24,H-24),s:R(12,26),c:cols[RI(0,7)],r:R(0,6.28)}));
    const B=sh.map(o=>Object.assign({},o)); const idx=NL.pickN(sh.map((_,i)=>i),5); const diffs=[];
    idx.forEach((i,k)=>{ const o=B[i]; const m=k%4; if(m===0) o.c=cols[(cols.indexOf(o.c)+3)%8]; else if(m===1) o.hide=true; else if(m===2) o.s*=1.6; else { o.x=NL.clamp(o.x+(o.x<W/2?28:-28),20,W-20); } diffs.push({x:(sh[i].x+o.x)/2,y:(sh[i].y+o.y)/2,f:false}); });
    const prep=id=>{ const cv=NL.$('#'+id,api.el), d=2; cv.width=W*d; cv.height=H*d; const g=cv.getContext('2d'); g.scale(d,d); return {cv,g}; };
    const A=prep('sa'), Bc=prep('sb');
    const paint=(g,arr,marks)=>{ g.fillStyle='#FFF8EC'; g.fillRect(0,0,W,H); g.fillStyle='#E9F2E6'; g.fillRect(0,H*.65,W,H*.35);
      arr.forEach(o=>{ if(o.hide) return; g.save(); g.translate(o.x,o.y); g.rotate(o.r); g.fillStyle=o.c; g.beginPath();
        if(o.t===0) g.arc(0,0,o.s,0,7); else if(o.t===1) g.rect(-o.s,-o.s*.7,o.s*2,o.s*1.4); else { g.moveTo(0,-o.s); g.lineTo(o.s,o.s*.8); g.lineTo(-o.s,o.s*.8); g.closePath(); } g.fill(); g.restore(); });
      if(marks) diffs.forEach(d=>{ if(d.f){ g.strokeStyle='#E2574C'; g.lineWidth=3; g.beginPath(); g.arc(d.x,d.y,24,0,7); g.stroke(); } }); };
    const redraw=()=>{ paint(A.g,sh,true); paint(Bc.g,B,true); }; redraw(); let found=0; api.L('0/5'); const t0=now();
    Bc.cv.onpointerdown=e=>{ e.preventDefault(); const r=Bc.cv.getBoundingClientRect(); const x=(e.clientX-r.left)*W/r.width, y=(e.clientY-r.top)*H/r.height;
      const d=diffs.find(d=>!d.f && Math.hypot(d.x-x,d.y-y)<30); if(d){ d.f=true; found++; api.L(found+'/5'); NL.beep(900,.1); redraw(); } else { NL.beep(200,.08); NL.vibrate(40); } };
    return loop(api,()=>{ const left=60000-(now()-t0); api.R((Math.max(0,left)/1000).toFixed(1));
      if(found===5) return {v:100+Math.floor(left/1000), note:`${((now()-t0)/1000).toFixed(1)}초 만에 모두 찾았어요`};
      if(left<=0){ diffs.forEach(d=>d.f=true); redraw(); return {v:found*20, note:`${found}개 찾았어요`}; } }); }
});

/* ---------- 컵 속 공 찾기 ---------- */
NL.arcade({ id:'cups', name:'컵 속 공 찾기', desc:'섞인 컵에서 공 맞히기', bg:'#F3E7CC', glyph:'◡', better:'high', unit:'라운드', noCount:true,
  howto:'공이 든 컵을 잘 보세요. 컵이 섞인 뒤 공이 있는 컵을 누르면 다음 라운드, 점점 빨라져요.', hudL:'라운드', hudR:'상태', fmt:v=>v+'라운드',
  promo:{t:'대형화면 야바위 이벤트', d:'행사장 무대용 게임 키오스크 · 맞히면 경품'},
  game(api){ api.el.innerHTML=`<div style="position:relative;height:240px;background:#FAF8F2;border-radius:16px;overflow:hidden">${[0,1,2].map(i=>`<button data-c="${i}" style="position:absolute;bottom:40px;width:28%;height:120px;border:0;padding:0;background:none;transition:left .3s ease,transform .3s"><svg viewBox="0 0 100 110" style="width:100%;height:100%"><path d="M12 105L24 10h52l12 95z" fill="#E2574C"/><path d="M24 10h52" stroke="#fff" stroke-width="6" opacity=".4"/></svg></button>`).join('')}<div id="ball" style="position:absolute;bottom:44px;width:30px;height:30px;border-radius:50%;background:#172742;transition:left .3s"></div></div><button class="btn" id="st" style="margin-top:12px">라운드 시작</button>`;
    const cups=NL.$$('[data-c]',api.el), ball=NL.$('#ball',api.el); let pos=[0,1,2], ballCup=1, round=0, busy=true; const X=i=>`${4+i*34}%`;
    const place=(dur)=>cups.forEach((c,k)=>{ c.style.transitionDuration=dur+'ms'; c.style.left=X(pos[k]); });
    const showBall=(up)=>{ ball.style.left=`calc(${X(pos[ballCup])} + 14% - 15px)`; cups[ballCup].style.transform=up?'translateY(-70px)':'none'; ball.style.opacity=up?1:0; };
    place(0); showBall(true); api.L(0); api.R('공을 기억하세요');
    return new Promise(ok=>{
      const start=async()=>{ NL.$('#st',api.el).hidden=true; showBall(false); cups.forEach(c=>c.style.transform='none'); await NL.sleep(400); const n=3+round*2, sp=Math.max(160, 480-round*45); api.R('섞는 중…');
        for(let s=0;s<n;s++){ if(!api.alive) return; const a=RI(0,2); let b=RI(0,2); while(b===a) b=RI(0,2); const ia=pos.indexOf(a), ib=pos.indexOf(b); [pos[ia],pos[ib]]=[pos[ib],pos[ia]]; place(sp); NL.beep(300,.02,'square'); await NL.sleep(sp+40); }
        busy=false; api.R('어느 컵?'); };
      cups.forEach((c,k)=>c.onpointerdown=async e=>{ e.preventDefault(); if(busy) return; busy=true; showBall(true); cups[k].style.transform='translateY(-70px)';
        if(k===ballCup){ round++; api.L(round); api.R('정답!'); NL.beep(900,.15); await NL.sleep(900); cups[k].style.transform='none'; start(); }
        else { api.R('아쉬워요'); NL.vibrate(120); NL.beep(160,.4,'sawtooth'); await NL.sleep(1100); ok({v:round}); } });
      NL.$('#st',api.el).onclick=start; }); }
});

/* ---------- 병뚜껑 컬링 ---------- */
NL.arcade({ id:'curling', name:'병뚜껑 컬링', desc:'튕겨서 과녁 중앙에 멈추기', bg:'#E2F3EC', glyph:'◎', better:'high', unit:'점', noCount:true,
  howto:'병뚜껑을 손가락으로 위쪽으로 튕기세요. 빨리 밀수록 멀리 가요. 5번 던져 과녁 점수 합계!', hudL:'점수', hudR:'남은 기회', fmt:v=>v+'점',
  promo:{t:'컬링 대결, 스크린 배틀로', d:'2인 동시 대결 키오스크 · 팀 대항전'},
  game(api){ const c=canvasIn(api.el,340,560), g=c.g; const T={x:170,y:120}; const rings=[[70,'#DCE7F7',1],[52,'#fff',3],[34,'#F6D6D2',5],[18,'#fff',7],[8,'#E2574C',10]];
    let cap={x:170,y:500,vx:0,vy:0}, moving=false, shots=5, score=0, drag=null; const placed=[];
    const draw=()=>{ g.fillStyle='#EEF3F8'; g.fillRect(0,0,340,560); rings.forEach(([r,col])=>{ g.beginPath(); g.arc(T.x,T.y,r,0,7); g.fillStyle=col; g.fill(); g.strokeStyle='#c9d3e2'; g.stroke(); });
      g.strokeStyle='#c9d3e2'; g.setLineDash([6,6]); g.beginPath(); g.moveTo(0,440); g.lineTo(340,440); g.stroke(); g.setLineDash([]);
      [...placed,cap].forEach((p,i)=>{ g.beginPath(); g.arc(p.x,p.y,13,0,7); g.fillStyle=i===placed.length?'#B68A36':'#9aa0b0'; g.fill(); g.strokeStyle='#172742'; g.lineWidth=2; g.stroke(); }); };
    api.L(0); api.R(shots); draw();
    c.cv.onpointerdown=e=>{ if(moving||shots<=0) return; const p=c.pt(e); if(Math.hypot(p.x-cap.x,p.y-cap.y)<60) drag={p,t:now(),last:p,lt:now()}; };
    c.cv.onpointermove=e=>{ if(!drag) return; const p=c.pt(e); drag.prev=drag.last; drag.pt=drag.lt; drag.last=p; drag.lt=now(); if(p.y<440){ cap.x=NL.clamp(p.x,20,320); } };
    c.cv.onpointerup=e=>{ if(!drag) return; const p=c.pt(e), dt=Math.max(16,now()-drag.t); let vx=(p.x-drag.p.x)/dt*16, vy=(p.y-drag.p.y)/dt*16; drag=null;
      if(vy>-1.5){ return; } vx*=.7; vy*=.7; const sp=Math.hypot(vx,vy); const m=Math.min(1, 18/sp); cap.vx=vx*m; cap.vy=vy*m; moving=true; NL.beep(400,.05); };
    return loop(api,(dt)=>{ const k=dt/16;
      if(moving){ cap.x+=cap.vx*k; cap.y+=cap.vy*k; cap.vx*=Math.pow(.97,k); cap.vy*=Math.pow(.97,k); if(cap.x<13||cap.x>327){ cap.vx*=-.6; cap.x=NL.clamp(cap.x,13,327); }
        if(Math.hypot(cap.vx,cap.vy)<.08 || cap.y<-20){ moving=false; const d=Math.hypot(cap.x-T.x,cap.y-T.y); const pts=cap.y<-20?0:(rings.slice().reverse().find(([r])=>d<=r+6)||[0,0,0])[2];
          score+=pts; shots--; api.L(score); api.R(shots); NL.beep(pts?600+pts*40:200,.15); if(cap.y>-20) placed.push({x:cap.x,y:cap.y}); cap={x:170,y:500,vx:0,vy:0};
          if(shots<=0){ draw(); return {v:score}; } } }
      draw(); }); }
});

/* ---------- 무궁화꽃이 피었습니다 ---------- */
NL.arcade({ id:'redlight', name:'무궁화꽃이 피었습니다', desc:'술래가 볼 때 멈추기', bg:'#FBE3E1', glyph:'꽃', better:'high', unit:'초', noCount:false,
  howto:'버튼을 누르고 있으면 앞으로 가요. 술래가 돌아보면 손을 떼세요! 움직이다 걸리면 탈락. 끝까지 가면 완주.', hudL:'거리', hudR:'술래', fmt:finishFmt,
  promo:{t:'가족 행사엔 몸으로 하는 게임', d:'키즈·가족 행사용 대형화면 게임 키오스크'},
  game(api){ const TXT='무궁화꽃이피었습니다';
    api.el.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px"><div id="tagger" style="height:130px;border-radius:16px;background:#FAF8F2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><div id="face" style="width:70px;height:70px;border-radius:50%;background:#172742;transition:background .15s"></div><b id="say" style="font-size:22px;letter-spacing:2px;min-height:30px"></b></div>
      <div style="height:22px;border-radius:99px;background:#EEEAE0;overflow:hidden"><i id="bar" style="display:block;height:100%;width:0;background:#B68A36"></i></div>
      <button class="tapzone" id="hold" style="height:170px;font-size:24px">누르고 있으면 전진</button></div>`;
    const face=NL.$('#face',api.el), say=NL.$('#say',api.el), bar=NL.$('#bar',api.el), hold=NL.$('#hold',api.el);
    let down=false, dist=0, phase='back', phaseEnd=now()+R(1800,3800), lookStart=0, chars=0; const t0=now();
    hold.onpointerdown=e=>{ e.preventDefault(); down=true; try{ hold.setPointerCapture(e.pointerId); }catch(_){} }; hold.onpointerup=hold.onpointercancel=()=>{ down=false; };
    return loop(api,(dt)=>{ const t=now();
      if(phase==='back'){ const dur=phaseEnd-(phaseEnd-t); const total=phaseEnd; chars=Math.min(TXT.length, Math.floor((1-(phaseEnd-t)/3000)*TXT.length)); say.textContent=TXT.slice(0,Math.max(0,chars)); face.style.background='#172742';
        if(t>=phaseEnd){ phase='look'; lookStart=t; phaseEnd=t+R(1300,2600); say.textContent='무궁화꽃이피었습니다!'; face.style.background='#E2574C'; NL.beep(880,.2); api.R('보는 중!'); } else api.R('뒤돌아 있음'); }
      else if(phase==='look'){ if(down && t-lookStart>250){ NL.vibrate([200,80,200]); NL.beep(140,.5,'sawtooth'); say.textContent='움직였다! 탈락'; return {v:Math.floor(dist), note:'술래한테 걸렸어요'}; }
        if(t>=phaseEnd){ phase='back'; phaseEnd=t+R(1500,3600); } }
      if(down){ dist=Math.min(100, dist+dt*.018); bar.style.width=dist+'%'; api.L(Math.floor(dist)+'m'); }
      if(dist>=100){ const ms=t-t0; NL.beep(990,.3); return {v:Math.round(10000-ms/10), note:`${(ms/1000).toFixed(2)}초에 도착`}; } }); }
});

/* ---------- 박수 리듬왕 ---------- */
NL.arcade({ id:'rhythm', name:'박수 리듬왕', desc:'들려준 리듬 그대로 치기', bg:'#F1ECE0', glyph:'♩', better:'high', unit:'점', noCount:true,
  howto:'리듬을 듣고(보고) 똑같이 버튼을 치세요. 6라운드, 박자가 정확할수록 높은 점수. 소리를 켜세요.', hudL:'점수', hudR:'라운드', fmt:v=>v+'점',
  promo:{t:'리듬 게임 키오스크', d:'행사장 체험형 음악 게임 프로그램'},
  game(api){ api.el.innerHTML=`<div style="display:flex;flex-direction:column;gap:12px"><div id="lamp" style="height:90px;border-radius:16px;background:#EEEAE0;display:grid;place-items:center;font-weight:800;font-size:20px">잘 들어보세요</div><button class="tapzone" id="clap" style="height:220px">짝!</button></div>`;
    const lamp=NL.$('#lamp',api.el), clap=NL.$('#clap',api.el); let total=0, taps=[], listening=false;
    const pats=[[0,500,1000],[0,250,500,1000],[0,500,750,1000],[0,250,750,1000,1250],[0,250,500,750,1250,1500],[0,375,500,875,1000,1500]];
    clap.onpointerdown=e=>{ e.preventDefault(); NL.beep(700,.05,'triangle'); if(listening) taps.push(now()); };
    return new Promise(async ok=>{ for(let r=0;r<6;r++){ if(!api.alive) return; api.R(`${r+1}/6`); lamp.textContent='잘 들어보세요'; lamp.style.background='#EEEAE0'; await NL.sleep(700);
        const p=pats[r]; const st=now(); for(const off of p){ const wait=st+off-now(); if(wait>0) await NL.sleep(wait); lamp.style.background='#B68A36'; NL.beep(900,.07,'triangle'); setTimeout(()=>lamp.style.background='#EEEAE0',100); }
        await NL.sleep(600); lamp.textContent='지금 따라 치세요!'; lamp.style.background='#DCEFE6'; taps=[]; listening=true; await NL.sleep(p[p.length-1]+1300); listening=false;
        let pts=0; if(taps.length===p.length){ const base=taps[0]; const err=p.reduce((a,off,i)=>a+Math.abs((taps[i]-base)-off),0)/p.length; pts=Math.max(0,Math.round(100-err/2.5)); } else pts=Math.max(0,30-Math.abs(taps.length-p.length)*15);
        total+=pts; api.L(total); lamp.textContent=`${pts}점`; NL.beep(pts>70?990:300,.12); await NL.sleep(700); }
      ok({v:total}); }); }
});

/* ---------- 선 따라가기 ---------- */
NL.arcade({ id:'trace', name:'선 따라가기', desc:'길 밖으로 안 나가고 끝까지', bg:'#E7EDF8', glyph:'〰', better:'high', unit:'초', noCount:false,
  howto:'초록 점에서 손가락을 대고 길을 따라 금색 점까지 그리세요. 길 밖으로 나가면 끝!', hudL:'진행', hudR:'시간', fmt:finishFmt,
  promo:{t:'키즈 행사 게임', d:'아이들이 줄 서는 키즈 게임·동화 키오스크'},
  game(api){ const c=canvasIn(api.el,340,520), g=c.g; const pts=[]; let x=40; for(let i=0;i<7;i++){ pts.push({x:i%2?300:40, y:470-i*70}); }
    const path=[]; for(let i=0;i<pts.length-1;i++){ const a=pts[i], b=pts[i+1]; for(let t=0;t<1;t+=.02){ const e=t*t*(3-2*t); path.push({x:a.x+(b.x-a.x)*e, y:a.y+(b.y-a.y)*t}); } } path.push(pts[pts.length-1]);
    const HW=20; let on=false, prog=0, t0=0, done=null;
    const draw=(fail)=>{ g.fillStyle='#FDFCF9'; g.fillRect(0,0,340,520); g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='#E3DCCB'; g.lineWidth=HW*2; g.beginPath(); path.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.stroke();
      g.strokeStyle=fail?'#E2574C':'#3B7DD8'; g.lineWidth=8; g.beginPath(); path.slice(0,prog+1).forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)); g.stroke();
      g.fillStyle='#2E9E6B'; g.beginPath(); g.arc(path[0].x,path[0].y,16,0,7); g.fill(); const e=path[path.length-1]; g.fillStyle='#B68A36'; g.beginPath(); g.arc(e.x,e.y,16,0,7); g.fill(); };
    draw(); api.L('0%');
    const near=p=>{ let best=1e9,bi=0; for(let i=Math.max(0,prog-6);i<Math.min(path.length,prog+12);i++){ const d=Math.hypot(path[i].x-p.x,path[i].y-p.y); if(d<best){best=d;bi=i;} } return {d:best,i:bi}; };
    c.cv.onpointerdown=e=>{ e.preventDefault(); const p=c.pt(e); if(Math.hypot(p.x-path[0].x,p.y-path[0].y)<28 && !on && !done){ on=true; t0=now(); NL.beep(600,.05); } };
    c.cv.onpointermove=e=>{ if(!on||done) return; const p=c.pt(e); const n=near(p); if(n.d>HW+4){ done={fail:true}; return; } if(n.i>prog) prog=n.i; api.L(Math.floor(prog/(path.length-1)*100)+'%'); if(prog>=path.length-2) done={fail:false}; };
    c.cv.onpointerup=()=>{ if(on&&!done) done={fail:true}; };
    return loop(api,()=>{ if(on&&!done) api.R(((now()-t0)/1000).toFixed(1)); draw(done&&done.fail);
      if(done){ const pc=Math.floor(prog/(path.length-1)*100); if(done.fail){ NL.vibrate(120); NL.beep(150,.4,'sawtooth'); return {v:Math.min(99,pc), note:'길 밖으로 나갔어요'}; } const ms=now()-t0; NL.beep(990,.3); return {v:Math.round(10000-ms/10), note:`${(ms/1000).toFixed(2)}초 완주`}; } }); }
});

/* ---------- 젓가락 콩 옮기기 ---------- */
NL.arcade({ id:'beans', name:'젓가락 콩 옮기기', desc:'미끄러지는 콩 그릇에 옮기기', bg:'#ECEFE4', glyph:'콩', better:'high', unit:'개',
  howto:'왼쪽 접시의 콩을 집어(끌어) 오른쪽 그릇에 넣으세요. 너무 빨리 끌면 미끄러져 떨어져요. 30초.', hudL:'옮긴 콩', hudR:'남은 시간', fmt:v=>v+'개',
  promo:{t:'외국인 관광 행사 체험 게임', d:'K-문화 체험형 키오스크 프로그램 · 관광지·축제'},
  game(api){ const c=canvasIn(api.el,340,440), g=c.g; let beans=[], held=null, score=0, lastP=null, lastT=0; const t0=now(); const dish={x:90,y:250,r:72}, bowl={x:262,y:250,r:62};
    const spawn=()=>{ while(beans.length<9) beans.push({x:dish.x+R(-45,45), y:dish.y+R(-45,45), vx:R(-.2,.2), vy:R(-.2,.2)}); }; spawn();
    c.cv.onpointerdown=e=>{ e.preventDefault(); const p=c.pt(e); held=beans.find(b=>Math.hypot(b.x-p.x,b.y-p.y)<20)||null; lastP=p; lastT=now(); if(held) NL.beep(500,.02); };
    c.cv.onpointermove=e=>{ if(!held) return; const p=c.pt(e); const sp=Math.hypot(p.x-lastP.x,p.y-lastP.y)/Math.max(1,now()-lastT); lastP=p; lastT=now();
      if(sp>1.15 && Math.random()<.35){ held.vx=R(-1,1); held.vy=2; held=null; NL.beep(200,.06); NL.vibrate(30); return; } held.x=p.x; held.y=p.y; };
    c.cv.onpointerup=()=>{ if(!held) return; if(Math.hypot(held.x-bowl.x,held.y-bowl.y)<bowl.r-8){ beans=beans.filter(b=>b!==held); score++; api.L(score); NL.beep(900,.06); spawn(); } held=null; };
    api.L(0);
    return loop(api,(dt)=>{ const left=30000-(now()-t0); api.R((Math.max(0,left)/1000).toFixed(1));
      beans.forEach(b=>{ if(b===held) return; b.x+=b.vx; b.y+=b.vy; b.vx*=.96; b.vy*=.96; const d=Math.hypot(b.x-dish.x,b.y-dish.y); if(d>dish.r-10){ b.vx-=(b.x-dish.x)/d*.3; b.vy-=(b.y-dish.y)/d*.3; } b.vx+=R(-.04,.04); b.vy+=R(-.04,.04); });
      g.fillStyle='#F6EFE2'; g.fillRect(0,0,340,440); g.fillStyle='#fff'; g.beginPath(); g.arc(dish.x,dish.y,dish.r,0,7); g.fill(); g.strokeStyle='#d9cfb8'; g.lineWidth=3; g.stroke();
      g.fillStyle='#24395e'; g.beginPath(); g.arc(bowl.x,bowl.y,bowl.r,0,7); g.fill(); g.fillStyle='#3a5180'; g.beginPath(); g.arc(bowl.x,bowl.y,bowl.r-10,0,7); g.fill();
      beans.forEach(b=>{ g.fillStyle='#7a5a2a'; g.beginPath(); g.ellipse(b.x,b.y,9,7,.4,0,7); g.fill(); });
      if(held){ g.strokeStyle='#B68A36'; g.lineWidth=5; g.beginPath(); g.moveTo(held.x+6,held.y-8); g.lineTo(held.x+70,held.y-110); g.moveTo(held.x-4,held.y-8); g.lineTo(held.x+50,held.y-115); g.stroke(); }
      g.fillStyle='#596579'; g.font='600 14px Pretendard,sans-serif'; g.textAlign='center'; g.fillText('접시',dish.x,dish.y+dish.r+22); g.fillText('그릇',bowl.x,bowl.y+bowl.r+22);
      if(left<=0) return {v:score}; }); }
});

/* ---------- 삼겹살 뒤집기 장인 ---------- */
NL.arcade({ id:'grill', name:'삼겹살 뒤집기 장인', desc:'노릇할 때 뒤집고 꺼내기', bg:'#FBE7E5', glyph:'肉', better:'high', unit:'점',
  howto:'고기가 금색 테두리로 노릇해지면 눌러 뒤집고, 다시 노릇해지면 눌러 꺼내요(+2). 타면 -1! 45초.', hudL:'점수', hudR:'남은 시간', fmt:v=>v+'점',
  promo:{t:'식당·푸드 페스티벌 홍보 게임', d:'매장 브랜드를 입힌 맞춤 게임 키오스크 납품'},
  game(api){ api.el.innerHTML=`<div class="mole" id="gr" style="background:#2b2b30;padding:12px;border-radius:20px">${[...Array(6)].map((_,i)=>`<button data-i="${i}" style="aspect-ratio:1.3;border-radius:14px;border:3px solid #444;background:#3a3a40;padding:6px;transition:background .2s"><span style="display:block;width:100%;height:100%;border-radius:10px;background:transparent"></span></button>`).join('')}</div>`;
    const cells=NL.$$('#gr button',api.el); const st=cells.map(()=>null); let score=0, next=0; const t0=now();
    const col=s=>{ if(!s) return 'transparent'; const p=s.cook; if(p<.6) return `hsl(355,60%,${78-p*20}%)`; if(p<1) return `hsl(30,70%,${62-(p-.6)*20}%)`; if(p<1.35) return '#C9883A'; return '#3a2a20'; };
    const paint=()=>cells.forEach((b,i)=>{ const s=st[i]; b.firstChild.style.background=col(s); b.style.borderColor = s&&s.cook>=1&&s.cook<1.35 ? '#F3D79A':'#444'; b.firstChild.style.backgroundImage=s?'repeating-linear-gradient(0deg,rgba(255,255,255,.18) 0 4px,transparent 4px 14px)':'none'; b.firstChild.style.opacity=s&&s.side===2?.92:1; });
    cells.forEach((b,i)=>b.onpointerdown=e=>{ e.preventDefault(); const s=st[i]; if(!s) return;
      if(s.cook>=1 && s.cook<1.35){ if(s.side===1){ s.side=2; s.cook=0; NL.beep(500,.08,'square'); } else { st[i]=null; score+=2; api.L(score); NL.beep(990,.1); } }
      else if(s.cook>=1.35){ st[i]=null; score-=1; api.L(score); NL.beep(150,.2); } else { b.animate([{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:150}); } paint(); });
    api.L(0);
    return loop(api,(dt)=>{ const t=now(), left=45000-(t-t0); api.R((Math.max(0,left)/1000).toFixed(1)); const el=t-t0;
      if(t>next){ const free=st.map((s,i)=>s?null:i).filter(x=>x!=null); if(free.length){ st[free[RI(0,free.length-1)]]={cook:0,side:1,sp:R(.00028,.00045)*(1+el/60000)}; } next=t+R(900,1700)-el/60; }
      st.forEach((s,i)=>{ if(!s) return; s.cook+=s.sp*dt; if(s.cook>1.9){ st[i]=null; score-=1; api.L(score); NL.beep(120,.15); } });
      paint(); if(left<=0) return {v:score}; }); }
});

/* ---------- 칼퇴길 탈출런 ---------- */
NL.arcade({ id:'runner', name:'칼퇴길 탈출런', desc:'회의·야근 피해 퇴근까지', bg:'#E3EEF9', glyph:'퇴근', better:'high', unit:'m', noCount:false,
  howto:'화면을 눌러 점프! 회의·추가업무·야근을 피해 최대한 멀리 달리세요. 갈수록 빨라져요.', hudL:'거리', hudR:'속도', fmt:v=>v+'m',
  promo:{t:'기업 워크숍 게임 패키지', d:'사내 행사용 단체 게임 키오스크 · 팀 대항 순위전'},
  game(api){ const c=canvasIn(api.el,360,300), g=c.g; let y=0, vy=0, dist=0, sp=4.2, obs=[], nextAt=60; const GY=240; const labels=['회의','야근','추가업무','보고서','급한 메일'];
    const jump=e=>{ e&&e.preventDefault(); if(y>=0){ vy=-11.5; NL.beep(600,.04); } }; c.cv.onpointerdown=jump;
    return loop(api,(dt)=>{ const k=dt/16; sp=Math.min(11, sp+.0016*dt); dist+=sp*k*.1; api.L(Math.floor(dist)+'m'); api.R(sp.toFixed(1));
      vy+=.62*k; y+=vy*k; if(y>0){ y=0; vy=0; }
      nextAt-=sp*k; if(nextAt<=0){ const h=RI(0,2)?34:52; obs.push({x:380,w:h>40?30:44,h,t:labels[RI(0,labels.length-1)]}); nextAt=R(170,320)+sp*8; }
      obs.forEach(o=>o.x-=sp*k); obs=obs.filter(o=>o.x>-60);
      g.fillStyle='#EEF3F8'; g.fillRect(0,0,360,300); g.fillStyle='#d9e2ee'; for(let i=0;i<6;i++){ const bx=((i*90-dist*3)%540+540)%540-60; g.fillRect(bx,120,50,120); }
      g.fillStyle='#172742'; g.fillRect(0,GY,360,4);
      const px=60, py=GY+y; g.fillStyle='#B68A36'; g.fillRect(px-12,py-40,24,40); g.beginPath(); g.arc(px,py-50,11,0,7); g.fillStyle='#172742'; g.fill();
      for(const o of obs){ g.fillStyle='#E2574C'; g.fillRect(o.x,GY-o.h,o.w,o.h); g.fillStyle='#fff'; g.font='700 11px Pretendard,sans-serif'; g.textAlign='center'; g.fillText(o.t.slice(0,4),o.x+o.w/2,GY-o.h-6>10?GY-o.h-6:12);
        if(px+10>o.x && px-10<o.x+o.w && py>GY-o.h){ NL.vibrate(150); NL.beep(140,.5,'sawtooth'); return {v:Math.floor(dist), note:`"${o.t}"에 붙잡혔어요`}; } }
      g.fillStyle='#172742'; g.font='700 13px Pretendard,sans-serif'; g.textAlign='left'; g.fillText('퇴근까지 달려!',10,22); }); }
});

/* ---------- 마트 계산대 알바왕 ---------- */
NL.arcade({ id:'cashier', name:'마트 계산대 알바왕', desc:'바코드 방향대로 스캔', bg:'#F1ECE0', glyph:'▮▯', better:'high', unit:'개',
  howto:'상품의 바코드 화살표 방향 버튼을 누르거나 그 방향으로 쓸어 스캔하세요. 틀리면 -1. 30초.', hudL:'스캔', hudR:'남은 시간', fmt:v=>v+'개',
  promo:{t:'매장 브랜드 상품 버전 납품', d:'우리 매장 상품으로 만드는 맞춤 게임 키오스크'},
  game(api){ const items=['우유','라면','계란','두부','사과','과자','콜라','김','식빵','참치캔','세제','휴지']; const dirs=[['↑','up'],['→','right'],['↓','down'],['←','left']];
    api.el.innerHTML=`<div id="item" style="height:200px;border-radius:20px;background:#fff;border:2px solid #E6E1D4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;touch-action:none"><b id="nm" style="font-size:26px"></b><span id="ar" style="font-size:54px;font-weight:800;color:#B68A36;line-height:1"></span><small style="color:#596579">바코드 방향</small></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;max-width:260px;margin-left:auto;margin-right:auto"><span></span><button class="btn sub" data-d="up">↑</button><span></span><button class="btn sub" data-d="left">←</button><button class="btn sub" data-d="down">↓</button><button class="btn sub" data-d="right">→</button></div>`;
    let cur, score=0; const box=NL.$('#item',api.el);
    const nxt=()=>{ cur=dirs[RI(0,3)]; NL.$('#nm',api.el).textContent=items[RI(0,items.length-1)]; NL.$('#ar',api.el).textContent=cur[0]; };
    const ans=d=>{ const ok=d===cur[1]; score+=ok?1:-1; api.L(score); NL.beep(ok?1200:180,ok?.05:.12,ok?'square':'sine'); if(!ok) NL.vibrate(40); box.style.borderColor=ok?'#2E9E6B':'#E2574C'; setTimeout(()=>box.style.borderColor='#E6E1D4',120); nxt(); };
    NL.$$('[data-d]',api.el).forEach(b=>b.onpointerdown=e=>{ e.preventDefault(); ans(b.dataset.d); });
    let sw=null; box.onpointerdown=e=>{ sw={x:e.clientX,y:e.clientY}; }; box.onpointerup=e=>{ if(!sw) return; const dx=e.clientX-sw.x, dy=e.clientY-sw.y; sw=null; if(Math.hypot(dx,dy)<30) return; ans(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')); };
    nxt(); api.L(0); const t0=now();
    return loop(api,()=>{ const left=30000-(now()-t0); api.R((Math.max(0,left)/1000).toFixed(1)); if(left<=0) return {v:score}; }); }
});

/* ---------- 숫자 퍼즐 (슬라이드) ---------- */
NL.arcade({ id:'puzzle', name:'숫자 슬라이드 퍼즐', desc:'1~8 순서대로 맞추기', bg:'#EFE4FF', glyph:'⊞', better:'low', unit:'초',
  howto:'빈칸 옆 숫자를 눌러 밀어서 1부터 8까지 순서대로 맞추세요. 빠를수록 좋아요.', hudL:'이동', hudR:'시간', fmt:v=>timeFmt(v),
  promo:{t:'두뇌 퍼즐 키오스크', d:'IQ 퍼즐 챌린지·순서 기억 등 체류형 게임 프로그램'},
  game(api){ let b=[1,2,3,4,5,6,7,8,0]; const nb=i=>[i-3,i+3,(i%3)?i-1:-1,(i%3<2)?i+1:-1].filter(j=>j>=0&&j<9);
    for(let k=0,last=-1;k<160;k++){ const z=b.indexOf(0); const opts=nb(z).filter(j=>j!==last); const j=opts[RI(0,opts.length-1)]; [b[z],b[j]]=[b[j],b[z]]; last=z; }
    if(b.join()==='1,2,3,4,5,6,7,8,0'){ [b[7],b[8]]=[b[8],b[7]]; [b[5],b[8]]=[b[8],b[5]]; }
    api.el.innerHTML=`<div class="g25" id="pz" style="grid-template-columns:repeat(3,1fr);gap:8px;max-width:330px;margin:0 auto"></div>`; let moves=0; const t0=now();
    const draw=()=>{ NL.$('#pz',api.el).innerHTML=b.map((v,i)=>v?`<button data-i="${i}" style="font-size:30px;aspect-ratio:1">${v}</button>`:'<span></span>').join(''); NL.$$('#pz button',api.el).forEach(x=>x.onpointerdown=mv); };
    let resolve, fin=false; const mv=e=>{ e.preventDefault(); const i=+e.currentTarget.dataset.i, z=b.indexOf(0); if(!nb(z).includes(i)) { NL.beep(200,.05); return; } [b[z],b[i]]=[b[i],b[z]]; moves++; api.L(moves); NL.beep(500,.03); draw();
      if(b.join()==='1,2,3,4,5,6,7,8,0'){ fin=true; resolve({v:Math.round(now()-t0), note:`${moves}번 움직여 완성`}); } };
    draw(); api.L(0);
    return new Promise(ok=>{ resolve=ok; const f=()=>{ if(!api.alive||fin) return; api.R(((now()-t0)/1000).toFixed(1)); requestAnimationFrame(f); }; f(); }); }
});
})();
