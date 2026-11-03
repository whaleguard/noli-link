/* 놀이링크 core — 서버 저장 없음. 방 데이터는 링크(#) 안에만 들어있다. */
(function(){
'use strict';
const NL = window.NL = {tools:{}, order:[], TTL:24*3600*1000, VER:1};

/* ---------- tool registry ---------- */
NL.reg = def => { NL.tools[def.id] = def; NL.order.push(def.id); };

/* ---------- small helpers ---------- */
NL.esc = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
NL.$ = (sel, root) => (root||document).querySelector(sel);
NL.$$ = (sel, root) => [...(root||document).querySelectorAll(sel)];
NL.html = (el, s) => { el.innerHTML = s; return el; };
NL.lines = s => String(s||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean);
NL.uniq = a => [...new Set(a)];
NL.sleep = ms => new Promise(r=>setTimeout(r,ms));
NL.clamp = (v,a,b) => Math.max(a,Math.min(b,v));
NL.store = {
  get(k,d){ try{ const v=localStorage.getItem('nl_'+k); return v==null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem('nl_'+k, JSON.stringify(v)); }catch(e){} }
};
NL.toast = (msg, ms) => { const t=document.getElementById('toast'); t.textContent=msg; t.hidden=false; clearTimeout(NL._tt); NL._tt=setTimeout(()=>t.hidden=true, ms||2200); };
NL.vibrate = p => { try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} };

/* ---------- seeded random (같은 시드 = 모두 같은 결과) ---------- */
NL.hash = str => { let h1=0xdeadbeef^0, h2=0x41c6ce57^0; str=String(str);
  for(let i=0;i<str.length;i++){ const ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  return (h1>>>0); };
NL.rng = seed => { let a = (typeof seed==='number'?seed:NL.hash(seed))>>>0;
  return () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; };
NL.shuffle = (arr, r) => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
NL.rand32 = () => { try{ const u=new Uint32Array(1); crypto.getRandomValues(u); return u[0]; }catch(e){ return Math.floor(Math.random()*4294967295); } };

/* ---------- link encoding: JSON -> deflate -> base64url ---------- */
const b64u = bytes => { let s=''; for(let i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); };
const unb64u = str => { str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; const s=atob(str); const b=new Uint8Array(s.length); for(let i=0;i<s.length;i++) b[i]=s.charCodeAt(i); return b; };
const canZ = typeof CompressionStream!=='undefined' && typeof DecompressionStream!=='undefined';
async function pipe(bytes, stream){ const res = new Response(new Blob([bytes]).stream().pipeThrough(stream)); return new Uint8Array(await res.arrayBuffer()); }
NL.encode = async obj => { const raw = new TextEncoder().encode(JSON.stringify(obj));
  if(canZ){ try{ return 'z'+b64u(await pipe(raw, new CompressionStream('deflate-raw'))); }catch(e){} }
  return 'p'+b64u(raw); };
NL.decode = async str => { const k=str[0], body=str.slice(1); let bytes=unb64u(body);
  if(k==='z'){ if(!canZ) throw new Error('nozip'); bytes = await pipe(bytes, new DecompressionStream('deflate-raw')); }
  else if(k!=='p') throw new Error('bad');
  return JSON.parse(new TextDecoder().decode(bytes)); };
NL.base = () => location.origin + location.pathname;
NL.linkOf = async room => NL.base() + '#r/' + await NL.encode(room);
NL.parseLink = async s => { const m=String(s).match(/#r\/([A-Za-z0-9_\-]+)/); if(!m) return null; try{ return await NL.decode(m[1]); }catch(e){ return null; } };

/* ---------- room ---------- */
NL.newRoom = (t, ti, d) => ({v:NL.VER, t, ti, c:Date.now(), s:NL.rand32(), d, b:[]});
NL.left = room => room.c + NL.TTL - Date.now();
NL.fmtLeft = ms => { if(ms<=0) return '종료'; const h=Math.floor(ms/3600e3), m=Math.floor(ms%3600e3/60e3); return h>0?`${h}시간 ${m}분 남음`:`${m}분 남음`; };
NL.fmtEnd = room => { const d=new Date(room.c+NL.TTL); return `${d.getMonth()+1}.${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
NL.sameRoom = (a,b) => a && b && a.t===b.t && a.c===b.c && a.s===b.s;

/* 이어달리기: 기록을 합친 새 방 (생성시각·시드는 그대로 계승) */
NL.mergeBoard = (tool, lists) => {
  const by = {};
  lists.flat().forEach(e => { if(!e||!e.n) return; const k=e.n.trim(); const cur=by[k];
    if(!cur) { by[k]=e; return; }
    if(tool.better){ // arcade: best score wins
      const better = tool.better==='high' ? e.v>cur.v : e.v<cur.v; if(better) by[k]=e;
    } else if((e.at||0) > (cur.at||0)) by[k]=e; // vote: latest answer wins
  });
  let arr = Object.values(by);
  if(tool.better) arr.sort((x,y)=> tool.better==='high'? y.v-x.v : x.v-y.v);
  else arr.sort((x,y)=>(x.at||0)-(y.at||0));
  return arr.slice(0, tool.maxB||60);
};
NL.withEntry = (tool, room, entry) => Object.assign({}, room, {b: NL.mergeBoard(tool, [room.b||[], [entry]])});

/* ---------- name memory ---------- */
NL.myName = () => NL.store.get('name','');
NL.setName = n => NL.store.set('name', n);

/* ---------- share ---------- */
NL.copy = async text => { try{ await navigator.clipboard.writeText(text); return true; }catch(e){
  const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
  let ok=false; try{ ok=document.execCommand('copy'); }catch(_){} ta.remove(); return ok; } };
NL.shareBox = (el, link, msg, title) => {
  el.innerHTML = `<div class="share"><b>${NL.esc(title||'이 링크를 카톡방에 올려주세요')}</b>
    <div class="lnk">${NL.esc(link)}</div>
    <div class="row"><button class="btn" data-s>카톡방에 보내기</button></div>
    <div class="row"><button class="btn sub sm" style="flex:1" data-c>링크만 복사</button><button class="btn sub sm" style="flex:1" data-o>열어보기</button></div></div>`;
  const full = msg ? msg + '\n' + link : link;
  NL.$('[data-s]',el).onclick = async () => {
    if(navigator.share){ try{ await navigator.share({text: full}); return; }catch(e){ if(e && e.name==='AbortError') return; } }
    const ok = await NL.copy(full); NL.toast(ok?'복사했어요. 카톡방에 붙여넣기 하세요':'길게 눌러 링크를 복사해 주세요');
  };
  NL.$('[data-c]',el).onclick = async () => { const ok=await NL.copy(link); NL.toast(ok?'링크를 복사했어요':'길게 눌러 복사해 주세요'); };
  NL.$('[data-o]',el).onclick = () => { location.href = link; };
};

/* ---------- name prompt ---------- */
NL.askName = (label) => new Promise(res => {
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ov-c"><h3>${NL.esc(label||'이름을 알려주세요')}</h3><p class="lead">방 사람들이 알아볼 이름이면 돼요. 가입은 없어요.</p>
  <input class="inp" id="nl-name" maxlength="12" placeholder="예: 민수" value="${NL.esc(NL.myName())}">
  <button class="btn" data-ok>확인</button><button class="btn sub" data-x>취소</button></div>`;
  document.body.appendChild(ov); const inp=NL.$('#nl-name',ov); setTimeout(()=>inp.focus(),50);
  const done = v => { ov.remove(); res(v); };
  NL.$('[data-ok]',ov).onclick = () => { const v=inp.value.trim().slice(0,12); if(!v){ inp.focus(); return; } NL.setName(v); done(v); };
  inp.onkeydown = e => { if(e.key==='Enter') NL.$('[data-ok]',ov).click(); };
  NL.$('[data-x]',ov).onclick = () => done(null);
});
NL.confirm = (title, body, okText) => new Promise(res => {
  const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ov-c"><h3>${NL.esc(title)}</h3><p class="lead">${body||''}</p><button class="btn" data-ok>${NL.esc(okText||'확인')}</button><button class="btn sub" data-x>취소</button></div>`;
  document.body.appendChild(ov);
  NL.$('[data-ok]',ov).onclick=()=>{ov.remove();res(true);}; NL.$('[data-x]',ov).onclick=()=>{ov.remove();res(false);};
});
NL.countdown = async () => { const ov=document.createElement('div'); ov.className='ov'; document.body.appendChild(ov);
  for(const n of ['3','2','1']){ ov.innerHTML=`<div class="count">${n}</div>`; NL.beep(520,.08); await NL.sleep(700); }
  ov.innerHTML=`<div class="count">시작!</div>`; NL.beep(880,.12); await NL.sleep(380); ov.remove(); };

/* ---------- sound (사용자 터치 이후에만) ---------- */
let AC=null;
NL.beep = (f, dur, type) => { try{ AC = AC || new (window.AudioContext||window.webkitAudioContext)(); const o=AC.createOscillator(), g=AC.createGain();
  o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(.08, AC.currentTime); g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime+(dur||.1));
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+(dur||.1)); }catch(e){} };

/* ---------- board render ---------- */
NL.boardHTML = (tool, room, me) => {
  const b = room.b||[];
  if(!b.length) return `<p class="empty">아직 기록이 없어요. 첫 기록의 주인공이 되어 보세요</p>`;
  return `<div class="board">${b.slice(0,20).map((e,i)=>`<div class="brow ${e.n===me?'me':''}"><span class="rk num">${i+1}</span><span>${NL.esc(e.n)}</span><span class="v num">${NL.esc(tool.fmt(e.v, e))}</span></div>`).join('')}</div>`;
};

/* ---------- merge links UI ---------- */
NL.mergeUI = (el, tool, room, onMerged) => {
  el.innerHTML = `<details class="merge"><summary>링크가 여러 개로 갈라졌나요? 기록 합치기</summary>
    <div class="fld" style="margin-top:8px"><small>같은 방에서 나온 다른 링크들을 붙여넣으면 기록을 하나로 합쳐요.</small>
    <textarea class="inp" id="nl-mg" placeholder="링크를 한 줄에 하나씩 붙여넣기"></textarea>
    <button class="btn sub" data-m>합친 링크 만들기</button><div data-out></div></div></details>`;
  NL.$('[data-m]',el).onclick = async () => {
    const links = NL.$('#nl-mg',el).value.split(/\s+/).filter(Boolean); const lists=[room.b||[]]; let bad=0;
    for(const l of links){ const r=await NL.parseLink(l); if(r && NL.sameRoom(r,room)) lists.push(r.b||[]); else bad++; }
    const merged = Object.assign({}, room, {b: NL.mergeBoard(tool, lists)});
    const link = await NL.linkOf(merged);
    NL.$('[data-out]',el).innerHTML=''; const box=document.createElement('div'); NL.$('[data-out]',el).appendChild(box);
    NL.shareBox(box, link, `[${room.ti}] 기록을 합쳤어요`, `${lists.length-1}개 링크를 합쳤어요${bad?` (다른 방 링크 ${bad}개 제외)`:''}`);
    onMerged && onMerged(merged);
  };
};

/* ---------- 이어달리기 참여 공통 ---------- */
NL.submit = async (ctx, entry, msgFn, title, opts) => {
  opts = opts || {};
  let name = opts.name;
  if(!name && !opts.anon){ name = await NL.askName(opts.ask || '이름을 알려주세요'); if(!name) return null; }
  entry.n = entry.n || name; entry.at = Date.now();
  const nr = NL.withEntry(ctx.tool, ctx.room, entry);
  ctx.room = nr; ctx.redraw && ctx.redraw(name);
  const box = NL.$(opts.box || '#after'); if(!box) return nr; box.innerHTML='';
  await ctx.shareRoom(box, nr, msgFn(nr, name), title || '참여 완료! 새 링크를 방에 다시 올려주세요');
  box.scrollIntoView({behavior:'smooth', block:'center'});
  return nr;
};
NL.CHAIN_NOTE = '이 링크에 담긴 결과예요. 참여한 뒤 받은 새 링크를 방에 다시 올려주세요. 링크가 갈라지면 아래 "기록 합치기"로 합칠 수 있어요.';
NL.pickN = (arr, n, r) => NL.shuffle(arr, r||Math.random).slice(0, n);
NL.reveal = (title, bodyHTML, btn) => new Promise(res => { const ov=document.createElement('div'); ov.className='ov';
  ov.innerHTML=`<div class="ov-c">${title?`<p class="lead">${title}</p>`:''}${bodyHTML}<button class="btn">${NL.esc(btn||'확인하고 가리기')}</button></div>`;
  document.body.appendChild(ov); NL.$('button',ov).onclick=()=>{ov.remove();res();}; });
/* 이름 고르기 → 본인 확인 → 비밀 보기 (라이어·마피아·미션 등) */
NL.secretPick = (ctx, names, getHTML, note) => {
  ctx.el.insertAdjacentHTML('beforeend', `<div class="stage"><p class="lead">${NL.esc(note||'내 이름을 눌러 확인하세요. 화면은 나만 보세요.')}</p><div class="slip" id="sp">${names.map((nm,i)=>`<button type="button" data-i="${i}"><span>${NL.esc(nm)}</span><small>나예요</small></button>`).join('')}</div></div>`);
  NL.$$('#sp button').forEach(b=>b.onclick=async()=>{ const i=+b.dataset.i;
    if(!await NL.confirm(`${names[i]}님 맞나요?`,'본인 것만 확인해 주세요.','네, 저예요')) return;
    NL.beep(880,.15); await NL.reveal(`${NL.esc(names[i])}님`, getHTML(i)); b.classList.add('open'); });
};

/* ---------- icons (도구별 단순 도형) ---------- */
NL.icon = (k) => {
  const p = {
    ladder:'<path d="M9 4v24M23 4v24M9 10h14M9 18h14M9 25h14" stroke="#172742" stroke-width="2.6" stroke-linecap="round" fill="none"/>',
    wheel:'<circle cx="16" cy="16" r="12" fill="#fff" stroke="#172742" stroke-width="2.4"/><path d="M16 4v24M4 16h24M7.5 7.5l17 17M24.5 7.5l-17 17" stroke="#B68A36" stroke-width="1.8"/><circle cx="16" cy="16" r="3" fill="#172742"/>',
    lots:'<rect x="5" y="8" width="22" height="17" rx="3" fill="#fff" stroke="#172742" stroke-width="2.4"/><path d="M5 12l11 7 11-7" stroke="#B68A36" stroke-width="2.2" fill="none"/>',
    order:'<path d="M12 8h14M12 16h14M12 24h14" stroke="#172742" stroke-width="2.6" stroke-linecap="round"/><circle cx="6" cy="8" r="2.4" fill="#B68A36"/><circle cx="6" cy="16" r="2.4" fill="#B68A36"/><circle cx="6" cy="24" r="2.4" fill="#B68A36"/>',
    team:'<circle cx="10" cy="12" r="4" fill="#3B7DD8"/><circle cx="22" cy="12" r="4" fill="#E2574C"/><path d="M3 26c1-5 4-7 7-7s6 2 7 7M15 26c1-5 4-7 7-7s6 2 7 7" stroke="#172742" stroke-width="2.2" fill="none"/>',
    dice:'<rect x="5" y="5" width="22" height="22" rx="5" fill="#fff" stroke="#172742" stroke-width="2.4"/><circle cx="11" cy="11" r="2" fill="#172742"/><circle cx="16" cy="16" r="2" fill="#B68A36"/><circle cx="21" cy="21" r="2" fill="#172742"/>',
    bomb:'<circle cx="15" cy="18" r="10" fill="#172742"/><path d="M21 9l4-4" stroke="#B68A36" stroke-width="2.6" stroke-linecap="round"/><circle cx="26" cy="4.5" r="2" fill="#E2574C"/>',
    manito:'<rect x="6" y="12" width="20" height="15" rx="2" fill="#E2574C"/><rect x="4" y="8" width="24" height="6" rx="2" fill="#B68A36"/><path d="M16 8v19" stroke="#fff" stroke-width="2.4"/>',
    poll:'<rect x="5" y="16" width="5" height="11" rx="1.5" fill="#B68A36"/><rect x="13.5" y="8" width="5" height="19" rx="1.5" fill="#172742"/><rect x="22" y="12" width="5" height="15" rx="1.5" fill="#596579"/>',
    balance:'<path d="M16 5v22M6 10h20" stroke="#172742" stroke-width="2.4" stroke-linecap="round"/><path d="M6 10l-4 8h8zM26 10l-4 8h8z" fill="#B68A36"/><path d="M11 27h10" stroke="#172742" stroke-width="2.4" stroke-linecap="round"/>',
    date:'<rect x="4" y="7" width="24" height="20" rx="3" fill="#fff" stroke="#172742" stroke-width="2.4"/><path d="M4 13h24M10 4v6M22 4v6" stroke="#172742" stroke-width="2.4"/><rect x="15" y="17" width="6" height="6" rx="1.5" fill="#B68A36"/>',
    mole:'<ellipse cx="16" cy="25" rx="12" ry="4" fill="#3b2f22"/><path d="M8 25c0-10 3-15 8-15s8 5 8 15z" fill="#8a6a4a"/><circle cx="13" cy="16" r="1.6" fill="#172742"/><circle cx="19" cy="16" r="1.6" fill="#172742"/><ellipse cx="16" cy="19.5" rx="2" ry="1.3" fill="#e7a0a0"/>',
    seven:'<circle cx="16" cy="17" r="11" fill="#fff" stroke="#172742" stroke-width="2.4"/><path d="M16 17V10M16 17l5 3" stroke="#B68A36" stroke-width="2.4" stroke-linecap="round"/><path d="M13 3h6" stroke="#172742" stroke-width="2.4" stroke-linecap="round"/>',
    reaction:'<path d="M18 3L7 18h8l-2 11 12-16h-8z" fill="#B68A36" stroke="#172742" stroke-width="1.8" stroke-linejoin="round"/>',
    tap:'<circle cx="16" cy="16" r="5" fill="#172742"/><circle cx="16" cy="16" r="10" fill="none" stroke="#B68A36" stroke-width="2"/><circle cx="16" cy="16" r="14" fill="none" stroke="#B68A36" stroke-width="1.2" opacity=".5"/>',
    n25:'<rect x="4" y="4" width="11" height="11" rx="2" fill="#172742"/><rect x="17" y="4" width="11" height="11" rx="2" fill="#fff" stroke="#172742" stroke-width="2"/><rect x="4" y="17" width="11" height="11" rx="2" fill="#fff" stroke="#172742" stroke-width="2"/><rect x="17" y="17" width="11" height="11" rx="2" fill="#B68A36"/>',
    balloon:'<ellipse cx="16" cy="13" rx="9" ry="11" fill="#E2574C"/><path d="M16 24l-1.5 3h3zM16 27c0 2-2 3 0 5" stroke="#596579" stroke-width="1.4" fill="#E2574C"/><ellipse cx="12.5" cy="9" rx="2" ry="3" fill="#fff" opacity=".5"/>',
    memory:'<rect x="3" y="7" width="12" height="18" rx="2.5" fill="#172742"/><rect x="17" y="7" width="12" height="18" rx="2.5" fill="#fff" stroke="#172742" stroke-width="2"/><circle cx="23" cy="16" r="3.5" fill="#B68A36"/>',
    simon:'<path d="M15 15V3a12 12 0 0 0-12 12z" fill="#E2574C"/><path d="M17 15V3a12 12 0 0 1 12 12z" fill="#3B7DD8"/><path d="M15 17v12A12 12 0 0 1 3 17z" fill="#E8B230"/><path d="M17 17v12a12 12 0 0 0 12-12z" fill="#2E9E6B"/>',
    stroop:'<text x="16" y="22" text-anchor="middle" font-size="16" font-weight="800" fill="#3B7DD8" font-family="sans-serif">빨강</text>',
    math:'<path d="M8 6v10M3 11h10M19 11h10M5 23l6 6M11 23l-6 6M19 24h10M19 28h10" stroke="#172742" stroke-width="2.4" stroke-linecap="round"/>',
    fortune:'<circle cx="16" cy="16" r="12" fill="#172742"/><path d="M19 7a9 9 0 1 0 6 13 7 7 0 1 1-6-13z" fill="#F3D79A"/><circle cx="10" cy="11" r="1.2" fill="#F3D79A"/>'
  }[k];
  if(!p){ const g=NL.tools[k]&&NL.tools[k].glyph||'?'; const fs=g.length>2?10:g.length>1?13:18;
    return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="8" fill="#172742"/><text x="16" y="${16+fs*.36}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#F3D79A" font-family="Pretendard,sans-serif">${NL.esc(g)}</text></svg>`; }
  return `<svg viewBox="0 0 32 32" aria-hidden="true">${p}</svg>`;
};

/* 결과 하단 영업 배너 */
NL.promoHTML = tool => {
  const p = tool.promo || {};
  return `<aside class="promo"><span class="k">위드메모리 행사·매장용 키오스크</span>
    <b>${NL.esc(p.t || '이 게임, 행사장 대형화면으로 해보세요')}</b>
    <p>${NL.esc(p.d || '운세·AI사진·게임 25종 키오스크 프로그램. 행사 대여와 매장 설치 모두 가능합니다.')}</p>
    <div class="row"><a class="a1" href="https://mapinlife.store/demo/" target="_blank" rel="noopener">체험관에서 해보기</a><a class="a2" href="tel:15511649">견적 1551-1649</a></div></aside>`;
};
})();
