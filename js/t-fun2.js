/* 운세 2차: 타로 한 장·우리 방 궁합·포춘쿠키 */
(function(){
'use strict';
const E = NL.esc;
const TAROT = [['바보','새로운 시작, 두려움 없는 출발','준비 없는 무모함을 조심'],['마법사','의지와 실행력, 지금 시작할 때','준비가 덜 된 상태, 계획 점검'],['여사제','직관과 기다림, 조용히 지켜보기','속마음을 숨기고 있어요'],
 ['여황제','풍요와 애정, 넉넉한 기운','지나친 욕심은 덜어내기'],['황제','안정과 책임, 단단한 기반','고집이 일을 막을 수 있어요'],['교황','좋은 조언과 믿을 만한 사람','틀을 깨고 싶은 마음'],
 ['연인','선택과 사랑, 마음이 끌리는 쪽','망설임, 선택을 미루는 중'],['전차','전진과 승리, 밀고 나가기','방향을 잠시 다시 잡기'],['힘','인내와 용기, 부드러운 강함','자신감이 조금 부족해요'],
 ['은둔자','혼자만의 성찰, 답은 내 안에','지나친 고립은 피하기'],['운명의 수레바퀴','전환점, 흐름이 바뀌는 때','타이밍이 조금 늦어져요'],['정의','균형과 공정, 원칙대로','한쪽으로 기운 판단 주의'],
 ['매달린 사람','관점을 바꾸면 보여요','헛수고가 되지 않게 점검'],['죽음','하나가 끝나고 새로 시작','변화를 미루는 중'],['절제','조화와 조율, 천천히 섞기','무리하지 않기'],
 ['악마','유혹과 집착을 알아차리기','묶여 있던 것에서 벗어남'],['탑','갑작스러운 변화, 새로 짓기','큰일은 피해 가요'],['별','희망과 회복, 꿈을 향해','잠깐의 실망, 곧 회복'],
 ['달','불안과 모호함, 확인이 필요','오해가 풀리기 시작'],['태양','성공과 기쁨, 밝은 결과','잠깐 흐려도 곧 맑음'],['심판','결단과 부활, 다시 일어서기','지난 일에 대한 미련'],['세계','완성과 성취, 한 바퀴 완주','마무리가 조금 늦어져요']];
NL.reg({ id:'tarot', cat:'fun', name:'타로 한 장', desc:'질문 하나에 카드 한 장', bg:'#E8E9EE', glyph:'T',
  long:'마음속 질문을 떠올리고 카드 한 장을 뽑아요. 메이저 아르카나 22장 중 한 장이 나옵니다. 재미로 보세요.',
  defTitle:'오늘의 타로',
  fields:[{k:'q', type:'text', label:'함께 볼 질문 (선택)', def:'', max:40, ph:'예: 이번 주 우리 팀 운은?'}],
  build(v){ return {q:v.q.slice(0,40)}; },
  promo:{t:'원조는 키오스크 "별빛 타로"', d:'타로·사주·관상 운세 키오스크 7종 · 행사 대여'},
  render(ctx){ const q=ctx.room.d.q; const deck=NL.shuffle(TAROT.map((_,i)=>i), Math.random);
    ctx.el.innerHTML=`<div class="stage">${q?`<p class="lead">질문</p><h2 style="font-size:19px">${E(q)}</h2>`:'<p class="lead">마음속 질문을 떠올리고 카드 한 장을 고르세요.</p>'}<div class="cards" id="tc">${deck.slice(0,8).map((c,i)=>`<button class="mc" data-c="${c}" aria-label="카드 ${i+1}"></button>`).join('')}</div><div id="tr"></div></div>`;
    NL.$$('#tc button').forEach(b=>b.onclick=()=>{ if(NL.$('#tr').innerHTML) return; const c=+b.dataset.c; const rev=Math.random()<.3; const [nm,up,down]=TAROT[c];
      b.style.background='#B68A36'; NL.beep(880,.2);
      NL.$('#tr').innerHTML=`<div class="fcard" style="margin-top:12px"><span style="color:#D9B76A;font-weight:700">${c} · ${rev?'역방향':'정방향'}</span><h3>${E(nm)}</h3><p>${E(rev?down:up)}</p><p style="font-size:13px;color:#c7d2ea">재미로 보는 타로예요.</p></div><button class="btn sub" id="ag" style="margin-top:8px">다시 뽑기</button>`;
      NL.$('#ag').onclick=()=>ctx.tool.render(ctx); }); }
});

NL.reg({ id:'match', cat:'fun', name:'우리 방 궁합', desc:'방 사람들 궁합 순위', bg:'#FBE3E1', glyph:'궁합',
  long:'이름을 넣으면 오늘 우리 방 사람들의 궁합 점수와 찰떡 짝꿍이 나와요. 재미로 보는 궁합이에요.',
  defTitle:'우리 방 궁합 랭킹',
  fields:[{k:'names', type:'list', label:'이름 (2~20명)', ph:'한 줄에 한 명', def:['민수','지연','현우','소희','대리님']}],
  build(v){ const n=NL.uniq(v.names); if(n.length<2) throw '이름을 2명 이상 넣어 주세요'; return {names:n.slice(0,20)}; },
  promo:{t:'더 깊은 궁합은 키오스크에서', d:'사주·관상 궁합 리포트 키오스크 · 커플 행사 인기'},
  render(ctx){ const {names}=ctx.room.d; const pairs=[]; const d=new Date(); const day=`${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`;
    for(let i=0;i<names.length;i++) for(let j=i+1;j<names.length;j++){ const k=[names[i],names[j]].sort().join('♥'); pairs.push({a:names[i],b:names[j],s:55+Math.floor(NL.rng(k+day+ctx.room.s)()*45)}); }
    pairs.sort((x,y)=>y.s-x.s); const label=s=>s>=93?'운명 같은 찰떡':s>=85?'척하면 척':s>=75?'편안한 사이':s>=65?'알아갈수록 좋은 사이':'티격태격 케미';
    ctx.el.innerHTML=`<div class="stage">${pairs[0]?`<div class="result-big"><small>오늘의 찰떡 짝꿍</small><b style="font-size:28px">${E(pairs[0].a)} ♥ ${E(pairs[0].b)}</b><span>${pairs[0].s}점 · ${label(pairs[0].s)}</span></div>`:''}
      <p class="lead">내 이름을 누르면 나와 가장 잘 맞는 사람이 나와요.</p><div class="namebtns" id="nb">${names.map((n,i)=>`<button class="pill" data-i="${i}">${E(n)}</button>`).join('')}</div><div id="mine"></div></div>
      <div class="stage"><div class="hud"><div><small>전체 궁합 순위</small><b>${pairs.length}쌍</b></div></div><div class="board">${pairs.slice(0,30).map((p,i)=>`<div class="brow"><span class="rk num">${i+1}</span><span>${E(p.a)} ♥ ${E(p.b)}<br><small style="color:#596579">${label(p.s)}</small></span><span class="v num">${p.s}점</span></div>`).join('')}</div><p class="note">날짜가 바뀌면 궁합도 바뀌어요. 재미로만 봐주세요.</p></div>`;
    NL.$$('#nb button').forEach(b=>b.onclick=()=>{ NL.$$('#nb button').forEach(x=>x.setAttribute('aria-pressed',x===b)); const me=names[+b.dataset.i]; const mine=pairs.filter(p=>p.a===me||p.b===me);
      NL.$('#mine').innerHTML=`<ol class="list-ol" style="margin-top:10px">${mine.slice(0,5).map((p,i)=>`<li><i>${i+1}</i><span style="flex:1">${E(p.a===me?p.b:p.a)}</span><b style="color:#B68A36">${p.s}점</b></li>`).join('')}</ol>`; NL.beep(880,.1); }); }
});

const COOKIE = ['오늘 망설인 일, 해보면 생각보다 쉬워요','작은 친절이 큰 행운으로 돌아와요','기다리던 연락이 곧 올 거예요','오늘은 맛있는 걸 먹을 운이에요','새로운 사람과 좋은 인연이 생겨요',
 '미뤄둔 정리를 하면 좋은 게 나와요','웃는 얼굴이 오늘의 부적이에요','생각지 못한 칭찬을 듣게 돼요','계획보다 조금 늦어도 결과는 좋아요','오늘 산책길에 좋은 기운이 있어요',
 '친구에게 먼저 연락해 보세요','작은 지출이 큰 기쁨이 돼요','지금의 노력은 곧 눈에 보이는 결과가 돼요','오늘은 쉬어도 되는 날이에요','좋아하는 노래가 행운을 불러와요',
 '고민은 반으로 줄고 기쁨은 두 배가 돼요','새로 배우는 것에 운이 따라요','오늘의 선택은 대체로 정답이에요','반가운 소식이 문 앞에 와 있어요','소소한 내기에서 이길지도 몰라요'];
NL.reg({ id:'cookie', cat:'fun', name:'포춘쿠키 뽑기', desc:'쿠키 깨고 오늘의 한마디', bg:'#F3E7CC', glyph:'福',
  long:'쿠키를 눌러 깨면 오늘의 한마디와 행운 숫자가 나와요. 방 사람들 모두 각자 깨보세요.',
  defTitle:'오늘의 포춘쿠키',
  fields:[],
  promo:{t:'원조는 키오스크 "오늘의 행운뽑기"', d:'포춘쿠키·복주머니 행운뽑기 키오스크 · 매장 이벤트'},
  render(ctx){ ctx.el.innerHTML=`<div class="stage"><div class="howto"><p class="lead">쿠키를 눌러 깨보세요</p><button id="ck" aria-label="포춘쿠키" style="border:0;background:none;padding:0;margin:0 auto;width:200px"><svg viewBox="0 0 200 140" style="width:100%"><path d="M20 90 C20 30 180 30 180 90 C150 70 120 120 100 80 C80 120 50 70 20 90z" fill="#E8B230" stroke="#B68A36" stroke-width="4"/></svg></button><div id="msg"></div></div></div>`;
    NL.$('#ck').onclick=()=>{ const ck=NL.$('#ck'); ck.animate([{transform:'rotate(-8deg)'},{transform:'rotate(8deg)'},{transform:'scale(1.15)'},{transform:'scale(.6)',opacity:.2}],{duration:600,fill:'forwards'}); NL.beep(300,.08,'square'); NL.vibrate(40);
      setTimeout(()=>{ ck.hidden=true; const m=COOKIE[Math.floor(Math.random()*COOKIE.length)]; const nums=NL.shuffle([...Array(45)].map((_,i)=>i+1),Math.random).slice(0,3).sort((a,b)=>a-b);
        NL.$('#msg').innerHTML=`<div class="fcard"><span style="color:#D9B76A;font-weight:700">오늘의 한마디</span><h3 style="font-size:22px;line-height:1.45;word-break:keep-all">${E(m)}</h3><div class="lk"><span>행운 숫자 ${nums.join(' · ')}</span></div></div><button class="btn sub" id="ag" style="margin-top:8px">하나 더 깨기</button>`; NL.beep(990,.2);
        NL.$('#ag').onclick=()=>ctx.tool.render(ctx); }, 620); }; }
});
})();
