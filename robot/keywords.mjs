/**
 * Reads posts with the site's own dictionaries (src/taxonomy.js, src/locations.js, src/engine.js),
 * so the robot and the site always agree on what a skill or a place is.
 *
 * In (stdin, JSON):   [ { "id": "...", "title": "...", "text": "full text of the post", "place": "text that may name a place",
 *                         "post": { a whole jobs.json entry } }, ... ]      (every key but id is optional)
 * Out (stdout, JSON): { "<id>": { "skills": ["Excel", ...], "place": "Area, District" | "",
 *                                 "read": how the site's matcher understands `post`, or null }, ... }
 *
 * `text` is read here and thrown away: only the skill names found in it are returned.
 * Used by robot/run.py and robot/pilot.py.  Run from the repository root:  node robot/keywords.mjs < posts.json
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console });
for (const f of ['src/taxonomy.js', 'src/locations.js', 'src/engine.js']) {
  vm.runInContext(readFileSync(join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const Engine = vm.runInContext('Engine', ctx);

const placeWords = l => l.places.map(x => (x.area ? x.area + ', ' : '') + x.district).join(' / ');

/** What the site's matcher makes of one stored post: the same reading a visitor's phone does. */
function reading(post) {
  const j = Engine.prepareJobs([post])[0];
  if (!j) return null;                                   // no title, or its deadline has passed
  const role = j.role && Engine.roleById[j.role], field = j.field && Engine.fieldById[j.field];
  return {
    field: j.field, fieldName: field ? field.en : '', role: j.role, roleName: role ? role.en : '', also: j.also, how: j.how,
    place: placeWords(j.loc) || (j.loc.abroad ? 'abroad: ' + j.loc.abroad : ''), remote: j.loc.remote, anywhere: j.loc.anywhere, placeFrom: j.loc.from || 'post',
    located: j.loc.places.length > 0 || j.loc.remote || j.loc.anywhere || !!j.loc.abroad,
    experience: j.exp.stated ? { min: j.exp.min, max: j.exp.max, fresher: j.exp.fresher } : null,
    levelFromTitle: !j.exp.stated && j.exp.guess ? j.exp.guess.level : null,
    education: j.edu, type: j.type, skills: [...j.skills],
  };
}

const posts = JSON.parse(readFileSync(0, 'utf8') || '[]');
const out = {};
for (const p of posts) {
  const text = ' ' + Engine.norm([p.title, p.text].filter(Boolean).join(' . ')) + ' ';
  const where = p.place ? Engine.parseLocation(p.place, true) : null;   // only names that are safe to read out of a name or title
  out[p.id] = {
    skills: p.title || p.text ? [...Engine.findSkills(text, true)] : [],     // strict: this is running text, not a keyword line
    place: where ? placeWords(where) : '',
    read: p.post ? reading(p.post) : null,
  };
}
process.stdout.write(JSON.stringify(out));
