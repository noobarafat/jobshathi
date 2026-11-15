/**
 * Smoke test: stops a broken build from reaching the live site.
 *
 * Run after the build, from the repository root:
 *   python3 build.py && node tests/smoke.mjs
 *
 * It checks that dist/ is complete, that every script in the page parses, that the
 * matching engine gives sensible results for three sample people, and (when jobs.json
 * exists) that the engine can read the real posts. Any failure exits with code 1.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const failures = [];
let passed = 0;
function check(name, fn) {
  try {
    const r = fn();
    if (r === false) throw new Error('was false');
    passed++; console.log('  ok   ' + name);
  } catch (e) { failures.push(name); console.log('  FAIL ' + name + ': ' + e.message); }
}
const need = (cond, msg) => { if (!cond) throw new Error(msg); };

/* ── 1. the built site ── */
console.log('Built site (dist/)');
check('dist/index.html exists', () => existsSync(join(ROOT, 'dist/index.html')));
const page = existsSync(join(ROOT, 'dist/index.html')) ? read('dist/index.html') : '';
check('every @inline line was replaced', () => need(!/<!-- @inline /.test(page), 'an @inline marker is left in the page'));
check('the page has its app root and a title', () => need(page.includes('id="app"') && /<title>[^<]+<\/title>/.test(page), 'missing #app or <title>'));
check('every script in the page parses', () => {
  const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  need(scripts.length > 0, 'no inline script found');
  scripts.forEach((code, i) => new vm.Script(code, { filename: `inline-script-${i}.js` }));
});
check('no secret key in the page', () => {
  // The Firebase web config is public by design. These must never be in the page.
  need(!/GEMINI|"private_key"|BEGIN PRIVATE KEY|service_account/i.test(page), 'something that looks like a secret is in the page');
});
check('manifest is valid and its icons exist', () => {
  const m = JSON.parse(read('dist/manifest.webmanifest'));
  need(m.name && m.start_url && m.display === 'standalone', 'name, start_url or display missing');
  need(m.icons.some(i => i.purpose === 'maskable'), 'no maskable icon');
  m.icons.forEach(i => need(existsSync(join(ROOT, 'dist', i.src)), 'missing icon ' + i.src));
  (m.shortcuts || []).forEach(s => need(/^\.\//.test(s.url), 'shortcut url must be relative: ' + s.url));
});
check('version.json matches the page', () => {
  const v = JSON.parse(read('dist/version.json')).v;
  need(/^[0-9a-f]{12}$/.test(v), 'bad version: ' + v);
  need(page.includes(`const APP_VERSION = '${v}'`), 'the page carries a different version');
  need(!page.includes('__APP_VERSION__'), 'the version marker was not replaced');
});
check('service worker parses', () => { new vm.Script(read('dist/sw.js'), { filename: 'sw.js' }); });

/* ── 2. the matching engine ── */
console.log('Matching engine');
const ctx = vm.createContext({ console });
for (const f of ['src/taxonomy.js', 'src/locations.js', 'src/jobs-sample.js', 'src/engine.js']) vm.runInContext(read(f), ctx, { filename: f });
const Engine = vm.runInContext('Engine', ctx);
const SAMPLE = vm.runInContext('SAMPLE_JOBS', ctx);
const sampleJobs = Engine.prepareJobs(SAMPLE);
check('example posts are readable', () => need(sampleJobs.length >= 20, 'only ' + sampleJobs.length + ' example posts'));

const PEOPLE = {
  'SQA fresher': { fields: ['it'], roles: [], keywords: ['sqa', 'qa'], skills: ['Manual Testing'], level: 'fresher', edu: 4, types: [], locations: ['dist:Dhaka'], avoid: [] },
  'digital marketer': { fields: ['marketing'], roles: [], keywords: ['digital marketing'], skills: ['SEO'], level: '1-3', edu: 4, types: [], locations: ['dist:Dhaka', 'remote'], avoid: [] },
  'network engineer': { fields: ['it'], roles: [], keywords: ['network'], skills: ['Networking'], level: '1-3', edu: 4, types: [], locations: ['bd'], avoid: [] },
};
for (const [who, profile] of Object.entries(PEOPLE)) {
  check(`${who}: scores are 0-100 and something matches`, () => {
    const results = Engine.rank(profile, sampleJobs, {});
    need(results.length === sampleJobs.length, 'a job was dropped: every job must get a result');
    results.forEach(r => need(Number.isFinite(r.score) && r.score >= 0 && r.score <= 100, 'score out of range: ' + r.score));
    need(results.some(r => r.bucket !== 'hidden'), 'nothing matched');
    need(results.every(r => ['strong', 'possible', 'hidden'].includes(r.bucket)), 'unknown bucket');
  });
}

/* ── 3. the real posts, when the robot has written them ── */
if (existsSync(join(ROOT, 'jobs.json'))) {
  console.log('jobs.json');
  let raw = [];
  check('jobs.json is valid JSON with posts', () => {
    const data = JSON.parse(read('jobs.json'));
    raw = Array.isArray(data) ? data : data.jobs;
    need(Array.isArray(raw) && raw.length > 0, 'no posts');
  });
  check('every post has a title and a safe link', () => {
    raw.forEach(j => {
      need(j && typeof j.title === 'string' && j.title.trim(), 'a post has no title');
      need(!j.url || /^https?:\/\//i.test(j.url), 'link is not http(s): ' + j.url);
    });
  });
  check('the engine reads the real posts', () => {
    const jobs = Engine.prepareJobs(raw);
    need(jobs.length > 0, 'the engine kept none of the ' + raw.length + ' posts');
    const results = Engine.rank(PEOPLE['SQA fresher'], jobs, {});
    need(results.length === jobs.length, 'a job was dropped while ranking');
  });
  check('dist/jobs.json was copied', () => existsSync(join(ROOT, 'dist/jobs.json')));
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log('Failed: ' + failures.join('; ')); process.exit(1); }
