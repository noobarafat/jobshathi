/* ───────── Fields → roles → synonyms → skills ─────────
   Add a title to `syn` (lower case) and the matcher knows it from the next load.
   The robot can ship its own bigger dictionary later; the shape stays the same. */
const FIELDS = [
  { id: 'it', en: 'IT & Software', bn: 'আইটি ও সফটওয়্যার', cats: ['it', 'telecommunication', 'software', 'ict'],
    roles: [
      { id: 'web-dev', en: 'Software / Web Developer', syn: ['software engineer', 'software developer', 'web developer', 'programmer', 'frontend developer', 'front end developer', 'front-end developer', 'backend developer', 'back end developer', 'full stack developer', 'fullstack developer', 'php developer', 'laravel developer', 'react developer', 'javascript developer', 'node js developer', 'nodejs developer', 'mern stack developer', 'python developer', 'django developer', 'java developer', 'asp.net developer', 'dot net developer', 'wordpress developer', 'সফটওয়্যার ইঞ্জিনিয়ার'] },
      { id: 'mobile-dev', en: 'Mobile App Developer', syn: ['mobile app developer', 'flutter developer', 'android developer', 'ios developer', 'react native developer', 'app developer'] },
      { id: 'sqa', en: 'SQA / Software Tester', syn: ['sqa engineer', 'software tester', 'qa engineer', 'quality assurance engineer', 'test engineer', 'automation engineer', 'sdet', 'manual tester', 'software quality assurance'] },
      { id: 'data-analyst', en: 'Data Analyst', syn: ['data analyst', 'business intelligence analyst', 'bi analyst', 'mis executive', 'mis officer', 'reporting analyst', 'data scientist', 'business analyst', 'power bi developer'] },
      { id: 'ai-ml', en: 'AI / ML Engineer', syn: ['machine learning engineer', 'ml engineer', 'ai engineer', 'nlp engineer', 'computer vision engineer', 'data annotator', 'prompt engineer'] },
      { id: 'uiux', en: 'UI/UX Designer', syn: ['ui/ux designer', 'ui ux designer', 'ux designer', 'ui designer', 'product designer', 'web designer'] },
      { id: 'it-support', en: 'IT Support / Network', syn: ['it support officer', 'it support engineer', 'it officer', 'it executive', 'executive it', 'network engineer', 'network administrator', 'system administrator', 'it administrator', 'hardware engineer', 'support engineer', 'noc engineer', 'আইটি অফিসার'] },
      { id: 'devops', en: 'DevOps / Cloud', syn: ['devops engineer', 'cloud engineer', 'site reliability engineer', 'sre', 'linux administrator', 'database administrator', 'dba'] },
      { id: 'cyber', en: 'Cyber Security', syn: ['cyber security analyst', 'cybersecurity analyst', 'security analyst', 'soc analyst', 'penetration tester', 'information security officer'] },
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'PHP', 'Laravel', 'Python', 'Django', 'Java', 'C#', 'ASP.NET', 'SQL', 'MySQL', 'HTML/CSS', 'WordPress', 'Flutter', 'Android', 'Git', 'REST API', 'Selenium', 'Manual Testing', 'Power BI', 'Tableau', 'Machine Learning', 'Figma', 'Linux', 'Networking', 'MikroTik', 'Cisco', 'AWS', 'Docker'] },

  { id: 'accounting', en: 'Accounting & Finance', bn: 'হিসাব ও অর্থ', cats: ['accounting', 'finance', 'accounts', 'audit'],
    roles: [
      { id: 'accountant', en: 'Accountant / Accounts Officer', syn: ['accountant', 'accounts officer', 'officer accounts', 'accounts executive', 'executive accounts', 'junior accountant', 'senior accountant', 'assistant accountant', 'accounts assistant', 'accounts manager', 'officer (accounts)', 'executive finance & accounts', 'executive - finance & accounts', 'finance & accounts', 'accounts & finance', 'হিসাবরক্ষক', 'হিসাব রক্ষক', 'একাউন্ট্যান্ট', 'অ্যাকাউন্টস অফিসার'] },
      { id: 'audit', en: 'Audit / Internal Control', syn: ['audit executive', 'audit officer', 'internal auditor', 'auditor', 'audit assistant', 'internal audit', 'audit associate'] },
      { id: 'finance', en: 'Finance Executive / Analyst', syn: ['finance executive', 'finance officer', 'financial analyst', 'finance analyst', 'finance manager', 'treasury officer', 'budget officer'] },
      { id: 'tax-vat', en: 'Tax & VAT', syn: ['vat executive', 'tax executive', 'vat officer', 'tax officer', 'vat & tax', 'tax consultant', 'income tax'] },
      { id: 'cashier', en: 'Cashier', syn: ['cashier', 'cash officer', 'cash executive', 'ক্যাশিয়ার'] },
    ],
    skills: ['Tally', 'Excel', 'VAT', 'Income Tax', 'Bookkeeping', 'Bank Reconciliation', 'Financial Reporting', 'QuickBooks', 'ERP', 'Payroll', 'Costing', 'Budgeting', 'IFRS', 'CA (CC)', 'ACCA'] },

  { id: 'bank', en: 'Bank & Financial Services', bn: 'ব্যাংক ও আর্থিক সেবা', cats: ['bank', 'non-bank', 'financial', 'insurance', 'microfinance'],
    roles: [
      { id: 'bank-officer', en: 'Bank Officer / Trainee Officer', syn: ['trainee officer', 'management trainee officer', 'mto', 'probationary officer', 'bank officer', 'junior officer', 'assistant officer', 'trainee assistant officer', 'ব্যাংক অফিসার'] },
      { id: 'credit', en: 'Credit / Loan Officer', syn: ['credit officer', 'loan officer', 'credit analyst', 'credit risk', 'recovery officer', 'collection officer'] },
      { id: 'relationship', en: 'Relationship Officer', syn: ['relationship officer', 'relationship manager', 'direct sales executive', 'dse', 'card sales', 'liability sales', 'sales officer (deposit)'] },
      { id: 'teller', en: 'Teller / Cash Officer (Bank)', syn: ['teller', 'trainee cash officer', 'tco', 'cash officer (bank)', 'universal teller'] },
      { id: 'insurance', en: 'Insurance & Microfinance', syn: ['financial associate', 'insurance officer', 'unit manager', 'underwriter', 'claims officer', 'field officer (microfinance)', 'loan field officer'] },
    ],
    skills: ['Banking Operations', 'Credit Analysis', 'Customer Service', 'Excel', 'Sales', 'KYC', 'Cash Handling', 'Financial Reporting', 'Communication'] },

  { id: 'sales', en: 'Sales & Business Development', bn: 'বিক্রয় ও ব্যবসা উন্নয়ন', cats: ['sales', 'business development', 'marketing/sales'],
    roles: [
      { id: 'sales-exec', en: 'Sales Executive / Officer', syn: ['sales executive', 'sales officer', 'executive sales', 'sales representative', 'sales associate', 'corporate sales executive', 'sales manager', 'area sales manager', 'বিক্রয় প্রতিনিধি', 'সেলস এক্সিকিউটিভ', 'বিক্রয় কর্মকর্তা'] },
      { id: 'tso', en: 'Territory Sales Officer', syn: ['territory sales officer', 'tso', 'territory officer', 'territory sales executive', 'territory manager', 'dsr', 'distributor sales representative'] },
      { id: 'bde', en: 'Business Development Executive', syn: ['business development executive', 'bde', 'business development officer', 'business development manager', 'business development associate', 'key account manager', 'key account executive', 'partnership executive'] },
      { id: 'retail', en: 'Showroom / Retail Sales', syn: ['showroom sales', 'showroom executive', 'retail sales', 'outlet executive', 'outlet manager', 'store sales', 'sales man', 'salesman', 'fashion consultant', 'brand promoter', 'সেলসম্যান'] },
      { id: 'telesales', en: 'Tele Sales', syn: ['tele sales executive', 'telesales executive', 'telemarketing executive', 'tele marketer', 'inside sales'] },
    ],
    skills: ['Sales', 'Negotiation', 'Communication', 'B2B Sales', 'Field Sales', 'CRM', 'Target Achievement', 'Excel', 'Presentation', 'Motorcycle Driving', 'Lead Generation'] },

  { id: 'marketing', en: 'Marketing & Digital', bn: 'মার্কেটিং ও ডিজিটাল', cats: ['marketing', 'media', 'advertisement', 'digital marketing'],
    roles: [
      { id: 'marketing-exec', en: 'Marketing Executive', syn: ['marketing executive', 'marketing officer', 'executive marketing', 'marketing manager', 'marketing associate', 'trade marketing', 'মার্কেটিং অফিসার', 'মার্কেটিং এক্সিকিউটিভ'] },
      { id: 'brand', en: 'Brand Executive', syn: ['brand executive', 'brand officer', 'brand manager', 'assistant brand manager', 'brand associate'] },
      { id: 'digital-marketing', en: 'Digital Marketing Executive', syn: ['digital marketing executive', 'digital marketer', 'digital marketing officer', 'digital marketing specialist', 'performance marketer', 'media buyer', 'facebook marketer', 'ডিজিটাল মার্কেটার'] },
      { id: 'seo', en: 'SEO Specialist', syn: ['seo specialist', 'seo executive', 'seo expert', 'seo analyst'] },
      { id: 'social', en: 'Social Media Manager', syn: ['social media manager', 'social media executive', 'social media moderator', 'page moderator', 'community manager', 'facebook page moderator'] },
      { id: 'content', en: 'Content Writer', syn: ['content writer', 'copywriter', 'content executive', 'content creator', 'script writer', 'technical writer', 'কনটেন্ট রাইটার'] },
    ],
    skills: ['Digital Marketing', 'Facebook Ads', 'Google Ads', 'SEO', 'Content Writing', 'Copywriting', 'Canva', 'Social Media', 'Email Marketing', 'Google Analytics', 'Market Research', 'Communication', 'Presentation'] },

  { id: 'hr', en: 'HR & Admin', bn: 'এইচআর ও অ্যাডমিন', cats: ['hr', 'human resource', 'admin', 'org. development', 'secretary', 'receptionist'],
    roles: [
      { id: 'hr-exec', en: 'HR Executive / Officer', syn: ['hr executive', 'hr officer', 'executive hr', 'human resource executive', 'human resources officer', 'hr manager', 'hr generalist', 'hr & admin', 'hr and admin', 'officer hr', 'এইচআর অফিসার', 'এইচআর এক্সিকিউটিভ'] },
      { id: 'recruiter', en: 'Recruiter / Talent Acquisition', syn: ['recruiter', 'talent acquisition', 'recruitment executive', 'recruitment officer', 'hiring executive'] },
      { id: 'admin', en: 'Admin Officer', syn: ['admin officer', 'admin executive', 'administrative officer', 'executive admin', 'administration officer', 'office manager', 'অ্যাডমিন অফিসার'] },
      { id: 'compliance', en: 'Compliance Officer', syn: ['compliance officer', 'compliance executive', 'welfare officer', 'compliance manager'] },
      { id: 'pa', en: 'Executive / Personal Assistant', syn: ['executive assistant', 'personal assistant', 'personal secretary', 'pa to md', 'pa to chairman', 'secretary'] },
    ],
    skills: ['Recruitment', 'Payroll', 'Labour Law', 'HRIS', 'Excel', 'MS Office', 'Communication', 'Office Management', 'Compliance', 'Training Coordination'] },

  { id: 'support', en: 'Customer Support & Call Center', bn: 'কাস্টমার সাপোর্ট ও কল সেন্টার', cats: ['customer service', 'call centre', 'call center', 'customer support'],
    roles: [
      { id: 'cs-exec', en: 'Customer Support Executive', syn: ['customer support executive', 'customer service executive', 'customer care executive', 'customer service officer', 'customer support officer', 'customer relationship officer', 'customer experience executive', 'support executive', 'client service executive', 'কাস্টমার কেয়ার', 'কাস্টমার সার্ভিস'] },
      { id: 'call-center', en: 'Call Center Agent', syn: ['call center agent', 'call centre agent', 'call center executive', 'contact center agent', 'contact centre executive', 'customer service agent', 'কল সেন্টার এজেন্ট'] },
      { id: 'coordinator', en: 'Student / Client Coordinator', syn: ['student support coordinator', 'batch coordinator', 'student counselor', 'student counsellor', 'admission officer', 'client coordinator', 'program coordinator', 'education counselor'] },
    ],
    skills: ['Customer Service', 'Communication', 'English Communication', 'Typing', 'MS Office', 'CRM', 'Problem Solving', 'Live Chat'] },

  { id: 'garments', en: 'Garments & Textile', bn: 'গার্মেন্টস ও টেক্সটাইল', cats: ['garments', 'textile', 'rmg', 'buying house'],
    roles: [
      { id: 'merchandiser', en: 'Merchandiser', syn: ['merchandiser', 'merchandizer', 'junior merchandiser', 'senior merchandiser', 'assistant merchandiser', 'trainee merchandiser', 'merchandising executive', 'মার্চেন্ডাইজার'] },
      { id: 'garments-quality', en: 'Quality (QC / QA)', syn: ['quality controller', 'quality inspector', 'qc', 'qa executive (garments)', 'quality manager', 'quality in charge', 'quality auditor'] },
      { id: 'ie', en: 'IE / Production', syn: ['ie officer', 'ie executive', 'industrial engineer', 'work study officer', 'production officer', 'production executive', 'production manager', 'line chief', 'floor in charge', 'supervisor (production)'] },
      { id: 'garments-commercial', en: 'Commercial (Export / Import)', syn: ['commercial officer', 'commercial executive', 'executive commercial', 'commercial manager', 'export officer', 'import officer'] },
      { id: 'textile-eng', en: 'Textile Engineer', syn: ['textile engineer', 'dyeing officer', 'knitting officer', 'lab technician (textile)', 'washing officer', 'cad designer', 'pattern master', 'pattern maker'] },
    ],
    skills: ['Merchandising', 'Costing', 'Buyer Communication', 'Fabric Knowledge', 'Excel', 'LC', 'Export Documentation', 'Quality Control', 'AQL', 'Line Balancing', 'Production Planning'] },

  { id: 'engineering', en: 'Engineering & Technical', bn: 'প্রকৌশল ও কারিগরি', cats: ['engineer', 'architect', 'engineering', 'technical'],
    roles: [
      { id: 'civil', en: 'Civil Engineer', syn: ['civil engineer', 'site engineer', 'project engineer', 'sub assistant engineer (civil)', 'sub-assistant engineer civil', 'assistant engineer (civil)', 'assistant engineer civil', 'উপসহকারী প্রকৌশলী (পুর)', 'সহকারী প্রকৌশলী (পুর)', 'diploma engineer civil', 'quantity surveyor', 'সিভিল ইঞ্জিনিয়ার'] },
      { id: 'electrical', en: 'Electrical / Electronics Engineer', syn: ['electrical engineer', 'eee engineer', 'electronics engineer', 'sub assistant engineer (electrical)', 'assistant engineer (electrical)', 'assistant engineer electrical', 'উপসহকারী প্রকৌশলী (বিদ্যুৎ)', 'সহকারী প্রকৌশলী (বিদ্যুৎ)', 'diploma engineer electrical', 'power engineer', 'ইলেকট্রিক্যাল ইঞ্জিনিয়ার'] },
      { id: 'mechanical', en: 'Mechanical / Maintenance Engineer', syn: ['mechanical engineer', 'maintenance engineer', 'sub assistant engineer (mechanical)', 'assistant engineer (mechanical)', 'assistant engineer mechanical', 'machine operator', 'উপসহকারী প্রকৌশলী (যান্ত্রিক)', 'সহকারী প্রকৌশলী (যান্ত্রিক)', 'utility engineer', 'service engineer', 'plant engineer'] },
      { id: 'draftsman', en: 'AutoCAD / Draftsman', syn: ['autocad operator', 'draftsman', 'cad operator', 'auto cad designer', 'junior architect', 'architect', 'interior designer'] },
      { id: 'technician', en: 'Technician / Electrician', syn: ['technician', 'electrician', 'ac technician', 'service technician', 'mechanic', 'generator operator', 'plumber', 'welder', 'ইলেকট্রিশিয়ান', 'টেকনিশিয়ান'] },
    ],
    skills: ['AutoCAD', 'Site Supervision', 'Estimation', 'BOQ', 'PLC', 'Electrical Wiring', 'Maintenance', 'Generator', 'HVAC', 'Project Management', 'MS Office'] },

  { id: 'education', en: 'Education & Training', bn: 'শিক্ষা ও প্রশিক্ষণ', cats: ['education', 'training', 'teacher'],
    roles: [
      { id: 'teacher', en: 'Teacher', syn: ['teacher', 'assistant teacher', 'english teacher', 'math teacher', 'mathematics teacher', 'science teacher', 'class teacher', 'junior teacher', 'subject teacher', 'school teacher', 'ict teacher', 'শিক্ষক', 'সহকারী শিক্ষক', 'শিক্ষিকা'] },
      { id: 'lecturer', en: 'Lecturer', syn: ['lecturer', 'assistant professor', 'faculty member', 'প্রভাষক'] },
      { id: 'tutor', en: 'Tutor / Instructor', syn: ['tutor', 'home tutor', 'instructor', 'course instructor', 'coaching teacher', 'mentor', 'teaching assistant', 'trainer', 'corporate trainer', 'প্রশিক্ষক'] },
      { id: 'academic', en: 'Academic Coordinator', syn: ['academic coordinator', 'academic officer', 'academic executive', 'curriculum developer', 'principal', 'vice principal'] },
    ],
    skills: ['Teaching', 'Classroom Management', 'English Communication', 'Lesson Planning', 'MS Office', 'Presentation', 'Curriculum Development'] },

  { id: 'health', en: 'Healthcare & Pharma', bn: 'স্বাস্থ্য ও ফার্মা', cats: ['medical', 'pharma', 'healthcare', 'hospital'],
    roles: [
      { id: 'mpo', en: 'Medical Promotion Officer', syn: ['medical promotion officer', 'mpo', 'medical representative', 'medical information officer', 'mio', 'professional services officer', 'pso', 'মেডিকেল প্রমোশন অফিসার'] },
      { id: 'nurse', en: 'Nurse', syn: ['nurse', 'staff nurse', 'senior staff nurse', 'registered nurse', 'nursing supervisor', 'নার্স'] },
      { id: 'doctor', en: 'Doctor / Medical Officer', syn: ['medical officer', 'doctor', 'resident medical officer', 'rmo', 'duty doctor', 'consultant (medical)', 'মেডিকেল অফিসার'] },
      { id: 'pharmacist', en: 'Pharmacist', syn: ['pharmacist', 'pharmacy assistant', 'production pharmacist', 'qa officer (pharma)', 'qc officer (pharma)', 'ফার্মাসিস্ট'] },
      { id: 'lab-tech', en: 'Medical Technologist', syn: ['medical technologist', 'lab technician', 'lab technologist', 'pathology technologist', 'radiographer', 'physiotherapist'] },
    ],
    skills: ['Patient Care', 'Pharmacy', 'Sales', 'Communication', 'Lab Testing', 'GMP', 'First Aid', 'Motorcycle Driving', 'BMDC Registration', 'Nursing Registration'] },

  { id: 'design', en: 'Design & Media', bn: 'ডিজাইন ও মিডিয়া', cats: ['design', 'creative', 'media', 'graphic'],
    roles: [
      { id: 'graphic', en: 'Graphic Designer', syn: ['graphic designer', 'graphics designer', 'graphic design executive', 'visualizer', 'creative designer', 'junior graphic designer', 'গ্রাফিক ডিজাইনার'] },
      { id: 'video', en: 'Video Editor / Motion', syn: ['video editor', 'motion graphics designer', 'motion designer', 'animator', 'video editor & motion graphics', 'cinematographer', 'ভিডিও এডিটর'] },
      { id: 'photo', en: 'Photographer / Content Creator', syn: ['photographer', 'videographer', 'content creator', 'product photographer'] },
    ],
    skills: ['Photoshop', 'Illustrator', 'Canva', 'Premiere Pro', 'After Effects', 'Figma', 'Video Editing', 'Motion Graphics', 'Photography', 'Branding'] },

  { id: 'supply', en: 'Supply Chain & Logistics', bn: 'সাপ্লাই চেইন ও লজিস্টিকস', cats: ['supply chain', 'procurement', 'logistics', 'commercial', 'store'],
    roles: [
      { id: 'scm', en: 'Supply Chain Executive', syn: ['supply chain executive', 'supply chain officer', 'scm executive', 'supply chain manager', 'planning executive'] },
      { id: 'procurement', en: 'Procurement / Purchase', syn: ['procurement officer', 'procurement executive', 'purchase officer', 'purchase executive', 'sourcing executive', 'purchase manager', 'ক্রয় কর্মকর্তা'] },
      { id: 'store', en: 'Store / Warehouse', syn: ['store officer', 'store keeper', 'storekeeper', 'store executive', 'warehouse officer', 'warehouse executive', 'inventory officer', 'warehouse in charge', 'store in charge', 'স্টোর কিপার', 'স্টোর অফিসার'] },
      { id: 'logistics', en: 'Logistics / Distribution', syn: ['logistics officer', 'logistics executive', 'distribution officer', 'distribution executive', 'delivery coordinator', 'fleet officer', 'operations executive', 'operation executive'] },
    ],
    skills: ['Inventory Management', 'Procurement', 'Excel', 'ERP', 'Vendor Management', 'Negotiation', 'LC', 'Logistics', 'Warehouse Management'] },

  { id: 'ngo', en: 'NGO & Development', bn: 'এনজিও ও উন্নয়ন', cats: ['ngo', 'development'],
    roles: [
      { id: 'program-officer', en: 'Program / Project Officer', syn: ['program officer', 'programme officer', 'project officer', 'project coordinator', 'program coordinator (ngo)', 'project manager', 'program manager', 'প্রোগ্রাম অফিসার', 'প্রজেক্ট অফিসার'] },
      { id: 'field-officer', en: 'Field / Community Officer', syn: ['field officer', 'field facilitator', 'community mobilizer', 'community organizer', 'field supervisor', 'credit officer (ngo)', 'ফিল্ড অফিসার', 'মাঠ কর্মী', 'মাঠকর্মী'] },
      { id: 'me', en: 'Monitoring & Evaluation', syn: ['monitoring and evaluation officer', 'm&e officer', 'meal officer', 'monitoring officer', 'research associate', 'research assistant', 'enumerator', 'data collector'] },
    ],
    skills: ['Project Management', 'Report Writing', 'Field Work', 'Community Mobilization', 'Monitoring & Evaluation', 'Data Collection', 'Communication', 'MS Office', 'Motorcycle Driving'] },

  { id: 'office', en: 'Data Entry & Office Support', bn: 'ডাটা এন্ট্রি ও অফিস সাপোর্ট', cats: ['data entry', 'operator', 'bpo', 'general management', 'office'],
    roles: [
      { id: 'data-entry', en: 'Data Entry / Computer Operator', syn: ['data entry operator', 'computer operator', 'data entry executive', 'data entry officer', 'data processor', 'typist', 'ডাটা এন্ট্রি অপারেটর', 'কম্পিউটার অপারেটর'] },
      { id: 'office-assistant', en: 'Office Assistant', syn: ['office assistant', 'office executive', 'office support staff', 'office boy', 'peon', 'messenger', 'অফিস সহকারী', 'অফিস সহায়ক'] },
      { id: 'reception', en: 'Receptionist / Front Desk', syn: ['receptionist', 'front desk executive', 'front desk officer', 'front office executive', 'রিসেপশনিস্ট'] },
    ],
    skills: ['Typing', 'Bangla Typing', 'MS Office', 'Excel', 'MS Word', 'Communication', 'Email Writing', 'Filing'] },

  { id: 'service', en: 'Hospitality, Delivery & Service', bn: 'হসপিটালিটি, ডেলিভারি ও সেবা', cats: ['hospitality', 'travel', 'tourism', 'driving', 'security', 'support service', 'delivery'],
    roles: [
      { id: 'rider', en: 'Delivery Rider', syn: ['delivery rider', 'rider', 'delivery man', 'delivery executive', 'deliveryman', 'courier', 'bike rider', 'ডেলিভারি ম্যান', 'ডেলিভারি রাইডার', 'রাইডার'] },
      { id: 'driver', en: 'Driver', syn: ['driver', 'car driver', 'office driver', 'heavy driver', 'covered van driver', 'ড্রাইভার', 'গাড়ি চালক'] },
      { id: 'guard', en: 'Security Guard', syn: ['security guard', 'security supervisor', 'security officer', 'guard', 'সিকিউরিটি গার্ড', 'নিরাপত্তা প্রহরী'] },
      { id: 'chef', en: 'Chef / Cook', syn: ['chef', 'cook', 'commis', 'kitchen helper', 'baker', 'barista', 'বাবুর্চি', 'শেফ'] },
      { id: 'hotel', en: 'Hotel & Restaurant Service', syn: ['waiter', 'waitress', 'steward', 'restaurant manager', 'front office assistant (hotel)', 'housekeeping', 'room attendant', 'guest relation officer', 'ওয়েটার'] },
      { id: 'cleaning', en: 'Cleaner / Housekeeping Staff', syn: ['cleaner', 'sweeper', 'cleaning staff', 'janitor', 'caretaker', 'housekeeping staff', 'পরিচ্ছন্নতাকর্মী', 'ক্লিনার', 'ঝাড়ুদার'] },
      { id: 'travel', en: 'Travel & Ticketing', syn: ['ticketing executive', 'reservation officer', 'travel consultant', 'tour executive', 'visa processing officer'] },
    ],
    skills: ['Driving Licence', 'Motorcycle Driving', 'Customer Service', 'Cooking', 'Food Safety', 'Communication', 'Ticketing', 'Smartphone Use'] },

  { id: 'govt', en: 'Government & Public Service', bn: 'সরকারি ও জনসেবা', cats: ['government', 'govt', 'public service', 'ministry', 'directorate', 'autonomous'],
    roles: [
      { id: 'govt-assistant', en: 'Office Assistant (Government)', syn: ['upper division assistant', 'lower division assistant', 'uda', 'lda', 'head assistant', 'certificate assistant', 'certificate peshkar', 'peshkar', 'sayrat assistant', 'mutation assistant', 'record keeper', 'store keeper cum assistant', 'উচ্চমান সহকারী', 'নিম্নমান সহকারী', 'প্রধান সহকারী', 'সার্টিফিকেট সহকারী'] },
      { id: 'govt-officer', en: 'Government Officer', syn: ['administrative officer', 'assistant administrative officer', 'assistant director', 'upazila officer', 'field officer', 'programme officer', 'project officer', 'research officer', 'estimator', 'প্রশাসনিক কর্মকর্তা', 'সহকারী পরিচালক', 'উপজেলা কর্মকর্তা'] },
      { id: 'govt-support', en: 'Support Staff (Government)', syn: ['office sohayok', 'office sahayok', 'mlss', 'pump operator', 'process server', 'অফিস সহায়ক', 'পাম্প অপারেটর'] },
      { id: 'govt-surveyor', en: 'Surveyor / Amin', syn: ['surveyor', 'amin', 'draftsman', 'tracer', 'work assistant', 'সার্ভেয়ার', 'আমিন', 'নকশাকার'] },
      { id: 'govt-uniform', en: 'Uniformed Service', syn: ['sub inspector', 'constable', 'ansar', 'fire fighter', 'firefighter', 'cadet', 'sepoy', 'কনস্টেবল', 'সাব ইন্সপেক্টর', 'আনসার'] },
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

