// Everything is already in its final state; this only adds motion, the
// flags' cloth, and the copy button.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  // Copy button. Without the script it stays hidden and the prompt is plain,
  // selectable text.
  if (navigator.clipboard) document.querySelectorAll('.copy[data-for]').forEach(function (copy) {
    var promptEl = document.getElementById(copy.getAttribute('data-for'));
    var status = copy.parentNode.querySelector('[role="status"]');
    copy.hidden = false;
    var t;
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(promptEl.textContent).then(function () {
        copy.classList.add('done');
        status.textContent = 'Copied';
        clearTimeout(t);
        t = setTimeout(function () { copy.classList.remove('done'); status.textContent = ''; }, 2000);
      });
    });
  });

  // The flags as tissue paper. Each flag is a 6 x 6 Verlet mesh with stiff
  // distance constraints (paper must not stretch like rubber); its top row
  // is part of the string, itself a Verlet rope tacked between every two
  // flags so it scallops, sags and swings a little. The rope is heavier
  // than the paper, or four constraint passes let hanging flags drag it
  // into tents. Points move in x, y and z (towards you),
  // drawn straight on (x, y), so a flag turning in the wind foreshortens and
  // its cells shade by their tilt. Each colour's flag is painted once from
  // the SVG to an offscreen canvas and mapped onto its mesh triangle by
  // triangle; the cut-outs stay transparent. Forces: a slow breeze that
  // varies along the row, scrolling as a gust, and the pointer as short
  // puffs of air (see puffAt): a riffle that runs out along the string from
  // the flag nearest the pointer. One rAF loop, asleep while the row is off
  // screen or the tab is hidden. Cost: about 2ms of script a frame plus the
  // drawing, too much to idle on, so the breeze blows for eight seconds after
  // load or the last pointer move or scroll, drawing every other frame once
  // nobody is touching it, then dies away; when the paper is still the loop
  // sleeps until the pointer or a scroll wakes it. Reduced motion never gets
  // here: it keeps the still SVG.
  var flagrow = document.getElementById('flagrow');
  if (!reduce && flagrow) (function () {
    var svg = document.getElementById('flags');
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    // World units are the SVG's viewBox units: flags 60 apart, 36 wide.
    var NX = 6, NY = 6, FW = 36, FH = 38, TOPY = 4.5, SEG = FW / (NX - 1), TACK = 60, ROW = 2640;
    // MASS divides every force but gravity. Light paper again (v7's first
    // weight): the calm near the row comes from the gentle puffs, not from
    // heavy flags.
    var G = 650, DAMP = .95, MASS = 1.05, ITER = 5, DT = 1 / 60, VMAX = 6, TS = 3, ROPE_INV = .25;
    // Contact: a pointer over the row touches the paper. Points within R
    // world units are pushed in proportion to its speed with v7's first
    // gains (KC_X, KC_Y, KC_Z), and those within R / 2 are dragged a little
    // way along with it (DRAG of its step) before the constraints pull them
    // back. CONTACT_PAD is how far beyond the row, in pixels, still counts.
    var R = 58, KC_X = 11, KC_Y = 5, KC_Z = 5.5, DRAG = .12, CONTACT_PAD = 12, SP_FULL = 2400, touch = null;
    // The pointer's puffs: at most one every PUFF_MS, each fading with time
    // constant TAU, reaching a flag RIPPLE seconds per pixel after leaving the
    // pointer, and falling off as 1 / (1 + (d / D0)^2), eased to nothing
    // between 3/4 of CUT and CUT. KW sets the strength.
    var D0 = 200, CUT = 600, KW = 1.15, TAU = .07, RIPPLE = .0007, PUFF_MS = 160, MAX_PUFFS = 6, docTop = 0;
    var IDLE = 8000, CALM = 1500;
    var lastInput = performance.now(), breeze = 1, motion = 1;
    var colours = Array.prototype.map.call(svg.querySelectorAll('.fl'), function (g) { return +g.getAttribute('data-c'); });
    var tex = [], stringColour = '#5A5A55';
    var X, Y, Z, PX, PY, PZ, INV, cons, flags = [], ropeN = 0, scale = 1, offset = 0, dpr = 1, top = 0;
    var pending = null, puffs = [], lastPuff = 0, PAX = 0, PAY = 0, PAZ = 0, gust = 0, t0 = performance.now();
    var stats = window.__flagStats = { frames: 0, ms: 0, sleeping: false, lift: 0 };
    // For measurement only: the largest swing of any flag's bottom centre
    // away from hanging straight, in degrees, since the counter was reset.
    function lift() {
      var m = 0;
      for (var f = 0; f < flags.length; f++) {
        var ids = flags[f].ids, a = ids[(NX - 1) >> 1], b = ids[ids.length - NX + ((NX - 1) >> 1)];
        var dx = X[b] - X[a], dy = Y[b] - Y[a], dz = Z[b] - Z[a];
        var deg = Math.atan2(Math.sqrt(dx * dx + dz * dz), dy) * 57.3;
        if (deg > m) m = deg;
      }
      if (m > stats.lift) stats.lift = m;
    }

    function textures(done) {
      var cs = getComputedStyle(document.documentElement);
      stringColour = cs.getPropertyValue('--string').trim() || stringColour;
      var body = document.getElementById('fbody').getAttribute('d');
      var mask = '<mask id="m" maskUnits="userSpaceOnUse" x="-20" y="-2" width="40" height="44"><rect x="-20" y="-2" width="40" height="44" fill="#fff"/>' +
        '<path d="M-11 10H11M-11 16H11M-11 22H11" stroke="#000" stroke-width="2.2" stroke-linecap="round"/><path d="M0 26.5L3.5 30L0 33.5L-3.5 30Z"/></mask>';
      var out = [], left = 7;
      for (var k = 0; k < 7; k++) (function (k) {
        var src = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -2 40 44" width="' + 40 * TS + '" height="' + 44 * TS + '"><defs>' + mask +
          '</defs><path d="' + body + '" fill="' + cs.getPropertyValue('--f' + k).trim() + '" mask="url(#m)"/><rect x="-18" y="0" width="36" height="3" opacity=".15"/></svg>';
        var img = new Image();
        img.onload = function () {
          var c = document.createElement('canvas');
          c.width = 40 * TS; c.height = 44 * TS;
          c.getContext('2d').drawImage(img, 0, 0);
          out[k] = c;
          if (--left === 0) { tex = out; done(); }
        };
        img.src = 'data:image/svg+xml,' + encodeURIComponent(src);
      })(k);
    }

    function layout() {
      var r = svg.getBoundingClientRect();
      docTop = r.top + scrollY;
      scale = Math.max(r.width / ROW, r.height / 52);
      offset = (ROW * scale - r.width) / 2;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cr = canvas.getBoundingClientRect();
      canvas.width = Math.round(cr.width * dpr);
      canvas.height = Math.round(cr.height * dpr);
      // Simulate only what is on screen, out to the nearest tack each side.
      var w0 = offset / scale - 40, w1 = (offset + r.width) / scale + 40;
      build(Math.max(0, Math.floor(w0 / TACK) * TACK), Math.min(ROW, Math.ceil(w1 / TACK) * TACK));
    }

    function build(a0, a1) {
      // The rope, span by span: a tack, a node in the gap, the flag's six top
      // points, a node in the next gap; then the closing tack.
      var rx = [], tops = {}, k, i, j;
      for (k = a0 / TACK; k < a1 / TACK; k++) {
        var cx = 30 + 60 * k;
        rx.push(60 * k, 60 * k + 6);
        tops[k] = [];
        for (i = 0; i < NX; i++) { tops[k].push(rx.length); rx.push(cx - FW / 2 + SEG * i); }
        rx.push(60 * k + 54);
      }
      rx.push(a1);
      ropeN = rx.length;
      var list = Object.keys(tops).map(Number);
      var n = ropeN + list.length * NX * (NY - 1);
      X = new Float32Array(n); Y = new Float32Array(n); Z = new Float32Array(n);
      PX = new Float32Array(n); PY = new Float32Array(n); PZ = new Float32Array(n); INV = new Float32Array(n);
      var c = [];
      for (i = 0; i < ropeN; i++) {
        X[i] = PX[i] = rx[i]; Y[i] = PY[i] = TOPY; INV[i] = rx[i] % TACK === 0 ? 0 : ROPE_INV;
        if (i) c.push(i - 1, i, (rx[i] - rx[i - 1]) * 1.0015, 1);
      }
      var idx = ropeN, dx = SEG, dy = FH / (NY - 1), dd = Math.hypot(dx, dy);
      flags = list.map(function (k) {
        var cx = 30 + 60 * k, ids = [], uv = [];
        for (j = 0; j < NY; j++) for (i = 0; i < NX; i++) {
          var lx = -FW / 2 + dx * i, ly = dy * j;
          uv.push((lx + 20) * TS, (ly + 2) * TS);
          if (j === 0) { ids.push(tops[k][i]); continue; }
          X[idx] = PX[idx] = cx + lx; Y[idx] = PY[idx] = TOPY + ly; INV[idx] = 1;
          ids.push(idx++);
        }
        for (j = 0; j < NY; j++) for (i = 0; i < NX; i++) {
          var a = ids[j * NX + i];
          if (j > 0 && i < NX - 1) c.push(a, ids[j * NX + i + 1], dx, 1);
          if (j < NY - 1) c.push(a, ids[(j + 1) * NX + i], dy, 1);
          if (i < NX - 1 && j < NY - 1) c.push(a, ids[(j + 1) * NX + i + 1], dd, .8, ids[j * NX + i + 1], ids[(j + 1) * NX + i], dd, .8);
          // A little bending stiffness: paper, not cloth.
          if (j < NY - 2) c.push(a, ids[(j + 2) * NX + i], 2 * dy, .2);
          if (j > 0 && i < NX - 2) c.push(a, ids[j * NX + i + 2], 2 * dx, .2);
        }
        return { cx: cx, ids: ids, uv: uv, c: colours[k], seed: k * 1.7 };
      });
      cons = new Float32Array(c);
      // Hang the row before the first frame, so the page never opens on a drop.
      for (i = 0; i < 90; i++) step(i * DT);
    }

    function step(t) {
      var dt2 = DT * DT, now = performance.now(), i, f, q;
      var tn = now / 1000;
      if (pending && (!pending.hold || now - lastPuff >= PUFF_MS)) {
        pending.t = tn; lastPuff = now; puffs.push(pending); pending = null;
        if (puffs.length > MAX_PUFFS) puffs.shift();
      }
      while (puffs.length && tn - puffs[0].t > 1.5) puffs.shift();
      gust *= .97;
      var p = touch && now - touch.t < 90 ? touch : null;
      breeze += ((now - lastInput < IDLE ? 1 : 0) - breeze) * .02;
      for (f = 0; f < flags.length; f++) {
        var F = flags[f], cx = F.cx;
        // The breeze: two slow waves travelling different ways along the row,
        // so neighbours move together but never in lockstep.
        var b = (.5 + .5 * Math.sin(t * .37 + cx * .0021) * Math.sin(t * .71 - cx * .0037 + 1.3)) * breeze + gust;
        var wz = 200 * b, wx = 50 * b * Math.sin(t * .23 + cx * .001);
        puffAt(cx, tn);
        for (q = NX; q < F.ids.length; q++) {
          var id = F.ids[q], jj = (q / NX) | 0, depth = jj / (NY - 1), dep = .35 + .65 * depth;
          var flut = Math.sin(t * 7.3 + (q % NX) * .9 + jj * .6 + F.seed) * depth * depth;
          integrate(id, (wx * (.4 + .6 * depth) + PAX * dep) / MASS, PAY * dep / MASS,
            (wz * (.3 + .7 * depth) + 120 * flut * b + PAZ * dep) / MASS, dt2);
          if (p) contact(id, p);
        }
      }
      for (i = 0; i < ropeN; i++) if (INV[i]) integrate(i, 0, 0, 30 * Math.sin(t * .5 + i * .05) / MASS, dt2);
      for (var it = 0; it < ITER; it++) {
        for (var k = 0; k < cons.length; k += 4) {
          var a = cons[k], c = cons[k + 1], wa = INV[a], wc = INV[c], ws = wa + wc;
          if (!ws) continue;
          var ex = X[c] - X[a], ey = Y[c] - Y[a], ez = Z[c] - Z[a];
          var d = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6;
          var s = (d - cons[k + 2]) / d * cons[k + 3] / ws;
          X[a] += ex * s * wa; Y[a] += ey * s * wa; Z[a] += ez * s * wa;
          X[c] -= ex * s * wc; Y[c] -= ey * s * wc; Z[c] -= ez * s * wc;
        }
      }
    }

    // How much of a puff reaches a point: soft falloff with distance (in
    // screen pixels), eased to zero at the cut so nothing pops.
    function reach(x, y, p) {
      var d = Math.hypot(x - p.x, y - p.y) * scale;
      if (d >= CUT) return 0;
      var u = Math.max(0, (d - .75 * CUT) / (.25 * CUT)), e = 1 - u * u * (3 - 2 * u);
      return e / (1 + (d / D0) * (d / D0));
    }
    // The pointer's air on one flag, summed over recent puffs into PAX/PAY/
    // PAZ. Each puff blows from the pointer through the flag, carries part of
    // the pointer's sweep and lifts the paper a little; it arrives later the
    // further along the row the flag is, so a ripple runs down the string.
    function puffAt(cx, tn) {
      PAX = PAY = PAZ = 0;
      var sum = 0, cy = TOPY + FH / 2;
      for (var i = 0; i < puffs.length; i++) {
        var P = puffs[i], w = reach(cx, cy, P);
        if (!w) continue;
        var age = tn - P.t - Math.abs(cx - P.x) * scale * RIPPLE;
        if (age < 0) continue;
        var e = w * Math.exp(-age / TAU);
        if (e < .005) continue;
        var ex = cx - P.x, ey = cy - P.y, dl = Math.hypot(ex, ey) || 1, m = P.sp * KW * e;
        PAX += ex / dl * .6 * m + P.vx * .5 * KW * e;
        PAY += ey / dl * .6 * m + P.vy * .25 * KW * e;
        PAZ += .25 * m * P.side;
        sum += e;
      }
      // A pointer that never stops makes a riffle, never a steady blow.
      if (sum > 1) { PAX /= sum; PAY /= sum; PAZ /= sum; }
    }
    // Contact: a hand brushing paper. Applied after the step, as a push on
    // the point's velocity (Verlet keeps it as the gap to the last position)
    // plus a short drag for points right under the pointer.
    function contact(id, p) {
      var ex = X[id] - p.x, ey = Y[id] - p.y, d2 = ex * ex + ey * ey;
      if (d2 >= R * R) return;
      // Impulse per flag is speed times time under the pointer, which would
      // be the same for any speed; scaling by speed again makes a slow pass
      // a nudge and a fast one a flip.
      var f = 1 - Math.sqrt(d2) / R, dt2 = DT * DT; f *= f * Math.min(1, p.sp / SP_FULL);
      X[id] += (p.vx * KC_X * f) * dt2; Y[id] += (p.vy * KC_Y * f) * dt2;
      Z[id] += (p.sp * KC_Z * f * p.side) * dt2;
      if (f > .4) { X[id] += p.vx * DT * DRAG * f; Y[id] += p.vy * DT * DRAG * f * .5; }
    }
    function integrate(id, ax, ay, az, dt2) {
      var vx = (X[id] - PX[id]) * DAMP, vy = (Y[id] - PY[id]) * DAMP, vz = (Z[id] - PZ[id]) * DAMP;
      var v2 = vx * vx + vy * vy + vz * vz;
      if (v2 > VMAX * VMAX) { var k = VMAX / Math.sqrt(v2); vx *= k; vy *= k; vz *= k; }
      if (v2 > motion) motion = v2;
      PX[id] = X[id]; PY[id] = Y[id]; PZ[id] = Z[id];
      X[id] += vx + ax * dt2; Y[id] += vy + (ay + G) * dt2; Z[id] += vz + az * dt2;
    }

    // Light from the upper left, a little in front.
    var LX = -.35, LY = -.55, LZ = .76;
    function draw() {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var m = dpr * scale;
      grow = 1 + 1 / (5 * m);
      ctx.setTransform(m, 0, 0, m, -offset * dpr, 0);
      ctx.beginPath(); ctx.moveTo(X[0], Y[0]);
      for (var i = 1; i < ropeN; i++) ctx.lineTo(X[i], Y[i]);
      ctx.strokeStyle = stringColour; ctx.lineWidth = 1.2; ctx.stroke();
      for (var f = 0; f < flags.length; f++) drawFlag(flags[f]);
    }
    var grow = 1.1;
    function drawFlag(F) {
      var ids = F.ids, uv = F.uv, img = tex[F.c];
      for (var j = 0; j < NY - 1; j++) for (var i = 0; i < NX - 1; i++) {
        var q = j * NX + i, a = ids[q], b = ids[q + 1], c = ids[q + NX], d = ids[q + NX + 1];
        // Cell normal from its diagonals; shade by how far it has turned
        // from facing the light as it does at rest.
        var e1x = X[d] - X[a], e1y = Y[d] - Y[a], e1z = Z[d] - Z[a];
        var e2x = X[c] - X[b], e2y = Y[c] - Y[b], e2z = Z[c] - Z[b];
        var nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        var nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        cell(img, a, b, c, d, uv, q, (Math.abs(nx * LX + ny * LY + nz * LZ) / nl) - LZ);
      }
    }
    // One cell: clipped to its quad, textured by the affine map that fits
    // three of its corners. Cells are 7 units wide and bend smoothly, so the
    // fourth corner is off by well under a pixel; half the draw calls of two
    // triangles a cell, which is what makes an idle breeze affordable.
    function cell(img, p0, p1, p2, p3, uv, q, shade) {
      var x0 = X[p0], y0 = Y[p0], x1 = X[p1], y1 = Y[p1], x2 = X[p2], y2 = Y[p2], x3 = X[p3], y3 = Y[p3];
      var u0 = uv[q * 2], v0 = uv[q * 2 + 1], u1 = uv[q * 2 + 2], v2 = uv[(q + NX) * 2 + 1];
      var du = u1 - u0, dv = v2 - v0;
      var A = (x1 - x0) / du, B = (y1 - y0) / du, C = (x2 - x0) / dv, D = (y2 - y0) / dv;
      // Clip about a device pixel outside the cell, or antialiased edges
      // leave a faint grid of seams across the paper.
      var gx = (x0 + x1 + x2 + x3) / 4, gy = (y0 + y1 + y2 + y3) / 4, g = grow;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(gx + (x0 - gx) * g, gy + (y0 - gy) * g);
      ctx.lineTo(gx + (x1 - gx) * g, gy + (y1 - gy) * g);
      ctx.lineTo(gx + (x3 - gx) * g, gy + (y3 - gy) * g);
      ctx.lineTo(gx + (x2 - gx) * g, gy + (y2 - gy) * g);
      ctx.clip();
      ctx.transform(A, B, C, D, x0 - A * u0 - C * v0, y0 - B * u0 - D * v0);
      var sx = Math.max(0, u0 - 3), sy = Math.max(0, v0 - 3), sw = Math.min(img.width - sx, du + 6), sh = Math.min(img.height - sy, dv + 6);
      ctx.drawImage(img, sx, sy, sw, sh, sx, sy, sw, sh);
      if (shade < -.02 || shade > .02) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = shade < 0 ? 'rgba(0,0,0,' + Math.min(.42, -shade * .9).toFixed(3) + ')' : 'rgba(255,255,255,' + Math.min(.28, shade * .8).toFixed(3) + ')';
        ctx.fillRect(sx, sy, sw, sh);
      }
      ctx.restore();
    }

    var running = false, onScreen = true, acc = 0, lastT = 0, drawn = false;
    function frame(now) {
      if (!running) return;
      if (!onScreen || document.hidden) { running = false; stats.sleeping = true; return; }
      acc += Math.min((now - lastT) / 1000, .1); lastT = now;
      var t = (now - t0) / 1000, n = 0, c0 = performance.now();
      motion = 0;
      while (acc >= DT && n < 3) { step(t); acc -= DT; n++; }
      // Still paper and no breeze left: draw this last frame and sleep.
      var still = n > 0 && !pending && !(touch && now - touch.t < 90) && breeze < .01 && gust < .01 && motion < 1e-4 && !(puffs.length && now / 1000 - puffs[puffs.length - 1].t < .6);
      if (n && (still || now - lastInput < CALM || (drawn = !drawn))) { draw(); stats.frames++; stats.ms += performance.now() - c0; }
      if (n) lift();
      if (still) { running = false; stats.sleeping = true; return; }
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || !onScreen || document.hidden || !tex.length) return;
      running = true; stats.sleeping = false; lastT = performance.now(); acc = 0;
      requestAnimationFrame(frame);
    }

    var lx = null, ly = 0, lt = 0;
    // Any pointer move on the page sends a puff. The handler only records
    // where the pointer is and how fast it goes, keeping the fastest move
    // since the last puff; at most one puff leaves every PUFF_MS.
    addEventListener('pointermove', function (e) {
      var wx = (e.clientX + offset) / scale, wy = (e.clientY + scrollY - docTop) / scale, now = performance.now();
      if (lx !== null && now > lt) {
        var dt = (now - lt) / 1000, vx = (wx - lx) / dt, vy = (wy - ly) / dt, sp = Math.hypot(vx, vy);
        if (sp > 2500) { vx *= 2500 / sp; vy *= 2500 / sp; sp = 2500; }
        if (!pending || sp > pending.sp) pending = { x: wx, y: wy, vx: vx, vy: vy, sp: sp, side: vx < 0 ? -1 : 1, t: now / 1000 };
        if (now - lastPuff < PUFF_MS) pending.hold = true; else { pending.hold = false; lastPuff = now; }
        lastInput = now;
        start();
      }
      if (lx !== null && now > lt) {
        // Over the row (and its swing room) the pointer touches the paper.
        var cr = canvas.getBoundingClientRect();
        if (e.clientY >= cr.top - CONTACT_PAD && e.clientY <= cr.top + 52 * scale + 24 + CONTACT_PAD) {
          touch = { x: wx, y: wy, vx: (wx - lx) / ((now - lt) / 1000), vy: (wy - ly) / ((now - lt) / 1000), t: now };
          var tsp = Math.hypot(touch.vx, touch.vy);
          if (tsp > 2500) { touch.vx *= 2500 / tsp; touch.vy *= 2500 / tsp; tsp = 2500; }
          touch.sp = tsp; touch.side = touch.vx < 0 ? -1 : 1;
        }
      }
      lx = wx; ly = wy; lt = now;
    }, { passive: true });
    var sy = scrollY, st = performance.now();
    addEventListener('scroll', function () {
      var now = performance.now(), v = Math.abs(scrollY - sy) / Math.max(now - st, 8);
      sy = scrollY; st = now;
      gust = Math.min(1.2, gust + v * .25);
      if (v > .05) { lastInput = now; start(); }
    }, { passive: true });

    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) start(); }).observe(flagrow);
    document.addEventListener('visibilitychange', start);
    var rz;
    addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { layout(); draw(); }, 120); });
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { textures(function () { draw(); }); });

    textures(function () {
      flagrow.appendChild(canvas);
      layout();
      draw();
      flagrow.classList.add('live');
      start();
    });
  })();

  // The gravel. CSS already shows a small static tile (also the no-JS look);
  // this paints a larger one once: rounded pebbles of several sizes, each
  // lit from the upper left with a soft rim, in a narrow band of tones, so
  // the ground reads as stones while staying quiet. Redrawn if the colour
  // scheme changes.
  (function () {
    var dark = matchMedia('(prefers-color-scheme: dark)');
    var tiles = {
      light: { base: '#F1EADD', tones: ['#F0E9DC', '#F1EADE', '#F2ECE0', '#F1EADC'], rim: '#EFE8DA', hi: '#F4EFE4' },
      dark: { base: '#121E21', tones: ['#111D20', '#121F22', '#132124', '#121F22'], rim: '#101C1F', hi: '#152427' }
    };
    var url = null;
    function paint() {
      var t = tiles[dark.matches ? 'dark' : 'light'], S = 512, k = Math.min(window.devicePixelRatio || 1, 2);
      var c = document.createElement('canvas');
      c.width = c.height = S * k;
      var g = c.getContext('2d');
      if (!g) return;
      g.scale(k, k);
      g.fillStyle = t.base; g.fillRect(0, 0, S, S);
      var seed = 20261022;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      function pebble(x, y, rx, ry, a, fill) {
        for (var ox = -S; ox <= S; ox += S) for (var oy = -S; oy <= S; oy += S) {
          var px = x + ox, py = y + oy;
          if (px < -8 || px > S + 8 || py < -8 || py > S + 8) continue;
          // Rim on the shadow side, then the body lit towards the upper left.
          g.fillStyle = t.rim; g.beginPath(); g.ellipse(px + .45, py + .55, rx + .35, ry + .35, a, 0, 6.2832); g.fill();
          var gr = g.createRadialGradient(px - rx * .35, py - ry * .4, 0, px, py, Math.max(rx, ry));
          gr.addColorStop(0, t.hi); gr.addColorStop(.55, fill); gr.addColorStop(1, fill);
          g.fillStyle = gr; g.beginPath(); g.ellipse(px, py, rx, ry, a, 0, 6.2832); g.fill();
        }
      }
      // Big stones first, small ones filling the gaps between them.
      var list = [];
      for (var i = 0; i < 3400; i++) {
        var r = 1.1 + Math.pow(rnd(), 2.4) * 4.4;
        list.push([rnd() * S, rnd() * S, r, r * (.65 + rnd() * .35), rnd() * 3.14, t.tones[(rnd() * t.tones.length) | 0]]);
      }
      list.sort(function (a, b) { return b[2] - a[2]; });
      list.forEach(function (p) { pebble(p[0], p[1], p[2], p[3], p[4], p[5]); });
      c.toBlob(function (b) {
        if (!b) return;
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(b);
        var st = document.documentElement.style;
        st.setProperty('--gravel-img', 'url(' + url + ')');
        st.setProperty('--gravel-size', S + 'px');
      });
    }
    paint();
    dark.addEventListener('change', paint);
  })();

  // The furrows. As you read, an unseen garden rake sweeps five furrows down
  // the bed: long S-bends from side to side, across every gap between
  // sections near its kerb line, sometimes through the open space beside a
  // heading, and now and then once round a stone, leaving five rings. Where
  // they pass behind text, code, buttons or images they are painted at under
  // half strength, so no text sits on a visible ridge.
  //
  // The path is built from the real layout after load and on resize, from a
  // fixed seed, so it is the same on every visit at the same width. Control
  // points (rings are nine points round their stone) are joined with a
  // Catmull-Rom spline and resampled every 3px, so there are no corners.
  //
  // The sampled path is cut into 30px chunks, each painted once into its own
  // small canvas (trough, shadowed wall, lit lip, broken ridges of pushed-up
  // pebbles). Scrolling only moves a soft mask edge along the chunk being
  // raked; chunks behind it show whole, chunks ahead stay hidden. Nothing is
  // painted per scroll frame.
  //
  // The head keeps pace with the reader's eye line: vertical travel takes
  // scroll one for one, sideways travel and rings take a third as much, and
  // the timing is pinned to each section's own control points so it never
  // drifts. The last run finishes as the page does. Narrower than 1100px the
  // text fills the width and the gaps keep their still furrows in CSS.
  (function () {
    var main = document.querySelector('main > .wrap');
    if (!main) return;
    var N = 5, GAP = 8, W = 6, RING = 36, STONE = 7, MIN_W = 1100, EYE = .5, FADE = 18, STEP = 3, CHUNK = 10;
    var OFF = [];
    for (var i = 0; i < N; i++) OFF.push((i - (N - 1) / 2) * GAP);
    var HALF = (N - 1) / 2 * GAP + W / 2 + 4;
    var cols = {
      light: { trough: '#ECE4D5', pebbles: ['#E9E1D1', '#EBE3D3', '#EDE6D8'], wall: '#E4DBC9', rim: '#F6F2EA', ridge: ['#F4EFE6', '#F5F1E9', '#F3EEE4'], ridgeSh: '#E9E1D1' },
      dark: { trough: '#101B1E', pebbles: ['#0F1A1D', '#101C1F', '#111D20'], wall: '#0C171A', rim: '#17272A', ridge: ['#152427', '#162528', '#142326'], ridgeSh: '#0E191C' }
    };
    var dark = matchMedia('(prefers-color-scheme: dark)');
    var box = document.createElement('div');
    box.className = 'garden';
    box.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(box, document.body.firstChild);

    var stoneEls = [], PX = [], PY = [], TX = [], TY = [], chunks = [], anchors = [], rawE = [], rects = [], total = 0, shown = -1, ready = false, dpr = 1, queue = [], painting = false;

    function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

    // Catmull-Rom through the control points, then resampled every STEP px.
    function spline(cp) {
      var fx = [], fy = [], i, k;
      for (i = 0; i < cp.length - 1; i++) {
        var p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
        var n = Math.max(8, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2));
        for (k = 0; k < n; k++) {
          var t = k / n, t2 = t * t, t3 = t2 * t;
          fx.push(.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3));
          fy.push(.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3));
          if (k === 0) p1.fi = fx.length - 1;
        }
      }
      fx.push(cp[cp.length - 1].x); fy.push(cp[cp.length - 1].y); cp[cp.length - 1].fi = fx.length - 1;
      // Resample by arc length; remember where each control point landed.
      var ox = [fx[0]], oy = [fy[0]], acc = 0, at = {}, c = 0;
      var byFi = {}; cp.forEach(function (p, j) { byFi[p.fi] = j; });
      at[0] = 0;
      for (i = 1; i < fx.length; i++) {
        var seg = Math.hypot(fx[i] - fx[i - 1], fy[i] - fy[i - 1]);
        acc += seg;
        while (acc >= STEP) {
          acc -= STEP;
          var u = seg ? 1 - acc / seg : 1;
          ox.push(fx[i - 1] + (fx[i] - fx[i - 1]) * u); oy.push(fy[i - 1] + (fy[i] - fy[i - 1]) * u);
        }
        if (byFi[i] !== undefined) at[byFi[i]] = ox.length - 1;
      }
      return { x: ox, y: oy, at: at };
    }

    function build() {
      ready = false;
      while (box.firstChild) box.removeChild(box.firstChild);
      chunks = []; anchors = []; shown = -1; queue = [];
      var vw = document.documentElement.clientWidth;
      var secs = Array.prototype.slice.call(main.querySelectorAll(':scope > section'));
      if (vw < MIN_W || secs.length < 2) { box.style.display = 'none'; document.documentElement.classList.remove('raking'); return; }
      box.style.display = '';
      document.documentElement.classList.add('raking');
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var mr = main.getBoundingClientRect(), colL = mr.left, colR = mr.right, colW = colR - colL;
      var docH = document.documentElement.scrollHeight;
      box.style.height = docH + 'px';
      box.style.overflow = 'hidden';
      var top = function (e) { return e.getBoundingClientRect().top + scrollY; };
      var bottom = function (e) { return e.getBoundingClientRect().bottom + scrollY; };

      // Where content sits: the furrows are painted fainter over these.
      rects = [];
      document.querySelectorAll('main section .body > *, main section > .mo, main section > .features, footer .wrap > *').forEach(function (e) {
        var r = e.getBoundingClientRect();
        if (r.width && r.height) rects.push([r.left, r.top + scrollY, r.right, r.bottom + scrollY]);
      });

      // Where the vignettes and pictures are: rings keep clear of them.
      var avoid = [];
      document.querySelectorAll('main section > .mo, main .shots, main .dj, main .tree, main pre').forEach(function (e) {
        var r = e.getBoundingClientRect();
        avoid.push([r.left - 12, r.top + scrollY - 12, r.right + 12, r.bottom + scrollY + 12]);
      });
      var hits = function (x, y, r) {
        for (var i = 0; i < avoid.length; i++) { var a = avoid[i]; if (x + r > a[0] && x - r < a[2] && y + r > a[1] && y - r < a[3]) return true; }
        return false;
      };

      // Control points. Each section is swept down one gutter with gentle,
      // uneven S-bends, now and then swinging in behind the text (never
      // across a vignette); each gap is crossed near its kerb line; each
      // crossing arrives at a ring in the far gutter, and a few sections get
      // a ring in open space behind their text.
      var rnd = rng(20261022 + Math.round(vw));
      var gL = colL / 2, gR = colR + (vw - colR) / 2, gW = Math.min(colL, vw - colR);
      var lane = function (s) { return (s ? gR : gL) + (rnd() - .5) * gW * .5; };
      var ROUT = RING + HALF;
      var side = 0, cp = [], stones = [];
      function ring(cx, cy, from) {
        // Nine points on the circle, starting on the side we arrive from:
        // the spline through them is round, and leaves where it entered.
        var a0 = Math.atan2(from.y - cy, from.x - cx), dir = from.x < cx ? -1 : 1;
        for (var k = 0; k <= 8; k++) { var a = a0 + dir * k * Math.PI / 4; cp.push({ x: cx + RING * Math.cos(a), y: cy + RING * Math.sin(a) }); }
        stones.push([cx, cy, cp.length - 9]);
      }
      var y0 = top(secs[0]) + 40;
      // Enter from the page's left edge rather than starting in mid-gravel,
      // so the furrows never appear from nowhere: the rake comes in from
      // the side, then turns down the gutter.
      cp.push({ x: -ROUT * 3, y: y0 - 70, anchor: true });
      cp.push({ x: gL * .45, y: y0 - 40 });
      cp.push({ x: gL, y: y0, anchor: true });
      secs.forEach(function (sec, i) {
        var T = top(sec), B = bottom(sec), y = i ? T + 210 : y0 + 220, ringed = false;
        while (y < B - 170) {
          var x = lane(side), inward = rnd() < .3;
          if (inward) {
            var xi = (side ? colR : colL) + (side ? -1 : 1) * colW * (.1 + rnd() * .2);
            if (!hits(xi, y, HALF + 20)) x = xi; else inward = false;
          }
          cp.push({ x: x, y: y, anchor: true });
          // In every third section, one ring out in the bed behind the text,
          // where no vignette, picture or code block sits.
          if (!ringed && i % 3 === 1 && y > T + 160 && y + 2 * ROUT < B - 140) {
            for (var tries = 0; tries < 8 && !ringed; tries++) {
              var cx = colL + colW * (.3 + rnd() * .55), cy = y + ROUT + 40 + rnd() * 60;
              if (cy + ROUT < B - 100 && !hits(cx, cy, ROUT + 10)) {
                cp.push({ x: (cp[cp.length - 1].x + cx) / 2, y: cy - ROUT - 20 });
                ring(cx, cy, cp[cp.length - 1]);
                ringed = true; y = cy + ROUT + 60;
              }
            }
          }
          y += 220 + rnd() * 170;
        }
        if (i === secs.length - 1) return;
        // The crossing: a long, slightly wavy sweep along the gap.
        var other = 1 - side;
        cp.push({ x: side ? gR : gL, y: B - 40 });
        cp.push({ x: side ? colR - colW * .3 : colL + colW * .3, y: B + 6 + (rnd() - .5) * 12 });
        cp.push({ x: side ? colL + colW * .3 : colR - colW * .3, y: B + 10 + (rnd() - .5) * 12 });
        // The arrival: a ring in the far gutter, just below the kerb line.
        var rx = other ? gR : gL, ry = B + ROUT + 18;
        cp.push({ x: rx + (other ? -1 : 1) * RING * .4, y: ry - RING * 1.05 });
        ring(rx, ry, cp[cp.length - 1]);
        side = other;
      });
      cp.push({ x: side ? gR : gL, y: docH - 40, anchor: true });
      cp.push({ x: (side ? gR : gL) + (side ? 20 : -20), y: docH + HALF + 20, anchor: true });

      var sp = spline(cp);
      PX = sp.x; PY = sp.y;
      var map = []; for (var q = 0; q < PX.length; q++) map[q] = q;
      var L = PX.length;
      TX = new Float32Array(L); TY = new Float32Array(L);
      for (i = 0; i < L; i++) {
        var a1 = Math.max(0, i - 1), b1 = Math.min(L - 1, i + 1), dx = PX[b1] - PX[a1], dy = PY[b1] - PY[a1], dl = Math.hypot(dx, dy) || 1;
        TX[i] = dx / dl; TY[i] = dy / dl;
      }
      total = L - 1;

      // Scroll timing: raw scroll per sample is its downward travel, or a
      // third of its length if more (sideways sweeps, rings), pinned to the
      // anchor control points so the head stays at the eye line.
      rawE = new Float64Array(L);
      for (i = 1; i < L; i++) rawE[i] = rawE[i - 1] + Math.max(Math.max(0, PY[i] - PY[i - 1]), STEP / 3);
      cp.forEach(function (p, j) { if (p.anchor && map[sp.at[j]] !== undefined) anchors.push([p.y, map[sp.at[j]]]); });
      anchors.sort(function (a, b) { return a[1] - b[1]; });
      var eMax = docH - innerHeight * (1 - EYE), eA = eMax - innerHeight;
      anchors = anchors.filter(function (a) { return a[0] < eA; });
      var kA = 0; while (kA < L - 1 && PY[kA] < eA) kA++;
      if (kA > anchors[anchors.length - 1][1]) anchors.push([eA, kA]);
      anchors.push([eMax, L - 1]);

      // A stone shows once the rake has started round it.
      stoneEls = stones.map(function (s) {
        var st = document.createElement('i');
        st.className = 'stone todo';
        st.dataset.at = sp.at[s[2]] || 0;
        st.style.cssText = 'left:' + (s[0] - STONE) + 'px;top:' + (s[1] - STONE) + 'px;width:' + 2 * STONE + 'px;height:' + 2 * STONE + 'px;opacity:' + (.45 + .55 * clear(s[0], s[1])).toFixed(2);
        box.appendChild(st);
        return st;
      });
      for (var c0 = 0; c0 < L - 1; c0 += CHUNK) {
        var c1 = Math.min(L - 1, c0 + CHUNK), x0 = 1e9, y0b = 1e9, x1 = -1e9, y1 = -1e9;
        for (q = c0; q <= c1; q++) { x0 = Math.min(x0, PX[q]); x1 = Math.max(x1, PX[q]); y0b = Math.min(y0b, PY[q]); y1 = Math.max(y1, PY[q]); }
        var ch = { a: c0, b: c1, x: Math.floor(x0 - HALF), y: Math.floor(y0b - HALF) };
        ch.w = Math.ceil(x1 + HALF - ch.x); ch.h = Math.ceil(y1 + HALF - ch.y);
        // Mask along the chunk's chord: CSS gradient angle and line length.
        var dx2 = PX[c1] - PX[c0], dy2 = PY[c1] - PY[c0], dl2 = Math.hypot(dx2, dy2) || 1;
        ch.dx = dx2 / dl2; ch.dy = dy2 / dl2;
        var th = Math.atan2(ch.dx, -ch.dy);
        ch.len = Math.abs(ch.w * Math.sin(th)) + Math.abs(ch.h * Math.cos(th));
        ch.mask = 'linear-gradient(' + (th * 57.2958).toFixed(1) + 'deg, #000 calc(var(--p) - ' + FADE + 'px), transparent var(--p))';
        var cv = document.createElement('canvas');
        cv.style.cssText = 'left:' + ch.x + 'px;top:' + ch.y + 'px;width:' + ch.w + 'px;height:' + ch.h + 'px';
        cv.width = Math.round(ch.w * dpr); cv.height = Math.round(ch.h * dpr);
        cv.className = 'todo';
        ch.el = cv;
        box.appendChild(cv);
        queue.push(chunks.length);
        chunks.push(ch);
      }
      ready = true;
      update(true);
      paintSome();
    }

    // 1 in open gravel, falling to 0 inside a content block (and 44px
    // around it), so furrows under content are painted at under half.
    function clear(x, y) {
      var m = 44, d = m;
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i], dx = Math.max(r[0] - x, 0, x - r[2]), dy = Math.max(r[1] - y, 0, y - r[3]);
        var e = Math.max(dx, dy);
        if (e < d) { d = e; if (!d) break; }
      }
      return d / m;
    }

    function paintSome() {
      if (painting) return;
      painting = true;
      requestAnimationFrame(function work() {
        var t0 = performance.now(), mid = scrollY + innerHeight / 2;
        queue.sort(function (a, b) { return Math.abs(chunks[a].y - mid) - Math.abs(chunks[b].y - mid); });
        while (queue.length && performance.now() - t0 < 8) paint(chunks[queue.shift()]);
        if (queue.length) requestAnimationFrame(work); else painting = false;
      });
    }

    function paint(ch) {
      var g = ch.el.getContext('2d'), c = cols[dark.matches ? 'dark' : 'light'];
      g.setTransform(dpr, 0, 0, dpr, -ch.x * dpr, -ch.y * dpr);
      var seed = (ch.a * 7919 + 17) >>> 0, rnd = rng(seed), o, k;
      function dot(x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
      var LX = -.6, LY = -.8, b = Math.min(ch.b, PX.length - 1);
      // Walk the chunk in 2px steps between samples.
      var pts = [];
      for (k = ch.a; k < b; k++) for (var h = 0; h < STEP; h += 2) {
        var u = h / STEP;
        pts.push([PX[k] + (PX[k + 1] - PX[k]) * u, PY[k] + (PY[k + 1] - PY[k]) * u, -TY[k], TX[k]]);
      }
      pts.forEach(function (q) { q[4] = .45 + .55 * clear(q[0], q[1]); });
      for (o = 0; o < N; o++) pts.forEach(function (q) {
        g.globalAlpha = q[4];
        dot(q[0] + q[2] * OFF[o], q[1] + q[3] * OFF[o], W / 2, c.trough);
      });
      for (o = 0; o < N; o++) pts.forEach(function (q) {
        g.globalAlpha = q[4];
        var x = q[0] + q[2] * OFF[o], y = q[1] + q[3] * OFF[o], s = (q[2] * LX + q[3] * LY) > 0 ? 1 : -1;
        dot(x + q[2] * s * (W / 2 - 1), y + q[3] * s * (W / 2 - 1), .7 + rnd() * .4, c.wall);
        if (rnd() < .3) dot(x - q[2] * s * (W / 2 - .8), y - q[3] * s * (W / 2 - .8), .6 + rnd() * .4, c.rim);
        if (rnd() < .7) { var u = (rnd() - .5) * (W - 2); dot(x + q[2] * u, y + q[3] * u, .6 + rnd() * .9, c.pebbles[(rnd() * 3) | 0]); }
        for (var sd = -1; sd <= 1; sd += 2) if (rnd() < .22) {
          var d = sd * (W / 2 + 1.3 + rnd() * 1.2), r = .8 + rnd() * 1.3, rx = x + q[2] * d, ry = y + q[3] * d;
          dot(rx + .5, ry + .6, r, c.ridgeSh); dot(rx, ry, r, c.ridge[(rnd() * 3) | 0]);
        }
      });
      g.globalAlpha = 1;
    }

    function eyeToS(e) {
      if (e <= anchors[0][0]) return anchors[0][1];
      for (var i = 1; i < anchors.length; i++) {
        if (e <= anchors[i][0]) {
          var A = anchors[i - 1], B = anchors[i], u = (e - A[0]) / Math.max(B[0] - A[0], 1e-6);
          var target = rawE[A[1]] + (rawE[B[1]] - rawE[A[1]]) * u, lo = A[1], hi = B[1];
          while (hi - lo > 1) { var m = (lo + hi) >> 1; if (rawE[m] < target) lo = m; else hi = m; }
          return lo + (target - rawE[lo]) / Math.max(rawE[hi] - rawE[lo], 1e-6);
        }
      }
      return total;
    }
    function state(ch, st) {
      if (ch.st === st) return;
      ch.st = st;
      ch.el.className = st;
      var m = st === 'live' ? ch.mask : '';
      ch.el.style.webkitMaskImage = m; ch.el.style.maskImage = m;
    }
    function update(force) {
      if (!ready) return;
      var s = reduce ? total + 1 : eyeToS(scrollY + innerHeight * EYE);
      var k = Math.min(chunks.length - 1, Math.max(0, Math.floor(s / CHUNK))), ch = chunks[k];
      if (force || k !== shown) {
        var from = force ? 0 : Math.min(k, shown), to = force ? chunks.length - 1 : Math.max(k, shown);
        for (var i = from; i <= to; i++) state(chunks[i], i < k ? 'done' : i > k ? 'todo' : 'live');
        shown = k;
      }
      stoneEls.forEach(function (e) { var v = s >= +e.dataset.at; if (v !== !e.classList.contains('todo')) e.classList.toggle('todo', !v); });
      if (reduce || s >= total) { state(ch, 'done'); return; }
      state(ch, 'live');
      // The head, projected on the chunk's gradient line, a little ahead.
      var j = Math.min(PX.length - 1, Math.floor(s)), f = s - j, j2 = Math.min(PX.length - 1, j + 1);
      var hx = PX[j] + (PX[j2] - PX[j]) * f, hy = PY[j] + (PY[j2] - PY[j]) * f;
      var pos = (hx - (ch.x + ch.w / 2)) * ch.dx + (hy - (ch.y + ch.h / 2)) * ch.dy + ch.len / 2 + FADE / 2;
      ch.el.style.setProperty('--p', pos.toFixed(1) + 'px');
    }

    var queued = false;
    if (!reduce) addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }, { passive: true });
    var rt;
    function rebuild() { clearTimeout(rt); rt = setTimeout(build, 150); }
    addEventListener('resize', rebuild);
    dark.addEventListener('change', rebuild);
    if (window.ResizeObserver) new ResizeObserver(rebuild).observe(main);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
  })();

  // Path tabs (Get started, Deployment): the two panels differ in height
  // and desktop sections centre their content, so switching would move the
  // tabs, sometimes out of view. Pin them: note where they sit just before
  // the switch, then scroll by however far they moved.
  document.querySelectorAll('.paths').forEach(function (fs) {
    var before = null;
    var note = function () { before = fs.getBoundingClientRect().top; };
    fs.addEventListener('pointerdown', note, true);
    fs.addEventListener('keydown', note, true);
    fs.addEventListener('change', function () {
      if (before === null) return;
      var moved = fs.getBoundingClientRect().top - before;
      before = null;
      if (Math.abs(moved) > 1) window.scrollBy({ top: moved, behavior: 'instant' });
      var r = fs.getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight - 80) fs.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
  });

  // Markup window: start the preview on the page's own scheme.
  if (matchMedia('(prefers-color-scheme: dark)').matches) { var mkd = document.getElementById('mk-dark'); if (mkd) mkd.checked = true; }
  // De-jank: the SPA frame goes blank, spinner, text, then text with a
  // spinner where its picture belongs, and stays there while the frame is
  // in view. The picture (and a notice bar) only arrive as the frame
  // leaves the screen, by either edge, so the page jumps just as you stop
  // looking. Once the frame is fully off screen it resets, so every visit
  // replays the joke. Reduced motion keeps the static final state.
  var dj = document.getElementById('dejank');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var loaded = false, engaged = false, djq = false;
    var djStep = function () {
      djq = false;
      var r = dj.getBoundingClientRect(), vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) { loaded = false; engaged = false; }
      else if (!loaded && engaged && (r.bottom < vh * .3 || r.top > vh * .7)) loaded = true;
      var step = 4;
      if (!loaded) {
        var p = (vh * .95 - r.top) / (vh * .45);
        step = p < .15 ? 0 : p < .4 ? 1 : p < .7 ? 2 : 3;
        if (step === 3) engaged = true;
      }
      if (dj.getAttribute('data-step') !== String(step)) dj.setAttribute('data-step', String(step));
    };
    var djTick = function () { if (!djq) { djq = true; requestAnimationFrame(djStep); } };
    addEventListener('scroll', djTick, { passive: true });
    addEventListener('resize', djTick);
    djStep();
  }

  if (reduce || !('IntersectionObserver' in window)) return;

  // Without scroll timelines, play the other moments once as they come into view.
  if (window.CSS && CSS.supports('animation-timeline: view()')) return;
  var root = document.documentElement;
  root.classList.add('js-fb');
  var els = document.querySelectorAll('[data-moment]');
  els.forEach(function (el) { el.classList.add('pre'); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
    });
  }, { threshold: .45 });
  els.forEach(function (el) { io.observe(el); });

})();
