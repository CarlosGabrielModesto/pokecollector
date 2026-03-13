/**
 * PokéCollector — Card Gacha Game v2 Final
 * Complete Game Engine
 * Author: Carlos Gabriel dos Santos Modesto
 */
'use strict';

const CFG = Object.freeze({
  API:'https://pokeapi.co/api/v2', MAX_ID:386,
  ART:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork',
  SPRITE:'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon',
  COST_SINGLE:100, COST_MULTI:450, MULTI_COUNT:5,
  COINS_START:500, COINS_DAILY_RESET:500,
  COINS_NEW:50, COINS_DUP:10,
  DUST_PER_PULL:[5,8,12,20,35,60], // dust por raridade (common→mythic)
  FUSION_COUNT:3, SAVE_KEY:'pokecollector_v2',
  // Clock: 1 real second = 1 game minute → full day = 24 real minutes
  CLOCK_SPEED:1, // game minutes per real second
});

const TYPES={normal:{l:'Normal',e:'⚪'},fire:{l:'Fogo',e:'🔥'},water:{l:'Água',e:'💧'},electric:{l:'Elétrico',e:'⚡'},grass:{l:'Grama',e:'🌿'},ice:{l:'Gelo',e:'❄️'},fighting:{l:'Lutador',e:'🥊'},poison:{l:'Veneno',e:'☠️'},ground:{l:'Terrestre',e:'🌍'},flying:{l:'Voador',e:'🕊️'},psychic:{l:'Psíquico',e:'🔮'},bug:{l:'Inseto',e:'🐛'},rock:{l:'Pedra',e:'🪨'},ghost:{l:'Fantasma',e:'👻'},dragon:{l:'Dragão',e:'🐉'},dark:{l:'Sombrio',e:'🌑'},steel:{l:'Aço',e:'⚙️'},fairy:{l:'Fada',e:'🧚'}};
const STATS={hp:'HP',attack:'ATK',defense:'DEF','special-attack':'SP.A','special-defense':'SP.D',speed:'VEL'};
const STAT_COLORS={hp:'var(--stat-hp)',attack:'var(--stat-atk)',defense:'var(--stat-def)','special-attack':'var(--stat-spa)','special-defense':'var(--stat-spd)',speed:'var(--stat-vel)'};

const RARITY=[
  {key:'common',label:'Comum',stars:'★',color:'var(--rarity-common)',maxBST:319},
  {key:'uncommon',label:'Incomum',stars:'★★',color:'var(--rarity-uncommon)',maxBST:419},
  {key:'rare',label:'Raro',stars:'★★★',color:'var(--rarity-rare)',maxBST:499},
  {key:'epic',label:'Épico',stars:'★★★★',color:'var(--rarity-epic)',maxBST:534},
  {key:'legendary',label:'Lendário',stars:'★★★★★',color:'var(--rarity-legendary)',maxBST:599},
  {key:'mythic',label:'Mítico',stars:'★★★★★★',color:'var(--rarity-mythic)',maxBST:Infinity},
];

const GACHA_RATES=[{key:'common',weight:40},{key:'uncommon',weight:30},{key:'rare',weight:18},{key:'epic',weight:8},{key:'legendary',weight:3.2},{key:'mythic',weight:0.8}];

// Evolution costs (stardust) per rarity level
const EVO_COSTS={common:50,uncommon:120,rare:250,epic:500,legendary:1000};

/* ══════ STATE ══════ */
const defaultState=()=>({
  coins:CFG.COINS_START, stardust:0,
  collection:{}, totalPulls:0, streak:0,
  lastDailyDate:null, recentPulls:[], theme:'dark',
  gameDay:1, gameTime:0, // gameTime in total minutes (0-1439)
  lastRealTime:Date.now(),
});

let S=defaultState();
let pokeCache=new Map();
let nameCache=new Map();
let rarityBuckets={};
let fusionPokemonId=null;

/* ══════ PERSISTENCE ══════ */
function saveGame(){try{localStorage.setItem(CFG.SAVE_KEY,JSON.stringify(S))}catch(e){}}
function loadGame(){try{const r=localStorage.getItem(CFG.SAVE_KEY);if(r){S={...defaultState(),...JSON.parse(r)}}}catch(e){}}
function resetGame(){$('resetModal').classList.remove('hidden')}
function confirmReset(){S=defaultState();saveGame();location.reload()}
function cancelReset(){$('resetModal').classList.add('hidden')}

/* ══════ API ══════ */
async function fetchPoke(id){if(pokeCache.has(id))return pokeCache.get(id);const r=await fetch(`${CFG.API}/pokemon/${id}`);if(!r.ok)throw new Error();const raw=await r.json();const p=normPoke(raw);pokeCache.set(id,p);return p}
async function fetchSpecies(id){const r=await fetch(`${CFG.API}/pokemon-species/${id}`);return r.ok?r.json():null}
async function fetchAbility(url){const r=await fetch(url);return r.ok?r.json():null}

function normPoke(raw){
  const bst=raw.stats.reduce((s,v)=>s+v.base_stat,0);
  return{id:raw.id,name:raw.name,types:raw.types.map(t=>t.type.name),stats:raw.stats.map(s=>({name:s.stat.name,base:s.base_stat})),bst,height:raw.height,weight:raw.weight,abilities:raw.abilities.map(a=>({name:a.ability.name,url:a.ability.url,hidden:a.is_hidden})),img:`${CFG.ART}/${raw.id}.png`,sprite:`${CFG.SPRITE}/${raw.id}.png`,baseExp:raw.base_experience,rarity:calcRarity(bst)};
}
function calcRarity(bst){for(const r of RARITY)if(bst<=r.maxBST)return r.key;return'mythic'}
function getRarityInfo(k){return RARITY.find(r=>r.key===k)||RARITY[0]}
function getRarityIdx(k){return RARITY.findIndex(r=>r.key===k)}

async function preloadAll(){
  updateSplash(0,'Conectando à PokéAPI...');
  for(let i=0;i<CFG.MAX_ID;i+=50){
    const ids=[];for(let j=i+1;j<=Math.min(i+50,CFG.MAX_ID);j++)ids.push(j);
    const res=await Promise.allSettled(ids.map(fetchPoke));
    res.forEach(r=>{if(r.status==='fulfilled')pokeCache.set(r.value.id,r.value)});
    const pct=Math.round(Math.min(i+50,CFG.MAX_ID)/CFG.MAX_ID*100);
    updateSplash(pct,`Carregando Pokémon... ${pokeCache.size}/${CFG.MAX_ID}`);
    const el=$('statMax');if(el)el.textContent=`/ ${CFG.MAX_ID} (${pct}%)`;
  }
  buildRarityBuckets();loadPtNames();
  updateSplash(100,'Pronto!');
  await sleep(400);
  hideSplash();
}
function updateSplash(pct,text){const bar=$('splashBar');const status=$('splashStatus');if(bar)bar.style.width=pct+'%';if(status)status.textContent=text}
function hideSplash(){const el=$('splash');if(el){el.classList.add('splash--hide');setTimeout(()=>el.remove(),700)}}
function buildRarityBuckets(){rarityBuckets={};RARITY.forEach(r=>rarityBuckets[r.key]=[]);pokeCache.forEach(p=>{if(rarityBuckets[p.rarity])rarityBuckets[p.rarity].push(p.id)})}
async function loadPtNames(){for(const id of Object.keys(S.collection).map(Number)){await fetchPtName(id)}for(let i=1;i<=CFG.MAX_ID;i++)if(!nameCache.has(i))fetchPtName(i)}
async function fetchPtName(id){if(nameCache.has(id))return nameCache.get(id);try{const sp=await fetchSpecies(id);if(sp){const n=sp.names.find(n=>n.language.name==='pt-BR')||sp.names.find(n=>n.language.name==='en');if(n){nameCache.set(id,n.name);return n.name}}}catch(e){}const p=pokeCache.get(id);const f=p?capitalize(p.name):`#${id}`;nameCache.set(id,f);return f}
function getDisplayName(id){return nameCache.has(id)?nameCache.get(id):capitalize(pokeCache.get(id)?.name||`#${id}`)}

/* ══════ CLOCK SYSTEM ══════ */
let clockInterval=null;
let clockSpeed=1; // game minutes per real second (controlled by slider)

function startClock(){
  const elapsed=Math.floor((Date.now()-S.lastRealTime)/1000)*1;
  S.gameTime+=elapsed;
  while(S.gameTime>=1440){S.gameTime-=1440;onNewDay()}
  S.lastRealTime=Date.now();
  updateClockUI();
  clockInterval=setInterval(()=>{
    S.gameTime+=clockSpeed;
    if(S.gameTime>=1440){S.gameTime-=1440;onNewDay()}
    S.lastRealTime=Date.now();
    updateClockUI();
    if(S.gameTime%60===0)saveGame();
  },1000);
}

function setClockSpeed(val){
  clockSpeed=val;
  $('speedVal').textContent=`×${val}`;
}

function onNewDay(){
  S.gameDay++;
  S.coins=CFG.COINS_DAILY_RESET;
  S.lastDailyDate=null; // reset daily pull
  S.streak++;
  saveGame();
  updateCoinsUI();updateDailyUI();updateDashboard();
  showToast(`🌅 Dia ${S.gameDay}! Moedas e pull diário renovados!`,'success');
}

function updateClockUI(){
  const h=Math.floor(S.gameTime/60);
  const m=S.gameTime%60;
  $('clockTime').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  $('clockDay').textContent=`Dia ${S.gameDay}`;
  $('clockFill').style.width=`${(S.gameTime/1440)*100}%`;
  // Granular time-of-day icons
  let icon='🌙';
  if(h>=5&&h<7) icon='🌅';      // dawn
  else if(h>=7&&h<12) icon='☀️'; // morning
  else if(h>=12&&h<17) icon='🌤️';// afternoon
  else if(h>=17&&h<19) icon='🌇'; // dusk
  $('clockIcon').textContent=icon;
  // Apply gradual theme transition
  applyDayNight(S.gameTime);
}

/* ══════ GACHA ══════ */
function rollRarity(){const t=GACHA_RATES.reduce((s,r)=>s+r.weight,0);let roll=Math.random()*t;for(const r of GACHA_RATES){roll-=r.weight;if(roll<=0)return r.key}return'common'}
function rollPokemon(){const rarity=rollRarity();const b=rarityBuckets[rarity];if(!b||!b.length)return rollPokemon();return{id:b[Math.floor(Math.random()*b.length)],rarity}}

function addToCollection(id, silent=false){
  const isNew=!S.collection[id];
  if(!S.collection[id])S.collection[id]={count:0,favorite:false,firstObtained:Date.now()};
  S.collection[id].count++;S.totalPulls++;
  S.recentPulls.unshift(id);if(S.recentPulls.length>10)S.recentPulls.pop();
  const poke=pokeCache.get(id);
  const ri=getRarityIdx(poke?.rarity||'common');
  const dust=CFG.DUST_PER_PULL[ri]||5;
  S.stardust+=dust;
  const coinsEarned=isNew?CFG.COINS_NEW:CFG.COINS_DUP;
  S.coins+=coinsEarned;
  fetchPtName(id);saveGame();
  return{isNew,dust,coinsEarned};
}
function canAfford(c){return S.coins>=c}
function spend(c){S.coins-=c;saveGame();updateCoinsUI()}
function isDailyAvailable(){const today=`day-${S.gameDay}`;return S.lastDailyDate!==today}
function claimDaily(){S.lastDailyDate=`day-${S.gameDay}`;saveGame()}

/* ══════ FUSION ══════ */
function getEligibleForFusion(){
  const e=[];
  for(const[idStr,d]of Object.entries(S.collection)){
    if(d.count>=CFG.FUSION_COUNT){const id=Number(idStr);const p=pokeCache.get(id);if(p&&p.rarity!=='mythic')e.push({id,...d,rarity:p.rarity})}
  }
  return e;
}
function executeFusion(pokemonId){
  const p=pokeCache.get(pokemonId);if(!p)return null;
  const d=S.collection[pokemonId];if(!d||d.count<CFG.FUSION_COUNT)return null;
  d.count-=CFG.FUSION_COUNT;if(d.count<=0)delete S.collection[pokemonId];
  const ci=RARITY.findIndex(r=>r.key===p.rarity);
  const nr=RARITY[Math.min(ci+1,RARITY.length-1)].key;
  const b=rarityBuckets[nr];if(!b||!b.length)return null;
  const nid=b[Math.floor(Math.random()*b.length)];
  addToCollection(nid);saveGame();return nid;
}

/* ══════ EVOLUTION ══════ */
function getEvolvable(){
  const result=[];
  for(const[idStr,d]of Object.entries(S.collection)){
    const id=Number(idStr);const p=pokeCache.get(id);
    if(!p||p.rarity==='mythic')continue;
    const cost=EVO_COSTS[p.rarity];
    if(cost&&S.stardust>=cost)result.push({id,poke:p,cost,count:d.count});
  }
  return result;
}

function evolveCard(pokemonId){
  const p=pokeCache.get(pokemonId);if(!p)return null;
  const cost=EVO_COSTS[p.rarity];if(!cost||S.stardust<cost)return null;
  S.stardust-=cost;
  // Remove one copy of current
  const d=S.collection[pokemonId];if(!d||d.count<1)return null;
  d.count--;if(d.count<=0)delete S.collection[pokemonId];
  // Get next rarity
  const ci=RARITY.findIndex(r=>r.key===p.rarity);
  const nr=RARITY[Math.min(ci+1,RARITY.length-1)].key;
  const b=rarityBuckets[nr];if(!b||!b.length)return null;
  const nid=b[Math.floor(Math.random()*b.length)];
  addToCollection(nid);saveGame();return nid;
}

/* ══════ UI HELPERS ══════ */
const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);
function updateCoinsUI(){$('coinsValue').textContent=S.coins.toLocaleString('pt-BR');$('dustValue').textContent=S.stardust.toLocaleString('pt-BR')}
function updateDailyUI(){
  const btn=$('dailyBtn'),fb=$('pullFree'),fs=$('freeStatus');
  if(isDailyAvailable()){btn.classList.remove('used');$('dailyText').textContent='Grátis!';fb.disabled=false;fs.textContent='Disponível!';fs.style.color=''}
  else{btn.classList.add('used');$('dailyText').textContent='Usado';fb.disabled=true;fs.textContent='Amanhã';fs.style.color='var(--text-3)'}
}
function updatePullButtons(){$('pullSingle').disabled=!canAfford(CFG.COST_SINGLE);$('pullMulti').disabled=!canAfford(CFG.COST_MULTI);updateDailyUI()}

/* ══════ CARD RENDER ══════ */
function renderCard(pokemon,opts={}){
  const{small=false,showCount=false,showFav=false,showNew=false,showEvolve=false,onClick=null,onEvolve=null}=opts;
  const ri=getRarityInfo(pokemon.rarity);const count=S.collection[pokemon.id]?.count||0;
  const isFav=S.collection[pokemon.id]?.favorite||false;const dn=getDisplayName(pokemon.id);
  const card=document.createElement('div');
  card.className=`game-card game-card--${pokemon.rarity}${small?' game-card--sm':''}`;card.dataset.id=pokemon.id;
  const tp=pokemon.types.map(t=>`<span class="type-pip" style="background:var(--type-${t})">${TYPES[t]?.l||t}</span>`).join('');
  const evoCost=EVO_COSTS[pokemon.rarity];
  card.innerHTML=`
    ${showCount&&count>1?`<span class="game-card__count">×${count}</span>`:''}
    ${showNew?'<span class="game-card__new">NOVO</span>':''}
    ${showFav?`<button class="game-card__fav ${isFav?'game-card__fav--active':''}" data-fav="${pokemon.id}">${isFav?'⭐':'☆'}</button>`:''}
    ${showEvolve&&evoCost?`<button class="game-card__evolve" data-evo="${pokemon.id}">${evoCost} ✨</button>`:''}
    <div class="game-card__header"><span class="game-card__number">#${String(pokemon.id).padStart(3,'0')}</span><span class="game-card__rarity" style="color:${ri.color}">${ri.stars}</span></div>
    <div class="game-card__img-wrap"><img class="game-card__img" src="${pokemon.img}" alt="${dn}" loading="lazy" onerror="this.src='${pokemon.sprite}'"/></div>
    <div class="game-card__meta"><div class="game-card__name">${dn}</div><div class="game-card__types">${tp}</div></div>`;
  if(onClick)card.addEventListener('click',e=>{if(!e.target.closest('.game-card__fav')&&!e.target.closest('.game-card__evolve'))onClick(pokemon.id)});
  const fb=card.querySelector('.game-card__fav');
  if(fb)fb.addEventListener('click',e=>{e.stopPropagation();toggleFavorite(pokemon.id);fb.classList.toggle('game-card__fav--active');fb.textContent=S.collection[pokemon.id]?.favorite?'⭐':'☆'});
  const eb=card.querySelector('.game-card__evolve');
  if(eb&&onEvolve)eb.addEventListener('click',e=>{e.stopPropagation();onEvolve(pokemon.id)});
  // 3D tilt
  card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;card.style.transform=`perspective(600px) rotateY(${x*12}deg) rotateX(${-y*12}deg) translateY(-8px)`});
  card.addEventListener('mouseleave',()=>{card.style.transform=''});
  return card;
}
function toggleFavorite(id){if(S.collection[id]){S.collection[id].favorite=!S.collection[id].favorite;saveGame();updateDashboard()}}

/* ══════ VIEWS ══════ */
function switchView(v){
  $$('.view').forEach(el=>el.classList.remove('view--active'));
  $(`view${v.charAt(0).toUpperCase()+v.slice(1)}`).classList.add('view--active');
  $$('.nav__item').forEach(n=>n.classList.toggle('nav__item--active',n.dataset.view===v));
  if(v==='dashboard')updateDashboard();if(v==='collection')renderCollection();
  if(v==='fusion')renderFusion();if(v==='gacha')updatePullButtons();
  if(v==='evolve')renderEvolve();
}

function updateDashboard(){
  const c=Object.entries(S.collection);
  $('statUnique').textContent=c.length;
  $('statTotal').textContent=c.reduce((s,[,d])=>s+d.count,0);
  $('statDups').textContent=c.reduce((s,[,d])=>s+Math.max(0,d.count-1),0);
  $('statFavs').textContent=c.filter(([,d])=>d.favorite).length;
  $('statStreak').textContent=S.streak;
  $('statPulls').textContent=S.totalPulls;
  $('statMax').textContent=`/ ${CFG.MAX_ID}`;
  // Rarity bars
  const bars=$('rarityBars');bars.innerHTML='';
  RARITY.forEach(r=>{const t=(rarityBuckets[r.key]||[]).length;const o=(rarityBuckets[r.key]||[]).filter(id=>S.collection[id]).length;
    bars.innerHTML+=`<div class="rbar"><span class="rbar__label"><span class="rbar__dot" style="background:${r.color}"></span>${r.label}</span><span class="rbar__count">${o}/${t}</span><div class="rbar__track"><div class="rbar__fill" style="width:${t?o/t*100:0}%;background:${r.color}"></div></div></div>`});
  // Recent
  const rc=$('recentCards');
  if(!S.recentPulls.length){rc.innerHTML='<p class="muted">Nenhuma carta ainda. Vá para o Gacha!</p>';return}
  rc.innerHTML='';
  S.recentPulls.slice(0,8).forEach(id=>{const p=pokeCache.get(id);if(p)rc.appendChild(renderCard(p,{small:true,onClick:openCardModal}))});
}

function renderCollection(){
  const grid=$('collGrid'),empty=$('collEmpty'),entries=Object.entries(S.collection);
  if(!entries.length){grid.innerHTML='';empty.classList.remove('hidden');$('collCount').textContent='0 cartas';return}
  empty.classList.add('hidden');
  let list=entries.map(([id,d])=>{const p=pokeCache.get(Number(id));return p?{...p,count:d.count,favorite:d.favorite,firstObtained:d.firstObtained}:null}).filter(Boolean);
  const tf=$('collType').value,rf=$('collRarity').value,sq=$('collSearch').value.toLowerCase().trim();
  if(tf!=='all')list=list.filter(p=>p.types.includes(tf));
  if(rf!=='all')list=list.filter(p=>p.rarity===rf);
  if(sq)list=list.filter(p=>getDisplayName(p.id).toLowerCase().includes(sq)||p.name.includes(sq)||String(p.id).padStart(3,'0').includes(sq));
  const sort=$('collSort').value;
  if(sort==='recent')list.sort((a,b)=>(b.firstObtained||0)-(a.firstObtained||0));
  else if(sort==='id-asc')list.sort((a,b)=>a.id-b.id);
  else if(sort==='name-asc')list.sort((a,b)=>getDisplayName(a.id).localeCompare(getDisplayName(b.id)));
  else if(sort==='rarity-desc')list.sort((a,b)=>getRarityIdx(b.rarity)-getRarityIdx(a.rarity));
  else if(sort==='count-desc')list.sort((a,b)=>b.count-a.count);
  else if(sort==='favorites')list=list.filter(p=>p.favorite);
  grid.innerHTML='';list.forEach(p=>grid.appendChild(renderCard(p,{showCount:true,showFav:true,onClick:openCardModal})));
  $('collCount').textContent=`${list.length} carta${list.length!==1?'s':''}`;
}

/* ── FUSION with picker ── */
function renderFusion(){
  fusionPokemonId=null;
  [0,1,2].forEach(i=>{$(`fSlot${i}`).innerHTML='<div class="fusion__slot-empty"><span>+</span><small>Selecionar</small></div>';$(`fSlot${i}`).classList.remove('fusion__slot--filled')});
  $('fusionResult').innerHTML='<div class="fusion__slot-empty"><span>?</span><small>Resultado</small></div>';
  $('fusionBtn').disabled=true;
  const eligible=getEligibleForFusion();const grid=$('fusionGrid'),empty=$('fusionEmpty');
  if(!eligible.length){grid.innerHTML='';empty.classList.remove('hidden');return}
  empty.classList.add('hidden');grid.innerHTML='';
  eligible.forEach(({id})=>{const p=pokeCache.get(id);if(p)grid.appendChild(renderCard(p,{showCount:true,onClick:()=>selectForFusion(id)}))});
}

function openFusionPicker(){
  const eligible=getEligibleForFusion();
  if(!eligible.length){showToast('Nenhuma carta com 3+ cópias','warning');return}
  const grid=$('pickerGrid');grid.innerHTML='';
  eligible.forEach(({id,count})=>{
    const p=pokeCache.get(id);if(!p)return;
    const card=renderCard(p,{showCount:true,onClick:()=>{selectForFusion(id);closePickerModal()}});
    grid.appendChild(card);
  });
  $('pickerModal').classList.remove('hidden');
}

function closePickerModal(){$('pickerModal').classList.add('hidden')}

function selectForFusion(id){
  fusionPokemonId=id;const p=pokeCache.get(id);if(!p)return;
  for(let i=0;i<3;i++){
    const sl=$(`fSlot${i}`);
    sl.innerHTML=`<img src="${p.img}" alt="${getDisplayName(id)}" style="width:100%;height:100%;object-fit:contain;padding:8px" onerror="this.src='${p.sprite}'"/>`;
    sl.classList.add('fusion__slot--filled');
  }
  $('fusionBtn').disabled=false;
  showToast(`${getDisplayName(id)} selecionado`,'info');
}

/* ── EVOLVE ── */
function renderEvolve(){
  const list=getEvolvable();const grid=$('evolveGrid'),empty=$('evolveEmpty');
  if(!list.length){grid.innerHTML='';empty.classList.remove('hidden');return}
  empty.classList.add('hidden');grid.innerHTML='';
  list.forEach(({id,poke,cost})=>{
    grid.appendChild(renderCard(poke,{showCount:true,showEvolve:true,onClick:openCardModal,onEvolve:async(eid)=>{
      if(S.stardust<cost)return showToast('Stardust insuficiente!','error');
      const nid=evolveCard(eid);
      if(nid){
        const np=pokeCache.get(nid);const ri=getRarityInfo(np?.rarity||'common');
        showToast(`🌟 Evoluiu para ${getDisplayName(nid)} (${ri.label})!`,'success');
        fireConfetti(np?.rarity||'rare');
        updateCoinsUI();renderEvolve();updateDashboard();
      }else{showToast('Evolução falhou','error')}
    }}));
  });
}

/* ══════ GACHA FLOW ══════ */
async function doPull(type){
  const idle=$('gachaIdle'),pulling=$('gachaPulling'),result=$('gachaResult'),multi=$('gachaMulti');
  if(type==='single'){if(!canAfford(CFG.COST_SINGLE))return showToast('💰 Moedas insuficientes!','error');spend(CFG.COST_SINGLE)}
  else if(type==='multi'){if(!canAfford(CFG.COST_MULTI))return showToast('💰 Moedas insuficientes!','error');spend(CFG.COST_MULTI)}
  else if(type==='free'){if(!isDailyAvailable())return showToast('⏰ Já usado hoje!','warning');claimDaily()}
  idle.classList.add('hidden');result.classList.add('hidden');multi.classList.add('hidden');pulling.classList.remove('hidden');
  const count=type==='multi'?CFG.MULTI_COUNT:1;const pulls=[];
  for(let i=0;i<count;i++)pulls.push(rollPokemon());
  await sleep(1800);pulling.classList.add('hidden');

  if(count===1){
    // Single pull — info completa na própria tela de resultado
    const{id,rarity}=pulls[0];const p=pokeCache.get(id);if(!p)return resetGachaStage();
    const earned=addToCollection(id);const ri=getRarityInfo(rarity);
    $('resultGlow').style.background=ri.color;
    const ce=renderCard(p,{showNew:earned.isNew});$('resultCard').innerHTML='';$('resultCard').appendChild(ce);
    $('resultInfo').innerHTML=`<h3>${getDisplayName(id)}</h3><p style="color:${ri.color};font-weight:700">${ri.stars} ${ri.label}</p><p class="muted">+${earned.coinsEarned} PC · +${earned.dust} ✨</p>${earned.isNew?'<p style="color:var(--rarity-legendary)">✨ Novo Pokémon!</p>':`<p class="muted">Duplicata (×${S.collection[id].count})</p>`}`;
    result.classList.remove('hidden');
    if(['rare','epic','legendary','mythic'].includes(rarity))fireConfetti(rarity);
  }else{
    // Multi pull — um único toast resumo no final
    const container=$('multiCards');container.innerHTML='';
    let hasRare=false, totalCoins=0, totalDust=0, newCount=0;
    for(let i=0;i<pulls.length;i++){
      const{id,rarity}=pulls[i];const p=pokeCache.get(id);if(!p)continue;
      const earned=addToCollection(id);
      totalCoins+=earned.coinsEarned;totalDust+=earned.dust;
      if(earned.isNew)newCount++;
      const card=renderCard(p,{small:true,showNew:earned.isNew});
      card.style.animation='cardReveal .6s var(--ease-spring) both';
      card.style.animationDelay=`${i*.15}s`;
      container.appendChild(card);
      if(['epic','legendary','mythic'].includes(rarity))hasRare=true;
    }
    multi.classList.remove('hidden');
    if(hasRare)fireConfetti('epic');
    // Um único toast com resumo do multi pull
    const parts=[];
    if(newCount>0)parts.push(`${newCount} novo${newCount>1?'s':''}`);
    parts.push(`+${totalCoins} PC`);
    parts.push(`+${totalDust} ✨`);
    showToast(`🎴 ${parts.join(' · ')}`,newCount>0?'success':'info');
  }
  updateCoinsUI();updatePullButtons();updateDashboard();
}
function resetGachaStage(){$('gachaIdle').classList.remove('hidden');$('gachaPulling').classList.add('hidden');$('gachaResult').classList.add('hidden');$('gachaMulti').classList.add('hidden');updatePullButtons()}

/* ══════ CARD MODAL ══════ */
async function openCardModal(id){
  const p=pokeCache.get(id);if(!p)return;const ri=getRarityInfo(p.rarity);
  const isFav=S.collection[id]?.favorite||false;const count=S.collection[id]?.count||0;const dn=getDisplayName(id);
  const body=$('cardModalBody');
  body.innerHTML=`<div class="cm-header"><div class="cm-header__bg" style="background:linear-gradient(135deg,var(--type-${p.types[0]}),color-mix(in srgb,var(--type-${p.types[0]}) 50%,#000))"></div><img class="cm-header__img" src="${p.img}" alt="${dn}" onerror="this.src='${p.sprite}'"/><div class="cm-header__content"><div class="cm-header__top"><span class="cm-header__num">#${String(p.id).padStart(3,'0')}</span><button class="cm-header__close" id="cmClose"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div><h2 class="cm-header__name">${dn}</h2><div class="cm-header__rarity" style="color:${ri.color}">${ri.stars} ${ri.label} ${count>1?`<span style="color:rgba(255,255,255,.5)">×${count}</span>`:''}</div><div class="cm-header__types">${p.types.map(t=>`<span class="type-pip">${TYPES[t]?.l||t}</span>`).join('')}</div></div></div>
  <div class="cm-body"><div class="cm-tabs"><button class="cm-tab cm-tab--active" data-panel="stats">Stats</button><button class="cm-tab" data-panel="about">Sobre</button><button class="cm-tab" data-panel="abilities">Habilidades</button></div>
  <div class="cm-panel cm-panel--active" id="cmStats">${p.stats.map(s=>{const pct=Math.min(s.base/255*100,100);return`<div class="cm-stat"><span class="cm-stat__label">${STATS[s.name]||s.name}</span><span class="cm-stat__val">${s.base}</span><div class="cm-stat__bar"><div class="cm-stat__fill" data-w="${pct}%" style="background:${STAT_COLORS[s.name]||'var(--accent)'}"></div></div></div>`}).join('')}<div class="cm-total"><span>Total</span><span>${p.bst}</span></div></div>
  <div class="cm-panel" id="cmAbout"><div class="cm-about-grid"><div class="cm-about-item"><div class="cm-about-item__lbl">Altura</div><div class="cm-about-item__val">${(p.height/10).toFixed(1)} m</div></div><div class="cm-about-item"><div class="cm-about-item__lbl">Peso</div><div class="cm-about-item__val">${(p.weight/10).toFixed(1)} kg</div></div><div class="cm-about-item"><div class="cm-about-item__lbl">Exp. Base</div><div class="cm-about-item__val">${p.baseExp||'—'}</div></div><div class="cm-about-item"><div class="cm-about-item__lbl">Nº Nacional</div><div class="cm-about-item__val">#${String(p.id).padStart(3,'0')}</div></div></div><div class="cm-flavor" id="cmFlavor">Carregando...</div></div>
  <div class="cm-panel" id="cmAbilities"><div class="muted">Carregando...</div></div></div>
  <div class="cm-nav"><button class="cm-fav-btn ${isFav?'cm-fav-btn--active':''}" id="cmFavBtn" data-id="${p.id}">${isFav?'⭐ Favorito':'☆ Favoritar'}</button></div>`;
  $('cardModal').classList.remove('hidden');document.body.style.overflow='hidden';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{body.querySelectorAll('.cm-stat__fill').forEach(b=>b.style.width=b.dataset.w)}));
  fetchSpecies(id).then(sp=>{if(!sp)return;const e=sp.flavor_text_entries.find(e=>e.language.name==='pt-BR')||sp.flavor_text_entries.find(e=>e.language.name==='en');const el=document.getElementById('cmFlavor');if(el)el.textContent=e?e.flavor_text.replace(/[\f\n]/g,' '):'Indisponível.'});
  Promise.allSettled(p.abilities.map(async a=>{const d=await fetchAbility(a.url);const desc=d?.flavor_text_entries?.find(e=>e.language.name==='en')?.flavor_text||d?.effect_entries?.find(e=>e.language.name==='en')?.short_effect||'N/A';return{name:a.name.replace(/-/g,' '),hidden:a.hidden,desc}})).then(r=>{const el=document.getElementById('cmAbilities');if(!el)return;el.innerHTML=r.filter(x=>x.status==='fulfilled').map(x=>`<div class="cm-ability"><div class="cm-ability__head"><span class="cm-ability__name">${capitalize(x.value.name)}</span>${x.value.hidden?'<span class="cm-ability__hidden">Oculta</span>':''}</div><p class="cm-ability__desc">${x.value.desc}</p></div>`).join('')});
  body.addEventListener('click',modalHandler);
}
function modalHandler(e){
  if(e.target.closest('#cmClose'))closeCardModal();
  const tab=e.target.closest('.cm-tab');
  if(tab){$$('.cm-tab').forEach(t=>t.classList.remove('cm-tab--active'));tab.classList.add('cm-tab--active');$$('.cm-panel').forEach(p=>p.classList.remove('cm-panel--active'));const panel=document.getElementById(`cm${capitalize(tab.dataset.panel)}`);if(panel){panel.classList.add('cm-panel--active');if(tab.dataset.panel==='stats')requestAnimationFrame(()=>requestAnimationFrame(()=>{panel.querySelectorAll('.cm-stat__fill').forEach(b=>b.style.width=b.dataset.w)}))}}
  const fb=e.target.closest('#cmFavBtn');if(fb){const id=Number(fb.dataset.id);toggleFavorite(id);const f=S.collection[id]?.favorite;fb.className=`cm-fav-btn ${f?'cm-fav-btn--active':''}`;fb.innerHTML=f?'⭐ Favorito':'☆ Favoritar'}
}
function closeCardModal(){$('cardModal').classList.add('hidden');document.body.style.overflow=''}

/* ══════ TOAST ══════ */
function showToast(msg,type='info'){const w=$('toastWrap');const t=document.createElement('div');t.className=`toast toast--${type}`;t.innerHTML=msg;w.appendChild(t);setTimeout(()=>{t.classList.add('toast--exit');setTimeout(()=>t.remove(),300)},2500)}

/* ══════ CONFETTI ══════ */
function fireConfetti(rarity){
  const c=$('confetti'),ctx=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
  const colors={rare:['#2196f3','#64b5f6','#fff'],epic:['#9c27b0','#ce93d8','#fff'],legendary:['#ff9800','#ffb74d','#ffd700','#fff'],mythic:['#e91e63','#ff9800','#ffeb3b','#4caf50','#2196f3','#9c27b0']};
  const ps=[];const n=rarity==='mythic'?200:rarity==='legendary'?150:80;const pal=colors[rarity]||colors.rare;
  for(let i=0;i<n;i++)ps.push({x:c.width/2+(Math.random()-.5)*200,y:c.height/2,vx:(Math.random()-.5)*16,vy:-Math.random()*18-4,w:Math.random()*8+4,h:Math.random()*6+2,color:pal[Math.floor(Math.random()*pal.length)],rot:Math.random()*360,rotV:(Math.random()-.5)*12,g:.3+Math.random()*.2,life:1});
  (function anim(){ctx.clearRect(0,0,c.width,c.height);let alive=false;ps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.rot+=p.rotV;p.life-=.008;if(p.life<=0)return;alive=true;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore()});if(alive)requestAnimationFrame(anim);else ctx.clearRect(0,0,c.width,c.height)})();
}

/* ══════ PARTICLES ══════ */
function initParticles(){
  const c=$('particles'),ctx=c.getContext('2d');let w,h,dots=[];
  function resize(){w=c.width=innerWidth;h=c.height=innerHeight}
  function create(){dots=[];const n=Math.floor(w*h/14000);for(let i=0;i<n;i++)dots.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.5,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,a:Math.random()*.4+.1})}
  function draw(){ctx.clearRect(0,0,w,h);const dk=document.documentElement.dataset.theme==='dark';dots.forEach(d=>{d.x+=d.vx;d.y+=d.vy;if(d.x<0)d.x=w;if(d.x>w)d.x=0;if(d.y<0)d.y=h;if(d.y>h)d.y=0;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fillStyle=dk?`rgba(255,255,255,${d.a})`:`rgba(0,0,0,${d.a*.5})`;ctx.fill()});requestAnimationFrame(draw)}
  resize();create();draw();window.addEventListener('resize',()=>{resize();create()});
}

/* ══════ DYNAMIC DAY/NIGHT CYCLE ══════ */
/*
  Instead of a manual toggle, the theme transitions gradually:
  00:00–05:00  → Full night (dark)
  05:00–07:00  → Dawn transition (dark → light)
  07:00–17:00  → Full day (light)
  17:00–19:00  → Dusk transition (light → dark)
  19:00–24:00  → Full night (dark)
*/

// Color pairs: [dark value, light value]
const THEME_VARS = {
  '--bg-0':    ['#07071a','#f0f2f7'],
  '--bg-1':    ['#0d0d24','#ffffff'],
  '--bg-2':    ['#14142e','#f7f8fb'],
  '--bg-3':    ['#1c1c44','#eceef4'],
  '--bg-4':    ['#24245a','#dfe2ea'],
  '--text-0':  ['#f2f2fa','#1a1a2e'],
  '--text-1':  ['#c4c4d8','#3a3a5c'],
  '--text-2':  ['#8888a8','#7a7a9a'],
  '--text-3':  ['#5a5a78','#aaaab8'],
  '--accent':  ['#e63946','#d62839'],
};

// RGBA pairs (border, shadow, glass — handled separately)
const THEME_RGBA = {
  '--border-0':    ['rgba(255,255,255,.04)','rgba(0,0,0,.04)'],
  '--border-1':    ['rgba(255,255,255,.08)','rgba(0,0,0,.08)'],
  '--border-2':    ['rgba(255,255,255,.14)','rgba(0,0,0,.14)'],
  '--shadow-card': ['0 4px 24px rgba(0,0,0,.4)','0 4px 20px rgba(0,0,0,.08)'],
  '--shadow-hover':['0 12px 48px rgba(0,0,0,.55)','0 12px 40px rgba(0,0,0,.14)'],
  '--accent-glow': ['rgba(230,57,70,.3)','rgba(214,40,57,.2)'],
  '--glass':       ['rgba(12,12,30,.7)','rgba(255,255,255,.75)'],
  '--glass-border':['rgba(255,255,255,.06)','rgba(0,0,0,.06)'],
  '--overlay':     ['rgba(5,5,18,.85)','rgba(240,242,247,.85)'],
};

/** Parse hex color to [r, g, b] */
function hexToRgb(hex){
  hex=hex.replace('#','');
  return[parseInt(hex.substring(0,2),16),parseInt(hex.substring(2,4),16),parseInt(hex.substring(4,6),16)];
}

/** Convert [r, g, b] back to hex */
function rgbToHex(r,g,b){
  return'#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
}

/** Lerp between two hex colors. t=0 → colorA, t=1 → colorB */
function lerpColor(hexA,hexB,t){
  const a=hexToRgb(hexA),b=hexToRgb(hexB);
  return rgbToHex(a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t);
}

/** Lerp between two RGBA strings (just swaps, no parse needed) */
function lerpRgba(rgbaA,rgbaB,t){return t<0.5?rgbaA:rgbaB}

/**
 * Returns daylight factor 0 (full dark) → 1 (full light)
 * based on current game time in minutes (0-1439).
 */
function getDaylightFactor(time){
  if(time<300) return 0;                         // 00:00–05:00 night
  if(time<420) return(time-300)/120;              // 05:00–07:00 dawn
  if(time<1020) return 1;                         // 07:00–17:00 day
  if(time<1140) return 1-(time-1020)/120;         // 17:00–19:00 dusk
  return 0;                                       // 19:00–24:00 night
}

/** Apply interpolated theme to :root based on daylight factor */
function applyDayNight(time){
  const t=getDaylightFactor(time);
  const root=document.documentElement;

  // Interpolate hex colors
  for(const[prop,[dark,light]] of Object.entries(THEME_VARS)){
    root.style.setProperty(prop,lerpColor(dark,light,t));
  }

  // Swap RGBA values at threshold
  for(const[prop,[dark,light]] of Object.entries(THEME_RGBA)){
    root.style.setProperty(prop,lerpRgba(dark,light,t));
  }

  // Keep data-theme for components that check it (particles)
  root.dataset.theme=t>0.5?'light':'dark';
}

/* ══════ UTILS ══════ */
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
function populateTypeFilters(){const s=$('collType');for(const[k,v]of Object.entries(TYPES)){const o=document.createElement('option');o.value=k;o.textContent=`${v.e} ${v.l}`;s.appendChild(o)}}

/* ══════ EVENTS ══════ */
function bindEvents(){
  $$('.nav__item').forEach(n=>n.addEventListener('click',()=>switchView(n.dataset.view)));
  // Speed slider
  $('speedRange').addEventListener('input',e=>{setClockSpeed(Number(e.target.value))});
  $('dailyBtn').addEventListener('click',()=>switchView('gacha'));
  $('dashGo').addEventListener('click',()=>switchView('gacha'));
  $('pullSingle').addEventListener('click',()=>doPull('single'));
  $('pullMulti').addEventListener('click',()=>doPull('multi'));
  $('pullFree').addEventListener('click',()=>doPull('free'));
  $('resultNext').addEventListener('click',resetGachaStage);
  $('multiCollect').addEventListener('click',resetGachaStage);
  $('ratesToggle').addEventListener('click',()=>$('ratesPanel').classList.toggle('hidden'));
  const dc=debounce(renderCollection,250);
  $('collSearch').addEventListener('input',dc);
  $('collType').addEventListener('change',renderCollection);
  $('collRarity').addEventListener('change',renderCollection);
  $('collSort').addEventListener('change',renderCollection);
  $('collGoGacha')?.addEventListener('click',()=>switchView('gacha'));
  // Fusion slots → open picker
  [0,1,2].forEach(i=>$(`fSlot${i}`).addEventListener('click',()=>{if(!fusionPokemonId)openFusionPicker()}));
  $('fusionBtn').addEventListener('click',async()=>{
    if(!fusionPokemonId)return;$('fusionBtn').disabled=true;showToast('⚡ Fundindo...','info');await sleep(1200);
    const nid=executeFusion(fusionPokemonId);
    if(nid){const np=pokeCache.get(nid);if(np){const ri=getRarityInfo(np.rarity);$('fusionResult').innerHTML='';const card=renderCard(np,{showNew:true});card.style.width='100%';card.style.height='100%';$('fusionResult').appendChild(card);showToast(`🎉 ${getDisplayName(nid)} (${ri.label})!`,'success');fireConfetti(np.rarity)}}
    else showToast('❌ Falhou!','error');
    setTimeout(()=>renderFusion(),2000);updateDashboard();updateCoinsUI();
  });
  $('pickerModalBg').addEventListener('click',closePickerModal);
  $('pickerClose').addEventListener('click',closePickerModal);
  $('cardModalBg').addEventListener('click',closeCardModal);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCardModal();closePickerModal();cancelReset()}});
  $('resetGameBtn')?.addEventListener('click',resetGame);
  $('resetConfirm')?.addEventListener('click',confirmReset);
  $('resetCancel')?.addEventListener('click',cancelReset);
  $('resetModalBg')?.addEventListener('click',cancelReset);
}

/* ══════ INIT ══════ */
async function init(){
  loadGame();
  document.documentElement.dataset.theme='dark'; // default for splash
  applyDayNight(S.gameTime); // apply current time-based theme
  populateTypeFilters();bindEvents();
  updateCoinsUI();updateDailyUI();initParticles();startClock();
  await preloadAll();
  updateDashboard();updatePullButtons();
  setTimeout(()=>{if(isDailyAvailable())showToast('🎁 Pull diário disponível!','success')},1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
