// Gestion des administrateurs (Netlify Identity) depuis l'espace admin.
// Réservé aux personnes connectées : Netlify vérifie le jeton envoyé par le tableau de bord.
const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext || {};
  if (!user) return json(401, { error: 'Connexion requise' });
  if (!identity || !identity.url || !identity.token) return json(500, { error: 'Service de comptes indisponible' });
  const call = (path, opts = {}) => fetch(identity.url + path, { ...opts, headers: { Authorization: 'Bearer ' + identity.token, 'Content-Type': 'application/json' } });

  try {
    if (event.httpMethod === 'GET') {
      const r = await call('/admin/users?per_page=100');
      if (!r.ok) return json(r.status, { error: 'Liste indisponible' });
      const d = await r.json();
      const users = (d.users || []).map(u => ({ id: u.id, email: u.email, confirmed: !!u.confirmed_at, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at || null }))
        .sort((a, b) => a.email.localeCompare(b.email));
      return json(200, { users });
    }
    const body = JSON.parse(event.body || '{}');
    if (event.httpMethod === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Adresse e-mail invalide' });
      const r = await call('/invite', { method: 'POST', body: JSON.stringify({ email }) });
      if (!r.ok) { const t = await r.text(); return json(r.status, { error: t.slice(0, 200) || 'Invitation impossible' }); }
      return json(200, { ok: true });
    }
    if (event.httpMethod === 'DELETE') {
      const id = String(body.id || '');
      if (!id) return json(400, { error: 'Compte manquant' });
      if (id === user.sub) return json(400, { error: 'Vous ne pouvez pas retirer votre propre compte' });
      const r = await call('/admin/users/' + encodeURIComponent(id), { method: 'DELETE' });
      if (!r.ok) return json(r.status, { error: 'Suppression impossible' });
      return json(200, { ok: true });
    }
    return json(405, { error: 'Méthode non autorisée' });
  } catch (e) {
    return json(500, { error: 'Erreur du serveur' });
  }
};
