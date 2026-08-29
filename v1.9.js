/* Pogodka Kids Web V1.9 — Smart Walk Forecast Engine
   Overlay over stable V1.8.3.1 mobile base.
*/
(function(){
  const oldDefaultsHourly = state.weather.hourly ?? null;
  if(!('hourly' in state.weather)) state.weather.hourly = oldDefaultsHourly;

  function pkV19NormalizeHourly(h){
    if(!h||!Array.isArray(h.time))return null;
    return h.time.map((time,i)=>({
      time,
      temp:Number(h.temperature_2m?.[i]),
      feels:Number(h.apparent_temperature?.[i]),
      pop:Number(h.precipitation_probability?.[i]??0),
      precip:Number(h.precipitation?.[i]??0),
      code:Number(h.weather_code?.[i]??0),
      wind:Number(h.wind_speed_10m?.[i]??0)
    })).filter(x=>Number.isFinite(x.temp)&&Number.isFinite(x.feels));
  }

  function pkV19HourAt(h,target,dayOffset=0){
    if(!h||!Array.isArray(h.time))return null;
    const base=(h.time[0]||'').slice(0,10);
    let dateKey=base;
    if(dayOffset){
      const d=new Date(base+'T12:00:00');
      d.setDate(d.getDate()+dayOffset);
      dateKey=walkDateKey(d);
    }
    const hh=String(target).padStart(2,'0');
    const i=h.time.findIndex(t=>t===`${dateKey}T${hh}:00`);
    if(i<0)return null;
    return{
      time:`${hh}:00`,date:dateKey,
      temp:Number(h.temperature_2m[i]),
      feels:Number(h.apparent_temperature[i]),
      pop:Number(h.precipitation_probability?.[i]??0),
      precip:Number(h.precipitation?.[i]??0),
      code:Number(h.weather_code[i]??0),
      wind:Number(h.wind_speed_10m[i]??0)
    };
  }

  function pkV19HourlyToWeather(x){
    if(!x)return null;
    return{
      valid:true,temp:x.temp,feels:x.feels,
      humidity:state.weather.humidity,
      wind:x.wind,precip:x.precip||0,code:x.code||0,
      updated:state.weather.updated
    };
  }

  window.pkV19WalkTargetWeather = function(departure=state.walk?.departure){
    if(!departure||departure==='now')return state.weather;
    const arr=state.weather?.hourly;
    if(!Array.isArray(arr)||!arr.length)return null;
    let best=null,bestDiff=Infinity;
    const target=new Date(departure).getTime();
    if(!Number.isFinite(target))return null;
    for(const x of arr){
      const ts=new Date(x.time).getTime();
      if(!Number.isFinite(ts))continue;
      const diff=Math.abs(ts-target);
      if(diff<bestDiff){best=x;bestDiff=diff}
    }
    if(!best||bestDiff>90*60*1000)return null;
    return pkV19HourlyToWeather(best);
  };

  window.pkV19WalkChild = function(mode=state.walk?.mode){
    return {...state.child,activity:mode||state.child.activity};
  };

  window.pkV19WalkDepartureLabel = function(value=state.walk?.departure){
    if(!value||value==='now')return 'зараз';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return 'за планом';
    const now=new Date(),tomorrow=new Date(now);
    tomorrow.setDate(now.getDate()+1);
    const key=walkDateKey(d),todayKey=walkDateKey(now),tomorrowKey=walkDateKey(tomorrow);
    const time=`${walkPad2(d.getHours())}:${walkPad2(d.getMinutes())}`;
    if(key===todayKey)return `сьогодні о ${time}`;
    if(key===tomorrowKey)return `завтра о ${time}`;
    return `${d.toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit'})} о ${time}`;
  };

  window.pkV19PlannedContext = function(){
    const departure=state.walk?.departure||'now';
    if(departure==='now')return {weather:state.weather,child:state.child,label:'зараз',planned:false,fallback:false};
    const target=window.pkV19WalkTargetWeather(departure);
    if(target)return {weather:target,child:window.pkV19WalkChild(),label:window.pkV19WalkDepartureLabel(departure),planned:true,fallback:false};
    return {weather:state.weather,child:window.pkV19WalkChild(),label:window.pkV19WalkDepartureLabel(departure),planned:true,fallback:true};
  };

  fetchWeather = async function(){
    const c=state.coords;
    toast('Оновлюємо погоду…');
    try{
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(c.lat)}&longitude=${encodeURIComponent(c.lon)}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,snowfall,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&forecast_days=2&wind_speed_unit=ms&timezone=auto`;
      const res=await fetch(u);
      if(!res.ok)throw new Error('HTTP '+res.status);
      const d=await res.json(),x=d.current;
      state.weather={
        valid:true,temp:x.temperature_2m,feels:x.apparent_temperature,
        humidity:x.relative_humidity_2m,wind:x.wind_speed_10m,
        precip:x.precipitation||0,code:x.weather_code||0,
        updated:new Date().toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),
        morning:pkV19HourAt(d.hourly,8,0),
        noon:pkV19HourAt(d.hourly,13,0),
        evening:pkV19HourAt(d.hourly,18,0),
        hourly:pkV19NormalizeHourly(d.hourly)
      };
      save();render();toast('Погоду оновлено');
    }catch(err){
      toast('Не вдалося оновити погоду. Показано останні дані.');
    }
  };

  function pkV19ForecastHtml(v=state.walk){
    const weather=window.pkV19WalkTargetWeather(v?.departure);
    if(!weather){
      if((v?.departure||'now')==='now')return '';
      return `<div class="muted" style="margin-top:14px">⚠️ Немає погодинного прогнозу для ${e(window.pkV19WalkDepartureLabel(v?.departure))}. Онови погоду або вибери інший час.</div>`;
    }
    const child=window.pkV19WalkChild(v?.mode),r=recommendation(child,weather);
    let pop=null;
    if((v?.departure||'now')!=='now'){
      const arr=state.weather?.hourly||[],target=new Date(v.departure).getTime();
      let best=null,bestDiff=Infinity;
      for(const x of arr){
        const ts=new Date(x.time).getTime(),diff=Math.abs(ts-target);
        if(Number.isFinite(diff)&&diff<bestDiff){best=x;bestDiff=diff}
      }
      pop=best?.pop;
    }
    return `<section class="walk-preview"><div class="split-title"><h3>Прогноз на прогулянку</h3><span class="badge">${weatherIcon(weather.code)} ${weather.temp.toFixed(1)}°</span></div><div class="muted">${e(window.pkV19WalkDepartureLabel(v?.departure))} • відч. ${weather.feels.toFixed(1)}° • вітер ${weather.wind.toFixed(1)} м/с${pop==null?'':` • опади ${Math.round(pop)}%`}</div><div class="success" style="margin-top:10px">${e(r.summary)}</div><div class="outfit-list">${outfitRows(r)}</div></section>`;
  }

  window.pkV19UpdateWalkPreview = function(){
    const box=$('#walkForecastPreview');
    if(!box)return;
    const v={
      duration:Number($('#walkDuration')?.value||state.walk.duration),
      mode:$('#walkMode')?.value||state.walk.mode,
      departure:$('#walkDeparture')?.value||state.walk.departure
    };
    box.innerHTML=pkV19ForecastHtml(v);
  };

  renderHome = function(){
    const ch=state.child,w=state.weather,ctx=window.pkV19PlannedContext(),r=recommendation(ctx.child,ctx.weather);
    const outfitTitle=ctx.planned?`Образ для прогулянки ${ctx.label}`:'Готовий образ';
    const fallback=ctx.fallback?'<div class="muted" style="margin-top:10px">⚠️ Для вибраного часу немає погодинного прогнозу — показано останні доступні погодні дані.</div>':'';
    return `<section class="hero"><h2>Сьогодні для дитини</h2><div class="meta">${e(ch.name)} • ${e(ch.age)} • ${sensitivityText(ch.sensitivity)} • ${activityText(ch.activity)}</div>${weatherMetrics()}</section><section class="card"><div class="split-title"><h3>${e(outfitTitle)}</h3><span class="badge">${weatherIcon(ctx.weather.code)} ${r.eff.toFixed(1)}° ефект.</span></div><div class="outfit-list">${outfitRows(r)}</div>${fallback}<button class="btn primary" data-go="outfit">ПОКАЗАТИ ОБРАЗ</button></section><section class="card"><h3>Перед виходом</h3><div class="success">${preExit(r,ctx.weather)}</div><button class="btn secondary" data-go="walk">ПЛАН ПРОГУЛЯНКИ</button></section><section class="card"><h3>Що зміниться протягом дня</h3>${dayDelta()}</section>`;
  };

  renderOutfit = function(){
    const ctx=window.pkV19PlannedContext(),r=recommendation(ctx.child,ctx.weather);
    const planNote=ctx.planned?`<div class="success" style="margin-bottom:12px">Прогноз і образ розраховано для прогулянки ${e(ctx.label)}.</div>`:'';
    const fallback=ctx.fallback?'<div class="muted" style="margin-top:12px">⚠️ Точний погодинний прогноз для вибраного часу недоступний. Використано останні доступні погодні дані.</div>':'';
    return `<section class="card">${planNote}<div class="split-title"><h3>${e(r.summary)}</h3><span class="badge">${r.eff.toFixed(1)}°</span></div>${avatarStage(r)}</section><section class="card"><h3>Що вдягнути</h3><div class="outfit-list">${outfitRows(r)}</div><div class="muted" style="margin-top:12px">Чому так: враховано температуру, відчуття, вітер, опади, вік, чутливість і активність дитини${ctx.planned?' на час запланованої прогулянки':''}.</div>${fallback}<button id="refreshOutfit" class="btn primary">АВТО — ПІДІБРАТИ ОБРАЗ</button><button id="saveFavorite" class="btn secondary">⭐ ЗБЕРЕГТИ УЛЮБЛЕНИЙ КОМПЛЕКТ</button></section>`;
  };

  renderWalk = function(){
    const v=state.walk;
    return `<section class="card"><h3>План прогулянки</h3><div class="field"><label>Тривалість</label><select id="walkDuration">${[30,45,60,90,120].map(n=>`<option value="${n}" ${v.duration==n?'selected':''}>${n} хв</option>`).join('')}</select></div><div class="field"><label>Режим дитини</label><select id="walkMode"><option value="stroller" ${v.mode==='stroller'?'selected':''}>Переважно візочок</option><option value="normal" ${v.mode==='normal'?'selected':''}>Звичайно</option><option value="active" ${v.mode==='active'?'selected':''}>Активно</option></select></div><div class="field"><label>Час виходу</label><select id="walkDeparture">${buildWalkDepartureOptions()}</select></div><div id="walkForecastPreview">${pkV19ForecastHtml(v)}</div><button id="saveWalk" class="btn primary">ЗБЕРЕГТИ ПЛАН</button></section>`;
  };

  wire = function(){
    $$('[data-go]').forEach(b=>b.onclick=()=>nav(b.dataset.go));
    $('#refreshWeather')?.addEventListener('click',fetchWeather);
    $('#refreshOutfit')?.addEventListener('click',fetchWeather);
    $('#saveFavorite')?.addEventListener('click',()=>{
      const ctx=window.pkV19PlannedContext();
      state.favorite=recommendation(ctx.child,ctx.weather);save();toast('Комплект збережено');
    });
    $('#saveChild')?.addEventListener('click',()=>{
      state.child={name:$('#childName').value.trim()||'Дитина',age:$('#childAge').value,sensitivity:$('#childSens').value,activity:$('#childActivity').value,gender:$('#childGender').value};
      save();toast('Профіль збережено');render();
    });
    $$('.wardrobe-toggle').forEach(x=>x.onchange=()=>{state.wardrobe[x.dataset.key]=x.checked;save()});
    $('#saveCoords')?.addEventListener('click',()=>{
      const lat=Number($('#locLat').value),lon=Number($('#locLon').value);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)){toast('Перевір координати');return}
      state.coords={lat,lon,label:$('#locLabel').value.trim()||'Збережена локація'};
      save();toast('Координати збережено');
    });
    $('#resetApp')?.addEventListener('click',()=>{
      if(confirm('Скинути збережені дані Web-версії?')){localStorage.removeItem(STORAGE);state=load();render();toast('Дані скинуто')}
    });
    ['walkDuration','walkMode','walkDeparture'].forEach(id=>$('#'+id)?.addEventListener('change',window.pkV19UpdateWalkPreview));
    $('#saveWalk')?.addEventListener('click',()=>{
      state.walk={duration:Number($('#walkDuration').value),mode:$('#walkMode').value,departure:$('#walkDeparture').value};
      save();render();toast('План збережено');
    });
  };

  // Re-render once so V1.9 functions and handlers are active immediately.
  render();
})();
