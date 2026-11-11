'use strict';
/* Original logo "sting" for the Anyarthu splash, synthesized with Web Audio (no audio files).
   Beat map (seconds from splash start), matched to the splash CSS:
   0.00 riser · 0.30 plane pass · 0.55 hit "ta" (logo pops) · 0.85 hit "DUM" (ring closes) · 1.00 shimmer (name) · 2.10 whoosh out (wipe) */
window.AnyarthuSting = (() => {
  let ctx = null;
  const AC = window.AudioContext || window.webkitAudioContext;
  const get = () => {
    if (!ctx && AC) {
      // iPhone: play like media so the intro is heard even when the side switch is on silent (Safari 16.4+)
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
      try { ctx = new AC(); } catch (e) { ctx = null; }
    }
    return ctx;
  };

  /* can sound play right now? (browsers block audio until the visitor interacts) */
  function unlock() {
    const c = get();
    if (!c) return Promise.resolve(false);
    if (c.state === 'running') return Promise.resolve(true);
    // iPhone needs a sound started inside the tap itself to fully unlock audio: play one silent sample now
    try { const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
    return Promise.race([c.resume().then(() => c.state === 'running').catch(() => false), new Promise(r => setTimeout(() => r(false), 160))]);
  }

  function play() {
    const c = get();
    if (!c || c.state !== 'running') return false;
    const t0 = c.currentTime + 0.03;

    // master chain: compressor → gain
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.25;
    const master = c.createGain(); master.gain.value = 0.42;
    const limit = c.createDynamicsCompressor();                 // brick-wall style limiter so it never clips
    limit.threshold.value = -2; limit.knee.value = 0; limit.ratio.value = 20; limit.attack.value = 0.001; limit.release.value = 0.12;
    comp.connect(master); master.connect(limit); limit.connect(c.destination);

    // synthetic hall reverb
    const verb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 2.6), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = ir;
    const wet = c.createGain(); wet.gain.value = 0.32; verb.connect(wet); wet.connect(comp);

    const noiseBuf = (() => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
    const out = (node, dry = 1, send = 0.6) => { const g = c.createGain(); g.gain.value = dry; node.connect(g); g.connect(comp); if (send) { const s = c.createGain(); s.gain.value = send; node.connect(s); s.connect(verb); } };

    // filtered noise sweep (riser / whoosh)
    function sweep(at, dur, f1, f2, peak, pan = 0, endPan = pan) {
      const src = c.createBufferSource(); src.buffer = noiseBuf;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(f1, at); bp.frequency.exponentialRampToValueAtTime(f2, at + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(peak, at + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      src.connect(bp); bp.connect(g);
      if (p) { p.pan.setValueAtTime(pan, at); p.pan.linearRampToValueAtTime(endPan, at + dur); g.connect(p); out(p, 1, 0.4); } else out(g, 1, 0.4);
      src.start(at); src.stop(at + dur + 0.05);
    }

    // tonal hit: stacked partials + sub drop + transient click
    function hit(at, notes, decay, level, sub) {
      notes.forEach(([f, type, lv]) => {
        const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f * 1.012, at); o.frequency.exponentialRampToValueAtTime(f, at + 0.08);
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, at); lp.frequency.exponentialRampToValueAtTime(500, at + decay);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(level * lv, at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
        o.connect(lp); lp.connect(g); out(g, 1, 0.55); o.start(at); o.stop(at + decay + 0.05);
      });
      if (sub) {
        const s = c.createOscillator(); s.type = 'sine'; s.frequency.setValueAtTime(sub * 2.2, at); s.frequency.exponentialRampToValueAtTime(sub, at + 0.18);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(level * 1.1, at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + decay * 0.8);
        s.connect(g); out(g, 1, 0.15); s.start(at); s.stop(at + decay);
      }
      const n = c.createBufferSource(); n.buffer = noiseBuf;
      const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      const ng = c.createGain(); ng.gain.setValueAtTime(level * 0.35, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
      n.connect(hp); hp.connect(ng); out(ng, 1, 0.3); n.start(at); n.stop(at + 0.08);
    }

    // bell shimmer
    function bells(at, freqs, gap, level) {
      freqs.forEach((f, i) => {
        const t = at + i * gap;
        [1, 2.76].forEach((m, k) => {
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f * m;
          const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level * (k ? 0.25 : 1), t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + (k ? 0.5 : 1.4));
          o.connect(g); out(g, 0.8, 0.9); o.start(t); o.stop(t + 1.5);
        });
      });
    }

    // truck rumble rolling left → right behind the logo
    (() => {
      const at = t0 + 0.05, dur = 2.2;
      const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(140, at); lp.frequency.linearRampToValueAtTime(260, at + dur * .5); lp.frequency.linearRampToValueAtTime(120, at + dur);
      const eng = c.createOscillator(); eng.type = 'sawtooth'; eng.frequency.setValueAtTime(42, at); eng.frequency.linearRampToValueAtTime(58, at + dur * .5); eng.frequency.linearRampToValueAtTime(40, at + dur);
      const eg = c.createGain(); eg.gain.value = 0.18;
      const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.3, at + 0.35); g.gain.setValueAtTime(0.3, at + dur * .55); g.gain.linearRampToValueAtTime(0, at + dur);
      const p = c.createStereoPanner ? c.createStereoPanner() : null;
      src.connect(lp); eng.connect(eg); eg.connect(lp); lp.connect(g);
      if (p) { p.pan.setValueAtTime(-0.9, at); p.pan.linearRampToValueAtTime(0.9, at + dur); g.connect(p); out(p, 1, 0.2); } else out(g, 1, 0.2);
      src.start(at); src.stop(at + dur + 0.05); eng.start(at); eng.stop(at + dur + 0.05);
    })();
    sweep(t0, 0.6, 300, 2600, 0.22);                                   // riser into the logo
    sweep(t0 + 0.3, 1.5, 900, 2200, 0.07, -0.8, 0.8);                  // plane passes around the ring
    sweep(t0 + 0.1, 2.2, 500, 1600, 0.09, -0.9, 0.9);                  // cargo plane 1 crosses left to right
    sweep(t0 + 0.55, 2.3, 700, 1900, 0.06, 0.9, -0.9);                // cargo plane 2 crosses right to left
    hit(t0 + 0.55, [[98, 'triangle', 0.7], [196, 'sine', 0.45], [293.7, 'sine', 0.2]], 1.0, 0.55, 49);          // "ta"
    hit(t0 + 0.85, [[73.4, 'triangle', 0.8], [146.8, 'sine', 0.55], [220, 'sine', 0.35], [293.7, 'sine', 0.18]], 2.4, 0.8, 36.7); // "DUM"
    bells(t0 + 1.0, [1318.5, 1661.2, 1975.5, 2637], 0.075, 0.07);        // gold shimmer as the name appears
    sweep(t0 + 2.1, 0.7, 2400, 260, 0.3);                             // whoosh as the splash wipes away
    return true;
  }
  return { unlock, play };
})();
