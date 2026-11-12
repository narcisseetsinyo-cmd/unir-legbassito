/* Écran de connexion de l'espace admin (e-mail + mot de passe, Netlify Identity) */
(() => {
  'use strict';
  const root = document.getElementById('unir-login');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const GoTrueClass = window.GoTrue && (window.GoTrue.default || window.GoTrue);
  const auth = GoTrueClass ? new GoTrueClass({ APIUrl: location.origin + '/.netlify/identity', setCookie: false }) : null;
  const STORE = 'gotrue.user';
  const loggedIn = () => { try { return !!localStorage.getItem(STORE); } catch (e) { return false; } };
  const TITLES = {
    loading: ['Connexion', 'Un instant…'],
    login: ['Connexion', 'Avec votre adresse e-mail'],
    forgot: ['Mot de passe oublié', 'Recevez un lien par e-mail'],
    invite: ['Bienvenue !', 'Activation de votre compte admin'],
    reset: ['Nouveau mot de passe', 'Sécurisez votre compte']
  };
  let view = 'loading', flow = false;

  function show(v, loadingText) {
    view = v;
    $$('.ul-view', root).forEach(el => el.classList.toggle('on', el.dataset.view === v));
    $('#ul-h').textContent = TITLES[v][0]; $('#ul-hp').textContent = TITLES[v][1];
    if (loadingText) $('#ul-loading-txt').textContent = loadingText;
    $$('.ul-msg', root).forEach(m => m.classList.remove('show'));
    const first = $('.ul-view.on input', root); if (first) setTimeout(() => first.focus(), 300);
    setVisible(true);
  }
  function setVisible(on) {
    root.classList.toggle('gone', !on);
    document.documentElement.style.overflow = on ? 'hidden' : '';
  }
  function error(form, text) { const m = $('.ul-msg', form); m.textContent = text; m.classList.add('show'); }
  function busy(form, on, label) {
    const b = $('.ul-btn', form);
    if (on) { b.dataset.html = b.innerHTML; b.disabled = true; b.innerHTML = '<span class="ul-spin"></span> ' + (label || 'Patientez…'); }
    else { b.disabled = false; if (b.dataset.html) b.innerHTML = b.dataset.html; }
  }
  // Traduction des erreurs du service de connexion
  function fr(err) {
    const t = String((err && (err.json && (err.json.error_description || err.json.msg || err.json.error))) || (err && err.message) || '');
    if (/no user found|invalid password|invalid_grant|password invalid/i.test(t)) return 'Adresse e-mail ou mot de passe incorrect.';
    if (/not confirmed/i.test(t)) return 'Ce compte n\'est pas encore activé : ouvrez le lien reçu par e-mail.';
    if (/token|not found|expired/i.test(t)) return 'Ce lien n\'est plus valide. Demandez un nouveau lien ou une nouvelle invitation.';
    if (/password/i.test(t) && /short|length|weak/i.test(t)) return 'Mot de passe trop court : 8 caractères minimum.';
    if (/fetch|network|failed/i.test(t)) return 'Connexion au service impossible. Vérifiez votre connexion Internet puis réessayez.';
    return 'Une erreur est survenue. Réessayez dans un instant.' + (t ? ' (' + t + ')' : '');
  }
  // Ouvre le tableau de bord (admin/app.js)
  const enterAdmin = () => {
    flow = false;
    $$('form', root).forEach(f => { busy(f, false); f.reset(); });
    setVisible(false);
    window.UNIR_APP && window.UNIR_APP.start(auth);
  };
  const checkPw = (a, b) => a.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères.' : (a !== b ? 'Les deux mots de passe ne sont pas identiques.' : '');

  // Liens reçus par e-mail : invitation, récupération, confirmation
  const params = new URLSearchParams(location.hash.slice(1));
  const tokenType = ['invite_token', 'recovery_token', 'confirmation_token'].find(k => params.get(k));
  const token = tokenType && params.get(tokenType);
  if (tokenType || params.get('error_description')) history.replaceState(null, '', location.pathname);

  if (!auth) {
    show('login'); error($('[data-view=login]'), 'Le service de connexion n\'a pas pu être chargé. Rechargez la page.');
  } else if (tokenType === 'invite_token') {
    flow = true; show('invite');
  } else if (tokenType === 'recovery_token') {
    flow = true; show('loading', 'Vérification du lien…');
    auth.recover(token, true).then(() => show('reset')).catch(err => { flow = false; show('login'); error($('[data-view=login]'), fr(err)); });
  } else if (tokenType === 'confirmation_token') {
    flow = true; show('loading', 'Activation du compte…');
    auth.confirm(token, true).then(enterAdmin).catch(err => { flow = false; show('login'); error($('[data-view=login]'), fr(err)); });
  } else if (loggedIn() && auth.currentUser()) {
    enterAdmin();               // déjà connecté : le tableau de bord s'ouvre directement
  } else {
    show('login');
  }
  requestAnimationFrame(() => root.classList.add('in'));

  // Connexion
  $('[data-view=login]').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target;
    const email = $('#ul-email').value.trim(), pw = $('#ul-pw').value;
    if (!email || !pw) return error(f, 'Saisissez votre adresse e-mail et votre mot de passe.');
    busy(f, true, 'Connexion…');
    try { await auth.login(email, pw, true); enterAdmin(); }
    catch (err) { busy(f, false); error(f, fr(err)); }
  });
  // Mot de passe oublié
  $('[data-view=forgot]').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target; const email = $('#ul-email2').value.trim();
    if (!email) return error(f, 'Saisissez votre adresse e-mail.');
    busy(f, true, 'Envoi…');
    try { await auth.requestPasswordRecovery(email); } catch (err) { /* même message pour ne pas révéler quels comptes existent */ }
    busy(f, false); $('.ul-ok', f).hidden = false;
  });
  // Invitation
  $('[data-view=invite]').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target; const a = $('#ul-new1').value, b = $('#ul-new2').value;
    const pb = checkPw(a, b); if (pb) return error(f, pb);
    busy(f, true, 'Activation…');
    try { await auth.acceptInvite(token, a, true); enterAdmin(); }
    catch (err) { busy(f, false); error(f, fr(err)); }
  });
  // Nouveau mot de passe
  $('[data-view=reset]').addEventListener('submit', async e => {
    e.preventDefault(); const f = e.target; const a = $('#ul-new3').value, b = $('#ul-new4').value;
    const pb = checkPw(a, b); if (pb) return error(f, pb);
    busy(f, true, 'Enregistrement…');
    try { await auth.currentUser().update({ password: a }); enterAdmin(); }
    catch (err) { busy(f, false); error(f, fr(err)); }
  });
  // Navigation entre les écrans
  $$('[data-go]', root).forEach(a => a.addEventListener('click', () => {
    if (a.dataset.go === 'forgot') $('#ul-email2').value = $('#ul-email').value;
    $('.ul-ok', $('[data-view=forgot]')).hidden = true;
    show(a.dataset.go);
  }));
  // Afficher / masquer les mots de passe
  $$('.ul-eye', root).forEach(btn => btn.addEventListener('click', () => {
    const i = btn.parentElement.querySelector('input'); const s = i.type === 'password';
    i.type = s ? 'text' : 'password'; btn.setAttribute('aria-label', s ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
  }));

  // Appelé par le tableau de bord : déconnexion ou session expirée
  window.UNIR_LOGIN = {
    show(message) {
      show('login');
      if (message) error($('[data-view=login]'), message);
    }
  };

  // Ciel animé (comme sur le site)
  const c = document.getElementById('ul-sky'), x = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, parts = [], doves = [];
  const dove = new Image(); dove.src = '../assets/logo-blanc.png';
  function size() { const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    parts = Array.from({ length: Math.round(W / 14) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .4, s: Math.random() * .35 + .1, o: Math.random() * .6 + .2, p: Math.random() * 6 }));
    doves = Array.from({ length: W < 700 ? 2 : 4 }, () => ({ x: Math.random() * W, y: H * (.15 + Math.random() * .6), s: .25 + Math.random() * .35, sz: 22 + Math.random() * 26, p: Math.random() * 6 })); }
  size(); addEventListener('resize', size);
  function draw(t) {
    if (!root.classList.contains('gone')) {
      x.clearRect(0, 0, W, H);
      for (const p of parts) { p.y -= p.s; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fillStyle = `rgba(255,255,255,${p.o * (.5 + .5 * Math.sin(t / 900 + p.p))})`; x.fill(); }
      if (dove.complete && dove.naturalWidth) {
        const ar = dove.naturalWidth / dove.naturalHeight, sh = dove.naturalHeight * .6;
        for (const d of doves) { d.x += d.s; if (d.x > W + 60) { d.x = -60; d.y = H * (.15 + Math.random() * .6); }
          x.globalAlpha = .09; x.drawImage(dove, 0, 0, dove.naturalWidth, sh, d.x, d.y + Math.sin(t / 1200 + d.p) * 14, d.sz * ar / .6, d.sz); x.globalAlpha = 1; }
      }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
