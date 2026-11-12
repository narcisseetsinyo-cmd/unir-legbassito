/* =====================================================================
   Espace admin UNIR Légbassito — tableau de bord sur mesure
   - Connexion : Netlify Identity (admin/login.js)
   - Lecture / enregistrement du contenu : dépôt GitHub via Git Gateway
   - Chaque enregistrement = 1 mise à jour du dépôt → Netlify republie le site
   ===================================================================== */
(() => {
'use strict';

const S = window.UNIR_SCHEMAS;
const API = '/.netlify/git/github';
const BRANCH = 'main';
const ART_DIR = S.article.folder; // content/actualites
let auth = null, me = null;

/* ---------- Outils ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'sans-titre';
const today = () => new Date().toISOString().slice(0, 10);
const frDate = d => { if (!d) return ''; const t = new Date(String(d).slice(0, 10) + 'T12:00:00'); return isNaN(t) ? d : t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); };
const ago = d => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'à l\'instant';
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  if (s < 86400 * 7) return `il y a ${Math.round(s / 86400)} j`;
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
const imgUrl = v => { v = String(v || ''); if (!v) return ''; if (pending[v]) return pending[v].url; if (/^(https?:|data:)/.test(v)) return v; return '/' + v.replace(/^\/+/, ''); };

const P = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  news: '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v5h5M3 15h6M6 12v6"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  flag: '<path d="M4 22V4a1 1 0 0 1 1-1h11l-2 4 2 4H5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  ext: '<path d="M7 17 17 7M8 7h9v9"/>',
  back: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.8-9.8M17 6l3 3M14 9l2 2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'
};
const ic = n => `<svg ${P} aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- Toast et confirmation ---------- */
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), bad ? 6000 : 3200);
}
function confirmBox(title, text, okLabel = 'Confirmer', danger = false) {
  return new Promise(res => {
    const m = $('#modal');
    m.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-labelledby="mdt"><h3 id="mdt">${esc(title)}</h3><p>${esc(text)}</p>
      <div class="acts"><button class="b b-line" data-r="0">Annuler</button><button class="b ${danger ? 'b-bad' : 'b-blue'}" data-r="1">${esc(okLabel)}</button></div></div>`;
    m.classList.add('open');
    const done = v => { m.classList.remove('open'); res(v); };
    $$('[data-r]', m).forEach(b => b.onclick = () => done(b.dataset.r === '1'));
    m.onclick = e => { if (e.target === m) done(false); };
    setTimeout(() => $('[data-r="1"]', m).focus(), 50);
  });
}

/* ---------- Accès au dépôt GitHub (via Git Gateway) ---------- */
class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
async function jwt() {
  const u = auth && auth.currentUser();
  if (!u) throw new ApiError(401, 'Session absente');
  try { return await u.jwt(); } catch (e) { throw new ApiError(401, 'Session expirée'); }
}
async function gh(path, { method = 'GET', body } = {}) {
  let t;
  try { t = await jwt(); } catch (e) { sessionExpired(); throw e; }
  let r;
  try {
    r = await fetch(API + path, { method, cache: 'no-store', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  } catch (e) { throw new ApiError(0, 'Connexion impossible. Vérifiez votre connexion Internet.'); }
  if (r.status === 401) { sessionExpired(); throw new ApiError(401, 'Session expirée'); }
  if (!r.ok) { let m = ''; try { const j = await r.json(); m = j.message || j.msg || ''; } catch (e) {} throw new ApiError(r.status, m || r.statusText); }
  return r.status === 204 ? null : r.json();
}
const encPath = p => p.split('/').map(encodeURIComponent).join('/');
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(String(s).replace(/\s/g, '')), c => c.charCodeAt(0)));
const b64enc = str => { const by = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < by.length; i += 0x8000) bin += String.fromCharCode.apply(null, by.subarray(i, i + 0x8000)); return btoa(bin); };
const toText = data => JSON.stringify(data, null, 2) + '\n';

const cache = {}; // chemin → données
async function readJSON(path, fresh) {
  if (!fresh && cache[path]) return clone(cache[path]);
  const r = await gh(`/contents/${encPath(path)}?ref=${BRANCH}`);
  const data = JSON.parse(b64dec(r.content));
  cache[path] = data;
  return clone(data);
}
async function listArticles(fresh) {
  if (!fresh && cache.__articles) return cache.__articles;
  let files = [];
  try { files = await gh(`/contents/${encPath(ART_DIR)}?ref=${BRANCH}`); } catch (e) { if (e.status !== 404) throw e; }
  const list = await Promise.all(files.filter(f => f.type === 'file' && f.name.endsWith('.json')).map(async f => {
    const path = ART_DIR + '/' + f.name;
    const d = await readJSON(path, fresh);
    return { slug: f.name.replace(/\.json$/, ''), path, ...d };
  }));
  list.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  cache.__articles = list;
  return list;
}
// Enregistre plusieurs fichiers en une seule mise à jour (une seule republication)
async function commit(changes, message, attempt = 1) {
  const br = await gh(`/branches/${BRANCH}`);
  const parent = br.commit.sha, base = br.commit.commit.tree.sha;
  const tree = [];
  for (const c of changes) {
    if (c.del) { tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null }); continue; }
    const blob = await gh('/git/blobs', { method: 'POST', body: { content: c.b64 ?? b64enc(c.text), encoding: 'base64' } });
    tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const t = await gh('/git/trees', { method: 'POST', body: { base_tree: base, tree } });
  const cm = await gh('/git/commits', { method: 'POST', body: { message: `${message}\n\nPar ${me.email} depuis l'espace admin`, tree: t.sha, parents: [parent] } });
  try {
    await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: { sha: cm.sha } });
  } catch (e) {
    if (e.status === 422 && attempt < 3) { await sleep(800); return commit(changes, message, attempt + 1); } // un autre admin vient d'enregistrer
    throw e;
  }
  return cm.sha;
}

/* ---------- Suivi de la publication sur le site ---------- */
let pubTimer = null;
function setPub(state, text) {
  const el = $('#pub');
  el.className = 'pub' + (state === 'busy' ? ' busy' : state === 'slow' ? ' slow' : '');
  el.innerHTML = `<i></i><span>${esc(text)}</span>`;
}
function watchPublish(checks) {
  clearInterval(pubTimer);
  setPub('busy', 'Publication en cours…');
  const t0 = Date.now();
  pubTimer = setInterval(async () => {
    try {
      const ok = await Promise.all(checks.map(async c => {
        const r = await fetch(c.url + '?v=' + Date.now(), { cache: 'no-store' });
        if (c.gone) return r.status === 404;
        return r.ok && (await r.text()) === c.text;
      }));
      if (ok.every(Boolean)) {
        clearInterval(pubTimer);
        const h = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        setPub('ok', `En ligne · ${h}`);
        toast('Vos modifications sont en ligne sur le site.');
        return;
      }
    } catch (e) { /* réseau : on réessaie */ }
    if (Date.now() - t0 > 6 * 60000) { clearInterval(pubTimer); setPub('slow', 'Publication plus longue que prévu'); }
  }, 6000);
}

/* ---------- Photos : réduction avant envoi ---------- */
const pending = {}; // chemin public → { b64, url }
// Recadrage conseillé selon l'endroit où la photo s'affiche sur le site
function aspectFor(path) {
  if (/^apropos\.photo$/.test(path)) return { aspect: 4 / 4.6, aspectLabel: 'Portrait' };
  if (/^membres\.\d+\.photo$/.test(path)) return { aspect: 1 / 1.05, aspectLabel: 'Portrait' };
  if (path === 'image') return { aspect: 16 / 10, aspectLabel: '16:10' };
  return {};
}
function storeImage(dataUrl, name) {
  const ext = /^data:image\/png/.test(dataUrl) ? 'png' : 'jpg';
  const d = new Date(), base = slugify(String(name || 'photo').replace(/\.[^.]+$/, '').replace(/-[a-z0-9]{4}$/, '').replace(/^\d{4}-\d{2}-/, '')).slice(0, 40);
  const pub = `/assets/uploads/${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  pending[pub] = { b64: dataUrl.split(',')[1], url: dataUrl };
  return pub;
}
// Simple réduction, sans retouche (« Garder telle quelle »)
async function autoResize(file) {
  const img = await UNIR_IMG.loadImage(file);
  const k = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (k === 1 && file.size < 450 * 1024 && /^(jpe?g|png|webp)$/.test(ext)) return img.src;
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', .84);
}
// Ouvre l'éditeur (recadrage, rotation, réglages) puis prépare la photo pour l'envoi. null = annulé.
async function prepareImage(file, opts = {}) {
  if (!/^image\//.test(file.type)) throw new Error('Ce fichier n\'est pas une image.');
  const r = await UNIR_IMG.edit(file, opts);
  if (!r) return null;
  return storeImage(r.skip ? await autoResize(file) : r.dataUrl, file.name);
}
// Re-cadrer une photo déjà en place (ou ajoutée mais pas encore enregistrée)
async function reEditImage(value, opts = {}) {
  const r = await UNIR_IMG.edit(imgUrl(value), { title: 'Recadrer la photo', ...opts });
  if (!r || r.skip) return null;
  if (pending[value]) delete pending[value];
  return storeImage(r.dataUrl, String(value).split('/').pop());
}
function pendingFor(text) {
  return Object.keys(pending).filter(p => text.includes(p)).map(p => ({ path: p.replace(/^\//, ''), b64: pending[p].b64 }));
}
function pickFiles(multiple) {
  return new Promise(res => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = !!multiple;
    i.onchange = () => res([...i.files]); i.click();
  });
}

/* =====================================================================
   Moteur de formulaires (à partir des schémas)
   ===================================================================== */
const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
function setP(o, path, v) { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], o); t[last] = v; }
const emptyOf = f => {
  if (f.widget === 'list') return [];
  if (f.widget === 'object') return Object.fromEntries(f.fields.map(x => [x.name, emptyOf(x)]));
  if (f.widget === 'number') return 0;
  if (f.widget === 'boolean') return !!f.default;
  if (f.widget === 'select') return f.default ?? (f.options[0] && f.options[0].value) ?? '';
  if (f.widget === 'datetime') return today();
  return f.default ?? '';
};
const newItem = f => f.fields ? Object.fromEntries(f.fields.map(x => [x.name, emptyOf(x)])) : '';
const summaryOf = (f, it) => {
  if (!f.fields) return String(it);
  if (f.summary) return f.summary.replace(/\{\{(\w+)\}\}/g, (_, k) => it[k] ?? '').trim();
  const k = f.fields.find(x => ['titre', 'nom', 'texte', 'libelle'].includes(x.name)); return k ? String(it[k.name] || '') : '';
};
const imgFieldOf = f => f.fields && f.fields.find(x => x.widget === 'image');

class Form {
  constructor(el, fields, data, opts = {}) {
    this.el = el; this.fields = fields; this.data = data; this.opts = opts;
    this.openItems = new Set(); this.openGroups = new Set(opts.openGroups || []); this.mdPreview = new Set();
    this.onChange = opts.onChange || (() => {});
    el.addEventListener('input', e => this.input(e));
    el.addEventListener('change', e => this.input(e));
    el.addEventListener('click', e => this.click(e));
    el.addEventListener('toggle', e => { const d = e.target; if (d.dataset && d.dataset.g) { d.open ? this.openGroups.add(d.dataset.g) : this.openGroups.delete(d.dataset.g); } }, true);
    this.render();
  }
  render() {
    const y = scrollY;
    this.el.innerHTML = this.top(this.fields, this.data);
    $$('.ta', this.el).forEach(autosize);
    window.scrollTo(0, y);
  }
  // Champs de premier niveau : les champs simples sont regroupés, objets et listes dans des blocs dépliables
  top(fields, data) {
    let html = '', simple = [];
    const flush = () => { if (simple.length) { html += `<div class="card"><div class="card-b fs">${simple.join('')}</div></div>`; simple = []; } };
    for (const f of fields) {
      if (f.widget === 'object' || f.widget === 'list') {
        flush();
        const g = f.name, open = this.openGroups.has(g) || this.opts.allOpen;
        const count = f.widget === 'list' ? `<small>${(data[f.name] || []).length} élément(s)</small>` : '';
        html += `<details class="grp" data-g="${g}"${open ? ' open' : ''}><summary>${esc(f.label)} ${count}<span class="chev">${ic('down')}</span></summary><div class="gb">${f.hint ? `<p class="hint muted" style="margin:0">${esc(f.hint)}</p>` : ''}${f.widget === 'object' ? this.fieldsHtml(f.fields, f.name) : this.list(f, f.name)}</div></details>`;
      } else simple.push(this.field(f, f.name));
    }
    flush();
    return `<div class="stack">${html}</div>`;
  }
  fieldsHtml(fields, base) { return fields.map(f => this.field(f, base ? base + '.' + f.name : f.name)).join(''); }
  field(f, path) {
    const v = getP(this.data, path);
    const id = 'f_' + path.replace(/\./g, '_');
    const req = f.required === false ? '' : ' <span class="muted" title="Obligatoire">*</span>';
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const wrap = (inner, lab = true) => `<div class="f" data-f="${path}">${lab ? `<label for="${id}">${esc(f.label)}${req}</label>` : `<span class="lbl">${esc(f.label)}${req}</span>`}${inner}${hint}</div>`;
    switch (f.widget) {
      case 'text': return wrap(`<textarea class="ta" id="${id}" data-p="${path}">${esc(v)}</textarea>`);
      case 'number': return wrap(`<input class="in" type="number" id="${id}" data-p="${path}" data-t="number" value="${esc(v)}">`);
      case 'boolean': return `<div class="f" data-f="${path}"><label class="sw"><input type="checkbox" data-p="${path}" data-t="bool"${v ? ' checked' : ''}> ${esc(f.label)}</label>${hint}</div>`;
      case 'datetime': return wrap(`<input class="in" type="date" id="${id}" data-p="${path}" value="${esc(String(v || '').slice(0, 10))}">`);
      case 'select': return wrap(`<select class="sel" id="${id}" data-p="${path}">${f.options.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(v) ? ' selected' : ''}>${esc(o.label)}</option>`).join('')}${f.options.some(o => String(o.value) === String(v)) || !v ? '' : `<option selected value="${esc(v)}">${esc(v)}</option>`}</select>`);
      case 'image': {
        const u = imgUrl(v);
        return wrap(`<div class="img"><div class="pv" style="${u ? `background-image:url('${esc(u)}')` : ''}">${u ? '' : ic('image')}</div>
          <div class="acts"><button type="button" class="b b-line b-sm" data-a="img" data-p2="${path}">${ic('upload')} ${v ? 'Changer la photo' : 'Choisir une photo'}</button>${v ? `<button type="button" class="b b-line b-sm" data-a="imgedit" data-p2="${path}">${ic('crop')} Recadrer / ajuster</button>` : ''}${v && f.required === false ? `<button type="button" class="b b-ghost b-sm" data-a="imgdel" data-p2="${path}">Retirer</button>` : ''}${pending[v] ? '<span class="new">Nouvelle photo, envoyée à l\'enregistrement</span>' : ''}</div></div>`, false);
      }
      case 'markdown': {
        const pv = this.mdPreview.has(path);
        return wrap(`<div><div class="md-bar">
            <button type="button" data-a="md" data-m="b" data-p2="${path}" title="Gras">G</button><button type="button" data-a="md" data-m="i" data-p2="${path}" title="Italique"><i>I</i></button>
            <button type="button" data-a="md" data-m="h" data-p2="${path}" title="Intertitre">Titre</button><button type="button" data-a="md" data-m="ul" data-p2="${path}" title="Liste">• Liste</button>
            <button type="button" data-a="md" data-m="a" data-p2="${path}" title="Lien">Lien</button><button type="button" data-a="md" data-m="img" data-p2="${path}" title="Insérer une photo">Photo</button>
            <span class="sp"></span><button type="button" data-a="mdpv" data-p2="${path}">${pv ? 'Modifier' : 'Aperçu'}</button></div>
          ${pv ? `<div class="md-pv">${window.marked ? window.marked.parse(String(v || '')).replace(/src="\/(?!\/)/g, 'src="/') : esc(v)}</div>` : `<textarea class="ta" id="${id}" data-p="${path}">${esc(v)}</textarea>`}</div>`);
      }
      case 'list': return wrap(this.list(f, path), false);
      case 'object': return `<div class="grp" style="padding:16px"><b>${esc(f.label)}</b><div class="fs" style="margin-top:12px">${this.fieldsHtml(f.fields, path)}</div></div>`;
      default: return wrap(`<input class="in" id="${id}" data-p="${path}" value="${esc(v)}">`);
    }
  }
  list(f, path) {
    const arr = getP(this.data, path) || [];
    const sing = f.label_singular || (f.field ? f.field.label.toLowerCase() : 'élément');
    if (f.field && f.field.widget === 'string') { // liste de mots courts
      return `<div class="chips">${arr.map((w, i) => `<span class="chip">${esc(w)}<button type="button" data-a="chipdel" data-p2="${path}" data-i="${i}" aria-label="Retirer ${esc(w)}">${ic('x')}</button></span>`).join('') || '<span class="muted">Aucun mot.</span>'}</div>
        <div class="chip-add"><input class="in" placeholder="Ajouter un mot…" data-chip="${path}"><button type="button" class="b b-line b-sm" data-a="chipadd" data-p2="${path}">${ic('plus')} Ajouter</button></div>`;
    }
    const img = imgFieldOf(f);
    const items = arr.map((it, i) => {
      const p = `${path}.${i}`, open = this.openItems.has(p);
      const sum = summaryOf(f, it) || `(${sing} sans titre)`;
      let th = '';
      if (img) { const u = imgUrl(it[img.name]); th = u ? `<img class="th" src="${esc(u)}" alt="">` : `<span class="th ini">${esc((it.nom || it.titre || '?').replace(/[\[\]]/g, '').trim().slice(0, 1).toUpperCase() || '?')}</span>`; }
      const body = f.fields ? this.fieldsHtml(f.fields, p) : this.field({ ...f.field, label: f.field.label }, p);
      return `<div class="it${open ? ' open' : ''}" data-it="${p}"><div class="it-h">${th}<div class="sm" data-a="tog" data-p2="${p}"><b>${esc(sum.length > 120 ? sum.slice(0, 120) + '…' : sum)}</b><small>${open ? 'Cliquez pour replier' : 'Cliquez pour modifier'}</small></div>
        <div class="tools"><button type="button" class="ib" data-a="up" data-p2="${path}" data-i="${i}" aria-label="Monter"${i ? '' : ' disabled'}>${ic('up')}</button><button type="button" class="ib" data-a="dn" data-p2="${path}" data-i="${i}" aria-label="Descendre"${i < arr.length - 1 ? '' : ' disabled'}>${ic('down')}</button><button type="button" class="ib bad" data-a="del" data-p2="${path}" data-i="${i}" aria-label="Supprimer">${ic('trash')}</button></div></div>
        <div class="it-b fs">${body}</div></div>`;
    }).join('');
    return `<div class="lst">${items || `<p class="muted" style="margin:0">Aucun ${esc(sing)} pour le moment.</p>`}</div><button type="button" class="b b-line b-sm add" data-a="add" data-p2="${path}">${ic('plus')} Ajouter ${/^[aeiouéh]/i.test(sing) ? 'un·e' : 'un·e'} ${esc(sing)}</button>`;
  }
  schemaAt(path) { // retrouve le champ de schéma pour un chemin « a.2.b »
    const ks = path.split('.'); let fields = this.fields, f = null;
    for (const k of ks) {
      if (/^\d+$/.test(k)) { if (f && f.field) { f = f.field; fields = null; } else fields = f.fields; continue; }
      f = (fields || []).find(x => x.name === k); fields = f && f.fields;
    }
    return f;
  }
  input(e) {
    const t = e.target, p = t.dataset.p; if (!p) return;
    let v = t.value;
    if (t.dataset.t === 'number') v = v === '' ? 0 : Number(v);
    if (t.dataset.t === 'bool') v = t.checked;
    setP(this.data, p, v);
    if (t.classList.contains('ta')) autosize(t);
    const fe = t.closest('.f'); if (fe) fe.classList.remove('err');
    // met à jour le résumé de l'élément de liste sans tout redessiner
    const it = t.closest('.it'); if (it) { const lp = it.dataset.it.replace(/\.\d+$/, ''); const lf = this.schemaAt(lp); const b = $('.sm b', it); if (lf && b) b.textContent = summaryOf(lf, getP(this.data, it.dataset.it)) || '(sans titre)'; }
    this.onChange();
  }
  async click(e) {
    const b = e.target.closest('[data-a]'); if (!b || !this.el.contains(b)) return;
    const a = b.dataset.a, p = b.dataset.p2, i = +b.dataset.i;
    const arr = p && getP(this.data, p);
    if (a === 'tog') { this.openItems.has(p) ? this.openItems.delete(p) : this.openItems.add(p); this.render(); return; }
    if (a === 'add') {
      const f = this.schemaAt(p); arr.push(newItem(f)); this.openItems.add(`${p}.${arr.length - 1}`); this.render(); this.onChange();
      const last = $$(`[data-it="${p}.${arr.length - 1}"] [data-p]`, this.el)[0]; last && last.focus(); return;
    }
    if (a === 'del') {
      const f = this.schemaAt(p); const sum = summaryOf(f, arr[i]);
      if (!(await confirmBox('Supprimer cet élément ?', sum ? `« ${sum.slice(0, 80)} » sera retiré. La suppression sera effective après l'enregistrement.` : 'L\'élément sera retiré après l\'enregistrement.', 'Supprimer', true))) return;
      arr.splice(i, 1); this.shiftOpen(p, i, null); this.render(); this.onChange(); return;
    }
    if (a === 'up' || a === 'dn') {
      const j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]]; this.shiftOpen(p, i, j); this.render(); this.onChange(); return;
    }
    if (a === 'chipdel') { arr.splice(i, 1); this.render(); this.onChange(); return; }
    if (a === 'chipadd') { const inp = $(`[data-chip="${p}"]`, this.el); const w = inp.value.trim(); if (!w) return inp.focus(); arr.push(w); this.render(); this.onChange(); $(`[data-chip="${p}"]`, this.el).focus(); return; }
    if (a === 'img') {
      const [file] = await pickFiles(false); if (!file) return;
      try { const u = await prepareImage(file, aspectFor(p)); if (u) { setP(this.data, p, u); this.render(); this.onChange(); } } catch (err) { toast(err.message, true); }
      return;
    }
    if (a === 'imgedit') {
      try { const u = await reEditImage(getP(this.data, p), aspectFor(p)); if (u) { setP(this.data, p, u); this.render(); this.onChange(); toast('Photo recadrée. Enregistrez pour la publier.'); } }
      catch (err) { toast('Cette photo n\'a pas pu être ouverte : ' + err.message, true); }
      return;
    }
    if (a === 'imgdel') { setP(this.data, p, ''); this.render(); this.onChange(); return; }
    if (a === 'mdpv') { this.mdPreview.has(p) ? this.mdPreview.delete(p) : this.mdPreview.add(p); this.render(); return; }
    if (a === 'md') return this.md(p, b.dataset.m);
  }
  async md(p, m) {
    const ta = $(`textarea[data-p="${p}"]`, this.el); if (!ta) return;
    const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, sel = v.slice(s, en);
    let ins = sel, cur = 0;
    if (m === 'b') { ins = `**${sel || 'texte en gras'}**`; }
    if (m === 'i') { ins = `*${sel || 'texte en italique'}*`; }
    if (m === 'h') { ins = `\n## ${sel || 'Intertitre'}\n`; }
    if (m === 'ul') { ins = '\n' + (sel || 'premier point\ndeuxième point').split('\n').map(l => '- ' + l).join('\n') + '\n'; }
    if (m === 'a') { ins = `[${sel || 'texte du lien'}](https://)`; cur = -1; }
    if (m === 'img') {
      const [file] = await pickFiles(false); if (!file) return;
      try { const u = await prepareImage(file, { title: 'Photo dans le texte' }); if (!u) return; ins = `\n![${sel || 'photo'}](${u})\n`; } catch (err) { return toast(err.message, true); }
    }
    ta.value = v.slice(0, s) + ins + v.slice(en);
    setP(this.data, p, ta.value); autosize(ta); this.onChange();
    ta.focus(); const pos = s + ins.length + cur; ta.setSelectionRange(pos, pos);
  }
  shiftOpen(path, i, j) { // garde les éléments dépliés au bon endroit après suppression / déplacement
    const n = new Set();
    this.openItems.forEach(p => {
      if (!p.startsWith(path + '.')) return n.add(p);
      const rest = p.slice(path.length + 1), k = +rest.split('.')[0], tail = rest.slice(String(k).length);
      if (j === null) { if (k === i) return; n.add(`${path}.${k > i ? k - 1 : k}${tail}`); }
      else n.add(`${path}.${k === i ? j : k === j ? i : k}${tail}`);
    });
    this.openItems = n;
  }
  validate() {
    let first = null;
    const walk = (fields, base) => fields.forEach(f => {
      const path = base ? base + '.' + f.name : f.name, v = getP(this.data, path);
      if (f.widget === 'object') return walk(f.fields, path);
      if (f.widget === 'list') { if (f.fields) (v || []).forEach((_, i) => walk(f.fields, `${path}.${i}`)); return; }
      if (f.required === false || f.widget === 'boolean' || f.widget === 'number') return;
      if (v === undefined || v === null || String(v).trim() === '') {
        const m = path.match(/^(.*)\.(\d+)\./); if (m) this.openItems.add(`${m[1]}.${m[2]}`);
        const top = path.split('.')[0]; this.openGroups.add(top);
        first = first || path;
      }
    });
    walk(this.fields, '');
    if (first) {
      this.render();
      const fe = $(`[data-f="${first}"]`, this.el);
      if (fe) { fe.classList.add('err'); fe.insertAdjacentHTML('beforeend', '<span class="emsg">Ce champ est obligatoire.</span>'); fe.scrollIntoView({ block: 'center', behavior: 'smooth' }); const i = $('[data-p]', fe); i && i.focus({ preventScroll: true }); }
      return false;
    }
    return true;
  }
}
function autosize(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 700) + 'px'; }

/* =====================================================================
   Navigation et structure
   ===================================================================== */
const NAV = [
  ['Général', [['tableau', 'Tableau de bord', 'dash'], ['actualites', 'Actualités', 'news']]],
  ['Contenu du site', [['accueil', 'Page d\'accueil', 'home'], ['bureau', 'Bureau', 'users'], ['actions', 'Actions', 'flag'], ['galerie', 'Galerie photos', 'image'], ['pages', 'Textes des pages', 'layout'], ['coordonnees', 'Coordonnées', 'phone']]],
  ['Gestion', [['admins', 'Administrateurs', 'shield'], ['compte', 'Mon compte', 'user']]]
];
const FILE_ROUTES = {
  accueil: { key: 'accueil', title: 'Page d\'accueil', sub: 'Page 1 · bandeau, à propos, chiffres clés, valeurs, citations', open: ['hero'] },
  bureau: { key: 'bureau', title: 'Membres du bureau', sub: 'Page 2 · photos, noms et fonctions', open: ['membres'] },
  actions: { key: 'actions', title: 'Actions de la section', sub: 'Page 2 · la frise chronologique', open: ['liste'] },
  galerie: { key: 'galerie', title: 'Galerie photos', sub: 'Page 2 · photos et légendes', open: ['photos'] },
  coordonnees: { key: 'parametres', title: 'Coordonnées et réseaux', sub: 'Numéro WhatsApp du formulaire, contacts, réseaux sociaux' }
};
let editor = null;    // { form, path, saved, label, extra }
const isDirty = () => !!(editor && editor.dirty && editor.dirty());

function shell() {
  const name = (me.user_metadata && me.user_metadata.full_name) || me.email;
  $('#app').innerHTML = `
  <div class="adm" id="adm">
    <aside class="side" aria-label="Menu de l'administration">
      <a class="brand" href="#/tableau"><span class="mk"><img src="../assets/logo-blanc.png" alt=""></span><span><b>UNIR</b><small>Administration</small></span></a>
      <div class="me"><span class="av">${esc(name.slice(0, 1).toUpperCase())}</span><div><b title="${esc(me.email)}">${esc(name)}</b><span>Administrateur</span></div></div>
      ${NAV.map(([g, items]) => `<nav class="nav-g"><small>${g}</small>${items.map(([k, l, i]) => `<a href="#/${k}" data-nav="${k}">${ic(i)}<span>${esc(l)}</span><span class="cnt" data-cnt="${k}" hidden></span></a>`).join('')}</nav>`).join('')}
      <div class="nav-g bottom">
        <a href="/" target="_blank" rel="noopener">${ic('eye')}<span>Voir le site</span></a>
        <button type="button" id="logout">${ic('out')}<span>Déconnexion</span></button>
      </div>
    </aside>
    <div class="side-backdrop" id="backdrop"></div>
    <div class="main">
      <header class="top">
        <button class="burger" id="burger" aria-label="Ouvrir le menu">${ic('menu')}</button>
        <div class="ttl"><small id="crumb">Administration</small><h1 id="ttl">Tableau de bord</h1></div>
        <div class="r"><span class="pub" id="pub"><i></i><span>Site à jour</span></span><a class="b b-line b-sm" href="/" target="_blank" rel="noopener">${ic('ext')}<span>Voir le site</span></a></div>
      </header>
      <main class="content" id="view"></main>
    </div>
    <div class="savebar" id="savebar"></div>
  </div>
  <div class="modal" id="modal"></div>
  <div class="toast" id="toast" role="status"></div>`;
  $('#logout').onclick = logout;
  $('#burger').onclick = () => $('#adm').classList.toggle('menu');
  $('#backdrop').onclick = () => $('#adm').classList.remove('menu');
}
function setTitle(t, crumb) { $('#ttl').textContent = t; $('#crumb').textContent = crumb || 'Administration'; document.title = t + ' · Admin UNIR Légbassito'; }
function savebar(html) { const s = $('#savebar'); if (html == null) { s.classList.remove('show'); return; } s.innerHTML = html; s.classList.add('show'); }

let lastHash = '';
async function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'tableau';
  if (isDirty() && h !== lastHash) {
    const go = await confirmBox('Quitter sans enregistrer ?', 'Vous avez des modifications non enregistrées sur cette page. Elles seront perdues.', 'Quitter sans enregistrer', true);
    if (!go) { history.replaceState(null, '', '#/' + lastHash); return; }
  }
  lastHash = h; editor = null; savebar(null);
  $('#adm').classList.remove('menu');
  const [r, arg] = h.split('/');
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === r));
  const v = $('#view');
  v.innerHTML = '<div class="loading"><span class="spin dark"></span>Chargement…</div>';
  window.scrollTo(0, 0);
  try {
    if (r === 'tableau') await viewDash(v);
    else if (r === 'actualites') arg ? await viewArticle(v, decodeURIComponent(arg)) : await viewArticles(v);
    else if (FILE_ROUTES[r]) await viewFile(v, r);
    else if (r === 'pages') await viewPages(v, arg || 'section');
    else if (r === 'admins') await viewAdmins(v);
    else if (r === 'compte') viewAccount(v);
    else { location.hash = '#/tableau'; }
  } catch (e) {
    if (e.status === 401) return;
    console.error(e);
    v.innerHTML = `<div class="err-box"><b>Le contenu n'a pas pu être chargé.</b><br>${esc(e.message || '')}${e.status === 404 ? '' : ' Vérifiez votre connexion puis rechargez la page.'}</div>`;
  }
}

/* ---------- Compteurs du menu ---------- */
async function refreshCounts() {
  try {
    const [site, bureau, actions, arts] = await Promise.all([readJSON('content/site.json'), readJSON('content/bureau.json'), readJSON('content/actions.json'), listArticles()]);
    const set = (k, n, warn) => { const el = $(`[data-cnt="${k}"]`); if (!el) return; el.hidden = !n; el.textContent = n; el.classList.toggle('w', !!warn); };
    set('actualites', arts.filter(a => a.brouillon).length);
    set('bureau', (bureau.membres || []).filter(m => !m.nom || m.nom.trim().startsWith('[')).length, true);
    set('actions', (actions.liste || []).filter(a => /\[date\]/i.test(a.date || '')).length, true);
    set('coordonnees', todoSite(site).length, true);
  } catch (e) { /* compteurs facultatifs */ }
}
function todoSite(s) {
  const t = [];
  if (!/^\d{8,15}$/.test(String(s.whatsapp || ''))) t.push('Renseigner le numéro WhatsApp qui reçoit les demandes d\'adhésion');
  if (/x{2}/i.test(s.telephone || '')) t.push('Renseigner le numéro de téléphone affiché');
  if (/exemple/i.test(s.email || '')) t.push('Renseigner l\'adresse e-mail de contact');
  return t;
}

/* =====================================================================
   Vues
   ===================================================================== */
async function viewDash(v) {
  setTitle('Tableau de bord');
  const files = ['site', 'bureau', 'actions', 'galerie'].map(k => `content/${k}.json`);
  const [site, bureau, actions, galerie, arts] = await Promise.all([...files.map(f => readJSON(f)), listArticles()]);
  const pub = arts.filter(a => !a.brouillon), drafts = arts.filter(a => a.brouillon);
  const ph = (bureau.membres || []).filter(m => !m.nom || m.nom.trim().startsWith('['));
  const undated = (actions.liste || []).filter(a => /\[date\]/i.test(a.date || ''));
  const todo = [
    ...todoSite(site).map(t => [t, 'coordonnees']),
    ...(ph.length ? [[`Compléter ${ph.length} membre(s) du bureau (nom, photo)`, 'bureau']] : []),
    ...(undated.length ? [[`Dater ${undated.length} action(s) de la frise`, 'actions']] : []),
    ...(drafts.length ? [[`${drafts.length} actualité(s) en brouillon, pas encore publiée(s)`, 'actualites']] : []),
    ...(!site.facebook && !site.tiktok && !site.youtube ? [['Ajouter les liens des réseaux sociaux (facultatif)', 'coordonnees']] : [])
  ];
  const name = ((me.user_metadata && me.user_metadata.full_name) || me.email.split('@')[0]);
  const h = new Date().getHours();
  v.innerHTML = `<div class="stack">
    <section class="hello">
      <div><h2>${h < 18 ? 'Bonjour' : 'Bonsoir'}, ${esc(name)}</h2><p>${esc(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))} · Section ${esc(site.section || 'Légbassito')}</p></div>
      <div class="acts"><a class="b b-blue" href="#/actualites/nouvelle">${ic('plus')} Nouvelle actualité</a><a class="b b-line" href="#/galerie">${ic('upload')} Ajouter des photos</a></div>
    </section>
    <div class="stats">
      ${[['news', pub.length, 'Actualités publiées', 'actualites'], ['edit', drafts.length, 'Brouillons', 'actualites'], ['image', (galerie.photos || []).length, 'Photos dans la galerie', 'galerie'], ['users', (bureau.membres || []).length, 'Membres du bureau', 'bureau'], ['flag', (actions.liste || []).length, 'Actions dans la frise', 'actions']]
        .map(([i, n, l, r]) => `<a class="card stat" href="#/${r}"><span class="ic">${ic(i)}</span><b>${n}</b><span>${l}</span></a>`).join('')}
    </div>
    <div class="grid2">
      <section class="card"><div class="card-h"><div><h2>À compléter</h2><p>Ce qui reste à renseigner sur le site</p></div></div><div class="card-b">
        <ul class="todo">${todo.length ? todo.map(([t, r]) => `<li><span class="dot">${ic('alert')}</span><span>${esc(t)}</span><a class="b b-ghost b-sm" href="#/${r}">Compléter</a></li>`).join('') : `<li><span class="dot ok">${ic('check')}</span><span>Tout est complet. Bravo !</span></li>`}</ul>
      </div></section>
      <section class="card"><div class="card-h"><div><h2>Accès rapides</h2><p>Les tâches les plus courantes</p></div></div><div class="card-b quick">
        ${[['news', 'Publier une actualité', 'Annonce, compte rendu…', 'actualites/nouvelle'], ['image', 'Ajouter des photos', 'Galerie de la section', 'galerie'], ['users', 'Mettre à jour le bureau', 'Noms, fonctions, photos', 'bureau'], ['home', 'Modifier l\'accueil', 'Textes et chiffres clés', 'accueil']]
          .map(([i, t, s, r]) => `<a href="#/${r}"><span class="ic">${ic(i)}</span><span><b>${t}</b><small>${s}</small></span></a>`).join('')}
      </div></section>
    </div>
    <section class="card" id="histCard"><div class="card-h"><div><h2>Dernières modifications</h2><p>Historique des mises à jour du site</p></div></div><div class="card-b"><div class="loading" style="padding:10px 0"><span class="spin dark"></span>Chargement…</div></div></section>
  </div>`;
  refreshCounts();
  try {
    const cs = await gh(`/commits?sha=${BRANCH}&per_page=8`);
    $('#histCard .card-b').innerHTML = `<ul class="hist">${cs.map(c => {
      const [t, ...rest] = c.commit.message.split('\n'); const by = (rest.join(' ').match(/Par (\S+@\S+)/) || [])[1];
      return `<li><i></i><div><b>${esc(t)}</b><small>${esc(ago(c.commit.author.date))}${by ? ' · ' + esc(by) : ''}</small></div></li>`;
    }).join('')}</ul>`;
  } catch (e) { if (e.status !== 401) $('#histCard').remove(); }
}

/* --- Rubriques « fichier unique » : accueil, bureau, actions, galerie, coordonnées --- */
async function viewFile(v, r) {
  const R = FILE_ROUTES[r], sch = S.files[R.key];
  setTitle(R.title, R.sub);
  const data = await readJSON(sch.file);
  v.innerHTML = `${r === 'galerie' ? `<div class="drop" id="drop" tabindex="0" role="button" aria-label="Ajouter des photos">${ic('upload')}<b>Ajouter des photos</b><span>Glissez-déposez vos photos ici, ou cliquez pour les choisir. Elles sont réduites automatiquement.</span></div><div style="height:22px"></div>` : ''}<div id="form"></div>`;
  mountEditor($('#form'), sch, data, R.title, { openGroups: R.open });
  if (r === 'galerie') {
    const d = $('#drop');
    const add = async files => {
      let n = 0;
      const imgs = files.filter(f => /^image\//.test(f.type));
      if (imgs.length < files.length) toast(`${files.length - imgs.length} fichier(s) ignoré(s) : ce ne sont pas des images.`, true);
      for (const [k, f] of imgs.entries()) {
        try {
          const img = await prepareImage(f, imgs.length > 1 ? { step: `Photo ${k + 1} sur ${imgs.length} · ${f.name}`, skipLabel: 'Garder telle quelle' } : { step: f.name });
          if (!img) continue;
          editor.form.data.photos.unshift({ image: img, titre: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase()), categorie: 'Rencontres', format: 'normal', cadrage: 'centre', description: '' });
          n++;
        } catch (e) { toast(`${f.name} : ${e.message}`, true); }
      }
      if (n) { editor.form.openGroups.add('photos'); editor.form.render(); editor.update(); toast(`${n} photo(s) ajoutée(s). Vérifiez les légendes puis enregistrez.`); }
    };
    d.onclick = async () => add(await pickFiles(true));
    d.onkeydown = async e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(await pickFiles(true)); } };
    d.ondragover = e => { e.preventDefault(); d.classList.add('over'); };
    d.ondragleave = () => d.classList.remove('over');
    d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); add([...e.dataTransfer.files]); };
  }
}

/* --- Textes des pages 2 et 3 --- */
async function viewPages(v, which) {
  const sch = S.files[which === 'rejoindre' ? 'rejoindre' : 'section'];
  setTitle('Textes des pages', which === 'rejoindre' ? 'Page 3 · Nous rejoindre' : 'Page 2 · La section');
  const data = await readJSON(sch.file);
  v.innerHTML = `<div class="filters"><div class="seg"><a href="#/pages/section"><button type="button" class="${which !== 'rejoindre' ? 'on' : ''}">Page 2 · La section</button></a><a href="#/pages/rejoindre"><button type="button" class="${which === 'rejoindre' ? 'on' : ''}">Page 3 · Nous rejoindre</button></a></div></div>
    <p class="lead">Titres et textes d'introduction. Le contenu du bureau, des actions et de la galerie se modifie dans leurs rubriques.</p><div id="form"></div>`;
  mountEditor($('#form'), sch, data, sch.label, { openGroups: ['entete'] });
}

// Éditeur générique avec barre d'enregistrement
function mountEditor(el, sch, data, label, opts = {}) {
  let saved = toText(data);
  const form = new Form(el, sch.fields, data, { openGroups: opts.openGroups, onChange: () => update() });
  const dirty = () => toText(form.data) !== saved;
  function update() {
    if (!dirty()) return savebar(null);
    if (!$('#savebar.show')) savebar(`<div class="msg"><i></i>Modifications non enregistrées</div><div class="r"><button class="b b-line" id="sv-cancel">Annuler</button><button class="b b-blue" id="sv-save">${ic('check')} Enregistrer et publier</button></div>`);
    $('#sv-cancel').onclick = async () => { if (await confirmBox('Annuler les modifications ?', 'Le formulaire reviendra à la dernière version enregistrée.', 'Annuler les modifications', true)) { form.data = JSON.parse(saved); form.render(); savebar(null); } };
    $('#sv-save').onclick = save;
  }
  async function save() {
    if (!form.validate()) return toast('Certains champs obligatoires sont vides.', true);
    const btn = $('#sv-save'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Enregistrement…';
    const text = toText(form.data);
    try {
      await commit([{ path: sch.file, text }, ...pendingFor(text)], `Mise à jour : ${label}`);
      saved = text; cache[sch.file] = JSON.parse(text);
      pendingFor(text).forEach(p => delete pending['/' + p.path]);
      savebar(null); form.render();
      toast('Enregistré. Le site se met à jour (1 à 2 minutes).');
      watchPublish([{ url: '/' + sch.file, text }]);
      refreshCounts();
    } catch (e) {
      if (e.status === 401) return;
      btn.disabled = false; btn.innerHTML = `${ic('check')} Enregistrer et publier`;
      toast('L\'enregistrement a échoué : ' + (e.message || 'erreur inconnue') + '. Réessayez.', true);
    }
  }
  editor = { form, dirty, update };
  return editor;
}

/* --- Actualités --- */
let artFilter = 'all', artSearch = '';
async function viewArticles(v) {
  setTitle('Actualités', 'Page 3 · publications de la section');
  const arts = await listArticles();
  const render = () => {
    const q = artSearch.toLowerCase();
    const list = arts.filter(a => (artFilter === 'all' || (artFilter === 'pub' ? !a.brouillon : a.brouillon)) && (!q || (a.titre + ' ' + a.resume).toLowerCase().includes(q)));
    $('#arts').innerHTML = list.length ? list.map(a => `<a class="art" href="#/actualites/${encodeURIComponent(a.slug)}">
        <span class="pic" style="${a.image ? `background-image:url('${esc(imgUrl(a.image))}')` : ''}"></span>
        <span class="tx"><b>${esc(a.titre)}</b><small>${esc(a.categorie || '')}${a.categorie ? ' · ' : ''}${esc(frDate(a.date))}</small></span>
        ${a.brouillon ? '<span class="pill dr">Brouillon</span>' : '<span class="pill ok">Publiée</span>'}<span class="ib">${ic('edit')}</span></a>`).join('')
      : `<div class="card empty">${arts.length ? 'Aucune actualité ne correspond.' : 'Aucune actualité pour le moment.'}</div>`;
  };
  v.innerHTML = `<div class="filters">
      <div class="seg" id="seg">${[['all', 'Toutes'], ['pub', 'Publiées'], ['draft', 'Brouillons']].map(([k, l]) => `<button type="button" data-k="${k}" class="${artFilter === k ? 'on' : ''}">${l} (${k === 'all' ? arts.length : arts.filter(a => k === 'pub' ? !a.brouillon : a.brouillon).length})</button>`).join('')}</div>
      <input class="in" type="search" id="q" placeholder="Rechercher…" value="${esc(artSearch)}" aria-label="Rechercher une actualité">
      <a class="b b-blue" href="#/actualites/nouvelle" style="margin-left:auto">${ic('plus')} Nouvelle actualité</a>
    </div><div class="arts" id="arts"></div>`;
  $$('#seg button').forEach(b => b.onclick = () => { artFilter = b.dataset.k; $$('#seg button').forEach(x => x.classList.toggle('on', x === b)); render(); });
  $('#q').oninput = e => { artSearch = e.target.value; render(); };
  render();
}

async function viewArticle(v, slug) {
  const isNew = slug === 'nouvelle';
  const arts = await listArticles();
  let data, path;
  if (isNew) { data = { titre: '', date: today(), categorie: 'Annonce', image: '', resume: '', corps: '', brouillon: true }; }
  else {
    const a = arts.find(x => x.slug === slug);
    if (!a) { v.innerHTML = `<div class="err-box">Cette actualité n'existe plus. <a href="#/actualites"><u>Retour à la liste</u></a></div>`; setTitle('Actualité introuvable'); return; }
    path = a.path; data = await readJSON(path);
  }
  setTitle(isNew ? 'Nouvelle actualité' : (data.titre || 'Actualité'), 'Actualités');
  const fields = S.article.fields.filter(f => f.name !== 'brouillon');
  v.innerHTML = `<p style="margin:0 0 16px"><a class="b b-ghost b-sm" href="#/actualites">${ic('back')} Toutes les actualités</a></p><div id="form"></div>`;
  let saved = toText(data);
  const form = new Form($('#form'), fields, data, { allOpen: true, onChange: () => bar() });
  const dirty = () => toText(form.data) !== saved;
  function bar() {
    const pubd = !form.data.brouillon;
    savebar(`<div class="msg">${pubd ? '<span class="pill ok">Publiée</span>' : '<span class="pill dr">Brouillon</span>'}${dirty() ? '<i></i>Modifications non enregistrées' : ''}</div>
      <div class="r">${!isNew ? `<button class="b b-bad" id="a-del">${ic('trash')} Supprimer</button>` : ''}
      ${pubd ? `<button class="b b-line" id="a-unpub">Repasser en brouillon</button><button class="b b-blue" id="a-save"${dirty() ? '' : ' disabled'}>${ic('check')} Enregistrer</button>`
             : `<button class="b b-line" id="a-draft"${dirty() || isNew ? '' : ' disabled'}>Enregistrer le brouillon</button><button class="b b-blue" id="a-pub">${ic('check')} Publier</button>`}</div>`);
    const on = (id, fn) => { const b = $('#' + id); if (b) b.onclick = fn; };
    on('a-save', () => save(false)); on('a-draft', () => save(true)); on('a-pub', () => save(false)); on('a-unpub', () => save(true));
    on('a-del', del);
  }
  async function save(draft) {
    if (!form.validate()) return toast('Certains champs obligatoires sont vides.', true);
    const d = { ...form.data, brouillon: !!draft };
    let p = path, slugNow = slug;
    if (isNew) {
      const used = new Set(arts.map(a => a.slug)); let s = slugify(d.titre), n = 2; const b0 = s;
      while (used.has(s)) s = `${b0}-${n++}`;
      slugNow = s; p = `${ART_DIR}/${s}.json`;
    }
    $$('#savebar .b').forEach(b => b.disabled = true);
    const text = toText(d);
    try {
      await commit([{ path: p, text }, ...pendingFor(text)], `${isNew ? 'Nouvelle actualité' : 'Actualité mise à jour'} : ${d.titre}${draft ? ' (brouillon)' : ''}`);
      pendingFor(text).forEach(x => delete pending['/' + x.path]);
      cache[p] = JSON.parse(text); delete cache.__articles;
      saved = text;
      toast(draft ? 'Brouillon enregistré. Il n\'apparaît pas sur le site.' : 'Actualité publiée. Elle sera en ligne dans 1 à 2 minutes.');
      watchPublish([{ url: '/' + p, text }]);
      refreshCounts();
      if (isNew) { editor = null; location.hash = '#/actualites/' + encodeURIComponent(slugNow); return; }
      form.data = JSON.parse(text); form.render(); bar();
    } catch (e) {
      if (e.status === 401) return;
      bar(); toast('L\'enregistrement a échoué : ' + (e.message || 'erreur inconnue') + '. Réessayez.', true);
    }
  }
  async function del() {
    if (!(await confirmBox('Supprimer cette actualité ?', `« ${form.data.titre} » sera retirée du site. Cette action est définitive.`, 'Supprimer', true))) return;
    try {
      await commit([{ path, del: true }], `Actualité supprimée : ${form.data.titre}`);
      delete cache[path]; delete cache.__articles;
      editor = null; savebar(null);
      toast('Actualité supprimée.');
      watchPublish([{ url: '/' + path, gone: true }]);
      refreshCounts();
      location.hash = '#/actualites';
    } catch (e) { if (e.status !== 401) toast('La suppression a échoué : ' + e.message, true); }
  }
  editor = { form, dirty, update: bar };
  bar();
}

/* --- Administrateurs (fonction Netlify « admins ») --- */
async function adminsApi(method = 'GET', body) {
  const t = await jwt();
  const r = await fetch('/.netlify/functions/admins', { method, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw new ApiError(r.status, j.error || r.statusText);
  return j;
}
async function viewAdmins(v) {
  setTitle('Administrateurs', 'Personnes qui peuvent modifier le site');
  v.innerHTML = `<div class="stack">
    <section class="card"><div class="card-h"><div><h2>Inviter un administrateur</h2><p>La personne reçoit un e-mail pour choisir son mot de passe.</p></div></div>
      <div class="card-b"><form id="inv" class="chip-add" style="flex-wrap:wrap"><input class="in" type="email" id="invEmail" placeholder="adresse@exemple.com" required style="max-width:360px" aria-label="Adresse e-mail à inviter"><button class="b b-blue" type="submit">${ic('mail')} Envoyer l'invitation</button></form>
      <p class="hint muted" style="margin:12px 0 0">L'e-mail d'invitation est envoyé par Netlify (en anglais). Le lien qu'il contient ouvre l'écran « Bienvenue ! » de l'espace admin.</p></div></section>
    <section class="card"><div class="card-h"><div><h2>Comptes</h2><p id="admCount"></p></div></div><div class="card-b tbl-wrap" id="admList"><div class="loading" style="padding:10px 0"><span class="spin dark"></span>Chargement…</div></div></section>
  </div>`;
  const load = async () => {
    try {
      const { users } = await adminsApi();
      $('#admCount').textContent = `${users.length} compte(s)`;
      $('#admList').innerHTML = `<table class="tbl"><thead><tr><th>E-mail</th><th>Statut</th><th>Dernière connexion</th><th></th></tr></thead><tbody>${users.map(u => `<tr>
          <td><b>${esc(u.email)}</b>${u.email === me.email ? ' <span class="pill info">Vous</span>' : ''}</td>
          <td>${u.confirmed ? '<span class="pill ok">Actif</span>' : '<span class="pill dr">Invitation envoyée</span>'}</td>
          <td class="muted">${u.last_sign_in_at ? esc(ago(u.last_sign_in_at)) : '—'}</td>
          <td style="text-align:right">${u.email === me.email ? '' : `<button class="ib bad" data-del="${esc(u.id)}" data-em="${esc(u.email)}" aria-label="Retirer ${esc(u.email)}">${ic('trash')}</button>`}</td></tr>`).join('')}</tbody></table>`;
      $$('[data-del]').forEach(b => b.onclick = async () => {
        if (!(await confirmBox('Retirer cet administrateur ?', `${b.dataset.em} ne pourra plus se connecter à l'espace admin.`, 'Retirer', true))) return;
        try { await adminsApi('DELETE', { id: b.dataset.del }); toast('Administrateur retiré.'); load(); } catch (e) { toast('Impossible de retirer ce compte : ' + e.message, true); }
      });
    } catch (e) {
      $('#admList').innerHTML = `<div class="err-box">La liste des comptes n'a pas pu être chargée (${esc(e.message)}).</div>`;
    }
  };
  $('#inv').onsubmit = async e => {
    e.preventDefault(); const em = $('#invEmail').value.trim(); if (!em) return;
    const btn = $('#inv button'); btn.disabled = true;
    try { await adminsApi('POST', { email: em }); toast(`Invitation envoyée à ${em}.`); $('#invEmail').value = ''; load(); }
    catch (err) { toast(err.status === 422 ? 'Cette adresse a déjà un compte ou une invitation.' : 'L\'invitation n\'a pas pu être envoyée : ' + err.message, true); }
    btn.disabled = false;
  };
  load();
}

/* --- Mon compte --- */
function viewAccount(v) {
  setTitle('Mon compte');
  v.innerHTML = `<div class="grid2">
    <section class="card"><div class="card-h"><div><h2>Mes informations</h2></div></div><div class="card-b fs">
      <div class="f"><span class="lbl">Adresse e-mail</span><span>${esc(me.email)}</span></div>
      <div class="f"><span class="lbl">Compte créé le</span><span>${esc(frDate(me.created_at))}</span></div>
      <button class="b b-line" id="acLogout" style="justify-self:start">${ic('out')} Se déconnecter</button>
    </div></section>
    <section class="card"><div class="card-h"><div><h2>Changer mon mot de passe</h2><p>8 caractères minimum</p></div></div><form class="card-b fs" id="pw">
      <div class="f"><label for="pw1">Nouveau mot de passe</label><input class="in" type="password" id="pw1" autocomplete="new-password"></div>
      <div class="f"><label for="pw2">Confirmez le mot de passe</label><input class="in" type="password" id="pw2" autocomplete="new-password"></div>
      <button class="b b-blue" type="submit" style="justify-self:start">${ic('key')} Changer le mot de passe</button>
    </form></section></div>`;
  $('#acLogout').onclick = logout;
  $('#pw').onsubmit = async e => {
    e.preventDefault(); const a = $('#pw1').value, b = $('#pw2').value;
    if (a.length < 8) return toast('Le mot de passe doit contenir au moins 8 caractères.', true);
    if (a !== b) return toast('Les deux mots de passe ne sont pas identiques.', true);
    try { await auth.currentUser().update({ password: a }); $('#pw').reset(); toast('Mot de passe modifié.'); }
    catch (err) { toast('Le mot de passe n\'a pas pu être modifié. Réessayez.', true); }
  };
}

/* =====================================================================
   Démarrage / déconnexion
   ===================================================================== */
async function logout() {
  if (isDirty() && !(await confirmBox('Se déconnecter ?', 'Vos modifications non enregistrées seront perdues.', 'Se déconnecter', true))) return;
  editor = null;
  try { await auth.currentUser().logout(); } catch (e) { try { localStorage.removeItem('gotrue.user'); } catch (_) {} }
  stop();
  window.UNIR_LOGIN && window.UNIR_LOGIN.show();
}
function sessionExpired() {
  if (!document.body.classList.contains('in-app')) return;
  editor = null;
  try { localStorage.removeItem('gotrue.user'); } catch (e) {}
  stop();
  window.UNIR_LOGIN && window.UNIR_LOGIN.show('Votre session a expiré. Reconnectez-vous.');
}
function stop() {
  clearInterval(pubTimer);
  document.body.classList.remove('in-app');
  removeEventListener('hashchange', route);
  $('#app').innerHTML = '';
  Object.keys(cache).forEach(k => delete cache[k]);
}
addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

window.UNIR_APP = {
  start(a) {
    auth = a; me = auth.currentUser();
    if (!me) return window.UNIR_LOGIN && window.UNIR_LOGIN.show();
    document.body.classList.add('in-app');
    shell();
    addEventListener('hashchange', route);
    if (!location.hash || location.hash === '#/' ) history.replaceState(null, '', '#/tableau');
    route();
  }
};
})();
