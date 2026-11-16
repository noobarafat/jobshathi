/**
 * Tests for the matching engine (src/engine.js) and its dictionaries.
 * Run from the repository root:  node --test tests/
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(ROOT, p), 'utf8');
const ctx = vm.createContext({ console });
for (const f of ['src/taxonomy.js', 'src/locations.js', 'src/engine.js']) vm.runInContext(read(f), ctx, { filename: f });
const Engine = vm.runInContext('Engine', ctx);
const FIELDS = vm.runInContext('FIELDS', ctx);

const cls = (title, cat = '', context = '') => { const c = Engine.classify(title, cat, [], context || title); return c.field + '/' + (c.role || '-'); };
const one = raw => Engine.prepareJobs([{ id: 'x', ...raw }])[0];
const places = l => l.places.map(p => (p.area ? p.area + ', ' : '') + p.district).join(' / ');

test('dictionary: role ids are unique and every field is complete', () => {
  const seen = new Set();
  for (const f of FIELDS) {
    assert.ok(f.id && f.en && f.bn && f.roles.length && f.skills.length, f.id);
    for (const r of f.roles) { assert.ok(!seen.has(r.id), 'duplicate role id ' + r.id); seen.add(r.id); assert.ok(Array.isArray(r.syn)); }
  }
  // ids that existing profiles may hold must still exist
  for (const id of ['web-dev', 'sqa', 'accountant', 'sales-exec', 'bde', 'digital-marketing', 'hr-exec', 'ie', 'garments-quality', 'civil', 'teacher', 'nurse', 'graphic', 'store', 'data-entry', 'rider', 'govt-assistant']) assert.ok(Engine.roleById[id], id);
  for (const s of ['Excel', 'MS Office', 'JavaScript', 'Tally', 'Manual Testing', 'SEO', 'Networking', 'Cisco']) assert.ok(Engine.skillFields[s], s);
});

test('title: an exact wording gives the role', () => {
  for (const [title, want] of [
    ['Junior Accountant', 'accounting/accountant'], ['SQA Engineer', 'it/sqa'], ['Network Engineer', 'it/it-support'],
    ['Digital Marketing Executive', 'marketing/digital-marketing'], ['Territory Sales Officer', 'sales/tso'],
    ['Senior Staff Nurse', 'health/nurse'], ['Merchandiser (Knit)', 'garments/merchandiser'], ['Legal Officer', 'legal/legal-officer'],
    ['Veterinary Officer (VO)', 'agro/livestock'], ['Fire Safety Officer', 'production/safety'], ['Deputy Librarian', 'education/librarian'],
    ['Sr. Consultant - Cardiology', 'health/doctor'], ['Phlebotomist', 'health/lab-tech'], ['Chinese Interpreter', 'office/interpreter'],
    ['Warehouse Supervisor', 'supply/store'], ['Visa Consultant', 'service/travel'], ['Cloud Infrastructure Engineer', 'it/devops'],
  ]) assert.equal(cls(title), want, title);
});

test('title: Bangla wordings', () => {
  for (const [title, want] of [
    ['হিসাবরক্ষক', 'accounting/accountant'], ['সেলস ইঞ্জিনিয়ার', 'sales/sales-exec'], ['শিক্ষিকা', 'education/teacher'],
    ['ল্যাব টেকনিশিয়ান', 'health/lab-tech'], ['রিসিপশনিস্ট (মেয়ে)', 'office/reception'], ['ডিপ্লোমা মেকানিক্যাল ইঞ্জিনিয়ার', 'engineering/mechanical'],
    ['কম্পিউটার অপারেটর', 'office/data-entry'], ['নিরাপত্তা প্রহরী', 'service/guard'],
  ]) assert.equal(cls(title), want, title);
});

test('title: a loose word counts unless the category points to another field', () => {
  assert.equal(cls('Manager Sales', 'Marketing / Sales'), 'sales/sales-exec');           // the category names both; the title says which
  assert.equal(cls('Senior Manager - Branding', 'Marketing / Sales'), 'marketing/brand');
  assert.equal(cls('Engineer (Quality)', 'Production / Operation / Quality Control'), 'production/prod-quality');
  assert.equal(cls('Manager Administration', 'General Management / Administration'), 'hr/admin');   // a vague category does not block the word
  assert.equal(cls('Assistant Manager – Supply Network Operations', 'Supply Chain / Logistics / Procurement').split('/')[0], 'supply'); // "network" is not IT here
  assert.equal(cls('Operator (Female Only)', 'BPO / Data Entry / Call Center'), 'support/-');
  assert.equal(cls('Officer'), 'null/-');                                                  // nothing to go on
  assert.equal(cls('Regional Manager', 'General Management / Administration'), 'office/-'); // the vague category, as a last resort
});

test('title: production and quality jobs become garments jobs in a garments post', () => {
  assert.equal(cls('Manager - Quality', 'Garments / Textile / RMG'), 'garments/garments-quality');
  assert.equal(cls('Assistant Manager - Quality Assurance', 'Production / Operation / Quality Control', 'Fakir Apparels Ltd. knit garments'), 'garments/garments-quality');
  assert.equal(cls('Production Manager', 'Production / Operation / Quality Control', 'ACME Foods'), 'production/prod-officer');
  assert.equal(cls('Production Officer', '', 'Sweater factory'), 'garments/ie');
});

test('title: a government circular also counts under Government', () => {
  const c = Engine.classify('Accountant', 'Government', [], 'Accountant');
  assert.deepEqual([c.field, c.role, c.also], ['accounting', 'accountant', 'govt']);
  assert.equal(Engine.classify('Upper Division Assistant', 'Government', [], '').also, null);   // already a government role
  assert.equal(Engine.classify('Accountant', 'Accounting / Finance', [], '').also, null);
  const job = one({ title: 'Lineman', cat: 'Government' });
  const hit = Engine.match(Engine.expandProfile({ fields: ['govt'], roles: [], skills: [], level: 'fresher', locations: ['bd'] }), job);
  assert.notEqual(hit.bucket, 'hidden');                                                    // someone who chose only "Government" still sees it
});

test('spelling: a mistake inside a long word is forgiven, a different short word is not', () => {
  assert.equal(cls('Accountent'), 'accounting/accountant');
  assert.equal(cls('Merchandizer'), 'garments/merchandiser');
  assert.equal(cls('Softwere Engineer'), 'it/web-dev');
  assert.notEqual(cls('Deputy Manager, Mechanical').split('/')[0], 'service');            // "Deputy" is not "Duty"
  assert.notEqual(cls('Tr. Assistant Engineer', 'Engineering (Civil / Mechanical / Electrical / Other)').split('/')[0], 'it'); // "Tr." is not "IT"
  assert.notEqual(cls('SAP CO Consultant - IT', 'Information Technology (IT) / Software').split('/')[0], 'health');            // "IT" is not "ENT"
  assert.notEqual(cls('Team Leader').split('/')[1], 'rider');
  assert.equal(cls('Trainee Engineer', 'Information Technology And Services'), 'it/-');     // a trainee is not a "trainer": real words are never "corrected"
  assert.notEqual(cls('Trainee Engineer').split('/')[0], 'education');
});

test('spelling: the fast distance agrees with the plain one', () => {
  const { within } = Engine._internals;
  const plain = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  let seed = 7; const rnd = n => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
  const word = () => Array.from({ length: 3 + rnd(9) }, () => 'abcde'[rnd(5)]).join('');
  for (let i = 0; i < 4000; i++) {
    const a = word(); let b = a.split('');
    for (let k = rnd(4); k > 0; k--) { const at = rnd(b.length + 1), how = rnd(3); if (how === 0) b.splice(at, 0, 'abcde'[rnd(5)]); else if (how === 1 && b.length > 1) b.splice(Math.min(at, b.length - 1), 1); else if (b.length) b[Math.min(at, b.length - 1)] = 'abcde'[rnd(5)]; }
    b = b.join('');
    for (const max of [1, 2]) { const real = plain(a, b); assert.equal(within(a, b, max), real <= max ? real : max + 1, `${a} / ${b} / ${max}`); }
  }
});

test('search: the fast lookup agrees with the plain whole-word search', () => {
  const { found, prep, tokensOf } = Engine._internals;
  const texts = ['senior c# developer (.net core)', 'officer - sales & marketing', 'next.js and node js', 'qa/qc engineer', 'সেলস ইঞ্জিনিয়ার dhaka', 'r&d chemist - hygiene glue', 'it officer', 'digital marketing executive', 'e-commerce sales in-charge'];
  const terms = ['c#', '.net', 'sales', 'sales & marketing', 'js', 'node js', 'qc', 'qa/qc', 'সেলস', 'r&d', 'it', 'digital marketing', 'market', 'e-commerce', 'commerce', 'in', 'charge', 'net', 'next.js'];
  for (const text of texts) for (const term of terms) assert.equal(found(text, tokensOf(text), prep(term)), Engine.hasTerm(text, term), `${term} in ${text}`);
});

test('typed words: a word that names a job title finds that role in either language', () => {
  const name = w => [...Engine.rolesNamed(w)].sort().join(',');
  assert.equal(name('কম্পিউটার অপারেটর'), 'data-entry');
  assert.equal(name('computer operator'), 'data-entry');
  assert.equal(name('Senior Computer Operator'), 'data-entry');
  assert.equal(name('অফিস সহায়ক'), 'govt-support,office-assistant');    // a wording two roles share gives both
  assert.equal(name('factory'), '');                                     // a word that is no job title gives no role
  assert.equal(name('accountent'), '');                                  // and nothing is guessed from a misspelling
  const person = { fields: ['sales'], roles: [], keywords: ['কম্পিউটার অপারেটর'], skills: [], level: 'fresher', locations: ['bd'], avoid: [] };
  const r = Engine.match(Engine.expandProfile(person), one({ title: 'Data Entry Operator', loc: 'Dhaka' }));
  const line = r.checks.find(c => c.k === 'role');
  assert.deepEqual([line.code, line.label], ['keyword', 'কম্পিউটার অপারেটর']);           // "why this matches" shows the word as typed
  assert.notEqual(r.bucket, 'hidden');                                                      // shown, although the person chose another field
  // "don't show" words stay literal: they hide only what names them
  const avoid = { fields: ['office'], roles: [], keywords: [], skills: [], level: 'fresher', locations: ['bd'], avoid: ['computer operator'] };
  assert.equal(Engine.match(Engine.expandProfile(avoid), one({ title: 'Data Entry Operator', loc: 'Dhaka' })).hiddenWhy, null);
  assert.equal(Engine.match(Engine.expandProfile(avoid), one({ title: 'Computer Operator', loc: 'Dhaka' })).hiddenWhy, 'avoid');
});

test('location: spellings, Bangla names, towns and industrial areas', () => {
  for (const [text, want] of [
    ['Mirpur, Dhaka', 'Mirpur, Dhaka'], ['Chittagong', 'Chattogram'], ['চট্টগ্রাম', 'Chattogram'], ['ব্রাহ্মণবাড়িয়া', 'Brahmanbaria'], ['কুড়িগ্রাম', 'Kurigram'],
    ['Basundhara RA', 'Bashundhara, Dhaka'], ['Vatara', 'Vatara, Dhaka'], ['Jamgora, Ashulia', 'Ashulia, Dhaka'], ['Bhaluka', 'Mymensingh'],
    ['Narsinghdi', 'Narsingdi'], ['Mawna, Gazipur', 'Sreepur, Gazipur'], ['Kanchpur, Narayanganj', 'Sonargaon, Narayanganj'], ['Ashuganj', 'Brahmanbaria'],
  ]) assert.equal(places(Engine.parseLocation(text)), want, text);
  assert.ok(Engine.parseLocation('Anywhere in Bangladesh').anywhere);
  assert.ok(Engine.parseLocation('Remote (Worldwide)').remote);
});

test('location: a job abroad is recognised and never counts as a place match', () => {
  const job = one({ title: 'Machine Operator', loc: 'Saudi Arabia' });
  assert.equal(job.loc.abroad, 'Saudi Arabia');
  const r = Engine.match(Engine.expandProfile({ fields: ['production'], roles: [], skills: [], level: 'fresher', locations: ['bd'] }), job);
  const line = r.checks.find(c => c.k === 'loc');
  assert.deepEqual([line.code, line.state], ['abroad', 'partial']);
  assert.equal(Engine.parseLocation('Dhaka, Bangladesh').abroad, null);
});

test('location: read from the title only when the post gives no place', () => {
  assert.equal(places(one({ title: 'Medical Assistant - Noakhali' }).loc), 'Noakhali');
  assert.equal(one({ title: 'Medical Assistant - Noakhali' }).loc.from, 'title');
  assert.equal(places(one({ title: 'Officer (Chattogram Office)', loc: 'Gulshan, Dhaka' }).loc), 'Gulshan, Dhaka');   // the post's own place wins
  assert.equal(places(one({ title: 'Oxygen Plant Operator' }).loc), '');                                                 // "Oxygen" is an area of Chattogram, but not here
  assert.equal(places(one({ title: 'Senior Executive - Production (Savar, EPZ)' }).loc), 'Savar, Dhaka');
  assert.ok(one({ title: 'JavaScript Developer (Remote)' }).loc.remote);
});

test('experience: English and Bangla wordings', () => {
  const exp = (e, r = '') => { const x = Engine.parseExperience(e, r, ''); return x.stated ? `${x.min}-${x.max}${x.fresher ? ' F' : ''}` : 'no'; };
  for (const [text, want] of [
    ['2 to 3 years', '2-3'], ['5+ years', '5-null'], ['At least 2 year(s)', '2-null'], ['two years', '2-null'], ['৩ থেকে ৫ বছর', '3-5'], ['দুই বছর', '2-null'],
    ['6 months', '0.5-null'], ['Freshers can apply', '0-null F'], ['Not required', '0-null F'], ['Entry-level', '0-null F'], ['Mid-level', '3-5'], ['Senior', '5-null'], ['Any', 'no'],
  ]) assert.equal(exp(text), want, text);
  assert.equal(exp('', 'Minimum 3 years of hands-on experience in Laravel'), '3-null');
  assert.equal(exp('', 'Experience: 2-4 years in a similar role'), '2-4');
  assert.equal(exp('', 'কমপক্ষে ২ বছরের অভিজ্ঞতা থাকতে হবে'), '2-null');
  assert.equal(exp('', 'অভিজ্ঞতার প্রয়োজন নেই'), '0-null F');
});

test('experience: the title gives a level when the post states nothing', () => {
  const level = title => { const g = Engine.parseExperience('', '', title).guess; return g ? g.level : null; };
  for (const [title, want] of [
    ['Intern - HR', 'fresher'], ['Management Trainee Officer', 'fresher'], ['Jr. Executive', 'junior'], ['Senior Software Engineer', 'mid'], ['Assistant Manager - Sales', 'mid'],
    ['Senior Manager - ERP', 'senior'], ['General Manager (GM) - Operations', 'senior'], ['Head of IT', 'senior'], ['Assistant Teacher', null], ['Office Assistant', null], ['জুনিয়র অফিসার', 'junior'],
  ]) assert.equal(level(title), want, title);
  assert.equal(Engine.parseExperience('3 years', '', 'Intern').guess, undefined);           // what the post states always wins
  // a guess is a hint: it never hides a job or marks it as a hard mismatch
  const fresher = Engine.expandProfile({ fields: ['it'], roles: [], skills: [], level: 'fresher', locations: ['bd'] });
  const r = Engine.match(fresher, one({ title: 'Senior Software Engineer', loc: 'Dhaka' }));
  assert.equal(r.checks.find(c => c.k === 'exp').state, 'partial');
  assert.notEqual(r.bucket, 'hidden');
});

test('skills: the tags portals use and Bangla terms are understood', () => {
  const skills = req => [...one({ title: 'Officer', req }).skills];   // copied: the engine's arrays come from another context
  assert.deepEqual(skills('Garment industry knowledge, Knit garment production'), ['Garments Production']);
  assert.deepEqual(skills('Administrative support, Back office operations'), ['Office Management']);
  assert.deepEqual(skills('Internal auditing, Financial accounting'), ['Accounting', 'Auditing']);
  assert.deepEqual(skills('কম্পিউটার জ্ঞান ও বাংলা টাইপিং'), ['Bangla Typing', 'MS Office', 'Typing']);
  assert.deepEqual(skills('React, Node.js, TypeScript and AWS'), ['AWS', 'JavaScript', 'Node.js', 'React', 'TypeScript']);   // "Node.js" also says JavaScript
  assert.deepEqual(skills('BBA in Business Administration'), []);                             // a degree is not a skill
});

test('robot dictionary step: a long education field becomes a short line with the same level', async () => {
  const { spawnSync } = await import('node:child_process');
  const ask = posts => JSON.parse(spawnSync(process.execPath, [join(ROOT, 'robot/keywords.mjs')], { input: JSON.stringify(posts), encoding: 'utf8' }).stdout);
  const filler = 'সকল পদের প্রার্থীর বয়স ১৮ থেকে ৩২ বছর হতে হবে। '.repeat(8);
  const cases = [
    { id: 'hsc', edu: filler + 'শিক্ষাগত যোগ্যতা: স্বীকৃত বোর্ড হতে এইচএসসি পাস। কম্পিউটার জ্ঞান থাকতে হবে।', level: 2 },
    { id: 'two-levels', edu: 'Post 1: Bachelor degree in any discipline. ' + filler + 'Post 2: SSC pass with MS Office skills.', level: 1 },
    { id: 'bachelor', edu: "Bachelor's degree in Computer Science or a related field from a reputed university. " + 'Strong knowledge of JavaScript and React. '.repeat(4), level: 4 },
    { id: 'no-level', edu: filler, level: null },
  ];
  const out = ask(cases.map(c => ({ id: c.id, slim: { title: 'Officer', req: '', exp: '', edu: c.edu }, max: 120 })));
  for (const c of cases) {
    const s = out[c.id].slim;
    assert.ok(s, c.id);
    assert.ok(s.edu.length <= 120, `${c.id}: ${s.edu.length} characters`);
    assert.equal(Engine.parseEducation(s.edu, ''), c.level, `${c.id}: "${s.edu}"`);
    assert.equal(s.level, c.level, c.id);
  }
  assert.equal(out['no-level'].slim.edu, '');                                                // nothing to keep
  assert.ok(out['two-levels'].slim.edu.includes('SSC'));                                      // the lowest level a post accepts is kept
  assert.ok(out.hsc.slim.skills.includes('MS Office'));                                        // "কম্পিউটার জ্ঞান" leaves the field, so it is handed back as a skill
  assert.ok([...out.bachelor.slim.skills].includes('JavaScript') && [...out.bachelor.slim.skills].includes('React'));
  assert.equal(ask([{ id: 'short', slim: { title: 'Officer', edu: 'HSC' }, max: 120 }]).short.slim, null);   // a short field is left alone
});

test('speed: reading every real post stays fast enough for a phone', { skip: !existsSync(join(ROOT, 'jobs.json')) }, () => {
  const raw = JSON.parse(read('jobs.json')).jobs;
  const t = Date.now(); const jobs = Engine.prepareJobs(raw); const ms = Date.now() - t;
  assert.ok(jobs.length > 0);
  // about 1.5 s for 1,600 posts on a desktop. It was 60 s before the spelling search was rewritten; this guards against that returning.
  assert.ok(ms < 12000, `prepareJobs took ${ms} ms for ${raw.length} posts`);
});
