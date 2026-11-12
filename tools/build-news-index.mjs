// Construit content/actualites-index.json à partir des articles du dossier content/actualites/.
// Lancé automatiquement à chaque publication (voir .github/workflows/deploy.yml).
// Les articles marqués « brouillon » ne sont pas publiés.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'actualites');
const articles = [];

for (const file of readdirSync(dir)) {
  if (!file.endsWith('.json') ) continue;
  let a;
  try {
    a = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    console.warn(`Article ignoré (JSON invalide) : ${file}`);
    continue;
  }
  if (a.brouillon) continue;
  articles.push({
    slug: file.replace(/\.json$/, ''),
    titre: a.titre || '',
    date: a.date || '',
    categorie: a.categorie || '',
    image: a.image || '',
    resume: a.resume || ''
  });
}

articles.sort((x, y) => String(y.date).localeCompare(String(x.date)));
writeFileSync(join(dir, '..', 'actualites-index.json'), JSON.stringify({ articles }, null, 2) + '\n');
console.log(`${articles.length} article(s) publié(s).`);
