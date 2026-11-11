/* ───────── Interface text: English and বাংলা ───────── */
const APP_NAME = { en: 'JobShathi', bn: 'জবসাথী' };
const TEXT = {
  navJobs: ['Jobs', 'চাকরি'], navSaved: ['Saved', 'সেভ করা'], navProfile: ['Profile', 'প্রোফাইল'],
  langSwitch: ['বাংলা', 'English'], theme: ['Theme', 'থিম'], themeAuto: ['Auto', 'অটো'], themeLight: ['Light', 'লাইট'], themeDark: ['Dark', 'ডার্ক'],

  heroTitle: ['Every morning, the jobs that fit you', 'প্রতিদিন সকালে, আপনার সাথে মেলে এমন চাকরি'],
  heroLead: ['Tell us once what work you want and where. Each day’s new job posts are checked against your skills, education and area, and you see the ones worth applying to.', 'একবার জানান কী কাজ চান আর কোথায় চান। প্রতিদিনের নতুন চাকরির বিজ্ঞপ্তি আপনার দক্ষতা, শিক্ষা ও এলাকার সাথে মিলিয়ে দেখানো হয়—যেগুলোতে আবেদন করা সত্যিই কাজের।'],
  heroCta: ['Set up my job profile', 'আমার প্রোফাইল তৈরি করি'],
  heroNote: ['About two minutes. Free. No CV needed.', 'দুই মিনিটের মতো লাগে। ফ্রি। সিভি লাগবে না।'],
  demoCap: ['How a match looks', 'একটি ম্যাচ দেখতে যেমন'],
  how1: ['Answer a few questions', 'কয়েকটি প্রশ্নের উত্তর দিন'], how1d: ['Your field, the roles you want, your skills, and where you can work.', 'আপনার ক্ষেত্র, পছন্দের পদ, দক্ষতা এবং কোথায় কাজ করতে পারবেন।'],
  how2: ['Every post is read for you', 'প্রতিটি বিজ্ঞপ্তি পড়ে দেখা হয়'], how2d: ['The role, skills, experience, education, age limit and place each post asks for.', 'কোন পদ, কী দক্ষতা, অভিজ্ঞতা, শিক্ষা, বয়সসীমা আর কোন এলাকা চাওয়া হয়েছে।'],
  how3: ['See what fits, and why', 'কোনটি মেলে আর কেন, দেখুন'], how3d: ['Each job shows what you meet and what is missing, with a link to the original post.', 'প্রতিটি চাকরিতে দেখবেন কী মিলছে আর কী বাকি, সাথে মূল বিজ্ঞপ্তির লিংক।'],

  step: ['Step {n} of 5', 'ধাপ {n} / ৫'], back: ['Back', 'পেছনে'], next: ['Next', 'পরের ধাপ'], finish: ['Show my jobs', 'আমার চাকরি দেখাও'], saveChanges: ['Save changes', 'পরিবর্তন সেভ করুন'], cancel: ['Cancel', 'বাতিল'], add: ['Add', 'যোগ করুন'], remove: ['Remove', 'বাদ দিন'],
  q1: ['What kind of work are you looking for?', 'কী ধরনের কাজ খুঁজছেন?'], q1h: ['Choose up to three fields.', 'সর্বোচ্চ তিনটি ক্ষেত্র বেছে নিন।'],
  q2: ['Which roles would you take?', 'কোন কোন পদে কাজ করবেন?'], q2h: ['Pick every role you would accept. More roles, more jobs. Leave a field empty to see all of its roles.', 'যে যে পদে কাজ করতে রাজি, সব বেছে নিন। যত বেশি পদ, তত বেশি চাকরি। কোনো ক্ষেত্রে কিছু না বাছলে তার সব পদ দেখানো হবে।'],
  kw: ['Other job titles or keywords', 'অন্য পদের নাম বা কীওয়ার্ড'], kwPh: ['e.g. Tally operator', 'যেমন: Tally operator'],
  q3: ['What are your skills?', 'আপনার কী কী দক্ষতা আছে?'], q3h: ['Tap the ones you have, and add any that are missing.', 'যেগুলো পারেন সেগুলো বেছে নিন, না থাকলে লিখে যোগ করুন।'],
  skillPh: ['Add another skill', 'আরেকটি দক্ষতা লিখুন'],
  q4: ['About you', 'আপনার সম্পর্কে'], q4h: ['Used to check each post’s requirements. It stays on this device.', 'প্রতিটি বিজ্ঞপ্তির শর্ত মেলাতে লাগে। তথ্য এই ডিভাইসেই থাকে।'],
  name: ['Your name (optional)', 'আপনার নাম (ঐচ্ছিক)'], exp: ['Work experience', 'কাজের অভিজ্ঞতা'], edu: ['Highest education completed', 'সর্বোচ্চ সম্পন্ন শিক্ষা'],
  age: ['Age (optional)', 'বয়স (ঐচ্ছিক)'], ageH: ['Only for posts with an age limit.', 'শুধু বয়সসীমা থাকা বিজ্ঞপ্তির জন্য।'], types: ['Kind of job', 'চাকরির ধরন'],
  q5: ['Where can you work?', 'কোথায় কাজ করতে পারবেন?'], q5h: ['Choose districts, or areas inside a city. Jobs nearby are shown too.', 'জেলা অথবা শহরের ভেতরের এলাকা বেছে নিন। কাছাকাছি এলাকার চাকরিও দেখানো হবে।'],
  anywhere: ['Anywhere in Bangladesh', 'বাংলাদেশের যেকোনো জায়গায়'], remote: ['Remote', 'রিমোট'], remoteLong: ['Remote / work from home', 'রিমোট / বাসা থেকে কাজ'],
  district: ['District', 'জেলা'], pickDistrict: ['Choose a district', 'জেলা বেছে নিন'], areasIn: ['Areas in {d} (leave empty for the whole district)', '{d}-এর এলাকা (পুরো জেলা চাইলে খালি রাখুন)'], division: ['{d} division', '{d} বিভাগ'],
  minSalary: ['Lowest monthly salary you would accept (optional)', 'সর্বনিম্ন যে মাসিক বেতনে রাজি (ঐচ্ছিক)'], minSalaryPh: ['e.g. 20000', 'যেমন: 20000'],
  avoid: ['Words you do not want in a job (optional)', 'যে শব্দ থাকলে চাকরিটি চান না (ঐচ্ছিক)'], avoidPh: ['e.g. night shift', 'যেমন: night shift'],
  errField: ['Choose at least one field to continue.', 'এগোতে অন্তত একটি ক্ষেত্র বেছে নিন।'], errMax: ['Three fields at most. Remove one to add another.', 'সর্বোচ্চ তিনটি ক্ষেত্র। নতুন যোগ করতে একটি বাদ দিন।'],

  jobsTitle: ['Your jobs today', 'আজকের চাকরি'], jobsTitleName: ['{name}, your jobs today', '{name}, আপনার আজকের চাকরি'],
  summary: ['{a} strong and {b} possible matches, out of {n} open posts.', '{n}টি খোলা বিজ্ঞপ্তির মধ্যে {a}টি ভালো ম্যাচ আর {b}টি সম্ভাব্য।'],
  tabStrong: ['Best matches', 'সেরা ম্যাচ'], tabPossible: ['Possible', 'সম্ভাব্য'], tabAll: ['All jobs', 'সব চাকরি'],
  demoBanner: ['These are example posts so you can try the matching. Real posts appear here once the job robot is connected.', 'ম্যাচিং কেমন কাজ করে দেখার জন্য এগুলো উদাহরণ বিজ্ঞপ্তি। জব রোবট যুক্ত হলে এখানে আসল বিজ্ঞপ্তি আসবে।'],
  search: ['Search title or company', 'পদ বা প্রতিষ্ঠানের নাম খুঁজুন'],
  emptyStrong: ['No strong match today', 'আজ কোনো সেরা ম্যাচ নেই'], emptyStrongD: ['Look under Possible, or add more roles and areas in your profile.', '“সম্ভাব্য” ট্যাব দেখুন, অথবা প্রোফাইলে আরও পদ ও এলাকা যোগ করুন।'],
  emptyPossible: ['Nothing here today', 'আজ এখানে কিছু নেই'], emptyPossibleD: ['Every job that fits is already under Best matches.', 'যা মেলে তার সবই “সেরা ম্যাচ”-এ আছে।'],
  emptySearch: ['No job matches that search', 'এই খোঁজে কোনো চাকরি মেলেনি'], emptySearchD: ['Try a shorter word, or clear the search.', 'ছোট শব্দ দিয়ে খুঁজুন, অথবা খোঁজ মুছে দিন।'],
  lookingFor: ['Looking for', 'যা খুঁজছেন'], where: ['Where', 'কোথায়'], level: ['Experience', 'অভিজ্ঞতা'], editProfile: ['Edit profile', 'প্রোফাইল বদলান'], allRoles: ['all roles', 'সব পদ'],
  gapsTitle: ['Skills your matches ask for', 'আপনার ম্যাচগুলো যে দক্ষতা চায়'], gapLine: ['{skill} is in {n} of your {of} matches and not in your profile.', 'আপনার {of}টি ম্যাচের {n}টিতে {skill} চাওয়া হয়েছে, প্রোফাইলে নেই।'], haveIt: ['I have this skill', 'এই দক্ষতা আমার আছে'],

  newToday: ['New today', 'আজ নতুন'], daysLeft: ['{n} days left', 'আর {n} দিন'], lastDay: ['Last day to apply', 'আবেদনের শেষ দিন'], oneDay: ['1 day left', 'আর ১ দিন'], noDeadline: ['Deadline not given', 'শেষ তারিখ দেওয়া নেই'],
  vacancies: ['{n} vacancies', '{n}টি পদ'], salaryNA: ['Salary not mentioned', 'বেতন উল্লেখ নেই'], alsoOn: ['Also on {s}', '{s}-এও আছে'],
  fitTitle: ['Your fit', 'আপনার সাথে মিল'], meets: ['Meets {a} of {b}', '{b}টির মধ্যে {a}টি মিলেছে'], scoreSr: ['Match score {n} out of 100', 'ম্যাচ স্কোর ১০০-তে {n}'],
  cRole: ['{l}', '{l}'], cKeyword: ['Your keyword: {l}', 'আপনার কীওয়ার্ড: {l}'], cField: ['In your field: {l}', 'আপনার ক্ষেত্রে: {l}'], cSameField: ['Your field, another role: {l}', 'আপনার ক্ষেত্র, অন্য পদ: {l}'], cKeywordText: ['Mentions your keyword: {l}', 'আপনার কীওয়ার্ড আছে: {l}'], cSkillsRole: ['Uses your skills: {l}', 'আপনার দক্ষতা লাগে: {l}'],
  cSkillsOk: ['Skills you have: {m}', 'আপনার আছে: {m}'], cSkillsPartial: ['You have {m}. Missing: {x}', 'আছে: {m}। নেই: {x}'], cSkillsWarn: ['Missing skills: {x}', 'যে দক্ষতা নেই: {x}'], cSkillsInfo: ['Asks for: {x}', 'চাওয়া হয়েছে: {x}'],
  cLocAreaUnknown: ['{l}, area not mentioned', '{l}, এলাকা উল্লেখ নেই'], cLocNear: ['{l}, near {u}', '{l}, {u}-এর কাছে'], cLocOther: ['{l}, another part of the district', '{l}, জেলার অন্য অংশ'], cLocUnknown: ['Location not mentioned', 'জায়গা উল্লেখ নেই'], cLocNo: ['{l}, outside your areas', '{l}, আপনার এলাকার বাইরে'], cLocRemoteNA: ['Remote job (you did not ask for remote)', 'রিমোট চাকরি (আপনি রিমোট চাননি)'],
  cExpFresher: ['Freshers can apply', 'ফ্রেশাররা আবেদন করতে পারবেন'], cExpOk: ['Experience: {x}', 'অভিজ্ঞতা: {x}'], cExpPartial: ['Asks for {x}; you are close', '{x} চাওয়া হয়েছে; আপনি কাছাকাছি'], cExpWarn: ['Asks for {x} of experience', '{x} অভিজ্ঞতা চাওয়া হয়েছে'],
  years: ['{a}–{b} years', '{a}–{b} বছর'], yearsMin: ['{a}+ years', '{a}+ বছর'], months: ['{a} months', '{a} মাস'],
  cEduOk: ['Education: {x}', 'শিক্ষা: {x}'], cEduWarn: ['Asks for {x}', '{x} চাওয়া হয়েছে'],
  cAgeOk: ['Age limit {x}', 'বয়সসীমা {x}'], cAgeWarn: ['Age limit {x}; you are outside it', 'বয়সসীমা {x}; আপনি এর বাইরে'], cAgeInfo: ['Age limit {x}', 'বয়সসীমা {x}'], ageRange: ['{a}–{b}', '{a}–{b}'], ageMax: ['up to {b}', 'সর্বোচ্চ {b}'], ageMin: ['{a} or older', '{a} বা তার বেশি'],
  cPayOk: ['Salary {x}', 'বেতন {x}'], cPayWarn: ['Salary {x}, below your minimum', 'বেতন {x}, আপনার সর্বনিম্নের নিচে'], cType: ['{x} job, not a kind you chose', '{x} চাকরি, আপনার বাছাইয়ের বাইরে'],
  scam: ['Be careful. This post asks for money or promises unusual income. A real employer never charges a candidate.', 'সাবধান। এই বিজ্ঞপ্তিতে টাকা চাওয়া হয়েছে বা অস্বাভাবিক আয়ের কথা বলা হয়েছে। আসল নিয়োগকর্তা প্রার্থীর কাছে টাকা চায় না।'],
  onlyFemale: ['The post says only women can apply.', 'বিজ্ঞপ্তিতে বলা আছে শুধু নারীরা আবেদন করতে পারবেন।'], onlyMale: ['The post says only men can apply.', 'বিজ্ঞপ্তিতে বলা আছে শুধু পুরুষরা আবেদন করতে পারবেন।'],
  view: ['View post', 'বিজ্ঞপ্তি দেখুন'], save: ['Save', 'সেভ করুন'], saved: ['Saved', 'সেভ করা'], markApplied: ['Mark as applied', 'আবেদন করেছি'], applied: ['Applied', 'আবেদন করা'], notForMe: ['Not for me', 'আমার জন্য নয়'], undo: ['Undo', 'ফিরিয়ে আনুন'],
  tSaved: ['Saved', 'সেভ করা হয়েছে'], tUnsaved: ['Removed from Saved', 'সেভ থেকে বাদ দেওয়া হয়েছে'], tApplied: ['Marked as applied', 'আবেদন করা হিসেবে রাখা হয়েছে'], tUnapplied: ['No longer marked as applied', 'আবেদন চিহ্ন তুলে দেওয়া হয়েছে'], tDismissed: ['Hidden. Jobs like this will rank lower.', 'সরানো হয়েছে। এ ধরনের চাকরি নিচে দেখানো হবে।'], tDemo: ['Example post. A real post opens its original page.', 'উদাহরণ বিজ্ঞপ্তি। আসল বিজ্ঞপ্তিতে মূল পেজ খুলবে।'], tSkill: ['{s} added to your skills', '{s} আপনার দক্ষতায় যোগ হয়েছে'], tProfile: ['Profile saved', 'প্রোফাইল সেভ হয়েছে'],
  hOther: ['Another field', 'অন্য ক্ষেত্র'], hLocation: ['Outside your areas', 'আপনার এলাকার বাইরে'], hAvoid: ['Has a word you avoid: {w}', 'আপনার বাদ দেওয়া শব্দ আছে: {w}'], hDismissed: ['You hid this job', 'আপনি এটি সরিয়েছেন'],

  savedTitle: ['Saved and applied', 'সেভ করা ও আবেদন করা'], tabSaved: ['Saved', 'সেভ করা'], tabApplied: ['Applied', 'আবেদন করা'],
  emptySaved: ['Nothing saved yet', 'এখনো কিছু সেভ করা হয়নি'], emptySavedD: ['Tap Save on a job to keep it here until you apply.', 'চাকরিতে “সেভ করুন” চাপলে আবেদন করা পর্যন্ত এখানে থাকবে।'],
  emptyApplied: ['No applications marked yet', 'এখনো কোনো আবেদন চিহ্নিত নেই'], emptyAppliedD: ['After you apply, tap “Mark as applied” on the job to keep track.', 'আবেদন করার পর চাকরিতে “আবেদন করেছি” চাপুন, হিসাব থাকবে।'],
  appliedOn: ['Applied on {d}', '{d} তারিখে আবেদন'], savedOn: ['Saved on {d}', '{d} তারিখে সেভ'], closed: ['This post has closed.', 'এই বিজ্ঞপ্তির সময় শেষ।'],

  profileTitle: ['Your profile', 'আপনার প্রোফাইল'], fields: ['Fields', 'ক্ষেত্র'], roles: ['Roles', 'পদ'], keywords: ['Keywords', 'কীওয়ার্ড'], skills: ['Skills', 'দক্ষতা'], none: ['None', 'নেই'],
  settings: ['Language and display', 'ভাষা ও ডিসপ্লে'], language: ['Language', 'ভাষা'],
  howTitle: ['How matching works', 'ম্যাচিং কীভাবে কাজ করে'],
  how: [
    'Each post is read for its role, skills, experience, education, age limit, salary and place. A role is recognised by its title, including other spellings and Bangla titles; when the title is vague, the skills in the post decide.|A job gets points for each thing that fits you. Strong matches fit your role and meet the main requirements. Possible matches are close: the same field, a nearby area, or one requirement short.|Nothing is thrown away. Jobs outside your field or areas are under All jobs, each with the reason, so you can check that nothing was missed.',
    'প্রতিটি বিজ্ঞপ্তি থেকে পদ, দক্ষতা, অভিজ্ঞতা, শিক্ষা, বয়সসীমা, বেতন ও জায়গা পড়া হয়। পদের নাম ভিন্ন বানানে বা বাংলায় লেখা থাকলেও ধরা হয়; নাম অস্পষ্ট হলে বিজ্ঞপ্তির দক্ষতা দেখে ঠিক করা হয়।|আপনার সাথে যা যা মেলে তার জন্য চাকরিটি পয়েন্ট পায়। সেরা ম্যাচ মানে পদ মিলেছে এবং মূল শর্তগুলো পূরণ হয়েছে। সম্ভাব্য মানে কাছাকাছি: একই ক্ষেত্র, পাশের এলাকা, অথবা একটি শর্ত কম।|কিছুই ফেলে দেওয়া হয় না। আপনার ক্ষেত্র বা এলাকার বাইরের চাকরি “সব চাকরি”-তে কারণসহ থাকে, যাতে কিছু বাদ পড়ল কি না দেখে নিতে পারেন।'],
  privacyTitle: ['Your data', 'আপনার তথ্য'], privacy: ['Your answers and saved jobs are kept only in this browser on this device. Nothing is sent to a server.', 'আপনার উত্তর ও সেভ করা চাকরি শুধু এই ডিভাইসের এই ব্রাউজারে থাকে। কোনো সার্ভারে পাঠানো হয় না।'],
  storageOff: ['This browser is not keeping data, so your profile will be lost when you close the page.', 'এই ব্রাউজার তথ্য রাখছে না, তাই পেজ বন্ধ করলে প্রোফাইল হারিয়ে যাবে।'],
  deleteData: ['Delete my data from this device', 'এই ডিভাইস থেকে আমার তথ্য মুছুন'], deleteAsk: ['Delete your profile, saved jobs and applications from this device?', 'এই ডিভাইস থেকে প্রোফাইল, সেভ করা চাকরি ও আবেদনের তথ্য মুছে ফেলবেন?'], deleteYes: ['Delete everything', 'সব মুছুন'],
  tk: ['Tk. {x}', '৳{x}'], perMonth: ['', ''],
};

/* ───────── v2: account, home, filters, details, install ───────── */
Object.assign(TEXT, {
  gm: ['Good morning', 'শুভ সকাল'], ga: ['Good afternoon', 'শুভ অপরাহ্ন'], ge: ['Good evening', 'শুভ সন্ধ্যা'],
  navHome: ['Home', 'হোম'], navTracker: ['Tracker', 'ট্র্যাকার'],
  getStarted: ['Get started', 'শুরু করুন'], trust1: ['Free to use', 'সম্পূর্ণ ফ্রি'], trust2: ['English and বাংলা', 'বাংলা ও English'], trust3: ['No CV needed', 'সিভি লাগবে না'],
  q0: ['First, what should we call you?', 'প্রথমে, আপনাকে কী নামে ডাকব?'], q0h: ['Your account is created in this name.', 'এই নামেই আপনার অ্যাকাউন্ট খোলা হবে।'],
  nameLbl: ['Your name', 'আপনার নাম'], namePh: ['e.g. Rakib Hasan', 'যেমন: রাকিব হাসান'], contactLbl: ['Mobile number or email (optional)', 'মোবাইল নম্বর বা ইমেইল (ঐচ্ছিক)'], contactPh: ['01XXXXXXXXX or you@email.com', '01XXXXXXXXX বা you@email.com'],
  contactH: ['For job alerts later. It is never shown to anyone.', 'পরে চাকরির অ্যালার্ট পাঠানোর জন্য। কাউকে দেখানো হয় না।'], errName: ['Enter your name to continue.', 'এগোতে আপনার নাম লিখুন।'],
  cont: ['Continue', 'এগিয়ে যান'], searchRoles: ['Search roles', 'পদ খুঁজুন'], searchSkills: ['Search skills', 'দক্ষতা খুঁজুন'], nSelected: ['{n} selected', '{n}টি বাছাই করা'], noResult: ['Nothing matches. Add it yourself below.', 'কিছু মেলেনি। নিচে নিজে লিখে যোগ করুন।'],
  lvFresher: ['Student or new graduate', 'শিক্ষার্থী বা নতুন গ্র্যাজুয়েট'], 'lv1-3': ['Some experience', 'কিছু অভিজ্ঞতা আছে'], 'lv3-5': ['Experienced', 'অভিজ্ঞ'], 'lv5+': ['Senior', 'সিনিয়র'],
  typesH: ['Leave empty for any kind.', 'যেকোনো ধরন চাইলে খালি রাখুন।'], pickEdu: ['Choose your education', 'শিক্ষাগত যোগ্যতা বেছে নিন'],
  doneTitle: ['Your account is ready, {name}', '{name}, আপনার অ্যাকাউন্ট তৈরি'], doneLead: ['{n} open posts were checked against your profile.', 'আপনার প্রোফাইলের সাথে {n}টি খোলা বিজ্ঞপ্তি মিলিয়ে দেখা হয়েছে।'], doneBest: ['best matches', 'সেরা ম্যাচ'], donePossible: ['possible', 'সম্ভাব্য'], seeJobs: ['See my jobs', 'আমার চাকরি দেখি'],
  heroCount: ['best matches today', 'আজকের সেরা ম্যাচ'], heroSub: ['{b} more possible, from {n} open posts checked', 'আরও {b}টি সম্ভাব্য, {n}টি খোলা বিজ্ঞপ্তি মিলিয়ে'], seeMatches: ['See my matches', 'আমার ম্যাচ দেখি'],
  statNew: ['New today', 'আজ নতুন'], statSoon: ['Closing soon', 'শিগগির শেষ'], statSaved: ['Saved', 'সেভ করা'], statApplied: ['Applied', 'আবেদন করা'],
  topPicks: ['Top picks for you', 'আপনার জন্য সেরা'], seeAll: ['See all jobs', 'সব চাকরি দেখুন'],
  strength: ['Profile strength', 'প্রোফাইলের শক্তি'], strengthH: ['A fuller profile gives sharper matches.', 'প্রোফাইল যত পূর্ণ, ম্যাচ তত নিখুঁত।'], strengthFull: ['Your profile is complete.', 'আপনার প্রোফাইল সম্পূর্ণ।'],
  addAge: ['Add your age', 'বয়স যোগ করুন'], addSalary: ['Add your minimum salary', 'সর্বনিম্ন বেতন যোগ করুন'], addSkills: ['Add more skills', 'আরও দক্ষতা যোগ করুন'], addEdu: ['Add your education', 'শিক্ষাগত যোগ্যতা যোগ করুন'], addContact: ['Add mobile or email', 'মোবাইল বা ইমেইল যোগ করুন'], addRoles: ['Choose your roles', 'পদ বেছে নিন'], addWhere: ['Choose your areas', 'এলাকা বেছে নিন'],
  installTitle: ['Install the app', 'অ্যাপ ইনস্টল করুন'], installLead: ['Open JobShathi from your home screen, like any other app.', 'অন্য অ্যাপের মতো হোম স্ক্রিন থেকে জবসাথী খুলুন।'], install: ['Install', 'ইনস্টল'], installApp: ['Install app', 'অ্যাপ ইনস্টল'],
  installAndroid: ['Android (Chrome): open the ⋮ menu, then tap “Install app” or “Add to Home screen”.', 'Android (Chrome): ⋮ মেনু খুলে “Install app” বা “Add to Home screen” চাপুন।'],
  installIos: ['iPhone (Safari): tap Share, then “Add to Home Screen”.', 'iPhone (Safari): Share চেপে “Add to Home Screen” বেছে নিন।'],
  installPc: ['Computer (Chrome or Edge): click the install icon at the end of the address bar.', 'কম্পিউটার (Chrome বা Edge): অ্যাড্রেস বারের শেষে ইনস্টল আইকনে ক্লিক করুন।'],
  installPreview: ['Installing works when the app is open at its own web address, not inside this preview.', 'অ্যাপটি নিজের ওয়েব ঠিকানায় খোলা থাকলে ইনস্টল কাজ করে, এই প্রিভিউয়ের ভেতরে নয়।'],
  fNew: ['New today', 'আজ নতুন'], fRemote: ['Remote', 'রিমোট'], fSoon: ['Closing soon', 'শিগগির শেষ'], fFresher: ['Fresher friendly', 'ফ্রেশারদের জন্য'],
  sortBy: ['Sort by', 'সাজান'], sMatch: ['Best match', 'সেরা ম্যাচ'], sNew: ['Newest', 'সবচেয়ে নতুন'], sDeadline: ['Deadline', 'শেষ তারিখ'], nJobs: ['{n} jobs', '{n}টি চাকরি'], clearFilters: ['Clear filters', 'ফিল্টার মুছুন'], emptyFilter: ['No job matches these filters', 'এই ফিল্টারে কোনো চাকরি নেই'], emptyFilterD: ['Remove a filter to see more.', 'আরও দেখতে একটি ফিল্টার সরান।'],
  allMet: ['Meets every requirement', 'সব শর্ত মিলেছে'], shMissing: ['Missing: {x}', 'নেই: {x}'], shNear: ['Near {u}', '{u}-এর কাছে'], shAreaNA: ['Area not mentioned', 'এলাকা উল্লেখ নেই'], shOther: ['Other part of {d}', '{d}-এর অন্য অংশ'], shLocNA: ['Location not mentioned', 'জায়গা উল্লেখ নেই'],
  shNeeds: ['Asks {x}', '{x} চায়'], shAge: ['Age limit {x}', 'বয়সসীমা {x}'], shPay: ['Below your salary', 'আপনার বেতনের নিচে'], shRole: ['Related role', 'কাছাকাছি পদ'], shOutside: ['Outside your areas', 'এলাকার বাইরে'],
  fLocation: ['Location', 'জায়গা'], fSalary: ['Salary', 'বেতন'], fType: ['Job type', 'ধরন'], fDeadline: ['Deadline', 'শেষ তারিখ'], fEdu: ['Education', 'শিক্ষা'], fVac: ['Vacancies', 'পদসংখ্যা'], fSource: ['Source', 'উৎস'], close: ['Close', 'বন্ধ করুন'],
  statusLbl: ['Where is it now?', 'এখন কোন পর্যায়ে?'], stApplied: ['Applied', 'আবেদন করা'], stInterview: ['Interview', 'ইন্টারভিউ'], stOffer: ['Offer', 'অফার'], stRejected: ['Not selected', 'নির্বাচিত হইনি'],
  accountOn: ['Account on this device', 'এই ডিভাইসের অ্যাকাউন্ট'], joined: ['Joined {d}', '{d} থেকে যুক্ত'], secWork: ['Work you want', 'যে কাজ চান'], secSkills: ['Skills', 'দক্ষতা'], secAbout: ['About you', 'আপনার সম্পর্কে'], secWhere: ['Where and salary', 'জায়গা ও বেতন'], secAccount: ['Name and contact', 'নাম ও যোগাযোগ'],
  deleteAccount: ['Delete my account', 'আমার অ্যাকাউন্ট মুছুন'], deleteAsk: ['Delete your account, profile, saved jobs and applications from this device?', 'এই ডিভাইস থেকে অ্যাকাউন্ট, প্রোফাইল, সেভ করা চাকরি ও আবেদনের তথ্য মুছে ফেলবেন?'],
  privacy: ['Your account, answers and saved jobs are kept in this browser on this device. Nothing is sent to a server.', 'আপনার অ্যাকাউন্ট, উত্তর ও সেভ করা চাকরি এই ডিভাইসের এই ব্রাউজারে থাকে। কোনো সার্ভারে পাঠানো হয় না।'],
  salaryQuick: ['{x}+', '{x}+'], anyRoleIn: ['All roles in {f}', '{f}-এর সব পদ'],
});
Object.assign(TEXT, {
  tabForYou: ['For you', 'আপনার জন্য'], possibleH: ['Possible matches', 'সম্ভাব্য ম্যাচ'], possibleD: ['Close, but one thing is different or missing.', 'কাছাকাছি, তবে একটি বিষয় ভিন্ন বা কম।'], bestH: ['Best matches', 'সেরা ম্যাচ'],
  emptyForYou: ['No match yet', 'এখনো কোনো ম্যাচ নেই'], emptyForYouD: ['Add more roles or areas in your profile, or look through all jobs.', 'প্রোফাইলে আরও পদ বা এলাকা যোগ করুন, অথবা সব চাকরি দেখুন।'],
  jobsHead: ['Jobs', 'চাকরি'], trackerHead: ['Tracker', 'ট্র্যাকার'], trackerLead: ['Jobs you saved and the ones you applied to.', 'যে চাকরি সেভ করেছেন আর যেগুলোতে আবেদন করেছেন।'],
  today: ['Today', 'আজ'], appliedTag: ['Applied', 'আবেদন করা'], moreInfo: ['Details', 'বিস্তারিত'],
});

/* ───────── v5: who built JobShathi ───────── */
Object.assign(TEXT, {
  creditTitle: ['Built by', 'তৈরি করেছেন'],
  creditName: ['K. M. Arafat Islam', 'কে. এম. আরাফাত ইসলাম'],
  creditRole: ['Founder and developer of JobShathi', 'জবসাথীর প্রতিষ্ঠাতা ও ডেভেলপার'],
  creditBtn: ['Connect on LinkedIn', 'LinkedIn-এ যুক্ত হোন'],
  creditFoot: ['Built by {n}', 'তৈরি করেছেন {n}'],
});

/* ───────── v4: when the job robot last brought new posts ───────── */
Object.assign(TEXT, {
  updatedToday: ['Jobs updated today at {t}', 'আজ {t}-এ চাকরি হালনাগাদ হয়েছে'],
  updatedOn: ['Jobs updated {d} at {t}', '{d} {t}-এ চাকরি হালনাগাদ হয়েছে'],
});

/* ───────── v3: online accounts (Firebase), Google sign-in ───────── */
Object.assign(TEXT, {
  haveAccount: ['Already have an account?', 'আগে থেকেই অ্যাকাউন্ট আছে?'], googleBtn: ['Continue with Google', 'Google দিয়ে চালিয়ে যান'], wait: ['Please wait…', 'একটু অপেক্ষা করুন…'],
  googleTitle: ['Use this account on any device', 'যেকোনো ডিভাইসে এই অ্যাকাউন্ট'], googleLinkH: ['Connect Google once, then open JobShathi on another phone or computer and continue with Google to see the same profile and saved jobs.', 'একবার Google যুক্ত করুন, তারপর অন্য ফোন বা কম্পিউটারে জবসাথী খুলে Google দিয়ে চালিয়ে গেলে একই প্রোফাইল ও সেভ করা চাকরি দেখবেন।'],
  googleOn: ['Connected to Google: {e}', 'Google যুক্ত: {e}'], googleOnH: ['On another device, open JobShathi and tap “Continue with Google”.', 'অন্য ডিভাইসে জবসাথী খুলে “Google দিয়ে চালিয়ে যান” চাপুন।'],
  signOut: ['Sign out on this device', 'এই ডিভাইস থেকে সাইন আউট'],
  accountOnline: ['Account saved online', 'অনলাইনে সেভ করা অ্যাকাউন্ট'],
  tLinked: ['Google connected. Your account now opens on any device.', 'Google যুক্ত হয়েছে। এখন যেকোনো ডিভাইসে আপনার অ্যাকাউন্ট খুলবে।'],
  tWelcomeBack: ['Welcome back, {name}', 'আবার স্বাগতম, {name}'],
  tSwitched: ['This Google account already had a JobShathi account. It is open now.', 'এই Google অ্যাকাউন্টে আগে থেকেই জবসাথী অ্যাকাউন্ট ছিল। সেটি এখন খোলা হয়েছে।'],
  tNoAccount: ['No JobShathi account with this Google account yet. Answer a few questions to create one.', 'এই Google অ্যাকাউন্টে এখনো জবসাথী অ্যাকাউন্ট নেই। কয়েকটি প্রশ্নের উত্তর দিয়ে খুলে নিন।'],
  tSignedOut: ['Signed out on this device', 'এই ডিভাইস থেকে সাইন আউট হয়েছে'], tGone: ['This account was deleted on another device.', 'এই অ্যাকাউন্টটি অন্য ডিভাইস থেকে মুছে ফেলা হয়েছে।'], tDeleted: ['Your account was deleted', 'আপনার অ্যাকাউন্ট মুছে ফেলা হয়েছে'],
  errGoogle: ['Could not sign in with Google. Please try again.', 'Google দিয়ে সাইন ইন করা গেল না। আবার চেষ্টা করুন।'],
  errPopup: ['The Google window was blocked. Allow pop-ups for this site and try again.', 'Google-এর উইন্ডো ব্লক হয়েছে। এই সাইটে পপ-আপ চালু করে আবার চেষ্টা করুন।'],
  errOffline: ['You are offline. Connect to the internet and try again.', 'আপনি অফলাইনে আছেন। ইন্টারনেটে যুক্ত হয়ে আবার চেষ্টা করুন।'],
  errCloud: ['Online accounts are not reachable right now. Your data is safe on this device. Try again in a moment.', 'এই মুহূর্তে অনলাইন অ্যাকাউন্টে যুক্ত হওয়া যাচ্ছে না। আপনার তথ্য এই ডিভাইসে নিরাপদ আছে। একটু পরে আবার চেষ্টা করুন।'],
  cloudOff: ['Online saving is not working right now, so changes are kept on this device and saved to your account when it is back.', 'এই মুহূর্তে অনলাইনে সেভ হচ্ছে না, তাই পরিবর্তন এই ডিভাইসে রাখা হচ্ছে এবং ফিরে এলে আপনার অ্যাকাউন্টে সেভ হবে।'],
  q4h: ['Used to check each post’s requirements. Only you can see it.', 'প্রতিটি বিজ্ঞপ্তির শর্ত মেলাতে লাগে। শুধু আপনিই দেখতে পারবেন।'],
  privacy: ['Your account, answers and saved jobs are saved in your JobShathi account, so you can use them on any device. A copy also stays in this browser so the app opens fast and works offline. Only you can see your data.', 'আপনার অ্যাকাউন্ট, উত্তর ও সেভ করা চাকরি আপনার জবসাথী অ্যাকাউন্টে সেভ থাকে, তাই যেকোনো ডিভাইসে ব্যবহার করতে পারবেন। অ্যাপ দ্রুত খোলা ও অফলাইনে চলার জন্য একটি কপি এই ব্রাউজারেও থাকে। আপনার তথ্য শুধু আপনিই দেখতে পারবেন।'],
  deleteAsk: ['Delete your account, profile, saved jobs and applications? They are removed from every device.', 'অ্যাকাউন্ট, প্রোফাইল, সেভ করা চাকরি ও আবেদনের তথ্য মুছে ফেলবেন? সব ডিভাইস থেকে মুছে যাবে।'],
  delReauth: ['For your safety, confirm with Google once more to delete the account.', 'নিরাপত্তার জন্য অ্যাকাউন্ট মুছতে আরেকবার Google দিয়ে নিশ্চিত করুন।'], confirmGoogle: ['Confirm with Google', 'Google দিয়ে নিশ্চিত করুন'],
});

