/* 놀이링크 app — 화면 이동(#), 홈·만들기·방 화면 */
(function(){
'use strict';
const app = document.getElementById('app');
const E = NL.esc;
const CATS = [['all','전체'],['decide','정하기'],['vote','투표'],['arcade','게임'],['quiz','퀴즈'],['party','파티'],['fun','운세·축하']];
const SOON = [];
const BACK = '<svg viewBox="0 0 20 20"><path d="M12.5 4l-6 6 6 6" stroke="#172742" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let timer = null;

function topbar(title, room){
  return `<header class="top"><div class="top-in">
    ${title?`<a class="back" href="#" aria-label="처음으로">${BACK}</a><span class="top-t">${E(title)}</span>`:`<a class="logo" href="#">놀이<b>링크</b></a><span class="top-t"></span>`}
    ${room?`<span class="chip-time num" id="nl-left"></span>`:''}
  </div></header>`;
}
function foot(){ return `<p class="foot">놀이링크는 서버에 아무것도 저장하지 않아요. 방 내용은 링크 안에만 있고 24시간 뒤 닫힙니다.<br>(주)고래등 · 위드메모리 · <a href="https://mapinlife.com/" target="_blank" rel="noopener">mapinlife.com</a> · 1551-1649</p>`; }

/* ---------------- home ---------------- */
function home(){
  const cat = NL.store.get('cat','all');
  app.innerHTML = topbar() + `<main class="wrap">
    <section class="hero"><h1>카톡방에 붙이면<br><em>바로 노는</em> 링크</h1>
      <p>사다리·룰렛·투표부터 두더지 잡기까지. 만들어서 링크만 보내면 받은 사람은 누르자마자 참여합니다.</p>
      <div class="facts"><span>가입 없음</span><span>링크 가진 사람만</span><span>24시간 뒤 자동 종료</span><span>무료</span></div></section>
    <nav class="cats" id="cats" aria-label="분류">${CATS.map(([k,n])=>`<button type="button" data-c="${k}" aria-pressed="${k===cat}">${n}</button>`).join('')}</nav>
    <p class="sec-t" id="cnt"></p><div class="grid" id="grid"></div>
    ${NL.promoHTML({promo:{t:'우리 행사엔 대형화면 게임 키오스크',d:'7초를 잡아라, 경품 룰렛, AI 포토부스까지. 행사 대여·매장 설치 상담'}})}
    ${foot()}</main>`;
  const draw = c => {
    NL.store.set('cat', c);
    NL.$$('#cats button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.c===c));
    const ids = NL.order.filter(id => c==='all' || NL.tools[id].cat===c);
    NL.$('#cnt').textContent = `지금 쓸 수 있는 ${ids.length}종`;
    NL.$('#grid').innerHTML = ids.map(id=>{ const t=NL.tools[id];
      return `<a class="tcard" href="#new/${t.id}"><span class="ic" style="background:${t.bg||'#F3E7CC'}">${NL.icon(t.icon||t.id)}</span><b>${E(t.name)}</b><span>${E(t.desc)}</span></a>`; }).join('');
  };
  NL.$$('#cats button').forEach(b=>b.onclick=()=>draw(b.dataset.c));
  draw(CATS.some(c=>c[0]===cat)?cat:'all');
}

/* ---------------- create ---------------- */
function fieldHTML(f){
  const id='f_'+f.k, v=f.def!=null?f.def:'';
  let input;
  if(f.type==='list') input=`<textarea class="inp" id="${id}" placeholder="${E(f.ph||'')}">${E(Array.isArray(v)?v.join('\n'):v)}</textarea>`;
  else if(f.type==='number') input=`<input class="inp num" type="number" inputmode="numeric" id="${id}" value="${E(v)}" min="${f.min||''}" max="${f.max||''}">`;
  else if(f.type==='select') input=`<select class="inp" id="${id}">${f.opts.map(o=>`<option value="${E(o[0])}" ${o[0]==v?'selected':''}>${E(o[1])}</option>`).join('')}</select>`;
  else if(f.type==='date') input=`<input class="inp" type="date" id="${id}" value="${E(v)}">`;
  else input=`<input class="inp" id="${id}" maxlength="${f.max||40}" value="${E(v)}" placeholder="${E(f.ph||'')}">`;
  return `<div class="fld"><label for="${id}">${E(f.label)}</label>${input}${f.help?`<small>${E(f.help)}</small>`:''}</div>`;
}
function readFields(tool){
  const o={};
  (tool.fields||[]).forEach(f=>{ const el=NL.$('#f_'+f.k); if(!el) return;
    if(f.type==='list') o[f.k]=NL.lines(el.value).map(s=>s.slice(0,f.itemMax||30));
    else if(f.type==='number') o[f.k]=Number(el.value);
    else o[f.k]=el.value.trim(); });
  return o;
}
function create(id){
  const tool = NL.tools[id]; if(!tool) return home();
  const end = new Date(Date.now()+NL.TTL);
  app.innerHTML = topbar(tool.name) + `<main class="wrap">
    <div class="panel"><div class="row" style="gap:12px;flex-wrap:nowrap"><span class="tcard" style="padding:0;border:0;box-shadow:none"><span class="ic" style="background:${tool.bg||'#F3E7CC'}">${NL.icon(tool.icon||tool.id)}</span></span><div style="min-width:0"><h2>${E(tool.name)} 만들기</h2><p class="lead">${E(tool.long||tool.desc)}</p></div></div>
    <div class="fld"><label for="f_ti">방 제목</label><input class="inp" id="f_ti" maxlength="30" value="${E(tool.defTitle||tool.name)}"></div>
    ${(tool.fields||[]).map(fieldHTML).join('')}
    <div class="lock"><span>링크 유효시간 <b>24시간</b> (고정)</span><span class="num">~ ${end.getMonth()+1}.${end.getDate()} ${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}</span></div>
    <p class="err" id="err" hidden></p>
    <button class="btn" id="mk">링크 만들기</button></div>
    <div id="out"></div>${foot()}</main>`;
  NL.$('#mk').onclick = async () => {
    const err=NL.$('#err'); err.hidden=true;
    const vals = readFields(tool); const ti = NL.$('#f_ti').value.trim() || tool.name;
    let d;
    try { d = tool.build ? tool.build(vals) : vals; } catch(e){ err.textContent = typeof e==='string'?e:'입력을 다시 확인해 주세요'; err.hidden=false; return; }
    const room = NL.newRoom(tool.id, ti.slice(0,30), d);
    const link = await NL.linkOf(room);
    const out = NL.$('#out'); out.innerHTML='<div class="panel" id="sh"></div>';
    NL.shareBox(NL.$('#sh'), link, tool.inviteMsg ? tool.inviteMsg(room) : `[${room.ti}] ${tool.name} 링크예요. 누르면 바로 참여!`, '링크가 만들어졌어요');
    NL.$('#mk').textContent='다시 만들기';
    out.scrollIntoView({behavior:'smooth', block:'start'});
  };
}

/* ---------------- room ---------------- */
async function room(payload){
  let r=null; try { r = await NL.decode(payload); } catch(e){}
  const tool = r && NL.tools[r.t];
  if(!r || !tool){
    app.innerHTML = topbar('놀이링크') + `<main class="wrap"><div class="expired"><p class="big">링크를 열 수 없어요</p><p class="lead">주소가 잘렸거나 지원하지 않는 링크예요. 링크 전체를 다시 복사해 주세요.</p><a class="btn" href="#" style="max-width:280px;text-decoration:none">새로 만들기</a></div></main>`; return;
  }
  if(NL.left(r) <= 0){
    app.innerHTML = topbar(tool.name) + `<main class="wrap"><div class="expired"><p class="big">종료된 방이에요</p><p class="lead">[${E(r.ti)}] 링크는 만든 지 24시간이 지나 닫혔어요.<br>내용은 어디에도 남지 않습니다.</p><a class="btn" href="#new/${tool.id}" style="max-width:280px;text-decoration:none">나도 ${E(tool.name)} 만들기</a></div>${NL.promoHTML(tool)}${foot()}</main>`; return;
  }
  app.innerHTML = topbar(tool.name, true) + `<main class="wrap">
    <div class="r-title"><h1>${E(r.ti)}</h1><p>${E(tool.name)} · ${NL.fmtEnd(r)}까지 열려 있어요</p></div>
    <div id="body"></div>
    <a class="btn sub" href="#new/${tool.id}" style="margin-top:16px;text-decoration:none">나도 ${E(tool.name)} 만들기</a>
    ${NL.promoHTML(tool)}${foot()}</main>`;
  const tick = () => { const el=NL.$('#nl-left'); if(!el) return; const ms=NL.left(r); el.textContent=NL.fmtLeft(ms); el.classList.toggle('low', ms<3600e3); if(ms<=0) route(); };
  tick(); timer = setInterval(tick, 20000);
  const ctx = {
    room:r, tool, el:NL.$('#body'), me:NL.myName(),
    relink: async nr => NL.linkOf(nr),
    async shareRoom(target, nr, msg, title){ const link = await NL.linkOf(nr); NL.shareBox(target, link, msg, title); return link; }
  };
  try { await tool.render(ctx); } catch(e){ console.error(e); ctx.el.innerHTML='<p class="err">화면을 그리는 중 문제가 생겼어요. 새로고침해 주세요.</p>'; }
}

/* ---------------- router ---------------- */
function route(){
  clearInterval(timer); timer=null;
  NL.$$('.ov').forEach(o=>o.remove());
  if(NL._stop) { try{ NL._stop(); }catch(e){} NL._stop=null; }
  const h = location.hash.replace(/^#\/?/,'');
  if(h.startsWith('r/')) room(h.slice(2));
  else if(h.startsWith('new/')) create(h.slice(4));
  else home();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', route);
route();
})();
