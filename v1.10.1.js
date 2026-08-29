/* Pogodka Kids Web V1.10.1 — Visual Consistency FIX
   No new features: keeps outfit text/layers in sync and removes duplicate departure time.
*/
(function(){
  const baseRecommendation = recommendation;

  // Keep textual headwear recommendation consistent with the layer actually rendered.
  recommendation = function(ch,w){
    const r = baseRecommendation(ch,w);
    const headLayer = r?.layers?.head || null;
    if(headLayer === 'layer_cap.png') r.head = 'Кепка / панама';
    else if(headLayer === 'layer_hat.png') {
      // Preserve the temperature-specific wording already selected by the base engine.
      r.head = r.head || 'Шапка';
    } else if(!headLayer) {
      r.head = 'Без головного убору';
    }
    return r;
  };

  // V1.10 already prints the interval (08:00–09:00), so the prefix must contain only the day.
  window.pkV19WalkDepartureLabel = function(value=state.walk?.departure){
    if(!value || value === 'now') return 'сьогодні';
    const d = new Date(value);
    if(Number.isNaN(d.getTime())) return 'за планом';
    const now = new Date(), tomorrow = new Date(now);
    tomorrow.setDate(now.getDate()+1);
    const key = walkDateKey(d), todayKey = walkDateKey(now), tomorrowKey = walkDateKey(tomorrow);
    if(key === todayKey) return 'сьогодні';
    if(key === tomorrowKey) return 'завтра';
    return d.toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit'});
  };

  render();
})();
