/* 파티: 복불복 카드·라이어·마피아·비밀 미션·눈치게임·금지어·빙고·최저 유일 숫자·그림 릴레이 */
(function(){
'use strict';
const E = NL.esc;
const needNames = (names, min, max) => { const n=NL.uniq(names); if(n.length<min) throw `참가자를 ${min}명 이상 넣어 주세요`; if(n.length>max) throw `참가자는 최대 ${max}명까지예요`; return n; };
const NAMES_DEF = ['민수','지연','현우','소희','대리님','과장님'];

/* ---------- 복불복 카드 뒤집기 ---------- */
NL.reg({ id:'flipcard', cat:'decide', name:'복불복 카드 뒤집기', desc:'카드 골라 벌칙·면제 공개', bg:'#FBE7E5', glyph:'?!',
  long:'카드 뒤에 벌칙과 면제를 숨겨요. 순서대로 한 장씩 골라 뒤집으세요. 카드 배치는 링크를 연 모두에게 같아요.',
  defTitle:'복불복 한 판',
  fields:[{k:'items', type:'list', label:'카드 내용 (2~30장)', ph:'한 줄에 한 장', def:['벌칙: 노래 한 소절','면제','면제','벌칙: 커피 쏘기','면제','면제','벌칙: 성대모사','면제']}],
  build(v){ const items=v.items.slice(0,30); if(items.length<2) throw '카드를 2장 이상 넣어 주세요'; return {items}; },
  promo:{t:'행사장 복불복 이벤트', d:'오늘의 행운뽑기·럭키 경품 추첨기 키오스크'},
  render(ctx){ const deal=NL.shuffle(ctx.room.d.items, NL.rng(ctx.room.s));
    ctx.el.innerHTML=`<div class="stage"><p class="lead">카드를 한 장씩 골라 뒤집으세요.</p><div class="slip" id="fc">${deal.map((_,i)=>`<button type="button" data-i="${i}"><b style="font-size:22px">${i+1}</b><small>뒤집기</small></button>`).join('')}</div><button class="btn sub" id="all">모두 공개</button></div>`;
    const open=(i,q)=>{ const b=NL.$(`#fc [data-i="${i}"]`); if(b.classList.contains('open')) return; const v=deal[i]; const bad=/벌칙|당첨|꽝/.test(v)&&!/면제/.test(v); b.classList.add('open'); if(bad) b.classList.add('win'); b.innerHTML=`<small>${i+1}번</small><b style="font-size:15px;line-height:1.3">${E(v)}</b>`; if(!q){ NL.beep(bad?300:880,.15); NL.vibrate(bad?[60,40,60]:30); } };
    NL.$$('#fc button').forEach(b=>b.onclick=()=>open(+b.dataset.i)); NL.$('#all').onclick=async()=>{ if(await NL.confirm('모든 카드를 공개할까요?','','모두 공개')) deal.forEach((_,i)=>open(i,true)); }; }
});

/* ---------- 라이어 게임 ---------- */
const LIAR = {
  음식:['김치찌개','떡볶이','삼겹살','비빔밥','짜장면','피자','치킨','초밥','라면','햄버거','냉면','족발'],
  동물:['고양이','강아지','호랑이','코끼리','기린','펭귄','토끼','원숭이','판다','돌고래','사자','다람쥐'],
  장소:['학교','병원','공항','편의점','놀이공원','찜질방','도서관','해수욕장','영화관','PC방','캠핑장','지하철'],
  직업:['선생님','의사','소방관','경찰관','요리사','가수','유튜버','택배기사','미용사','변호사','배우','농부'],
  스포츠:['축구','야구','농구','배구','수영','태권도','볼링','탁구','골프','스키','마라톤','배드민턴']
};
NL.reg({ id:'liar', cat:'party', name:'라이어 게임', desc:'한 명만 제시어를 몰라요', bg:'#E8E9EE', glyph:'L',
  long:'각자 이름을 눌러 제시어를 확인해요. 라이어 한 명만 제시어 대신 "라이어"가 떠요. 돌아가며 설명하고 라이어를 찾아내세요.',
  defTitle:'라이어 게임',
  fields:[{k:'names', type:'list', label:'참가자 (3~15명)', ph:'한 줄에 한 명', def:NAMES_DEF.slice(0,5)},
    {k:'cat', type:'select', label:'주제', def:'음식', opts:Object.keys(LIAR).map(k=>[k,k])}],
  build(v){ return {names:needNames(v.names,3,15), cat:v.cat in LIAR?v.cat:'음식'}; },
  promo:{t:'단체 파티 스크린 게임', d:'MT·워크숍·동창회용 대형화면 단체 게임 키오스크'},
  render(ctx){ const {names,cat}=ctx.room.d; const r=NL.rng(ctx.room.s); const word=LIAR[cat][Math.floor(r()*LIAR[cat].length)]; const liar=Math.floor(r()*names.length); const first=Math.floor(r()*names.length);
    ctx.el.innerHTML=`<div class="stage"><div class="hud"><div><small>주제</small><b>${E(cat)}</b></div><div><small>설명 시작</small><b style="font-size:18px">${E(names[first])}부터</b></div></div><p class="note">한 사람씩 제시어를 한 문장으로 설명하고, 다 돌면 라이어를 지목하세요. 라이어는 정답을 맞히면 역전승!</p><button class="btn sub" id="ans">정답 공개 (게임 끝난 뒤)</button></div>`;
    NL.secretPick(ctx, names, i => i===liar ? `<h3 style="font-size:34px;color:#E2574C">당신은 라이어</h3><p class="lead">주제는 ${E(cat)}. 들키지 말고 제시어를 알아내세요</p>` : `<p class="lead">제시어</p><h3 style="font-size:36px;color:#B68A36">${E(word)}</h3>`);
    NL.$('#ans').onclick=async()=>{ if(!await NL.confirm('정답을 공개할까요?','게임이 끝난 뒤에 눌러주세요.','공개')) return; NL.reveal('정답',`<p class="lead">제시어 <b>${E(word)}</b></p><h3 style="font-size:28px">라이어는 ${E(names[liar])}</h3>`,'닫기'); }; }
});

/* ---------- 마피아 ---------- */
const ROLE = {mafia:['마피아','#E2574C','밤마다 한 명을 지목해요. 다른 마피아와 몰래 눈빛을 맞추세요.'], police:['경찰','#3B7DD8','밤마다 한 명이 마피아인지 사회자에게 물어볼 수 있어요.'], doctor:['의사','#2E9E6B','밤마다 한 명을 살릴 수 있어요. 자기 자신도 가능해요.'], citizen:['시민','#596579','토론으로 마피아를 찾아내세요.']};
NL.reg({ id:'mafia', cat:'party', name:'마피아', desc:'역할 배정 + 사회자 진행표', bg:'#FBE3E1', glyph:'M',
  long:'각자 이름을 눌러 역할을 확인해요. 사회자 진행표와 토론 타이머가 함께 있어요. 4~20명.',
  defTitle:'마피아 게임',
  fields:[{k:'names', type:'list', label:'참가자 (4~20명, 사회자 제외)', ph:'한 줄에 한 명', def:NAMES_DEF},{k:'mc', type:'text', label:'사회자 (선택)', def:'', max:12}],
  build(v){ return {names:needNames(v.names,4,20), mc:v.mc.slice(0,12)}; },
  promo:{t:'워크숍 단체 게임 패키지', d:'대형화면 진행 + 역할 카드 출력까지, 행사용 게임 키오스크'},
  render(ctx){ const {names,mc}=ctx.room.d; const n=names.length; const m=n>=12?3:n>=7?2:1; const roles=[...Array(m)].map(()=>'mafia'); roles.push('police'); if(n>=5) roles.push('doctor'); while(roles.length<n) roles.push('citizen');
    const deal=NL.shuffle(roles, NL.rng(ctx.room.s)); const maf=names.filter((_,i)=>deal[i]==='mafia');
    ctx.el.innerHTML=`<div class="stage"><div class="hud"><div><small>구성</small><b style="font-size:17px">마피아 ${m} · 경찰 1${n>=5?' · 의사 1':''} · 시민 ${n-m-1-(n>=5?1:0)}</b></div></div>
      <details><summary style="font-weight:700;cursor:pointer">사회자 진행표${mc?` (${E(mc)})`:''}</summary><ol class="list-ol" style="margin-top:8px">${['모두 눈을 감아요','마피아 눈 뜨고 지목할 사람 정하기','의사 눈 뜨고 살릴 사람 정하기','경찰 눈 뜨고 조사할 사람 정하기 (사회자가 맞다/아니다 손짓)','아침이 됐어요. 밤 결과 발표','토론 시간 (아래 타이머)','투표로 한 명 지목 → 최후 변론 → 처형 여부','마피아 수 ≥ 시민 수면 마피아 승, 마피아가 모두 나가면 시민 승'].map((t,i)=>`<li><i>${i+1}</i><span>${t}</span></li>`).join('')}</ol></details>
      <div class="row"><button class="btn sub sm" style="flex:1" data-t="60">토론 1분</button><button class="btn sub sm" style="flex:1" data-t="180">토론 3분</button><button class="btn sub sm" style="flex:1" data-t="30">변론 30초</button></div><p class="result-big" id="tm" hidden><b class="num" id="tmv"></b></p>
      <button class="btn sub" id="ans">전체 역할 공개 (게임 끝난 뒤)</button></div>`;
    let iv=null; NL._stop=()=>clearInterval(iv);
    NL.$$('[data-t]').forEach(b=>b.onclick=()=>{ clearInterval(iv); let s=+b.dataset.t; const tm=NL.$('#tm'), v=NL.$('#tmv'); tm.hidden=false; const f=()=>{ v.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; if(s<=0){ clearInterval(iv); NL.beep(880,.6); NL.vibrate([200,100,200]); v.textContent='시간 끝!'; } else if(s<=5) NL.beep(600,.05); s--; }; f(); iv=setInterval(f,1000); });
    NL.secretPick(ctx, names, i => { const [nm,col,desc]=ROLE[deal[i]]; return `<p class="lead">당신의 역할</p><h3 style="font-size:40px;color:${col}">${nm}</h3><p class="lead">${desc}</p>${deal[i]==='mafia'&&maf.length>1?`<p class="note">같은 편 마피아: ${maf.filter(x=>x!==names[i]).map(E).join(', ')}</p>`:''}`; });
    NL.$('#ans').onclick=async()=>{ if(!await NL.confirm('전체 역할을 공개할까요?','게임이 끝난 뒤에 눌러주세요.','공개')) return; NL.reveal('전체 역할',`<ol class="list-ol" style="text-align:left">${names.map((nm,i)=>`<li><i style="background:${ROLE[deal[i]][1]}">${ROLE[deal[i]][0][0]}</i><span style="flex:1">${E(nm)}</span><b>${ROLE[deal[i]][0]}</b></li>`).join('')}</ol>`,'닫기'); }; }
});

/* ---------- 비밀 미션 뽑기 ---------- */
const MISSIONS = ['대화 중에 아무나 "대박"이라고 말하게 만들기','누군가에게 진심 담은 칭찬 두 번 하기','단체 사진에서 몰래 브이 하기','다른 사람이 "진짜?"라고 말하게 만들기','누군가에게 물 한 잔 따라 주기',
 '대화 중에 영화 제목 세 개 자연스럽게 말하기','옆 사람과 하이파이브 한 번 하기','누군가의 옷이나 신발 칭찬하기','"아무튼"으로 시작하는 말 세 번 하기','누군가 웃게 만들기 (빵 터지게)',
 '모임 중에 노래 한 소절 흥얼거리기','다른 사람에게 질문 다섯 번 하기','누군가에게 "오늘 좋아 보인다"고 말하기','건배를 한 번 제안하기','다른 사람의 말에 "맞아 맞아" 세 번 맞장구치기',
 '대화 중 동물 이름 세 개 말하기','누군가에게 다음 약속 날짜 물어보기','숫자 7이 들어간 말 두 번 하기','누군가의 이름을 다섯 번 불러주기','사진 한 장 찍자고 제안하기',
 '대화 중에 "역시"라는 말 세 번 하기','누군가에게 추천 맛집 물어보기','다른 사람이 핸드폰을 보게 만들기','모임 장소 칭찬하기','누군가에게 고맙다고 말하기'];
NL.reg({ id:'mission', cat:'party', name:'비밀 미션 뽑기', desc:'각자 다른 미션, 마지막에 공개', bg:'#ECEFE4', glyph:'임무',
  long:'각자 이름을 눌러 비밀 미션을 확인해요. 모임이 끝날 때 누가 성공했는지 공개하세요. 미션은 직접 넣을 수도 있어요.',
  defTitle:'오늘의 비밀 미션',
  fields:[{k:'names', type:'list', label:'참가자 (2~30명)', ph:'한 줄에 한 명', def:NAMES_DEF.slice(0,5)},{k:'own', type:'list', label:'우리 방 미션 (선택)', ph:'한 줄에 하나', def:[], itemMax:60, help:'비워두면 기본 미션 25개 중에서 뽑아요'}],
  build(v){ const names=needNames(v.names,2,30); const own=v.own.slice(0,40); if(own.length && own.length<names.length) throw `미션을 참가자 수(${names.length}개) 이상 넣어 주세요`; return {names, own}; },
  promo:{t:'행사장 미션 여권', d:'부스를 돌며 미션을 완료하는 행사 운영 패키지'},
  render(ctx){ const {names,own}=ctx.room.d; const pool=own&&own.length?own:MISSIONS; const deal=NL.shuffle(pool, NL.rng(ctx.room.s));
    ctx.el.innerHTML=`<div class="stage"><button class="btn sub" id="ans">전체 미션 공개 (모임 끝날 때)</button></div>`;
    NL.secretPick(ctx, names, i => `<p class="lead">비밀 미션</p><h3 style="font-size:22px;line-height:1.45;color:#B68A36;word-break:keep-all">${E(deal[i%deal.length])}</h3><p class="lead">들키지 않게 성공해 보세요</p>`);
    NL.$('#ans').onclick=async()=>{ if(!await NL.confirm('모든 미션을 공개할까요?','','공개')) return; NL.reveal('전체 미션',`<ol class="list-ol" style="text-align:left">${names.map((nm,i)=>`<li><i>${i+1}</i><span><b>${E(nm)}</b><br><small>${E(deal[i%deal.length])}</small></span></li>`).join('')}</ol>`,'닫기'); }; }
});

/* ---------- 금지어 인터뷰 ---------- */
const BANNED = ['진짜','대박','근데','아니','헐','그러니까','솔직히','완전','약간','일단','아 맞다','어떡해','그치','혹시','잠깐','사실','그냥','왜','좋아','맞아','오케이','미안','고마워','네'];
NL.reg({ id:'forbidden', cat:'party', name:'금지어 게임', desc:'남의 금지어는 보이고 내 건 몰라요', bg:'#FBE7E5', glyph:'금지',
  long:'모두 각자 금지어가 있어요. 내 이름을 누르면 "다른 사람들"의 금지어가 보이고 내 건 안 보여요. 대화하며 상대가 금지어를 말하게 만드세요!',
  defTitle:'금지어 게임',
  fields:[{k:'names', type:'list', label:'참가자 (3~20명)', ph:'한 줄에 한 명', def:NAMES_DEF.slice(0,5)}],
  build(v){ return {names:needNames(v.names,3,20)}; },
  promo:{t:'파티 스크린 게임', d:'단체 행사용 대형화면 게임 프로그램'},
  render(ctx){ const {names}=ctx.room.d; const deal=NL.shuffle(BANNED, NL.rng(ctx.room.s));
    ctx.el.innerHTML=`<div class="stage"><p class="note">금지어를 말하면 탈락! 마지막까지 남은 사람이 승리.</p><button class="btn sub" id="ans">내 금지어 확인 (탈락한 뒤)</button></div>`;
    NL.secretPick(ctx, names, i => `<p class="lead">다른 사람들의 금지어</p><ol class="list-ol" style="text-align:left">${names.map((nm,k)=>k===i?'':`<li><i>${k+1}</i><span style="flex:1">${E(nm)}</span><b style="color:#E2574C">${E(deal[k])}</b></li>`).join('')}</ol><p class="lead">내 금지어는 비밀!</p>`);
    NL.$('#ans').onclick=async()=>{ const sel=await new Promise(res=>{ const ov=document.createElement('div'); ov.className='ov'; ov.innerHTML=`<div class="ov-c"><h3>누구의 금지어?</h3><div class="namebtns" style="justify-content:center">${names.map((nm,i)=>`<button class="pill" data-i="${i}">${E(nm)}</button>`).join('')}</div><button class="btn sub">취소</button></div>`; document.body.appendChild(ov); NL.$$('[data-i]',ov).forEach(b=>b.onclick=()=>{ov.remove();res(+b.dataset.i);}); NL.$('.btn',ov).onclick=()=>{ov.remove();res(null);}; });
      if(sel==null) return; NL.reveal(`${E(names[sel])}님의 금지어`,`<h3 style="font-size:34px;color:#E2574C">${E(deal[sel])}</h3>`,'닫기'); }; }
});

/* ---------- 눈치게임 (숫자 고르기 이어달리기) ---------- */
NL.reg({ id:'nunchi', cat:'party', name:'눈치게임', desc:'남과 겹치지 않는 숫자 고르기', bg:'#E3EEF9', glyph:'눈치', better:null,
  long:'1부터 참가자 수까지 숫자 하나를 몰래 골라요. 남과 겹치면 탈락! 겹치지 않은 사람 중 가장 큰 숫자를 고른 사람이 벌칙 (마지막에 외친 사람).',
  defTitle:'눈치게임 한 판',
  fields:[{k:'n', type:'number', label:'참가 인원', def:6, min:3, max:30}],
  build(v){ const n=Math.floor(v.n); if(!(n>=3&&n<=30)) throw '인원은 3~30명이에요'; return {n}; },
  inviteMsg: r => `[${r.ti}] 눈치게임! 1~${r.d.n} 중 숫자 하나 골라. 겹치면 탈락`,
  promo:{t:'단체 게임은 대형화면으로', d:'MT·워크숍 단체 게임 키오스크'},
  render(ctx){ const {n}=ctx.room.d; let pick=0, show=false;
    ctx.redraw=()=>{ const b=ctx.room.b||[]; const cnt={}; b.forEach(e=>cnt[e.a]=(cnt[e.a]||[]).concat(e.n)); const open = show || b.length>=n;
      let res=''; if(open){ const uniq=Object.keys(cnt).filter(k=>cnt[k].length===1).map(Number).sort((a,c)=>c-a); const lose=uniq.length?cnt[uniq[0]][0]:null;
        res=`<ol class="list-ol">${Object.keys(cnt).map(Number).sort((a,c)=>a-c).map(k=>`<li><i>${k}</i><span style="flex:1">${cnt[k].map(E).join(', ')}</span><b style="color:${cnt[k].length>1?'#E2574C':'#2E9E6B'}">${cnt[k].length>1?'겹쳐서 탈락':'생존'}</b></li>`).join('')}</ol>${lose?`<div class="result-big"><small>벌칙</small><b style="font-size:28px">${E(lose)}</b><span>살아남은 사람 중 가장 큰 숫자 ${uniq[0]}</span></div>`:(b.length?'<p class="empty">모두 겹쳤어요!</p>':'')}`; }
      NL.$('#rs').innerHTML = `<div class="hud"><div><small>참여</small><b>${b.length} / ${n}명</b></div></div>${open?res:`<p class="note">${n}명이 모두 고르면 결과가 공개돼요. 미리 보면 재미없어요!</p><button class="btn sub sm" id="rv">지금 결과 미리 보기</button>`}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`;
      const rv=NL.$('#rv'); if(rv) rv.onclick=async()=>{ if(await NL.confirm('결과를 미리 볼까요?','아직 안 고른 사람은 보면 안 돼요.','보기')){ show=true; ctx.redraw(); } };
      NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; ctx.redraw(); }); };
    ctx.el.innerHTML=`<div class="stage"><p class="lead">숫자 하나를 고르세요.</p><div class="g25" style="grid-template-columns:repeat(${Math.min(6,n)},1fr)" id="nb">${[...Array(n)].map((_,i)=>`<button data-v="${i+1}">${i+1}</button>`).join('')}</div><button class="btn" id="sb" disabled>이 숫자로 올리기</button><div id="after"></div></div><div class="stage" id="rs"></div>`;
    NL.$$('#nb button').forEach(b=>b.onclick=()=>{ pick=+b.dataset.v; NL.$$('#nb button').forEach(x=>x.style.background=x===b?'#172742':''); NL.$$('#nb button').forEach(x=>x.style.color=x===b?'#fff':''); NL.$('#sb').disabled=false; });
    NL.$('#sb').onclick=()=>NL.submit(ctx,{a:pick},(nr,nm)=>`[${nr.ti}] ${nm} 골랐어 (${nr.b.length}/${n}명). 다음 사람 이 링크로!`);
    ctx.redraw(); }
});

/* ---------- 최저 유일 숫자 ---------- */
NL.reg({ id:'lowest', cat:'party', name:'최저 유일 숫자', desc:'안 겹친 가장 작은 숫자가 승리', bg:'#F3E7CC', glyph:'1',
  long:'1~50 중 숫자 하나를 고르세요. 아무와도 겹치지 않은 숫자 중 가장 작은 숫자를 고른 사람이 승리! 1을 고르면 겹칠 확률도 높겠죠?',
  defTitle:'최저 유일 숫자 게임',
  fields:[{k:'max', type:'select', label:'숫자 범위', def:'50', opts:[['20','1~20'],['50','1~50'],['100','1~100']]}],
  build(v){ return {max:+v.max||50}; },
  inviteMsg: r => `[${r.ti}] 1~${r.d.max} 중 남과 안 겹치는 가장 작은 숫자를 고르면 승리!`,
  promo:{t:'현장 경품 심리전 이벤트', d:'행사장 참여형 이벤트 키오스크 · 당첨자 자동 선정'},
  render(ctx){ const {max}=ctx.room.d; let show=false;
    ctx.el.innerHTML=`<div class="stage"><div class="fld"><label for="lv">내 숫자 (1~${max})</label><input class="inp num" type="number" inputmode="numeric" id="lv" min="1" max="${max}" style="font-size:28px;text-align:center"></div><button class="btn" id="sb">몰래 올리기</button><div id="after"></div></div><div class="stage" id="rs"></div>`;
    ctx.redraw=()=>{ const b=ctx.room.b||[]; const cnt={}; b.forEach(e=>cnt[e.a]=(cnt[e.a]||[]).concat(e.n)); const uniq=Object.keys(cnt).filter(k=>cnt[k].length===1).map(Number).sort((a,c)=>a-c);
      NL.$('#rs').innerHTML=`<div class="hud"><div><small>참여</small><b>${b.length}명</b></div><div><small>현재 1등</small><b style="font-size:18px">${show?(uniq.length?E(cnt[uniq[0]][0])+' ('+uniq[0]+')':'없음'):'비공개'}</b></div></div>
        ${show?`<ol class="list-ol">${Object.keys(cnt).map(Number).sort((a,c)=>a-c).map(k=>`<li><i>${k}</i><span style="flex:1">${cnt[k].map(E).join(', ')}</span><b style="color:${cnt[k].length>1?'#E2574C':'#2E9E6B'}">${cnt[k].length>1?'겹침':'유일'}</b></li>`).join('')}</ol>`:`<p class="note">모두 낸 뒤 공개하세요. 링크 안에 답이 들어 있어 미리 보면 반칙이에요.</p><button class="btn sub sm" id="rv">결과 공개</button>`}
        <p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div>`;
      const rv=NL.$('#rv'); if(rv) rv.onclick=async()=>{ if(await NL.confirm('결과를 공개할까요?','아직 안 낸 사람은 보면 안 돼요.','공개')){ show=true; ctx.redraw(); } };
      NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; ctx.redraw(); }); };
    NL.$('#sb').onclick=()=>{ const v=Math.floor(+NL.$('#lv').value); if(!(v>=1&&v<=max)){ NL.toast(`1~${max} 사이 숫자를 넣어 주세요`); return; } NL.submit(ctx,{a:v},(nr,nm)=>`[${nr.ti}] ${nm} 숫자 냈어 (${nr.b.length}명). 다음 사람 이 링크로!`); };
    ctx.redraw(); }
});

/* ---------- 우리 방 빙고 ---------- */
const BINGO = ['알람 다섯 번 이상 끈 적 있다','라면 물 눈대중으로 맞춘다','택배 오면 바로 뜯는다','엘리베이터 닫힘 버튼 연타','배달 앱 하루 두 번 켠 적 있다','양말 짝짝이로 신은 적 있다',
 '단톡방 읽씹 해본 적 있다','영화 보다 잠든 적 있다','충전기 없으면 불안하다','계획 세우고 안 지킨 적 있다','카페에서 메뉴 고민 5분 이상','지하철 반대 방향 탄 적 있다',
 '셀카 50장 찍고 1장 건진다','혼밥 잘한다','노래방 18번이 있다','편의점 신상은 꼭 먹어본다','장바구니에만 담아둔 물건 있다','우산 잃어버린 적 있다','새벽 3시에 라면 먹은 적 있다','다이어트는 내일부터',
 '여행 가서 사진만 찍다 온다','핸드폰 들고 핸드폰 찾은 적 있다','주말에 하루 종일 누워 있던 적 있다','맛집 줄 30분 이상 서봤다','이어폰 한쪽 잃어버린 적 있다'];
NL.reg({ id:'bingo', cat:'party', name:'우리 방 빙고', desc:'공감 빙고, 줄 많이 맞추기', bg:'#E2F3EC', glyph:'빙고', better:'high', fmt:v=>v+'줄',
  long:'각자 이름별로 섞인 빙고판이 나와요. 나에게 해당하는 칸을 눌러 표시하고, 완성되면 줄 수를 올려요. 칸 내용은 직접 바꿀 수 있어요.',
  defTitle:'우리 방 공감 빙고',
  fields:[{k:'size', type:'select', label:'판 크기', def:'4', opts:[['3','3×3'],['4','4×4'],['5','5×5']]},{k:'own', type:'list', label:'빙고 칸 내용 (선택)', ph:'한 줄에 하나', def:[], itemMax:30, help:'비워두면 공감 빙고 기본 25칸을 써요'}],
  build(v){ const size=+v.size||4; const own=v.own; if(own.length && own.length<size*size) throw `칸 내용을 ${size*size}개 이상 넣어 주세요`; return {size, own:own.slice(0,40)}; },
  promo:{t:'부스 방문 빙고 → 행사장 미션 여권', d:'행사장 부스 투어 빙고 운영 패키지'},
  async render(ctx){ const {size,own}=ctx.room.d; const pool=own&&own.length?own:BINGO; let me=NL.myName();
    const start=async()=>{ if(!me){ me=await NL.askName('빙고판 주인 이름'); if(!me) return; } draw(); };
    const keyOf=()=>'bingo_'+ctx.room.s+'_'+me;
    const lines=m=>{ let c=0; for(let i=0;i<size;i++){ if([...Array(size)].every((_,j)=>m[i*size+j])) c++; if([...Array(size)].every((_,j)=>m[j*size+i])) c++; } if([...Array(size)].every((_,j)=>m[j*size+j])) c++; if([...Array(size)].every((_,j)=>m[j*size+size-1-j])) c++; return c; };
    const draw=()=>{ const cells=NL.shuffle(pool, NL.rng(ctx.room.s+'|'+me)).slice(0,size*size); const key=keyOf(); const mk=NL.store.get(key, []); const m=cells.map((_,i)=>!!mk[i]);
      ctx.el.innerHTML=`<div class="stage"><div class="hud"><div><small>${E(me)}님의 빙고판</small><b id="ln">${lines(m)}줄</b></div><div><button class="btn sub sm" id="who">이름 바꾸기</button></div></div>
        <div style="display:grid;grid-template-columns:repeat(${size},1fr);gap:6px" id="bg">${cells.map((c,i)=>`<button data-i="${i}" style="aspect-ratio:1;border-radius:12px;border:1.5px solid #E6E1D4;background:${m[i]?'#172742':'#fff'};color:${m[i]?'#fff':'#172742'};font-size:${size>4?11:12.5}px;font-weight:700;line-height:1.3;padding:4px;word-break:keep-all">${E(c)}</button>`).join('')}</div>
        <button class="btn" id="up">${lines(m)}줄로 기록 올리기</button><div id="after"></div></div><div class="stage"><div class="hud"><div><small>이 링크 순위</small><b>${(ctx.room.b||[]).length}명</b></div></div>${NL.boardHTML(ctx.tool, ctx.room, me)}<p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div></div>`;
      NL.$$('#bg button').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; m[i]=!m[i]; NL.store.set(key, m); const was=+NL.$('#ln').textContent.replace(/\D/g,''); const now2=lines(m); if(now2>was){ NL.beep(990,.2); NL.vibrate([50,40,50]); } else NL.beep(m[i]?600:400,.04); draw(); });
      NL.$('#who').onclick=async()=>{ const n=await NL.askName('빙고판 주인 이름'); if(n){ me=n; ctx.render2(); } };
      NL.$('#up').onclick=()=>NL.submit(ctx,{v:lines(m)},(nr,nm)=>`[${nr.ti}] ${nm} 빙고 ${lines(m)}줄! 나도 해볼 사람?`,'올렸어요! 새 링크를 방에 올려주세요',{name:me});
      NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; draw(); }); };
    ctx.render2=()=>NL.tools.bingo.render(ctx); ctx.redraw=()=>draw();
    if(!me){ ctx.el.innerHTML=`<div class="stage"><div class="howto"><p class="big">이름별로 다른 빙고판이 나와요</p><button class="btn" id="st">내 빙고판 받기</button></div></div>`; NL.$('#st').onclick=start; } else draw(); }
});

/* ---------- 그림 전달 릴레이 ---------- */
const enc = strokes => strokes.map(s=>s.map(p=>p.join(',')).join(' ')).join('|');
const dec = str => str ? str.split('|').map(s=>s.split(' ').map(p=>p.split(',').map(Number))) : [];
function paint(cv, strokes){ const g=cv.getContext('2d'); const W=cv.width; g.fillStyle='#fff'; g.fillRect(0,0,W,W); g.strokeStyle='#172742'; g.lineWidth=W/85; g.lineCap='round'; g.lineJoin='round';
  strokes.forEach(s=>{ g.beginPath(); s.forEach((p,i)=>{ const x=p[0]*W/250, y=p[1]*W/250; i?g.lineTo(x,y):g.moveTo(x,y); }); if(s.length===1){ g.lineTo(s[0][0]*W/250+.1,s[0][1]*W/250); } g.stroke(); }); }
NL.reg({ id:'relay', cat:'party', name:'그림 전달 릴레이', desc:'문장→그림→추측 이어가기', bg:'#EFE4FF', glyph:'✎', maxB:24,
  long:'첫 단어를 그림으로 그리고, 다음 사람은 그림만 보고 단어를 추측하고, 그다음 사람은 그 추측을 그려요. 마지막에 처음과 비교해 보세요!',
  defTitle:'그림 전달 릴레이',
  fields:[{k:'w', type:'text', label:'시작 제시어 (다른 사람에겐 안 보여요)', def:'치킨 먹는 고양이', max:20}],
  build(v){ if(!v.w.trim()) throw '시작 제시어를 넣어 주세요'; return {w:v.w.trim().slice(0,20)}; },
  inviteMsg: r => `[${r.ti}] 그림 릴레이 시작! 링크 누르고 이어서 그리거나 맞혀봐`,
  promo:{t:'단체 그림게임 + 사진 출력 부스', d:'행사장 대형화면 그림 게임과 결과 출력 키오스크'},
  render(ctx){ const steps=()=>ctx.room.b||[];
    const draw=()=>{ const st=steps(); const lastIdx=st.length; const needDraw = lastIdx%2===0; const prompt = lastIdx===0 ? null : st[lastIdx-1];
      ctx.el.innerHTML=`<div class="stage"><div class="hud"><div><small>지금</small><b>${lastIdx+1}번째 차례</b></div><div><small>할 일</small><b style="font-size:18px">${needDraw?'그리기':'맞히기'}</b></div></div><div id="work"></div><div id="after"></div></div>
        <div class="stage"><p class="lead">지금까지 ${lastIdx}명 참여 · ${st.map(e=>E(e.by)).join(' → ')||'아직 없음'}</p><button class="btn sub" id="all">전체 과정 공개 (끝난 뒤)</button><p class="note">${NL.CHAIN_NOTE}</p></div>`;
      const work=NL.$('#work');
      if(needDraw){ const word = lastIdx===0 ? null : prompt.v;
        work.innerHTML=`${lastIdx===0?`<p class="lead">첫 그림을 그릴 사람만 제시어를 보세요</p><button class="btn sub sm" id="peek">제시어 보기</button>`:`<p class="lead">앞 사람의 추측</p><p class="big" style="font-size:24px;text-align:center">"${E(word)}"</p>`}
          <canvas id="pad" width="500" height="500" style="width:100%;aspect-ratio:1;border-radius:14px;border:1.5px solid #E6E1D4;touch-action:none;background:#fff"></canvas><div class="row"><button class="btn sub sm" id="undo" style="flex:1">되돌리기</button><button class="btn sub sm" id="clr" style="flex:1">지우기</button></div><button class="btn" id="sb">그림 넘기기</button>`;
        if(lastIdx===0) NL.$('#peek').onclick=async()=>{ if(await NL.confirm('제시어를 볼까요?','그림 그릴 사람만 보세요.','보기')) NL.reveal('제시어',`<h3 style="font-size:28px;color:#B68A36">${E(ctx.room.d.w)}</h3>`,'외웠어요'); };
        const cv=NL.$('#pad'); const strokes=[]; let cur=null; let total=0; const pt=e=>{ const r=cv.getBoundingClientRect(); return [Math.round((e.clientX-r.left)*250/r.width), Math.round((e.clientY-r.top)*250/r.height)]; };
        paint(cv,strokes);
        cv.onpointerdown=e=>{ e.preventDefault(); if(total>900){ NL.toast('그림이 너무 복잡해요. 이제 넘겨주세요'); return; } cur=[pt(e)]; strokes.push(cur); try{ cv.setPointerCapture(e.pointerId); }catch(_){} paint(cv,strokes); };
        cv.onpointermove=e=>{ if(!cur) return; const p=pt(e), l=cur[cur.length-1]; if(Math.hypot(p[0]-l[0],p[1]-l[1])<4) return; cur.push(p); total++; paint(cv,strokes); };
        cv.onpointerup=cv.onpointercancel=()=>{ cur=null; };
        NL.$('#undo').onclick=()=>{ strokes.pop(); paint(cv,strokes); }; NL.$('#clr').onclick=()=>{ strokes.length=0; total=0; paint(cv,strokes); };
        NL.$('#sb').onclick=async()=>{ if(!strokes.length){ NL.toast('그림을 그려주세요'); return; } const name=await NL.askName('이름을 알려주세요'); if(!name) return;
          await NL.submit(ctx,{n:'#'+lastIdx, k:'draw', v:enc(strokes), by:name},(nr)=>`[${nr.ti}] ${name} 그림 완성! 다음 사람은 무슨 그림인지 맞혀봐`,'넘겼어요! 새 링크를 방에 올려주세요',{name}); NL.$('#sb').hidden=true; };
      } else {
        work.innerHTML=`<p class="lead">앞 사람의 그림을 보고 뭔지 맞혀보세요</p><canvas id="see" width="500" height="500" style="width:100%;aspect-ratio:1;border-radius:14px;border:1.5px solid #E6E1D4"></canvas><input class="inp" id="gs" maxlength="20" placeholder="무슨 그림일까?"><button class="btn" id="sb">추측 넘기기</button>`;
        paint(NL.$('#see'), dec(prompt.v));
        NL.$('#sb').onclick=async()=>{ const g=NL.$('#gs').value.trim(); if(!g){ NL.toast('추측을 적어주세요'); return; } const name=await NL.askName('이름을 알려주세요'); if(!name) return;
          await NL.submit(ctx,{n:'#'+lastIdx, k:'text', v:g.slice(0,20), by:name},(nr)=>`[${nr.ti}] ${name} 추측 완료! 다음 사람은 그 말을 그림으로`,'넘겼어요! 새 링크를 방에 올려주세요',{name}); NL.$('#sb').hidden=true; }; }
      NL.$('#all').onclick=async()=>{ if(!await NL.confirm('전체 과정을 공개할까요?','마지막 사람까지 끝난 뒤에 눌러주세요.','공개')) return;
        const ov=document.createElement('div'); ov.className='ov'; ov.innerHTML=`<div class="ov-c" style="max-height:86vh;overflow:auto;text-align:left"><h3>처음 → 끝</h3><p class="lead">시작 제시어 <b>${E(ctx.room.d.w)}</b></p>${steps().map((e,i)=>`<div style="display:flex;flex-direction:column;gap:6px"><small style="color:#596579">${i+1}. ${E(e.by)} ${e.k==='draw'?'그림':'추측'}</small>${e.k==='draw'?`<canvas data-i="${i}" width="400" height="400" style="width:100%;aspect-ratio:1;border-radius:12px;border:1px solid #E6E1D4"></canvas>`:`<b style="font-size:20px">"${E(e.v)}"</b>`}</div>`).join('')}<button class="btn">닫기</button></div>`;
        document.body.appendChild(ov); NL.$$('canvas',ov).forEach(c=>paint(c, dec(steps()[+c.dataset.i].v))); NL.$('.btn',ov).onclick=()=>ov.remove(); };
    };
    ctx.redraw=()=>{}; draw(); }
});
})();
