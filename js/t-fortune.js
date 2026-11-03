/* 운세: 오늘의 운세 한 장 (이름+날짜+방 시드로 결정, 같은 링크면 같은 운세) */
(function(){
'use strict';
const E = NL.esc;
const P = {
  total:['작은 행운이 연달아 들어오는 날이에요. 미뤄둔 연락을 먼저 해보세요.','평소보다 눈치가 빨라지는 날. 분위기를 읽고 한 박자 쉬면 일이 술술 풀려요.','오늘은 새로 시작하기 좋은 날이에요. 작은 것 하나만 바꿔도 하루가 달라져요.','주변 사람 덕을 보는 날. 고맙다는 말 한마디가 행운을 두 배로 만들어요.','서두르면 놓치고 천천히 보면 보이는 날이에요. 중요한 결정은 오후에.','기분 좋은 소식이 들려올 수 있어요. 휴대폰 알림을 자주 확인해 보세요.','에너지가 넘치는 날. 운동이나 산책으로 기운을 쓰면 저녁이 편해져요.','오래 고민한 일에 답이 보이는 날이에요. 처음 떠오른 생각을 믿어보세요.','사소한 실수가 오히려 웃음이 되는 날. 너무 긴장하지 않아도 괜찮아요.','칭찬받을 일이 생기는 날이에요. 오늘 한 일을 누군가 알아봐 줄 거예요.','혼자보다 함께가 좋은 날. 모임이나 단톡방에서 먼저 말을 꺼내보세요.','정리운이 좋은 날이에요. 책상이나 폰 사진첩을 정리하면 머리도 맑아져요.'],
  money:['작은 지출이 큰 만족으로 돌아와요','쿠폰·적립을 꼭 챙기세요','충동구매만 조심하면 무난해요','생각지 못한 용돈이나 환급 기운','가계부를 써보면 새는 돈이 보여요','함께 먹는 밥값이 아깝지 않은 날','미뤄둔 중고 거래가 잘 풀려요','오늘은 지갑을 닫는 게 이득이에요'],
  love:['먼저 연락하면 반가운 답이 와요','같이 웃을 일이 생기는 날','솔직한 한마디가 마음을 열어요','오래된 인연에게서 연락이 올 수도','작은 선물이 큰 감동이 돼요','오늘은 듣는 쪽이 되어 주세요','새로운 사람과 대화가 잘 통해요','함께 걷는 시간이 좋은 날'],
  work:['집중력이 좋아 할 일을 빨리 끝내요','회의에서 낸 의견이 채택될 수 있어요','도움을 요청하면 쉽게 풀려요','마감 하나를 미리 끝내두면 편해요','새 아이디어가 떠오르는 날','꼼꼼히 확인하면 실수를 막아요','칭찬받을 일이 생겨요','오늘은 정리하고 내일 달리세요'],
  color:['금색','남색','하늘색','연두색','주황색','보라색','흰색','빨간색','민트색','베이지색'],
  dir:['동쪽','서쪽','남쪽','북쪽','남동쪽','북서쪽'],
  item:['따뜻한 커피','손수건','볼펜','이어폰','초콜릿','물 한 병','우산','사진 한 장']
};
const pick = (arr, r) => arr[Math.floor(r()*arr.length)];
const ymd = () => { const d=new Date(); return `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}`; };
const fortune = (name, seed) => { const r=NL.rng(`${name}|${ymd()}|${seed}`); const sc=60+Math.floor(r()*41);
  return { sc, stars:Math.max(1,Math.round(sc/20)), total:pick(P.total,r), money:pick(P.money,r), love:pick(P.love,r), work:pick(P.work,r), color:pick(P.color,r), num:1+Math.floor(r()*45), dir:pick(P.dir,r), item:pick(P.item,r) }; };

NL.reg({ id:'fortune', cat:'fun', name:'오늘의 운세 한 장', desc:'방 사람들 운세 한꺼번에', bg:'#E8E9EE', icon:'fortune',
  long:'방 사람들 이름을 넣으면 각자 오늘의 운세와 방 안 운세 순위가 나와요. 재미로 보는 운세입니다.',
  defTitle:'우리 방 오늘의 운세',
  fields:[{k:'names', type:'list', label:'이름 (1~30명)', ph:'한 줄에 한 명', def:['민수','지연','현우','소희']}],
  build(v){ const names=NL.uniq(v.names).slice(0,30); if(!names.length) throw '이름을 한 명 이상 넣어 주세요'; return {names}; },
  promo:{t:'더 깊은 운세는 키오스크에서', d:'라온선녀의 운세·나읽기(사주+얼굴)·별빛 타로 등 운세 키오스크 7종'},
  render(ctx){
    const {names}=ctx.room.d; const fs=names.map(n=>({n, f:fortune(n, ctx.room.s)}));
    const rank=fs.slice().sort((a,b)=>b.f.sc-a.f.sc);
    ctx.el.innerHTML=`<div class="stage"><p class="lead">이름을 누르면 오늘의 운세가 나와요.</p><div class="namebtns" id="nb">${names.map((n,i)=>`<button class="pill" data-i="${i}">${E(n)}</button>`).join('')}</div><div id="fc"></div></div>
      <div class="stage"><div class="hud"><div><small>오늘 우리 방</small><b>운세 순위</b></div></div><div class="board">${rank.map((x,i)=>`<div class="brow"><span class="rk num">${i+1}</span><span>${E(x.n)}</span><span class="v num">${x.f.sc}점</span></div>`).join('')}</div><p class="note">날짜가 바뀌면 운세도 바뀌어요. 재미로만 봐주세요.</p></div>`;
    NL.$$('#nb button').forEach(b=>b.onclick=()=>{ NL.$$('#nb button').forEach(x=>x.setAttribute('aria-pressed', x===b)); const {n,f}=fs[+b.dataset.i];
      NL.$('#fc').innerHTML=`<div class="fcard"><h3>${E(n)}님의 오늘</h3><span class="stars">${'★'.repeat(f.stars)}${'☆'.repeat(5-f.stars)} <span class="num" style="font-size:15px;color:#fff">${f.sc}점</span></span><p>${E(f.total)}</p>
        <dl><dt>금전</dt><dd>${E(f.money)}</dd><dt>연애</dt><dd>${E(f.love)}</dd><dt>일·공부</dt><dd>${E(f.work)}</dd></dl>
        <div class="lk"><span>행운 색 ${E(f.color)}</span><span>행운 숫자 ${f.num}</span><span>방향 ${E(f.dir)}</span><span>${E(f.item)}</span></div></div>`;
      NL.beep(880,.12); });
  }
});
})();
