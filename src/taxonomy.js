/* ───────── Fields → roles → synonyms → skills ─────────
   How a job title is read (src/engine.js, classify):
     1. `syn` of a role: an exact wording of the title ("accounts officer"). Strongest.
     2. `kw` of a role and `words` of a field: single loose words ("sales", "engineer"). They count
        only when the portal's category does not point to another field.
     3. `cats`: the job portal's own category. `loose` are vague categories used as a last resort.
   Everything is lower case. Add a wording to `syn` and the matcher knows it from the next load.
   Role ids and skill names are saved in people's profiles: never rename or remove one. */
const SPECIALTIES = ['cardiology', 'neurology', 'neuromedicine', 'neurosurgery', 'urology', 'nephrology', 'endocrinology', 'oncology', 'gynaecology', 'gynecology', 'gynae', 'obstetrics', 'paediatrics', 'pediatrics', 'orthopaedics', 'orthopedics', 'dermatology', 'anaesthesiology', 'anesthesiology', 'anaesthesia', 'radiology', 'general surgery', 'surgery', 'medicine', 'laboratory medicine', 'pathology', 'ent', 'ophthalmology', 'psychiatry', 'gastroenterology', 'icu', 'nicu', 'emergency'];
const FIELDS = [
  { id: 'it', en: 'IT & Software', bn: 'আইটি ও সফটওয়্যার', cats: ['it', 'information technology', 'telecommunication', 'software', 'ict'], words: ['software', 'ict', 'telecom', 'fiber', 'isp', 'saas'],
    roles: [
      { id: 'web-dev', en: 'Software / Web Developer', syn: ['software engineer', 'software developer', 'web developer', 'programmer', 'frontend developer', 'front end developer', 'front-end developer', 'backend developer', 'back end developer', 'full stack developer', 'fullstack developer', 'php developer', 'laravel developer', 'react developer', 'javascript developer', 'node js developer', 'nodejs developer', 'mern stack developer', 'python developer', 'django developer', 'java developer', 'asp.net developer', 'dot net developer', 'wordpress developer', 'সফটওয়্যার ইঞ্জিনিয়ার', 'full stack engineer', 'fullstack engineer', 'frontend engineer', 'backend engineer', 'application developer', 'web application developer', '.net developer', 'c# developer', 'vue developer', 'angular developer', 'golang developer', 'ruby on rails developer', 'ওয়েব ডেভেলপার', 'প্রোগ্রামার'], kw: ['developer', 'programmer', 'full stack', 'frontend', 'backend'] },
      { id: 'mobile-dev', en: 'Mobile App Developer', syn: ['mobile app developer', 'flutter developer', 'android developer', 'ios developer', 'react native developer', 'app developer', 'mobile developer', 'mobile application developer', 'android engineer', 'ios engineer', 'flutter engineer'] },
      { id: 'sqa', en: 'SQA / Software Tester', syn: ['sqa engineer', 'software tester', 'qa engineer', 'quality assurance engineer', 'test engineer', 'automation engineer', 'sdet', 'manual tester', 'software quality assurance', 'sqa', 'qa tester', 'quality assurance tester', 'software test engineer', 'qa automation engineer', 'software quality assurance engineer', 'test automation engineer'], kw: ['qa', 'quality assurance', 'testing'] },
      { id: 'data-analyst', en: 'Data Analyst', syn: ['data analyst', 'business intelligence analyst', 'bi analyst', 'mis executive', 'mis officer', 'reporting analyst', 'data scientist', 'business analyst', 'power bi developer', 'business intelligence', 'management information system', 'mis', 'data officer', 'data engineer', 'analytics engineer', 'bi developer', 'data analytics'] },
      { id: 'ai-ml', en: 'AI / ML Engineer', syn: ['machine learning engineer', 'ml engineer', 'ai engineer', 'nlp engineer', 'computer vision engineer', 'data annotator', 'prompt engineer'] },
      { id: 'uiux', en: 'UI/UX Designer', syn: ['ui/ux designer', 'ui ux designer', 'ux designer', 'ui designer', 'product designer', 'web designer', 'ui/ux engineer', 'ui ux engineer', 'ux researcher', 'ui & visual designer', 'visual designer', 'interaction designer'] },
      { id: 'it-support', en: 'IT Support / Network', syn: ['it support officer', 'it support engineer', 'it officer', 'it executive', 'executive it', 'network engineer', 'network administrator', 'system administrator', 'it administrator', 'hardware engineer', 'support engineer', 'noc engineer', 'আইটি অফিসার', 'it manager', 'head of it', 'it specialist', 'it support', 'it assistant', 'it technician', 'it & network officer', 'system engineer', 'computer engineer', 'assistant engineer computer', 'technical support engineer', 'isp support', 'network support', 'oncall engineer', 'on call engineer', 'it help desk', 'helpdesk', 'সহকারী প্রোগ্রামার', 'আইটি সাপোর্ট'], kw: ['it', 'information technology', 'network', 'noc', 'erp', 'transmission'] },
      { id: 'devops', en: 'DevOps / Cloud', syn: ['devops engineer', 'cloud engineer', 'site reliability engineer', 'sre', 'linux administrator', 'database administrator', 'dba', 'cloud infrastructure engineer', 'infrastructure engineer', 'platform engineer', 'server administrator', 'system & server administrator', 'devops'] },
      { id: 'cyber', en: 'Cyber Security', syn: ['cyber security analyst', 'cybersecurity analyst', 'security analyst', 'soc analyst', 'penetration tester', 'information security officer', 'security engineer', 'information security analyst', 'information security', 'cyber security', 'it auditor', 'grc analyst'] },
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'PHP', 'Laravel', 'Python', 'Django', 'Java', 'C#', 'ASP.NET', 'SQL', 'MySQL', 'HTML/CSS', 'WordPress', 'Flutter', 'Android', 'Git', 'REST API', 'Selenium', 'Manual Testing', 'Power BI', 'Tableau', 'Machine Learning', 'Figma', 'Linux', 'Networking', 'MikroTik', 'Cisco', 'AWS', 'Docker', 'TypeScript', 'Vue.js', 'Angular', 'Golang', 'Kubernetes', 'IT Support', 'UI/UX Design', 'Automation Testing', 'Data Analysis'] },

  { id: 'accounting', en: 'Accounting & Finance', bn: 'হিসাব ও অর্থ', cats: ['accounting', 'finance', 'accounts', 'audit'], words: ['fixed asset', 'reconciliation', 'financial'],
    roles: [
      { id: 'accountant', en: 'Accountant / Accounts Officer', syn: ['accountant', 'accounts officer', 'officer accounts', 'accounts executive', 'executive accounts', 'junior accountant', 'senior accountant', 'assistant accountant', 'accounts assistant', 'accounts manager', 'officer (accounts)', 'executive finance & accounts', 'executive - finance & accounts', 'finance & accounts', 'accounts & finance', 'হিসাবরক্ষক', 'হিসাব রক্ষক', 'একাউন্ট্যান্ট', 'অ্যাকাউন্টস অফিসার', 'accounts and finance', 'finance and accounts', 'accountant cum cashier', 'chief accountant', 'cost accountant', 'accounts receivable', 'accounts payable', 'billing executive', 'billing officer', 'হিসাব সহকারী', 'হিসাব কর্মকর্তা', 'হিসাবরক্ষণ কর্মকর্তা', 'অ্যাকাউন্ট্যান্ট'], kw: ['accounts', 'accounting', 'billing'] },
      { id: 'audit', en: 'Audit / Internal Control', syn: ['audit executive', 'audit officer', 'internal auditor', 'auditor', 'audit assistant', 'internal audit', 'audit associate', 'internal control', 'inventory audit', 'audit and compliance', 'অডিট অফিসার', 'নিরীক্ষক'], kw: ['audit'] },
      { id: 'finance', en: 'Finance Executive / Analyst', syn: ['finance executive', 'finance officer', 'financial analyst', 'finance analyst', 'finance manager', 'treasury officer', 'budget officer', 'business finance', 'finance assistant', 'costing assistant', 'financial controller', 'chief financial officer', 'cfo', 'finance specialist'], kw: ['treasury', 'finance', 'budget', 'costing'] },
      { id: 'tax-vat', en: 'Tax & VAT', syn: ['vat executive', 'tax executive', 'vat officer', 'tax officer', 'vat & tax', 'tax consultant', 'income tax', 'vat and tax', 'tax and vat', 'customs & vat'], kw: ['vat', 'tax'] },
      { id: 'cashier', en: 'Cashier', syn: ['cashier', 'cash officer', 'cash executive', 'ক্যাশিয়ার', 'cashier cum accountant', 'cash in charge', 'কোষাধ্যক্ষ'] },
    ],
    skills: ['Tally', 'Excel', 'VAT', 'Income Tax', 'Bookkeeping', 'Bank Reconciliation', 'Financial Reporting', 'QuickBooks', 'ERP', 'Payroll', 'Costing', 'Budgeting', 'IFRS', 'CA (CC)', 'ACCA', 'Accounting', 'Accounting Software', 'Auditing', 'Financial Analysis'] },

  { id: 'bank', en: 'Bank & Financial Services', bn: 'ব্যাংক ও আর্থিক সেবা', cats: ['bank', 'non-bank', 'financial', 'insurance', 'microfinance'], words: ['bank', 'banking', 'insurance', 'microfinance', 'brokerage'],
    roles: [
      { id: 'bank-officer', en: 'Bank Officer / Trainee Officer', syn: ['trainee officer', 'management trainee officer', 'mto', 'probationary officer', 'bank officer', 'junior officer', 'assistant officer', 'trainee assistant officer', 'ব্যাংক অফিসার'] },
      { id: 'credit', en: 'Credit / Loan Officer', syn: ['credit officer', 'loan officer', 'credit analyst', 'credit risk', 'recovery officer', 'collection officer', 'credit management', 'credit recovery', 'credit realization', 'credit inspector', 'special asset management', 'loan recovery'], kw: ['credit', 'recovery', 'collection', 'loan'] },
      { id: 'relationship', en: 'Relationship Officer', syn: ['relationship officer', 'relationship manager', 'direct sales executive', 'dse', 'card sales', 'liability sales', 'sales officer (deposit)'] },
      { id: 'teller', en: 'Teller / Cash Officer (Bank)', syn: ['teller', 'trainee cash officer', 'tco', 'cash officer (bank)', 'universal teller'] },
      { id: 'insurance', en: 'Insurance & Microfinance', syn: ['financial associate', 'insurance officer', 'unit manager', 'underwriter', 'claims officer', 'field officer (microfinance)', 'loan field officer', 'insurance claims associate', 'বীমা কর্মকর্তা'], kw: ['claims'] },
    ],
    skills: ['Banking Operations', 'Credit Analysis', 'Customer Service', 'Excel', 'Sales', 'KYC', 'Cash Handling', 'Financial Reporting', 'Communication', 'Credit Recovery'] },

  { id: 'sales', en: 'Sales & Business Development', bn: 'বিক্রয় ও ব্যবসা উন্নয়ন', cats: ['sales', 'business development', 'marketing/sales', 'showroom', 'salesman', 'retail', 'super shop', 'e-commerce'], loose: ['real estate', 'property'],
    roles: [
      { id: 'sales-exec', en: 'Sales Executive / Officer', syn: ['sales executive', 'sales officer', 'executive sales', 'sales representative', 'sales associate', 'corporate sales executive', 'sales manager', 'area sales manager', 'বিক্রয় প্রতিনিধি', 'সেলস এক্সিকিউটিভ', 'বিক্রয় কর্মকর্তা', 'sales & marketing', 'sales and marketing', 'marketing & sales', 'marketing and sales', 'regional sales manager', 'rsm', 'zonal sales manager', 'national sales manager', 'divisional sales manager', 'asm', 'tsm', 'corporate sales', 'field sales', 'branch sales', 'sales consultant', 'sales coordinator', 'sales admin', 'sales supervisor', 'sales engineer', 'sales promoter', 'sales specialist', 'sales development specialist', 'head of sales', 'সেলস অফিসার', 'সেলস ইঞ্জিনিয়ার', 'সেলস ম্যানেজার', 'বিক্রয় কর্মী', 'বিক্রয় সহকারী', 'মার্কেটিং ও সেলস'], kw: ['sales', 'সেলস', 'বিক্রয়'] },
      { id: 'tso', en: 'Territory Sales Officer', syn: ['territory sales officer', 'tso', 'territory officer', 'territory sales executive', 'territory manager', 'dsr', 'distributor sales representative', 'area manager', 'area sales officer', 'aso', 'territory executive'] },
      { id: 'bde', en: 'Business Development Executive', syn: ['business development executive', 'bde', 'business development officer', 'business development manager', 'business development associate', 'key account manager', 'key account executive', 'partnership executive', 'business development', 'business development specialist', 'key accounts manager', 'key accounts', 'partnership manager', 'account manager', 'customer success manager', 'ব্যবসা উন্নয়ন কর্মকর্তা'] },
      { id: 'retail', en: 'Showroom / Retail Sales', syn: ['showroom sales', 'showroom executive', 'retail sales', 'outlet executive', 'outlet manager', 'store sales', 'sales man', 'salesman', 'fashion consultant', 'brand promoter', 'সেলসম্যান', 'showroom manager', 'showroom in charge', 'showroom incharge', 'showroom assistant', 'shop assistant', 'outlet in charge', 'outlet incharge', 'outlet operation', 'e-commerce executive', 'ecommerce executive', 'e-commerce sales', 'শোরুম ম্যানেজার', 'শোরুম সেলস', 'দোকান সহকারী'], kw: ['showroom', 'outlet', 'retail', 'e-commerce', 'ecommerce', 'শোরুম'] },
      { id: 'telesales', en: 'Tele Sales', syn: ['tele sales executive', 'telesales executive', 'telemarketing executive', 'tele marketer', 'inside sales', 'telesales', 'tele sales', 'telesales specialist', 'telesales team leader', 'টেলিসেলস'] },
    ],
    skills: ['Sales', 'Negotiation', 'Communication', 'B2B Sales', 'Field Sales', 'CRM', 'Target Achievement', 'Excel', 'Presentation', 'Motorcycle Driving', 'Lead Generation', 'Business Development', 'Dealer Management', 'Telesales', 'Retail Sales'] },

  { id: 'marketing', en: 'Marketing & Digital', bn: 'মার্কেটিং ও ডিজিটাল', cats: ['marketing', 'media', 'advertisement', 'advertising', 'digital marketing', 'public relations', 'content writing'], words: ['communications', 'communication', 'public relations', 'campaign'],
    roles: [
      { id: 'marketing-exec', en: 'Marketing Executive', syn: ['marketing executive', 'marketing officer', 'executive marketing', 'marketing manager', 'marketing associate', 'trade marketing', 'মার্কেটিং অফিসার', 'মার্কেটিং এক্সিকিউটিভ', 'marketing specialist', 'growth marketing specialist', 'marketing coordinator', 'head of marketing', 'chief marketing officer', 'market research', 'pr and communications', 'communications officer', 'communications associate', 'public relations officer', 'মার্কেটিং ম্যানেজার', 'বিপণন কর্মকর্তা'], kw: ['marketing', 'মার্কেটিং', 'বিপণন'] },
      { id: 'brand', en: 'Brand Executive', syn: ['brand executive', 'brand officer', 'brand manager', 'assistant brand manager', 'brand associate', 'brand development', 'brand strategy', 'brand communication', 'ব্র্যান্ড ম্যানেজার'], kw: ['brand', 'branding'] },
      { id: 'digital-marketing', en: 'Digital Marketing Executive', syn: ['digital marketing executive', 'digital marketer', 'digital marketing officer', 'digital marketing specialist', 'performance marketer', 'media buyer', 'facebook marketer', 'ডিজিটাল মার্কেটার', 'digital marketing', 'digital marketing manager', 'performance marketing manager', 'performance marketing', 'digital & social media', 'growth marketer', 'abx marketing specialist', 'marketing operations manager', 'ডিজিটাল মার্কেটিং'] },
      { id: 'seo', en: 'SEO Specialist', syn: ['seo specialist', 'seo executive', 'seo expert', 'seo analyst', 'seo', 'search engine optimization', 'app store optimization'] },
      { id: 'social', en: 'Social Media Manager', syn: ['social media manager', 'social media executive', 'social media moderator', 'page moderator', 'community manager', 'facebook page moderator', 'social media', 'social media expert', 'community management', 'social media marketing', 'influencer'] },
      { id: 'content', en: 'Content Writer', syn: ['content writer', 'copywriter', 'content executive', 'content creator', 'script writer', 'technical writer', 'কনটেন্ট রাইটার', 'content specialist', 'content strategist', 'content manager', 'content writer / creator', 'proofreader', 'copy editor', 'কনটেন্ট ক্রিয়েটর'], kw: ['content'] },
    ],
    skills: ['Digital Marketing', 'Facebook Ads', 'Google Ads', 'SEO', 'Content Writing', 'Copywriting', 'Canva', 'Social Media', 'Email Marketing', 'Google Analytics', 'Market Research', 'Communication', 'Presentation', 'Branding', 'Event Management', 'Public Relations'] },

  { id: 'hr', en: 'HR & Admin', bn: 'এইচআর ও অ্যাডমিন', cats: ['hr', 'human resource', 'admin', 'org. development', 'organization development', 'secretary', 'receptionist'],
    roles: [
      { id: 'hr-exec', en: 'HR Executive / Officer', syn: ['hr executive', 'hr officer', 'executive hr', 'human resource executive', 'human resources officer', 'hr manager', 'hr generalist', 'hr & admin', 'hr and admin', 'officer hr', 'এইচআর অফিসার', 'এইচআর এক্সিকিউটিভ', 'human resources', 'human resource', 'hr business partner', 'hrbp', 'hr admin & compliance', 'hr & compliance', 'hr operation', 'hr intern', 'head of hr', 'chro', 'people operations', 'compensation & benefits', 'training & development', 'training and development', 'learning & development', 'learning and development', 'training officer', 'employee relations', 'industrial relations', 'মানবসম্পদ কর্মকর্তা', 'মানব সম্পদ কর্মকর্তা', 'এইচআর ম্যানেজার'], kw: ['hr', 'welfare', 'মানবসম্পদ'] },
      { id: 'recruiter', en: 'Recruiter / Talent Acquisition', syn: ['recruiter', 'talent acquisition', 'recruitment executive', 'recruitment officer', 'hiring executive', 'technical recruiter', 'manpower recruiting', 'talent acquisition specialist'], kw: ['recruitment', 'recruiting'] },
      { id: 'admin', en: 'Admin Officer', syn: ['admin officer', 'admin executive', 'administrative officer', 'executive admin', 'administration officer', 'office manager', 'অ্যাডমিন অফিসার', 'manager administration', 'admin manager', 'administrative assistant', 'admin assistant', 'protocol officer', 'protocol assistant', 'executive coordination', 'প্রশাসন কর্মকর্তা', 'অ্যাডমিন'], kw: ['administration', 'admin', 'protocol', 'প্রশাসন'] },
      { id: 'compliance', en: 'Compliance Officer', syn: ['compliance officer', 'compliance executive', 'welfare officer', 'compliance manager', 'social compliance', 'internal control & compliance', 'কমপ্লায়েন্স অফিসার'], kw: ['compliance'] },
      { id: 'pa', en: 'Executive / Personal Assistant', syn: ['executive assistant', 'personal assistant', 'personal secretary', 'pa to md', 'pa to chairman', 'secretary', 'business assistant', 'ব্যক্তিগত সহকারী'], kw: ['pa'] },
    ],
    skills: ['Recruitment', 'Payroll', 'Labour Law', 'HRIS', 'Excel', 'MS Office', 'Communication', 'Office Management', 'Compliance', 'Training Coordination', 'HR Management', 'Employee Relations'] },

  { id: 'support', en: 'Customer Support & Call Center', bn: 'কাস্টমার সাপোর্ট ও কল সেন্টার', cats: ['customer service', 'call centre', 'call center', 'customer support', 'bpo'],
    roles: [
      { id: 'cs-exec', en: 'Customer Support Executive', syn: ['customer support executive', 'customer service executive', 'customer care executive', 'customer service officer', 'customer support officer', 'customer relationship officer', 'customer experience executive', 'support executive', 'client service executive', 'কাস্টমার কেয়ার', 'কাস্টমার সার্ভিস', 'customer service representative', 'customer service manager', 'customer success officer', 'customer success specialist', 'customer care officer', 'client experience', 'patient experience', 'customer experience', 'customer relationship executive', 'cre', 'support coordinator', 'support specialist', 'গ্রাহক সেবা কর্মকর্তা', 'গ্রাহক সেবা প্রতিনিধি'], kw: ['customer service', 'customer care', 'customer support', 'customer success', 'গ্রাহক সেবা'] },
      { id: 'call-center', en: 'Call Center Agent', syn: ['call center agent', 'call centre agent', 'call center executive', 'contact center agent', 'contact centre executive', 'customer service agent', 'কল সেন্টার এজেন্ট', 'call center', 'call centre', 'contact center', 'call center coordinator', 'কল সেন্টার'] },
      { id: 'coordinator', en: 'Student / Client Coordinator', syn: ['student support coordinator', 'batch coordinator', 'student counselor', 'student counsellor', 'admission officer', 'client coordinator', 'program coordinator', 'education counselor', 'academic counsellor', 'academic counselor', 'counsellor', 'counselor', 'admission counselor', 'স্টুডেন্ট কাউন্সেলর'] },
    ],
    skills: ['Customer Service', 'Communication', 'English Communication', 'Typing', 'MS Office', 'CRM', 'Problem Solving', 'Live Chat', 'Call Handling'] },

  { id: 'garments', en: 'Garments & Textile', bn: 'গার্মেন্টস ও টেক্সটাইল', cats: ['garments', 'textile', 'rmg', 'buying house', 'swing machine operator', 'garments technician', 'garments tehnician'], words: ['garments', 'garment', 'rmg', 'apparel', 'woven', 'knit', 'sweater', 'denim', 'fabric', 'fabrics', 'yarn', 'textile', 'গার্মেন্টস'],
    roles: [
      { id: 'merchandiser', en: 'Merchandiser', syn: ['merchandiser', 'merchandizer', 'junior merchandiser', 'senior merchandiser', 'assistant merchandiser', 'trainee merchandiser', 'merchandising executive', 'মার্চেন্ডাইজার', 'merchandising', 'merchandising manager', 'head of merchandising'] },
      { id: 'garments-quality', en: 'Quality (QC / QA)', syn: ['qa executive (garments)', 'garments quality', 'fabric quality', 'গার্মেন্টস কোয়ালিটি'] },
      { id: 'ie', en: 'IE / Production', syn: ['ie officer', 'ie executive', 'industrial engineer', 'industrial engineering', 'head of ie', 'work study officer', 'line chief', 'floor in charge', 'supervisor (production)', 'garments planning', 'fabric planning', 'knitting planning', 'লাইন চিফ'], kw: ['ie', 'work study'] },
      { id: 'garments-commercial', en: 'Commercial (Export / Import)', syn: ['commercial officer', 'commercial executive', 'executive commercial', 'commercial manager', 'export officer', 'import officer', 'commercial (export)', 'customs & bond', 'commercial & customs bond', 'export import'] },
      { id: 'textile-eng', en: 'Textile Engineer', syn: ['textile engineer', 'dyeing officer', 'knitting officer', 'lab technician (textile)', 'washing officer', 'cad designer', 'pattern master', 'pattern maker', 'fashion designer', 'garment technologist', 'garments technologist', 'textile lab', 'fabric technology', 'pattern cutter', 'sample manager', 'sample man', 'cutting master', 'sewing operator', 'swing machine operator', 'sewing machine operator', 'knitting operator', 'dyeing master', 'printing master', 'সুইং অপারেটর', 'কাটিং মাস্টার'], kw: ['knitting', 'dyeing', 'washing', 'finishing', 'sewing', 'cutting'] },
    ],
    skills: ['Merchandising', 'Costing', 'Buyer Communication', 'Fabric Knowledge', 'Excel', 'LC', 'Export Documentation', 'Quality Control', 'AQL', 'Line Balancing', 'Production Planning', 'Garments Production', 'Textile Knowledge', 'Fashion Design', 'Knitting', 'Dyeing', 'Washing'] },

  { id: 'engineering', en: 'Engineering & Technical', bn: 'প্রকৌশল ও কারিগরি', cats: ['engineer', 'architect', 'engineering', 'technical', 'electrician', 'mechanic', 'welder', 'plumber', 'construction'], words: ['engineer', 'engineering', 'technical', 'ইঞ্জিনিয়ার', 'প্রকৌশলী'],
    roles: [
      { id: 'civil', en: 'Civil Engineer', syn: ['civil engineer', 'site engineer', 'project engineer', 'sub assistant engineer (civil)', 'sub-assistant engineer civil', 'assistant engineer (civil)', 'assistant engineer civil', 'উপসহকারী প্রকৌশলী (পুর)', 'সহকারী প্রকৌশলী (পুর)', 'diploma engineer civil', 'quantity surveyor', 'সিভিল ইঞ্জিনিয়ার', 'sub engineer', 'sub assistant engineer', 'construction engineer', 'structural engineer', 'civil and structural engineer', 'resident engineer', 'site in charge', 'site incharge', 'site supervisor', 'foreman', 'planning engineer', 'construction manager', 'ডিপ্লোমা সিভিল ইঞ্জিনিয়ার', 'উপ-সহকারী প্রকৌশলী', 'সাইট ইঞ্জিনিয়ার'], kw: ['civil', 'construction', 'structural'] },
      { id: 'electrical', en: 'Electrical / Electronics Engineer', syn: ['electrical engineer', 'eee engineer', 'electronics engineer', 'sub assistant engineer (electrical)', 'assistant engineer (electrical)', 'assistant engineer electrical', 'উপসহকারী প্রকৌশলী (বিদ্যুৎ)', 'সহকারী প্রকৌশলী (বিদ্যুৎ)', 'diploma engineer electrical', 'power engineer', 'ইলেকট্রিক্যাল ইঞ্জিনিয়ার', 'solar engineer', 'junior engineer (electrical)', 'engineer electrical', 'maintenance officer (electrical)', 'sub assistant engineer telecom', 'lineman', 'wireman', 'ডিপ্লোমা ইলেকট্রিক্যাল ইঞ্জিনিয়ার', 'লাইনম্যান'], kw: ['electrical', 'electronics', 'solar'] },
      { id: 'mechanical', en: 'Mechanical / Maintenance Engineer', syn: ['mechanical engineer', 'maintenance engineer', 'sub assistant engineer (mechanical)', 'assistant engineer (mechanical)', 'assistant engineer mechanical', 'machine operator', 'উপসহকারী প্রকৌশলী (যান্ত্রিক)', 'সহকারী প্রকৌশলী (যান্ত্রিক)', 'utility engineer', 'service engineer', 'plant engineer', 'maintenance officer', 'maintenance manager', 'maintenance head', 'maintenance in charge', 'design engineer', 'mechanical designer', 'r&d engineer', 'material engineer', 'engineer mechanical', 'machinist', 'fitter', 'ডিপ্লোমা মেকানিক্যাল ইঞ্জিনিয়ার', 'মেকানিক্যাল ইঞ্জিনিয়ার'], kw: ['mechanical', 'maintenance', 'utility', 'hvac'] },
      { id: 'draftsman', en: 'AutoCAD / Draftsman', syn: ['autocad operator', 'draftsman', 'cad operator', 'auto cad designer', 'junior architect', 'architect', 'interior designer', 'architect & interior designer', 'interior architect', '3d designer', '3d visualizer', 'cad manager'], kw: ['interior'] },
      { id: 'technician', en: 'Technician / Electrician', syn: ['technician', 'electrician', 'ac technician', 'service technician', 'mechanic', 'generator operator', 'plumber', 'welder', 'ইলেকট্রিশিয়ান', 'টেকনিশিয়ান', 'service expert', 'carpenter', 'machineman', 'hvac operator', 'cctv operator', 'cctv technician', 'lift operator', 'lift technician', 'মেকানিক', 'ওয়েল্ডার', 'প্লাম্বার', 'কার্পেন্টার'] },
    ],
    skills: ['AutoCAD', 'Site Supervision', 'Estimation', 'BOQ', 'PLC', 'Electrical Wiring', 'Maintenance', 'Generator', 'HVAC', 'Project Management', 'MS Office', 'Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Solar'] },

  { id: 'education', en: 'Education & Training', bn: 'শিক্ষা ও প্রশিক্ষণ', cats: ['education', 'training', 'teacher', 'teaching', 'coaching'],
    roles: [
      { id: 'teacher', en: 'Teacher', syn: ['teacher', 'assistant teacher', 'english teacher', 'math teacher', 'mathematics teacher', 'science teacher', 'class teacher', 'junior teacher', 'subject teacher', 'school teacher', 'ict teacher', 'শিক্ষক', 'সহকারী শিক্ষক', 'শিক্ষিকা', 'bangla teacher', 'physics teacher', 'chemistry teacher', 'biology teacher', 'arabic teacher', 'art teacher', 'play group teacher', 'kindergarten teacher', 'primary teacher', 'head teacher', 'প্রধান শিক্ষক', 'সহকারী শিক্ষিকা'], kw: ['teacher', 'teaching'] },
      { id: 'lecturer', en: 'Lecturer', syn: ['lecturer', 'assistant professor', 'faculty member', 'প্রভাষক', 'associate professor', 'professor', 'senior lecturer', 'adjunct faculty', 'সহকারী অধ্যাপক', 'অধ্যাপক'], kw: ['faculty'] },
      { id: 'tutor', en: 'Tutor / Instructor', syn: ['tutor', 'home tutor', 'instructor', 'course instructor', 'coaching teacher', 'mentor', 'teaching assistant', 'trainer', 'corporate trainer', 'প্রশিক্ষক', 'training manager', 'master trainer', 'skill trainer', 'প্রশিক্ষণ কর্মকর্তা'], kw: ['trainer', 'training'] },
      { id: 'librarian', en: 'Librarian', syn: ['librarian', 'deputy librarian', 'assistant librarian', 'senior assistant librarian', 'library assistant', 'library officer', 'cataloger', 'গ্রন্থাগারিক', 'সহকারী গ্রন্থাগারিক', 'লাইব্রেরিয়ান'], kw: ['library'] },
      { id: 'academic', en: 'Academic Coordinator', syn: ['academic coordinator', 'academic officer', 'academic executive', 'curriculum developer', 'principal', 'vice principal', 'academic administrator', 'head of academics', 'exam controller', 'অধ্যক্ষ'], kw: ['academic'] },
    ],
    skills: ['Teaching', 'Classroom Management', 'English Communication', 'Lesson Planning', 'MS Office', 'Presentation', 'Curriculum Development', 'Training Delivery'] },

  { id: 'health', en: 'Healthcare & Pharma', bn: 'স্বাস্থ্য ও ফার্মা', cats: ['medical', 'pharma', 'pharmaceutical', 'biotech', 'healthcare', 'hospital', 'health', 'nurse', 'pathologist', 'lab assistant', 'doctor', 'dental'], words: ['medical', 'clinical', 'hospital', 'healthcare', 'pharma', 'pharmaceutical', 'dental', 'patient', 'diagnostic', 'মেডিকেল', 'হাসপাতাল'],
    roles: [
      { id: 'mpo', en: 'Medical Promotion Officer', syn: ['medical promotion officer', 'mpo', 'medical representative', 'medical information officer', 'mio', 'professional services officer', 'pso', 'মেডিকেল প্রমোশন অফিসার', 'pharma sales', 'মেডিকেল রিপ্রেজেন্টেটিভ'] },
      { id: 'nurse', en: 'Nurse', syn: ['nurse', 'staff nurse', 'senior staff nurse', 'registered nurse', 'nursing supervisor', 'নার্স', 'nursing', 'nursing superintendent', 'matron', 'nursing officer', 'midwife', 'patient care attendant', 'pca', 'caregiver', 'ward boy', 'aya', 'সিনিয়র স্টাফ নার্স', 'স্টাফ নার্স', 'মিডওয়াইফ', 'আয়া'] },
      { id: 'doctor', en: 'Doctor / Medical Officer', syn: ['medical officer', 'doctor', 'resident medical officer', 'rmo', 'duty doctor', 'consultant (medical)', 'মেডিকেল অফিসার', 'general physician', 'physician', 'radiologist', 'dental surgeon', 'dentist', 'surgeon', 'registrar', 'medical consultant', 'specialist doctor', 'মেডিসিন বিশেষজ্ঞ', 'বিশেষজ্ঞ চিকিৎসক', 'ডাক্তার', 'চিকিৎসক', ...SPECIALTIES.map(x => 'consultant ' + x), ...SPECIALTIES.map(x => 'specialist ' + x), ...SPECIALTIES.map(x => 'registrar ' + x)] },
      { id: 'pharmacist', en: 'Pharmacist / Chemist', syn: ['pharmacist', 'pharmacy assistant', 'production pharmacist', 'qa officer (pharma)', 'qc officer (pharma)', 'ফার্মাসিস্ট', 'chemist', 'analytical chemist', 'r&d chemist', 'qc chemist', 'microbiologist', 'pharmacy in charge', 'কেমিস্ট'], kw: ['pharmacy'] },
      { id: 'lab-tech', en: 'Medical Technologist', syn: ['medical technologist', 'lab technician', 'lab technologist', 'pathology technologist', 'radiographer', 'physiotherapist', 'phlebotomist', 'pathologist', 'laboratory technician', 'laboratory technologist', 'x-ray technician', 'x-ray in charge', 'x-ray', 'ot in charge', 'ot assistant', 'ot boy', 'ওটি ইনচার্জ', 'medical assistant', 'sacmo', 'paramedic', 'sample collector', 'report processor', 'dental technologist', 'medical technician', 'sonologist', 'মেডিকেল টেকনোলজিস্ট', 'ল্যাব টেকনিশিয়ান', 'ফিজিওথেরাপিস্ট'], kw: ['pathology', 'laboratory', 'radiology'] },
    ],
    skills: ['Patient Care', 'Pharmacy', 'Sales', 'Communication', 'Lab Testing', 'GMP', 'First Aid', 'Motorcycle Driving', 'BMDC Registration', 'Nursing Registration', 'Nursing', 'Radiology', 'Pharma Sales'] },

  { id: 'design', en: 'Design & Media', bn: 'ডিজাইন ও মিডিয়া', cats: ['design', 'creative', 'media', 'graphic', 'journalism', 'animation', 'multimedia'], words: ['design', 'creative', 'multimedia'],
    roles: [
      { id: 'graphic', en: 'Graphic Designer', syn: ['graphic designer', 'graphics designer', 'graphic design executive', 'visualizer', 'creative designer', 'junior graphic designer', 'গ্রাফিক ডিজাইনার', 'visual communications designer', 'graphics & creative', 'static designer', 'graphic design', 'junior executive visualizer', 'গ্রাফিক্স ডিজাইনার'], kw: ['graphic', 'graphics', 'visual', 'designer'] },
      { id: 'video', en: 'Video Editor / Motion', syn: ['video editor', 'motion graphics designer', 'motion designer', 'animator', 'video editor & motion graphics', 'cinematographer', 'ভিডিও এডিটর', 'video editing', 'motion graphic', 'video producer', 'animation', 'ভিডিও এডিটিং'], kw: ['video', 'motion'] },
      { id: 'photo', en: 'Photographer / Content Creator', syn: ['photographer', 'videographer', 'content creator', 'product photographer', 'cameraman', 'camera man', 'photo editor', 'ক্যামেরাম্যান', 'ফটোগ্রাফার'] },
      { id: 'journalist', en: 'Journalist / Reporter', syn: ['journalist', 'reporter', 'staff reporter', 'sub editor', 'news editor', 'correspondent', 'news presenter', 'news anchor', 'সাংবাদিক', 'রিপোর্টার', 'সংবাদদাতা', 'সহ-সম্পাদক'], kw: ['news', 'editor'] },
    ],
    skills: ['Photoshop', 'Illustrator', 'Canva', 'Premiere Pro', 'After Effects', 'Figma', 'Video Editing', 'Motion Graphics', 'Photography', 'Branding', 'Graphic Design', '3D Design'] },

  { id: 'supply', en: 'Supply Chain & Logistics', bn: 'সাপ্লাই চেইন ও লজিস্টিকস', cats: ['supply chain', 'procurement', 'logistics', 'commercial', 'store', 'warehouse'],
    roles: [
      { id: 'scm', en: 'Supply Chain Executive', syn: ['supply chain executive', 'supply chain officer', 'scm executive', 'supply chain manager', 'planning executive', 'supply chain', 'supply chain management', 'scm', 'supply network', 'inbound supply chain', 'demand planning', 'সাপ্লাই চেইন'] },
      { id: 'procurement', en: 'Procurement / Purchase', syn: ['procurement officer', 'procurement executive', 'purchase officer', 'purchase executive', 'sourcing executive', 'purchase manager', 'ক্রয় কর্মকর্তা', 'procurement manager', 'purchasing manager', 'purchase lead', 'direct procurement', 'bidding & contracts', 'contract management', 'ক্রয় কর্মকর্তা', 'পারচেজ অফিসার'], kw: ['procurement', 'sourcing', 'tender', 'purchase', 'purchasing', 'ক্রয়'] },
      { id: 'store', en: 'Store / Warehouse', syn: ['store officer', 'store keeper', 'storekeeper', 'store executive', 'warehouse officer', 'warehouse executive', 'inventory officer', 'warehouse in charge', 'store in charge', 'স্টোর কিপার', 'স্টোর অফিসার', 'warehouse supervisor', 'warehouse assistant', 'warehouse manager', 'store assistant', 'store supervisor', 'store manager', 'officer store', 'executive store', 'manager store', 'yarn store', 'inventory control', 'inventory management', 'stock controller', 'ভান্ডার রক্ষক', 'স্টোর ম্যানেজার', 'গুদাম রক্ষক'], kw: ['store', 'warehouse', 'inventory', 'stock', 'স্টোর'] },
      { id: 'logistics', en: 'Logistics / Distribution', syn: ['logistics officer', 'logistics executive', 'distribution officer', 'distribution executive', 'delivery coordinator', 'fleet officer', 'operations executive', 'operation executive', 'logistics supervisor', 'shipping & logistics', 'shipping operation', 'shipping executive', 'fleet coordinator', 'transport coordinator', 'transport officer', 'distribution manager', 'delivery agent', 'dispatch', 'লজিস্টিক অফিসার'], kw: ['logistics', 'shipping', 'fleet', 'transport', 'distribution'] },
      { id: 'commercial', en: 'Commercial (Export / Import)', syn: ['commercial officer', 'commercial executive', 'executive commercial', 'commercial manager', 'officer commercial', 'export officer', 'import officer', 'manager export', 'manager import', 'export import', 'c&f', 'কমার্শিয়াল অফিসার'], kw: ['commercial', 'export', 'import', 'customs'] },
    ],
    skills: ['Inventory Management', 'Procurement', 'Excel', 'ERP', 'Vendor Management', 'Negotiation', 'LC', 'Logistics', 'Warehouse Management', 'Import/Export', 'Supply Chain'] },

  { id: 'ngo', en: 'NGO & Development', bn: 'এনজিও ও উন্নয়ন', cats: ['ngo', 'social work', 'non-profit', 'nonprofit'], loose: ['project', 'research', 'consultancy'], words: ['ngo', 'livelihood', 'gbv', 'safeguarding', 'humanitarian'],
    roles: [
      { id: 'program-officer', en: 'Program / Project Officer', syn: ['program officer', 'programme officer', 'project officer', 'project coordinator', 'program coordinator (ngo)', 'project manager', 'program manager', 'প্রোগ্রাম অফিসার', 'প্রজেক্ট অফিসার', 'head of program', 'program lead', 'programme manager', 'project lead', 'technical coordinator', 'case worker', 'case manager', 'zonal manager (ngo)', 'প্রকল্প সমন্বয়কারী', 'প্রোগ্রাম ম্যানেজার'], kw: ['program', 'programme', 'project'] },
      { id: 'field-officer', en: 'Field / Community Officer', syn: ['field officer', 'field facilitator', 'community mobilizer', 'community organizer', 'field supervisor', 'credit officer (ngo)', 'ফিল্ড অফিসার', 'মাঠ কর্মী', 'মাঠকর্মী', 'community health worker', 'social mobilizer', 'camp organizer', 'মাঠ সংগঠক', 'কমিউনিটি অর্গানাইজার'] },
      { id: 'me', en: 'Monitoring & Evaluation', syn: ['monitoring and evaluation officer', 'm&e officer', 'meal officer', 'monitoring officer', 'research associate', 'research assistant', 'enumerator', 'data collector', 'monitoring evaluation accountability and learning', 'monitoring & evaluation', 'monitoring and evaluation', 'research & evaluation', 'research lead', 'clinical research', 'researcher', 'research officer (ngo)', 'গবেষণা সহকারী'], kw: ['meal', 'monitoring', 'evaluation', 'research'] },
    ],
    skills: ['Project Management', 'Report Writing', 'Field Work', 'Community Mobilization', 'Monitoring & Evaluation', 'Data Collection', 'Communication', 'MS Office', 'Motorcycle Driving', 'Proposal Writing', 'Training Facilitation'] },

  { id: 'office', en: 'Data Entry & Office Support', bn: 'ডাটা এন্ট্রি ও অফিস সাপোর্ট', cats: ['data entry', 'operator', 'office', 'peon', 'translator', 'interpreter'], loose: ['general management', 'administration', 'others'], words: ['office', 'অফিস'],
    roles: [
      { id: 'data-entry', en: 'Data Entry / Computer Operator', syn: ['data entry operator', 'computer operator', 'data entry executive', 'data entry officer', 'data processor', 'typist', 'ডাটা এন্ট্রি অপারেটর', 'কম্পিউটার অপারেটর', 'computer typist', 'stenographer', 'steno typist', 'steno-typist', 'short hand typist', 'shorthand typist', 'stenographer cum computer operator', 'data entry', 'data entry analyst', 'document controller', 'সাঁটলিপিকার', 'সাঁট মুদ্রাক্ষরিক', 'মুদ্রাক্ষরিক', 'ডাটা এন্ট্রি'], kw: ['typist'] },
      { id: 'office-assistant', en: 'Office Assistant', syn: ['office assistant', 'office executive', 'office support staff', 'office boy', 'peon', 'messenger', 'অফিস সহকারী', 'অফিস সহায়ক', 'office helper', 'office attendant', 'office support', 'bearer', 'dispatch rider', 'অফিস সহকারী কাম কম্পিউটার মুদ্রাক্ষরিক', 'পিয়ন', 'বার্তাবাহক'] },
      { id: 'reception', en: 'Receptionist / Front Desk', syn: ['receptionist', 'front desk executive', 'front desk officer', 'front office executive', 'রিসেপশনিস্ট', 'front desk', 'front desk associate', 'telephone operator', 'রিসিপশনিস্ট', 'অভ্যর্থনাকারী'], kw: ['reception'] },
      { id: 'interpreter', en: 'Translator / Interpreter', syn: ['translator', 'interpreter', 'language interpreter', 'chinese interpreter', 'japanese interpreter', 'korean interpreter', 'chinese translator', 'অনুবাদক', 'দোভাষী'] },
    ],
    skills: ['Typing', 'Bangla Typing', 'MS Office', 'Excel', 'MS Word', 'Communication', 'Email Writing', 'Filing', 'Front Desk', 'Translation'] },

  { id: 'service', en: 'Hospitality, Delivery & Service', bn: 'হসপিটালিটি, ডেলিভারি ও সেবা', cats: ['hospitality', 'hotel', 'travel', 'tourism', 'driving', 'driver', 'security', 'support service', 'delivery', 'deliveryman', 'rider', 'chef', 'cook', 'waiter', 'cleaner', 'housekeeper', 'beauty', 'salon'],
    roles: [
      { id: 'rider', en: 'Delivery Rider', syn: ['delivery rider', 'rider', 'delivery man', 'delivery executive', 'deliveryman', 'courier', 'bike rider', 'ডেলিভারি ম্যান', 'ডেলিভারি রাইডার', 'রাইডার', 'delivery agent', 'picker', 'load unloader', 'লোডার'] },
      { id: 'driver', en: 'Driver', syn: ['driver', 'car driver', 'office driver', 'heavy driver', 'covered van driver', 'ড্রাইভার', 'গাড়ি চালক', 'driver (heavy)', 'driver (light)', 'pickup driver', 'truck driver', 'bus driver', 'motor driver', 'গাড়িচালক', 'চালক'] },
      { id: 'guard', en: 'Security Guard', syn: ['security guard', 'security supervisor', 'security officer', 'guard', 'সিকিউরিটি গার্ড', 'নিরাপত্তা প্রহরী', 'security inspector', 'security assistant', 'security in charge', 'security manager', 'night guard', 'gateman', 'নৈশ প্রহরী', 'নিরাপত্তা কর্মী', 'দারোয়ান'], kw: ['security'] },
      { id: 'chef', en: 'Chef / Cook', syn: ['chef', 'cook', 'commis', 'kitchen helper', 'baker', 'barista', 'বাবুর্চি', 'শেফ', 'head chef', 'sous chef', 'kitchen staff', 'pastry chef', 'রাঁধুনি', 'কুক'], kw: ['kitchen'] },
      { id: 'hotel', en: 'Hotel & Restaurant Service', syn: ['waiter', 'waitress', 'steward', 'restaurant manager', 'front office assistant (hotel)', 'housekeeping', 'room attendant', 'guest relation officer', 'ওয়েটার', 'food & beverage manager', 'f&b', 'hotel manager', 'bell boy', 'হোটেল বয়'], kw: ['hotel', 'restaurant', 'housekeeping'] },
      { id: 'cleaning', en: 'Cleaner / Housekeeping Staff', syn: ['cleaner', 'sweeper', 'cleaning staff', 'janitor', 'caretaker', 'housekeeping staff', 'পরিচ্ছন্নতাকর্মী', 'ক্লিনার', 'ঝাড়ুদার', 'gardener', 'mali', 'maid', 'floor supervisor', 'pest control', 'মালি', 'সুইপার'] },
      { id: 'travel', en: 'Travel & Ticketing', syn: ['ticketing executive', 'reservation officer', 'travel consultant', 'tour executive', 'visa processing officer', 'visa consultant', 'visa officer', 'visa processing', 'tour consultant', 'reservation & ticketing', 'ticketing officer', 'ট্রাভেল এজেন্ট'], kw: ['ticketing', 'visa', 'tour', 'travel'] },
      { id: 'beauty', en: 'Beauty & Salon', syn: ['beautician', 'hair stylist', 'makeup artist', 'skin therapist', 'spa therapist', 'beauty expert', 'বিউটিশিয়ান'], kw: ['beauty', 'salon'] },
    ],
    skills: ['Driving Licence', 'Motorcycle Driving', 'Customer Service', 'Cooking', 'Food Safety', 'Communication', 'Ticketing', 'Smartphone Use', 'Hospitality'] },

  { id: 'production', en: 'Production, Quality & Operations', bn: 'উৎপাদন, মান নিয়ন্ত্রণ ও অপারেশন', cats: ['production', 'operation', 'quality control', 'manufacturing', 'fire safety', 'firefighter'],
    roles: [
      { id: 'prod-officer', en: 'Production Officer / Manager', garments: 'ie', syn: ['production officer', 'production executive', 'production manager', 'production engineer', 'production supervisor', 'production incharge', 'production in charge', 'production planning', 'production planning and inventory control', 'ppic', 'manager production', 'officer production', 'executive production', 'head of factory', 'factory manager', 'plant manager', 'plant head', 'প্রোডাকশন অফিসার', 'প্রোডাকশন ম্যানেজার', 'উৎপাদন কর্মকর্তা', 'ফ্যাক্টরি ম্যানেজার'], kw: ['new product development', 'product development', 'production', 'factory', 'plant', 'planning', 'প্রোডাকশন', 'উৎপাদন'] },
      { id: 'prod-quality', en: 'Quality Assurance / Control', garments: 'garments-quality', syn: ['quality controller', 'quality inspector', 'quality manager', 'quality in charge', 'quality auditor', 'quality control officer', 'quality assurance officer', 'quality assurance manager', 'qc officer', 'qa officer', 'qa manager', 'qc manager', 'qc inspector', 'quality officer', 'quality executive', 'quality engineer', 'engineer quality', 'manager quality', 'qms', 'কোয়ালিটি কন্ট্রোলার', 'কোয়ালিটি ইন্সপেক্টর', 'মান নিয়ন্ত্রণ কর্মকর্তা'], kw: ['quality', 'quality assurance', 'quality control', 'qa', 'qc', 'কোয়ালিটি'] },
      { id: 'operations', en: 'Operations Manager / Executive', syn: ['operations manager', 'operation manager', 'manager operations', 'manager operation', 'operations officer', 'operations lead', 'head of operations', 'general manager operations', 'plant operations lead', 'chief operating officer', 'coo', 'অপারেশন ম্যানেজার'], kw: ['operations', 'operation'] },
      { id: 'plant-operator', en: 'Plant / Machine Operator', syn: ['plant operator', 'boiler operator', 'etp operator', 'stp operator', 'wtp operator', 'oxygen plant operator', 'forklift operator', 'crane operator', 'generator operator (plant)', 'oil movement operator', 'process operator', 'বয়লার অপারেটর', 'মেশিন অপারেটর'], kw: ['operator', 'অপারেটর'] },
      { id: 'safety', en: 'Health, Safety & Environment (EHS)', syn: ['fire safety officer', 'safety officer', 'fire & safety', 'fire and safety', 'health & safety officer', 'health and safety officer', 'ehs officer', 'hse officer', 'ehs executive', 'environment health and safety', 'environment, health & safety', 'health, safety & environment', 'সেফটি অফিসার', 'ফায়ার সেফটি অফিসার'], kw: ['ehs', 'hse', 'safety'] },
    ],
    skills: ['Production Planning', 'Quality Control', 'ISO', 'GMP', 'Lean Manufacturing', '5S', 'Maintenance', 'Fire Safety', 'Team Management', 'Excel'] },

  { id: 'legal', en: 'Legal & Compliance', bn: 'আইন ও কমপ্লায়েন্স', cats: ['legal', 'law', 'company secretary', 'regulatory affairs'],
    roles: [
      { id: 'legal-officer', en: 'Legal Officer / Advisor', syn: ['legal officer', 'legal executive', 'legal advisor', 'legal adviser', 'legal counsel', 'legal manager', 'manager legal', 'officer legal', 'executive legal', 'law officer', 'manager law', 'lawyer', 'advocate', 'legal associate', 'legal assistant', 'legal intern', 'legal affairs', 'law retainer', 'আইন কর্মকর্তা', 'আইন উপদেষ্টা', 'আইন সহকারী', 'আইনজীবী'], kw: ['legal', 'law'] },
      { id: 'company-secretary', en: 'Company Secretary / Regulatory', syn: ['company secretary', 'regulatory affairs', 'corporate affairs', 'board secretary', 'কোম্পানি সচিব'], kw: ['regulatory'] },
    ],
    skills: ['Legal Drafting', 'Contract Review', 'Company Law', 'Labour Law', 'Litigation', 'Legal Research', 'Compliance', 'Communication'] },

  { id: 'agro', en: 'Agriculture & Environment', bn: 'কৃষি ও পরিবেশ', cats: ['agriculture', 'agro', 'fisheries', 'forestry', 'environment', 'livestock', 'poultry'],
    roles: [
      { id: 'agri-officer', en: 'Agriculture Officer / Agronomist', syn: ['agriculture officer', 'agricultural officer', 'agronomist', 'agri officer', 'farm manager', 'farm supervisor', 'farm officer', 'horticulturist', 'agri business', 'কৃষি কর্মকর্তা', 'কৃষিবিদ', 'উপ-সহকারী কৃষি কর্মকর্তা'], kw: ['agriculture', 'agri', 'agro', 'farm', 'কৃষি'] },
      { id: 'livestock', en: 'Veterinary / Livestock / Fisheries', syn: ['veterinary officer', 'veterinarian', 'veterinary surgeon', 'veterinary doctor', 'livestock officer', 'animal husbandry', 'fisheries officer', 'hatchery manager', 'ভেটেরিনারি সার্জন', 'প্রাণিসম্পদ কর্মকর্তা', 'মৎস্য কর্মকর্তা'], kw: ['veterinary', 'livestock', 'poultry', 'fisheries', 'dairy', 'hatchery'] },
      { id: 'environment', en: 'Environment & Climate', syn: ['environment officer', 'environmental officer', 'environmental engineer', 'environment and climate', 'forest officer', 'forester', 'পরিবেশ কর্মকর্তা'], kw: ['environment', 'environmental', 'climate', 'forestry'] },
    ],
    skills: ['Crop Production', 'Farm Management', 'Livestock Care', 'Field Work', 'Report Writing', 'Agro Sales', 'Environmental Compliance'] },

  { id: 'govt', en: 'Government & Public Service', bn: 'সরকারি ও জনসেবা', cats: ['government', 'govt', 'public service', 'ministry', 'directorate', 'autonomous'],
    roles: [
      { id: 'govt-assistant', en: 'Office Assistant (Government)', syn: ['upper division assistant', 'lower division assistant', 'uda', 'lda', 'head assistant', 'certificate assistant', 'certificate peshkar', 'peshkar', 'sayrat assistant', 'mutation assistant', 'record keeper', 'store keeper cum assistant', 'উচ্চমান সহকারী', 'নিম্নমান সহকারী', 'প্রধান সহকারী', 'সার্টিফিকেট সহকারী', 'অফিস সহকারী কাম কম্পিউটার অপারেটর', 'বেঞ্চ সহকারী', 'জারীকারক'], kw: ['chief assistant', 'certificate clerk', 'bench assistant', 'copyist', 'legislative assistant', 'postal operator'] },
      { id: 'govt-officer', en: 'Government Officer', syn: ['administrative officer', 'assistant administrative officer', 'assistant director', 'upazila officer', 'field officer', 'programme officer', 'project officer', 'research officer', 'estimator', 'প্রশাসনিক কর্মকর্তা', 'সহকারী পরিচালক', 'উপজেলা কর্মকর্তা', 'পরিদর্শক', 'বৈজ্ঞানিক কর্মকর্তা', 'সহকারী পরিদর্শক'], kw: ['scientific officer', 'upazila postmaster', 'inspector', 'assistant inspector', 'verification officer', 'investigation officer'] },
      { id: 'govt-support', en: 'Support Staff (Government)', syn: ['office sohayok', 'office sahayok', 'mlss', 'pump operator', 'process server', 'অফিস সহায়ক', 'পাম্প অপারেটর', 'অফিস সহায়ক', 'পরিচ্ছন্নতা কর্মী', 'নিরাপত্তা প্রহরী'], kw: ['porter', 'coolie', 'packer', 'muezzin', 'guide', 'checker', 'counter', 'family welfare assistant', 'fwa'] },
      { id: 'govt-surveyor', en: 'Surveyor / Amin', syn: ['surveyor', 'amin', 'draftsman', 'tracer', 'work assistant', 'সার্ভেয়ার', 'আমিন', 'নকশাকার'], kw: ['calligraphist', 'compositor', 'photo compositor', 'plate maker', 'offset printer', 'inkman', 'monotype caster operator', 'audio-visual unit operator', 'exhibit specialist', 'assistant driller'] },
      { id: 'govt-uniform', en: 'Uniformed Service', syn: ['sub inspector', 'constable', 'ansar', 'fire fighter', 'firefighter', 'cadet', 'sepoy', 'কনস্টেবল', 'সাব ইন্সপেক্টর', 'আনসার', 'ফায়ারম্যান', 'ফায়ার ফাইটার', 'সিপাহী'], kw: ['fireman'] },
    ],
    skills: ['Typing', 'Bangla Typing', 'MS Office', 'Excel', 'MS Word', 'Communication', 'Filing', 'Record Keeping'] },
];

/* Other ways a skill is written in posts (all lower case). */
const SKILL_ALIASES = {
  'Excel': ['ms excel', 'microsoft excel', 'advanced excel', 'spreadsheet', 'এক্সেল'],
  'MS Office': ['microsoft office', 'ms office', 'office package', 'office application', 'computer literacy', 'computer literate'],
  'MS Word': ['ms word', 'microsoft word'],
  'Tally': ['tally erp', 'tally prime', 'tally software', 'ট্যালি'],
  'VAT': ['vat', 'value added tax', 'ভ্যাট'],
  'Income Tax': ['income tax', 'tax return', 'ait', 'tds'],
  'JavaScript': ['javascript', 'java script', ' js ', 'es6'],
  'React': ['react', 'reactjs', 'react.js', 'next.js', 'nextjs'],
  'Node.js': ['node.js', 'nodejs', 'node js', 'express.js'],
  'HTML/CSS': ['html', 'css', 'html5', 'css3', 'tailwind', 'bootstrap'],
  'ASP.NET': ['asp.net', '.net core', 'dot net', '.net'],
  'C#': ['c#', 'c sharp'],
  'SQL': ['sql', 'sql server', 'postgresql', 'oracle database'],
  'REST API': ['rest api', 'restful', 'api integration'],
  'Manual Testing': ['manual testing', 'test case', 'test cases', 'bug reporting'],
  'Power BI': ['power bi', 'powerbi'],
  'Machine Learning': ['machine learning', 'deep learning', 'tensorflow', 'pytorch'],
  'Networking': ['networking', 'lan/wan', 'lan', 'router configuration', 'tcp/ip'],
  'MikroTik': ['mikrotik', 'mtcna'],
  'Cisco': ['cisco', 'ccna'],
  'Photoshop': ['photoshop', 'adobe photoshop'],
  'Illustrator': ['illustrator', 'adobe illustrator'],
  'Premiere Pro': ['premiere pro', 'adobe premiere', 'premiere'],
  'After Effects': ['after effects', 'aftereffects'],
  'Facebook Ads': ['facebook ads', 'meta ads', 'facebook marketing', 'facebook boosting', 'ads manager'],
  'Google Ads': ['google ads', 'adwords', 'ppc'],
  'SEO': ['seo', 'search engine optimization'],
  'English Communication': ['fluent in english', 'good command over english', 'good command of english', 'english communication', 'spoken english', 'verbal and written communication skills in english', 'proficiency in english', 'excellent english'],
  'Communication': ['communication skill', 'communication skills', 'interpersonal skill', 'interpersonal skills', 'good communication'],
  'Customer Service': ['customer service', 'customer support', 'customer handling', 'customer care'],
  'Typing': ['typing speed', 'typing skill', 'fast typing'],
  'Bangla Typing': ['bangla typing', 'bijoy', 'avro', 'বাংলা টাইপিং'],
  'Driving Licence': ['driving licence', 'driving license', 'valid licence', 'valid license', 'ড্রাইভিং লাইসেন্স'],
  'Motorcycle Driving': ['motorcycle', 'motor cycle', 'own bike', 'bike with valid', 'মোটরসাইকেল'],
  'Sales': ['sales experience', 'selling skill', 'sales target', 'achieve target', 'sales skill'],
  'Negotiation': ['negotiation', 'negotiating'],
  'Recruitment': ['recruitment', 'talent acquisition', 'hiring process'],
  'Labour Law': ['labour law', 'labor law', 'bangladesh labour act'],
  'Payroll': ['payroll', 'salary sheet'],
  'ERP': ['erp', 'sap', 'oracle erp', 'odoo'],
  'LC': ['lc', 'l/c', 'letter of credit', 'back to back lc'],
  'AutoCAD': ['autocad', 'auto cad', 'cad drawing'],
  'Merchandising': ['merchandising'],
  'Quality Control': ['quality control', 'inspection', 'qc'],
  'Teaching': ['teaching experience', 'teaching skill', 'classroom teaching'],
  'Report Writing': ['report writing', 'reporting skill'],
  'Presentation': ['presentation skill', 'presentation skills', 'powerpoint'],
  'Bookkeeping': ['bookkeeping', 'book keeping', 'ledger', 'voucher', 'journal entry'],
  'Bank Reconciliation': ['bank reconciliation', 'reconciliation'],
  'Financial Reporting': ['financial statement', 'financial statements', 'financial reporting', 'financial report'],
  'Project Management': ['project management', 'pmp'],
  'Canva': ['canva'],
  'Figma': ['figma', 'adobe xd'],
  'Git': ['git', 'github', 'gitlab'],
  'Smartphone Use': ['smartphone', 'android phone', 'smart phone'],
  'CA (CC)': ['ca cc', 'ca (cc)', 'cacc', 'ca course completed', 'ca partly qualified'],
  'Problem Solving': ['problem solving', 'problem-solving'],
};

/* More wordings of the same skills: the skill tags job portals attach to a post, and Bangla terms.
   Added to SKILL_ALIASES above (a skill listed in both keeps both sets). */
const MORE_ALIASES = {
  // office and general
  'MS Office': ['ms-office', 'computer skills', 'computer knowledge', 'basic computer', 'computer proficiency', 'কম্পিউটার জ্ঞান', 'কম্পিউটার চালনায় দক্ষ', 'এমএস অফিস'],
  'Typing': ['typing', 'computer typing', 'টাইপিং'],
  'Communication': ['communicative', 'যোগাযোগ দক্ষতা', 'যোগাযোগে দক্ষ'],
  'English Communication': ['english proficiency', 'english language proficiency', 'ইংরেজিতে দক্ষ', 'ইংরেজি ভাষায় দক্ষ'],
  'Office Management': ['administrative tasks', 'administrative support', 'administrative assistance', 'administrative operations', 'administrative duties', 'office administration', 'office assistance', 'back office operations', 'back office', 'secretarial skills', 'secretarial', 'general administration'],
  'Front Desk': ['front desk', 'front office support', 'front desk operations', 'front office', 'receptionist duties', 'reception duties'],
  'Translation': ['translation', 'chinese language', 'mandarin', 'অনুবাদ'],
  'Report Writing': ['প্রতিবেদন'],
  'Team Management': ['team management', 'team leadership', 'staff management', 'people management', 'department management', 'technical team management', 'team supervision'],
  'Driving Licence': ['হালকা যানবাহন', 'ভারী যানবাহন', 'ড্রাইভিং'],
  // sales and marketing
  'Target Achievement': ['sales targets', 'sales target', 'sales target achievement', 'exceed sales goals', 'achieving targets', 'টার্গেট'],
  'B2B Sales': ['corporate sales', 'key account management', 'institutional sales'],
  'Field Sales': ['outside sales', 'market visit', 'door to door'],
  'Business Development': ['business development', 'new business development', 'businessdevelopment', 'client development', 'client acquisition', 'global business development'],
  'Dealer Management': ['dealer management', 'dealer operations', 'distributor management', 'channel sales', 'distribution management'],
  'Telesales': ['telesales', 'tele sales', 'telemarketing', 'tele marketing'],
  'Retail Sales': ['retail sales', 'retail management', 'retailoperations', 'retail operations', 'showroom sales', 'store operations'],
  'Digital Marketing': ['digitalmarketing', 'online marketing', 'performance marketing'],
  'Social Media': ['social media', 'social media marketing', 'social media management', 'page management'],
  'Content Writing': ['content creation', 'article writing', 'blog writing', 'কনটেন্ট রাইটিং'],
  'Market Research': ['market analysis', 'market survey'],
  'Branding': ['brand management', 'brand management & development', 'brand development', 'brand strategy'],
  'Event Management': ['event management', 'event planning', 'marketing event planning'],
  'Public Relations': ['public relations', 'media relations'],
  'Customer Service': ['customer inquiries handling', 'customer service skills', 'client servicing', 'গ্রাহক সেবা'],
  'Call Handling': ['call handling', 'call center operations', 'call center', 'contact center', 'inbound calls', 'outbound calls'],
  // accounts and bank
  'Accounting': ['basic accounting knowledge', 'financial accounting', 'general accounting', 'accounts payable', 'accounts receivable', 'হিসাবরক্ষণ'],
  'Accounting Software': ['accounting software', 'proficiency in accounting software', 'knowledge of accounting software'],
  'Auditing': ['auditing', 'internal auditing', 'internal audit', 'internal audits', 'audits', 'financial audits', 'external audit', 'audit procedures', 'it audit', 'it auditing', 'নিরীক্ষা'],
  'Financial Analysis': ['financial analysis', 'corporate finance', 'financial management', 'finance management', 'financial planning', 'financial modelling', 'financial modeling'],
  'Banking Operations': ['general banking'],
  'Credit Analysis': ['credit management', 'credit risk', 'credit scoring'],
  'Credit Recovery': ['credit recovery', 'debt collection', 'loan recovery'],
  // HR
  'HR Management': ['hr management', 'human resources management', 'human resource management', 'strategic hr', 'hr operations', 'hr policies'],
  'HRIS': ['hris management'],
  'Training Coordination': ['staff training and development', 'training & development', 'training and development', 'employee training'],
  'Employee Relations': ['employee relations', 'industrial relations', 'grievance handling'],
  'Compliance': ['hr compliance', 'social compliance', 'regulatory compliance'],
  // IT
  'IT Support': ['it support', 'technical support', 'computer maintenance', 'it operations', 'hardware troubleshooting', 'help desk', 'desktop support'],
  'Networking': ['computer network operations', 'network engineering', 'network administration', 'cisco networking', 'fiber optic networks', 'fiber optic'],
  'UI/UX Design': ['ui/ux', 'ui ux', 'ux design', 'ui design', 'user interface design', 'wireframing', 'prototyping'],
  'Data Analysis': ['data analysis', 'data analytics', 'business analysis', 'data visualization'],
  'Automation Testing': ['automation testing', 'test automation', 'cypress', 'playwright', 'appium', 'jmeter'],
  'TypeScript': ['typescript'], 'Vue.js': ['vue', 'vue.js', 'vuejs', 'nuxt'], 'Angular': ['angular', 'angularjs'], 'Golang': ['golang', 'go lang'], 'Kubernetes': ['kubernetes', 'k8s'],
  'AWS': ['amazon web services', 'ec2'],
  // garments, production, engineering
  'Garments Production': ['garment industry knowledge', 'garment manufacturing', 'garment production', 'garments production', 'garments manufacturing', 'knit garment production', 'knit garment manufacturing', 'garment finishing', 'apparel production'],
  'Textile Knowledge': ['textile industry knowledge', 'textile knowledge', 'textile industry', 'textile testing', 'textile inspection', 'textile engineering'],
  'Fashion Design': ['fashion design', 'fashion industry knowledge', 'textile design', 'fashion sketching', 'fashion designing'],
  'Production Planning': ['productionplanning', 'production management', 'production engineering', 'manufacturing engineering', 'manufacturing operations management', 'manufacturing operations', 'production control', 'ppic'],
  'Quality Control': ['quality assurance', 'quality management', 'quality inspection', 'quality auditing', 'quality control procedures', 'knowledge of quality control', 'supplier quality', 'মান নিয়ন্ত্রণ'],
  'ISO': ['iso 9001', 'iso certification'], 'Lean Manufacturing': ['lean manufacturing', 'kaizen', 'six sigma'], '5S': ['5s'],
  'Fire Safety': ['fire safety', 'fire fighting', 'firefighting', 'safety management', 'occupational health and safety'],
  'Site Supervision': ['construction supervision', 'construction management', 'site engineering', 'project engineering', 'site management'],
  'Civil Engineering': ['civil engineering', 'structural engineering', 'civil engineering design', 'construction industry knowledge'],
  'Electrical Engineering': ['electrical engineering', 'electrical systems', 'electrical systems knowledge', 'power systems'],
  'Mechanical Engineering': ['mechanical engineering', 'mechanical design'],
  'Solar': ['renewable energy', 'solar energy', 'pv system'],
  'Estimation': ['cost estimation', 'quantity surveying'],
  // supply chain
  'Inventory Management': ['stock management', 'inventory control', 'store management', 'stock control'],
  'Warehouse Management': ['warehouse operations', 'warehousing'],
  'Procurement': ['purchase management', 'purchasing', 'procurement processes', 'tender management', 'tendering'],
  'Vendor Management': ['supplier management', 'supplier development', 'supply management', 'supplier relationship'],
  'Supply Chain': ['supply chain', 'supply chain management', 'supply chain operations'],
  'Import/Export': ['import/export', 'import export', 'export import', 'export operations', 'import operations', 'customs clearance'],
  // NGO
  'Project Management': ['project coordination', 'project support', 'project planning', 'project implementation', 'programme management', 'program management'],
  'Community Mobilization': ['community outreach', 'youth outreach', 'community engagement', 'civil society development', 'international development', 'non-profit program development', 'local economic development', 'entrepreneurship development', 'youth empowerment'],
  'Proposal Writing': ['proposal writing', 'grant writing', 'proposal development'],
  'Training Facilitation': ['training facilitation', 'facilitation skills', 'capacity building'],
  // health
  'Patient Care': ['quality patient care', 'medical staff supervision', 'medical consultation', 'clinical care', 'hospital medicine', 'রোগীর সেবা'],
  'Nursing': ['nursing', 'nursing care', 'নার্সিং'],
  'Lab Testing': ['laboratory testing', 'laboratory procedures', 'laboratory skills', 'laboratory techniques', 'laboratory management', 'laboratory technicians', 'laboratory medicine', 'lab test', 'medical technologist'],
  'Radiology': ['radiology', 'radiography', 'radiologic technology', 'radiology equipment operation', 'x-ray equipment operation', 'x-ray', 'medical imaging', 'ultrasonography'],
  'Pharma Sales': ['pharmaceutical sales', 'pharmacy sales', 'pharmaceutical marketing', 'product promotion', 'medical promotion'],
  // design and media
  'Graphic Design': ['graphic design', 'graphics design', 'visual design skills', 'visual design', 'graphic arts', 'computer graphics design', 'multimedia design', 'creative services', 'creative design'],
  'Motion Graphics': ['motion graphic design', 'motion graphic', 'animation'],
  'Video Editing': ['video production', 'ভিডিও এডিটিং'],
  '3D Design': ['3d design', '3ds max', '3d max', 'sketchup', 'blender', '3d modeling', '3d modelling'],
  // education, service, agriculture, legal
  'Teaching': ['undergraduate teaching', 'passion for teaching', 'শিক্ষকতা'],
  'Training Delivery': ['training delivery', 'conducting training', 'teacher training'],
  'Hospitality': ['hospitality', 'hospitality management', 'food & beverage management', 'hotel management', 'guest service', 'guest relations'],
  'Cooking': ['culinary', 'food preparation', 'রান্না'],
  'Farm Management': ['farm management', 'livestock management', 'poultry management'],
  'Livestock Care': ['livestock care', 'animal husbandry', 'animal care'],
  'Crop Production': ['crop production', 'agronomy', 'cultivation', 'horticulture'],
  'Legal Drafting': ['legal drafting', 'legal documentation', 'legal affairs', 'legal compliance'],
  'Company Law': ['company law', 'company law knowledge', 'corporate law'],
  'Litigation': ['litigation'],
};
for (const name in MORE_ALIASES) SKILL_ALIASES[name] = (SKILL_ALIASES[name] || []).concat(MORE_ALIASES[name]);

/* Wordings that mean the skill when a job portal lists them as a skill tag ("Reporting", "Banking"), but are
   ordinary words inside a sentence ("reporting to the manager", "a banking client"). The site reads them in a
   post's short keyword line; the robot does not use them when it reads a post's full text. */
const TAG_ONLY_ALIASES = {
  'Report Writing': ['reporting', 'documentation'], 'Translation': ['interpretation', 'interpreting'], 'B2B Sales': ['b2b'],
  'Event Management': ['activation'], 'Banking Operations': ['banking'], 'HR Management': ['human resources'],
  'IT Support': ['troubleshooting'], 'UI/UX Design': ['user experience'], 'Procurement': ['sourcing'], 'Litigation': ['case management'],
};
/* Skills whose own name is an ordinary word ("maintenance of the code", "our sales team"): also tag-only. */
const TAG_ONLY_NAMES = ['Maintenance', 'Sales', 'Logistics', 'Compliance', 'Generator', 'Networking', 'Presentation', 'Costing', 'Estimation', 'Washing', 'Finishing', 'Solar', 'Hospitality', 'Teaching', 'Accounting', 'Recruitment', 'Procurement', 'Payroll'];

/* Words in a post that often mean a scam: a real employer never asks a candidate for money. */
const SCAM_PATTERNS = [
  /registration fee/i, /security (money|deposit)/i, /training fee/i, /processing fee/i, /(pay|send|deposit)\s+(tk\.?|taka|bdt|৳)\s?\d/i,
  /(bkash|nagad|rocket)\s+(number|no\.?|payment)/i, /investment required/i, /earn\s+(tk\.?|taka|bdt|৳)?\s?[\d,]+\s*(per|a|\/)\s*day/i,
  /no interview/i, /জামানত/, /রেজিস্ট্রেশন ফি/, /টাকা জমা/,
];

const EDU_LEVELS = [
  { id: 0, en: 'No formal requirement', bn: 'কোনো শর্ত নেই' },
  { id: 1, en: 'SSC / Dakhil', bn: 'এসএসসি / দাখিল' },
  { id: 2, en: 'HSC / Alim', bn: 'এইচএসসি / আলিম' },
  { id: 3, en: 'Diploma', bn: 'ডিপ্লোমা' },
  { id: 4, en: 'Bachelor (Honours / Pass / BBA / B.Sc)', bn: 'স্নাতক (অনার্স / পাস / বিবিএ / বিএসসি)' },
  { id: 5, en: 'Masters / MBA', bn: 'স্নাতকোত্তর / এমবিএ' },
];

const EXP_LEVELS = [
  { id: 'fresher', years: 0, en: 'Fresher', bn: 'ফ্রেশার' },
  { id: '1-3', years: 2, en: '1–3 years', bn: '১–৩ বছর' },
  { id: '3-5', years: 4, en: '3–5 years', bn: '৩–৫ বছর' },
  { id: '5+', years: 7, en: '5+ years', bn: '৫+ বছর' },
];

const JOB_TYPES = [
  { id: 'full', en: 'Full-time', bn: 'ফুল-টাইম' },
  { id: 'part', en: 'Part-time', bn: 'পার্ট-টাইম' },
  { id: 'intern', en: 'Internship', bn: 'ইন্টার্নশিপ' },
  { id: 'contract', en: 'Contract', bn: 'চুক্তিভিত্তিক' },
];

