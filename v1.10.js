/* Pogodka Kids Web V1.10 — Smart Outfit Intelligence
   Adds whole-walk interval intelligence over V1.9.1 stable base.
*/
(function(){
  function v110Num(x,fallback=0){const n=Number(x);return Number.isFinite(n)?n:fallback}
  function v110DepartureDate(value){
    if(!value||value==='now') return new Date();
    const d=new Date(value); return Number.isNaN(d.getTime())?new Date():d;
  }
  function v110HourlyWeather(x){
    return {valid:true,temp:v110Num(x.temp),feels:v110Num(x.feels,x.temp),humidity:state.weather.humidity,wind:v110Num(x.wind),precip:v110Num(x.precip),code:v110Num(x.code),updated:state.weather.updated,pop:v110Num(x.pop)};
  }
  function v110RainLike(code){return [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(Number(code))}
  function v110SnowLike(code){return [71,73,75,77,85,86].includes(Number(code))}
  function v110Samples(walk=state.walk){
    const start=v110DepartureDate(walk?.departure),duration=Math.max(15,v110Num(walk?.duration,60));
    const end=new Date(start.getTime()+duration*60000), arr=Array.isArray(state.weather?.hourly)?state.weather.hourly:[];
    const result=[];
    if((walk?.departure||'now')==='now' && state.weather?.valid){
      result.push({time:start.toISOString(),weather:{...state.weather,pop:0},source:'current'});
    }
    for(const x of arr){
      const t=new Date(x.time); if(Number.isNaN(t.getTime()))continue;
      // Include forecast points inside interval plus a 30-min edge tolerance for hourly data.
      if(t.getTime()>=start.getTime()-30*60000 && t.getTime()<=end.getTime()+30*60000){
        result.push({time:x.time,weather:v110HourlyWeather(x),source:'hourly'});
      }
    }
    result.sort((a,b)=>new Date(a.time)-new Date(b.time));
    const seen=new Set();
    return result.filter(s=>{const k=new Date(s.time).getTime();if(seen.has(k))return false;seen.add(k);return true});
  }
  function v110IntervalContext(walk=state.walk){
    const start=v110DepartureDate(walk?.departure),duration=Math.max(15,v110Num(walk?.duration,60)),end=new Date(start.getTime()+duration*60000);
    const child=window.pkV19WalkChild?window.pkV19WalkChild(walk?.mode):{...state.child,activity:walk?.mode||state.child.activity};
    let samples=v110Samples(walk);
    let fallback=false;
    if(!samples.length){samples=[{time:start.toISOString(),weather:state.weather,source:'fallback'}];fallback=true}
    const scored=samples.map(s=>({...s,eff:effectiveTemp(child,s.weather)}));
    const coldest=scored.reduce((a,b)=>b.eff<a.eff?b:a,scored[0]);
    const warmest=scored.reduce((a,b)=>b.eff>a.eff?b:a,scored[0]);
    const maxWind=Math.max(...scored.map(s=>v110Num(s.weather.wind)));
    const maxPop=Math.max(...scored.map(s=>v110Num(s.weather.pop)));
    const maxPrecip=Math.max(...scored.map(s=>v110Num(s.weather.precip)));
    const hasSnow=scored.some(s=>v110SnowLike(s.weather.code));
    const hasRain=scored.some(s=>v110RainLike(s.weather.code)||v110Num(s.weather.precip)>0);
    const riskCode=hasSnow?71:(hasRain?61:coldest.weather.code);
    const conservativeWeather={...coldest.weather,wind:maxWind,precip:maxPrecip,code:riskCode};
    const recommendationResult=recommendation(child,conservativeWeather);
    const first=scored[0],last=scored[scored.length-1];
    const tempDelta=v110Num(last?.weather.temp)-v110Num(first?.weather.temp);
    const effSpread=warmest.eff-coldest.eff;
    const warnings=[];
    if(tempDelta<=-2)warnings.push(`За прогулянку похолодає приблизно на ${Math.abs(tempDelta).toFixed(1)}°C.`);
    else if(tempDelta>=2)warnings.push(`За прогулянку потеплішає приблизно на ${tempDelta.toFixed(1)}°C — верхній шар краще зробити знімним.`);
    if(maxWind>=6)warnings.push(`Поривчастий/сильніший вітер до ${maxWind.toFixed(1)} м/с — потрібен захист від вітру.`);
    else if(maxWind>=4)warnings.push(`Вітер посилюватиметься до ${maxWind.toFixed(1)} м/с.`);
    if(hasRain||maxPop>=50)warnings.push(`Під час прогулянки можливі опади${maxPop?` (до ${Math.round(maxPop)}%)`:''} — візьми водозахисний шар.`);
    if(hasSnow)warnings.push('У проміжку прогулянки можливий сніг — потрібен тепліший водозахисний комплект.');
    if(effSpread>=4)warnings.push(`Відчутна температура зміниться приблизно на ${effSpread.toFixed(1)}°C.`);
    return {start,end,duration,child,samples:scored,coldest,warmest,maxWind,maxPop,maxPrecip,hasRain,hasSnow,tempDelta,effSpread,warnings,weather:conservativeWeather,recommendation:recommendationResult,fallback};
  }
  window.pkV110IntervalContext=v110IntervalContext;

  function v110Time(d){return d.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})}
  function v110RangeLabel(ctx){
    const dep=state.walk?.departure||'now';
    const prefix=window.pkV19WalkDepartureLabel?window.pkV19WalkDepartureLabel(dep):'зараз';
    return `${prefix} • ${v110Time(ctx.start)}–${v110Time(ctx.end)} • ${ctx.duration} хв`;
  }
  function v110IntelligenceHtml(ctx,compact=false){
    const minT=Math.min(...ctx.samples.map(s=>v110Num(s.weather.temp))),maxT=Math.max(...ctx.samples.map(s=>v110Num(s.weather.temp)));
    const warn=ctx.warnings.length?ctx.warnings.map(x=>`<div>• ${e(x)}</div>`).join(''):'<div>Упродовж прогулянки різких погодних змін не очікується.</div>';
    return `<div class="success" style="margin-top:${compact?'10':'12'}px"><strong>🧠 Smart Outfit Intelligence</strong><div style="margin-top:6px">${e(v110RangeLabel(ctx))}</div><div style="margin-top:4px">Температура ${minT.toFixed(1)}…${maxT.toFixed(1)}° • вітер до ${ctx.maxWind.toFixed(1)} м/с • опади до ${Math.round(ctx.maxPop)}%</div><div style="margin-top:8px">${warn}</div></div>`;
  }

  // Make existing V1.9 callers receive whole-interval conservative weather.
  window.pkV19PlannedContext=function(){
    const ctx=v110IntervalContext(state.walk);
    const departure=state.walk?.departure||'now';
    return {weather:ctx.weather,child:ctx.child,label:v110RangeLabel(ctx),planned:departure!=='now',fallback:ctx.fallback,interval:ctx};
  };

  renderHome=function(){
    const ch=state.child,w=state.weather,ctx=v110IntervalContext(state.walk),r=ctx.recommendation;
    const departure=state.walk?.departure||'now';
    const title=departure==='now'?'Образ на всю прогулянку':`Образ для прогулянки ${window.pkV19WalkDepartureLabel(departure)}`;
    return `<section class="hero"><h2>Сьогодні для дитини</h2><div class="meta">${e(ch.name)} • ${e(ch.age)} • ${sensitivityText(ch.sensitivity)} • ${activityText(ch.activity)}</div>${weatherMetrics()}</section><section class="card"><div class="split-title"><h3>${e(title)}</h3><span class="badge">${weatherIcon(ctx.weather.code)} ${r.eff.toFixed(1)}° ефект.</span></div><div class="outfit-list">${outfitRows(r)}</div>${v110IntelligenceHtml(ctx,true)}<button class="btn primary" data-go="outfit">ПОКАЗАТИ ОБРАЗ</button></section><section class="card"><h3>Перед виходом</h3><div class="success">${preExit(r,ctx.weather)}</div><button class="btn secondary" data-go="walk">ПЛАН ПРОГУЛЯНКИ</button></section><section class="card"><h3>Що зміниться протягом дня</h3>${dayDelta()}</section>`;
  };

  renderOutfit=function(){
    const ctx=v110IntervalContext(state.walk),r=ctx.recommendation;
    const fallback=ctx.fallback?'<div class="muted" style="margin-top:12px">⚠️ Погодинний прогноз для всього інтервалу недоступний. Використано останні доступні дані.</div>':'';
    return `<section class="card"><div class="split-title"><h3>${e(r.summary)}</h3><span class="badge">${r.eff.toFixed(1)}°</span></div>${avatarStage(r)}${v110IntelligenceHtml(ctx)}</section><section class="card"><h3>Що вдягнути</h3><div class="outfit-list">${outfitRows(r)}</div><div class="muted" style="margin-top:12px">Комплект підібрано за найхолоднішою/найризикованішою частиною всієї прогулянки з урахуванням зміни температури, вітру та опадів.</div>${fallback}<button id="refreshOutfit" class="btn primary">АВТО — ПІДІБРАТИ ОБРАЗ</button><button id="saveFavorite" class="btn secondary">⭐ ЗБЕРЕГТИ УЛЮБЛЕНИЙ КОМПЛЕКТ</button></section>`;
  };

  function v110WalkPreview(v){
    const ctx=v110IntervalContext(v),r=ctx.recommendation;
    const minT=Math.min(...ctx.samples.map(s=>v110Num(s.weather.temp))),maxT=Math.max(...ctx.samples.map(s=>v110Num(s.weather.temp)));
    return `<section class="walk-preview"><div class="split-title"><h3>Прогноз на всю прогулянку</h3><span class="badge">${weatherIcon(ctx.weather.code)} ${minT.toFixed(1)}…${maxT.toFixed(1)}°</span></div>${v110IntelligenceHtml(ctx,true)}<div class="success" style="margin-top:10px"><strong>Рекомендований образ:</strong> ${e(r.summary)}</div><div class="outfit-list">${outfitRows(r)}</div></section>`;
  }
  window.pkV19UpdateWalkPreview=function(){
    const box=$('#walkForecastPreview');if(!box)return;
    const v={duration:Number($('#walkDuration')?.value||state.walk.duration),mode:$('#walkMode')?.value||state.walk.mode,departure:$('#walkDeparture')?.value||state.walk.departure};
    box.innerHTML=v110WalkPreview(v);
  };
  renderWalk=function(){
    const v=state.walk;
    return `<section class="card"><h3>План прогулянки</h3><div class="field"><label>Тривалість</label><select id="walkDuration">${[30,45,60,90,120].map(n=>`<option value="${n}" ${v.duration==n?'selected':''}>${n} хв</option>`).join('')}</select></div><div class="field"><label>Режим дитини</label><select id="walkMode"><option value="stroller" ${v.mode==='stroller'?'selected':''}>Переважно візочок</option><option value="normal" ${v.mode==='normal'?'selected':''}>Звичайно</option><option value="active" ${v.mode==='active'?'selected':''}>Активно</option></select></div><div class="field"><label>Час виходу</label><select id="walkDeparture">${buildWalkDepartureOptions()}</select></div><div id="walkForecastPreview">${v110WalkPreview(v)}</div><button id="saveWalk" class="btn primary">ЗБЕРЕГТИ ПЛАН</button></section>`;
  };

  render();
})();
