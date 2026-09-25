/* Pogodka Kids Web V1.10.2 — Infant Headwear FIX
   Age-aware headwear rules. No other outfit logic is changed.
*/
(function(){
  const baseRecommendationV1101 = recommendation;

  function pkV1102IsInfant(ch){
    return String(ch?.age || '').includes('місяців');
  }

  function pkV1102Headwear(ch,w,r){
    if(!pkV1102IsInfant(ch)) return r;

    const eff = Number.isFinite(Number(r?.eff)) ? Number(r.eff) : effectiveTemp(ch,w);
    const wind = Number(w?.wind || 0);
    const wet = precipType(w) > 0;
    const sunny = Number(w?.code ?? 99) <= 1;

    // 6–12 months: head protection is deliberately more conservative.
    // <= 8°C effective: warm hat.
    // 8–16°C: light/demi hat.
    // 16–20°C: thin cotton/light hat; wind/wet weather also keeps a hat.
    // >= 20°C: sun hat when sunny; otherwise no mandatory headwear unless windy/wet.
    if(eff <= 8){
      r.head = 'Тепла шапка';
      r.layers.head = 'layer_hat.png';
    } else if(eff < 16){
      r.head = 'Легка демісезонна шапка';
      r.layers.head = 'layer_hat.png';
    } else if(eff < 20 || wind >= 3 || wet){
      r.head = 'Тонка бавовняна шапочка';
      r.layers.head = 'layer_hat.png';
    } else if(sunny){
      r.head = 'Кепка / панама від сонця';
      r.layers.head = 'layer_cap.png';
    } else {
      r.head = 'Без обов’язкового головного убору';
      r.layers.head = null;
    }
    return r;
  }

  recommendation = function(ch,w){
    return pkV1102Headwear(ch,w,baseRecommendationV1101(ch,w));
  };

  window.pkV1102Headwear = pkV1102Headwear;
  render();
})();
