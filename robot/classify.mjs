/**
 * Runs the site's own matcher (src/engine.js) over jobs.json and records how well
 * it read each post, so the dictionaries can keep improving.
 *
 * Adds a "matching" section to robot/report.json.
 * Run from the repository root:  node robot/classify.mjs
 * For a rehearsal:               node robot/classify.mjs <jobs file> <report file>
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');

/* The engine is plain browser JavaScript, so it runs in a bare context with the
   same dictionaries the page gives it. */
function loadEngine() {
  const ctx = vm.createContext({ console });
  for (const f of ['src/taxonomy.js', 'src/locations.js', 'src/engine.js']) {
    vm.runInContext(read(f), ctx, { filename: f });
  }
  return vm.runInContext('Engine', ctx);
}

const JOBS_PATH = process.argv[2] || join(ROOT, 'jobs.json');
const REPORT_PATH = process.argv[3] || join(HERE, 'report.json');

function loadJobs() {
  if (!existsSync(JOBS_PATH)) return [];
  const data = JSON.parse(readFileSync(JOBS_PATH, 'utf8'));
  return Array.isArray(data) ? data : (data.jobs || []);
}

/** The existing role whose words overlap a title most, as a starting point for the user. */
function nearestRole(title, roles) {
  const words = new Set(title.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2));
  let best = null;
  for (const r of roles) {
    const rw = r.en.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    const hits = rw.filter(w => words.has(w)).length;
    if (hits && (!best || hits > best.hits)) best = { hits, role: r };
  }
  return best ? best.role : null;
}

const Engine = loadEngine();
const raw = loadJobs();
const readStarted = Date.now();
const jobs = Engine.prepareJobs(raw);
const engineReadMs = Date.now() - readStarted;   // the same work a visitor's phone does when the job list loads
/* the engine does not carry the portal's own category through, so read it from the raw post */
const rawById = new Map(raw.filter(r => r && r.id).map(r => [String(r.id), r]));

/* the engine's own role index, used to suggest where an unknown title could go */
const roleList = Object.values(Engine.roleById || {});

const perSource = {}, how = {};
const noField = [], noLocation = [], noDeadline = [], noSalary = [];
const noRole = [], noLevel = [], noSkill = [];
const unknownTitles = new Map();

for (const j of jobs) {
  const src = j.source || 'unknown';
  perSource[src] = (perSource[src] || 0) + 1;
  how[j.how] = (how[j.how] || 0) + 1;
  if (!j.role) noRole.push(j.title);
  if (!j.exp.stated && !j.exp.guess) noLevel.push(j.title);     // no experience stated, and the title gives no level either
  if (!j.skills.length) noSkill.push(j.title);
  if (!j.field) {
    noField.push({ title: j.title, company: j.company, source: src });
    const key = j.title.trim();
    const e = unknownTitles.get(key) || { title: key, count: 0, sources: new Set(), cats: new Set() };
    e.count++; e.sources.add(src);
    const portalCat = (rawById.get(j.id) || {}).cat;
    if (portalCat) e.cats.add(portalCat);
    unknownTitles.set(key, e);
  }
  if (!j.loc.places.length && !j.loc.remote && !j.loc.anywhere && !j.loc.abroad) {
    noLocation.push({ title: j.title, company: j.company, loc: j.loc.text || '', source: src });
  }
  if (j.deadline == null) noDeadline.push(j.title);
  if (!j.salary) noSalary.push(j.title);
}

const top = [...unknownTitles.values()].sort((a, b) => b.count - a.count).slice(0, 50)
  .map(e => {
    const near = nearestRole(e.title, roleList);
    return {
      title: e.title,
      count: e.count,
      sources: [...e.sources],
      portalCategory: [...e.cats],
      suggestion: near
        ? `add "${e.title.toLowerCase()}" to syn of role "${near.id}" (${near.en}) in src/taxonomy.js`
        : `no close role; may need a new role in src/taxonomy.js`,
    };
  });

const pct = n => (jobs.length ? Math.round((n / jobs.length) * 100) : 0);
const matching = {
  postsRead: jobs.length,
  engineReadMs,                             // on this machine; a phone is several times slower
  postsPerSource: perSource,
  classifiedHow: how,                       // title | spelling | keyword | category | skills | none
  noFieldFound: { count: noField.length, percent: pct(noField.length), examples: noField.slice(0, 10) },
  noRoleFound: { count: noRole.length, percent: pct(noRole.length) },
  noLocationFound: { count: noLocation.length, percent: pct(noLocation.length), examples: noLocation.slice(0, 10) },
  noExperienceLevel: { count: noLevel.length, percent: pct(noLevel.length) },
  noSkillFound: { count: noSkill.length, percent: pct(noSkill.length) },
  noDeadline: { count: noDeadline.length, percent: pct(noDeadline.length) },
  noSalary: { count: noSalary.length, percent: pct(noSalary.length) },
  topUnclassifiedTitles: top,
  note: 'suggestion lines are proposals only; src/taxonomy.js is never changed by the robot',
};

const reportPath = REPORT_PATH;
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : {};
report.matching = matching;
writeFileSync(reportPath, JSON.stringify(report, null, 1) + '\n');

console.log(`matching: ${jobs.length} posts readable, ` +
  `${noField.length} without a field (${pct(noField.length)}%), ` +
  `${noLocation.length} without a location (${pct(noLocation.length)}%)`);
console.log('classified how:', how);
