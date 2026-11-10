/* ───────── The matching engine ─────────
   1. prepareJobs(raw)  reads each post: field, role, skills, experience, education, age, pay, place, warnings.
   2. rank(profile, jobs, marks)  scores every job for one person and sorts them into
      strong / possible / hidden — nothing is thrown away, a hidden job is still in “All jobs”. */
const Engine = (() => {
  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  const latinDigits = s => s.replace(/[০-৯]/g, d => BN_DIGITS.indexOf(d));
  const norm = s => latinDigits((s == null ? '' : String(s)).toLowerCase()).replace(/[’‘`]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const normTitle = s => norm(s).replace(/[()\[\],:|\/\-]+/g, ' ').replace(/\.(?=\s|$)/g, '').replace(/\s+/g, ' ').trim();
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isLatin = s => /^[\x00-\x7f]+$/.test(s);
  const reCache = new Map();
  /** Is `term` in `text` as a whole word? (Bangla has no word boundary we can trust: a plain search.) */
  function hasTerm(text, term) {
    if (!term) return false;
    if (!isLatin(term)) return text.includes(term);
    let re = reCache.get(term);
    if (!re) { re = new RegExp('(^|[^a-z0-9])' + escRe(term) + '($|[^a-z0-9])'); reCache.set(term, re); }
    return re.test(text);
  }
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }

  /* ── indexes built once ── */
  const fieldById = {}, roleById = {}, synIndex = [], catIndex = [];
  FIELDS.forEach(f => {
    fieldById[f.id] = f;
    (f.cats || []).forEach(c => catIndex.push([c, f.id]));
    f.roles.forEach(r => {
      r.field = f.id; roleById[r.id] = r;
      [r.en, ...r.syn].forEach(s => { const k = normTitle(s); if (k) synIndex.push({ k, words: k.split(' ').length, role: r.id, field: f.id }); });
    });
  });
  synIndex.sort((a, b) => b.k.length - a.k.length);
  catIndex.sort((a, b) => b[0].length - a[0].length);

  const skillFields = {}; // skill → the fields that list it
  FIELDS.forEach(f => f.skills.forEach(s => (skillFields[s] = skillFields[s] || []).push(f.id)));
  const allSkills = Object.keys(skillFields).sort((a, b) => a.localeCompare(b));
  const skillTerms = allSkills.map(s => [s, [...new Set([norm(s), ...(SKILL_ALIASES[s] || []).map(norm)])]]);

  const districtDiv = {}, placeIndex = []; // placeIndex: [key, district, area|null]
  const areaGroup = {};                    // "Dhaka/Mirpur" → group number
  Object.entries(DIVISIONS).forEach(([div, ds]) => ds.forEach(d => { districtDiv[d] = div; placeIndex.push([norm(d), d, null]); }));
  Object.entries(AREA_GROUPS).forEach(([d, groups]) => groups.forEach((g, gi) => g.forEach(a => { areaGroup[d + '/' + a] = gi; placeIndex.push([norm(a), d, a]); })));
  const areaDistrict = {}; placeIndex.forEach(p => { if (p[2]) areaDistrict[p[2]] = p[1]; });
  Object.entries(PLACE_ALIASES).forEach(([k, target]) => {
    if (districtDiv[target]) placeIndex.push([norm(k), target, null]);
    else if (areaDistrict[target]) placeIndex.push([norm(k), areaDistrict[target], target]);
  });
  placeIndex.sort((a, b) => b[0].length - a[0].length);

  /* ── reading one post ── */
  function fieldFromCat(cat) {
    const c = norm(cat); if (!c) return null;
    const hit = catIndex.find(([k]) => hasTerm(c, k));
    return hit ? hit[1] : null;
  }

  /** The field and role a job title means: exact wording first, then a near spelling, then the portal's category, then the skills. */
  function classify(title, cat, skills) {
    const t = normTitle(title), catField = fieldFromCat(cat);
    let best = null;
    for (const s of synIndex) {
      if (!hasTerm(t, s.k)) continue;
      const w = s.k.length + (s.field === catField ? 100 : 0);
      if (!best || w > best.w) best = { w, role: s.role, field: s.field, how: 'title' };
    }
    if (!best) { // a spelling mistake: “Accountent”, “Merchandizer”
      const words = t.split(' ');
      for (const s of synIndex) {
        if (s.k.length < 6 || !isLatin(s.k)) continue;
        for (let i = 0; i + s.words <= words.length; i++) {
          const win = words.slice(i, i + s.words).join(' ');
          if (Math.abs(win.length - s.k.length) > 2) continue;
          const d = lev(win, s.k);
          if (d > 0 && d / s.k.length <= 0.18) {
            const w = s.k.length - d + (s.field === catField ? 100 : 0);
            if (!best || w > best.w) best = { w, role: s.role, field: s.field, how: 'spelling' };
          }
        }
      }
    }
    if (best) return { field: best.field, role: best.role, how: best.how };
    if (catField) return { field: catField, role: null, how: 'category' };
    const votes = {}; // skills only one or two fields use
    (skills || []).forEach(s => { const fs = skillFields[s] || []; if (fs.length <= 2) fs.forEach(f => (votes[f] = (votes[f] || 0) + 1)); });
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) return { field: top[0], role: null, how: 'skills' };
    return { field: null, role: null, how: 'none' };
  }

  function findSkills(text) {
    const out = [];
    for (const [name, terms] of skillTerms) if (terms.some(t => hasTerm(text, t))) out.push(name);
    return out;
  }

  function parseExperience(expText, reqText) {
    const e = norm(expText), r = norm(reqText);
    const fresher = /fresh|no experience|not required|not needed|^na$|^n\/a$|অভিজ্ঞতা (প্রয়োজন|লাগবে) (নেই|না)|ফ্রেশার/.test(e) || /fresh(er|ers)?\s*(are|can|may)?\s*(also\s*)?(be\s*)?(encouraged|apply|welcome)|no experience (is )?(needed|required)|ফ্রেশার/.test(r);
    const read = s => {
      let m = s.match(/(\d+(?:\.\d+)?)\s*(?:to|-|থেকে)\s*(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|বছর)/); if (m) return { min: +m[1], max: +m[2] };
      m = s.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?|বছর)/); if (m) return { min: +m[1], max: null };
      m = s.match(/(\d+)\s*\+?\s*(?:months?|মাস)/); if (m) return { min: Math.round(+m[1] / 12 * 10) / 10, max: null };
      return null;
    };
    let got = read(e);
    if (!got) { const m = r.match(/(?:at least|minimum|min\.?)?\s*\d+(?:\.\d+)?(?:\s*(?:to|-)\s*\d+(?:\.\d+)?)?\s*\+?\s*(?:years?|yrs?|months?|বছর|মাস)['’s]*\s*(?:of\s*)?(?:previous\s*|relevant\s*|work(?:ing)?\s*|professional\s*|practical\s*)*(?:experience|অভিজ্ঞতা)/); if (m) got = read(m[0]); }
    if (!got) return fresher ? { min: 0, max: null, fresher: true, stated: true } : { min: null, max: null, fresher: false, stated: false };
    return { ...got, fresher: fresher || got.min === 0, stated: true };
  }

  function parseEducation(eduText, reqText) {
    const scan = s => {
      let t = norm(s); const found = [];
      if (/master|\bmba\b|\bm\.?sc\b|\bm\.?com\b|\bm\.a\b|post[- ]?graduat|স্নাতকোত্তর|মাস্টার্স/.test(t)) found.push(5);
      t = t.replace(/post[- ]?graduat\w*/g, ' ');
      if (/bachelor|\bbba\b|\bb\.?sc\b|\bb\.?com\b|honou?rs|graduat|\bb\.a\b|\bllb\b|\bmbbs\b|\bb\.?pharm|স্নাতক|অনার্স|ডিগ্রি/.test(t.replace(/স্নাতকোত্তর/g, ' '))) found.push(4);
      if (/diploma|ডিপ্লোমা/.test(t)) found.push(3);
      if (/hsc|h\.s\.c|alim|higher secondary|এইচএসসি|উচ্চ মাধ্যমিক/.test(t)) found.push(2);
      t = t.replace(/higher secondary|উচ্চ মাধ্যমিক/g, ' ');
      if (/ssc|s\.s\.c|dakhil|secondary|এসএসসি|মাধ্যমিক/.test(t)) found.push(1);
      if (/class (8|eight|five|5)|অষ্টম শ্রেণি|jsc/.test(t)) found.push(0);
      return found.length ? Math.min(...found) : null;
    };
    const lvl = scan(eduText); if (lvl != null) return lvl;
    const m = norm(reqText).match(/[^.]*(education|qualification|degree|শিক্ষাগত)[^.]*/); // only a sentence about education
    return m ? scan(m[0]) : null;
  }

  function parseAge(text) {
    const t = norm(text);
    let m = t.match(/(?:age|বয়স)[^.\d]{0,25}(\d{2})\s*(?:to|-|থেকে)\s*(\d{2})/); if (m) return { min: +m[1], max: +m[2] };
    m = t.match(/(?:age|বয়স)[^.\d]{0,30}(?:max(?:imum)?|at most|not (?:over|more than)|below|under|up to|সর্বোচ্চ)\s*(\d{2})/); if (m) return { min: null, max: +m[1] };
    m = t.match(/(?:age|বয়স)[^.\d]{0,30}(?:min(?:imum)?|at least|above|over|সর্বনিম্ন)\s*(\d{2})/); if (m) return { min: +m[1], max: null };
    return null;
  }

  function parseSalary(text) {
    const t = norm(text).replace(/,/g, '');
    if (!t) return null;
    const nums = [];
    t.replace(/(\d+(?:\.\d+)?)\s*k\b/g, (_, n) => { nums.push(Math.round(+n * 1000)); return ' '; }).replace(/\d{4,7}/g, n => { nums.push(+n); return n; });
    if (!nums.length) return null;
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }

  function parseType(typeText, title) {
    const t = norm(typeText) + ' ' + norm(title);
    if (/(^|[^a-z])intern(ship)?s?($|[^a-z])/.test(t) || /ইন্টার্ন/.test(t)) return 'intern';
    if (/part[- ]?time|পার্ট/.test(t)) return 'part';
    if (/contract|project based|temporary|চুক্তি/.test(t)) return 'contract';
    return 'full';
  }

  /** Where a job is: remote, anywhere in Bangladesh, and the districts and areas its location line names. */
  function parseLocation(locText) {
    let t = norm(locText).replace(/[,;()\/]+/g, ' , ');
    const out = { text: (locText || '').trim(), remote: false, anywhere: false, places: [] };
    if (!t) return out;
    if (/remote|work from home|wfh|home[- ]based|রিমোট|বাসা থেকে/.test(t)) out.remote = true;
    if (/anywhere in bangladesh|all over bangladesh|across bangladesh|nationwide|any district|any where in bangladesh|সারা ?দেশ|বাংলাদেশের যেকোনো|যে কোনো জেলা/.test(t)) out.anywhere = true;
    const named = new Set(), hits = [];
    for (const [key, district, area] of placeIndex) {
      if (!hasTerm(t, key)) continue;
      t = t.split(key).join(' # '); // a longer name is taken out so its parts do not match again (“Old Dhaka” → not also “Dhaka”)
      hits.push({ district, area, explicit: !area });
      if (!area) named.add(district);
    }
    // an area name that also exists elsewhere (“New Market”, “EPZ”) counts only if its own district is not contradicted
    const kept = hits.filter(h => !h.area || !named.size || named.has(h.district));
    const withArea = new Set(kept.filter(h => h.area).map(h => h.district));
    kept.forEach(h => {
      if (!h.area && withArea.has(h.district)) return; // “Mirpur, Dhaka” is Mirpur, not also all of Dhaka
      if (!out.places.some(p => p.district === h.district && p.area === h.area)) out.places.push({ district: h.district, area: h.area });
    });
    return out;
  }

  const DAY = 86400000;
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

  /** raw posts → jobs the matcher can use. Expired posts are left out; the same post from two sources comes once. */
  function prepareJobs(rawList, now = new Date()) {
    const today = startOfDay(now).getTime(), seen = new Map(), jobs = [];
    for (const raw of rawList || []) {
      if (!raw || !raw.title) continue;
      const text = norm([raw.title, raw.req, raw.edu, raw.exp].filter(Boolean).join(' . ')).replace(/tally erp/g, 'tally');
      const padded = ' ' + text + ' ';
      const skills = findSkills(padded);
      const cls = classify(raw.title, raw.cat, skills);
      const postedAt = raw.postedAt ? startOfDay(raw.postedAt).getTime() : today - (raw.posted || 0) * DAY;
      const deadline = raw.deadline ? startOfDay(raw.deadline).getTime() : (raw.deadlineIn != null ? today + raw.deadlineIn * DAY : null);
      if (deadline != null && deadline < today) continue;
      const g = norm(raw.req);
      const job = {
        id: String(raw.id || (normTitle(raw.title) + '|' + norm(raw.company))),
        title: raw.title.trim(), company: (raw.company || '').trim(), source: raw.source || '', url: raw.url || '', logo: raw.logo || '', site: raw.site || '', vacancies: raw.vacancies || null,
        field: cls.field, role: cls.role, how: cls.how, skills, text: padded,
        exp: parseExperience(raw.exp, raw.req), edu: parseEducation(raw.edu, raw.req), eduText: (raw.edu || '').trim(),
        age: parseAge([raw.age ? 'age ' + raw.age : '', raw.req].filter(Boolean).join(' . ')), salary: parseSalary(raw.salary), salaryText: (raw.salary || '').trim(),
        type: parseType(raw.type, raw.title), loc: parseLocation(raw.loc),
        gender: /only females?|female candidates? only|females? only|শুধুমাত্র নারী|শুধু নারী/.test(g) ? 'female' : (/only males?|male candidates? only|(^|[^e])males? only|শুধুমাত্র পুরুষ|শুধু পুরুষ/.test(g) ? 'male' : null),
        scam: SCAM_PATTERNS.some(re => re.test(raw.req || '') || re.test(raw.title || '') || re.test(raw.salary || '')),
        postedAt, deadline, daysLeft: deadline == null ? null : Math.round((deadline - today) / DAY), isNew: today - postedAt < DAY,
        alsoOn: [],
      };
      const key = normTitle(raw.title) + '|' + norm(raw.company);
      if (seen.has(key)) { const first = seen.get(key); if (job.source && job.source !== first.source && !first.alsoOn.includes(job.source)) first.alsoOn.push(job.source); continue; }
      seen.set(key, job); jobs.push(job);
    }
    return jobs;
  }

  /* ── one person against one job ── */
  function expandProfile(p) {
    const roles = new Set(p.roles || []);
    const fields = new Set(p.fields || []);
    roles.forEach(r => roleById[r] && fields.add(roleById[r].field));
    const fieldsAllRoles = new Set([...fields].filter(f => ![...roles].some(r => roleById[r] && roleById[r].field === f))); // a field chosen with no role: every role in it
    const level = EXP_LEVELS.find(l => l.id === p.level) || EXP_LEVELS[0];
    const locs = (p.locations || []).slice();
    return {
      roles, fields, fieldsAllRoles, years: level.years,
      keywords: (p.keywords || []).map(norm).filter(Boolean), avoid: (p.avoid || []).map(norm).filter(Boolean),
      skills: new Set(p.skills || []), customSkills: (p.skills || []).filter(s => !skillFields[s]).map(norm),
      edu: p.edu == null ? null : +p.edu, age: p.age ? +p.age : null, minSalary: p.minSalary ? +p.minSalary : null,
      types: new Set(p.types && p.types.length ? p.types : JOB_TYPES.map(t => t.id)),
      remote: locs.includes('remote'), bd: locs.includes('bd') || !locs.some(l => l !== 'remote') && !locs.includes('remote'),
      places: locs.filter(l => l.includes(':')).map(l => { const [kind, v] = l.split(':'); if (kind === 'area') { const [d, a] = v.split('/'); return { kind, district: d, area: a }; } return kind === 'dist' ? { kind, district: v } : { kind, division: v }; }),
    };
  }

  function locFit(x, job) {
    const L = job.loc, placeName = p => (p.area ? p.area + ', ' : '') + p.district;
    let best = null;
    const take = (pts, state, label, code) => { if (!best || pts > best.pts) best = { pts, state, label, code }; };
    if (L.remote) x.remote ? take(15, 'ok', 'Remote', 'remote') : take(7, 'maybe', 'Remote', 'remoteNotAsked');
    if (L.anywhere) take(12, 'ok', L.text || 'Anywhere in Bangladesh', 'anywhere');
    for (const p of L.places) {
      if (x.bd) take(12, 'ok', placeName(p), 'bd');
      for (const u of x.places) {
        if (u.kind === 'div' && districtDiv[p.district] === u.division) take(12, 'ok', placeName(p), 'div');
        if (u.kind === 'dist' && p.district === u.district) take(14, 'ok', placeName(p), 'dist');
        if (u.kind === 'area' && p.district === u.district) {
          if (p.area === u.area) take(15, 'ok', placeName(p), 'area');
          else if (!p.area) take(9, 'maybe', p.district, 'areaUnknown');
          else if (areaGroup[p.district + '/' + p.area] === areaGroup[u.district + '/' + u.area]) take(11, 'near', placeName(p), 'near:' + u.area);
          else take(3, 'maybe', placeName(p), 'otherPart');
        }
      }
    }
    if (!best) {
      if (!L.places.length && !L.remote && !L.anywhere) return { pts: 6, state: 'unknown', label: L.text || '', code: 'unknown' };
      return { pts: 0, state: 'no', label: L.places.map(placeName).join(' / ') || L.text, code: 'no' };
    }
    return best;
  }

  /** Score one job for one (expanded) profile. Returns the points, the bucket and the checklist the card shows. */
  function match(x, job, dismissedRoles = {}) {
    const checks = [];
    // 1. is it their kind of work?
    let rolePts = 0, roleCode = 'none', roleLabel = '';
    const kwTitle = x.keywords.find(k => hasTerm(' ' + normTitle(job.title) + ' ', k));
    const kwText = !kwTitle && x.keywords.find(k => hasTerm(job.text, k));
    if (job.role && x.roles.has(job.role)) { rolePts = 40; roleCode = 'role'; roleLabel = roleById[job.role].en; }
    else if (kwTitle) { rolePts = 40; roleCode = 'keyword'; roleLabel = kwTitle; }
    else if (job.field && x.fieldsAllRoles.has(job.field)) { rolePts = 34; roleCode = 'field'; roleLabel = fieldById[job.field].en; }
    else if (job.field && x.fields.has(job.field)) { rolePts = 24; roleCode = 'sameField'; roleLabel = job.role ? roleById[job.role].en : fieldById[job.field].en; }
    else if (kwText) { rolePts = 22; roleCode = 'keywordText'; roleLabel = kwText; }

    // 2. skills
    const matched = job.skills.filter(s => x.skills.has(s)), missing = job.skills.filter(s => !x.skills.has(s));
    x.customSkills.forEach(s => { if (hasTerm(job.text, s)) matched.push(s); });
    let skillPts = 8;
    if (x.skills.size && job.skills.length) {
      skillPts = matched.length ? Math.min(20, 8 + Math.round(12 * matched.length / (matched.length + missing.length))) : 3;
      checks.push({ k: 'skills', state: !missing.length ? 'ok' : (matched.length ? 'partial' : 'warn'), matched, missing });
    } else if (job.skills.length) checks.push({ k: 'skills', state: 'info', matched: [], missing });
    if (!rolePts && matched.length >= 2) { rolePts = 16; roleCode = 'skills'; roleLabel = matched.slice(0, 2).join(', '); }
    if (rolePts) checks.unshift({ k: 'role', state: rolePts >= 34 ? 'ok' : 'partial', code: roleCode, label: roleLabel });

    // 3. place
    const loc = locFit(x, job);
    checks.push({ k: 'loc', state: loc.state === 'ok' ? 'ok' : (loc.state === 'no' ? 'warn' : (loc.state === 'unknown' ? 'info' : 'partial')), code: loc.code, label: loc.label });

    // 4. experience
    let expPts = 6, hard = false;
    if (job.exp.stated) {
      const need = job.exp.min || 0;
      if (x.years >= need || (job.exp.fresher && x.years === 0)) { expPts = 10; checks.push({ k: 'exp', state: 'ok', need, max: job.exp.max, fresher: job.exp.fresher }); }
      else if (need - x.years <= 1) { expPts = 4; checks.push({ k: 'exp', state: 'partial', need, max: job.exp.max }); }
      else { expPts = -10; hard = true; checks.push({ k: 'exp', state: 'warn', need, max: job.exp.max }); }
    }
    // 5. education
    let eduPts = 3;
    if (job.edu != null && x.edu != null) {
      if (x.edu >= job.edu) { eduPts = 5; checks.push({ k: 'edu', state: 'ok', need: job.edu }); }
      else { eduPts = -8; hard = true; checks.push({ k: 'edu', state: 'warn', need: job.edu }); }
    }
    // 6. age
    let agePts = 1;
    if (job.age && x.age) {
      const ok = (job.age.min == null || x.age >= job.age.min) && (job.age.max == null || x.age <= job.age.max);
      agePts = ok ? 2 : -6; if (!ok) hard = true;
      checks.push({ k: 'age', state: ok ? 'ok' : 'warn', min: job.age.min, max: job.age.max });
    } else if (job.age) checks.push({ k: 'age', state: 'info', min: job.age.min, max: job.age.max });
    // 7. pay
    let payPts = 2;
    if (job.salary && x.minSalary) {
      const ok = job.salary.max >= x.minSalary; payPts = ok ? 4 : -8;
      checks.push({ k: 'pay', state: ok ? 'ok' : 'warn', min: job.salary.min, max: job.salary.max });
    }
    // 8. kind of job
    let typePts = 4;
    if (!x.types.has(job.type)) { typePts = -6; checks.push({ k: 'type', state: 'warn', type: job.type }); }

    const avoided = x.avoid.find(w => hasTerm(job.text, w));
    let score = rolePts + skillPts + loc.pts + expPts + eduPts + agePts + payPts + typePts - Math.min(15, 5 * (dismissedRoles[job.role || job.field] || 0));
    score = Math.max(0, Math.min(100, Math.round(score)));
    let bucket, hiddenWhy = null;
    if (avoided) { bucket = 'hidden'; hiddenWhy = 'avoid'; }
    else if (!rolePts) { bucket = 'hidden'; hiddenWhy = 'field'; }
    else if (loc.state === 'no') { bucket = 'hidden'; hiddenWhy = 'location'; }
    else bucket = score >= 64 && !hard && (rolePts >= 34 || (rolePts >= 24 && matched.length > 0)) ? 'strong' : 'possible';
    const judged = checks.filter(c => c.state !== 'info');
    return { job, score, bucket, hiddenWhy, avoided, checks, met: judged.filter(c => c.state === 'ok').length, of: judged.length };
  }

  /** Every job scored and sorted for one person. marks = { dismissed: {jobId: time} } */
  function rank(profile, jobs, marks = {}) {
    const x = expandProfile(profile), dismissedRoles = {};
    const byId = {}; jobs.forEach(j => (byId[j.id] = j));
    Object.keys(marks.dismissed || {}).forEach(id => { const j = byId[id]; if (j) { const k = j.role || j.field; if (k) dismissedRoles[k] = (dismissedRoles[k] || 0) + 1; } });
    return jobs.map(j => match(x, j, dismissedRoles)).sort((a, b) => b.score - a.score || b.job.postedAt - a.job.postedAt);
  }

  /** The skills the person's matches ask for most that are not in the profile. */
  function skillGaps(results, limit = 3) {
    const pool = results.filter(r => r.bucket !== 'hidden'), count = {};
    pool.forEach(r => { const c = r.checks.find(c => c.k === 'skills'); (c ? c.missing : []).forEach(s => (count[s] = (count[s] || 0) + 1)); });
    return Object.entries(count).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([skill, n]) => ({ skill, n, of: pool.length }));
  }

  return { prepareJobs, rank, skillGaps, classify, parseLocation, expandProfile, match, fieldById, roleById, allSkills, skillFields, districtDiv, norm, hasTerm };
})();

