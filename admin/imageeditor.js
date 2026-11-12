/* =====================================================================
   Éditeur de photo de l'espace admin : recadrage, zoom, rotation,
   miroir, luminosité / contraste / saturation, avant l'envoi.
   UNIR_IMG.edit(source, options) → Promise<{ dataUrl } | null>
     source  : File ou adresse d'image (même site, ou data:)
     options : { aspect: nombre | null, aspectLabel, title, step: 'Photo 2 / 5', skipLabel }
     null = annulé ; { skip: true } = « Garder telle quelle »
   ===================================================================== */
(() => {
'use strict';
const MAX = 1800;          // plus grand côté de la photo finale
const QUALITY = .86;
const P = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const I = {
  rl: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  rr: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  fl: '<path d="M12 3v18"/><path d="M8 7 3 12l5 5V7zM16 7l5 5-5 5V7z"/>',
  zi: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>',
  zo: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  con: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  sat: '<path d="M12 2.7s7 7.3 7 12.3a7 7 0 0 1-14 0c0-5 7-12.3 7-12.3z"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>'
};
const ic = n => `<svg ${P} aria-hidden="true">${I[n]}</svg>`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Le navigateur sait-il appliquer les réglages directement sur un canvas ? (Safari : non)
const canvasFilter = (() => { try { const x = document.createElement('canvas').getContext('2d'); x.filter = 'brightness(50%)'; return x.filter === 'brightness(50%)'; } catch (e) { return false; } })();

function loadImage(src) {
  return new Promise((res, rej) => {
    const go = url => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = () => rej(new Error('Image illisible.')); i.src = url; };
    if (src instanceof Blob) {
      if (!/^image\//.test(src.type)) return rej(new Error('Ce fichier n\'est pas une image.'));
      const r = new FileReader(); r.onload = () => go(r.result); r.onerror = () => rej(new Error('Fichier illisible.')); r.readAsDataURL(src);
    } else go(src);
  });
}

let root = null;
function build() {
  root = document.createElement('div');
  root.id = 'imged';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'ie-t');
  root.innerHTML = `
    <div class="ie-box">
      <header class="ie-h"><div><small id="ie-step"></small><h3 id="ie-t">Ajuster la photo</h3></div>
        <button type="button" class="ie-x" data-k="cancel" aria-label="Fermer">${ic('x')}</button></header>
      <div class="ie-main">
        <div class="ie-stage" id="ie-stage"><canvas id="ie-img"></canvas><canvas id="ie-ov"></canvas>
          <span class="ie-tip">Faites glisser la photo pour la placer dans le cadre</span></div>
        <aside class="ie-side">
          <div class="ie-blk"><b>Format du cadre</b><div class="ie-ratios" id="ie-ratios"></div></div>
          <div class="ie-blk"><b>Zoom</b>
            <div class="ie-zoom"><button type="button" class="ie-ib" data-k="zo" aria-label="Dézoomer">${ic('zo')}</button>
            <input type="range" id="ie-z" min="1" max="4" step="0.01" value="1" aria-label="Zoom">
            <button type="button" class="ie-ib" data-k="zi" aria-label="Zoomer">${ic('zi')}</button></div></div>
          <div class="ie-blk"><b>Orientation</b>
            <div class="ie-row"><button type="button" class="ie-btn" data-k="rl">${ic('rl')}<span>Gauche</span></button>
            <button type="button" class="ie-btn" data-k="rr">${ic('rr')}<span>Droite</span></button>
            <button type="button" class="ie-btn" data-k="fl">${ic('fl')}<span>Miroir</span></button></div></div>
          <div class="ie-blk"><b>Réglages</b>
            ${[['br', 'Luminosité', 'sun'], ['ct', 'Contraste', 'con'], ['sa', 'Saturation', 'sat']].map(([k, l, i]) =>
              `<label class="ie-sl">${ic(i)}<span>${l}</span><output id="ie-${k}o">0</output><input type="range" id="ie-${k}" min="-50" max="50" step="1" value="0" aria-label="${l}"></label>`).join('')}
          </div>
          <button type="button" class="ie-reset" data-k="reset">${ic('undo')} Réinitialiser</button>
        </aside>
      </div>
      <footer class="ie-f"><span class="ie-info" id="ie-info"></span>
        <button type="button" class="ie-skip" data-k="skip" id="ie-skip">Garder telle quelle</button>
        <button type="button" class="ie-cancel" data-k="cancel">Annuler</button>
        <button type="button" class="ie-ok" data-k="ok">${ic('ok')} Valider</button></footer>
    </div>`;
  document.body.appendChild(root);
}

function edit(source, opts = {}) {
  if (!root) build();
  return loadImage(source).then(img => new Promise(resolve => {
    const $ = s => root.querySelector(s);
    const stage = $('#ie-stage'), cI = $('#ie-img'), cO = $('#ie-ov'), xI = cI.getContext('2d'), xO = cO.getContext('2d');
    const zIn = $('#ie-z'), sl = { br: $('#ie-br'), ct: $('#ie-ct'), sa: $('#ie-sa') };
    $('#ie-t').textContent = opts.title || 'Ajuster la photo';
    $('#ie-step').textContent = opts.step || 'Recadrage et réglages';
    $('#ie-skip').hidden = !opts.skipLabel; if (opts.skipLabel) $('#ie-skip').textContent = opts.skipLabel;

    // Formats proposés ; le format conseillé (celui du site) est mis en avant
    const ratios = [['Originale', 0], ['Carré', 1], ['4:3', 4 / 3], ['16:9', 16 / 9], ['3:4', 3 / 4], ['Libre', -1]];
    if (opts.aspect && !ratios.some(r => Math.abs(r[1] - opts.aspect) < .01)) ratios.splice(1, 0, [opts.aspectLabel || 'Conseillé', opts.aspect]);
    const st = { ratio: opts.aspect || 0, rot: 0, flip: 1, zoom: 1, ox: 0, oy: 0, br: 0, ct: 0, sa: 0, free: null };
    let W = 0, H = 0, dpr = 1, frame = { x: 0, y: 0, w: 0, h: 0 };

    $('#ie-ratios').innerHTML = ratios.map(([l, v], i) => `<button type="button" data-r="${i}" class="${Math.abs(v - st.ratio) < .01 ? 'on' : ''}">${l}${opts.aspect && Math.abs(v - opts.aspect) < .01 ? '<em>conseillé</em>' : ''}</button>`).join('');

    const iw = () => (st.rot % 180 ? img.naturalHeight : img.naturalWidth);
    const ih = () => (st.rot % 180 ? img.naturalWidth : img.naturalHeight);
    function layout() {
      const r = stage.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
      [cI, cO].forEach(c => { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      const pad = W < 500 ? 18 : 36, aw = W - pad * 2, ah = H - pad * 2;
      let a = st.ratio > 0 ? st.ratio : iw() / ih();
      if (st.ratio === -1 && st.free) a = st.free;
      let fw = aw, fh = fw / a; if (fh > ah) { fh = ah; fw = fh * a; }
      frame = { x: (W - fw) / 2, y: (H - fh) / 2, w: fw, h: fh };
      fit(); draw();
    }
    const minScale = () => Math.max(frame.w / iw(), frame.h / ih());
    const scale = () => minScale() * st.zoom;
    function fit() { // l'image couvre toujours tout le cadre
      const s = scale(), mx = Math.max(0, (iw() * s - frame.w) / 2), my = Math.max(0, (ih() * s - frame.h) / 2);
      st.ox = clamp(st.ox, -mx, mx); st.oy = clamp(st.oy, -my, my);
    }
    const cssFilter = () => `brightness(${100 + st.br}%) contrast(${100 + st.ct}%) saturate(${100 + st.sa * 2}%)`;
    function paint(x, w, h, k, ox, oy) { // dessine l'image transformée centrée sur (w/2+ox, h/2+oy)
      const s = scale() * k;
      x.save(); x.translate(w / 2 + ox * k, h / 2 + oy * k); x.rotate(st.rot * Math.PI / 180); x.scale(st.flip, 1);
      x.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s);
      x.restore();
    }
    function draw() {
      xI.setTransform(dpr, 0, 0, dpr, 0, 0); xI.clearRect(0, 0, W, H);
      xI.save(); xI.translate(frame.x + frame.w / 2 - W / 2, frame.y + frame.h / 2 - H / 2); paint(xI, W, H, 1, st.ox, st.oy); xI.restore();
      cI.style.filter = cssFilter();
      xO.setTransform(dpr, 0, 0, dpr, 0, 0); xO.clearRect(0, 0, W, H);
      xO.fillStyle = 'rgba(4,20,33,.62)'; xO.beginPath(); xO.rect(0, 0, W, H); xO.rect(frame.x, frame.y, frame.w, frame.h); xO.fill('evenodd');
      xO.strokeStyle = 'rgba(255,255,255,.35)'; xO.lineWidth = 1; xO.beginPath();
      for (const t of [1 / 3, 2 / 3]) { xO.moveTo(frame.x + frame.w * t, frame.y); xO.lineTo(frame.x + frame.w * t, frame.y + frame.h); xO.moveTo(frame.x, frame.y + frame.h * t); xO.lineTo(frame.x + frame.w, frame.y + frame.h * t); }
      xO.stroke(); xO.strokeStyle = '#fff'; xO.lineWidth = 2; xO.strokeRect(frame.x, frame.y, frame.w, frame.h);
      xO.lineWidth = 4; xO.lineCap = 'square'; const L = 16;
      [[frame.x, frame.y, 1, 1], [frame.x + frame.w, frame.y, -1, 1], [frame.x, frame.y + frame.h, 1, -1], [frame.x + frame.w, frame.y + frame.h, -1, -1]]
        .forEach(([x, y, a, b]) => { xO.beginPath(); xO.moveTo(x, y + L * b); xO.lineTo(x, y); xO.lineTo(x + L * a, y); xO.stroke(); });
      if (st.ratio === -1) { // poignées du format libre
        xO.fillStyle = '#1E98D4';
        handles().forEach(h => { xO.beginPath(); xO.arc(h.x, h.y, 7, 0, 7); xO.fill(); xO.strokeStyle = '#fff'; xO.lineWidth = 2; xO.stroke(); });
      }
      const s = scale(), outW = Math.round(Math.min(frame.w / s, MAX * (frame.w >= frame.h ? 1 : frame.w / frame.h))), outH = Math.round(outW * frame.h / frame.w);
      $('#ie-info').textContent = `${outW} × ${outH} px${outW < 600 ? ' · photo petite, elle pourrait paraître floue' : ''}`;
      $('#ie-info').classList.toggle('warn', outW < 600);
      zIn.value = st.zoom;
    }
    const handles = () => [{ k: 'e', x: frame.x + frame.w, y: frame.y + frame.h / 2 }, { k: 'w', x: frame.x, y: frame.y + frame.h / 2 }, { k: 's', x: frame.x + frame.w / 2, y: frame.y + frame.h }, { k: 'n', x: frame.x + frame.w / 2, y: frame.y }];

    // Glisser (1 doigt / souris), pincer pour zoomer (2 doigts), poignées en format libre
    const pts = new Map(); let pinch = null, drag = null;
    const pos = e => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    stage.onpointerdown = e => {
      stage.setPointerCapture(e.pointerId); const p = pos(e); pts.set(e.pointerId, p);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.zoom }; drag = null; return; }
      const h = st.ratio === -1 && handles().find(h => Math.hypot(h.x - p.x, h.y - p.y) < 22);
      drag = h ? { handle: h.k, f: { ...frame } } : { x: p.x, y: p.y, ox: st.ox, oy: st.oy };
      stage.classList.add('grab');
    };
    stage.onpointermove = e => {
      if (!pts.has(e.pointerId)) return; const p = pos(e); pts.set(e.pointerId, p);
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; st.zoom = clamp(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 1, 4); fit(); draw(); return; }
      if (!drag) return;
      if (drag.handle) { // redimensionne le cadre libre symétriquement autour du centre
        const f = drag.f, cx = f.x + f.w / 2, cy = f.y + f.h / 2, pad = 14;
        let w = f.w, h = f.h;
        if (drag.handle === 'e' || drag.handle === 'w') w = clamp(Math.abs(p.x - cx) * 2, 60, W - pad * 2);
        else h = clamp(Math.abs(p.y - cy) * 2, 60, H - pad * 2);
        frame = { x: cx - w / 2, y: cy - h / 2, w, h }; st.free = w / h; fit(); draw(); return;
      }
      st.ox = drag.ox + p.x - drag.x; st.oy = drag.oy + p.y - drag.y; fit(); draw();
    };
    stage.onpointerup = stage.onpointercancel = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) { drag = null; stage.classList.remove('grab'); } };
    stage.onwheel = e => { e.preventDefault(); st.zoom = clamp(st.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 1, 4); fit(); draw(); };
    zIn.oninput = () => { st.zoom = +zIn.value; fit(); draw(); };
    Object.entries(sl).forEach(([k, el]) => el.oninput = () => { st[k] = +el.value; root.querySelector(`#ie-${k}o`).textContent = (st[k] > 0 ? '+' : '') + st[k]; draw(); });

    function reset() {
      Object.assign(st, { ratio: opts.aspect || 0, rot: 0, flip: 1, zoom: 1, ox: 0, oy: 0, br: 0, ct: 0, sa: 0, free: null });
      Object.entries(sl).forEach(([k, el]) => { el.value = 0; root.querySelector(`#ie-${k}o`).textContent = '0'; });
      root.querySelectorAll('#ie-ratios button').forEach(b => b.classList.toggle('on', Math.abs(ratios[+b.dataset.r][1] - st.ratio) < .01));
      layout();
    }
    function adjustPixels(c) { // repli pour les navigateurs sans filtre de canvas (Safari)
      if (!st.br && !st.ct && !st.sa) return;
      const x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height), a = d.data;
      const B = 1 + st.br / 100, C = 1 + st.ct / 100, S = 1 + st.sa * 2 / 100;
      for (let i = 0; i < a.length; i += 4) {
        let r = a[i] * B, g = a[i + 1] * B, b = a[i + 2] * B;
        r = (r - 128) * C + 128; g = (g - 128) * C + 128; b = (b - 128) * C + 128;
        const l = .2126 * r + .7152 * g + .0722 * b;
        a[i] = l + (r - l) * S; a[i + 1] = l + (g - l) * S; a[i + 2] = l + (b - l) * S;
      }
      x.putImageData(d, 0, 0);
    }
    function exportImage() {
      const s = scale();
      let outW = Math.min(frame.w / s, frame.w >= frame.h ? MAX : MAX * frame.w / frame.h);
      outW = Math.max(1, Math.round(outW)); const outH = Math.max(1, Math.round(outW * frame.h / frame.w)), k = outW / frame.w;
      const c = document.createElement('canvas'); c.width = outW; c.height = outH;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, outW, outH);
      x.imageSmoothingQuality = 'high';
      if (canvasFilter) x.filter = cssFilter();
      paint(x, outW, outH, k, st.ox, st.oy);
      if (!canvasFilter) adjustPixels(c);
      return c.toDataURL('image/jpeg', QUALITY);
    }

    function close(v) {
      root.classList.remove('open'); removeEventListener('resize', layout); removeEventListener('keydown', key, true);
      root.onclick = null; document.documentElement.style.overflow = ''; resolve(v);
    }
    function key(e) { if (e.key === 'Escape') { e.stopPropagation(); close(null); } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') { e.preventDefault(); close({ dataUrl: exportImage() }); } }
    root.onclick = e => {
      const r = e.target.closest('[data-r]');
      if (r) { st.ratio = ratios[+r.dataset.r][1]; st.free = null; st.zoom = 1; st.ox = st.oy = 0; root.querySelectorAll('#ie-ratios button').forEach(b => b.classList.toggle('on', b === r)); layout(); return; }
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k;
      if (k === 'rl' || k === 'rr') { st.rot = (st.rot + (k === 'rr' ? 90 : 270)) % 360; st.ox = st.oy = 0; st.zoom = 1; layout(); }
      else if (k === 'fl') { st.flip *= -1; st.ox = -st.ox; draw(); }
      else if (k === 'zi' || k === 'zo') { st.zoom = clamp(st.zoom + (k === 'zi' ? .2 : -.2), 1, 4); fit(); draw(); }
      else if (k === 'reset') reset();
      else if (k === 'cancel') close(null);
      else if (k === 'skip') close({ skip: true });
      else if (k === 'ok') { b.disabled = true; setTimeout(() => { b.disabled = false; close({ dataUrl: exportImage() }); }, 20); }
    };
    addEventListener('resize', layout); addEventListener('keydown', key, true);
    document.documentElement.style.overflow = 'hidden';
    root.classList.add('open');
    reset();
    requestAnimationFrame(layout);
    setTimeout(() => root.querySelector('.ie-ok').focus(), 60);
  }));
}

window.UNIR_IMG = { edit, loadImage };
})();
