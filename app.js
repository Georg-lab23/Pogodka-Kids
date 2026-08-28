const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORAGE='pogodka_kids_web_v1';
const defaults={
  coords:{lat:50.4501,lon:30.5234,label:'Збережена локація'},
  child:{name:'КАЮСЬКА',age:'6–12 місяців',sensitivity:'normal',activity:'normal',gender:'girl'},
  wardrobe:{shirt:true,long:true,fleece:true,windj:true,demi:true,winter:true,pants:true,shorts:true,hat:true,warmhat:true,gloves:true,sneakers:true,boots:true},
  weather:{valid:false,temp:16.6,feels:16.2,humidity:67,wind:1.2,precip:0,code:1,updated:'демо',morning:null,noon:null,evening:null},
  walk:{duration:60,mode:'normal',departure:'now'}, favorite:null
};
let state=load(); let currentScreen='home';
function load(){try{return merge(defaults,JSON.parse(localStorage.getItem(STORAGE)||'{}'))}catch{return structuredClone(defaults)}}
function merge(a,b){if(Array.isArray(a)||typeof a!=='object'||a===null)return b??a;const o={...a};for(const k in b)o[k]=k in a?merge(a[k],b[k]):b[k];return o}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function e(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function sensitivityText(v){return v==='cold'?'🥶 Мерзляк':v==='hot'?'🔥 Швидко стає жарко':'🙂 Звичайна чутливість'}
function activityText(v){return v==='stroller'?'🛒 Мало рухається':v==='active'?'🏃 Активна прогулянка':'🚶 Звичайна прогулянка'}
function weatherIcon(code){if([61,63,65,80,81,82].includes(code))return '🌧️';if([71,73,75,77,85,86].includes(code))return '🌨️';if(code>=95)return '⛈️';if([0].includes(code))return '☀️';if([1,2].includes(code))return '🌤️';return '☁️'}
function precipType(w){if([71,73,75,77,85,86].includes(w.code))return 2;if(w.precip>0||[61,63,65,80,81,82].includes(w.code))return 1;return 0}
function effectiveTemp(ch,w){let x=w.temp;if(w.wind>=8)x-=4;else if(w.wind>=5)x-=2.5;else if(w.wind>=3)x-=1;const p=precipType(w);if(p===1)x-=1;if(p===2)x-=1.5;if(ch.sensitivity==='cold')x-=2;if(ch.sensitivity==='hot')x+=1.5;if(ch.activity==='stroller')x-=2;if(ch.activity==='active')x+=1.5;if(ch.age.includes('місяців'))x-=1;return x}
function recommendation(ch,w){const eff=effectiveTemp(ch,w),p=precipType(w),wind=w.wind;let r={eff,top:'',outer:'',bottom:'',shoes:'',head:'',extra:'',summary:'',layers:{}};
 if(eff<=-10){Object.assign(r,{top:'Термобілизна + фліс',outer:'Зимовий комбінезон / куртка',bottom:'Теплі штани',shoes:'Зимове взуття',head:'Тепла шапка',extra:'Рукавички',summary:'Дуже теплий зимовий комплект',layers:{top:'layer_fleece.png',outer:'layer_winter_jacket.png',bottom:'layer_pants.png',shoes:'layer_boots.png',head:'layer_hat.png',gloves:'layer_gloves.png'}})}
 else if(eff<=0){Object.assign(r,{top:'Лонгслів + фліс',outer:'Зимова куртка',bottom:'Теплі штани',shoes:'Черевики',head:'Тепла шапка',extra:'Рукавички за потреби',summary:'Теплий комплект',layers:{top:'layer_fleece.png',outer:'layer_winter_jacket.png',bottom:'layer_pants.png',shoes:'layer_boots.png',head:'layer_hat.png',gloves:'layer_gloves.png'}})}
 else if(eff<8){Object.assign(r,{top:'Лонгслів + кофта',outer:'Демісезонна куртка',bottom:'Штани',shoes:'Черевики або кросівки',head:'Легка шапка',extra:'Тонкий додатковий шар',summary:'Прохолодний демісезонний комплект',layers:{top:'layer_longshirt.png',outer:'layer_demi_jacket.png',bottom:'layer_pants.png',shoes:'layer_boots.png',head:'layer_hat.png'}})}
 else if(eff<16){Object.assign(r,{top:'Лонгслів або футболка + кофта',outer:wind>=4?'Легка вітровка':'Легка куртка / вітровка',bottom:'Штани',shoes:'Кросівки',head:wind>=5?'Тонка шапка':'Без обов’язкової шапки',extra:'Взяти тонкий додатковий шар',summary:'Лонгслів + легкий верхній шар',layers:{top:'layer_longshirt.png',outer:wind>=4?'layer_windbreaker.png':'layer_demi_jacket.png',bottom:'layer_pants.png',shoes:'layer_sneakers.png',head:wind>=5?'layer_hat.png':null}})}
 else if(eff<23){Object.assign(r,{top:'Футболка / лонгслів',outer:wind>=4?'Легка вітровка':'Без куртки або тонка кофта',bottom:'Легкі штани',shoes:'Кросівки',head:'Кепка за сонця',extra:'Легкий верхній шар із собою',summary:'Комфортний легкий комплект',layers:{top:'layer_tshirt.png',outer:wind>=4?'layer_windbreaker.png':null,bottom:'layer_pants.png',shoes:'layer_sneakers.png',head:w.code<=1?'layer_cap.png':null}})}
 else if(eff<29){Object.assign(r,{top:'Футболка',outer:'Без верхнього шару',bottom:'Шорти або легкі штани',shoes:'Кросівки / легке взуття',head:'Кепка / панама',extra:'Вода та захист від сонця',summary:'Літній комплект',layers:{top:'layer_tshirt.png',bottom:'layer_shorts.png',shoes:'layer_sneakers.png',head:'layer_cap.png'}})}
 else {Object.assign(r,{top:'Легка футболка',outer:'Без верхнього шару',bottom:'Шорти',shoes:'Легке взуття',head:'Кепка / панама',extra:'Вода, тінь, SPF',summary:'Максимально легкий комплект',layers:{top:'layer_tshirt.png',bottom:'layer_shorts.png',shoes:'layer_sneakers.png',head:'layer_cap.png'}})}
 if(p===1)r.extra+=' • Дощовик / парасоля'; if(p===2)r.extra+=' • Захист від снігу'; return r }
function avatarFile(){const c=state.child;const school=!c.age.includes('місяців')&&!c.age.includes('1–2')&&!c.age.includes('2–3');return `avatar_${c.gender}_${school?'school':'toddler'}.png`}
async function fetchWeather(){const c=state.coords;toast('Оновлюємо погоду…');try{const u=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(c.lat)}&longitude=${encodeURIComponent(c.lon)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,snowfall,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&forecast_days=1&wind_speed_unit=ms&timezone=auto`;const res=await fetch(u);if(!res.ok)throw new Error('HTTP '+res.status);const d=await res.json(),x=d.current;state.weather={valid:true,temp:x.temperature_2m,feels:x.apparent_temperature,humidity:x.relative_humidity_2m,wind:x.wind_speed_10m,precip:x.precipitation||0,code:x.weather_code||0,updated:new Date().toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),morning:hourAt(d.hourly,8),noon:hourAt(d.hourly,13),evening:hourAt(d.hourly,18)};save();render();toast('Погоду оновлено')}catch(err){toast('Не вдалося оновити погоду. Показано останні дані.')}}
function hourAt(h,target){if(!h||!h.time)return null;let i=h.time.findIndex(t=>Number(t.slice(11,13))===target);if(i<0)return null;return{time:`${String(target).padStart(2,'0')}:00`,temp:h.temperature_2m[i],feels:h.apparent_temperature[i],pop:h.precipitation_probability[i],code:h.weather_code[i],wind:h.wind_speed_10m[i]}}
function toast(text){let n=$('#toast');if(!n){n=document.createElement('div');n.id='toast';Object.assign(n.style,{position:'fixed',left:'50%',bottom:'88px',transform:'translateX(-50%)',background:'#20304a',color:'#fff',padding:'10px 14px',borderRadius:'14px',zIndex:99,fontSize:'13px',boxShadow:'0 8px 30px #0003',maxWidth:'90%',textAlign:'center'});document.body.appendChild(n)}n.textContent=text;n.style.display='block';clearTimeout(window.__toast);window.__toast=setTimeout(()=>n.style.display='none',2500)}
function nav(screen){currentScreen=screen;$$('#bottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.screen===screen));render()}
function render(){const map={home:renderHome,children:renderChildren,wardrobe:renderWardrobe,weather:renderWeather,outfit:renderOutfit,day:renderDay,now:renderNow,settings:renderSettings,walk:renderWalk};const titles={home:'Головна',children:'Діти',wardrobe:'Гардероб',weather:'Погода',outfit:'Образ дитини',day:'Мій день',now:'Зараз',settings:'Налаштування',walk:'План прогулянки'};$('#screenTitle').textContent=titles[currentScreen]||'';$('#screen').innerHTML=map[currentScreen]();wire()}
function weatherMetrics(){const w=state.weather;return `<div class="weather-main"><div class="temp">${Math.round(w.temp*10)/10}°</div><div class="feels">Відчувається як<br><strong>${Math.round(w.feels*10)/10}°</strong></div></div><div class="grid"><div class="metric"><strong>${w.wind.toFixed(1)} м/с</strong><small>💨 вітер</small></div><div class="metric"><strong>${Math.round(w.humidity)}%</strong><small>💧 вологість</small></div></div>`}
function renderHome(){const ch=state.child,w=state.weather,r=recommendation(ch,w);return `<section class="hero"><h2>Сьогодні для дитини</h2><div class="meta">${e(ch.name)} • ${e(ch.age)} • ${sensitivityText(ch.sensitivity)} • ${activityText(ch.activity)}</div>${weatherMetrics()}</section><section class="card"><div class="split-title"><h3>Готовий образ</h3><span class="badge">${weatherIcon(w.code)} ${r.eff.toFixed(1)}° ефект.</span></div><div class="outfit-list">${outfitRows(r)}</div><button class="btn primary" data-go="outfit">ПОКАЗАТИ ОБРАЗ</button></section><section class="card"><h3>Перед виходом</h3><div class="success">${preExit(r,w)}</div><button class="btn secondary" data-go="walk">ПЛАН ПРОГУЛЯНКИ</button></section><section class="card"><h3>Що зміниться протягом дня</h3>${dayDelta()}</section>`}
function outfitRows(r){return [["👕",r.top],["🧥",r.outer],["👖",r.bottom],["👟",r.shoes],["🧢",r.head]].filter(x=>x[1]).map(x=>`<div class="outfit-line"><span>${x[0]}</span><div>${e(x[1])}</div></div>`).join('')}
function preExit(r,w){if(w.wind>=6)return 'Сьогодні помітний вітер — верхній шар краще залишити.';if(precipType(w))return 'Є опади — перевір водозахисний шар і запасний одяг.';if(r.eff>=24)return 'Тепло: вода, кепка та захист від сонця.';return 'Комплект підходить. Тонкий запасний шар можна взяти із собою.'}
function dayDelta(){const xs=[state.weather.morning,state.weather.noon,state.weather.evening].filter(Boolean);if(!xs.length)return '<div class="muted">Онови погоду, щоб побачити прогноз на 08:00 / 13:00 / 18:00.</div>';const ts=xs.map(x=>x.temp);const d=Math.max(...ts)-Math.min(...ts);return `<div class="muted">Перепад температури сьогодні близько <strong>${d.toFixed(1)}°C</strong>. ${d>=6?'Краще мати знімний верхній шар.':'Різких змін не очікується.'}</div>`}
function renderChildren(){const c=state.child;return `<section class="card"><h3>Профіль дитини</h3><div class="field"><label>Ім’я</label><input id="childName" value="${e(c.name)}"></div><div class="field"><label>Вік</label><select id="childAge">${['6–12 місяців','1–2 роки','2–3 роки','4–6 років','7–10 років'].map(x=>`<option ${x===c.age?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Чутливість до температури</label><select id="childSens"><option value="cold" ${c.sensitivity==='cold'?'selected':''}>Мерзляк</option><option value="normal" ${c.sensitivity==='normal'?'selected':''}>Звичайна</option><option value="hot" ${c.sensitivity==='hot'?'selected':''}>Швидко стає жарко</option></select></div><div class="field"><label>Активність</label><select id="childActivity"><option value="stroller" ${c.activity==='stroller'?'selected':''}>Мало рухається / візочок</option><option value="normal" ${c.activity==='normal'?'selected':''}>Звичайна прогулянка</option><option value="active" ${c.activity==='active'?'selected':''}>Активна</option></select></div><div class="field"><label>Аватар</label><select id="childGender"><option value="girl" ${c.gender==='girl'?'selected':''}>Дівчинка</option><option value="boy" ${c.gender==='boy'?'selected':''}>Хлопчик</option></select></div><button id="saveChild" class="btn primary">ЗБЕРЕГТИ ПРОФІЛЬ</button></section>`}
function renderWardrobe(){const names={shirt:'Футболка',long:'Лонгслів',fleece:'Фліс / кофта',windj:'Вітровка',demi:'Демісезонна куртка',winter:'Зимова куртка',pants:'Штани',shorts:'Шорти',hat:'Кепка / панама',warmhat:'Тепла шапка',gloves:'Рукавички',sneakers:'Кросівки',boots:'Черевики'};return `<section class="card"><h3>Що є в гардеробі</h3><div class="muted">Познач речі, які реально є під рукою. Веб-версія збереже вибір у браузері.</div>${Object.entries(names).map(([k,n])=>`<label class="check-row"><span>${n}</span><input class="toggle wardrobe-toggle" type="checkbox" data-key="${k}" ${state.wardrobe[k]?'checked':''}></label>`).join('')}</section>`}
function renderWeather(){const w=state.weather;return `<section class="hero"><h2>${weatherIcon(w.code)} ${e(state.coords.label)}</h2><div class="meta">Використовуються збережені координати • браузерну геолокацію не запитуємо</div>${weatherMetrics()}</section><section class="card"><h3>Поточні дані</h3><div class="chips"><span class="chip">Код погоди: ${w.code}</span><span class="chip">Опади: ${w.precip.toFixed(1)} мм</span><span class="chip ok">Оновлено: ${e(w.updated)}</span></div><button id="refreshWeather" class="btn primary">ОНОВИТИ ПОГОДУ</button></section>`}
function layerImg(name,cls='wear'){return name?`<img class="${cls}" src="assets/${name}" alt="">`:''}
function avatarStage(r){return `<div class="avatar-stage"><img class="base" src="assets/${avatarFile()}" alt="Аватар">${layerImg(r.layers.top)}${layerImg(r.layers.bottom)}${layerImg(r.layers.shoes)}${layerImg(r.layers.outer,'outer')}${layerImg(r.layers.head,'headwear')}${layerImg(r.layers.gloves,'gloves')}</div>`}
function renderOutfit(){const r=recommendation(state.child,state.weather);return `<section class="card"><div class="split-title"><h3>${e(r.summary)}</h3><span class="badge">${r.eff.toFixed(1)}°</span></div>${avatarStage(r)}</section><section class="card"><h3>Що вдягнути</h3><div class="outfit-list">${outfitRows(r)}</div><div class="muted" style="margin-top:12px">Чому так: враховано температуру, відчуття, вітер, опади, вік, чутливість і активність дитини.</div><button id="refreshOutfit" class="btn primary">АВТО — ПІДІБРАТИ ОБРАЗ</button><button id="saveFavorite" class="btn secondary">⭐ ЗБЕРЕГТИ УЛЮБЛЕНИЙ КОМПЛЕКТ</button></section>`}
function renderDay(){const arr=[['08:00',state.weather.morning],['13:00',state.weather.noon],['18:00',state.weather.evening]];return `<section class="card"><h3>Прогноз на день</h3>${arr.map(([t,x])=>x?`<div class="forecast-item"><strong>${t}</strong><div>${weatherIcon(x.code)} ${x.temp.toFixed(1)}° <div class="tiny">відч. ${x.feels.toFixed(1)}° • вітер ${x.wind.toFixed(1)} м/с</div></div><span class="badge">${x.pop??0}%</span></div>`:`<div class="forecast-item"><strong>${t}</strong><div class="muted">Немає даних</div><span>—</span></div>`).join('')}</section><section class="card"><h3>Що взяти з собою</h3><div class="success">${recommendation(state.child,state.weather).extra}</div>${dayDelta()}</section>`}
function renderNow(){const r=recommendation(state.child,state.weather),w=state.weather;return `<section class="card"><div class="big-status">${weatherIcon(w.code)}</div><h3 style="text-align:center">Зараз ${w.temp.toFixed(1)}°C</h3><div class="muted" style="text-align:center">Відчувається ${w.feels.toFixed(1)}°C • вітер ${w.wind.toFixed(1)} м/с</div></section><section class="card"><h3>Рішення зараз</h3><div class="success">${e(r.summary)}</div><div class="outfit-list">${outfitRows(r)}</div><button class="btn primary" data-go="walk">СПЛАНУВАТИ ПРОГУЛЯНКУ</button></section>`}

function walkPad2(n){return String(n).padStart(2,'0')}
function walkDateKey(d){return d.getFullYear()+'-'+walkPad2(d.getMonth()+1)+'-'+walkPad2(d.getDate())}
function buildWalkDepartureOptions(now=new Date()){
  const selected=state.walk?.departure||'now';
  const items=[{value:'now',label:'Зараз'}];

  for(const hour of [8,13,18,20]){
    const d=new Date(now);
    d.setHours(hour,0,0,0);
    if(d.getTime()>now.getTime()+5*60*1000){
      items.push({
        value:walkDateKey(d)+'T'+walkPad2(hour)+':00',
        label:'Сьогодні близько '+walkPad2(hour)+':00'
      });
    }
  }

  const tomorrow=new Date(now);
  tomorrow.setDate(tomorrow.getDate()+1);
  for(const hour of [8,13,18]){
    const d=new Date(tomorrow);
    d.setHours(hour,0,0,0);
    items.push({
      value:walkDateKey(d)+'T'+walkPad2(hour)+':00',
      label:'Завтра близько '+walkPad2(hour)+':00'
    });
  }

  return items.map(x=>`<option value="${x.value}" ${selected===x.value?'selected':''}>${x.label}</option>`).join('');
}
function selectedWalkDateTime(){
  const v=state.walk?.departure||'now';
  if(v==='now')return new Date();
  const d=new Date(v);
  return Number.isNaN(d.getTime())?new Date():d;
}

function renderWalk(){const v=state.walk;return `<section class="card"><h3>План прогулянки</h3><div class="field"><label>Тривалість</label><select id="walkDuration">${[30,45,60,90,120].map(n=>`<option value="${n}" ${v.duration==n?'selected':''}>${n} хв</option>`).join('')}</select></div><div class="field"><label>Режим дитини</label><select id="walkMode"><option value="stroller" ${v.mode==='stroller'?'selected':''}>Переважно візочок</option><option value="normal" ${v.mode==='normal'?'selected':''}>Звичайно</option><option value="active" ${v.mode==='active'?'selected':''}>Активно</option></select></div><div class="field"><label>Час виходу</label><select id="walkDeparture">${buildWalkDepartureOptions()}</select></div><button id="saveWalk" class="btn primary">ЗБЕРЕГТИ ПЛАН</button></section>`}
function renderSettings(){const c=state.coords;return `<section class="card"><h3>Режим Web V1.0</h3><div class="success">✓ Геолокацію браузера не використовуємо. Погода завантажується за збереженими координатами.</div><div class="field"><label>Назва локації</label><input id="locLabel" value="${e(c.label)}"></div><div class="row"><div class="field"><label>Latitude</label><input id="locLat" type="number" step="0.000001" value="${c.lat}"></div><div class="field"><label>Longitude</label><input id="locLon" type="number" step="0.000001" value="${c.lon}"></div></div><button id="saveCoords" class="btn primary">ЗБЕРЕГТИ КООРДИНАТИ</button><button id="resetApp" class="btn ghost">СКИНУТИ WEB-ДАНІ</button></section><section class="card"><h3>Про версію</h3><div class="muted">Pogodka Kids Web V1.8.2 CLEAN • браузерний прототип на базі Android V10.3.2. Працює без Node.js: відкрий index.html.</div></section>`}
function wire(){$$('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go));$('#refreshWeather')?.addEventListener('click',fetchWeather);$('#refreshOutfit')?.addEventListener('click',fetchWeather);$('#saveFavorite')?.addEventListener('click',()=>{state.favorite=recommendation(state.child,state.weather);save();toast('Комплект збережено')});$('#saveChild')?.addEventListener('click',()=>{state.child={name:$('#childName').value.trim()||'Дитина',age:$('#childAge').value,sensitivity:$('#childSens').value,activity:$('#childActivity').value,gender:$('#childGender').value};save();toast('Профіль збережено');render()});$$('.wardrobe-toggle').forEach(x=>x.onchange=()=>{state.wardrobe[x.dataset.key]=x.checked;save()});$('#saveCoords')?.addEventListener('click',()=>{const lat=Number($('#locLat').value),lon=Number($('#locLon').value);if(!Number.isFinite(lat)||!Number.isFinite(lon)){toast('Перевір координати');return}state.coords={lat,lon,label:$('#locLabel').value.trim()||'Збережена локація'};save();toast('Координати збережено')});$('#resetApp')?.addEventListener('click',()=>{if(confirm('Скинути збережені дані Web-версії?')){localStorage.removeItem(STORAGE);state=load();render();toast('Дані скинуто')}});$('#saveWalk')?.addEventListener('click',()=>{state.walk={duration:Number($('#walkDuration').value),mode:$('#walkMode').value,departure:$('#walkDeparture').value};save();toast('План збережено')})}
$('#bottomNav').addEventListener('click',ev=>{const b=ev.target.closest('button[data-screen]');if(b)nav(b.dataset.screen)});$('#weatherRefreshTop').addEventListener('click',fetchWeather);
render();
setTimeout(()=>{if(!state.weather.valid)fetchWeather()},250);


/* V1.4 Clean Layer Engine */
const PK_LAYER_ORDER = {
  pants: 20,
  shorts: 20,
  sneakers: 30,
  boots: 30,
  tshirt: 40,
  longshirt: 40,
  fleece: 45,
  windbreaker: 50,
  demi_jacket: 50,
  winter_jacket: 50,
  gloves: 60,
  hat: 70,
  cap: 70
};

function pkNormalizeLayerKey(src) {
  const s = String(src || '').toLowerCase();
  for (const key of Object.keys(PK_LAYER_ORDER)) {
    if (s.includes('layer_' + key) || s.includes(key)) return key;
  }
  return '';
}

function pkCleanAvatarLayers(container) {
  if (!container) return;
  const imgs = Array.from(container.querySelectorAll('img'));
  imgs.forEach(img => {
    const src = img.getAttribute('src') || '';
    const key = pkNormalizeLayerKey(src);
    if (key) {
      img.style.zIndex = String(PK_LAYER_ORDER[key]);
      img.style.position = 'absolute';
      img.style.inset = '0';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
    } else if (src.includes('avatar_')) {
      img.style.zIndex = '10';
      img.style.position = 'absolute';
      img.style.inset = '0';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      img.style.pointerEvents = 'none';
    }
  });

  /* Deduplicate exact repeated clothing layers, keeping the last visible one. */
  const seen = new Map();
  imgs.forEach(img => {
    const src = img.getAttribute('src') || '';
    const key = pkNormalizeLayerKey(src);
    if (!key) return;
    if (seen.has(key)) {
      const prev = seen.get(key);
      prev.style.display = 'none';
    }
    seen.set(key, img);
  });
}

function pkCleanAllAvatarLayers() {
  document.querySelectorAll('.avatar-stage, .avatarStage, .avatar, .outfit-avatar, .avatar-box, .avatarBox')
    .forEach(pkCleanAvatarLayers);
  /* Fallback: clean parents that contain active layer_ PNGs. */
  document.querySelectorAll('img[src*="layer_"]').forEach(img => {
    const p = img.parentElement;
    if (p) pkCleanAvatarLayers(p);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    pkCleanAllAvatarLayers();
    setTimeout(pkCleanAllAvatarLayers, 0);
  });
} else {
  pkCleanAllAvatarLayers();
}


const pkLayerObserver = new MutationObserver(() => {
  clearTimeout(window.__pkLayerCleanTimer);
  window.__pkLayerCleanTimer = setTimeout(pkCleanAllAvatarLayers, 10);
});
if (document.body) {
  pkLayerObserver.observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['src','style','class']});
}


/* V1.5 Smart Outfit Recommendation Engine */
function pkNum(v, fallback=0) {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function pkReadText(keys, fallback='') {
  for (const k of keys) {
    const el = document.getElementById(k);
    if (el && 'value' in el && String(el.value).trim()) return String(el.value).trim();
    if (el && el.textContent && String(el.textContent).trim()) return String(el.textContent).trim();
    try {
      const x = localStorage.getItem(k);
      if (x) return x;
    } catch(e) {}
  }
  return fallback;
}

function pkReadNumber(keys, fallback=0) {
  const txt = pkReadText(keys, '');
  const m = String(txt).match(/-?\d+(?:[.,]\d+)?/);
  return m ? pkNum(m[0], fallback) : fallback;
}

function pkReadWeatherSnapshot() {
  let temp = pkReadNumber(['currentTemp','temp','weatherTemp','temperature'], 16);
  let feels = pkReadNumber(['feelsLike','apparentTemp','apparent_temperature'], temp);
  let wind = pkReadNumber(['wind','windSpeed','weatherWind'], 1);
  let precip = pkReadNumber(['precip','precipitation','weatherPrecip'], 0);

  // fallback from visible text when explicit IDs are absent
  const page = document.body ? document.body.innerText : '';
  if (!Number.isFinite(temp) || temp === 16) {
    const mt = page.match(/(-?\d+(?:[.,]\d+)?)\s*°/);
    if (mt) temp = pkNum(mt[1], temp);
  }
  const mf = page.match(/відчува\w*\s*(?:як)?\s*(-?\d+(?:[.,]\d+)?)\s*°/i);
  if (mf) feels = pkNum(mf[1], feels);
  const mw = page.match(/вітер[^\d-]*(-?\d+(?:[.,]\d+)?)\s*м\/с/i);
  if (mw) wind = pkNum(mw[1], wind);

  return {temp, feels, wind, precip};
}

function pkReadChildProfile() {
  const age = pkReadText(['childAge','age','profileAge'], '6–12 місяців');
  const sensitivity = pkReadText(['childSensitivity','sensitivity'], 'Звичайна');
  const activity = pkReadText(['childActivity','activity'], 'Звичайна прогулянка');
  return {age, sensitivity, activity};
}

function pkEffectiveTemperature(w, child) {
  let eff = Number.isFinite(w.feels) ? w.feels : w.temp;

  if (w.wind >= 8) eff -= 4;
  else if (w.wind >= 5) eff -= 2.5;
  else if (w.wind >= 3) eff -= 1;

  if (w.precip >= 2) eff -= 1.5;
  else if (w.precip > 0) eff -= 0.7;

  const s = (child.sensitivity || '').toLowerCase();
  if (s.includes('мерз') || s.includes('холод')) eff -= 2;
  if (s.includes('жарк') || s.includes('тепл')) eff += 1.5;

  const a = (child.activity || '').toLowerCase();
  if (a.includes('візоч') || a.includes('коляс') || a.includes('низьк')) eff -= 2;
  if (a.includes('актив')) eff += 1.5;

  if ((child.age || '').toLowerCase().includes('місяц')) eff -= 1;

  return Math.round(eff * 10) / 10;
}

function pkOutfitForEffectiveTemp(eff, weather) {
  let season = 'Літо';
  let items = [];
  let action = '';

  if (eff <= 0) {
    season = 'Зима';
    items = ['Термошар або лонгслів', 'Теплий середній шар', 'Зимова куртка', 'Теплі штани', 'Шапка', 'Рукавички', 'Зимове взуття'];
    action = 'Перед виходом перевір шию та спину дитини через 10–15 хвилин.';
  } else if (eff < 8) {
    season = 'Зима';
    items = ['Лонгслів', 'Кофта або фліс', 'Тепла куртка', 'Штани', 'Шапка', 'Закрите взуття'];
    action = 'Якщо прогулянка активна — середній шар можна зробити легшим.';
  } else if (eff < 16) {
    season = 'Демі';
    items = ['Лонгслів або футболка + кофта', 'Легка куртка / вітровка', 'Штани', 'Кросівки'];
    action = 'Якщо стане тепліше, куртку можна зняти першою.';
  } else if (eff < 23) {
    season = 'Літо';
    items = ['Футболка або легкий лонгслів', 'Легкі штани або шорти', 'Кросівки'];
    action = 'Візьми легку кофту, якщо прогулянка затягнеться до вечора.';
  } else if (eff < 29) {
    season = 'Літо';
    items = ['Футболка', 'Шорти або тонкі штани', 'Легке взуття', 'Кепка від сонця'];
    action = 'Слідкуй за перегрівом і давай дитині воду.';
  } else {
    season = 'Літо';
    items = ['Дуже легка футболка', 'Шорти', 'Легке взуття', 'Панамка / кепка'];
    action = 'Краще скоротити прогулянку в найспекотніший час.';
  }

  if (weather.precip > 0) {
    if (!items.some(x => /куртка|вітровка/i.test(x))) items.push('Легка водозахисна куртка');
    items.push('Водостійке взуття');
  }
  return {season, items, action};
}

function pkReasonText(w, eff, child) {
  const parts = [];
  parts.push(`${w.temp.toFixed(1)} °C`);
  if (Math.abs(w.feels - w.temp) >= 0.5) parts.push(`відчувається як ${w.feels.toFixed(1)} °C`);
  if (w.wind >= 3) parts.push(`вітер ${w.wind.toFixed(1)} м/с`);
  if (w.precip > 0) parts.push('є опади');

  const s = (child.sensitivity || '').toLowerCase();
  if (s.includes('мерз')) parts.push('враховано чутливість до холоду');
  const a = (child.activity || '').toLowerCase();
  if (a.includes('актив')) parts.push('враховано активну прогулянку');

  return `${parts.join(' • ')}. Розрахункова температура для одягу: ${eff.toFixed(1)} °C.`;
}

function pkActivateSeasonButton(season) {
  const labels = Array.from(document.querySelectorAll('button, .chip, .pill, [role="button"]'));
  const target = labels.find(el => (el.textContent || '').trim().toLowerCase() === season.toLowerCase());
  if (target) {
    try { target.click(); } catch(e) {}
  }
}

function pkRenderSmartRecommendation() {
  const card = document.getElementById('smartRecommendationCard');
  const summary = document.getElementById('smartRecommendationSummary');
  const reason = document.getElementById('smartRecommendationReason');
  const actions = document.getElementById('smartRecommendationActions');
  if (!card || !summary || !reason || !actions) return;

  const weather = pkReadWeatherSnapshot();
  const child = pkReadChildProfile();
  const eff = pkEffectiveTemperature(weather, child);
  const rec = pkOutfitForEffectiveTemp(eff, weather);

  summary.innerHTML = `<strong>${rec.season}</strong><br>${rec.items.map(x => `• ${x}`).join('<br>')}`;
  reason.textContent = pkReasonText(weather, eff, child);
  actions.textContent = rec.action;
  card.style.display = '';

  // Auto mode controls the avatar; manual season buttons still remain available for testing.
  const autoActive = Array.from(document.querySelectorAll('button, .chip, .pill, [role="button"]'))
    .find(el => (el.textContent || '').trim().toLowerCase() === 'авто' &&
                (el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true'));
  if (autoActive) pkActivateSeasonButton(rec.season);
}

function pkDailyOutfitPlan(points) {
  if (!Array.isArray(points)) return [];
  return points.map(p => {
    const child = pkReadChildProfile();
    const w = {temp:pkNum(p.temp), feels:pkNum(p.feels ?? p.temp), wind:pkNum(p.wind), precip:pkNum(p.precip)};
    const eff = pkEffectiveTemperature(w, child);
    const rec = pkOutfitForEffectiveTemp(eff, w);
    return {...p, effectiveTemp:eff, season:rec.season, items:rec.items};
  });
}

window.pkSmartOutfit = {
  readWeather: pkReadWeatherSnapshot,
  readChild: pkReadChildProfile,
  effectiveTemperature: pkEffectiveTemperature,
  recommend: pkOutfitForEffectiveTemp,
  dailyPlan: pkDailyOutfitPlan,
  render: pkRenderSmartRecommendation
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(pkRenderSmartRecommendation, 50));
} else {
  setTimeout(pkRenderSmartRecommendation, 50);
}

const pkSmartObserver = new MutationObserver(() => {
  clearTimeout(window.__pkSmartTimer);
  window.__pkSmartTimer = setTimeout(pkRenderSmartRecommendation, 80);
});
if (document.body) {
  pkSmartObserver.observe(document.body, {subtree:true, childList:true, characterData:true});
}


/* V1.6 Smart Wardrobe Engine */
const PK_WARDROBE_KEY = 'pogodkaKidsWardrobeV16';

const PK_DEFAULT_WARDROBE = [
  {id:'tshirt', name:'Футболка', aliases:['футболка'], available:true},
  {id:'longshirt', name:'Лонгслів', aliases:['лонгслів','лонгслив'], available:true},
  {id:'fleece', name:'Кофта / фліс', aliases:['кофта','фліс','флис'], available:true},
  {id:'windbreaker', name:'Легка куртка / вітровка', aliases:['легка куртка','вітровка','ветровка'], available:true},
  {id:'winter_jacket', name:'Зимова куртка', aliases:['зимова куртка','тепла куртка'], available:true},
  {id:'pants', name:'Штани', aliases:['штани','брюки'], available:true},
  {id:'shorts', name:'Шорти', aliases:['шорти'], available:true},
  {id:'hat', name:'Шапка', aliases:['шапка'], available:true},
  {id:'cap', name:'Кепка', aliases:['кепка','панамка'], available:true},
  {id:'gloves', name:'Рукавички', aliases:['рукавички','перчатки'], available:true},
  {id:'sneakers', name:'Кросівки', aliases:['кросівки','кроссовки','легке взуття','закрите взуття'], available:true},
  {id:'boots', name:'Зимове взуття', aliases:['зимове взуття','водостійке взуття','ботинки'], available:true}
];

function pkLoadWardrobe() {
  try {
    const raw = localStorage.getItem(PK_WARDROBE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch(e) {}
  return PK_DEFAULT_WARDROBE.map(x => ({...x}));
}

function pkSaveWardrobe(items) {
  try { localStorage.setItem(PK_WARDROBE_KEY, JSON.stringify(items)); } catch(e) {}
}

function pkWardrobeItemForText(text, wardrobe) {
  const s = String(text || '').toLowerCase();
  return wardrobe.find(item =>
    (item.aliases || []).some(a => s.includes(String(a).toLowerCase()))
  );
}

function pkCheckWardrobe(items) {
  const wardrobe = pkLoadWardrobe();
  const matched = [];
  const missing = [];

  for (const text of items || []) {
    const item = pkWardrobeItemForText(text, wardrobe);
    if (!item) {
      matched.push({text, status:'unknown'});
    } else if (item.available) {
      matched.push({text, status:'ok', item});
    } else {
      missing.push({text, item});
    }
  }
  return {wardrobe, matched, missing};
}

function pkAlternativeForMissing(missingItem, wardrobe) {
  const id = missingItem?.item?.id || '';
  const altMap = {
    windbreaker:['fleece','winter_jacket'],
    winter_jacket:['windbreaker','fleece'],
    fleece:['longshirt','windbreaker'],
    longshirt:['tshirt','fleece'],
    tshirt:['longshirt'],
    pants:['shorts'],
    shorts:['pants'],
    hat:['cap'],
    cap:['hat'],
    gloves:[],
    sneakers:['boots'],
    boots:['sneakers']
  };
  const ids = altMap[id] || [];
  const found = ids.map(x => wardrobe.find(w => w.id === x && w.available)).find(Boolean);
  return found ? found.name : '';
}

function pkRenderWardrobeMatch(rec) {
  const card = document.getElementById('wardrobeMatchCard');
  const status = document.getElementById('wardrobeMatchStatus');
  const missingEl = document.getElementById('wardrobeMatchMissing');
  const altEl = document.getElementById('wardrobeMatchAlternative');
  if (!card || !status || !missingEl || !altEl || !rec) return;

  const check = pkCheckWardrobe(rec.items || []);
  card.style.display = '';

  if (!check.missing.length) {
    status.innerHTML = '<strong>Усе потрібне є в гардеробі.</strong>';
    missingEl.textContent = '';
    altEl.textContent = '';
  } else {
    status.innerHTML = `<strong>Не вистачає ${check.missing.length} поз.</strong>`;
    missingEl.innerHTML = check.missing.map(x => `• ${x.text}`).join('<br>');
    const alts = check.missing
      .map(x => ({name:x.text, alt:pkAlternativeForMissing(x, check.wardrobe)}))
      .filter(x => x.alt);
    altEl.innerHTML = alts.length
      ? '<strong>Можна замінити:</strong><br>' + alts.map(x => `• ${x.name} → ${x.alt}`).join('<br>')
      : 'Для відсутніх речей немає безпечної автоматичної заміни.';
  }
}

function pkRenderWardrobeEditor() { return; }

function pkCurrentSmartRec() {
  if (!window.pkSmartOutfit) return null;
  const weather = window.pkSmartOutfit.readWeather();
  const child = window.pkSmartOutfit.readChild();
  const eff = window.pkSmartOutfit.effectiveTemperature(weather, child);
  return window.pkSmartOutfit.recommend(eff, weather);
}

function pkRefreshWardrobeMatch() {
  const rec = pkCurrentSmartRec();
  if (rec) pkRenderWardrobeMatch(rec);

}

window.pkWardrobe = {
  load: pkLoadWardrobe,
  save: pkSaveWardrobe,
  check: pkCheckWardrobe,
  render: pkRefreshWardrobeMatch
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(pkRefreshWardrobeMatch, 120));
} else {
  setTimeout(pkRefreshWardrobeMatch, 120);
}

const pkWardrobeObserver = new MutationObserver(() => {
  clearTimeout(window.__pkWardrobeTimer);
  window.__pkWardrobeTimer = setTimeout(pkRefreshWardrobeMatch, 120);
});
if (document.body) {
  pkWardrobeObserver.observe(document.body, {subtree:true, childList:true, characterData:true});
}


/* V1.7 Auto Outfit Only + Clean Wardrobe UI */
function pkHideManualSeasonControls() { return; }

function pkHideWardrobeTechnicalPanels() {
  const match = document.getElementById('wardrobeMatchCard');
  if (match) match.style.display = 'none';

  // Do not show wardrobe checkbox editor outside the dedicated Wardrobe screen.
  const editor = document.getElementById('pkWardrobeEditor');
  if (editor) {
    const parent = editor.closest('#wardrobe, #screenWardrobe, .screen-wardrobe, [data-screen="wardrobe"]');
    if (!parent) editor.remove();
  }
}

function pkWardrobeMissingHint(rec) {
  if (!window.pkWardrobe || !rec) return '';
  const check = window.pkWardrobe.check(rec.items || []);
  if (!check.missing || !check.missing.length) return '';

  const first = check.missing[0];
  let alt = '';
  try {
    if (typeof pkAlternativeForMissing === 'function') {
      alt = pkAlternativeForMissing(first, check.wardrobe);
    }
  } catch(e) {}

  if (check.missing.length === 1) {
    return alt
      ? `У гардеробі немає: ${first.text}. Можна використати: ${alt}.`
      : `У гардеробі немає: ${first.text}.`;
  }
  return `У гардеробі бракує ${check.missing.length} речей. Перевір розділ «Гардероб».`;
}

function pkRenderCleanOutfitHint() {
  const reason = document.getElementById('smartRecommendationReason');
  if (!reason || !window.pkSmartOutfit) return;

  const weather = window.pkSmartOutfit.readWeather();
  const child = window.pkSmartOutfit.readChild();
  const eff = window.pkSmartOutfit.effectiveTemperature(weather, child);
  const rec = window.pkSmartOutfit.recommend(eff, weather);
  const hint = pkWardrobeMissingHint(rec);

  let hintEl = document.getElementById('pkWardrobeHint');
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.id = 'pkWardrobeHint';
    hintEl.className = 'pk-wardrobe-hint';
    const card = document.getElementById('smartRecommendationCard');
    if (card) card.appendChild(hintEl);
  }
  if (hintEl) {
    hintEl.textContent = hint;
    hintEl.style.display = hint ? '' : 'none';
  }
}

function pkRunV17CleanUI() {
  pkHideManualSeasonControls();
  pkHideWardrobeTechnicalPanels();
  pkRenderCleanOutfitHint();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(pkRunV17CleanUI, 100));
} else {
  setTimeout(pkRunV17CleanUI, 100);
}

const pkV17Observer = new MutationObserver(() => {
  clearTimeout(window.__pkV17Timer);
  window.__pkV17Timer = setTimeout(pkRunV17CleanUI, 120);
});
if (document.body) {
  pkV17Observer.observe(document.body, {subtree:true, childList:true, characterData:true});
}


/* Web V1.8.3 — optional PWA support on HTTPS/localhost */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
