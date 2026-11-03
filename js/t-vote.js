/* 투표: 빠른 투표·밸런스게임·약속 날짜 (이어달리기 링크 방식) */
(function(){
'use strict';
const E = NL.esc;
const CHAIN_NOTE = '이 링크에 담긴 결과예요. 참여한 뒤 받은 새 링크를 방에 다시 올려주세요. 링크가 갈라지면 아래 "기록 합치기"로 합칠 수 있어요.';
const voters = b => (b||[]).map(e=>e.n);

async function submit(ctx, entry, msg){
  const name = await NL.askName('이름을 알려주세요'); if(!name) return;
  entry.n = name; entry.at = Date.now();
  const nr = NL.withEntry(ctx.tool, ctx.room, entry);
  const box = NL.$('#after'); box.innerHTML='';
  await ctx.shareRoom(box, nr, msg(nr, name), '참여 완료! 새 링크를 방에 다시 올려주세요');
  ctx.room = nr; ctx.redraw && ctx.redraw(name);
  box.scrollIntoView({behavior:'smooth', block:'center'});
}

/* ---------- 빠른 투표 ---------- */
NL.reg({ id:'poll', cat:'vote', name:'빠른 투표', desc:'메뉴·장소·회식 정하기', bg:'#E7EDF8', icon:'poll',
  long:'질문과 선택지를 넣으세요. 투표한 사람은 결과가 더해진 새 링크를 방에 올립니다.',
  defTitle:'회식 장소 투표',
  fields:[
    {k:'q', type:'text', label:'질문', def:'금요일 회식 어디로 갈까요?', max:60},
    {k:'opts', type:'list', label:'선택지 (2~10개)', ph:'한 줄에 하나', def:['삼겹살','횟집','중식','치킨']},
    {k:'multi', type:'select', label:'선택 방식', def:'1', opts:[['1','하나만 고르기'],['m','여러 개 고르기']]}
  ],
  build(v){ const opts=NL.uniq(v.opts); if(opts.length<2) throw '선택지를 2개 이상 넣어 주세요'; if(opts.length>10) throw '선택지는 10개까지예요'; return {q:v.q.slice(0,60)||'투표', opts, multi:v.multi==='m'}; },
  promo:{t:'행사장 현장 투표도 화면으로', d:'만족도 설문 쿠폰·브랜드 OX 퀴즈 키오스크로 참여와 데이터를 같이'},
  render(ctx){
    const {q,opts,multi}=ctx.room.d; let pick=new Set();
    ctx.el.innerHTML=`<div class="stage"><h2 style="font-size:19px">${E(q)}</h2><p class="lead">${multi?'여러 개 골라도 돼요':'하나만 골라주세요'}</p>
      <div class="opt" id="op">${opts.map((o,i)=>`<button type="button" data-i="${i}" aria-pressed="false">${E(o)}</button>`).join('')}</div>
      <button class="btn" id="vt" disabled>투표하기</button><div id="after"></div></div>
      <div class="stage"><div class="hud"><div><small>지금까지</small><b id="vc"></b></div></div><div id="rs" class="board"></div><p class="note">${CHAIN_NOTE}</p><div id="mg"></div></div>`;
    NL.$$('#op button').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; if(multi){ pick.has(i)?pick.delete(i):pick.add(i); } else pick=new Set([i]);
      NL.$$('#op button').forEach(x=>x.setAttribute('aria-pressed', pick.has(+x.dataset.i))); NL.$('#vt').disabled=!pick.size; });
    ctx.redraw = (me) => { const b=ctx.room.b||[]; const cnt=opts.map(()=>[]); b.forEach(e=>(e.a||[]).forEach(i=>cnt[i]&&cnt[i].push(e.n)));
      const mx=Math.max(1,...cnt.map(c=>c.length)); NL.$('#vc').textContent=`${b.length}명 참여`;
      NL.$('#rs').innerHTML = opts.map((o,i)=>`<div class="bar ${cnt[i].length===mx&&b.length?'best':''}"><div class="bt"><span>${E(o)}</span><span class="num">${cnt[i].length}표</span></div><div class="bb"><i style="width:${b.length?cnt[i].length/mx*100:0}%"></i></div>${cnt[i].length?`<span class="who">${cnt[i].map(E).join(', ')}</span>`:''}</div>`).join('');
      NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; ctx.redraw(); }); };
    ctx.redraw();
    NL.$('#vt').onclick = () => submit(ctx, {a:[...pick].sort()}, (nr,n)=>`[${nr.ti}] ${n}님 투표 완료, 지금 ${nr.b.length}명 참여. 다음 사람 이 링크로 투표!`);
  }
});

/* ---------- 밸런스게임 ---------- */
NL.reg({ id:'balance', cat:'vote', name:'우리 방 밸런스게임', desc:'질문 직접 만들고 비율 확인', bg:'#FBE7E5', icon:'balance',
  long:'"A / B" 형식으로 질문을 넣으세요. 다 고른 사람은 우리 방 선택 비율을 볼 수 있어요.',
  defTitle:'우리 방 밸런스게임',
  fields:[{k:'qs', type:'list', label:'질문 (1~10개, "A / B")', ph:'평생 라면만 / 평생 치킨만', itemMax:60,
    def:['평생 라면만 먹기 / 평생 치킨만 먹기','여름에 히터 / 겨울에 에어컨','연락 자주 하는 애인 / 연락 안 하는 애인','월 300 백수 / 월 1000 직장인']}],
  build(v){ const qs=v.qs.map(s=>s.split('/').map(x=>x.trim())).filter(p=>p.length>=2&&p[0]&&p[1]).map(p=>[p[0].slice(0,28),p[1].slice(0,28)]).slice(0,10); if(!qs.length) throw '"A / B" 형식으로 질문을 넣어 주세요'; return {qs}; },
  promo:{t:'커플·워크숍엔 대형화면 밸런스 퀴즈', d:'커플 밸런스 퀴즈 키오스크로 둘이 같은 답을 골랐는지 바로 확인'},
  render(ctx){
    const {qs}=ctx.room.d; const ans=qs.map(()=>-1); let qi=0;
    ctx.el.innerHTML=`<div class="stage" id="play"></div><div id="after"></div><div class="stage"><div class="hud"><div><small>지금까지</small><b id="vc"></b></div></div><div id="rs" style="display:flex;flex-direction:column;gap:14px"></div><p class="note">${CHAIN_NOTE}</p><div id="mg"></div></div>`;
    const play = () => { const p=NL.$('#play');
      if(qi>=qs.length){ p.innerHTML=`<p class="howto big" style="text-align:center">다 골랐어요!</p><button class="btn" id="sb">결과 올리고 링크 받기</button><button class="btn sub" id="re">다시 고르기</button>`;
        NL.$('#sb').onclick=()=>submit(ctx,{a:ans.slice()},(nr,n)=>`[${nr.ti}] ${n}님 답 완료! 나랑 같은 선택 한 사람은? 이 링크로 참여`);
        NL.$('#re').onclick=()=>{ qi=0; ans.fill(-1); play(); }; return; }
      p.innerHTML=`<p class="balq num">${qi+1} / ${qs.length}</p><div class="bal">${qs[qi].map((o,k)=>`<button type="button" data-k="${k}" aria-pressed="${ans[qi]===k}">${E(o)}</button>`).join('')}</div>`;
      NL.$$('.bal button',p).forEach(b=>b.onclick=async()=>{ ans[qi]=+b.dataset.k; b.setAttribute('aria-pressed','true'); NL.beep(600+ans[qi]*200,.06); await NL.sleep(220); qi++; play(); }); };
    ctx.redraw = () => { const b=ctx.room.b||[]; NL.$('#vc').textContent=`${b.length}명 참여`;
      NL.$('#rs').innerHTML = qs.map((q,i)=>{ const A=b.filter(e=>e.a&&e.a[i]===0), B=b.filter(e=>e.a&&e.a[i]===1); const t=A.length+B.length; const pa=t?Math.round(A.length/t*100):50;
        return `<div class="bar"><span class="balq">${i+1}. ${E(q[0])} vs ${E(q[1])}</span><div class="split num"><span style="width:${t?Math.max(pa,14):50}%">${t?pa+'%':''}</span><span style="width:${t?Math.max(100-pa,14):50}%">${t?(100-pa)+'%':''}</span></div>${t?`<span class="who">A: ${A.map(e=>E(e.n)).join(', ')||'-'} · B: ${B.map(e=>E(e.n)).join(', ')||'-'}</span>`:''}</div>`; }).join('');
      NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; ctx.redraw(); }); };
    play(); ctx.redraw();
  }
});

/* ---------- 약속 날짜 ---------- */
const DW=['일','월','화','수','목','금','토'];
const ymd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today = () => ymd(new Date());
const plus = (s,n) => { const d=new Date(s+'T00:00:00'); d.setDate(d.getDate()+n); return ymd(d); };
NL.reg({ id:'date', cat:'vote', name:'약속 날짜 맞추기', desc:'되는 날 모아 확정', bg:'#ECEFE4', icon:'date',
  long:'기간을 정하면 각자 되는 날을 눌러요. 가장 많이 되는 날이 금색으로 표시됩니다.',
  defTitle:'동창 모임 날짜',
  fields:[
    {k:'from', type:'date', label:'시작일', def:today()},
    {k:'to', type:'date', label:'종료일', def:plus(today(),20), help:'최대 42일'}
  ],
  build(v){ if(!v.from||!v.to) throw '날짜를 골라 주세요'; const a=new Date(v.from+'T00:00:00'), b=new Date(v.to+'T00:00:00'); const days=Math.round((b-a)/864e5)+1; if(days<1) throw '종료일이 시작일보다 빨라요'; if(days>42) throw '기간은 42일까지예요'; return {from:v.from, days}; },
  promo:{t:'모임 날 정했으면 포토부스도', d:'동창회·돌잔치·사내행사에 미러 포토부스와 AI 사진 키오스크 대여'},
  render(ctx){
    const {from,days}=ctx.room.d; const list=[...Array(days)].map((_,i)=>plus(from,i)); const pick=new Set();
    const first=new Date(from+'T00:00:00').getDay();
    ctx.el.innerHTML=`<div class="stage"><p class="lead">되는 날을 모두 눌러주세요.</p><div class="cal" id="cal"></div>
      <button class="btn" id="sb">되는 날 올리고 링크 받기</button><div id="after"></div></div>
      <div class="stage"><div class="hud"><div><small>지금까지</small><b id="vc"></b></div><div><small>가장 많이 되는 날</small><b id="best" style="font-size:18px">-</b></div></div><div id="rs" class="board"></div><p class="note">${CHAIN_NOTE}</p><div id="mg"></div></div>`;
    const counts = () => { const c={}; (ctx.room.b||[]).forEach(e=>(e.a||[]).forEach(i=>c[i]=(c[i]||[]).concat(e.n))); return c; };
    const cal = () => { const c=counts(), n=(ctx.room.b||[]).length||1;
      NL.$('#cal').innerHTML = DW.map(d=>`<span class="dw">${d}</span>`).join('') + [...Array(first)].map(()=>'<button disabled></button>').join('') +
        list.map((s,i)=>{ const d=new Date(s+'T00:00:00'); const k=(c[i]||[]).length; const on=pick.has(i);
          const heat = !on && k ? `class="heat" style="background:rgba(182,138,54,${.25+.75*k/n})"` : ''; return `<button type="button" data-i="${i}" aria-pressed="${on}" ${heat}>${d.getDate()===1||i===0?`<small>${d.getMonth()+1}월</small>`:''}${d.getDate()}${k?`<small>${k}명</small>`:''}</button>`; }).join('');
      NL.$$('#cal button[data-i]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.i; pick.has(i)?pick.delete(i):pick.add(i); cal(); }); };
    ctx.redraw = () => { const c=counts(); const b=ctx.room.b||[]; NL.$('#vc').textContent=`${b.length}명 참여`;
      const rank=Object.keys(c).map(i=>[+i,c[i]]).sort((x,y)=>y[1].length-x[1].length||x[0]-y[0]);
      const fmt=i=>{ const d=new Date(list[i]+'T00:00:00'); return `${d.getMonth()+1}.${d.getDate()} (${DW[d.getDay()]})`; };
      NL.$('#best').textContent = rank.length? fmt(rank[0][0]) : '-';
      NL.$('#rs').innerHTML = rank.length ? rank.slice(0,5).map((r,k)=>`<div class="brow"><span class="rk num">${k+1}</span><span>${fmt(r[0])}<br><small style="color:#596579">${r[1].map(E).join(', ')}</small></span><span class="v num">${r[1].length}명</span></div>`).join('') : '<p class="empty">아직 아무도 고르지 않았어요</p>';
      cal(); NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; ctx.redraw(); }); };
    ctx.redraw();
    NL.$('#sb').onclick = () => { if(!pick.size){ NL.toast('되는 날을 하나 이상 눌러주세요'); return; } submit(ctx, {a:[...pick].sort((a,b)=>a-b)}, (nr,n)=>`[${nr.ti}] ${n}님 되는 날 체크 완료 (${nr.b.length}명). 다음 사람 이 링크로!`); };
  }
});
})();
