// ============================================================================
// TRIFOLD: IRONMARCH — boot & main loop
// ============================================================================
'use strict';

let _lastT = 0;

function frame(t) {
  const dt = Math.min(0.05, (t - _lastT) / 1000 || 0.016);
  _lastT = t;
  const b = G.battle;
  if (G.screen === 'battle' && b) {
    if (b.phase === 'fight') {
      let sdt = dt * G.speed;
      while (sdt > 0.0001) {
        const step = Math.min(sdt, 0.035);
        battleTick(step);
        sdt -= step;
        if (!G.battle) break;
      }
    } else {
      // placement phase: just let transient fx fade
      for (const f of b.fx) f.ttl -= dt;
      b.fx = b.fx.filter(f => f.ttl > 0);
    }
    if (G.battle) Render.draw(G.battle);
  } else if (G.screen === 'title') {
    UI.drawTitle(dt);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', () => {
  Meta.load();
  Render.init();
  UI.init();
  UI.showTitle();
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
