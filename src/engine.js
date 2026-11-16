/* ───────── The matching engine ─────────
   1. prepareJobs(raw)  reads each post: field, role, skills, experience, education, age, pay, place, warnings.
   2. rank(profile, jobs, marks)  scores every job for one person and sorts them into
      strong / possible / hidden — nothing is thrown away, a hidden job is still in “All jobs”. */
const Engine = (() => {
  const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
  const latinDigits = s => s.replace(/[০-৯]/g, d => BN_DIGITS.indexOf(d));
  // NFC first: Bangla letters such as য় and ড় can be typed in two ways, and both must compare equal
  const norm = s => latinDigits((s == null ? '' : String(s)).normalize('NFC').toLowerCase()).replace(/[’‘`]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const normTitle = s => norm(s).replace(/[()\[\],:|\/\-]+/g, ' ').replace(/\.(?=\s|$)/g, '').replace(/\s+/g, ' ').trim();
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isLatin = s => /^[\x00-\x7f]+$/.test(s);
  /** A pattern holding Bangla, brought to the same normal form norm() gives the text. */
  const nfc = rx => new RegExp(rx.source.normalize('NFC'), rx.flags);
  const reCache = new Map();
  /** Is `term` in `text` as a whole word? (Bangla has no word boundary we can trust: a plain search.) */
  function hasTerm(text, term) {
    if (!term) return false;
    if (!isLatin(term)) return text.includes(term);
    let re = reCache.get(term);
    if (!re) { re = new RegExp('(^|[^a-z0-9])' + escRe(term) + '($|[^a-z0-9])'); reCache.set(term, re); }
    return re.test(text);
  }

  /* ── searching fast ──
     Reading 1,600 posts means hundreds of thousands of "is this term in this text?" questions, on phones
     too. Most terms are plain words, and a plain word is in a text exactly when it is one of the text's
     tokens, so a Set lookup answers most of them. `found` always gives the same answer as `hasTerm`. */
  const prep = k => { const latin = isLatin(k); return { k, latin, simple: latin && /^[a-z0-9]+$/.test(k), toks: latin ? k.split(/[^a-z0-9]+/).filter(Boolean) : null }; };
  const tokensOf = text => new Set(text.split(/[^a-z0-9]+/));
  function found(text, toks, p) {
    if (p.simple) return toks.has(p.k);
    if (!p.latin) return text.includes(p.k);
    for (const x of p.toks) if (!toks.has(x)) return false;
    return hasTerm(text, p.k);
  }

  /* ── spelling mistakes ──
     `within(a, b, max)` is the edit distance between a and b when it is at most `max`, else max + 1.
     `letters` is a bit mask of the characters a string holds: two strings `max` edits apart differ in at
     most 2 × max of those bits, which rules out nearly every candidate without comparing letters. */
  const letters = s => { let m = 0; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); m |= 1 << (c >= 97 && c <= 122 ? c - 97 : c === 32 ? 26 : c >= 48 && c <= 57 ? 27 : 28); } return m; };
  const bits = x => { x = x - ((x >> 1) & 0x55555555); x = (x & 0x33333333) + ((x >> 2) & 0x33333333); return (((x + (x >> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24; };
  function within(a, b, max) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > max) return max + 1;
    if (max === 1) { // one edit: skip the common start, then the rest must line up
      let i = 0; const min = Math.min(m, n);
      while (i < min && a.charCodeAt(i) === b.charCodeAt(i)) i++;
      const ok = m === n ? a.slice(i + 1) === b.slice(i + 1) : (m > n ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1));
      return ok ? 1 : 2;
    }
    let prev = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      const cur = new Array(n + 1), ca = a.charCodeAt(i - 1);
      let low = cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca === b.charCodeAt(j - 1) ? 0 : 1));
        cur[j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1; // every way forward already costs more
      prev = cur;
    }
    return prev[n];
  }

  /* ── indexes built once ── */
  // synIndex: exact title wordings · kwIndex: loose single words · catIndex / looseIndex: the portal's categories
  const fieldById = {}, roleById = {}, synIndex = [], kwIndex = [], catIndex = [], looseIndex = [];
  FIELDS.forEach(f => {
    fieldById[f.id] = f;
    (f.cats || []).forEach(c => catIndex.push([norm(c), f.id]));
    (f.loose || []).forEach(c => looseIndex.push([norm(c), f.id]));
    (f.words || []).forEach(w => { const k = normTitle(w); if (k) kwIndex.push({ k, p: prep(k), role: null, field: f.id }); });
    f.roles.forEach(r => {
      r.field = f.id; roleById[r.id] = r;
      [r.en, ...r.syn].forEach(s => { const k = normTitle(s); if (k) synIndex.push({ k, p: prep(k), words: k.split(' ').length, role: r.id, field: f.id }); });
      (r.kw || []).forEach(w => { const k = normTitle(w); if (k) kwIndex.push({ k, p: prep(k), role: r.id, field: f.id }); });
    });
  });
  synIndex.sort((a, b) => b.k.length - a.k.length);
  catIndex.sort((a, b) => b[0].length - a[0].length);
  looseIndex.sort((a, b) => b[0].length - a[0].length);
  /* Wordings a misspelt title is compared with. A typing mistake sits inside a long word, so each word gets
     its own allowance: a word under six letters must match exactly (“Deputy” is not “Duty”, “Tr.” is not “IT”),
     a longer one may differ by 18% of its letters, two at most. `budget` is the allowance of the whole wording. */
  const spellIndex = synIndex.filter(s => s.p.latin && s.k.length >= 6).map(s => {
    const ws = s.k.split(' ').map(w => [w, w.length < 6 ? 0 : Math.min(2, Math.floor(w.length * 0.18))]);
    return { ...s, ws, budget: ws.reduce((n, w) => n + w[1], 0), mask: letters(s.k) };
  }).filter(s => s.budget > 0);
  const maxWords = spellIndex.reduce((n, s) => Math.max(n, s.words), 1);
  // Words the dictionary itself uses. A title word that is one of them is a real word, never a misspelling
  // of another: “Trainee Engineer” is not a “Trainer”, a “Team Leader” is not a “Loader”.
  const vocab = new Set(['officer', 'executive', 'manager', 'assistant', 'associate', 'specialist', 'analyst', 'consultant', 'trainee', 'leader', 'member', 'staff', 'worker', 'helper', 'agent', 'advisor', 'expert', 'deputy', 'senior', 'junior', 'intern']);
  [...synIndex, ...kwIndex].forEach(s => s.k.split(' ').forEach(w => vocab.add(w)));

  const skillFields = {}; // skill → the fields that list it
  FIELDS.forEach(f => f.skills.forEach(s => (skillFields[s] = skillFields[s] || []).push(f.id)));
  const allSkills = Object.keys(skillFields).sort((a, b) => a.localeCompare(b));
  // each skill: its own name and its other wordings. `tag` marks a wording that only counts in a short keyword line.
  const tagOnlyNames = new Set(typeof TAG_ONLY_NAMES === 'undefined' ? [] : TAG_ONLY_NAMES);
  const tagOnly = typeof TAG_ONLY_ALIASES === 'undefined' ? {} : TAG_ONLY_ALIASES;
  const skillTerms = allSkills.map(s => {
    const sure = [...new Set([...(tagOnlyNames.has(s) ? [] : [norm(s)]), ...(SKILL_ALIASES[s] || []).map(norm)])].filter(Boolean);
    const loose = [...new Set([...(tagOnlyNames.has(s) ? [norm(s)] : []), ...(tagOnly[s] || []).map(norm)])].filter(k => k && !sure.includes(k));
    return [s, [...sure.map(k => prep(k)), ...loose.map(k => ({ ...prep(k), tag: true }))]];
  });

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
  placeIndex.forEach(p => p.push(prep(p[0]))); // [key, district, area|null, prepared key]

  /* ── reading one post ── */
  /** Every field a portal category points to, the longest wording first ("Marketing / Sales" → marketing, sales). */
  function fieldsOf(cat, index) {
    const c = norm(cat), out = []; if (!c) return out;
    for (const [k, f] of index) if (hasTerm(c, k) && !out.includes(f)) out.push(f);
    return out;
  }

  // a production or quality job is a garments job when the post is about garments
  const GARMENT_WORDS = /(^|[^a-z])(garments?|rmg|apparels?|knit(ting|wear)?|woven|sweaters?|denim|textiles?|spinning|dyeing|lingerie|buying house|composite)($|[^a-z])|গার্মেন্টস/;

  /** The field and role a job title means. In order:
      1. an exact wording of the title (`syn`), then a near spelling of one;
      2. a loose word in the title (`kw`, `words`), unless the portal's category points to another field;
      3. the portal's category; 4. the skills; 5. a vague category (`loose`).
      `context` is the title, company, category and requirements together. */
  function classify(title, cat, skills, context) {
    const t = normTitle(title), catFields = fieldsOf(cat, catIndex), catField = catFields[0] || null;
    // a production or quality wording also fits a category that says garments (it becomes a garments job below)
    const inCat = f => catFields.includes(f) || (f === 'production' && catFields.includes('garments'));
    // a government circular counts under its kind of work AND under “Government”, so people who chose either see it
    const also = f => (catFields.includes('govt') && f !== 'govt' ? 'govt' : null);
    const done = out => {
      if (out.field === 'production' && (catFields.includes('garments') || GARMENT_WORDS.test(' ' + norm(context || title) + ' '))) {
        const role = out.role && roleById[out.role].garments;
        out = { field: 'garments', role: role || null, how: out.how };
      }
      out.also = also(out.field);
      return out;
    };
    const toks = tokensOf(t);
    let best = null;
    for (const s of synIndex) {
      if (!found(t, toks, s.p)) continue;
      const w = s.k.length + (inCat(s.field) ? 100 : 0);
      if (!best || w > best.w) best = { w, role: s.role, field: s.field, how: 'title' };
    }
    if (!best) { // a spelling mistake: “Accountent”, “Merchandizer”
      const words = t.split(' '), runs = []; // runs[n] = every run of n words in the title: [the words, their length together, their letter mask]
      for (let n = 1; n <= maxWords; n++) { runs[n] = []; for (let i = 0; i + n <= words.length; i++) { const ws = words.slice(i, i + n), win = ws.join(' '); runs[n].push([ws, win.length, letters(win)]); } }
      for (const s of spellIndex) {
        for (const [ws, len, mask] of runs[s.words]) {
          if (Math.abs(len - s.k.length) > s.budget || bits(mask ^ s.mask) > 2 * s.budget) continue;
          let d = 0;
          for (let i = 0; i < ws.length; i++) {
            const a = ws[i], b = s.ws[i][0], max = s.ws[i][1];
            if (a === b) continue;
            if (vocab.has(a)) { d = -1; break; } // a real word of its own
            // a mistake rarely changes a word's first letter
            const e = max && a.charCodeAt(0) === b.charCodeAt(0) ? within(a, b, max) : max + 1;
            if (e > max) { d = -1; break; }
            d += e;
          }
          if (d > 0) {
            const w = s.k.length - d + (inCat(s.field) ? 100 : 0);
            if (!best || w > best.w) best = { w, role: s.role, field: s.field, how: 'spelling' };
          }
        }
      }
    }
    if (!best) { // a loose word: “Manager Sales”, “Engineer (Quality)”
      for (const s of kwIndex) {
        if (!found(t, toks, s.p)) continue;
        if (catField && !inCat(s.field)) continue; // the portal's category points elsewhere: the category decides
        const w = s.k.length + (s.role ? 100 : 0);  // a word that names a role (“IE”) beats one that names only a field (“Garments”)
        if (!best || w > best.w) best = { w, role: s.role, field: s.field, how: 'keyword' };
      }
    }
    if (best) return done({ field: best.field, role: best.role, how: best.how });
    if (catField) return done({ field: catField, role: null, how: 'category' });
    const votes = {}; // skills only one or two fields use
    (skills || []).forEach(s => { const fs = skillFields[s] || []; if (fs.length <= 2) fs.forEach(f => (votes[f] = (votes[f] || 0) + 1)); });
    const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) return done({ field: top[0], role: null, how: 'skills' });
    const loose = fieldsOf(cat, looseIndex)[0];
    if (loose) return done({ field: loose, role: null, how: 'category' });
    return { field: null, role: null, how: 'none', also: null };
  }

  /** The skills a text names. `strict` is for running text (a full description): wordings that are only
      safe in a short keyword line are skipped. */
  function findSkills(text, strict) {
    const out = [], toks = tokensOf(text);
    for (const [name, terms] of skillTerms) if (terms.some(p => !(strict && p.tag) && found(text, toks, p))) out.push(name);
    return out;
  }

  const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, ten: 10, 'এক': 1, 'দুই': 2, 'তিন': 3, 'চার': 4, 'পাঁচ': 5, 'সাত': 7, 'আট': 8, 'দশ': 10 };
  const YEAR = '(?:years?|year\\(s\\)|yrs?|বছর|বৎসর)';
  const RE_RANGE = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(?:to|-|থেকে|হতে)\\s*(\\d+(?:\\.\\d+)?)\\s*\\+?\\s*' + YEAR);
  const RE_YEARS = new RegExp('(\\d+(?:\\.\\d+)?)\\s*\\+?\\s*' + YEAR);
  const RE_REQ_AFTER = new RegExp('(?:at least|minimum|min\\.?|কমপক্ষে|ন্যূনতম)?\\s*\\d+(?:\\.\\d+)?(?:\\s*(?:to|-|থেকে|হতে)\\s*\\d+(?:\\.\\d+)?)?\\s*\\+?\\s*(?:years?|year\\(s\\)|yrs?|months?|বছর|বৎসর|মাস)[\'’s]*(?:ের)?\\s*(?:of\\s*)?(?:previous\\s*|relevant\\s*|work(?:ing)?\\s*|professional\\s*|practical\\s*|hands-on\\s*|proven\\s*|বাস্তব\\s*)*(?:experience|অভিজ্ঞতা)');
  const RE_REQ_BEFORE = new RegExp('(?:experience|অভিজ্ঞতা)[^.\\d]{0,30}(\\d+(?:\\.\\d+)?(?:\\s*(?:to|-|থেকে|হতে)\\s*\\d+(?:\\.\\d+)?)?\\s*\\+?\\s*(?:years?|year\\(s\\)|yrs?|months?|বছর|বৎসর|মাস))');
  /** “two years” / “দুই বছর” → “2 years”, so one reader handles words and digits. */
  const wordsToDigits = s => s.replace(/(^|[^a-zঀ-৿])(one|two|three|four|five|six|seven|eight|ten|এক|দুই|তিন|চার|পাঁচ|সাত|আট|দশ)(?=\s*\+?\s*(?:years?|yrs?|বছর|বৎসর))/g, (_, pre, w) => pre + NUMBER_WORDS[w]);

  /* When a post states no experience, the title often still tells the level: “Intern”, “Jr. Officer”, “Sr. Manager”. */
  const TITLE_LEVELS = [
    ['fresher', 0, ['intern', 'internship', 'trainee', 'apprentice', 'fresher', 'entry level', 'fresh graduate', 'ইন্টার্ন', 'শিক্ষানবিশ', 'ট্রেইনি']],
    ['junior', 1, ['junior', 'jr', 'জুনিয়র']],
    ['senior', 5, ['senior manager', 'sr manager', 'head of', 'head teacher', 'group head', 'agm', 'dgm', 'gm', 'general manager', 'director', 'chief', 'ceo', 'cfo', 'coo', 'cto', 'chro', 'vice president', 'principal', 'professor', 'পরিচালক', 'অধ্যক্ষ']],
    ['mid', 3, ['assistant manager', 'asst manager', 'deputy manager', 'dy manager', 'senior', 'sr', 'team leader', 'team lead', 'in charge', 'incharge', 'supervisor', 'সিনিয়র', 'ইনচার্জ']],
    ['senior', 5, ['manager', 'ম্যানেজার']],
  ].map(([level, min, words]) => [level, min, words.map(w => normTitle(w))]);
  const FRESH_EXP = nfc(/fresh|no experience|not required|not needed|^na$|^n\/a$|entry[- ]level|অভিজ্ঞতা (প্রয়োজন|লাগবে) (নেই|না)|অভিজ্ঞতার প্রয়োজন নেই|ফ্রেশার/);
  const FRESH_REQ = nfc(/fresh(er|ers)?\s*(are|can|may)?\s*(also\s*)?(be\s*)?(encouraged|apply|welcome)|no experience (is )?(needed|required)|ফ্রেশার|অভিজ্ঞতা ছাড়াও|অভিজ্ঞতার প্রয়োজন নেই/);
  function titleLevel(title) {
    const t = ' ' + normTitle(title) + ' ';
    for (const [level, min, words] of TITLE_LEVELS) if (words.some(w => hasTerm(t, w))) return { level, min };
    return null;
  }

  function parseExperience(expText, reqText, title) {
    const e = wordsToDigits(norm(expText)), r = wordsToDigits(norm(reqText));
    const fresher = FRESH_EXP.test(e) || FRESH_REQ.test(r);
    const read = s => {
      let m = s.match(RE_RANGE); if (m) return { min: +m[1], max: +m[2] };
      m = s.match(RE_YEARS); if (m) return { min: +m[1], max: null };
      m = s.match(/(\d+)\s*\+?\s*(?:months?|মাস)/); if (m) return { min: Math.round(+m[1] / 12 * 10) / 10, max: null };
      return null;
    };
    let got = read(e);
    if (!got) { const m = r.match(RE_REQ_AFTER) || r.match(RE_REQ_BEFORE); if (m) got = read(m[1] || m[0]); }
    if (!got && e && !fresher) { // a level word instead of a number: “Mid-level”, “Senior”
      if (/junior|associate/.test(e)) got = { min: 1, max: 2 };
      else if (/mid/.test(e)) got = { min: 3, max: 5 };
      else if (/senior|lead|principal|expert/.test(e)) got = { min: 5, max: null };
    }
    if (got) return { ...got, fresher: fresher || got.min === 0, stated: true };
    if (fresher) return { min: 0, max: null, fresher: true, stated: true };
    return { min: null, max: null, fresher: false, stated: false, guess: title ? titleLevel(title) : null };
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

  const AGE_RANGE = nfc(/(?:age|বয়স|বয়সসীমা)[^.\d]{0,25}(\d{2})\s*(?:to|-|থেকে|হতে)\s*(\d{2})/);
  const AGE_MAX = nfc(/(?:age|বয়স)[^.\d]{0,30}(?:max(?:imum)?|at most|not (?:over|more than)|below|under|up to|সর্বোচ্চ|অনূর্ধ্ব)\s*(\d{2})/);
  const AGE_MIN = nfc(/(?:age|বয়স)[^.\d]{0,30}(?:min(?:imum)?|at least|above|over|সর্বনিম্ন)\s*(\d{2})/);
  function parseAge(text) {
    const t = norm(text);
    let m = t.match(AGE_RANGE); if (m) return { min: +m[1], max: +m[2] };
    m = t.match(AGE_MAX); if (m) return { min: null, max: +m[1] };
    m = t.match(AGE_MIN); if (m) return { min: +m[1], max: null };
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

  /* Countries a post in Bangladesh sometimes names: the job is abroad. */
  const ABROAD = [['saudi arabia', 'Saudi Arabia'], ['ksa', 'Saudi Arabia'], ['united arab emirates', 'UAE'], ['uae', 'UAE'], ['dubai', 'UAE'], ['abu dhabi', 'UAE'], ['qatar', 'Qatar'], ['kuwait', 'Kuwait'], ['oman', 'Oman'], ['bahrain', 'Bahrain'],
    ['malaysia', 'Malaysia'], ['singapore', 'Singapore'], ['maldives', 'Maldives'], ['japan', 'Japan'], ['south korea', 'South Korea'], ['india', 'India'], ['china', 'China'], ['united kingdom', 'UK'], ['united states', 'USA'], ['usa', 'USA'], ['canada', 'Canada'], ['australia', 'Australia'], ['europe', 'Europe'],
    ['সৌদি আরব', 'Saudi Arabia'], ['দুবাই', 'UAE'], ['কাতার', 'Qatar'], ['কুয়েত', 'Kuwait'], ['ওমান', 'Oman'], ['মালয়েশিয়া', 'Malaysia'], ['সিঙ্গাপুর', 'Singapore'], ['মালদ্বীপ', 'Maldives'], ['জাপান', 'Japan']].map(([k, name]) => [norm(k), name]);
  /* Area names that are also ordinary words in a job title (“Oxygen Plant Operator”, “Airport Staff”). */
  const NOT_FROM_TITLE = new Set(['Airport', 'Oxygen', 'EPZ', 'Bandar', 'GEC', 'New Market', 'Chowrasta', 'Board Bazar', 'Wari', 'Turag']);
  const placeWords = l => l.places.map(p => (p.area ? p.area + ', ' : '') + p.district).join(' / ') || l.abroad || (l.remote ? 'Remote' : (l.anywhere ? 'Anywhere in Bangladesh' : ''));

  /** Where a job is: remote, anywhere in Bangladesh, abroad, and the districts and areas the line names.
      With `fromTitle` the text is a job title: only names that are safe to read out of a title count. */
  function parseLocation(locText, fromTitle) {
    let t = norm(locText).replace(/[,;()\/]+/g, ' , ');
    const out = { text: fromTitle ? '' : (locText || '').trim(), remote: false, anywhere: false, abroad: null, places: [] };
    if (!t) return out;
    if (/remote|work from home|wfh|home[- ]based|রিমোট|বাসা থেকে/.test(t)) out.remote = true;
    if (/anywhere in bangladesh|all over bangladesh|across bangladesh|nationwide|any district|any where in bangladesh|সারা ?দেশ|বাংলাদেশের যেকোনো|যে কোনো জেলা/.test(t)) out.anywhere = true;
    const named = new Set(), hits = [], toks = tokensOf(t);
    for (const [key, district, area, p] of placeIndex) {
      if (fromTitle && area && NOT_FROM_TITLE.has(area)) continue;
      // `toks` is from the whole line: a name whose words are not all there cannot match, before or after longer names are taken out
      if (p.latin && !p.toks.every(x => toks.has(x))) continue;
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
    if (!out.places.length && !out.anywhere && !out.remote) { const hit = ABROAD.find(([k]) => hasTerm(t, k)); if (hit) out.abroad = hit[1]; }
    return out;
  }
  const placed = l => l.places.length > 0 || l.remote || l.anywhere || !!l.abroad;

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
      const cls = classify(raw.title, raw.cat, skills, [raw.title, raw.company, raw.cat, raw.req].filter(Boolean).join(' . '));
      let loc = parseLocation(raw.loc);
      if (!placed(loc)) { // the place is sometimes only in the title: “Medical Assistant - Noakhali”
        const fromTitle = parseLocation(raw.title, true);
        if (placed(fromTitle)) loc = { ...fromTitle, text: loc.text || placeWords(fromTitle), from: 'title' };
      }
      const postedAt = raw.postedAt ? startOfDay(raw.postedAt).getTime() : today - (raw.posted || 0) * DAY;
      const deadline = raw.deadline ? startOfDay(raw.deadline).getTime() : (raw.deadlineIn != null ? today + raw.deadlineIn * DAY : null);
      if (deadline != null && deadline < today) continue;
      const g = norm(raw.req);
      const job = {
        id: String(raw.id || (normTitle(raw.title) + '|' + norm(raw.company))),
        title: raw.title.trim(), company: (raw.company || '').trim(), source: raw.source || '', url: raw.url || '', logo: raw.logo || '', site: raw.site || '', vacancies: raw.vacancies || null,
        field: cls.field, role: cls.role, also: cls.also || null, how: cls.how, skills, text: padded,
        exp: parseExperience(raw.exp, raw.req, raw.title), edu: parseEducation(raw.edu, raw.req), eduText: (raw.edu || '').trim(),
        age: parseAge([raw.age ? 'age ' + raw.age : '', raw.req].filter(Boolean).join(' . ')), salary: parseSalary(raw.salary), salaryText: (raw.salary || '').trim(),
        type: parseType(raw.type, raw.title), loc,
        gender: /only females?|female candidates? only|females? only|শুধুমাত্র নারী|শুধু নারী/.test(g) ? 'female' : (/only males?|male candidates? only|(^|[^e])males? only|শুধুমাত্র পুরুষ|শুধু পুরুষ/.test(g) ? 'male' : null),
        scam: SCAM_PATTERNS.some(re => re.test(raw.req || '') || re.test(raw.title || '') || re.test(raw.salary || '')),
        postedAt, deadline, daysLeft: deadline == null ? null : Math.round((deadline - today) / DAY), isNew: today - postedAt < DAY,
        alsoOn: Array.isArray(raw.alsoOn) ? raw.alsoOn.filter(Boolean) : [], // the robot merges a repeated post and lists its other sources here
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
    if (L.abroad) take(2, 'maybe', L.abroad, 'abroad'); // a job outside Bangladesh: shown, but never a location match
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
    else if (job.also && x.fields.has(job.also)) { const all = x.fieldsAllRoles.has(job.also); rolePts = all ? 34 : 24; roleCode = all ? 'field' : 'sameField'; roleLabel = fieldById[job.also].en; }
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
    } else if (job.exp.guess) { // nothing stated: the title's level is a hint, never a hard rule
      const g = job.exp.guess;
      if (g.level === 'fresher') { expPts = x.years <= 2 ? 9 : 6; if (x.years === 0) checks.push({ k: 'exp', state: 'ok', guess: g.level }); }
      else if (x.years >= g.min) expPts = 8;
      else { expPts = g.min - x.years <= 2 ? 3 : -3; checks.push({ k: 'exp', state: 'partial', guess: g.level }); }
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

  return { prepareJobs, rank, skillGaps, classify, parseLocation, parseExperience, findSkills, expandProfile, match, fieldById, roleById, allSkills, skillFields, districtDiv, norm, hasTerm,
    _internals: { found, prep, tokensOf, within } }; // for tests/engine.test.mjs
})();

