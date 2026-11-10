/* ───────── The app: account, pages, events ───────── */
(() => {
  /* Storage: the person's online account (Cloud → Firestore users/{uid}) follows them to any device.
     This browser keeps a copy too (localStorage), so the app opens instantly and works offline.
     Every change is written here at once and sent to the account a moment later. */
  const mem = {};
  let storageWorks = true;
  const SYNCED = ['account', 'profile', 'marks', 'lang', 'theme'];
  const keep = (k, v) => { mem[k] = v; try { localStorage.setItem('jobshathi:' + k, JSON.stringify(v)); storageWorks = true; } catch { storageWorks = false; } };
  const Store = {
    get(k, d) { try { const v = localStorage.getItem('jobshathi:' + k); return v == null ? (k in mem ? mem[k] : d) : JSON.parse(v); } catch { return k in mem ? mem[k] : d; } },
    set(k, v) { keep(k, v); if (SYNCED.includes(k)) { keep('updatedAt', Date.now()); keep('dirty', true); Sync.soon(); } },
    clear() { Object.keys(mem).forEach(k => delete mem[k]); try { Object.keys(localStorage).filter(k => k.startsWith('jobshathi:')).forEach(k => localStorage.removeItem(k)); } catch { /* nothing was kept */ } },
  };
  /* Sends the whole account to users/{uid}. `dirty` stays true until the account has it, so nothing made offline is lost. */
  const Sync = {
    timer: 0, busy: false, again: false, paused: false,
    soon() { clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 700); },
    async push() {
      const u = Cloud.user();
      if (this.paused || !u || !S.account || !S.profile || S.account.uid !== u.uid) return false;
      if (this.busy) { this.again = true; return false; }
      this.busy = true;
      const stamp = Store.get('updatedAt', Date.now());
      const r = await Cloud.save(u.uid, { account: S.account, profile: S.profile, marks: S.marks, lang: S.lang, theme: S.theme, updatedAt: stamp });
      this.busy = false;
      if (r.ok) keep('syncedUid', u.uid);
      if (r.ok && Store.get('updatedAt', 0) === stamp) keep('dirty', false);
      if (this.again) { this.again = false; this.push(); }
      return r.ok;
    },
  };

  const DEMO_JOBS = Engine.prepareJobs(SAMPLE_JOBS);
  const emptyMarks = () => ({ saved: {}, applied: {}, dismissed: {} });
  const newFilter = () => ({ bucket: 'fit', quick: [], sort: 'match', q: '' });
  const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const S = {
    account: Store.get('account', null), profile: Store.get('profile', null), marks: Object.assign(emptyMarks(), Store.get('marks', {})),
    lang: Store.get('lang', (navigator.language || '').toLowerCase().startsWith('bn') ? 'bn' : 'en'), theme: Store.get('theme', 'auto'),
    jobs: DEMO_JOBS, results: [], demo: true, updatedAt: '', route: 'welcome', f: newFilter(), stab: 'saved', draft: null, step: 0, editOne: false, done: false, err: '', wq: '', delAsk: false, delReauth: false, busy: '', sheet: null,
    installed: (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
  };
  if (S.profile && !S.account) { S.account = { id: 'u' + Date.now().toString(36), name: S.profile.name || '', contact: '', createdAt: Date.now() }; Store.set('account', S.account); }
  let lastKey = '', sheetShown = false, opener = null, deferredInstall = null;

  /* ── helpers ── */
  const BN = '০১২৩৪৫৬৭৮৯';
  const num = v => (S.lang === 'bn' ? String(v).replace(/\d/g, d => BN[d]) : String(v));
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = (key, vars) => { const pair = TEXT[key]; let s = pair ? pair[S.lang === 'bn' ? 1 : 0] : key; if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]); return s; };
  const L = o => (S.lang === 'bn' && o.bn ? o.bn : o.en);
  const money = n => num(Number(n).toLocaleString('en-US'));
  const fmtDate = (ts, long) => { try { return new Intl.DateTimeFormat(S.lang === 'bn' ? 'bn-BD' : 'en-GB', long ? { weekday: 'long', day: 'numeric', month: 'long' } : { day: 'numeric', month: 'short' }).format(new Date(ts)); } catch { return new Date(ts).toDateString(); } };
  const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(w => Array.from(w)[0] || '').join('').toUpperCase() || '?';
  const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) % 997; return [222, 262, 190, 150, 24, 340, 45, 290][h % 8]; };
  const ICON = {
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', bag: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', half: '<path d="M6 12h12"/>', alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><path d="M12 17.4v.2"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.2"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4z"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>', chevR: '<path d="M9 6l6 6-6 6"/>', chevL: '<path d="M15 6l-6 6 6 6"/>', download: '<path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14"/>',
    tracker: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>', spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  };
  const FICON = {
    it: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>', accounting: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    bank: '<path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>', sales: '<path d="M4 17l5-5 4 4 7-8"/><path d="M15 8h5v5"/>',
    marketing: '<path d="M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6"/>', hr: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
    support: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2.5" y="13" width="4" height="6" rx="1.5"/><rect x="17.5" y="13" width="4" height="6" rx="1.5"/><path d="M19.5 19c0 1.5-2 2.5-5 2.5"/>', garments: '<path d="M8 3l4 3 4-3 5 4-3 4-2-1.5V21H8V9.5L6 11 3 7z"/>',
    engineering: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3L15 12l-3-3z"/>', education: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
    health: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M8 12h2l1.5-3 2 5 1.5-2h1.5"/>', design: '<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M13.5 6.5l4 4"/>',
    supply: '<path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8z"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="16.5" cy="17.5" r="2"/>', ngo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    office: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>', service: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h5l3 8M10 9l-1-3H6.5M15 9l1.5-3H19"/>',
  };
  const svg = inner => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${inner}</svg>`;
  const ic = n => svg(ICON[n]);
  const chip = (a, v, on, label, cls = '') => `<button type="button" class="chip ${cls}" data-a="${a}" data-v="${esc(v)}" data-fid="${a}:${esc(v)}" aria-pressed="${!!on}">${label}</button>`;
  const B = s => `<b>${esc(s)}</b>`;
  const GLOGO = '<svg class="g-logo" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  const cloudOn = () => !!FIREBASE_CONFIG.apiKey && Cloud.status !== 'failed';

  /* ── profile ⇄ setup draft ── */
  const blankDraft = () => ({ name: '', contact: '', fields: [], roles: [], keywords: [], skills: [], level: 'fresher', edu: '', age: '', types: [], bd: false, remote: false, districts: [], areas: {}, minSalary: '', avoid: [] });
  function draftFromProfile(p) {
    const d = Object.assign(blankDraft(), JSON.parse(JSON.stringify(p)));
    d.name = S.account ? S.account.name : (p.name || ''); d.contact = S.account ? S.account.contact || '' : '';
    d.edu = p.edu == null ? '' : String(p.edu); d.age = p.age || ''; d.minSalary = p.minSalary || '';
    d.bd = (p.locations || []).includes('bd'); d.remote = (p.locations || []).includes('remote'); d.districts = []; d.areas = {};
    (p.locations || []).forEach(l => {
      const [kind, v] = l.split(':'); if (!v || kind === 'div') return;
      const [dist, area] = v.split('/');
      if (!d.districts.includes(dist)) d.districts.push(dist);
      if (kind === 'area') (d.areas[dist] = d.areas[dist] || []).push(area);
    });
    delete d.locations; return d;
  }
  function profileFromDraft(d) {
    const locations = [];
    if (d.bd) locations.push('bd'); if (d.remote) locations.push('remote');
    d.districts.forEach(dist => { const as = d.areas[dist] || []; as.length ? as.forEach(a => locations.push('area:' + dist + '/' + a)) : locations.push('dist:' + dist); });
    return { name: d.name.trim(), fields: d.fields, roles: d.roles, keywords: d.keywords, skills: d.skills, level: d.level, edu: d.edu === '' ? null : +d.edu, age: d.age ? +d.age : null, types: d.types, locations, minSalary: d.minSalary ? +d.minSalary : null, avoid: d.avoid };
  }
  const locLabel = l => { if (l === 'bd') return t('anywhere'); if (l === 'remote') return t('remote'); const [kind, v] = l.split(':'); if (kind === 'area') { const [d, a] = v.split('/'); return a + ', ' + d; } return kind === 'div' ? t('division', { d: v }) : v; };

  function recompute() { S.results = S.profile ? Engine.rank(S.profile, S.jobs, S.marks) : []; }
  const saveMarks = () => Store.set('marks', S.marks);
  const live = () => S.results.filter(r => r.bucket !== 'hidden' && !S.marks.dismissed[r.job.id]);

  /* ── words for one checklist line ── */
  function expWords(c) {
    const need = c.need || 0;
    if (need > 0 && need < 1) return t('months', { a: num(Math.round(need * 12)) });
    return c.max && c.max > need ? t('years', { a: num(need), b: num(c.max) }) : t('yearsMin', { a: num(need) });
  }
  const ageWords = c => (c.min != null && c.max != null ? t('ageRange', { a: num(c.min), b: num(c.max) }) : (c.max != null ? t('ageMax', { b: num(c.max) }) : t('ageMin', { a: num(c.min) })));
  const payRange = s => t('tk', { x: money(s.min) + (s.max > s.min ? '–' + money(s.max) : '') });
  const eduName = id => { const e = EDU_LEVELS.find(e => e.id === id); return e ? L(e) : ''; };
  const eduShort = id => eduName(id).split(' (')[0].split(' / ')[0];
  const typeName = id => { const ty = JOB_TYPES.find(j => j.id === id); return ty ? L(ty) : id; };
  function checkLine(c) {
    let cls = c.state === 'ok' ? '' : c.state, icon = c.state === 'ok' ? 'check' : (c.state === 'partial' ? 'half' : (c.state === 'info' ? 'info' : 'alert')), text = '';
    if (c.k === 'role') text = t({ role: 'cRole', keyword: 'cKeyword', field: 'cField', sameField: 'cSameField', keywordText: 'cKeywordText', skills: 'cSkillsRole' }[c.code] || 'cRole', { l: B(c.label) });
    else if (c.k === 'skills') {
      const m = esc(c.matched.join(', ')), x = B(c.missing.slice(0, 5).join(', ')) + (c.missing.length > 5 ? ' +' + num(c.missing.length - 5) : '');
      text = c.state === 'ok' ? t('cSkillsOk', { m }) : c.state === 'partial' ? t('cSkillsPartial', { m, x }) : c.state === 'info' ? t('cSkillsInfo', { x }) : t('cSkillsWarn', { x });
    } else if (c.k === 'loc') {
      const l = esc(c.label), code = c.code || '';
      if (c.state === 'warn') cls = 'bad';
      text = code === 'areaUnknown' ? t('cLocAreaUnknown', { l }) : code.startsWith('near:') ? t('cLocNear', { l, u: esc(code.slice(5)) }) : code === 'otherPart' ? t('cLocOther', { l }) : code === 'unknown' ? t('cLocUnknown') : code === 'no' ? t('cLocNo', { l }) : code === 'remoteNotAsked' ? t('cLocRemoteNA') : code === 'remote' ? t('remote') : code === 'anywhere' ? t('anywhere') : l;
    } else if (c.k === 'exp') { if (c.state === 'warn') cls = 'bad'; text = c.state === 'ok' ? (c.fresher && !c.need ? t('cExpFresher') : t('cExpOk', { x: expWords(c) })) : c.state === 'partial' ? t('cExpPartial', { x: B(expWords(c)) }) : t('cExpWarn', { x: B(expWords(c)) }); }
    else if (c.k === 'edu') { if (c.state === 'warn') cls = 'bad'; text = c.state === 'ok' ? t('cEduOk', { x: esc(eduName(c.need)) }) : t('cEduWarn', { x: B(eduName(c.need)) }); }
    else if (c.k === 'age') { if (c.state === 'warn') cls = 'bad'; text = t(c.state === 'ok' ? 'cAgeOk' : c.state === 'warn' ? 'cAgeWarn' : 'cAgeInfo', { x: ageWords(c) }); }
    else if (c.k === 'pay') text = t(c.state === 'ok' ? 'cPayOk' : 'cPayWarn', { x: payRange(c) });
    else if (c.k === 'type') text = t('cType', { x: esc(typeName(c.type)) });
    return { cls, icon, text };
  }
  const checklist = (r, cls = '') => `<ul class="checks ${cls}">${r.checks.map((c, i) => { const l = checkLine(c); return `<li class="${l.cls}" style="--n:${i}"><span class="tick">${ic(l.icon)}</span><span>${l.text}</span></li>`; }).join('')}</ul>`;

  /** The two or three short tags a card shows: how much fits, then what does not. */
  function fitTags(r) {
    if (S.marks.dismissed[r.job.id]) return `<span class="tag mute">${t('hDismissed')}</span>`;
    if (r.bucket === 'hidden') return `<span class="tag mute">${r.hiddenWhy === 'avoid' ? t('hAvoid', { w: esc(r.avoided) }) : r.hiddenWhy === 'location' ? t('hLocation') : t('hOther')}</span>`;
    const gaps = [];
    for (const c of r.checks) {
      if (c.state === 'ok' || c.state === 'info') continue;
      const bad = c.state === 'warn' && c.k !== 'skills' && c.k !== 'pay' && c.k !== 'type';
      let s = '';
      if (c.k === 'role') s = t('shRole');
      else if (c.k === 'skills') s = t('shMissing', { x: esc(c.missing.slice(0, 2).join(', ')) + (c.missing.length > 2 ? ' +' + num(c.missing.length - 2) : '') });
      else if (c.k === 'loc') { const code = c.code || ''; s = code.startsWith('near:') ? t('shNear', { u: esc(code.slice(5)) }) : code === 'areaUnknown' ? t('shAreaNA') : code === 'otherPart' ? t('shOther', { d: esc(c.label.split(', ').pop()) }) : code === 'remoteNotAsked' ? t('remote') : t('shOutside'); }
      else if (c.k === 'exp') s = t('shNeeds', { x: expWords(c) });
      else if (c.k === 'edu') s = t('shNeeds', { x: esc(eduShort(c.need)) });
      else if (c.k === 'age') s = t('shAge', { x: ageWords(c) });
      else if (c.k === 'pay') s = t('shPay');
      else if (c.k === 'type') s = esc(typeName(c.type));
      gaps.push(`<span class="tag ${bad ? 'bad' : 'gap'}">${s}</span>`);
    }
    const first = gaps.length ? `<span class="tag ok">${ic('check')}${t('meets', { a: num(r.met), b: num(r.of) })}</span>` : `<span class="tag ok">${ic('check')}${t('allMet')}</span>`;
    return (S.marks.applied[r.job.id] ? `<span class="tag mute">${ic('check')}${t('appliedTag')}</span>` : '') + first + gaps.slice(0, 2).join('');
  }
  const deadlineWords = j => (j.daysLeft == null ? t('noDeadline') : j.daysLeft === 0 ? t('lastDay') : j.daysLeft === 1 ? t('oneDay') : t('daysLeft', { n: num(j.daysLeft) }));
  const payWords = j => (j.salary ? payRange(j.salary) : esc(j.salaryText || t('salaryNA')));
  const ring = (r, cls = '') => `<div class="ring ${cls} ${r.bucket === 'strong' ? '' : r.bucket === 'possible' ? 'mid' : 'low'}" style="--p:${r.score}"><span aria-hidden="true">${num(r.score)}</span><span class="sr">${t('scoreSr', { n: num(r.score) })}</span></div>`;
  /* A company's logo: the picture the post carries, else the icon of the company's website, else its first letter. */
  const badLogos = new Set();
  function logoSrc(j) {
    if (j.logo && /^(https?:\/\/|data:image\/)/i.test(j.logo)) return j.logo;
    if (j.site) { try { const host = new URL(/^https?:/i.test(j.site) ? j.site : 'https://' + j.site).hostname; if (host.includes('.')) return 'https://www.google.com/s2/favicons?sz=128&domain=' + encodeURIComponent(host); } catch { /* not an address */ } }
    return '';
  }
  const logo = (j, cls = '') => { const src = logoSrc(j); return `<div class="logo ${cls}" style="--h:${hue(j.company || j.title)}" aria-hidden="true"><span>${esc(initials(j.company || j.title).slice(0, 1))}</span>${src && !badLogos.has(src) ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : ''}</div>`; };

  function jobCard(r) {
    const j = r.job, saved = !!S.marks.saved[j.id], dim = r.bucket === 'hidden' || S.marks.dismissed[j.id];
    return `<article class="card job ${dim ? 'dim' : ''}">
      <div class="job-top">${logo(j)}<div><h3><button type="button" data-a="open" data-v="${esc(j.id)}" data-fid="open:${esc(j.id)}">${esc(j.title)}</button>${j.isNew ? `<span class="new">${t('newToday')}</span>` : ''}</h3><div class="co">${esc(j.company)}</div></div>${ring(r)}</div>
      <div class="facts"><span class="fact">${ic('pin')}${esc(j.loc.text || t('cLocUnknown'))}</span><span class="fact">${ic('cash')}${payWords(j)}</span><span class="fact ${j.daysLeft != null && j.daysLeft <= 3 ? 'soon' : ''}">${ic('clock')}${deadlineWords(j)}</span></div>
      <div class="job-foot"><div class="fit">${fitTags(r)}</div><button type="button" class="icon-btn ${saved ? 'on' : ''}" data-a="save" data-v="${esc(j.id)}" data-fid="save:${esc(j.id)}" aria-pressed="${saved}" aria-label="${saved ? t('saved') : t('save')}: ${esc(j.title)}">${ic('bookmark')}</button></div></article>`;
  }
  const emptyBlock = (title, body, action = '') => `<div class="card empty"><b>${title}</b><span>${body}</span>${action}</div>`;

  /* ── pages ── */
  function pageWelcome() {
    const demoProfile = { fields: ['accounting'], roles: ['accountant'], skills: ['Excel', 'Bookkeeping', 'Bank Reconciliation'], level: 'fresher', edu: 4, age: 24, locations: ['area:Dhaka/Mirpur'], types: ['full'], minSalary: 18000 };
    const r = Engine.rank(demoProfile, DEMO_JOBS.filter(j => j.role === 'accountant'), {})[0];
    const demo = r ? `<p class="demo-cap">${t('demoCap')}</p><div class="card demo-card demo"><div class="job-top">${logo(r.job)}<div><h3 style="font-size:1.15rem;font-weight:700">${esc(r.job.title)}</h3><div class="co" style="color:var(--ink-2)">${esc(r.job.company)}</div></div>${ring(r)}</div>
      <div class="facts"><span class="fact">${ic('pin')}${esc(r.job.loc.text)}</span><span class="fact">${ic('cash')}${payWords(r.job)}</span><span class="fact">${ic('clock')}${deadlineWords(r.job)}</span></div>
      <div><div class="slip-title"><span>${t('fitTitle')}</span><small>${t('meets', { a: num(r.met), b: num(r.of) })}</small></div>${checklist(r)}</div></div>` : '';
    return `<section class="hero"><div><h1>${t('heroTitle')}</h1><p class="lead">${t('heroLead')}</p>
      <div class="cta"><button type="button" class="btn primary big" data-a="start">${t('getStarted')}</button>
      ${!S.account && cloudOn() ? `<div class="have"><span>${t('haveAccount')}</span><button type="button" class="btn" data-a="google" data-fid="google" ${S.busy === 'google' ? 'disabled' : ''}>${GLOGO}${S.busy === 'google' ? t('wait') : t('googleBtn')}</button></div>` : ''}
      <div class="trust"><span>${ic('check')}${t('trust1')}</span><span>${ic('check')}${t('trust2')}</span><span>${ic('check')}${t('trust3')}</span></div></div></div>
      <div>${demo}</div></section>
      <ol class="steps"><li><div><b>${t('how1')}</b><span>${t('how1d')}</span></div></li><li><div><b>${t('how2')}</b><span>${t('how2d')}</span></div></li><li><div><b>${t('how3')}</b><span>${t('how3d')}</span></div></li></ol>`;
  }

  function tokens(key, placeholder) {
    const d = S.draft, list = key === 'skills' ? d.skills.filter(s => !Engine.skillFields[s]) : d[key];
    return `<div class="stack-s"><div class="row"><input type="text" id="tok-${key}" data-tok="${key}" data-fid="tok:${key}" placeholder="${esc(placeholder)}" autocomplete="off" enterkeyhint="done"><button type="button" class="btn" data-a="tok-add" data-v="${key}">${t('add')}</button></div>
      ${list.length ? `<div class="chips">${list.map(v => `<button type="button" class="chip token" data-a="tok-del" data-v="${key}|${esc(v)}" data-fid="tokdel:${key}:${esc(v)}" aria-label="${t('remove')}: ${esc(v)}">${esc(v)} ${ic('x')}</button>`).join('')}</div>` : ''}</div>`;
  }
  const searchBox = (id, key, value, ph) => `<div class="searchbox">${ic('search')}<input type="search" id="${id}" data-in="${key}" data-fid="in:${key}" value="${esc(value)}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" autocomplete="off"></div>`;

  const STEPS = 6;
  function stepBody(step) {
    const d = S.draft, wq = Engine.norm(S.wq);
    if (step === 0) return `<h1>${t('q0')}</h1><p class="sub">${t('q0h')}</p><div class="stack">
      <div><label class="lbl" for="in-name">${t('nameLbl')}</label><input type="text" id="in-name" data-in="name" data-fid="in:name" value="${esc(d.name)}" placeholder="${esc(t('namePh'))}" autocomplete="name" maxlength="40" enterkeyhint="next"></div>
      <div><label class="lbl" for="in-contact">${t('contactLbl')}</label><input type="text" id="in-contact" data-in="contact" data-fid="in:contact" value="${esc(d.contact)}" placeholder="${esc(t('contactPh'))}" autocomplete="email" maxlength="80" inputmode="email"><div class="hint" style="margin-top:6px">${t('contactH')}</div></div></div>`;
    if (step === 1) return `<h1>${t('q1')}</h1><p class="sub">${t('q1h')}</p><div class="field-grid">${FIELDS.map(f => `<button type="button" class="tile" data-a="field" data-v="${f.id}" data-fid="field:${f.id}" aria-pressed="${d.fields.includes(f.id)}"><span class="ti">${svg(FICON[f.id] || ICON.bag)}</span><span>${esc(L(f))}</span></button>`).join('')}</div>`;
    if (step === 2) {
      const groups = d.fields.map(fid => { const f = Engine.fieldById[fid], roles = f.roles.filter(r => !wq || Engine.norm(r.en + ' ' + r.syn.join(' ')).includes(wq)); const n = d.roles.filter(r => Engine.roleById[r].field === fid).length;
        return roles.length ? `<div><div class="group-title"><span>${esc(L(f))}</span><small>${n ? t('nSelected', { n: num(n) }) : t('allRoles')}</small></div><div class="chips">${roles.map(r => chip('role', r.id, d.roles.includes(r.id), esc(r.en))).join('')}</div></div>` : ''; }).join('');
      return `<h1>${t('q2')}</h1><p class="sub">${t('q2h')}</p><div class="stack">${searchBox('wq', 'wq', S.wq, t('searchRoles'))}${groups || `<p class="hint">${t('noResult')}</p>`}
        <div><label class="lbl" for="tok-keywords">${t('kw')}</label>${tokens('keywords', t('kwPh'))}</div></div>`;
    }
    if (step === 3) {
      const sug = [...new Set(d.fields.flatMap(f => Engine.fieldById[f].skills))].filter(s => !wq || Engine.norm(s).includes(wq));
      return `<h1>${t('q3')}</h1><p class="sub">${t('q3h')}</p><div class="stack">${searchBox('wq', 'wq', S.wq, t('searchSkills'))}
        ${sug.length ? `<div class="chips">${sug.map(s => chip('skill', s, d.skills.includes(s), esc(s))).join('')}</div>` : `<p class="hint">${t('noResult')}</p>`}
        <div><label class="lbl" for="tok-skills">${t('skillPh')}</label>${tokens('skills', t('skillPh'))}</div></div>`;
    }
    if (step === 4) return `<h1>${t('q4')}</h1><p class="sub">${t('q4h')}</p><div class="stack">
      <div><span class="lbl" id="lvl">${t('exp')}</span><div class="opt-list" role="group" aria-labelledby="lvl">${EXP_LEVELS.map(l => `<button type="button" class="opt" data-a="level" data-v="${l.id}" data-fid="level:${l.id}" aria-pressed="${d.level === l.id}"><b>${L(l)}</b><small>${t(l.id === 'fresher' ? 'lvFresher' : 'lv' + l.id)}</small><span class="dot"></span></button>`).join('')}</div></div>
      <div><label class="lbl" for="in-edu">${t('edu')}</label><select id="in-edu" data-in="edu" data-fid="in:edu"><option value="">${t('pickEdu')}</option>${EDU_LEVELS.filter(e => e.id > 0).map(e => `<option value="${e.id}" ${String(d.edu) === String(e.id) ? 'selected' : ''}>${esc(L(e))}</option>`).join('')}</select></div>
      <div><span class="lbl" id="typ">${t('types')}</span><div class="chips" role="group" aria-labelledby="typ">${JOB_TYPES.map(x => chip('type', x.id, d.types.includes(x.id), L(x))).join('')}</div><div class="hint" style="margin-top:6px">${t('typesH')}</div></div>
      <div><label class="lbl" for="in-age">${t('age')}</label><input type="number" id="in-age" data-in="age" data-fid="in:age" value="${esc(d.age)}" min="15" max="70" inputmode="numeric"><div class="hint" style="margin-top:6px">${t('ageH')}</div></div></div>`;
    const opts = Object.entries(DIVISIONS).map(([div, ds]) => `<optgroup label="${esc(t('division', { d: div }))}">${ds.map(x => `<option value="${esc(x)}" ${d.districts.includes(x) ? 'disabled' : ''}>${esc(x)}</option>`).join('')}</optgroup>`).join('');
    return `<h1>${t('q5')}</h1><p class="sub">${t('q5h')}</p><div class="stack">
      <div class="chips">${chip('bd', '1', d.bd, t('anywhere'))}${chip('remote', '1', d.remote, t('remoteLong'))}</div>
      <div><label class="lbl" for="distSel">${t('district')}</label><select id="distSel" data-fid="distSel"><option value="">${t('pickDistrict')}</option>${opts}</select>
        ${d.districts.length ? `<div class="chips" style="margin-top:10px">${d.districts.map(x => `<button type="button" class="chip token" data-a="dist-del" data-v="${esc(x)}" data-fid="distdel:${esc(x)}" aria-label="${t('remove')}: ${esc(x)}">${esc(x)} ${ic('x')}</button>`).join('')}</div>` : ''}</div>
      ${d.districts.filter(x => AREA_GROUPS[x]).map(x => `<div><div class="group-title"><span>${t('areasIn', { d: esc(x) })}</span></div><div class="chips">${AREA_GROUPS[x].flat().map(a => chip('area', x + '/' + a, (d.areas[x] || []).includes(a), esc(a), 'sm')).join('')}</div></div>`).join('')}
      <div><label class="lbl" for="in-minSalary">${t('minSalary')}</label><div class="chips" style="margin-bottom:8px">${[15000, 20000, 30000, 40000, 50000].map(n => chip('salary', String(n), +d.minSalary === n, t('tk', { x: money(n) }), 'sm')).join('')}</div>
        <input type="number" id="in-minSalary" data-in="minSalary" data-fid="in:minSalary" value="${esc(d.minSalary)}" min="0" step="500" inputmode="numeric" placeholder="${esc(t('minSalaryPh'))}"></div>
      <div><label class="lbl" for="tok-avoid">${t('avoid')}</label>${tokens('avoid', t('avoidPh'))}</div></div>`;
  }
  function pageSetup() {
    if (S.done) {
      const m = live(), strong = m.filter(r => r.bucket === 'strong').length;
      return `<div class="wizard"><div class="done"><div class="pop">${ic('check')}</div><h1>${t('doneTitle', { name: esc(S.account.name) })}</h1><p class="sub" style="margin:0">${t('doneLead', { n: num(S.results.length) })}</p>
        <div class="nums"><div><b>${num(strong)}</b>${t('doneBest')}</div><div><b>${num(m.length - strong)}</b>${t('donePossible')}</div></div>
        <button type="button" class="btn primary big" data-a="go" data-v="home" data-fid="done-go">${t('seeJobs')}</button></div></div>`;
    }
    const step = S.step, last = step === STEPS - 1;
    const primary = S.editOne ? t('saveChanges') : last ? t('finish') : t('cont');
    return `<div class="wizard">${S.editOne ? '' : `<div class="wiz-top"><button type="button" class="icon-btn" data-a="wiz-back" aria-label="${t('back')}">${ic('chevL')}</button><div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS}" aria-valuenow="${step + 1}"><i style="width:${(step + 1) / STEPS * 100}%"></i></div><span class="hint">${num(step + 1)}/${num(STEPS)}</span></div>`}
      ${stepBody(step)}${S.err ? `<p class="err" role="alert">${S.err}</p>` : ''}
      <div class="wiz-foot">${S.editOne ? `<button type="button" class="btn" data-a="wiz-cancel">${t('cancel')}</button>` : ''}<button type="button" class="btn primary big" data-a="wiz-next" data-fid="wiz-next">${primary}</button></div></div>`;
  }

  function strengthCard() {
    const p = S.profile, todo = [];
    if (!p.roles.length && !p.keywords.length) todo.push(['addRoles', 2]);
    if (p.skills.length < 3) todo.push(['addSkills', 3]);
    if (p.edu == null) todo.push(['addEdu', 4]);
    if (!p.locations.length) todo.push(['addWhere', 5]);
    if (!p.age) todo.push(['addAge', 4]);
    if (!p.minSalary) todo.push(['addSalary', 5]);
    if (!S.account.contact) todo.push(['addContact', 0]);
    const pct = Math.round((8 - todo.length) / 8 * 100);
    return `<div class="card panel"><div class="sec-head" style="margin:0"><h2>${t('strength')}</h2><b>${num(pct)}%</b></div><div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      <p class="hint" style="margin-bottom:${todo.length ? 6 : 0}px">${todo.length ? t('strengthH') : t('strengthFull')}</p>${todo.slice(0, 3).map(([k, st]) => `<button type="button" class="todo" data-a="edit" data-v="${st}" data-fid="todo:${k}"><span>${t(k)}</span>${ic('chevR')}</button>`).join('')}</div>`;
  }
  const gapsCard = () => { const gaps = Engine.skillGaps(live()); return gaps.length ? `<div class="card panel"><h2 style="margin-bottom:6px">${t('gapsTitle')}</h2>${gaps.map(g => `<div class="gap-item"><span>${t('gapLine', { skill: B(g.skill), n: num(g.n), of: num(g.of) })}</span><div><button type="button" class="btn sm soft" data-a="gap-add" data-v="${esc(g.skill)}" data-fid="gap:${esc(g.skill)}">${t('haveIt')}</button></div></div>`).join('')}</div>` : ''; };
  const installCard = () => (S.installed ? '' : `<div class="card panel install-card"><div class="ico">${ic('download')}</div><div><b>${t('installTitle')}</b><div class="hint">${t('installLead')}</div></div><button type="button" class="btn soft" data-a="install" data-fid="install-card">${t('installApp')}</button></div>`);
  /** "Jobs updated today at 6:10 AM", from the updatedAt the robot writes into jobs.json. */
  function freshWords() {
    if (!S.updatedAt) return '';
    const d = new Date(S.updatedAt);
    if (isNaN(d.getTime())) return '';
    let time;
    try { time = new Intl.DateTimeFormat(S.lang === 'bn' ? 'bn-BD' : 'en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d); }
    catch { time = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
    return new Date().toDateString() === d.toDateString()
      ? t('updatedToday', { t: time })
      : t('updatedOn', { d: fmtDate(d.getTime()), t: time });
  }
  const freshLine = (cls = '') => { const w = freshWords(); return w ? `<p class="hint ${cls}">${esc(w)}</p>` : ''; };

  const demoBanner = () => (S.demo ? `<div class="banner">${ic('info')}<span>${t('demoBanner')}</span></div>` : '');

  function pageHome() {
    const m = live(), strong = m.filter(r => r.bucket === 'strong'), h = new Date().getHours();
    const stat = (n, label, icon, a, v, cls) => `<button type="button" class="stat ${cls}" data-a="${a}" data-v="${v}" data-fid="stat:${v}"><span class="sb">${ic(icon)}</span><b>${num(n)}</b><span class="lb">${label}</span></button>`;
    const picks = m.slice(0, 3);
    return `<div class="greet"><p>${fmtDate(Date.now(), true)}</p><h1>${t(h < 12 ? 'gm' : h < 17 ? 'ga' : 'ge')}, ${esc(S.account.name.split(/\s+/)[0])}</h1>${freshLine()}</div>
      <section class="sunrise"><svg class="sun" viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="sunGlow"><stop offset="0" stop-color="#FFC27A" stop-opacity=".95"/><stop offset=".45" stop-color="#FF8A3D" stop-opacity=".5"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient><linearGradient id="sunCore" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD08A"/><stop offset="1" stop-color="#FF7A45"/></linearGradient></defs><circle cx="100" cy="100" r="100" fill="url(#sunGlow)"/><circle cx="100" cy="100" r="42" fill="url(#sunCore)"/><circle cx="100" cy="100" r="64" fill="none" stroke="#FFD08A" stroke-opacity=".35" stroke-width="1.5"/><circle cx="100" cy="100" r="86" fill="none" stroke="#FFD08A" stroke-opacity=".18" stroke-width="1.5"/></svg>
        <div><div class="big">${num(strong.length)}</div><div class="cap">${t('heroCount')}</div></div><p class="sub">${t('heroSub', { b: num(m.length - strong.length), n: num(S.results.length) })}</p>
        <button type="button" class="btn" data-a="quick-go" data-v="">${t('seeMatches')}</button></section>
      <div class="stats">${stat(m.filter(r => r.job.isNew).length, t('statNew'), 'spark', 'quick-go', 'new', 's1')}${stat(m.filter(r => r.job.daysLeft != null && r.job.daysLeft <= 3).length, t('statSoon'), 'clock', 'quick-go', 'soon', 's2')}${stat(Object.keys(S.marks.saved).length, t('statSaved'), 'bookmark', 'tracker-go', 'saved', 's3')}${stat(Object.keys(S.marks.applied).length, t('statApplied'), 'check', 'tracker-go', 'applied', 's4')}</div>
      <div class="home-grid"><div class="feed">${demoBanner()}<div class="sec-head"><h2 class="sec-title">${t('topPicks')}</h2><button type="button" class="link" data-a="quick-go" data-v="">${t('seeAll')}</button></div>
        ${picks.length ? picks.map(jobCard).join('') : emptyBlock(t('emptyForYou'), t('emptyForYouD'), `<button type="button" class="btn soft" data-a="edit" data-v="2">${t('addRoles')}</button>`)}</div>
        <div class="side">${strengthCard()}${gapsCard()}${installCard()}</div></div>`;
  }

  const QUICK = { new: r => r.job.isNew, remote: r => r.job.loc.remote, soon: r => r.job.daysLeft != null && r.job.daysLeft <= 3, fresher: r => r.job.exp.stated && (r.job.exp.fresher || !r.job.exp.min) };
  function pageJobs() {
    const f = S.f, q = Engine.norm(f.q), m = live();
    let list = (f.bucket === 'fit' ? m : S.results).filter(r => (!q || Engine.norm(r.job.title + ' ' + r.job.company + ' ' + r.job.loc.text).includes(q)) && f.quick.every(k => QUICK[k](r)));
    if (f.sort === 'new') list = list.slice().sort((a, b) => b.job.postedAt - a.job.postedAt || b.score - a.score);
    if (f.sort === 'deadline') list = list.slice().sort((a, b) => (a.job.daysLeft == null ? 1e9 : a.job.daysLeft) - (b.job.daysLeft == null ? 1e9 : b.job.daysLeft) || b.score - a.score);
    const segBtn = (id, label, n) => `<button type="button" role="tab" data-a="bucket" data-v="${id}" data-fid="bucket:${id}" aria-selected="${f.bucket === id}">${label}<span class="n">${num(n)}</span></button>`;
    let feed = '';
    if (!list.length) feed = (q || f.quick.length) ? emptyBlock(t('emptyFilter'), t('emptyFilterD'), `<button type="button" class="btn soft" data-a="clear-filters">${t('clearFilters')}</button>`) : emptyBlock(t('emptyForYou'), t('emptyForYouD'), `<button type="button" class="btn soft" data-a="bucket" data-v="all">${t('seeAll')}</button>`);
    else if (f.bucket === 'fit' && f.sort === 'match') {
      const s = list.filter(r => r.bucket === 'strong'), p = list.filter(r => r.bucket === 'possible');
      feed = (s.length ? `<div class="sec-head"><h2 class="sec-title">${t('bestH')}</h2></div>${s.map(jobCard).join('')}` : '') + (p.length ? `<div class="sec-head"><div><h2 class="sec-title">${t('possibleH')}</h2><p class="hint">${t('possibleD')}</p></div></div>${p.map(jobCard).join('')}` : '');
    } else feed = list.map(jobCard).join('');
    return `<div class="page-head"><h1>${t('jobsHead')}</h1><p>${t('summary', { a: num(m.filter(r => r.bucket === 'strong').length), b: num(m.filter(r => r.bucket === 'possible').length), n: num(S.results.length) })}</p>${freshLine()}</div>
      <div class="toolbar">${searchBox('q', 'q', f.q, t('search'))}
        <div class="seg" role="tablist">${segBtn('fit', t('tabForYou'), m.length)}${segBtn('all', t('tabAll'), S.results.length)}</div>
        <div class="scroller" data-keep="quick">${['new', 'soon', 'fresher', 'remote'].map(k => chip('quick', k, f.quick.includes(k), t({ new: 'fNew', soon: 'fSoon', fresher: 'fFresher', remote: 'fRemote' }[k]), 'sm')).join('')}</div></div>
      <div class="feed">${demoBanner()}<div class="result-bar"><span>${t('nJobs', { n: num(list.length) })}</span><label><span class="sr">${t('sortBy')}</span><select data-in="sort" data-fid="in:sort" aria-label="${t('sortBy')}">${[['match', 'sMatch'], ['new', 'sNew'], ['deadline', 'sDeadline']].map(([v, k]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></label></div>${feed}</div>`;
  }

  const STATUS = [['applied', 'stApplied'], ['interview', 'stInterview'], ['offer', 'stOffer'], ['rejected', 'stRejected']];
  function pageTracker() {
    const kind = S.stab, marks = S.marks[kind], byId = {}; S.results.forEach(r => (byId[r.job.id] = r));
    const ids = Object.keys(marks).sort((a, b) => marks[b].t - marks[a].t);
    const segBtn = (id, label, n) => `<button type="button" role="tab" data-a="stab" data-v="${id}" data-fid="stab:${id}" aria-selected="${S.stab === id}">${label}<span class="n">${num(n)}</span></button>`;
    const items = ids.map(id => {
      const when = `<div class="when">${t(kind === 'applied' ? 'appliedOn' : 'savedOn', { d: fmtDate(marks[id].t) })}</div>`;
      const status = kind === 'applied' ? `<div class="status" style="margin:8px 4px 0">${STATUS.map(([v, k]) => chip('status', id + '|' + v, (marks[id].status || 'applied') === v, t(k), 'sm')).join('')}</div>` : '';
      if (byId[id]) return `<div>${when}${jobCard(byId[id])}${status}</div>`;
      return `<div>${when}<article class="card job dim"><div class="job-top">${logo(marks[id])}<div><h3>${esc(marks[id].title)}</h3><div class="co">${esc(marks[id].company)}</div></div><span></span></div>
        <div class="job-foot"><div class="fit"><span class="tag mute">${t('closed')}</span></div><button type="button" class="icon-btn" data-a="${kind === 'applied' ? 'apply' : 'save'}" data-v="${esc(id)}" aria-label="${t('remove')}">${ic('x')}</button></div></article>${status}</div>`;
    }).join('');
    return `<div class="page-head"><h1>${t('trackerHead')}</h1><p>${t('trackerLead')}</p></div><div class="feed" style="margin-top:14px;max-width:720px">
      <div class="seg" role="tablist">${segBtn('saved', t('tabSaved'), Object.keys(S.marks.saved).length)}${segBtn('applied', t('tabApplied'), Object.keys(S.marks.applied).length)}</div>
      ${items || (kind === 'saved' ? emptyBlock(t('emptySaved'), t('emptySavedD'), `<button type="button" class="btn soft" data-a="quick-go" data-v="">${t('seeMatches')}</button>`) : emptyBlock(t('emptyApplied'), t('emptyAppliedD')))}</div>`;
  }

  function pageProfile() {
    const p = S.profile, a = S.account;
    const roles = p.roles.map(r => Engine.roleById[r] && Engine.roleById[r].en).filter(Boolean).concat(p.keywords);
    const noRole = p.fields.filter(f => !p.roles.some(r => Engine.roleById[r] && Engine.roleById[r].field === f)).map(f => t('anyRoleIn', { f: L(Engine.fieldById[f]) }));
    const lvl = EXP_LEVELS.find(l => l.id === p.level);
    const row = (title, value, step) => `<button type="button" class="rowlink" data-a="edit" data-v="${step}" data-fid="row:${step}"><span><b>${title}</b><span>${esc(value || t('none'))}</span></span>${ic('chevR')}</button>`;
    const seg = (act, opts, cur) => `<div class="seg">${opts.map(([v, label]) => `<button type="button" data-a="${act}" data-v="${v}" data-fid="${act}:${v}" aria-pressed="${cur === v}">${label}</button>`).join('')}</div>`;
    return `<div class="stack" style="max-width:720px">
      <div class="card panel acct"><div class="avatar lg" aria-hidden="true">${esc(initials(a.name))}</div><div><h1>${esc(a.name)}</h1><div class="hint">${a.contact ? esc(a.contact) + '<br>' : ''}${t(a.uid ? 'accountOnline' : 'accountOn')}, ${t('joined', { d: fmtDate(a.createdAt) }).toLowerCase()}</div></div></div>
      ${googleCard()}
      <div class="card panel">${row(t('secWork'), roles.concat(noRole).join(', '), 1)}${row(t('secSkills'), p.skills.join(', '), 3)}${row(t('secAbout'), [lvl ? L(lvl) : '', p.edu == null ? '' : eduShort(p.edu), p.age ? num(p.age) : '', (p.types.length ? p.types.map(typeName).join(' / ') : '')].filter(Boolean).join(', '), 4)}${row(t('secWhere'), (p.locations.length ? p.locations : ['bd']).map(locLabel).join('; ') + (p.minSalary ? ', ' + t('tk', { x: money(p.minSalary) }) + '+' : ''), 5)}${row(t('secAccount'), [a.name, a.contact].filter(Boolean).join(', '), 0)}</div>
      <div class="card panel"><div class="stack-s"><div><span class="lbl">${t('language')}</span>${seg('setlang', [['en', 'English'], ['bn', 'বাংলা']], S.lang)}</div><div><span class="lbl">${t('theme')}</span>${seg('theme', [['auto', t('themeAuto')], ['light', t('themeLight')], ['dark', t('themeDark')]], S.theme)}</div></div></div>
      ${installCard()}
      <div class="card panel"><details><summary>${t('howTitle')}${ic('chevR')}</summary><div class="prose">${t('how').split('|').map(x => `<p>${x}</p>`).join('')}</div></details></div>
      <div class="card panel"><h2 style="margin-bottom:6px">${t('privacyTitle')}</h2><div class="prose"><p>${t('privacy')}</p>${storageWorks ? '' : `<p class="err">${t('storageOff')}</p>`}${FIREBASE_CONFIG.apiKey && (Cloud.status === 'failed' || (a.uid && Store.get('dirty', false) && !navigator.onLine)) ? `<p class="hint">${t('cloudOff')}</p>` : ''}</div>
        <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center">${S.delReauth ? `<span>${t('delReauth')}</span><button type="button" class="btn danger" data-a="del-google" data-fid="del-google" ${S.busy ? 'disabled' : ''}>${GLOGO}${S.busy === 'delete' ? t('wait') : t('confirmGoogle')}</button><button type="button" class="btn" data-a="del-no" data-fid="del-no">${t('cancel')}</button>` : S.delAsk ? `<span>${t('deleteAsk')}</span><button type="button" class="btn danger" data-a="del-yes" data-fid="del-yes" ${S.busy ? 'disabled' : ''}>${S.busy === 'delete' ? t('wait') : t('deleteYes')}</button><button type="button" class="btn" data-a="del-no" data-fid="del-no">${t('cancel')}</button>` : `<button type="button" class="btn danger" data-a="del-ask" data-fid="del-ask">${t('deleteAccount')}</button>`}</div></div></div>`;
  }
  /* Google on the profile page: connect it, or show which Google account this is. */
  function googleCard() {
    if (!FIREBASE_CONFIG.apiKey) return '';
    const a = S.account, u = Cloud.user(), email = (u && u.uid === a.uid && Cloud.googleEmail(u)) || a.google || '';
    if (email) return `<div class="card panel install-card gcard"><div class="ico">${GLOGO}</div><div><b>${t('googleOn', { e: esc(email) })}</b><div class="hint">${t('googleOnH')}</div></div><button type="button" class="btn quiet" data-a="sign-out" data-fid="sign-out" ${S.busy ? 'disabled' : ''}>${S.busy === 'signout' ? t('wait') : t('signOut')}</button></div>`;
    return `<div class="card panel install-card gcard"><div class="ico">${GLOGO}</div><div><b>${t('googleTitle')}</b><div class="hint">${t('googleLinkH')}</div></div><button type="button" class="btn" data-a="google-link" data-fid="google-link" ${S.busy ? 'disabled' : ''}>${GLOGO}${S.busy === 'google' ? t('wait') : t('googleBtn')}</button></div>`;
  }

  /* ── sheets ── */
  function sheetJob(r) {
    const j = r.job, m = S.marks, saved = !!m.saved[j.id], applied = m.applied[j.id], dismissed = !!m.dismissed[j.id];
    const fact = (k, v) => (v ? `<div><span>${k}</span><b>${v}</b></div>` : '');
    const link = /^https?:\/\//i.test(j.url) ? `<a class="btn primary" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">${t('view')} ${ic('ext')}</a>` : `<button type="button" class="btn primary" data-a="view-demo">${t('view')} ${ic('ext')}</button>`;
    return { label: j.title, head: `<div class="d-top">${logo(j, 'lg')}<div><h2 id="sheet-title">${esc(j.title)}</h2><div class="hint" style="font-size:1rem">${esc(j.company)}</div></div>${ring(r, 'lg')}</div>`,
      body: `${j.scam ? `<div class="flag scam">${ic('alert')}<span>${t('scam')}</span></div>` : ''}
        <div class="d-facts">${fact(t('fLocation'), esc(j.loc.text || t('cLocUnknown')))}${fact(t('fSalary'), payWords(j))}${fact(t('fType'), esc(typeName(j.type)))}${fact(t('fDeadline'), deadlineWords(j))}${fact(t('fEdu'), esc(j.eduText))}${fact(t('fVac'), j.vacancies ? num(j.vacancies) : '')}${fact(t('fSource'), esc([j.source].concat(j.alsoOn).filter(Boolean).join(', ')))}</div>
        <div><div class="slip-title"><span>${t('fitTitle')}</span><small>${t('meets', { a: num(r.met), b: num(r.of) })}</small></div>${checklist(r)}</div>
        ${j.gender ? `<div class="flag note">${ic('info')}<span>${t(j.gender === 'female' ? 'onlyFemale' : 'onlyMale')}</span></div>` : ''}
        ${applied ? `<div><span class="lbl">${t('statusLbl')}</span><div class="chips">${STATUS.map(([v, k]) => chip('status', j.id + '|' + v, (applied.status || 'applied') === v, t(k), 'sm')).join('')}</div></div>` : ''}
        <div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn ${applied ? 'on' : ''}" data-a="apply" data-v="${esc(j.id)}" data-fid="apply:${esc(j.id)}" aria-pressed="${!!applied}">${applied ? ic('check') + ' ' + t('applied') : t('markApplied')}</button>
          ${dismissed ? `<button type="button" class="btn quiet" data-a="undismiss" data-v="${esc(j.id)}">${t('undo')}: ${t('notForMe')}</button>` : `<button type="button" class="btn quiet" data-a="dismiss" data-v="${esc(j.id)}">${ic('x')} ${t('notForMe')}</button>`}</div>`,
      foot: `${link}<button type="button" class="icon-btn ${saved ? 'on' : ''}" style="width:46px;height:46px" data-a="save" data-v="${esc(j.id)}" data-fid="sheet-save" aria-pressed="${saved}" aria-label="${saved ? t('saved') : t('save')}">${ic('bookmark')}</button>` };
  }
  function sheetHtml() {
    if (!S.sheet) return '';
    let c;
    if (S.sheet.kind === 'job') { const r = S.results.find(r => r.job.id === S.sheet.id); if (!r) { S.sheet = null; return ''; } c = sheetJob(r); }
    else c = { label: t('installTitle'), head: `<div><h2 id="sheet-title">${t('installTitle')}</h2><div class="hint" style="font-size:1rem">${t('installLead')}</div></div>`, body: `<div class="howto"><p>${t('installAndroid')}</p><p>${t('installIos')}</p><p>${t('installPc')}</p></div>${inFrame ? `<div class="banner">${ic('info')}<span>${t('installPreview')}</span></div>` : ''}`, foot: '' };
    const anim = sheetShown ? 'style="animation:none"' : '';
    return `<div class="scrim" data-a="close" ${anim}></div><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" ${anim}>
      <div class="sheet-head"><span class="grab" aria-hidden="true"></span>${c.head}<button type="button" class="icon-btn" data-a="close" data-fid="sheet-close" aria-label="${t('close')}">${ic('x')}</button></div>
      <div class="sheet-body" data-keep="sheet">${c.body}</div>${c.foot ? `<div class="sheet-foot">${c.foot}</div>` : ''}</div>`;
  }

  /* ── shell ── */
  const ROUTES = ['welcome', 'setup', 'home', 'jobs', 'tracker', 'profile'];
  function resolveRoute() {
    let r = (location.hash || '').replace(/^#/, '');
    const ready = S.account && S.profile;
    if (!ROUTES.includes(r)) r = ready ? 'home' : 'welcome';
    if (!ready && r !== 'welcome' && r !== 'setup') r = 'welcome';
    if (r === 'setup' && !S.draft && !S.done) { S.draft = S.profile ? draftFromProfile(S.profile) : blankDraft(); S.editOne = false; S.step = 0; }
    if (r !== 'setup') S.done = false;
    S.route = r;
  }
  function go(r) { if ((location.hash || '') === '#' + r) { resolveRoute(); render(); } else location.hash = r; window.scrollTo(0, 0); }

  function render() {
    const root = document.getElementById('app'), act = document.activeElement;
    let fid = act && act.dataset ? act.dataset.fid : null;
    const keep = {}; root.querySelectorAll('[data-keep]').forEach(el => (keep[el.dataset.keep] = [el.scrollLeft, el.scrollTop]));
    document.documentElement.lang = S.lang; document.title = APP_NAME[S.lang];
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', S.theme);
    const app = !!(S.account && S.profile) && S.route !== 'setup' && S.route !== 'welcome';
    const NAV = [['home', 'navHome', 'home'], ['jobs', 'navJobs', 'bag'], ['tracker', 'navTracker', 'tracker'], ['profile', 'navProfile', 'user']];
    const tracked = Object.keys(S.marks.saved).length + Object.keys(S.marks.applied).length;
    const navBtns = withCount => NAV.map(([r, k, i]) => `<button type="button" data-a="go" data-v="${r}" ${S.route === r ? 'aria-current="page"' : ''}>${ic(i)}<span>${t(k)}</span>${withCount && r === 'tracker' && tracked ? `<span class="count">${num(tracked)}</span>` : ''}</button>`).join('');
    const page = S.route === 'welcome' ? pageWelcome() : S.route === 'setup' ? pageSetup() : S.route === 'jobs' ? pageJobs() : S.route === 'tracker' ? pageTracker() : S.route === 'profile' ? pageProfile() : pageHome();
    const key = S.route + ':' + (S.route === 'setup' ? (S.done ? 'done' : S.step) : '');
    const brand = `<button type="button" class="brand" data-a="go" data-v="${app || (S.account && S.profile) ? 'home' : 'welcome'}"><span class="brand-mark">${ic('check')}</span>${APP_NAME[S.lang]}</button>`;
    const langBtn = `<button type="button" class="pill-btn" data-a="lang" data-fid="lang" lang="${S.lang === 'bn' ? 'en' : 'bn'}">${t('langSwitch')}</button>`;
    root.innerHTML = `<div class="shell ${app ? 'app' : ''}">
      ${app ? `<aside class="rail">${brand}<nav aria-label="Main">${navBtns(true)}</nav><span class="grow"></span>${S.installed ? '' : `<button type="button" class="btn soft" data-a="install" data-fid="install-rail">${ic('download')} ${t('installApp')}</button>`}<div style="margin-top:8px">${langBtn}</div>
        <button type="button" class="me" data-a="go" data-v="profile"><span class="avatar" aria-hidden="true">${esc(initials(S.account.name))}</span><span><b>${esc(S.account.name)}</b><span>${t('navProfile')}</span></span></button></aside>` : ''}
      <div><header class="mtop"><div class="mtop-in">${brand}<span class="push"></span>${langBtn}${app ? `<button type="button" class="avatar" data-a="go" data-v="profile" aria-label="${t('navProfile')}">${esc(initials(S.account.name))}</button>` : ''}</div></header>
        <main><div class="${key !== lastKey ? 'view' : ''}">${page}</div></main></div>
      ${app ? `<nav class="tabbar" aria-label="Main">${navBtns(false)}</nav>` : ''}</div>${sheetHtml()}`;
    lastKey = key;
    root.querySelectorAll('[data-keep]').forEach(el => { const k = keep[el.dataset.keep]; if (k) { el.scrollLeft = k[0]; el.scrollTop = k[1]; } });
    document.body.style.overflow = S.sheet ? 'hidden' : ''; document.body.classList.toggle('sheet-open', !!S.sheet);
    if (S.sheet && !sheetShown) fid = 'sheet-close';
    if (!S.sheet && sheetShown && opener) { fid = opener; opener = null; }
    sheetShown = !!S.sheet;
    if (fid) { const el = root.querySelector(`[data-fid="${CSS.escape(fid)}"]`); if (el) { el.focus({ preventScroll: true }); if (el.tagName === 'INPUT' && el.type !== 'number') { try { el.setSelectionRange(el.value.length, el.value.length); } catch { /* not a text field */ } } } }
  }

  let toastTimer;
  function toast(msg, undo) {
    const el = document.getElementById('toast');
    el.innerHTML = `<div class="toast"><span>${msg}</span>${undo ? `<button type="button" data-a="toast-undo">${t('undo')}</button>` : ''}</div>`;
    el._undo = undo || null; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.innerHTML = ''; el._undo = null; }, undo ? 6000 : 3000);
  }

  /* ── actions ── */
  const toggle = (arr, v) => { const i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); };
  const snapshot = id => { const r = S.results.find(r => r.job.id === id); return r ? { t: Date.now(), title: r.job.title, company: r.job.company, url: r.job.url, logo: /^https?:/i.test(r.job.logo) ? r.job.logo : '', site: r.job.site, status: 'applied' } : { t: Date.now(), title: '', company: '', status: 'applied' }; };
  function addToken(key) {
    const input = document.getElementById('tok-' + key); if (!input) return;
    const d = S.draft; input.value.split(',').map(s => s.trim()).filter(Boolean).forEach(v => { if (!d[key].some(x => x.toLowerCase() === v.toLowerCase())) d[key].push(v.slice(0, 60)); });
    input.value = '';
  }
  function commitDraft() {
    const d = S.draft, isNew = !S.account;
    S.profile = profileFromDraft(d); Store.set('profile', S.profile);
    S.account = Object.assign({ id: 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), createdAt: Date.now() }, S.account || {}, { name: d.name.trim(), contact: d.contact.trim() });
    Store.set('account', S.account); recompute();
    return isNew;
  }
  function validStep() {
    const d = S.draft;
    if (S.step === 0 && !d.name.trim()) return t('errName');
    if (S.step === 1 && !d.fields.length) return t('errField');
    return '';
  }

  /* ── online account ── */
  const SILENT = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'];
  function cloudError(code) {
    if (SILENT.includes(code)) return '';
    if (!navigator.onLine || code === 'offline' || code === 'auth/network-request-failed') return t('errOffline');
    if (code === 'auth/popup-blocked') return t('errPopup');
    if (code === 'unavailable' || code === 'timeout') return t('errCloud');
    if (window.console) console.warn('JobShathi sign-in:', code);
    return t('errGoogle');
  }
  /** The account in Firestore replaces what this browser had. */
  function applyRemote(data) {
    S.account = data.account; S.profile = data.profile; S.marks = Object.assign(emptyMarks(), data.marks || {});
    if (data.lang) S.lang = data.lang; if (data.theme) S.theme = data.theme;
    SYNCED.forEach(k => keep(k, S[k])); keep('updatedAt', data.updatedAt || Date.now()); keep('dirty', false);
    recompute();
  }
  /** Ties the local account to the signed-in Firebase user. */
  function markUser(u) {
    if (!S.account || !u) return;
    const g = Cloud.googleEmail(u);
    if (S.account.uid !== u.uid || (S.account.google || '') !== g) { S.account = Object.assign({}, S.account, { uid: u.uid, google: g }); Store.set('account', S.account); }
  }
  /** Account found in Firestore → use it, unless this browser has newer changes that never reached it. */
  async function reconcile(u) {
    const r = await Cloud.load(u.uid);
    if (!r.ok) return false;
    const cloud = r.data && r.data.account && r.data.profile ? r.data : null;
    if (!cloud && S.account && Store.get('syncedUid', '') === u.uid) { await forgetHere(); toast(t('tGone')); return true; }
    const localNewer = S.account && S.profile && S.account.uid === u.uid && Store.get('dirty', false) && Store.get('updatedAt', 0) > ((cloud && cloud.updatedAt) || 0);
    if (cloud && !localNewer) { if ((cloud.updatedAt || 0) !== Store.get('updatedAt', 0) || Store.get('dirty', false) || !S.account) applyRemote(cloud); markUser(u); }
    else if (S.account && S.profile) { markUser(u); await Sync.push(); }
    return true;
  }
  /* On start: show this browser's copy at once, then sign in quietly and bring the account up to date. */
  async function connect() {
    if (!(await Cloud.start())) { render(); return; }
    let u = Cloud.user();
    if (!u && S.account && S.profile) { const r = await Cloud.ensureUser(); u = r.ok ? r.user : null; }
    if (u) await reconcile(u);
    resolveRoute(); render();
  }
  /* A new account: signed in anonymously in the person's name, no extra step. */
  async function afterCreate() {
    if (!(await Cloud.start())) return;
    const r = await Cloud.ensureUser();
    if (r.ok) { markUser(r.user); Sync.push(); }
  }
  function busy(what) { S.busy = what; render(); }
  /* "Already have an account?" on the welcome page. */
  async function googleSignIn() {
    if (!Cloud.ready()) { toast(t(navigator.onLine ? 'errCloud' : 'errOffline')); Cloud.start().then(connect); return; }
    busy('google');
    const r = await Cloud.signInGoogle();
    if (!r.ok) { S.busy = ''; const m = cloudError(r.code); render(); if (m) toast(m); return; }
    const got = await Cloud.load(r.user.uid);
    S.busy = '';
    if (!got.ok) { render(); toast(cloudError(got.code) || t('errCloud')); return; }
    if (got.data && got.data.account && got.data.profile) { applyRemote(got.data); markUser(r.user); S.draft = null; S.sheet = null; go('home'); toast(t('tWelcomeBack', { name: esc(S.account.name.split(/\s+/)[0]) })); return; }
    if (S.account && S.profile) { markUser(r.user); Sync.push(); render(); toast(t('tLinked')); return; }
    S.draft = blankDraft(); S.draft.name = (r.user.displayName || '').slice(0, 40); S.draft.contact = (r.user.email || '').slice(0, 80);
    S.editOne = false; S.done = false; S.step = 0; S.err = ''; S.wq = ''; go('setup'); toast(t('tNoAccount'));
  }
  /* "Continue with Google" on the profile page: the same account, now with Google. */
  async function googleLink() {
    if (!Cloud.ready()) { toast(t(navigator.onLine ? 'errCloud' : 'errOffline')); Cloud.start().then(connect); return; }
    busy('google');
    const had = Cloud.user(), r = await Cloud.linkGoogle();
    if (!r.ok) { S.busy = ''; const m = cloudError(r.code); render(); if (m) toast(m); return; }
    let msg = t('tLinked');
    if (r.switched || !had) {
      const got = await Cloud.load(r.user.uid);
      if (got.ok && got.data && got.data.account && got.data.profile) { applyRemote(got.data); msg = t('tSwitched'); }
    }
    markUser(r.user); await Sync.push();
    S.busy = ''; render(); toast(msg);
  }
  async function signOutHere() {
    if (Store.get('dirty', false)) { if (!navigator.onLine) { toast(t('errOffline')); return; } busy('signout'); await Promise.race([Sync.push(), new Promise(ok => setTimeout(ok, 8000))]); }
    await forgetHere(); toast(t('tSignedOut'));
  }
  /** Signs out and removes this browser's copy (the online account stays as it is). */
  async function forgetHere() {
    Sync.paused = true; clearTimeout(Sync.timer);
    await Cloud.signOut();
    const lang = S.lang, theme = S.theme;
    Store.clear(); keep('lang', lang); keep('theme', theme);
    S.account = null; S.profile = null; S.marks = emptyMarks(); S.draft = null; S.delAsk = false; S.delReauth = false; S.busy = ''; S.sheet = null; recompute();
    Sync.paused = false; go('welcome');
  }
  /* Deletes users/{uid} and the Firebase user, then this browser's copy. */
  async function deleteAccount(confirmWithGoogle) {
    const online = (S.account && S.account.uid) || Cloud.user();
    if (online) {
      if (!Cloud.ready()) { toast(t(navigator.onLine ? 'errCloud' : 'errOffline')); Cloud.start().then(connect); return; }
      Sync.paused = true; clearTimeout(Sync.timer);
      if (confirmWithGoogle) S.busy = 'delete'; else busy('delete');
      const r = await Cloud.removeAccount(confirmWithGoogle);
      Sync.paused = false; S.busy = '';
      if (!r.ok) {
        if (r.code === 'auth/requires-recent-login') { S.delReauth = true; render(); return; }
        const m = cloudError(r.code); render(); if (m) toast(m); return;
      }
    }
    const lang = S.lang, theme = S.theme;
    Store.clear(); keep('lang', lang); keep('theme', theme);
    S.account = null; S.profile = null; S.marks = emptyMarks(); S.delAsk = false; S.delReauth = false; S.draft = null; recompute();
    go('welcome'); toast(t('tDeleted'));
  }

  function onAction(a, v) {
    const d = S.draft;
    switch (a) {
      case 'go': S.delAsk = false; S.delReauth = false; S.sheet = null; if (v !== 'setup') { S.draft = null; S.done = false; } go(v); return;
      case 'lang': S.lang = S.lang === 'bn' ? 'en' : 'bn'; Store.set('lang', S.lang); break;
      case 'setlang': S.lang = v; Store.set('lang', v); break;
      case 'theme': S.theme = v; Store.set('theme', v); break;
      case 'start': S.draft = blankDraft(); S.editOne = false; S.done = false; S.step = 0; S.err = ''; S.wq = ''; go('setup'); return;
      case 'edit': S.draft = draftFromProfile(S.profile); S.editOne = true; S.done = false; S.step = +v || 0; S.err = ''; S.wq = ''; S.sheet = null; go('setup'); return;
      case 'wiz-cancel': S.draft = null; go('profile'); return;
      case 'wiz-back': S.err = ''; S.wq = ''; if (S.step === 0) { S.draft = null; go('welcome'); return; } S.step--; window.scrollTo(0, 0); break;
      case 'wiz-next': {
        ['keywords', 'skills', 'avoid'].forEach(k => { const i = document.getElementById('tok-' + k); if (i && i.value.trim()) addToken(k); });
        S.err = validStep(); if (S.err) break;
        S.wq = '';
        if (S.editOne) { commitDraft(); S.draft = null; S.editOne = false; go('profile'); toast(t('tProfile')); return; }
        if (S.step < STEPS - 1) { S.step++; window.scrollTo(0, 0); break; }
        commitDraft(); S.draft = null; S.done = true; S.f = newFilter(); window.scrollTo(0, 0); afterCreate(); break;
      }
      case 'field':
        if (!d.fields.includes(v) && d.fields.length >= 3) { S.err = t('errMax'); break; }
        S.err = ''; toggle(d.fields, v); d.roles = d.roles.filter(r => d.fields.includes(Engine.roleById[r].field)); break;
      case 'role': toggle(d.roles, v); break;
      case 'skill': toggle(d.skills, v); break;
      case 'level': d.level = v; break;
      case 'type': toggle(d.types, v); break;
      case 'bd': d.bd = !d.bd; break;
      case 'remote': d.remote = !d.remote; break;
      case 'salary': d.minSalary = +d.minSalary === +v ? '' : v; break;
      case 'dist-del': d.districts = d.districts.filter(x => x !== v); delete d.areas[v]; break;
      case 'area': { const [dist, area] = v.split('/'); toggle((d.areas[dist] = d.areas[dist] || []), area); break; }
      case 'tok-add': addToken(v); break;
      case 'tok-del': { const i = v.indexOf('|'), key = v.slice(0, i), val = v.slice(i + 1); d[key] = d[key].filter(x => x !== val); break; }
      case 'bucket': S.f.bucket = v; break;
      case 'quick': toggle(S.f.quick, v); break;
      case 'clear-filters': S.f.quick = []; S.f.q = ''; break;
      case 'quick-go': S.f = newFilter(); if (v) S.f.quick = [v]; go('jobs'); return;
      case 'tracker-go': S.stab = v; go('tracker'); return;
      case 'stab': S.stab = v; break;
      case 'open': opener = 'open:' + v; S.sheet = { kind: 'job', id: v }; break;
      case 'close': S.sheet = null; break;
      case 'install':
        if (deferredInstall) { const p = deferredInstall; deferredInstall = null; p.prompt(); if (p.userChoice) p.userChoice.then(c => { if (c && c.outcome === 'accepted') { S.installed = true; render(); } }).catch(() => {}); return; }
        opener = document.activeElement && document.activeElement.dataset.fid; S.sheet = { kind: 'install' }; break;
      case 'save': if (S.marks.saved[v]) { delete S.marks.saved[v]; toast(t('tUnsaved')); } else { S.marks.saved[v] = snapshot(v); toast(t('tSaved')); } saveMarks(); break;
      case 'apply': if (S.marks.applied[v]) { delete S.marks.applied[v]; toast(t('tUnapplied')); } else { S.marks.applied[v] = snapshot(v); toast(t('tApplied')); } saveMarks(); break;
      case 'status': { const i = v.lastIndexOf('|'), id = v.slice(0, i); if (S.marks.applied[id]) { S.marks.applied[id].status = v.slice(i + 1); saveMarks(); } break; }
      case 'dismiss': S.marks.dismissed[v] = Date.now(); saveMarks(); recompute(); S.sheet = null; toast(t('tDismissed'), () => { delete S.marks.dismissed[v]; saveMarks(); recompute(); render(); }); break;
      case 'undismiss': delete S.marks.dismissed[v]; saveMarks(); recompute(); break;
      case 'toast-undo': { const el2 = document.getElementById('toast'), fn = el2._undo; el2.innerHTML = ''; el2._undo = null; if (fn) fn(); return; }
      case 'view-demo': toast(t('tDemo')); return;
      case 'gap-add': if (!S.profile.skills.includes(v)) { S.profile.skills.push(v); Store.set('profile', S.profile); recompute(); toast(t('tSkill', { s: esc(v) })); } break;
      case 'del-ask': S.delAsk = true; break;
      case 'del-no': S.delAsk = false; S.delReauth = false; break;
      case 'del-yes': deleteAccount(false); return;
      case 'del-google': deleteAccount(true); return;
      case 'google': googleSignIn(); return;
      case 'google-link': googleLink(); return;
      case 'sign-out': signOutHere(); return;
      default: return;
    }
    render();
  }

  document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (el) onAction(el.dataset.a, el.dataset.v); });
  document.addEventListener('input', e => {
    const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
    if (k === 'q') { S.f.q = el.value; render(); return; }
    if (k === 'sort') { S.f.sort = el.value; render(); return; }
    if (k === 'wq') { S.wq = el.value; render(); return; }
    if (S.draft) { S.draft[k] = el.value; if (k === 'minSalary') { const on = document.querySelector('[data-a="salary"][aria-pressed="true"]'); if (on && +on.dataset.v !== +el.value) on.setAttribute('aria-pressed', 'false'); } }
  });
  document.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'distSel' && el.value && S.draft) { if (!S.draft.districts.includes(el.value)) S.draft.districts.push(el.value); render(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && S.sheet) { S.sheet = null; render(); return; }
    if (e.key !== 'Enter' || !e.target.dataset) return;
    if (e.target.dataset.tok) { e.preventDefault(); addToken(e.target.dataset.tok); render(); }
    else if (e.target.dataset.in === 'name' || e.target.dataset.in === 'contact') { e.preventDefault(); onAction('wiz-next'); }
  });
  window.addEventListener('hashchange', () => { resolveRoute(); render(); });
  document.addEventListener('error', e => { const el = e.target; if (el && el.tagName === 'IMG' && el.parentNode && el.parentNode.classList.contains('logo')) { badLogos.add(el.getAttribute('src')); el.remove(); } }, true);
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });
  window.addEventListener('appinstalled', () => { S.installed = true; deferredInstall = null; render(); });

  /* ── jobs: the examples first, then the robot's jobs.json if it is there ── */
  async function loadLiveJobs() {
    try {
      const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 6000);
      const res = await fetch('jobs.json', { signal: ctl.signal, cache: 'no-store' }); clearTimeout(timer);
      if (!res.ok) return;
      const data = await res.json(), list = Array.isArray(data) ? data : data && data.jobs;
      if (!Array.isArray(list) || !list.length) return;
      S.updatedAt = (data && data.updatedAt) || '';
      S.jobs = Engine.prepareJobs(list); S.demo = false; recompute(); render();
    } catch { /* no jobs.json yet: the examples stay */ }
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !inFrame) navigator.serviceWorker.register('sw.js').catch(() => {});

  /* back online, or back to this tab: send what is waiting, or pick up changes made on another device */
  window.addEventListener('online', () => { if (Cloud.status === 'failed') connect(); else if (Store.get('dirty', false)) Sync.push(); });
  let lastLook = Date.now();
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible' || Date.now() - lastLook < 30000 || S.busy || S.draft) return;
    lastLook = Date.now();
    const u = Cloud.user();
    if (!u || !S.account || S.account.uid !== u.uid) return;
    if (Store.get('dirty', false)) { Sync.push(); return; }
    const r = await Cloud.load(u.uid);
    if (r.ok && !r.data && Store.get('syncedUid', '') === u.uid) { await forgetHere(); toast(t('tGone')); return; }
    if (r.ok && r.data && r.data.account && r.data.profile && (r.data.updatedAt || 0) > Store.get('updatedAt', 0) && !Store.get('dirty', false)) { applyRemote(r.data); resolveRoute(); render(); }
  });

  recompute(); resolveRoute(); render(); loadLiveJobs(); connect();
})();

