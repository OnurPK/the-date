/* roles.ai · "Play the air" — pianoforte rhythm mini-game that rides on the episode-end Air scene.
   Mounted by prideAirScene when the episode ships air/notes.json (or Settings → Dev → Piano mock).
   One 2D canvas, no filters (iOS). 7-key window F F# G G# A A# B → lanes 0..6.
   notes.json: { "offset": 0.10, "notes":[ {"t":12.74,"d":0.0,"k":2}, … ] }  t = seconds in the audio, d = hold seconds (0 = tap), k = lane.
   Timing comes from the <audio> element's currentTime (+ a stored calibration), never from frame counts. */
(function(){
  'use strict';
  const LANES_CHROMATIC = [ {n:'F',b:false,w:0}, {n:'F#',b:true,w:0}, {n:'G',b:false,w:1}, {n:'G#',b:true,w:1}, {n:'A',b:false,w:2}, {n:'A#',b:true,w:2}, {n:'B',b:false,w:3} ];
  const LANES_DIATONIC  = [0,1,2,3,4,5,6].map(i=>({ n:'', b:false, w:i }));                          // 7 white keys = 7 scale degrees (HANDOVER_PIANO_7KEYS)
  const KEYS_CHROMATIC = { a:0, w:1, s:2, e:3, d:4, r:5, f:6 }, KEYS_DIATONIC = { s:0, d:1, f:2, g:3, h:4, j:5, k:6 };
  let LANES = LANES_DIATONIC, KEY_MAP = KEYS_DIATONIC;
  const PERFECT = 0.05, GOOD = 0.10, HOLD_RELEASE = 0.18;             // seconds
  const LEAD = 2.2;                                                   // seconds a note is visible before its hit time (lane travel time)
  const CAL_KEY = 'rai.piano.cal';

  // ---- tiny piano voice (Web Audio, no samples): 3 partials + fast decay. Good enough for "I am playing" feedback. ----
  let ctx = null, master = null;
  function audio(){ if(ctx) return ctx; try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination); }catch(e){} return ctx; }
  const MIDI = { F:65, 'F#':66, G:67, 'G#':68, A:69, 'A#':70, B:71 };
  function ping(lane, soft, midi){ const c = audio(); if(!c) return; try{ if(c.state==='suspended') c.resume(); }catch(e){}
    const m = midi || (LANES[lane].n ? MIDI[LANES[lane].n] : 60+[0,2,4,5,7,9,11][lane]); const f = 440*Math.pow(2,(m-69)/12), t = c.currentTime, g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(soft?0.35:0.9, t+0.006); g.gain.exponentialRampToValueAtTime(0.0001, t+(soft?0.5:1.4)); g.connect(master);
    [[1,1],[2,0.42],[3,0.18],[4.02,0.08]].forEach(([m,a])=>{ const o=c.createOscillator(); o.type='sine'; o.frequency.value=f*m; const og=c.createGain(); og.gain.value=a; o.connect(og); og.connect(g); o.start(t); o.stop(t+1.5); });
  }

  // ---- mock chart from the karaoke word times (until the ABC chart exists) ----
  function mockChart(lines){ const notes=[]; let k=2, dir=1;
    (lines||[]).forEach(l=>{ (l.words||[]).forEach((w,i,arr)=>{ const nxt=arr[i+1]; const gap = nxt ? nxt.t - w.t : 0.6;
      k += dir*(1+Math.floor(Math.random()*2)); if(k>6){ k=5; dir=-1; } if(k<0){ k=1; dir=1; }
      notes.push({ t:w.t, d: gap>0.75 ? Math.min(gap-0.25, 1.6) : 0, k }); }); });
    return { offset:0, notes };
  }

  // ---- glow sprite (pre-rendered once; canvas shadowBlur is too slow on iOS) ----
  function glowSprite(size, rgb){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d'); const r=size/2;
    const gr=g.createRadialGradient(r,r,0,r,r,r); gr.addColorStop(0,'rgba('+rgb+',.95)'); gr.addColorStop(.35,'rgba('+rgb+',.45)'); gr.addColorStop(1,'rgba('+rgb+',0)'); g.fillStyle=gr; g.fillRect(0,0,size,size); return c; }

  window.pridePiano = {
    /* mount(ov, au, chart, opts) → controller { stop(), result() }
       ov: the Air overlay element (position:fixed) · au: the song <audio> · chart: {offset, notes} · opts: { onScore(score,combo), onEnd(result), lyrics } */
    mount(ov, au, chart, opts){
      opts = opts||{}; let layoutName = opts.layout || chart.layout || 'piano'; try{ layoutName = localStorage.getItem('rai.piano.layout') || layoutName; }catch(e){}
      // 'piano' = the 7 scale degrees drawn as a real-looking keyboard: 4 white + 3 black at the joins (lanes 1,3,5 are the blacks). Looks like a
      // pianoforte; the keys are still degrees (no key sound, the recording plays), so the mapping is visual only. 'diatonic' = 7 white keys.
      LANES = layoutName==='diatonic' ? LANES_DIATONIC : LANES_CHROMATIC; KEY_MAP = layoutName==='diatonic' ? KEYS_DIATONIC : KEYS_CHROMATIC;
      const NW = LANES.filter(l=>!l.b).length; const labels = chart.labels || LANES.map(l=>l.n);
      const notes = (chart.notes||[]).slice().sort((a,b)=>a.t-b.t).map(n=>Object.assign({}, n, { state:0, hitAt:0 }));   // state 0 pending · 1 hit (holding) · 2 done · 3 missed
      const offset = +chart.offset||0; let cal = 0; try{ cal = parseFloat(localStorage.getItem(CAL_KEY)||'0')||0; }catch(e){}
      const cv = document.createElement('canvas'); cv.className = 'piano'; ov.appendChild(cv); const g = cv.getContext('2d');
      const glow = glowSprite(96,'255,214,120'), glowW = glowSprite(140,'255,236,190');
      let W=0, H=0, dpr=1, keyTop=0, keyH=0, laneTop=0, hitY=0, whiteW=0, blackW=0, blackH=0;
      const laneX = new Array(7), laneW = new Array(7);
      function layout(){ dpr = Math.min(2, window.devicePixelRatio||1); W = ov.clientWidth; H = ov.clientHeight; cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr); cv.style.width = W+'px'; cv.style.height = H+'px'; g.setTransform(dpr,0,0,dpr,0,0);
        keyH = Math.round(H*0.24); keyTop = H - keyH; hitY = keyTop - 6; laneTop = Math.round(H*0.36);
        whiteW = W/NW; blackW = whiteW*0.64; blackH = keyH*0.62;
        LANES.forEach((l,i)=>{ if(!l.b){ laneX[i] = l.w*whiteW; laneW[i] = whiteW; } else { laneX[i] = (l.w+1)*whiteW - blackW/2; laneW[i] = blackW; } }); }
      layout(); window.addEventListener('resize', layout);

      // ---- state ----
      const pressed = new Array(7).fill(false), pressedBy = {};       // lane → down?  · pointerId → lane
      const holding = new Array(7).fill(null);                        // lane → note being held
      let score=0, combo=0, best=0, perfect=0, good=0, miss=0, next=0, ended=false, raf=0, lastT=0;
      const pops=[];                                                  // floating judge texts {x,y,txt,t0,col}
      const songT = () => (au.currentTime||0) - offset + cal;

      function judgeHit(lane, now){ // nearest pending note on this lane within GOOD
        let bestN=null, bestD=1;
        for(let i=next;i<notes.length;i++){ const n=notes[i]; if(n.t-now>GOOD) break; if(n.state||n.k!==lane) continue; const d=Math.abs(n.t-now); if(d<bestD){ bestD=d; bestN=n; } }
        if(!bestN) return false;
        const q = bestD<=PERFECT ? 'Perfect' : 'Good'; if(q==='Perfect'){ perfect++; score+=100*(1+Math.min(combo,20)/10|0); } else { good++; score+=60*(1+Math.min(combo,20)/10|0); }
        combo++; best=Math.max(best,combo); bestN.state = bestN.d>0 ? 1 : 2; bestN.hitAt=now; if(bestN.d>0) holding[lane]=bestN; lastHitMidi = bestN.p||null;
        pops.push({ x:laneX[lane]+laneW[lane]/2, y:hitY-26, txt:q, t0:performance.now(), col: q==='Perfect'?'#ffe9a8':'#f0d47c' });
        if(opts.onScore) opts.onScore(score, combo); return true; }
      let lastHitMidi=null;
      // No synthesized key sound: the recording IS the pianoforte. The "I am playing it" feeling comes from the keys lighting under
      // the right notes at the right time; a miss briefly thins the song instead (a slip of the fingers), hits restore it.
      let duckT=0; const duck=()=>{ if(!opts.duck) return; try{ au.volume = Math.max(0.15, baseVol*0.5); clearTimeout(duckT); duckT=setTimeout(()=>{ au.volume=baseVol; }, 320); }catch(e){} };
      const baseVol = au.volume;
      function down(lane){ if(ended||pressed[lane]) return; pressed[lane]=true; const now=songT(); const hit=judgeHit(lane, now); if(!hit) duck(); }
      function up(lane){ pressed[lane]=false; const h=holding[lane]; if(h){ const now=songT(); if(now < h.t+h.d-HOLD_RELEASE){ h.state=3; combo=0; miss++; pops.push({ x:laneX[lane]+laneW[lane]/2, y:hitY-26, txt:'Early', t0:performance.now(), col:'#c98c8c' }); } else { h.state=2; score+=40; } holding[lane]=null; } }

      // ---- input: touch/pointer on the keys, keyboard on desktop ----
      const whiteLanes = LANES.map((l,i)=>l.b?-1:i).filter(i=>i>=0);
      function laneAt(x,y){ if(y<keyTop) return -1; const ly=y-keyTop; if(ly<blackH){ for(let i=0;i<7;i++){ if(LANES[i].b && x>=laneX[i] && x<laneX[i]+laneW[i]) return i; } } const w=Math.min(NW-1,Math.max(0,Math.floor(x/whiteW))); return whiteLanes[w]; }
      const pd = e => { const r=cv.getBoundingClientRect(); const lane=laneAt(e.clientX-r.left, e.clientY-r.top); if(lane<0) return; e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_){} pressedBy[e.pointerId]=lane; down(lane); };
      const pu = e => { const lane=pressedBy[e.pointerId]; if(lane==null) return; delete pressedBy[e.pointerId]; up(lane); };
      cv.addEventListener('pointerdown', pd); cv.addEventListener('pointerup', pu); cv.addEventListener('pointercancel', pu); cv.addEventListener('lostpointercapture', pu);
      const kd = e => { if(e.repeat) return; const l=KEY_MAP[e.key.toLowerCase()]; if(l==null) return; e.preventDefault(); down(l); };
      const ku = e => { const l=KEY_MAP[e.key.toLowerCase()]; if(l==null) return; up(l); };
      window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

      // ---- render ----
      function rr(x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
      function frame(){ raf = requestAnimationFrame(frame); const now = songT(); if(!(now>lastT-0.5)) {} lastT=now;
        // advance the window, flag misses
        while(next<notes.length && notes[next].t < now-GOOD && notes[next].state!==1){ const n=notes[next]; if(n.state===0){ n.state=3; miss++; combo=0; duck(); } if(n.state!==1) next++; else break; }
        g.clearRect(0,0,W,H);
        // lanes (dark translucent strips over the video, from laneTop down to the keys)
        for(let i=0;i<7;i++){ const a = LANES[i].b ? .28 : .13; const lg=g.createLinearGradient(0,laneTop-70,0,laneTop+90); lg.addColorStop(0,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(0,0,0,'+a+')'); g.fillStyle=lg; g.fillRect(laneX[i], laneTop-70, laneW[i], 160); g.fillStyle='rgba(0,0,0,'+a+')'; g.fillRect(laneX[i], laneTop+90, laneW[i], keyTop-laneTop-90); }
        // notes — drawn unclamped inside a clip from the lane top to the keys, then the top 70 px is faded out
        // (destination-out gradient) so bars glide into view instead of appearing clamped at the edge
        const pxPerSec = (hitY-laneTop)/LEAD; const TAP = 34;
        g.save(); g.beginPath(); g.rect(0, laneTop-70, W, keyTop-laneTop+70); g.clip();
        for(let i=Math.max(0,next-4);i<notes.length;i++){ const n=notes[i]; const dt=n.t-now; if(dt>LEAD+1.2) break; if(n.state===2 || (n.state===3 && dt<-0.3)) continue;
          const yEnd = hitY - dt*pxPerSec; const len = Math.max(TAP, n.d*pxPerSec); const yTop = yEnd - len; if(yTop > keyTop) continue;
          const x = laneX[n.k]+ (LANES[n.k].b?3:5), w = laneW[n.k]-(LANES[n.k].b?6:10);
          const held = n.state===1; const blk = LANES[n.k].b; const col = n.state===3 ? 'rgba(120,100,80,.55)' : blk ? (held ? '#ffc8d8' : '#d9607f') : (held ? '#fff1c2' : '#f2c75c');
          const y0 = held ? Math.min(hitY-6, yTop) : yTop, y1 = held ? hitY : yEnd;
          g.fillStyle = col; rr(x, y0, w, Math.max(TAP*0.6, y1-y0), Math.min(9,w/2)); g.fill();
          if(n.state!==3){ g.fillStyle='rgba(255,255,255,.38)'; rr(x+3, y0+3, w-6, 5, 2.5); g.fill(); }
          if(held){ g.drawImage(glowW, x+w/2-70, hitY-70, 140, 140); } }
        g.globalCompositeOperation='destination-out'; const fo=g.createLinearGradient(0,laneTop-70,0,laneTop+40); fo.addColorStop(0,'rgba(0,0,0,1)'); fo.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=fo; g.fillRect(0,laneTop-70,W,110); g.globalCompositeOperation='source-over';
        g.restore();
        // hit line
        const hl=g.createLinearGradient(0,hitY-2,0,hitY+2); g.fillStyle='rgba(240,212,124,.9)'; g.fillRect(0,hitY-1,W,2);
        g.fillStyle='rgba(240,212,124,.18)'; g.fillRect(0,hitY-10,W,20);
        // keys: whites then blacks
        for(let i=0;i<7;i++){ if(LANES[i].b) continue; const x=laneX[i]; const p=pressed[i];
          const kg=g.createLinearGradient(0,keyTop,0,H); kg.addColorStop(0,p?'#fff2c9':'#f1e7d0'); kg.addColorStop(1,p?'#f0cf7d':'#cdbd9c'); g.fillStyle=kg; g.fillRect(x+1,keyTop,whiteW-2,keyH);
          g.fillStyle='rgba(60,40,20,.35)'; g.fillRect(x+whiteW-2,keyTop,2,keyH); if(p){ g.drawImage(glow, x+whiteW/2-48, keyTop-48, 96, 96); }
          if(labels[i]){ g.fillStyle='rgba(90,70,40,.55)'; g.font='600 12px Inter,system-ui,sans-serif'; g.textAlign='center'; g.fillText(labels[i], x+whiteW/2, H-14); } }
        for(let i=0;i<7;i++){ if(!LANES[i].b) continue; const x=laneX[i]; const p=pressed[i];
          const kg=g.createLinearGradient(0,keyTop,0,keyTop+blackH); kg.addColorStop(0,p?'#7a3a50':'#2a221e'); kg.addColorStop(1,p?'#5a2838':'#0f0c0a'); g.fillStyle=kg; rr(x,keyTop,blackW,blackH,4); g.fill();
          g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+3,keyTop+2,blackW-6,3); if(p){ g.drawImage(glow, x+blackW/2-40, keyTop+blackH-60, 80, 80); }
          if(labels[i]){ g.fillStyle='rgba(255,220,230,.55)'; g.font='600 11px Inter,system-ui,sans-serif'; g.textAlign='center'; g.fillText(labels[i], x+blackW/2, keyTop+blackH-10); } }
        // judge pops
        const pn=performance.now(); for(let i=pops.length-1;i>=0;i--){ const p=pops[i]; const a=(pn-p.t0)/700; if(a>=1){ pops.splice(i,1); continue; } g.globalAlpha=1-a; g.fillStyle=p.col; g.font='italic 600 15px "Playfair Display",Georgia,serif'; g.textAlign='center'; g.fillText(p.txt, p.x, p.y-a*22); g.globalAlpha=1; }
        if(!ended && au.ended){ finish(); }
      }
      function result(){ return { score, perfect, good, miss, best, total:notes.length }; }
      function finish(){ if(ended) return; ended=true; if(opts.onEnd) opts.onEnd(result()); }
      function stop(){ ended=true; cancelAnimationFrame(raf); window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); window.removeEventListener('resize',layout); try{ cv.remove(); }catch(e){} }
      raf = requestAnimationFrame(frame);
      return { stop, result, finish, setCal(v){ cal=v; try{ localStorage.setItem(CAL_KEY,String(v)); }catch(e){} } };
    },
    mockChart,
    LANES
  };
})();
