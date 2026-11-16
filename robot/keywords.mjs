/**
 * Reads posts with the site's own dictionaries (src/taxonomy.js, src/locations.js, src/engine.js),
 * so the robot and the site always agree on what a skill or a place is.
 *
 * In (stdin, JSON):   [ { "id": "...", "title": "...", "text": "full text of the post", "place": "text that may name a place",
 *                         "post": { a whole jobs.json entry },
 *                         "slim": { "title", "req", "exp", "edu" }, "max": 120 }, ... ]   (every key but id is optional)
 * Out (stdout, JSON): { "<id>": { "skills": ["Excel", ...], "place": "Area, District" | "",
 *                                 "read": how the site's matcher understands `post`, or null,
 *                                 "slim": { "edu": a short education line, "skills": [...] } or null }, ... }
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

/* ── a short education line in place of a long one ──
   Some posts carry a whole eligibility section in their education field (thousands of characters of a
   government circular). The site needs only two things from it: the education level, and the skills it
   names. `slim` returns a short line that gives the engine the SAME level, plus the skills that only the
   long text named, so the robot can keep them in the post's keyword line. */
const LEVEL_WORDS = { 0: 'Class 8', 1: 'SSC', 2: 'HSC', 3: 'Diploma', 4: "Bachelor's degree", 5: "Master's degree" };
const levelOf = text => Engine.parseEducation(text, '');            // the education field alone, as the engine reads it
const skillText = p => ' ' + Engine.norm([p.title, p.req, p.edu, p.exp].filter(Boolean).join(' . ')).replace(/tally erp/g, 'tally') + ' ';
const cut = (s, max) => (s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, '')).replace(/[\s,;:(–-]+$/, '');

function slim(p, max) {
  const long = String(p.edu || '').trim();
  if (long.length <= max) return null;
  const level = levelOf(long);
  let edu = '';
  if (level != null) {
    // the first sentence that gives the same level; a long sentence is cut short if it still does
    const sentences = long.split(/(?<=[।;\n])|(?<=[a-zঀ-৿]{3}\.)\s/i).map(s => s.trim().replace(/^[০-৯\d]+[।.)]\s*/, '')).filter(Boolean);
    for (const s of sentences) { const c = cut(s, max); if (c.length >= 3 && levelOf(c) === level) { edu = c; break; } }
    if (!edu) edu = LEVEL_WORDS[level];
  }
  const had = Engine.findSkills(skillText(p)), still = new Set(Engine.findSkills(skillText({ ...p, edu })));
  return { edu, level, skills: had.filter(s => !still.has(s)) };
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
    slim: p.slim ? slim(p.slim, p.max || 120) : null,
  };
}
process.stdout.write(JSON.stringify(out));
