/* =====================================================================
   UNIR · Section Légbassito — script commun aux 4 pages
   Tout le contenu (textes, chiffres, bureau, actions, galerie, actualités,
   coordonnées) est lu dans le dossier content/ et se modifie depuis /admin.
   ===================================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAGE = document.body.dataset.page;

/* ---------- Utilitaires ---------- */
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Chemin d'image : les fichiers ajoutés depuis /admin commencent par « / » ; on les rend relatifs
// pour que le site marche aussi à l'adresse https://compte.github.io/depot/
const src = p => {
  p = String(p || '').trim();
  if (!p) return '';
  if (/^(https?:)?\/\//.test(p) || p.startsWith('data:')) return p;
  return p.replace(/^\/+/, '');
};
const load = file => fetch('content/' + file, { cache: 'no-cache' }).then(r => {
  if (!r.ok) throw new Error(file + ' : ' + r.status);
  return r.json();
});
const list = v => Array.isArray(v) ? v : [];
const pad = n => String(n).padStart(2, '0');
const frDate = d => {
  if (!d) return '';
  const t = new Date(String(d).slice(0, 10) + 'T12:00:00');
  return isNaN(t) ? esc(d) : t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};
const waNumber = n => String(n || '').replace(/[^\d]/g, '');

/* ---------- Icônes ---------- */
const I = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V5h-3c-2.8 0-4 1.8-4 4.3V11H8v4h2v8h4v-8h3l1-4h-4V9.6c0-.4.3-.6.6-.6z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.3 1.8 4 4 4.3v3.2a7.6 7.6 0 0 1-4-1.2v6.2A5.5 5.5 0 1 1 10.5 10v3.3a2.3 2.3 0 1 0 2.2 2.3V3z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.8-2.7-1.1-4.4-3.9-4.5-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.2.3-.1.5.2.3.7 1.2 1.6 1.9 1.1 1 2 1.2 2.3 1.4.2.1.4.1.5-.1l.8-.9c.2-.2.4-.2.6-.1l2 .9c.2.1.4.2.4.3.1.2.1.7-.1 1.2z"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
};
// Icônes des valeurs (choix proposés dans /admin)
const VALUE_ICONS = {
  paix: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  developpement: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',
  proximite: I.people,
  jeunesse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>',
  education: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  sante: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  solidarite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-2 2a2.8 2.8 0 0 1-4-4l4-4a2.8 2.8 0 0 1 4 0"/><path d="m13 7 2-2a2.8 2.8 0 0 1 4 4l-4 4a2.8 2.8 0 0 1-4 0"/></svg>'
};

/* ---------- Structure du site : 3 pages et leurs sections ---------- */
const PAGES = [
  { id: 'accueil', href: './', label: 'Accueil', sections: [['accueil', 'Accueil'], ['apropos', 'À propos'], ['chiffres', 'Chiffres clés'], ['valeurs', 'Valeurs'], ['citations', 'Citations']] },
  { id: 'section', href: 'section.html', label: 'La section', sections: [['bureau', 'Bureau'], ['actions', 'Actions'], ['galerie', 'Galerie']] },
  { id: 'rejoindre', href: 'rejoindre.html', label: 'Nous rejoindre', sections: [['actualites', 'Actualités'], ['adherer', 'Adhérer'], ['contact', 'Contact']] }
];
const CUR = PAGE === 'article' ? 'rejoindre' : PAGE;
const curPage = PAGES.find(p => p.id === CUR);
// Lien vers une section : simple ancre si on est déjà sur la bonne page
const secHref = (page, id) => (page.id === PAGE ? '' : page.href) + '#' + id;

/* ---------- Gabarits communs ---------- */
const head = (h, center) => `
  <div class="head${center ? ' center' : ''} reveal">
    <span class="kicker">${esc(h.surtitre)}</span>
    <h2 class="title">${esc(h.titre)} <em>${esc(h.accent)}</em></h2>
    ${h.intro ? `<p class="sub">${esc(h.intro)}</p>` : ''}
  </div>`;

function header() {
  let n = 0;
  const groups = PAGES.map(p => `
    <div class="pgroup">
      <a class="ptab${p.id === CUR ? ' here' : ''}" href="${p.href}">${esc(p.label)}</a>
      ${p.sections.map(([id, label]) => { n++; return `<a href="${secHref(p, id)}" class="pbtn" data-sec="${p.id}:${id}" style="transition-delay:${(.05 + n * .035).toFixed(2)}s"><small>${pad(n)}</small><b>${esc(label)}</b></a>`; }).join('')}
    </div>`).join('');
  return `
  <div id="progress"></div><div id="glow"></div>
  <header class="nav" id="nav">
    <div class="container row">
      <a href="./" class="brand" aria-label="Accueil">
        <span class="mark"><img src="assets/logo-blanc.png" alt="Logo UNIR"></span>
        <span><b>UNIR</b><span>Section ${esc(S.section)}</span></span>
      </a>
      <nav class="tabs" aria-label="Pages du site">
        ${PAGES.map((p, i) => `<a href="${p.href}" class="sbtn${p.id === CUR ? ' active' : ''}${p.id === 'rejoindre' ? ' cta-s' : ''}"${p.id === CUR ? ' aria-current="page"' : ''}><i>${pad(i + 1)}</i>${esc(p.label)}</a>`).join('')}
      </nav>
      <div class="tools">
        <button class="sections-btn" id="sectionsBtn" aria-label="Toutes les sections" aria-expanded="false"><span class="bg"><i></i><i></i><i></i></span><span class="lbl">Sections</span></button>
      </div>
    </div>
  </header>
  <div id="panel" aria-hidden="true">
    <div class="container">
      <p class="ptitle">Aller à la section</p>
      <div class="grid">${groups}</div>
    </div>
  </div>`;
}

function marquee(words) {
  const w = list(words).map(x => `<span>${esc(x)}</span>`).join('');
  return w ? `<div class="marquee" aria-hidden="true"><div class="track">${w}${w}</div></div>` : '';
}

function sky() {
  return `<canvas id="sky"></canvas><img class="map" src="assets/logo-blanc.png" alt="" aria-hidden="true">`;
}

function pageHero(h, jumps, id = 'haut') {
  return `
  <section class="hero page" id="${id}">
    ${sky()}
    <div class="container page-hero">
      <span class="eyebrow fade-up"><span class="dot"></span>${esc(h.surtitre)}</span>
      <h1>
        <span class="line"><span>${esc(h.titre)}</span></span>
        ${h.accent ? `<span class="line"><span><em>${esc(h.accent)}</em></span></span>` : ''}
      </h1>
      ${h.intro ? `<p class="lead fade-up d2">${esc(h.intro)}</p>` : ''}
      ${jumps ? `<div class="jump fade-up d3">${jumps}</div>` : ''}
    </div>
  </section>`;
}
const jumpLinks = page => page.sections.map(([id, label]) => `<a href="#${id}" class="chip-l">${esc(label)} ${I.arrow}</a>`).join('');

function nextPage(target, text) {
  const p = PAGES.find(x => x.id === target);
  return `
  <section class="nextpage">
    <div class="container">
      <a class="np reveal" href="${p.href}">
        <span><small>Page suivante</small><b>${esc(p.label)}</b><span>${esc(text)}</span></span>
        <i>${I.arrow}</i>
      </a>
    </div>
  </section>`;
}

function footer() {
  const soc = [['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']]
    .filter(([k]) => S[k]).map(([k, l]) => `<a href="${esc(S[k])}" target="_blank" rel="noopener" aria-label="${l}">${I[k]}</a>`).join('');
  return `
  <footer>
    <div class="container">
      <div class="fgr">
        <div>
          <a href="./" class="brand"><span class="mark"><img src="assets/logo-blanc.png" alt=""></span><span><b>UNIR</b><span>Section ${esc(S.section)}</span></span></a>
          <p class="ftxt">${esc(S.texte_pied)}</p>
          ${soc ? `<div class="socials">${soc}</div>` : ''}
        </div>
        <div><h5>Pages</h5><ul>${PAGES.map(p => `<li><a href="${p.href}">${esc(p.label)}</a></li>`).join('')}</ul></div>
        <div><h5>Le parti</h5><ul>
          ${S.site_parti ? `<li><a href="${esc(S.site_parti)}" target="_blank" rel="noopener">${esc(S.site_parti.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></li>` : ''}
          <li><a href="rejoindre.html#adherer">Adhérer</a></li>
          <li><a href="rejoindre.html#actualites">Actualités</a></li>
          <li><a href="rejoindre.html#contact">Contact</a></li>
        </ul></div>
      </div>
      <div class="copy"><span>© ${new Date().getFullYear()} UNIR · Section ${esc(S.section)}</span><span><a href="admin/" rel="nofollow">Administration</a> · <a href="#" data-top>Retour en haut ↑</a></span></div>
    </div>
  </footer>
  <button id="totop" aria-label="Haut de page"><svg class="ringp" viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/></svg>${I.up}</button>
  <div id="lightbox" role="dialog" aria-modal="true" aria-label="Galerie">
    <button class="x" aria-label="Fermer">✕</button>
    <button class="nv prev" aria-label="Précédente">‹</button>
    <button class="nv next" aria-label="Suivante">›</button>
    <div class="lb-inner"><div class="lb-art" id="lbArt"></div><div class="lb-cap"><b id="lbCap"></b><small id="lbIdx"></small></div></div>
  </div>
  <div id="toast" role="status"></div>`;
}

/* ---------- Page 1 : Accueil ---------- */
function renderAccueil(A) {
  const h = A.hero || {}, ap = A.apropos || {}, va = A.valeurs || {};
  const stats = list(A.chiffres).map((c, i) => `
    <div class="stat reveal" style="transition-delay:${i * .1}s"><div class="n"><span class="count" data-to="${Number(c.valeur) || 0}" data-fmt="${esc(c.format || 'nombre')}">0</span>${esc(c.suffixe)}</div><p>${esc(c.libelle)}</p></div>`).join('');
  const values = list(va.liste).map((v, i) => `
    <article class="vcard reveal" style="transition-delay:${(i % 3) * .12}s">
      <span class="num">${pad(i + 1)}</span>
      <div class="ic">${VALUE_ICONS[v.icone] || VALUE_ICONS.paix}</div>
      <h3>${esc(v.titre)}</h3>
      <p>${esc(v.texte)}</p>
    </article>`).join('');
  const quotes = list(A.citations).map((q, i) => `
    <div class="slide${i ? '' : ' on'}"><q>${esc(q.texte)}</q><div class="who">${esc(q.auteur)}${q.precision ? `<span>${esc(q.precision)}</span>` : ''}</div></div>`).join('');
  const photo = src(ap.photo);
  return `
  <section class="hero" id="accueil">
    ${sky()}
    <div class="container hero-grid">
      <div>
        <span class="eyebrow fade-up"><span class="dot"></span>${esc(h.surtitre)}</span>
        <h1>
          <span class="line"><span>${esc(h.ligne1)}</span></span>
          <span class="line"><span><em>${esc(h.accent)}</em></span></span>
          <span class="line"><span>${esc(h.ligne3)}</span></span>
        </h1>
        <p class="typed fade-up d1">${esc(h.engagement)} <b id="typed"></b></p>
        <p class="lead fade-up d2">${esc(h.intro)}</p>
        <div class="actions fade-up d3">
          <a href="rejoindre.html#adherer" class="btn btn-white">${esc(h.bouton1)} ${I.arrow}</a>
          <a href="section.html#actions" class="btn btn-ghost">${esc(h.bouton2)}</a>
        </div>
      </div>
      <div class="fade-up d4">
        <div class="emblem" id="emblem">
          <span class="ring"></span><span class="ring r2"></span>
          <img src="assets/logo-blanc.png" alt="Logo UNIR, colombe blanche sur la carte du Togo" id="emblemImg">
          ${h.badge1_titre ? `<div class="badge-float b1"><span class="ic">${I.people}</span><span><b>${esc(h.badge1_titre)}</b>${esc(h.badge1_texte)}</span></div>` : ''}
          ${h.badge2_titre ? `<div class="badge-float b2"><span class="ic">${I.shield}</span><span><b>${esc(h.badge2_titre)}</b>${esc(h.badge2_texte)}</span></div>` : ''}
        </div>
      </div>
    </div>
    <a href="#apropos" class="scroll-hint" aria-label="Défiler"><span class="mouse"></span>DÉFILER</a>
  </section>
  ${marquee(A.bandeau)}

  <section class="sec" id="apropos">
    <div class="container about">
      <div class="about-visual reveal left">
        <div class="card-blue${photo ? ' has-photo' : ''}" id="tiltCard">${photo
          ? `<img class="photo" src="${esc(photo)}" alt="${esc(ap.photo_texte)}">`
          : `<img src="assets/logo-blanc.png" alt="Logo UNIR">`}</div>
        ${ap.annee ? `<div class="stamp">
          <svg viewBox="0 0 130 130" aria-hidden="true"><defs><path id="circ" d="M65,65 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"/></defs><text><textPath href="#circ" textLength="313" lengthAdjust="spacing">${esc(ap.texte_badge)}</textPath></text></svg>
          <b>${esc(ap.annee)}</b>
        </div>` : ''}
      </div>
      <div class="reveal right">
        <span class="kicker">${esc(ap.surtitre)}</span>
        <h2 class="title">${esc(ap.titre)} <em>${esc(ap.accent)}</em></h2>
        <div class="txt">${list(ap.paragraphes).map(p => `<p>${esc(p)}</p>`).join('')}</div>
        <div class="facts">${list(ap.faits).map(f => `<div class="fact"><small>${esc(f.libelle)}</small><b>${esc(f.valeur)}</b></div>`).join('')}</div>
        ${S.site_parti && ap.bouton ? `<a href="${esc(S.site_parti)}" target="_blank" rel="noopener" class="btn btn-blue">${esc(ap.bouton)} ${I.ext}</a>` : ''}
      </div>
    </div>
  </section>

  <section class="soft" id="chiffres">
    <div class="container"><div class="stats">${stats}</div></div>
  </section>

  <section class="sec dark" id="valeurs">
    <div class="container">
      ${head(va, true)}
      <div class="values">${values}</div>
    </div>
  </section>

  ${quotes ? `<section class="sec dark quotes" id="citations">
    <div class="container slider reveal">
      <div class="bigq">“</div>
      <div class="slides" id="slides">${quotes}</div>
      <div class="dots" id="dots"></div>
    </div>
  </section>` : ''}

  ${nextPage('section', 'Le bureau, nos actions de l\'année et la galerie photos.')}`;
}

/* ---------- Page 2 : La section ---------- */
function initials(m) {
  const stop = /^(de|du|des|la|le|les|et|d|l|à|en)$/i;
  const base = (!m.nom || m.nom.trim().startsWith('[')) ? (m.fonction || '') : m.nom;
  const words = base.replace(/·\S*/g, '').replace(/[().]/g, ' ').split(/[\s'’-]+/).filter(w => w && !stop.test(w));
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'U';
}
const FORMATS = { normal: '', large: 'wide', grand: 'big', pleine: 'full' };
const CADRAGE = { haut: '50% 25%', centre: '50% 50%', bas: '50% 72%' };

function renderSection(P, B, AC, G) {
  const team = list(B.membres).map((m, i) => {
    const photo = src(m.photo);
    const soc = [
      m.facebook ? `<a href="${esc(m.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${I.facebook}</a>` : '',
      waNumber(m.whatsapp) ? `<a href="https://wa.me/${waNumber(m.whatsapp)}" target="_blank" rel="noopener" aria-label="WhatsApp">${I.whatsapp}</a>` : ''
    ].join('');
    return `
    <div class="member reveal" style="transition-delay:${(i % 4) * .1}s">
      <div class="ph">${photo ? `<img src="${esc(photo)}" alt="${esc(m.nom)}" loading="lazy">` : `<span class="ini">${esc(initials(m))}</span>`}${soc ? `<div class="soc">${soc}</div>` : ''}</div>
      <div class="bd"><h4>${esc(m.nom)}</h4><span>${esc(m.fonction)}</span></div>
    </div>`;
  }).join('');
  const tl = list(AC.liste).map((a, i) => `
    <div class="tl-item reveal ${i % 2 ? 'left' : 'right'}"><span class="pt"></span>${a.date ? `<span class="date">${esc(a.date)}</span>` : ''}<div class="box"><h3>${esc(a.titre)}</h3><p>${esc(a.texte)}</p>${a.etiquette ? `<span class="tag">${esc(a.etiquette)}</span>` : ''}</div></div>`).join('');
  const photos = list(G.photos).filter(p => p.image);
  const cats = [...new Set(photos.map(p => p.categorie).filter(Boolean))];
  const gal = photos.map(p => `
    <figure class="g ${FORMATS[p.format] || ''} reveal zoom" data-c="${esc(p.categorie)}"><img class="art" src="${esc(src(p.image))}" alt="${esc(p.description || p.titre)}" style="object-position:${CADRAGE[p.cadrage] || CADRAGE.centre}" loading="lazy"><figcaption class="cap"><b>${esc(p.titre)}</b><small>${esc(p.categorie)}</small></figcaption></figure>`).join('');
  return `
  ${pageHero(P.entete || {}, jumpLinks(curPage))}
  ${marquee(['Bureau', 'Actions', 'Galerie', 'Terrain', 'Proximité', 'Engagement', 'Unité', 'Légbassito'])}

  <section class="sec soft" id="bureau">
    <div class="container">
      ${head(P.bureau || {})}
      <div class="team">${team}</div>
    </div>
  </section>

  <section class="sec" id="actions">
    <div class="container">
      ${head(P.actions || {}, true)}
      <div class="tl" id="tl"><span class="fill" id="tlFill"></span>${tl}</div>
    </div>
  </section>

  <section class="sec soft" id="galerie">
    <div class="container">
      ${head(P.galerie || {}, true)}
      ${cats.length > 1 ? `<div class="filters reveal" id="filters"><button class="on" data-f="all">Tout</button>${cats.map(c => `<button data-f="${esc(c)}">${esc(c)}</button>`).join('')}</div>` : ''}
      <div class="gallery" id="gallery">${gal}</div>
    </div>
  </section>

  ${nextPage('rejoindre', 'Les actualités, le formulaire d\'adhésion et nos contacts.')}`;
}

/* ---------- Page 3 : Nous rejoindre ---------- */
const postCard = (a, i) => `
  <article class="post reveal" style="transition-delay:${(i % 3) * .12}s">
    <a class="th" href="article.html#${esc(a.slug)}" tabindex="-1" aria-hidden="true">${a.image
      ? `<img class="art" src="${esc(src(a.image))}" alt="" loading="lazy">`
      : `<span class="art ph-art"><img src="assets/logo-blanc.png" alt=""></span>`}</a>
    <div class="bd">
      <span class="meta">${esc(a.categorie)}${a.categorie && a.date ? ' · ' : ''}${frDate(a.date)}</span>
      <h3><a href="article.html#${esc(a.slug)}">${esc(a.titre)}</a></h3>
      <p>${esc(a.resume)}</p>
      <a href="article.html#${esc(a.slug)}" class="more">Lire la suite ${I.arrow}</a>
    </div>
  </article>`;

function renderRejoindre(R, N) {
  const ad = R.adhesion || {};
  const arts = list(N.articles);
  const choix = list(ad.choix).length ? list(ad.choix) : ['Je souhaite adhérer'];
  return `
  ${pageHero(R.entete || {}, jumpLinks(curPage))}
  ${marquee(['Actualités', 'Adhérer', 'Contact', 'Engagez-vous', 'Unir', 'Servir', 'Rassembler', 'Légbassito'])}

  <section class="sec soft" id="actualites">
    <div class="container">
      ${head(R.actualites || {})}
      ${arts.length
        ? `<div class="news" id="news">${arts.map(postCard).join('')}</div>
           ${arts.length > 6 ? `<div class="more-wrap"><button class="btn btn-blue" id="moreNews">Voir plus d'actualités</button></div>` : ''}`
        : `<p class="empty">Aucune actualité publiée pour le moment.</p>`}
    </div>
  </section>

  <section class="sec" id="adherer">
    <div class="container join">
      <div class="reveal left">
        <span class="kicker">${esc(ad.surtitre)}</span>
        <h2 class="title">${esc(ad.titre)} <em>${esc(ad.accent)}</em></h2>
        <p class="sub">${esc(ad.intro)}</p>
        <ol class="steps">${list(ad.etapes).map(e => `<li><div><b>${esc(e.titre)}</b><span>${esc(e.texte)}</span></div></li>`).join('')}</ol>
      </div>
      <form class="card reveal right" id="joinForm" novalidate>
        <div class="fgrid">
          <div class="field"><input id="nom" name="nom" placeholder=" " required autocomplete="family-name"><label for="nom">Nom</label></div>
          <div class="field"><input id="prenom" name="prenom" placeholder=" " required autocomplete="given-name"><label for="prenom">Prénom(s)</label></div>
          <div class="field"><input id="tel" name="tel" type="tel" placeholder=" " required autocomplete="tel"><label for="tel">Téléphone</label></div>
          <div class="field"><input id="quartier" name="quartier" placeholder=" " required><label for="quartier">Quartier</label></div>
          <div class="field full"><select id="profil" name="profil">${choix.map(c => `<option>${esc(c)}</option>`).join('')}</select><label for="profil">Votre demande</label></div>
          <div class="field full"><textarea id="msg" name="msg" placeholder=" "></textarea><label for="msg">Message (facultatif)</label></div>
          <label class="check"><input type="checkbox" id="ok" required> J'accepte que la section me recontacte au sujet de ma demande.</label>
        </div>
        <button class="btn btn-blue" type="submit">Envoyer ma demande ${I.send}</button>
        <p class="formnote">${esc(ad.note)}</p>
        <div id="waReady" hidden><a id="waLink" class="btn btn-white-blue" href="#" target="_blank" rel="noopener">Ouvrir WhatsApp et envoyer ${I.arrow}</a></div>
      </form>
    </div>
  </section>

  <section class="sec dark" id="contact">
    <div class="container">
      ${head(R.contact || {}, true)}
      <div class="contacts">
        <div class="ccard reveal"><div class="ic">${I.phone}</div><small>WhatsApp</small><h4>${esc(S.telephone)}</h4><div class="acts">${waNumber(S.whatsapp) ? `<a class="chip" href="https://wa.me/${waNumber(S.whatsapp)}" target="_blank" rel="noopener">Écrire</a>` : ''}<button class="chip o" data-copy="${esc(S.telephone)}">Copier</button></div></div>
        <div class="ccard reveal" style="transition-delay:.12s"><div class="ic">${I.mail}</div><small>E-mail</small><h4>${esc(S.email)}</h4><div class="acts"><a class="chip" href="mailto:${esc(S.email)}">Écrire</a><button class="chip o" data-copy="${esc(S.email)}">Copier</button></div></div>
        <div class="ccard reveal" style="transition-delay:.24s"><div class="ic">${I.pin}</div><small>Siège de la section</small><h4>${esc(S.adresse)}</h4><div class="acts">${S.lien_carte ? `<a class="chip" href="${esc(S.lien_carte)}" target="_blank" rel="noopener">Voir sur la carte</a>` : ''}</div></div>
      </div>
    </div>
  </section>`;
}

/* ---------- Page article ---------- */
function renderArticle(a, others) {
  const body = (window.marked ? window.marked.parse(String(a.corps || '')) : `<p>${esc(a.corps)}</p>`)
    // les images ajoutées dans le texte depuis /admin commencent par « / »
    .replace(/(<img[^>]+src=")\/(?!\/)/g, '$1');
  return `
  ${pageHero({ surtitre: [a.categorie, frDate(a.date)].filter(Boolean).join(' · '), titre: a.titre, accent: '', intro: a.resume }, `<a href="rejoindre.html#actualites" class="chip-l back">${I.back} Toutes les actualités</a>`)}
  <section class="sec article-sec">
    <div class="container narrow">
      ${a.image ? `<figure class="article-img reveal"><img src="${esc(src(a.image))}" alt=""></figure>` : ''}
      <div class="prose reveal">${body}</div>
      <div class="share reveal">
        <a href="rejoindre.html#actualites" class="btn btn-blue">${I.back} Retour aux actualités</a>
        <a href="https://wa.me/?text=${encodeURIComponent(a.titre + ' — ' + location.href)}" target="_blank" rel="noopener" class="btn btn-outline">${I.whatsapp} Partager sur WhatsApp</a>
      </div>
    </div>
  </section>
  ${others.length ? `<section class="sec soft">
    <div class="container">
      <div class="head reveal"><span class="kicker">Actualités</span><h2 class="title">À lire <em>aussi</em></h2></div>
      <div class="news">${others.map(postCard).join('')}</div>
    </div>
  </section>` : ''}`;
}

/* ---------- Chargement ---------- */
let S = {}, ACC = {};
async function boot() {
  const app = $('#app');
  try {
    S = await load('site.json');
    let main = '';
    if (PAGE === 'accueil') {
      ACC = await load('accueil.json');
      main = renderAccueil(ACC);
    } else if (PAGE === 'section') {
      const [P, B, AC, G] = await Promise.all(['section.json', 'bureau.json', 'actions.json', 'galerie.json'].map(load));
      main = renderSection(P, B, AC, G);
    } else if (PAGE === 'rejoindre') {
      const [R, N] = await Promise.all([load('rejoindre.json'), load('actualites-index.json').catch(() => ({ articles: [] }))]);
      main = renderRejoindre(R, N);
    } else if (PAGE === 'article') {
      const slug = decodeURIComponent(location.hash.slice(1));
      const N = await load('actualites-index.json').catch(() => ({ articles: [] }));
      let a = null;
      if (/^[\w.~-]+$/.test(slug)) a = await load('actualites/' + slug + '.json').catch(() => null);
      if (a) {
        document.title = a.titre + ' · UNIR Légbassito';
        main = renderArticle(a, list(N.articles).filter(x => x.slug !== slug).slice(0, 3));
      } else {
        main = pageHero({ surtitre: 'Actualités', titre: 'Article', accent: 'introuvable', intro: 'Cet article n\'existe pas ou n\'est plus publié.' }, `<a href="rejoindre.html#actualites" class="chip-l back">${I.back} Toutes les actualités</a>`);
      }
    }
    app.innerHTML = header() + '<main id="main">' + main + '</main>' + footer();
    init();
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="load-error"><img src="assets/logo.png" alt=""><h1>Le contenu n'a pas pu être chargé</h1>
      <p>Vérifiez votre connexion puis rechargez la page.</p>
      <p class="small">Si vous avez ouvert le fichier directement depuis votre ordinateur, le site doit être consulté en ligne (ou via un petit serveur local), car il lit son contenu dans le dossier <code>content/</code>.</p></div>`;
    $('#loader').classList.add('done');
  }
}
// Changement d'article sans rechargement (lien « À lire aussi »)
if (PAGE === 'article') addEventListener('hashchange', () => location.reload());

/* ---------- Comportements ---------- */
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600); }

function init() {
  // Écran de chargement
  const done = () => { $('#loader').classList.add('done'); document.body.classList.add('loaded'); };
  if (document.readyState === 'complete') setTimeout(done, reduce ? 0 : 700);
  else { addEventListener('load', () => setTimeout(done, reduce ? 0 : 700)); setTimeout(done, 3500); }

  // Ancre demandée depuis une autre page (ex. rejoindre.html#adherer)
  if (PAGE !== 'article' && location.hash.length > 1) {
    const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'instant', block: 'start' }), 60);
  }

  // Navigation, progression, retour en haut, section active
  const nav = $('#nav'), prog = $('#progress'), toTop = $('#totop'), ring = $('#totop .ringp circle');
  const secs = curPage.sections.map(([id]) => document.getElementById(id)).filter(Boolean);
  const plinks = $$('.pbtn');
  let curSec = '';
  const tl = $('#tl'), tlFill = $('#tlFill'), emblem = $('#emblem'), map = $('.hero .map');
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? y / h : 0;
    nav.classList.toggle('scrolled', y > 40);
    prog.style.width = (p * 100) + '%';
    toTop.classList.toggle('show', y > 600);
    ring.style.strokeDashoffset = 151 - 151 * p;
    if (PAGE !== 'article' && secs.length) {
      let cur = secs[0].id;
      secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
      if (y + innerHeight >= document.documentElement.scrollHeight - 4) cur = secs[secs.length - 1].id;
      if (cur !== curSec) { curSec = cur; plinks.forEach(a => a.classList.toggle('active', a.dataset.sec === CUR + ':' + cur)); }
    }
    if (tl) { const r = tl.getBoundingClientRect(); const v = Math.min(Math.max((innerHeight * .6 - r.top) / r.height, 0), 1); tlFill.style.height = (v * 100) + '%'; }
    if (!reduce && y < innerHeight) {
      if (emblem) emblem.style.transform = `translateY(${y * .15}px)`;
      if (map) map.style.transform = `translateY(calc(-50% + ${y * .3}px))`;
    }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const goTop = e => { e && e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); };
  toTop.onclick = goTop; $$('[data-top]').forEach(a => a.onclick = goTop);

  // Panneau « Sections »
  const sBtn = $('#sectionsBtn'), panel = $('#panel');
  function setPanel(o) { sBtn.classList.toggle('open', o); panel.classList.toggle('open', o); sBtn.setAttribute('aria-expanded', o); panel.setAttribute('aria-hidden', !o); document.body.style.overflow = o ? 'hidden' : ''; }
  sBtn.onclick = () => setPanel(!panel.classList.contains('open'));
  $$('#panel a').forEach(a => a.addEventListener('click', () => setPanel(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('open')) setPanel(false); });

  // Apparition au défilement + compteurs
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('.count', e.target).forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  function countUp(el) {
    if (el._done) return; el._done = 1;
    const to = +el.dataset.to, d = reduce ? 0 : 2000, t0 = performance.now();
    const fmt = el.dataset.fmt === 'annee' ? (n => String(n)) : (n => n.toLocaleString('fr-FR'));
    (function step(t) { const p = d ? Math.min((t - t0) / d, 1) : 1, e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); })(t0);
  }

  // Halo qui suit le curseur
  const glow = $('#glow');
  addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, { passive: true });

  // Effet d'onde sur les boutons
  $$('.btn').forEach(b => b.addEventListener('click', e => {
    const r = b.getBoundingClientRect(), s = document.createElement('span'), d = Math.max(r.width, r.height);
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  }));

  // Boutons « Copier »
  $$('[data-copy]').forEach(b => b.onclick = async () => {
    const v = b.dataset.copy;
    try { await navigator.clipboard.writeText(v); toast('Copié : ' + v); } catch (e) { toast('À copier : ' + v); }
  });

  if (PAGE === 'accueil') initAccueil();
  if (PAGE === 'section') initGallery();
  if (PAGE === 'rejoindre') initRejoindre();
  if ($('#sky')) initSky();
}

function initAccueil() {
  // Texte qui s'écrit tout seul
  const words = list((ACC.hero || {}).mots_animes).filter(Boolean).length ? list(ACC.hero.mots_animes).filter(Boolean) : ['Unir'];
  let wi = 0, ci = 0, del = false; const tEl = $('#typed');
  (function type() {
    const w = words[wi]; tEl.textContent = w.slice(0, ci);
    if (!del && ci < w.length) { ci++; setTimeout(type, 90); }
    else if (!del) { del = true; setTimeout(type, 1600); }
    else if (ci > 0) { ci--; setTimeout(type, 45); }
    else { del = false; wi = (wi + 1) % words.length; setTimeout(type, 300); }
  })();

  // Logo du hero qui suit la souris
  const emb = $('#emblemImg');
  $('.hero').addEventListener('pointermove', e => { if (reduce) return;
    const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5);
    emb.style.translate = `${x * 24}px ${y * 24}px`;
  });
  // Cartes valeurs : halo + inclinaison
  $$('.vcard').forEach(c => {
    c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      if (!reduce) c.style.transform = `perspective(800px) rotateX(${(y / r.height - .5) * -8}deg) rotateY(${(x / r.width - .5) * 8}deg) translateY(-6px)`;
    });
    c.addEventListener('pointerleave', () => c.style.transform = '');
  });
  // Photo « À propos » inclinable
  const tc = $('#tiltCard');
  tc.style.transition = 'transform .3s';
  tc.addEventListener('pointermove', e => { if (reduce) return; const r = tc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tc.style.transform = `perspective(900px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`; tc.firstElementChild.style.transform = `translate(${x * 20}px,${y * 20}px)`; });
  tc.addEventListener('pointerleave', () => { tc.style.transform = ''; tc.firstElementChild.style.transform = ''; });

  // Carrousel de citations
  const slides = $$('.slide'), dots = $('#dots'); if (!slides.length) return;
  let si = 0, timer;
  slides.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Citation ' + (i + 1)); b.onclick = () => go(i, true); dots.appendChild(b); });
  function go(i, user) { slides[si].classList.remove('on'); dots.children[si].classList.remove('on'); si = i; slides[si].classList.add('on'); dots.children[si].classList.add('on'); if (user) restart(); }
  function restart() { clearInterval(timer); timer = setInterval(() => go((si + 1) % slides.length), 5500); }
  dots.children[0].classList.add('on'); if (slides.length > 1) restart();
}

function initGallery() {
  $$('#filters button').forEach(b => b.onclick = () => {
    $$('#filters button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    const f = b.dataset.f;
    $$('#gallery .g').forEach(g => { const show = f === 'all' || g.dataset.c === f; g.style.opacity = 0; g.style.transform = 'scale(.94)';
      setTimeout(() => { g.classList.toggle('hide', !show); requestAnimationFrame(() => { g.style.opacity = ''; g.style.transform = ''; }); }, 250); });
  });
  const lb = $('#lightbox'); let li = 0;
  const visible = () => $$('#gallery .g:not(.hide)');
  function openLb(i) { const v = visible(); if (!v.length) return; li = (i + v.length) % v.length; const g = v[li];
    $('#lbArt').innerHTML = ''; $('#lbArt').appendChild($('.art', g).cloneNode(true));
    $('#lbCap').textContent = $('.cap b', g).textContent; $('#lbIdx').textContent = (li + 1) + ' / ' + v.length; lb.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  $$('#gallery .g').forEach(g => g.onclick = () => openLb(visible().indexOf(g)));
  $('.x', lb).onclick = closeLb; $('.prev', lb).onclick = () => openLb(li - 1); $('.next', lb).onclick = () => openLb(li + 1);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') openLb(li - 1); if (e.key === 'ArrowRight') openLb(li + 1); });
}

function initRejoindre() {
  // « Voir plus » : 6 actualités affichées au départ
  const posts = $$('#news .post'), more = $('#moreNews');
  if (more) { posts.slice(6).forEach(p => p.hidden = true); more.onclick = () => { posts.forEach(p => p.hidden = false); more.parentElement.remove(); }; }

  // Formulaire d'adhésion → message WhatsApp prêt à envoyer
  $('#joinForm').addEventListener('submit', e => {
    e.preventDefault(); const f = e.target;
    const req = ['nom', 'prenom', 'tel', 'quartier'].map(id => f[id]);
    const bad = req.filter(i => !i.value.trim()); req.forEach(i => i.classList.toggle('bad', !i.value.trim()));
    if (bad.length) { toast('Merci de remplir les champs obligatoires'); bad[0].focus(); return; }
    if (!$('#ok').checked) { toast('Merci de cocher la case de consentement'); return; }
    const txt = `Bonjour la section UNIR ${S.section},\n\n${f.profil.value}.\n\nNom : ${f.nom.value}\nPrénom(s) : ${f.prenom.value}\nTéléphone : ${f.tel.value}\nQuartier : ${f.quartier.value}` + (f.msg.value.trim() ? `\n\nMessage : ${f.msg.value}` : '');
    const url = 'https://wa.me/' + waNumber(S.whatsapp) + '?text=' + encodeURIComponent(txt);
    $('#waLink').href = url; $('#waReady').hidden = false;
    const w = window.open(url, '_blank');
    toast(w ? 'Ouverture de WhatsApp…' : 'Demande prête : appuyez sur « Ouvrir WhatsApp »');
  });
}

// Ciel animé du hero : particules lumineuses et colombes
function initSky() {
  const c = $('#sky'), x = c.getContext('2d'); let W, H, parts = [], doves = [];
  const dove = new Image(); dove.src = 'assets/logo-blanc.png';
  function size() { const r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    parts = Array.from({ length: Math.round(W / 14) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .4, s: Math.random() * .35 + .1, o: Math.random() * .6 + .2, p: Math.random() * 6 }));
    doves = Array.from({ length: W < 700 ? 2 : 4 }, () => ({ x: Math.random() * W, y: H * (.15 + Math.random() * .6), s: .25 + Math.random() * .35, sz: 22 + Math.random() * 26, p: Math.random() * 6 })); }
  size(); addEventListener('resize', size);
  let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  function draw(t) {
    x.clearRect(0, 0, W, H);
    for (const p of parts) { p.y -= p.s; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
      const tw = .5 + .5 * Math.sin(t / 900 + p.p);
      x.beginPath(); x.arc(p.x + mx * 20 * p.r, p.y + my * 20 * p.r, p.r, 0, 7); x.fillStyle = `rgba(255,255,255,${p.o * tw})`; x.fill(); }
    x.strokeStyle = 'rgba(255,255,255,.06)'; x.lineWidth = 1;
    for (let i = 0; i < parts.length; i += 3) for (let j = i + 3; j < parts.length; j += 3) { const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y; if (dx * dx + dy * dy < 9000) { x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); } }
    if (dove.complete && dove.naturalWidth) {
      const ar = dove.naturalWidth / dove.naturalHeight, sh = dove.naturalHeight * .6;
      for (const d of doves) { d.x += d.s; if (d.x > W + 60) { d.x = -60; d.y = H * (.15 + Math.random() * .6); }
        const yy = d.y + Math.sin(t / 1200 + d.p) * 14; x.globalAlpha = .09;
        x.drawImage(dove, 0, 0, dove.naturalWidth, sh, d.x, yy, d.sz * ar / .6, d.sz); x.globalAlpha = 1; }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

boot();
})();
