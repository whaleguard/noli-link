/* 퀴즈: 초성·나를 얼마나 알아·OX·넌센스·사자성어·끝말잇기·사투리·추억의 소리·IQ 퍼즐·영어 단어·맞춤법 */
(function(){
'use strict';
const E = NL.esc;
const now = () => performance.now();
const RI = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const shuf = a => NL.shuffle(a, Math.random);
/* 점수: 정답수×1000 + (999-걸린 초) → 같은 정답수면 빠른 사람이 위 */
const qfmt = v => `${Math.floor(v/1000)}개 정답 · ${999-(v%1000)}초`;
const qscore = (c, ms) => c*1000 + (999 - Math.min(999, Math.round(ms/1000)));

/* 공통 4지선다 퀴즈 엔진 */
NL.quiz = def => NL.arcade(Object.assign({ cat:'quiz', better:'high', unit:'정답', fmt:qfmt, hudL:'정답', hudR:'문제', noCount:true,
  game(api){ const qs = def.make(api).slice(0, def.n||10); let i=0, c=0; const t0=now();
    return new Promise(ok => { const show = () => { if(!api.alive) return; if(i>=qs.length) return ok({v:qscore(c, now()-t0), note:`${qs.length}문제 중 ${c}개 정답`});
        const q=qs[i]; api.L(c); api.R(`${i+1}/${qs.length}`);
        api.el.innerHTML = `<div class="howto" style="gap:14px"><p class="big" style="font-size:${q.big?40:20}px;line-height:1.4;word-break:keep-all">${q.q}</p>${q.sub?`<p class="lead">${q.sub}</p>`:''}${q.play?'<button class="btn sub" id="pl">소리 다시 듣기</button>':''}
          <div class="opt">${q.opts.map((o,k)=>`<button type="button" data-k="${k}">${E(o)}</button>`).join('')}</div></div>`;
        if(q.play){ q.play(); NL.$('#pl',api.el).onclick=q.play; }
        NL.$$('.opt button',api.el).forEach(b=>b.onclick=async()=>{ const k=+b.dataset.k, right=q.opts[k]===q.a; NL.$$('.opt button',api.el).forEach(x=>{ x.disabled=true; if(q.opts[+x.dataset.k]===q.a){ x.style.borderColor='#2E9E6B'; x.style.background='#E2F3EC'; } });
          if(right){ c++; NL.beep(880,.08); } else { b.style.borderColor='#E2574C'; b.style.background='#FBE3E1'; NL.beep(180,.15); NL.vibrate(40); }
          api.L(c); await NL.sleep(q.explain&&!right?1300:650); i++; show(); }); };
      show(); }); }
}, def));
const mc = (q, a, pool, extra) => { const wrong = shuf(pool.filter(x=>x!==a)).slice(0,3); return Object.assign({q, a, opts:shuf([a, ...wrong])}, extra||{}); };

/* ---------- 초성 맞히기 배틀 (직접 입력) ---------- */
const CHO='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const chosung = w => [...w].map(ch=>{ const c=ch.charCodeAt(0)-0xAC00; return c>=0&&c<11172 ? CHO[Math.floor(c/588)] : ch; }).join('');
const WORDS = {
  food:['김치찌개','떡볶이','삼겹살','비빔밥','불고기','냉면','순대','짜장면','탕수육','김밥','라면','치킨','피자','햄버거','갈비탕','된장찌개','부대찌개','잡채','호떡','붕어빵','칼국수','만두','족발','보쌈','감자탕'],
  animal:['호랑이','코끼리','기린','고양이','강아지','원숭이','하마','펭귄','다람쥐','거북이','고슴도치','너구리','사자','토끼','앵무새','낙타','오리','돌고래','판다','치타','악어','고래','부엉이','카멜레온','캥거루'],
  country:['대한민국','일본','중국','미국','영국','프랑스','독일','이탈리아','스페인','캐나다','브라질','호주','베트남','태국','인도','이집트','멕시코','러시아','스위스','필리핀','튀르키예','네덜란드','싱가포르','아르헨티나','몽골'],
  job:['선생님','의사','간호사','경찰관','소방관','요리사','미용사','변호사','회사원','가수','배우','기자','약사','농부','군인','화가','작가','조종사','유튜버','택배기사','바리스타','수의사','디자이너','프로그래머','운동선수']
};
const CATN = {food:'음식',animal:'동물',country:'나라',job:'직업'};
NL.arcade({ id:'chosung', cat:'quiz', name:'초성 맞히기 배틀', desc:'초성 보고 단어 맞히기', bg:'#E7EDF8', glyph:'ㅊㅅ', better:'high', unit:'정답', fmt:qfmt, hudL:'정답', hudR:'문제', noCount:true,
  howto:'초성을 보고 단어를 입력하세요. 10문제, 모르면 넘기기. 빨리 맞힐수록 순위가 올라가요.',
  fields:[{k:'c', type:'select', label:'주제', def:'food', opts:[['food','음식'],['animal','동물'],['country','나라'],['job','직업'],['mix','섞어서']]},
    {k:'own', type:'list', label:'우리 방 단어 (선택)', ph:'회사 용어, 멤버 이름 등\n한 줄에 하나', def:[], help:'넣으면 이 단어들로만 출제돼요 (5개 이상)'}],
  build(v){ const own=NL.uniq(v.own.filter(w=>/^[가-힣 ]{2,12}$/.test(w))); if(v.own.length && own.length<5) throw '우리 방 단어는 한글 2~12자로 5개 이상 넣어 주세요'; return {c:v.c, own}; },
  promo:{t:'브랜드 맞춤 퀴즈 키오스크', d:'우리 매장·브랜드 단어로 만드는 퀴즈 게임 프로그램'},
  game(api){ const d=api.d; const pool = d.own&&d.own.length ? d.own : d.c==='mix' ? Object.values(WORDS).flat() : WORDS[d.c]||WORDS.food;
    const qs = shuf(pool).slice(0,10); let i=0, c=0; const t0=now();
    return new Promise(ok=>{ const show=()=>{ if(!api.alive) return; if(i>=qs.length) return ok({v:qscore(c,now()-t0), note:`${qs.length}문제 중 ${c}개 정답`});
        api.L(c); api.R(`${i+1}/${qs.length}`); const w=qs[i];
        api.el.innerHTML=`<div class="howto"><p class="lead">${d.own&&d.own.length?'우리 방 단어':CATN[d.c]||'섞어서'} · ${w.replace(/ /g,'').length}글자</p><p style="font-family:var(--fd);font-size:56px;letter-spacing:8px;line-height:1.1">${E(chosung(w))}</p>
          <input class="inp" id="ans" autocomplete="off" placeholder="정답 입력" style="text-align:center;font-size:20px"><div class="row"><button class="btn" id="ok" style="flex:2">확인</button><button class="btn sub" id="sk" style="flex:1">넘기기</button></div><p id="fb" class="lead" style="min-height:24px"></p></div>`;
        const inp=NL.$('#ans',api.el); setTimeout(()=>inp.focus(),50);
        const check=async(skip)=>{ const a=inp.value.replace(/\s/g,''); const right=!skip && a===w.replace(/\s/g,'');
          if(!skip && !right){ NL.$('#fb',api.el).textContent='아니에요, 다시!'; NL.beep(180,.1); inp.select(); return; }
          if(right){ c++; NL.beep(880,.1); NL.$('#fb',api.el).textContent='정답!'; } else { NL.$('#fb',api.el).textContent=`정답은 "${w}"`; }
          NL.$('#ok',api.el).disabled=true; NL.$('#sk',api.el).disabled=true; await NL.sleep(skip?1000:500); i++; show(); };
        NL.$('#ok',api.el).onclick=()=>check(false); NL.$('#sk',api.el).onclick=()=>check(true); inp.onkeydown=e=>{ if(e.key==='Enter') check(false); }; };
      show(); }); }
});

/* ---------- 나를 얼마나 알아? ---------- */
NL.arcade({ id:'knowme', cat:'quiz', name:'나를 얼마나 알아?', desc:'내가 낸 문제를 친구가 풀기', bg:'#FBE3E1', glyph:'?', better:'high', unit:'정답', fmt:qfmt, hudL:'정답', hudR:'문제', noCount:true,
  howto:'출제자에 대한 문제예요. 얼마나 잘 아는지 맞혀보세요!', defTitle:'나를 얼마나 알아?',
  fields:[{k:'who', type:'text', label:'출제자 이름', def:'민수', max:12},
    {k:'qs', type:'list', label:'문제 ("질문 / 정답 / 오답 / 오답")', itemMax:80, ph:'내가 제일 좋아하는 음식은? / 떡볶이 / 초밥 / 피자',
     def:['내가 제일 좋아하는 음식은? / 떡볶이 / 초밥 / 삼겹살','내 MBTI는? / ENFP / ISTJ / INTP','주말에 제일 많이 하는 건? / 잠자기 / 등산 / 게임','내가 제일 무서워하는 건? / 벌레 / 귀신 / 높은 곳','나의 최애 계절은? / 가을 / 여름 / 겨울']}],
  build(v){ const qs=v.qs.map(l=>l.split('/').map(s=>s.trim()).filter(Boolean)).filter(p=>p.length>=3).map(p=>({q:p[0].slice(0,40),a:p[1].slice(0,20),w:p.slice(2,5).map(s=>s.slice(0,20))})).slice(0,15);
    if(qs.length<3) throw '문제를 3개 이상 "질문 / 정답 / 오답" 형식으로 넣어 주세요'; return {who:(v.who||'출제자').slice(0,12), qs}; },
  inviteMsg: r => `[${r.ti}] ${r.d.who}에 대해 얼마나 알아? 링크 누르고 바로 풀어봐!`,
  promo:{t:'신랑신부 맞히기 행사 버전', d:'결혼식·돌잔치·신입사원 환영회용 대형화면 퀴즈 키오스크'},
  game(api){ const d=api.d; const qs=d.qs.map(q=>({q:E(q.q), a:q.a, opts:shuf([q.a,...q.w])})); let i=0,c=0; const t0=now();
    return new Promise(ok=>{ const show=()=>{ if(!api.alive) return; if(i>=qs.length) return ok({v:qscore(c,now()-t0), note:`${E(d.who)}님 문제 ${qs.length}개 중 ${c}개 정답`});
        const q=qs[i]; api.L(c); api.R(`${i+1}/${qs.length}`);
        api.el.innerHTML=`<div class="howto"><p class="lead">${E(d.who)}님에 대한 문제</p><p class="big">${q.q}</p><div class="opt">${q.opts.map((o,k)=>`<button data-k="${k}">${E(o)}</button>`).join('')}</div></div>`;
        NL.$$('.opt button',api.el).forEach(b=>b.onclick=async()=>{ const right=q.opts[+b.dataset.k]===q.a; NL.$$('.opt button',api.el).forEach(x=>{ x.disabled=true; if(q.opts[+x.dataset.k]===q.a){x.style.borderColor='#2E9E6B';x.style.background='#E2F3EC';} });
          if(right){c++;NL.beep(880,.08);} else { b.style.borderColor='#E2574C'; NL.beep(180,.15); } await NL.sleep(700); i++; show(); }); };
      show(); }); }
});

/* ---------- 우리 방 OX 퀴즈 ---------- */
const OX = [['고래는 포유류다','O'],['박쥐는 새의 한 종류다','X'],['문어의 다리는 8개다','O'],['거미는 곤충이다','X'],['얼음은 물에 뜬다','O'],['달은 스스로 빛을 낸다','X'],
 ['펭귄은 북극에 산다','X'],['개미의 다리는 6개다','O'],['우리나라의 국화는 무궁화다','O'],['한라산은 제주도에 있다','O'],['낙타의 혹에는 물이 가득 들어 있다','X'],
 ['소리는 진공 속에서는 전달되지 않는다','O'],['금은 자석에 붙는다','X'],['축구는 한 팀이 경기장에 11명씩 나온다','O'],['표준 피아노 건반은 88개다','O'],
 ['모기는 수컷만 사람의 피를 빤다','X'],['바나나는 나무가 아니라 풀에서 열린다','O'],['독도는 경상북도에 속한다','O'],['성인의 뼈는 약 206개다','O'],['하계 올림픽은 2년마다 열린다','X'],
 ['지구는 태양 주위를 돈다','O'],['토끼는 알을 낳는다','X'],['물은 1기압에서 100도에 끓는다','O'],['백두산은 한반도에서 가장 높은 산이다','O'],['오징어의 피는 파란색을 띤다','O'],
 ['상어는 포유류다','X'],['사과는 장미과 식물이다','O'],['세종대왕이 훈민정음을 만들었다','O'],['태양은 행성이다','X'],['코알라는 곰의 한 종류다','X']];
NL.arcade({ id:'ox', cat:'quiz', name:'우리 방 OX 퀴즈', desc:'상식 OX + 직접 출제', bg:'#E2F3EC', glyph:'OX', better:'high', unit:'정답', fmt:qfmt, hudL:'정답', hudR:'문제', noCount:true,
  howto:'문장이 맞으면 O, 틀리면 X! 10문제. 빨리 풀수록 순위가 올라가요.',
  fields:[{k:'own', type:'list', label:'직접 낸 문제 (선택, "문장 / O 또는 X")', itemMax:80, ph:'우리 팀장님은 커피를 안 마신다 / X', def:[], help:'넣으면 직접 낸 문제가 먼저 나오고 나머지는 상식 문제로 채워요'}],
  build(v){ const own=v.own.map(l=>l.split('/').map(s=>s.trim())).filter(p=>p.length>=2&&/^[OoXx○×]$/.test(p[1])).map(p=>[p[0].slice(0,60), /^[Oo○]$/.test(p[1])?'O':'X']).slice(0,10); return {own}; },
  promo:{t:'원조는 키오스크 "브랜드 OX 룰렛 퀴즈"', d:'우리 브랜드 문제로 만드는 OX 퀴즈 키오스크 · 정답자 경품'},
  game(api){ const qs=[...(api.d.own||[]), ...shuf(OX)].slice(0,10); let i=0,c=0; const t0=now();
    return new Promise(ok=>{ const show=()=>{ if(!api.alive) return; if(i>=qs.length) return ok({v:qscore(c,now()-t0), note:`${qs.length}문제 중 ${c}개 정답`});
        const [q,a]=qs[i]; api.L(c); api.R(`${i+1}/${qs.length}`);
        api.el.innerHTML=`<div class="howto"><p class="big" style="min-height:84px;word-break:keep-all">${E(q)}</p><div class="bal"><button data-a="O" style="font-size:44px;color:#3B7DD8">O</button><button data-a="X" style="font-size:44px;color:#E2574C">X</button></div><p id="fb" class="lead" style="min-height:24px"></p></div>`;
        NL.$$('.bal button',api.el).forEach(b=>b.onclick=async()=>{ NL.$$('.bal button',api.el).forEach(x=>x.disabled=true); const right=b.dataset.a===a; if(right){c++;NL.beep(880,.08);} else {NL.beep(180,.15);NL.vibrate(40);}
          NL.$('#fb',api.el).textContent = right?'정답!':`정답은 ${a}`; api.L(c); await NL.sleep(right?500:1000); i++; show(); }); };
      show(); }); }
});

/* ---------- 넌센스 퀴즈 ---------- */
const NONSENSE = [['세상에서 가장 가난한 왕은?','최저임금'],['왕이 넘어지면?','킹콩'],['세상에서 가장 빠른 닭은?','후다닥'],['바나나가 웃으면?','바나나킥'],['소가 웃으면?','우하하'],
 ['오리가 얼면?','언덕'],['자동차를 톡 치면?','카톡'],['미소의 반대말은?','당기소'],['세상에서 가장 지루한 중학교는?','로딩중'],['아몬드가 죽으면?','다이아몬드'],
 ['세상에서 가장 쉬운 숫자는?','190000'],['신사가 자기소개를 하면?','신사임당'],['깨가 죽으면?','주근깨'],['개가 사람을 가르치면?','개인지도'],['고기 먹을 때 따라오는 개는?','이쑤시개'],
 ['물고기의 반대말은?','불고기'],['왕이 궁에 들어가기 싫을 때 하는 말은?','궁시렁궁시렁'],['사과가 웃으면?','풋사과'],['세상에서 가장 뜨거운 과일은?','천도복숭아'],['진짜 문제투성이인 것은?','시험지'],
 ['소금의 유통기한은?','천일'],['별 중에 가장 슬픈 별은?','이별'],['반성문을 영어로 하면?','글로벌'],['비가 그친 뒤 하늘에 뜨는 개는?','무지개'],['전화로 세운 건물은?','콜로세움'],
 ['오리를 생으로 먹으면?','회오리'],['서울이 추우면?','서울시립대']];
NL.quiz({ id:'nonsense', name:'넌센스 퀴즈', desc:'말장난 퀴즈 10문제', bg:'#F3E7CC', glyph:'ㅋ',
  howto:'말장난 정답을 골라보세요. 10문제, 빨리 풀수록 순위가 올라가요.',
  promo:{t:'행사 대기줄 퀴즈 스크린', d:'줄 서는 동안 즐기는 퀴즈·게임 키오스크'},
  make(){ const pool=NONSENSE.map(x=>x[1]); return shuf(NONSENSE).map(([q,a])=>mc(E(q),a,pool)); } });

/* ---------- 사자성어 ---------- */
const IDIOM = [['일석이조','한 가지 일로 두 가지 이득을 봄'],['동문서답','묻는 말에 엉뚱한 대답을 함'],['우왕좌왕','이리저리 갈팡질팡함'],['작심삼일','단단히 먹은 마음이 사흘을 가지 못함'],['이심전심','마음과 마음으로 서로 뜻이 통함'],
 ['자업자득','자기가 저지른 일의 결과를 자기가 받음'],['유비무환','미리 준비해 두면 걱정할 것이 없음'],['과유불급','정도를 지나침은 미치지 못함과 같음'],['감언이설','귀가 솔깃하도록 남의 비위를 맞추는 말'],['고진감래','고생 끝에 즐거움이 옴'],
 ['다다익선','많으면 많을수록 더욱 좋음'],['대기만성','큰 인물은 늦게 이루어짐'],['사필귀정','모든 일은 반드시 바른길로 돌아감'],['설상가상','어려운 일이 겹쳐서 일어남'],['십시일반','여러 사람이 조금씩 힘을 합하면 한 사람을 쉽게 도울 수 있음'],
 ['오리무중','일의 갈피를 잡을 수 없음'],['용두사미','처음은 좋으나 끝이 흐지부지함'],['일편단심','변치 않는 참된 마음'],['전화위복','재앙이 바뀌어 오히려 복이 됨'],['죽마고우','어릴 때부터 같이 놀며 자란 벗'],
 ['천생연분','하늘이 정해 준 인연'],['청출어람','제자가 스승보다 나음'],['칠전팔기','여러 번 실패해도 굽히지 않고 다시 일어남'],['타산지석','남의 하찮은 언행도 나를 닦는 데 도움이 됨'],['표리부동','겉으로 드러나는 언행과 속마음이 다름'],
 ['학수고대','몹시 기다림'],['호시탐탐','기회를 노리며 형세를 살핌'],['금상첨화','좋은 일 위에 또 좋은 일이 더해짐'],['역지사지','처지를 바꾸어 생각해 봄'],['이구동성','여러 사람의 말이 한결같음']];
NL.quiz({ id:'idiom', name:'사자성어 퀴즈', desc:'뜻 보고 사자성어 맞히기', bg:'#ECEFE4', glyph:'四字',
  howto:'뜻을 보고 맞는 사자성어를 고르세요. 10문제.',
  promo:{t:'교육형 키오스크', d:'받아쓰기·영어 단어·사자성어 등 학교·도서관 행사 프로그램'},
  make(){ const pool=IDIOM.map(x=>x[0]); return shuf(IDIOM).map(([a,m])=>mc(E(m),a,pool)); } });

/* ---------- 사투리 통역사 ---------- */
const DIAL = [['경상','니 밥 뭇나?','너 밥 먹었니?'],['경상','단디 해라','제대로 야무지게 해라'],['경상','욕봤다','수고했다'],['경상','마이 무라','많이 먹어라'],['경상','와 그라노?','왜 그러니?'],['경상','억수로','엄청, 매우'],['경상','정구지','부추'],
 ['전라','허벌나게','엄청나게, 아주 많이'],['전라','거시기','그것 (말이 바로 안 떠오를 때)'],['전라','어째야 쓰까','어떻게 해야 할까'],['전라','솔찬히','꽤, 상당히'],['전라','포도시','겨우, 간신히'],
 ['충청','괜찮아유','괜찮아요'],['충청','냅둬유','그냥 놔둬요'],['충청','워디 가유?','어디 가요?'],['충청','기여','그래, 맞아'],
 ['제주','혼저 옵서예','어서 오세요'],['제주','폭삭 속았수다','수고 많으셨습니다'],['제주','하영','많이'],['제주','무사?','왜?'],['제주','할망','할머니'],['제주','놀멍 쉬멍','놀면서 쉬면서'],
 ['강원','마카','모두, 전부'],['강원','감재','감자'],['강원','우떠?','어때?']];
NL.quiz({ id:'dialect', name:'사투리 통역사', desc:'지역 사투리 뜻 맞히기', bg:'#FBE7E5', glyph:'방언',
  howto:'사투리를 표준어로 통역해 보세요. 10문제. 우리 방 사투리 고수는 누구?',
  promo:{t:'지역 축제 맞춤 퀴즈', d:'지역 축제·관광지용 우리 동네 퀴즈 키오스크'},
  make(){ const pool=DIAL.map(x=>x[2]); return shuf(DIAL).map(([r,w,m])=>mc(`<span class="tag" style="font-size:13px;color:#B68A36">${r}</span><br>"${E(w)}"`,m,pool)); } });

/* ---------- 추억의 소리 감별사 (소리 직접 합성) ---------- */
let AC=null; const ac=()=>{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume(); return AC; };
const tone=(f,t0,dur,vol,type)=>{ const a=ac(), o=a.createOscillator(), g=a.createGain(); o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(0,a.currentTime+t0); g.gain.linearRampToValueAtTime(vol||.12,a.currentTime+t0+.01); g.gain.setValueAtTime(vol||.12,a.currentTime+t0+dur-.02); g.gain.linearRampToValueAtTime(0,a.currentTime+t0+dur); o.connect(g); g.connect(a.destination); o.start(a.currentTime+t0); o.stop(a.currentTime+t0+dur+.05); return o; };
const noise=(t0,dur,vol,hp)=>{ const a=ac(), n=a.sampleRate*dur, buf=a.createBuffer(1,n,a.sampleRate), d=buf.getChannelData(0); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2); const s=a.createBufferSource(); s.buffer=buf; const f=a.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp||1000; const g=a.createGain(); g.gain.value=vol||.3; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime+t0); };
const bell=(f,t0,dur)=>{ [1,2.76,5.4].forEach((m,i)=>{ const a=ac(), o=a.createOscillator(), g=a.createGain(); o.frequency.value=f*m; g.gain.setValueAtTime(.12/(i+1),a.currentTime+t0); g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+t0+dur); o.connect(g); g.connect(a.destination); o.start(a.currentTime+t0); o.stop(a.currentTime+t0+dur); }); };
const SOUNDS = [
 ['전화기 신호음 (수화기 들었을 때)', ()=>{ tone(350,0,1.6,.08); tone(440,0,1.6,.08); }],
 ['통화 중 신호음', ()=>{ for(let i=0;i<4;i++){ tone(480,i*.5,.25,.08); tone(620,i*.5,.25,.08); } }],
 ['PC통신 모뎀 접속음', ()=>{ tone(1650,0,.4,.07,'square'); tone(2100,.45,.3,.06); tone(980,.8,.25,.07,'square'); noise(1.05,.9,.15,800); tone(1200,1.95,.3,.05,'sawtooth'); }],
 ['초인종 딩동', ()=>{ bell(660,0,1.2); bell(523,.55,1.6); }],
 ['자명종 알람', ()=>{ for(let i=0;i<8;i++){ tone(2000,i*.18,.09,.07,'square'); } }],
 ['차임벨 (안내 방송 전)', ()=>{ [523,659,784,1047].forEach((f,i)=>bell(f,i*.35,1.4)); }],
 ['삐삐 호출음', ()=>{ for(let k=0;k<3;k++) for(let i=0;i<3;i++) tone(3000,k*.6+i*.1,.06,.06,'square'); }],
 ['필름 카메라 셔터', ()=>{ noise(0,.06,.5,2000); noise(.12,.08,.4,1500); tone(180,.2,.08,.05,'square'); }],
 ['타자기 + 줄바꿈 종', ()=>{ for(let i=0;i<7;i++) noise(i*.13+Math.random()*.03,.03,.45,2500); bell(2200,1.0,.9); }],
 ['철도 건널목 경보음', ()=>{ for(let i=0;i<6;i++) bell(i%2?720:600,i*.32,.3); }]
];
NL.quiz({ id:'sounds', name:'추억의 소리 감별사', desc:'옛날 소리 듣고 정체 맞히기', bg:'#E8E9EE', glyph:'♪', n:8,
  howto:'소리를 듣고 무슨 소리인지 골라요. 소리를 꼭 켜세요! 8문제.',
  promo:{t:'그시절 사진관 연계 이벤트', d:'7080·90 감성 AI 사진 키오스크와 추억 퀴즈'},
  make(){ const pool=SOUNDS.map(s=>s[0]); return shuf(SOUNDS).map(([a,fn])=>mc('무슨 소리일까요?',a,pool,{play:fn,sub:'아래 버튼으로 다시 들을 수 있어요'})); } });

/* ---------- IQ 퍼즐 챌린지 (수열) ---------- */
function seqQ(){ const t=RI(0,6); let s=[], a;
  if(t===0){ const st=RI(1,20), d=RI(2,9); s=[0,1,2,3,4].map(i=>st+d*i); a=st+d*5; }
  else if(t===1){ const st=RI(1,4), r=RI(2,3); s=[0,1,2,3,4].map(i=>st*Math.pow(r,i)); a=st*Math.pow(r,5); }
  else if(t===2){ const st=RI(1,6); s=[0,1,2,3,4].map(i=>(st+i)*(st+i)); a=(st+5)*(st+5); }
  else if(t===3){ let x=RI(1,3), y=RI(2,5); s=[x,y]; for(let i=0;i<3;i++) s.push(s[s.length-1]+s[s.length-2]); a=s[4]+s[3]; }
  else if(t===4){ const st=RI(1,10); s=[st]; for(let i=1;i<5;i++) s.push(s[i-1]+i); a=s[4]+5; }
  else if(t===5){ const st=RI(20,60), d=RI(2,6), e=RI(1,4); s=[st]; for(let i=1;i<5;i++) s.push(i%2?s[i-1]-d:s[i-1]+e); a=s[4]-d; }
  else { const st=RI(2,5); s=[st]; for(let i=1;i<5;i++) s.push(s[i-1]*2+1); a=s[4]*2+1; }
  const set=new Set([a]); while(set.size<4){ const w=a+RI(-12,12); if(w!==a && w>0) set.add(w); }
  return {q:`<span class="num" style="letter-spacing:1px">${s.join(', ')}, ?</span>`, sub:'다음에 올 숫자는?', a:String(a), opts:shuf([...set].map(String))}; }
NL.quiz({ id:'iq', name:'IQ 퍼즐 챌린지', desc:'숫자 규칙 찾기 10문제', bg:'#E3EEF9', glyph:'IQ',
  howto:'숫자가 늘어나는 규칙을 찾아 다음 숫자를 고르세요. 10문제, 빠를수록 순위 UP.',
  promo:{t:'원조는 키오스크 "IQ 퍼즐 챌린지"', d:'결과 카드 주는 두뇌 게임 키오스크 · 학교·박람회 인기'},
  make(){ return [...Array(10)].map(seqQ); } });

/* ---------- 영어 단어 퀴즈 ---------- */
const ENG = [['apple','사과'],['banana','바나나'],['dog','개'],['cat','고양이'],['bird','새'],['fish','물고기'],['house','집'],['school','학교'],['book','책'],['pencil','연필'],
 ['water','물'],['milk','우유'],['bread','빵'],['egg','달걀'],['red','빨간색'],['blue','파란색'],['green','초록색'],['yellow','노란색'],['sun','해'],['moon','달'],
 ['star','별'],['tree','나무'],['flower','꽃'],['rain','비'],['snow','눈'],['friend','친구'],['family','가족'],['mother','엄마'],['father','아빠'],['teacher','선생님'],
 ['happy','행복한'],['sad','슬픈'],['big','큰'],['small','작은'],['hot','뜨거운'],['cold','차가운'],['run','달리다'],['eat','먹다'],['sleep','자다'],['read','읽다']];
NL.quiz({ id:'english', name:'영어 단어 퀴즈', desc:'초등 영단어 10문제', bg:'#E2F3EC', glyph:'ABC',
  howto:'영어 단어의 뜻(또는 우리말의 영어)을 고르세요. 10문제.',
  promo:{t:'원조는 키오스크 "영어 단어 퀴즈 카드"', d:'키즈 교육형 키오스크 · 도서관·학원·키즈카페'},
  make(){ const ko=ENG.map(x=>x[1]), en=ENG.map(x=>x[0]); return shuf(ENG).map(([e,k],i)=> i%2 ? mc(`<span style="font-family:var(--f);font-size:34px">${e}</span>`,k,ko,{sub:'뜻은?'}) : mc(`<span style="font-size:30px">${k}</span>`,e,en,{sub:'영어로?'})); } });

/* ---------- 맞춤법 퀴즈 ---------- */
const SPELL = [['며칠','몇일'],['됐다','됬다'],['안 돼','안 되'],['웬일이야','왠일이야'],['왠지','웬지'],['어이없다','어의없다'],['금세','금새'],['설거지','설겆이'],['오랜만','오랫만'],['할게','할께'],
 ['굳이','궂이'],['희한하다','희안하다'],['역할','역활'],['깨끗이','깨끗히'],['일부러','일부로'],['베개','배게'],['핼쑥하다','핼쓱하다'],['곰곰이','곰곰히'],['어떡해','어떻해'],['육개장','육계장'],
 ['떡볶이','떡볶기'],['찌개','찌게'],['대가','댓가'],['얽히고설키다','얼키고설키다'],['시험을 치렀다','시험을 치뤘다'],['눈곱','눈꼽'],['구레나룻','구렛나루'],['삼가 주세요','삼가해 주세요'],['나의 바람','나의 바램'],['내로라하는','내노라하는']];
NL.quiz({ id:'spelling', name:'맞춤법 퀴즈', desc:'헷갈리는 맞춤법 10문제', bg:'#F1ECE0', glyph:'가',
  howto:'둘 중 맞춤법이 맞는 것을 고르세요. 10문제.',
  promo:{t:'원조는 키오스크 "받아쓰기·맞춤법 퀴즈"', d:'초등 교육형 키오스크 · 학교 축제·도서관'},
  make(){ return shuf(SPELL).map(([a,w])=>({q:'맞춤법이 맞는 것은?', a, opts:shuf([a,w])})); } });

/* ---------- 끝말잇기 생존전 (이어달리기) ---------- */
const HAN=s=>/^[가-힣]{2,10}$/.test(s);
const jamo=ch=>{ const c=ch.charCodeAt(0)-0xAC00; return {cho:Math.floor(c/588), jung:Math.floor((c%588)/28), jong:c%28}; };
const mk=(cho,jung,jong)=>String.fromCharCode(0xAC00+cho*588+jung*28+jong);
const starts = last => { const j=jamo(last); const s=new Set([last]); const Y=[2,6,12,17,20]; // ㅑ ㅕ ㅛ ㅠ ㅣ
  if(j.cho===5){ s.add(mk(Y.includes(j.jung)||j.jung===7?11:2, j.jung, j.jong)); if(Y.includes(j.jung)) s.add(mk(11,j.jung,j.jong)); }
  if(j.cho===2 && (Y.includes(j.jung)||j.jung===7)) s.add(mk(11,j.jung,j.jong)); return [...s]; };
NL.reg({ id:'wordchain', cat:'quiz', name:'끝말잇기 이어달리기', desc:'한 명씩 이어서 최장 기록', bg:'#E7EDF8', glyph:'끝말', maxB:300,
  long:'시작 단어에 이어 한 명씩 끝말을 이어요. 단어를 넣으면 새 링크가 나오고, 다음 사람이 이어갑니다. 두음법칙 허용, 같은 단어 금지.',
  defTitle:'우리 방 끝말잇기',
  fields:[{k:'w', type:'text', label:'시작 단어', def:'기차', max:10}],
  build(v){ const w=v.w.replace(/\s/g,''); if(!HAN(w)) throw '시작 단어는 한글 2~10자로 넣어 주세요'; return {w}; },
  inviteMsg: r => `[${r.ti}] "${r.d.w}"부터 시작! 끝말 이어서 다음 사람에게 넘겨줘`,
  promo:{t:'키즈 언어게임 키오스크', d:'학교·도서관 행사용 말놀이·받아쓰기 프로그램'},
  render(ctx){ const draw=()=>{ const words=[ctx.room.d.w, ...(ctx.room.b||[]).map(e=>e.w)]; const last=words[words.length-1]; const ok=starts(last[last.length-1]);
      const cnt={}; (ctx.room.b||[]).forEach(e=>cnt[e.by]=(cnt[e.by]||0)+1);
      ctx.el.innerHTML=`<div class="stage"><div class="hud"><div><small>지금까지</small><b>${words.length}단어</b></div><div><small>다음 글자</small><b>${ok.map(E).join(' / ')}</b></div></div>
        <div class="pills" style="max-height:220px;overflow:auto">${words.map((w,i)=>`<span class="pill ${i===words.length-1?'':'done'}">${E(w)}</span>`).join('<span style="align-self:center;color:#B68A36">→</span>')}</div>
        <div class="fld"><label for="wd">이어갈 단어</label><input class="inp" id="wd" maxlength="10" placeholder="${E(ok[0])}(으)로 시작하는 단어"></div><p class="err" id="er" hidden></p>
        <button class="btn" id="go">이어서 링크 받기</button><div id="after"></div></div>
        <div class="stage"><div class="hud"><div><small>많이 이은 사람</small><b style="font-size:18px">이 링크 기준</b></div></div><div class="board">${Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([n,c],i)=>`<div class="brow"><span class="rk num">${i+1}</span><span>${E(n)}</span><span class="v num">${c}개</span></div>`).join('')||'<p class="empty">첫 단어를 이어보세요</p>'}</div><p class="note">${NL.CHAIN_NOTE}</p><div id="mg"></div></div>`;
      NL.mergeUI(NL.$('#mg'), ctx.tool, ctx.room, nr=>{ ctx.room=nr; draw(); });
      NL.$('#go').onclick=async()=>{ const w=NL.$('#wd').value.replace(/\s/g,''); const er=NL.$('#er'); er.hidden=true; const fail=m=>{ er.textContent=m; er.hidden=false; NL.beep(180,.12); };
        if(!HAN(w)) return fail('한글 2~10자로 넣어 주세요'); if(!ok.includes(w[0])) return fail(`"${ok.join('" 또는 "')}"(으)로 시작해야 해요`); if(words.includes(w)) return fail('이미 나온 단어예요');
        const name=await NL.askName('이름을 알려주세요'); if(!name) return;
        await NL.submit(ctx, {n:'#'+words.length, w, by:name}, (nr)=>`[${nr.ti}] ${name}: "${w}" (${words.length+1}단어째). 다음 사람 "${starts(w[w.length-1]).join('/')}"(으)로!`, '이어졌어요! 새 링크를 방에 올려주세요', {name});
        NL.$('#go').hidden=true; }; };
    ctx.redraw=()=>{}; draw(); }
});
})();
