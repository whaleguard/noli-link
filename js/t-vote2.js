/* 투표 2차: 이상형 월드컵·익명 질문함·순위 투표·변명왕·전원일치·롤링페이퍼·커플 텔레파시·재미 테스트 */
(function(){
'use strict';
const E = NL.esc;
const mergeBox = (ctx) => NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; ctx.redraw(); });
const bar = (label, n, mx, who, best) => `<div class="bar ${best?'best':''}"><div class="bt"><span>${E(label)}</span><span class="num">${n}</span></div><div class="bb"><i style="width:${mx?n/mx*100:0}%"></i></div>${who?`<span class="who">${who}</span>`:''}</div>`;

/* ---------- 이상형 월드컵 ---------- */
NL.reg({ id:'worldcup', cat:'vote', name:'이상형 월드컵', desc:'토너먼트로 최애 고르기', bg:'#FBE3E1', glyph:'WC',
  long:'후보 8개 또는 16개로 토너먼트를 해요. 각자 우승자를 고르면 우리 방 종합 순위가 나와요.',
  defTitle:'회식 메뉴 월드컵',
  fields:[{k:'items', type:'list', label:'후보 (4·8·16개)', ph:'한 줄에 하나', def:['삼겹살','치킨','피자','초밥','곱창','떡볶이','마라탕','파스타']}],
  build(v){ const it=NL.uniq(v.items); const n=it.length>=16?16:it.length>=8?8:it.length>=4?4:0; if(!n) throw '후보를 4개 이상 넣어 주세요'; return {items:it.slice(0,n)}; },
  promo:{t:'제품·메뉴 선호도 체험 부스', d:'매장 메뉴로 하는 월드컵 키오스크 · 고객 선호 데이터 수집'},
  render(ctx){ const {items}=ctx.room.d;
    ctx.el.innerHTML=`<div class="stage" id="play"></div><div id="after"></div><div class="stage" id="rs"></div>`;
    const play=()=>{ let round=NL.shuffle(items.map((_,i)=>i), Math.random), next=[], k=0; const p=NL.$('#play');
      const step=()=>{ if(k>=round.length){ if(next.length===1) return done(next[0]); round=next; next=[]; k=0; }
        const a=round[k], b=round[k+1]; const lbl = round.length===2?'결승':`${round.length}강`;
        p.innerHTML=`<p class="balq">${lbl} · ${k/2+1}/${round.length/2}</p><div class="bal"><button data-i="${a}">${E(items[a])}</button><button data-i="${b}">${E(items[b])}</button></div>`;
        NL.$$('.bal button',p).forEach(x=>x.onclick=async()=>{ x.setAttribute('aria-pressed','true'); NL.beep(700,.05); await NL.sleep(220); next.push(+x.dataset.i); k+=2; step(); }); };
      const done=w=>{ NL.beep(990,.3); p.innerHTML=`<div class="result-big"><small>나의 우승</small><b style="font-size:32px">${E(items[w])}</b></div><button class="btn" id="sb">우승 올리고 링크 받기</button><button class="btn sub" id="re">다시 하기</button>`;
        NL.$('#sb').onclick=()=>NL.submit(ctx,{a:w},(nr,n)=>`[${nr.ti}] ${n}의 우승은 "${items[w]}"! 너의 1위는?`); NL.$('#re').onclick=play; };
      step(); };
    ctx.redraw=()=>{ const b=ctx.room.b||[]; const c=items.map(()=>[]); b.forEach(e=>c[e.a]&&c[e.a].push(e.n)); const ord=items.map((_,i)=>i).filter(i=>c[i].length).sort((x,y)=>c[y].length-c[x].length); const mx=Math.max(1,...c.map(x=>x.length));
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>우리 방 우승 순위</small><b>${b.length}명 참여</b></div></div>${ord.length?ord.map((i,k)=>bar(`${k+1}. ${items[i]}`, c[i].length+'표', 0, c[i].map(E).join(', '), k===0).replace('width:0%',`width:${c[i].length/mx*100}%`)).join(''):'<p class="empty">아직 아무도 안 했어요</p>'}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`; mergeBox(ctx); };
    play(); ctx.redraw(); }
});

/* ---------- 익명 질문함 ---------- */
NL.reg({ id:'askbox', cat:'vote', name:'익명 질문함', desc:'익명으로 묻고 답하기', bg:'#E7EDF8', glyph:'Q', maxB:80,
  long:'이름 없이 질문을 남기고, 누구든 답을 달 수 있어요. 질문을 올리거나 답하면 새 링크가 나와요.',
  defTitle:'무엇이든 물어보세요',
  fields:[{k:'to', type:'text', label:'누구에게 묻나요? (선택)', def:'', max:15, ph:'예: 신입 지연 / 팀장님'}],
  build(v){ return {to:v.to.slice(0,15)}; },
  inviteMsg: r => `[${r.ti}] ${r.d.to?r.d.to+'에게 ':''}익명으로 질문 남겨줘. 이름 안 나와!`,
  promo:{t:'행사 Q&A 스크린', d:'세미나·간담회용 익명 질문 대형화면 + 키오스크'},
  render(ctx){ const to=ctx.room.d.to;
    ctx.el.innerHTML=`<div class="stage"><div class="fld"><label for="q">${to?E(to)+'에게 ':''}익명 질문</label><textarea class="inp" id="q" maxlength="100" style="min-height:80px" placeholder="궁금한 걸 적어주세요. 이름은 안 나와요"></textarea></div><button class="btn" id="sb">익명으로 올리기</button><div id="after"></div></div><div class="stage" id="rs"></div>`;
    NL.$('#sb').onclick=()=>{ const q=NL.$('#q').value.trim(); if(!q){ NL.toast('질문을 적어주세요'); return; } NL.submit(ctx,{n:'q'+NL.rand32().toString(36), q:q.slice(0,100), ans:[]},(nr)=>`[${nr.ti}] 새 익명 질문이 올라왔어요 (${nr.b.length}개). 답해줄 사람?`,'질문을 올렸어요! 새 링크를 방에 올려주세요',{anon:true}); };
    ctx.redraw=()=>{ const b=(ctx.room.b||[]).slice().reverse();
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>질문</small><b>${b.length}개</b></div></div>${b.length?b.map(e=>`<div class="note" style="background:#fff;border:1px solid #E6E1D4;display:flex;flex-direction:column;gap:6px"><b style="font-size:15px;color:#172742">Q. ${E(e.q)}</b>${(e.ans||[]).map(a=>`<span>A. ${E(a.t)} <small style="color:#B68A36">— ${E(a.by)}</small></span>`).join('')}<button class="btn sub sm" data-q="${E(e.n)}">답하기</button></div>`).join(''):'<p class="empty">첫 질문을 남겨보세요</p>'}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`;
      NL.$$('[data-q]').forEach(btn=>btn.onclick=async()=>{ const e=(ctx.room.b||[]).find(x=>x.n===btn.dataset.q); if(!e) return;
        const t=await new Promise(res=>{ const ov=document.createElement('div'); ov.className='ov'; ov.innerHTML=`<div class="ov-c"><h3>답하기</h3><p class="lead">Q. ${E(e.q)}</p><textarea class="inp" maxlength="100" style="min-height:80px"></textarea><button class="btn" data-ok>올리기</button><button class="btn sub" data-x>취소</button></div>`; document.body.appendChild(ov); NL.$('[data-ok]',ov).onclick=()=>{ const v=NL.$('textarea',ov).value.trim(); ov.remove(); res(v); }; NL.$('[data-x]',ov).onclick=()=>{ov.remove();res(null);}; });
        if(!t) return; const name=await NL.askName('답한 사람 이름 (답변엔 이름이 보여요)'); if(!name) return;
        NL.submit(ctx, Object.assign({}, e, {ans:[...(e.ans||[]), {t:t.slice(0,100), by:name}]}), (nr)=>`[${nr.ti}] ${name}이(가) 질문에 답했어요!`, '답을 올렸어요! 새 링크를 방에 올려주세요', {name}); });
      mergeBox(ctx); };
    ctx.redraw(); }
});

/* ---------- 순위 매기기 투표 ---------- */
NL.reg({ id:'rank', cat:'vote', name:'순위 매기기 투표', desc:'좋은 순서대로 눌러 종합 순위', bg:'#ECEFE4', glyph:'1·2·3',
  long:'후보를 좋아하는 순서대로 눌러요. 1등은 가장 많은 점수를 받아 우리 방 종합 순위가 나옵니다.',
  defTitle:'여름 휴가지 순위',
  fields:[{k:'items', type:'list', label:'후보 (3~10개)', ph:'한 줄에 하나', def:['제주도','부산','강릉','여수','경주']}],
  build(v){ const it=NL.uniq(v.items); if(it.length<3) throw '후보를 3개 이상 넣어 주세요'; return {items:it.slice(0,10)}; },
  promo:{t:'현장 선호도 조사 키오스크', d:'행사장 투표·설문 키오스크 · 참여자 쿠폰 지급'},
  render(ctx){ const {items}=ctx.room.d; let ord=[];
    ctx.el.innerHTML=`<div class="stage"><p class="lead">좋아하는 순서대로 누르세요.</p><div class="opt" id="op"></div><div class="row"><button class="btn sub sm" id="rs0" style="flex:1">다시 고르기</button></div><button class="btn" id="sb" disabled>순위 올리고 링크 받기</button><div id="after"></div></div><div class="stage" id="rs"></div>`;
    const op=()=>{ NL.$('#op').innerHTML=items.map((t,i)=>{ const r=ord.indexOf(i); return `<button data-i="${i}" aria-pressed="${r>=0}">${r>=0?`<b style="color:#B68A36">${r+1}위</b> `:''}${E(t)}</button>`; }).join('');
      NL.$$('#op button').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(ord.includes(i)) return; ord.push(i); NL.beep(500+ord.length*60,.04); op(); NL.$('#sb').disabled=ord.length<items.length; }); };
    op(); NL.$('#rs0').onclick=()=>{ ord=[]; op(); NL.$('#sb').disabled=true; };
    NL.$('#sb').onclick=()=>NL.submit(ctx,{a:ord.slice()},(nr,n)=>`[${nr.ti}] ${n}의 1위는 "${items[ord[0]]}". 너의 순위는?`);
    ctx.redraw=()=>{ const b=ctx.room.b||[]; const pts=items.map(()=>0); b.forEach(e=>(e.a||[]).forEach((i,r)=>{ if(pts[i]!=null) pts[i]+=items.length-r; })); const o=items.map((_,i)=>i).sort((x,y)=>pts[y]-pts[x]); const mx=Math.max(1,...pts);
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>종합 순위 (1위 ${items.length}점 ~ 꼴찌 1점)</small><b>${b.length}명 참여</b></div></div>${b.length?o.map((i,k)=>`<div class="bar ${k===0?'best':''}"><div class="bt"><span>${k+1}. ${E(items[i])}</span><span class="num">${pts[i]}점</span></div><div class="bb"><i style="width:${pts[i]/mx*100}%"></i></div></div>`).join(''):'<p class="empty">아직 아무도 안 했어요</p>'}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`; mergeBox(ctx); };
    ctx.redraw(); }
});

/* ---------- 변명왕 선발대회 ---------- */
NL.reg({ id:'excuse', cat:'vote', name:'변명왕 선발대회', desc:'한 줄 변명 + 투표로 우승', bg:'#F3E7CC', glyph:'핑계',
  long:'상황을 정하면 각자 기발한 변명 한 줄을 올리고, 다른 사람 변명 중 최고를 하나 골라요. 가장 많이 뽑힌 사람이 변명왕!',
  defTitle:'변명왕 선발대회',
  fields:[{k:'sit', type:'text', label:'상황', def:'약속에 30분 늦었을 때', max:40}],
  build(v){ return {sit:(v.sit||'약속에 늦었을 때').slice(0,40)}; },
  inviteMsg: r => `[${r.ti}] "${r.d.sit}" 최고의 변명은? 한 줄 올리고 투표해줘`,
  promo:{t:'행사 사연 공모 스크린', d:'행사장 참여형 사연·투표 대형화면 프로그램'},
  render(ctx){ const {sit}=ctx.room.d; let vote=null;
    ctx.el.innerHTML=`<div class="stage"><p class="lead">상황</p><h2 style="font-size:20px">${E(sit)}</h2><div class="fld"><label for="ex">나의 변명 한 줄</label><input class="inp" id="ex" maxlength="60" placeholder="예: 지구 자전이 오늘따라 빨랐어"></div><div id="vt"></div><button class="btn" id="sb">변명 올리고 링크 받기</button><div id="after"></div></div><div class="stage" id="rs"></div>`;
    ctx.redraw=(me)=>{ const b=ctx.room.b||[]; const votes={}; b.forEach(e=>{ if(e.vote) votes[e.vote]=(votes[e.vote]||0)+1; }); const ord=b.slice().sort((x,y)=>(votes[y.n]||0)-(votes[x.n]||0)); const mx=Math.max(1,...Object.values(votes));
      NL.$('#vt').innerHTML = b.length?`<div class="fld"><label>최고의 변명 하나 고르기</label><div class="opt">${b.map(e=>`<button data-n="${E(e.n)}" aria-pressed="${vote===e.n}">"${E(e.t)}" <small style="color:#596579">— ${E(e.n)}</small></button>`).join('')}</div></div>`:'';
      NL.$$('#vt button').forEach(x=>x.onclick=()=>{ vote=x.dataset.n; NL.$$('#vt button').forEach(y=>y.setAttribute('aria-pressed', y===x)); });
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>변명왕 순위</small><b>${b.length}명 참여</b></div></div>${ord.length?ord.map((e,k)=>`<div class="bar ${k===0&&votes[e.n]?'best':''}"><div class="bt"><span>${E(e.n)}</span><span class="num">${votes[e.n]||0}표</span></div><div class="bb"><i style="width:${(votes[e.n]||0)/mx*100}%"></i></div><span class="who">"${E(e.t)}"</span></div>`).join(''):'<p class="empty">첫 변명을 올려보세요</p>'}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`; mergeBox(ctx); };
    NL.$('#sb').onclick=async()=>{ const t=NL.$('#ex').value.trim(); if(!t){ NL.toast('변명을 적어주세요'); return; } const name=await NL.askName('이름을 알려주세요'); if(!name) return; if(vote===name){ NL.toast('자기 변명엔 투표할 수 없어요'); vote=null; }
      NL.submit(ctx,{t:t.slice(0,60), vote},(nr)=>`[${nr.ti}] ${name}의 변명: "${t.slice(0,30)}" 너는 뭐라고 할래?`,null,{name}); };
    ctx.redraw(); }
});

/* ---------- 전원일치 작전 ---------- */
const UNA = [['치킨은?','후라이드','양념','간장','반반'],['여름 휴가지는?','바다','계곡','해외','집'],['중식 하나만?','짜장면','짬뽕','볶음밥','탕수육'],['카페 메뉴는?','아이스 아메리카노','라떼','녹차','과일주스'],
 ['떡볶이 맵기는?','순한맛','보통','매운맛','아주 매운맛'],['여행 숙소는?','호텔','펜션','캠핑','게스트하우스'],['영화 장르는?','코미디','액션','공포','로맨스'],['좋아하는 계절은?','봄','여름','가을','겨울'],
 ['라면에 넣는다면?','계란','치즈','파','아무것도 안 넣음'],['주말 오후엔?','낮잠','카페','운동','쇼핑'],['탕수육은?','부먹','찍먹','상관없음','안 먹음'],['아침 식사는?','밥','빵','시리얼','안 먹음']];
NL.reg({ id:'unanimous', cat:'vote', name:'전원일치 작전', desc:'상의 없이 같은 답 고르기', bg:'#E2F3EC', glyph:'=',
  long:'상의하지 말고 "모두가 고를 것 같은" 답을 고르세요. 우리 방이 몇 문제나 전원일치하는지 도전!',
  defTitle:'전원일치 작전',
  fields:[{k:'own', type:'list', label:'질문 (선택, "질문 / 보기 / 보기 / …")', itemMax:80, ph:'점심은? / 한식 / 중식 / 일식', def:[], help:'비워두면 기본 질문 12개 중 8개를 써요'}],
  build(v){ const own=v.own.map(l=>l.split('/').map(s=>s.trim()).filter(Boolean)).filter(p=>p.length>=3).map(p=>p.slice(0,6).map(s=>s.slice(0,20))).slice(0,12);
    return {qs: own.length ? own : NL.shuffle(UNA, Math.random).slice(0,8)}; },
  promo:{t:'커플·팀 일치 게임', d:'커플 밸런스 퀴즈 키오스크 · 팀워크 행사'},
  render(ctx){ const {qs}=ctx.room.d; const ans=qs.map(()=>-1); let qi=0;
    ctx.el.innerHTML=`<div class="stage" id="play"></div><div id="after"></div><div class="stage" id="rs"></div>`;
    const play=()=>{ const p=NL.$('#play'); if(qi>=qs.length){ p.innerHTML=`<p class="howto big" style="text-align:center">다 골랐어요!</p><button class="btn" id="sb">답 올리고 링크 받기</button>`; NL.$('#sb').onclick=()=>NL.submit(ctx,{a:ans.slice()},(nr,n)=>`[${nr.ti}] ${n} 답 완료. 우리 방 전원일치 몇 개 나올까?`); return; }
      const q=qs[qi]; p.innerHTML=`<p class="balq num">${qi+1} / ${qs.length}</p><h2 style="font-size:20px">${E(q[0])}</h2><div class="opt">${q.slice(1).map((o,k)=>`<button data-k="${k}">${E(o)}</button>`).join('')}</div>`;
      NL.$$('.opt button',p).forEach(b=>b.onclick=async()=>{ ans[qi]=+b.dataset.k; b.setAttribute('aria-pressed','true'); NL.beep(600,.05); await NL.sleep(200); qi++; play(); }); };
    ctx.redraw=()=>{ const b=ctx.room.b||[]; let una=0; const rows=qs.map((q,i)=>{ const c=q.slice(1).map(()=>0); b.forEach(e=>{ if(e.a&&e.a[i]>=0) c[e.a[i]]++; }); const mx=Math.max(...c); const all=b.length>1&&mx===b.length; if(all) una++;
        return `<div class="bar ${all?'best':''}"><span class="balq">${i+1}. ${E(q[0])} ${all?'<b style="color:#B68A36">전원일치!</b>':''}</span>${q.slice(1).map((o,k)=>c[k]?`<div class="bt" style="font-size:13px"><span>${E(o)}</span><span>${c[k]}명</span></div>`:'').join('')}</div>`; }).join('');
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>참여</small><b>${b.length}명</b></div><div><small>전원일치</small><b>${una} / ${qs.length}</b></div></div>${b.length?rows:'<p class="empty">아직 아무도 안 했어요</p>'}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`; mergeBox(ctx); };
    play(); ctx.redraw(); }
});

/* ---------- 단체 롤링페이퍼 ---------- */
const PAPER = ['#FFF4D6','#E3EEF9','#FBE3E1','#E2F3EC','#EFE4FF','#F1ECE0'];
NL.reg({ id:'rolling', cat:'fun', name:'단체 롤링페이퍼', desc:'생일·퇴사·졸업 메시지 모으기', bg:'#FFF4D6', glyph:'♡', maxB:80,
  long:'받는 사람을 정하고 링크를 돌리세요. 한 명씩 메시지를 남기면 마지막 링크를 주인공에게 보내면 됩니다. 24시간 안에 저장해 두세요!',
  defTitle:'지연 생일 축하해',
  fields:[{k:'to', type:'text', label:'받는 사람', def:'지연', max:12},{k:'why', type:'select', label:'무슨 날?', def:'생일', opts:[['생일','생일'],['퇴사','퇴사·이직'],['졸업','졸업'],['결혼','결혼'],['응원','응원'],['감사','감사']]}],
  build(v){ if(!v.to.trim()) throw '받는 사람을 넣어 주세요'; return {to:v.to.trim().slice(0,12), why:v.why}; },
  inviteMsg: r => `[${r.ti}] ${r.d.to}에게 줄 롤링페이퍼! 한 줄 남기고 다음 사람에게 넘겨줘`,
  promo:{t:'현장 메시지 월 + 기념 출력', d:'행사장에서 남긴 메시지를 사진과 함께 출력하는 키오스크'},
  render(ctx){ const {to,why}=ctx.room.d;
    ctx.el.innerHTML=`<div class="stage" style="background:linear-gradient(160deg,#172742,#2b3f69);color:#fff"><p style="color:#D9B76A;font-weight:700">${E(why)} 롤링페이퍼</p><h2 style="font-family:var(--fd);font-weight:400;font-size:32px;color:#F3D79A">To. ${E(to)}</h2><div id="papers" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"></div></div>
      <div class="stage"><div class="fld"><label for="ms">${E(to)}에게 한마디</label><textarea class="inp" id="ms" maxlength="120" style="min-height:90px"></textarea></div><button class="btn" id="sb">남기고 링크 받기</button><div id="after"></div><p class="note">${NL.CHAIN_NOTE} 마지막 링크를 ${E(to)}에게 보내주세요.</p><div id="mg"></div></div>`;
    ctx.redraw=()=>{ const b=ctx.room.b||[]; NL.$('#papers').innerHTML=b.length?b.map((e,i)=>`<div style="background:${PAPER[i%PAPER.length]};color:#172742;border-radius:14px;padding:12px;font-size:14px;line-height:1.5;transform:rotate(${(i%3-1)*1.2}deg);word-break:keep-all">${E(e.t)}<br><b style="font-size:12px;color:#B68A36">From. ${E(e.n)}</b></div>`).join(''):'<p style="grid-column:1/-1;color:#c7d2ea;text-align:center;padding:20px 0">첫 메시지를 남겨주세요</p>'; mergeBox(ctx); };
    NL.$('#sb').onclick=()=>{ const t=NL.$('#ms').value.trim(); if(!t){ NL.toast('메시지를 적어주세요'); return; } NL.submit(ctx,{t:t.slice(0,120)},(nr,n)=>`[${nr.ti}] ${n}도 남겼어 (${nr.b.length}명). 다음 사람 이어서!`); };
    ctx.redraw(); }
});

/* ---------- 커플 텔레파시 ---------- */
const TELE = [['여행 가면','바다','산'],['데이트는','집콕','밖에서'],['연락은','전화','문자'],['영화는','극장','집에서 OTT'],['선물은','깜짝 선물','갖고 싶은 거'],['싸우면','바로 풀기','시간 갖기'],
 ['아침형? 저녁형?','아침형','저녁형'],['여행 계획은','꼼꼼하게','즉흥으로'],['기념일은','꼭 챙긴다','소소하게'],['외식 메뉴는','한식','양식'],['주말엔','늦잠','일찍 일어나기'],['사진은','많이 찍기','눈으로 담기'],
 ['애칭은','있어야지','이름이 좋아'],['커플템은','좋아','별로'],['디저트는','케이크','빙수']];
NL.reg({ id:'tele', cat:'vote', name:'커플 텔레파시', desc:'둘이 같은 답 몇 개?', bg:'#FBE3E1', glyph:'♥♥',
  long:'두 사람이 같은 질문 10개에 각자 답해요. 둘 다 답하면 몇 개가 통했는지 나와요. 친구·동료끼리도 OK.',
  defTitle:'우리 텔레파시 테스트',
  fields:[{k:'a', type:'text', label:'첫 번째 사람', def:'민수', max:12},{k:'b', type:'text', label:'두 번째 사람', def:'지연', max:12}],
  build(v){ const a=v.a.trim(), b=v.b.trim(); if(!a||!b||a===b) throw '서로 다른 두 사람 이름을 넣어 주세요'; return {a:a.slice(0,12), b:b.slice(0,12), qs:NL.shuffle(TELE, Math.random).slice(0,10)}; },
  inviteMsg: r => `[${r.ti}] ${r.d.a} ♥ ${r.d.b} 텔레파시 몇 개나 통할까? 둘 다 답해줘`,
  promo:{t:'원조는 키오스크 "커플 밸런스 퀴즈"', d:'커플 포토존·데이트 코스 매장용 키오스크'},
  render(ctx){ const {a,b,qs}=ctx.room.d; let who=null; const ans=qs.map(()=>-1); let qi=0;
    ctx.el.innerHTML=`<div class="stage" id="play"></div><div id="after"></div><div class="stage" id="rs"></div>`;
    const play=()=>{ const p=NL.$('#play'); const doneBy=n=>(ctx.room.b||[]).some(e=>e.n===n);
      if(!who){ p.innerHTML=`<p class="lead">나는 누구?</p><div class="bal"><button data-w="a">${E(a)}${doneBy(a)?'<br><small>답 완료</small>':''}</button><button data-w="b">${E(b)}${doneBy(b)?'<br><small>답 완료</small>':''}</button></div><p class="note">상대 답이 링크에 들어 있어도 먼저 보지 않기로 약속!</p>`; NL.$$('[data-w]',p).forEach(x=>x.onclick=()=>{ who=x.dataset.w==='a'?a:b; play(); }); return; }
      if(qi>=qs.length){ p.innerHTML=`<p class="howto big" style="text-align:center">${E(who)}님 답 완료!</p><button class="btn" id="sb">답 올리고 링크 받기</button>`; NL.$('#sb').onclick=()=>NL.submit(ctx,{a:ans.slice()},(nr)=>`[${nr.ti}] ${who} 답 완료! ${who===a?b:a} 차례야`,null,{name:who}); return; }
      const q=qs[qi]; p.innerHTML=`<p class="balq num">${E(who)} · ${qi+1} / ${qs.length}</p><h2 style="font-size:19px">${E(q[0])}</h2><div class="bal"><button data-k="0">${E(q[1])}</button><button data-k="1">${E(q[2])}</button></div>`;
      NL.$$('.bal button',p).forEach(x=>x.onclick=async()=>{ ans[qi]=+x.dataset.k; x.setAttribute('aria-pressed','true'); NL.beep(600+ans[qi]*200,.05); await NL.sleep(200); qi++; play(); }); };
    ctx.redraw=()=>{ const A=(ctx.room.b||[]).find(e=>e.n===a), B=(ctx.room.b||[]).find(e=>e.n===b);
      if(A&&B){ const same=qs.map((_,i)=>A.a[i]===B.a[i]); const k=same.filter(Boolean).length; const msg=k>=9?'눈빛만 봐도 아는 사이':k>=7?'찰떡궁합':k>=5?'반반, 그래서 더 재밌는 사이':'서로 알아갈 게 많은 사이';
        NL.$('#rs').innerHTML=`<div class="result-big"><small>${E(a)} ♥ ${E(b)}</small><b>${k} / ${qs.length}</b><span>${msg}</span></div><ol class="list-ol">${qs.map((q,i)=>`<li><i style="background:${same[i]?'#2E9E6B':'#E2574C'}">${same[i]?'O':'X'}</i><span style="flex:1">${E(q[0])}</span><small>${E(q[1+A.a[i]]||'-')} / ${E(q[1+B.a[i]]||'-')}</small></li>`).join('')}</ol>`; }
      else NL.$('#rs').innerHTML=`<div class="hud"><div><small>진행</small><b>${A?E(a)+' 완료':''}${A&&B?'':A||B?' · ':''}${B?E(b)+' 완료':''}${!A&&!B?'둘 다 아직':''}</b></div></div><p class="note">두 사람 모두 답하면 결과가 나와요. ${NL.CHAIN_NOTE}</p><div id="mg"></div>`;
      if(NL.$('#mg')) mergeBox(ctx); };
    play(); ctx.redraw(); }
});

/* ---------- 재미 테스트 링크판 ---------- */
const TESTS = {
 travel:{t:'여행 스타일 테스트', types:[['계획형 탐험가','시간표까지 짜는 완벽주의 여행자. 동선이 곧 행복이에요.'],['즉흥형 모험가','발길 닿는 대로! 예상 밖 장소에서 최고의 추억을 만들어요.'],['힐링형 휴양가','좋은 숙소와 늦잠이면 충분. 쉬는 게 여행의 목적이에요.'],['맛집형 미식가','여행지는 먹으러 가는 곳. 동선은 맛집이 정해요.']],
  qs:[['여행 전날 나는?',['일정표 최종 점검','짐도 대충, 설렘 가득','숙소 사진 다시 보기','맛집 리스트 정리']],['도착하자마자',['첫 번째 명소로 이동','일단 동네 산책','숙소 체크인 후 휴식','유명한 식당으로']],['비가 온다면',['플랜B 실내 코스로','비 오는 거리도 낭만','숙소에서 뒹굴뒹굴','따뜻한 국물 맛집 검색']],['기념품은',['미리 정해둔 것','우연히 본 특이한 것','편한 잠옷이나 향초','현지 간식·식재료']],
   ['사진첩에 가장 많은 건',['랜드마크 인증샷','골목·풍경 사진','숙소·노을 사진','음식 사진']],['여행 메이트는',['계획 맡겨주는 친구','어디든 같이 가는 친구','조용히 쉬는 친구','잘 먹는 친구']],['마지막 날 밤',['다음 여행 계획 세우기','못 가본 곳 즉흥 방문','스파·마사지','야식 투어']],['여행이 좋았던 이유',['계획대로 다 해서','예상 못 한 일이 생겨서','푹 쉬어서','다 맛있어서']]]},
 work:{t:'업무 스타일 테스트', types:[['추진형 리더','목표가 보이면 먼저 움직여요. 팀에 속도를 붙이는 사람.'],['꼼꼼한 설계자','디테일과 순서를 챙겨요. 실수를 미리 막는 사람.'],['분위기 메이커','팀의 에너지를 올려요. 회의가 즐거워지는 사람.'],['든든한 해결사','문제가 생기면 찾게 되는 사람. 조용히 다 해결해요.']],
  qs:[['새 프로젝트를 받으면',['일단 시작하고 본다','계획표부터 짠다','팀원들과 이야기부터','막힐 부분을 미리 찾는다']],['회의에서 나는',['결론을 낸다','기록하고 정리한다','분위기를 띄운다','필요할 때 핵심만']],['마감 하루 전',['몰아서 끝낸다','이미 끝나 있다','다 같이 야식 시킨다','남의 일까지 도와준다']],['메신저 스타일',['짧고 빠르게','정리된 긴 글','이모티콘 필수','필요한 말만 정확히']],
   ['칭찬받고 싶은 말',['역시 추진력!','꼼꼼해서 믿음 가','너 덕분에 즐거워','너 아니면 못 했어']],['스트레스 풀 때',['운동','정리정돈','친구 만나기','혼자 게임·취미']],['팀에 문제가 생기면',['방향을 다시 정한다','원인부터 분석한다','다들 괜찮은지 챙긴다','직접 해결책을 만든다']],['나의 책상은',['필요한 것만 딱','라벨까지 정리','간식과 소품 가득','남들은 모르는 나만의 질서']]]},
 love:{t:'연애 유형 테스트', types:[['직진형','좋으면 바로 표현! 솔직함이 최고의 무기예요.'],['배려형','상대의 하루를 먼저 챙겨요. 다정함이 기본값.'],['츤데레형','겉으론 무심해도 속으론 다 챙기는 타입.'],['친구같은형','편하고 웃긴 사이가 최고. 오래가는 연애를 해요.']],
  qs:[['호감이 생기면',['바로 티 낸다','조용히 챙겨준다','오히려 장난친다','친구처럼 다가간다']],['연락 스타일',['자주, 먼저','상대에 맞춰서','용건만, 그런데 빨리','수다 떨듯 편하게']],['데이트 코스는',['내가 정해서 리드','상대가 좋아하는 곳','관심 없는 척 다 알아봄','즉흥 맛집 탐방']],['서운할 때',['바로 말한다','먼저 이유를 생각해본다','티 안 내다가 툭','농담처럼 말한다']],
   ['기념일 선물',['크게 깜짝 이벤트','갖고 싶다던 걸 기억해서','"그냥 지나가다 샀어"','웃긴 편지와 소소한 선물']],['애정 표현은',['말로 자주','행동으로','가끔, 진하게','장난 속에']],['싸운 뒤엔',['먼저 사과','상대 기분부터 살핌','시간 지나 슬쩍 풀기','맛있는 거 먹으며 화해']],['이상적인 관계는',['뜨겁게 사랑하는 사이','서로 기대는 사이','말 안 해도 아는 사이','평생 친구 같은 사이']]]}
};
NL.reg({ id:'funtest', cat:'fun', name:'재미 테스트 링크판', desc:'여행·업무·연애 유형 방 통계', bg:'#EFE4FF', glyph:'TEST',
  long:'8문제로 보는 재미 유형 테스트. 각자 결과를 올리면 우리 방 유형 분포가 나와요.',
  defTitle:'우리 방 유형 테스트',
  fields:[{k:'test', type:'select', label:'테스트', def:'travel', opts:Object.keys(TESTS).map(k=>[k,TESTS[k].t])}],
  build(v){ return {test: v.test in TESTS ? v.test : 'travel'}; },
  inviteMsg: r => `[${r.ti}] ${TESTS[r.d.test].t}! 8문제로 너의 유형은?`,
  promo:{t:'원조는 키오스크 "재미 테스트 5종"', d:'결과 카드 출력되는 심리·성향 테스트 키오스크'},
  render(ctx){ const T=TESTS[ctx.room.d.test]; let qi=0; const sc=[0,0,0,0];
    ctx.el.innerHTML=`<div class="stage" id="play"></div><div id="after"></div><div class="stage" id="rs"></div>`;
    const play=()=>{ const p=NL.$('#play'); if(qi>=T.qs.length){ const k=sc.indexOf(Math.max(...sc)); NL.beep(990,.3);
        p.innerHTML=`<div class="fcard"><span style="color:#D9B76A;font-weight:700">${E(T.t)}</span><h3>${E(T.types[k][0])}</h3><p>${E(T.types[k][1])}</p></div><button class="btn" id="sb">결과 올리고 링크 받기</button><button class="btn sub" id="re">다시 하기</button>`;
        NL.$('#sb').onclick=()=>NL.submit(ctx,{a:k},(nr,n)=>`[${nr.ti}] ${n}는 "${T.types[k][0]}"! 너는?`); NL.$('#re').onclick=()=>{ qi=0; sc.fill(0); play(); }; return; }
      const [q,opts]=T.qs[qi]; const ord=NL.shuffle([0,1,2,3], Math.random);
      p.innerHTML=`<p class="balq num">${qi+1} / ${T.qs.length}</p><h2 style="font-size:19px">${E(q)}</h2><div class="opt">${ord.map(k=>`<button data-k="${k}">${E(opts[k])}</button>`).join('')}</div>`;
      NL.$$('.opt button',p).forEach(b=>b.onclick=async()=>{ sc[+b.dataset.k]++; b.setAttribute('aria-pressed','true'); NL.beep(600,.04); await NL.sleep(200); qi++; play(); }); };
    ctx.redraw=()=>{ const b=ctx.room.b||[]; const c=T.types.map(()=>[]); b.forEach(e=>c[e.a]&&c[e.a].push(e.n)); const mx=Math.max(1,...c.map(x=>x.length));
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>우리 방 유형 분포</small><b>${b.length}명 참여</b></div></div>${T.types.map((t,i)=>`<div class="bar ${c[i].length===mx&&b.length?'best':''}"><div class="bt"><span>${E(t[0])}</span><span class="num">${c[i].length}명</span></div><div class="bb"><i style="width:${c[i].length/mx*100}%"></i></div>${c[i].length?`<span class="who">${c[i].map(E).join(', ')}</span>`:''}</div>`).join('')}<p class="note">재미로 보는 테스트예요. ${NL.CHAIN_NOTE}</p><div id="mg"></div>`; mergeBox(ctx); };
    play(); ctx.redraw(); }
});
})();
