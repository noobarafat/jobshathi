/* ───────── Example posts (invented) ─────────
   The page shows these until a jobs.json made by the robot sits beside index.html.
   One post = { id, title, company, cat, loc, type, salary, exp, edu, age, req, posted (days ago) | postedAt,
                deadlineIn (days) | deadline, vacancies, source, url }.  Only title is required. */
const SAMPLE_JOBS = [
  // Accounting & finance
  { id: 's1', title: 'Junior Accountant', company: 'Shapla Agro Foods Ltd.', cat: 'Accounting/Finance', loc: 'Mirpur, Dhaka', salary: 'Tk. 20,000 – 25,000', exp: 'Freshers can apply', edu: 'BBA in Accounting', age: '22 to 30 years', req: 'Prepare vouchers and maintain ledger. Working knowledge of Tally and MS Excel. Bank reconciliation every month.', posted: 0, deadlineIn: 12, vacancies: 2 },
  { id: 's2', title: 'Accounts Officer', company: 'Meghdoot Logistics', cat: 'Accounting/Finance', loc: 'Tejgaon, Dhaka', salary: 'Tk. 28,000 – 35,000', exp: '1 to 3 years', edu: 'B.Com / BBA (Accounting)', req: 'VAT and income tax return preparation, Tally ERP, financial statements. Good communication skills.', posted: 1, deadlineIn: 9 },
  { id: 's3', title: 'Executive – Finance & Accounts', company: 'Nilachol Knit Composite', cat: 'Accounting/Finance', loc: 'Gazipur', salary: 'Negotiable', exp: '2 to 4 years', edu: 'MBA / M.Com in Accounting', req: 'Costing, budgeting and payroll for a 1,200-worker factory. ERP experience preferred. Advanced Excel.', posted: 2, deadlineIn: 15 },
  { id: 's4', title: 'Accountent (Showroom)', company: 'Rongdhonu Electronics', loc: 'Chittagong', salary: 'Tk. 18,000', exp: '1 year', edu: 'HSC / Bachelor', req: 'Daily sales accounts, cash handling and bank deposit. MS Excel is a must.', posted: 0, deadlineIn: 6 },
  { id: 's5', title: 'হিসাবরক্ষক', company: 'পদ্মা ট্রেডার্স', loc: 'রাজশাহী', salary: 'আলোচনা সাপেক্ষ', exp: '১ থেকে ২ বছর', edu: 'বাণিজ্য বিভাগে স্নাতক', req: 'দৈনিক হিসাব, ভাউচার ও লেজার সংরক্ষণ। ট্যালি ও এক্সেল জানা থাকতে হবে। বয়স ২২ থেকে ৩৫ বছর।', posted: 1, deadlineIn: 10 },
  { id: 's6', title: 'Internal Auditor', company: 'Surjomukhi Group', cat: 'Accounting/Finance', loc: 'Motijheel, Dhaka', salary: 'Tk. 40,000 – 50,000', exp: '3 to 5 years', edu: 'CA (CC) with M.Com', req: 'Plan and run internal audit of group companies. Report writing, IFRS, VAT & tax compliance.', posted: 3, deadlineIn: 14 },
  { id: 's7', title: 'Cashier', company: 'Bela Bites Restaurant', loc: 'Dhanmondi, Dhaka', type: 'Full-time', salary: 'Tk. 14,000 – 16,000', exp: 'Not required', edu: 'HSC', req: 'Cash handling at the counter, POS billing. Evening shift. Age 20 to 30 years.', posted: 0, deadlineIn: 5 },

  // IT & software
  { id: 's8', title: 'Junior Software Engineer (Laravel)', company: 'Dhrubotara Soft', cat: 'IT/Telecommunication', loc: 'Uttara, Dhaka', salary: 'Tk. 25,000 – 35,000', exp: '0 to 1 year', edu: 'B.Sc in CSE', req: 'PHP, Laravel, MySQL, REST API and Git. Freshers with good projects are encouraged to apply.', posted: 0, deadlineIn: 11, vacancies: 3 },
  { id: 's9', title: 'Frontend Developer (React)', company: 'Kashful Technologies', cat: 'IT/Telecommunication', loc: 'Remote', salary: 'Tk. 40,000 – 60,000', exp: '2+ years', edu: 'Bachelor in any discipline', req: 'React, JavaScript, HTML, CSS, REST API. Work from home; office in Banani for monthly meetings.', posted: 1, deadlineIn: 13 },
  { id: 's10', title: 'SQA Engineer', company: 'Joler Gaan Digital', cat: 'IT/Telecommunication', loc: 'Mohakhali, Dhaka', salary: 'Tk. 30,000 – 45,000', exp: '1 to 2 years', edu: 'B.Sc in CSE / SWE', req: 'Manual testing, test cases, bug reporting; Selenium is a plus. SQL basics.', posted: 2, deadlineIn: 8 },
  { id: 's11', title: 'IT Support Officer', company: 'Shimanto Hospital', loc: 'Sylhet', salary: 'Tk. 18,000 – 22,000', exp: '1 year', edu: 'Diploma in Computer / B.Sc', req: 'Networking (LAN/WAN), MikroTik router, hardware troubleshooting. Roster duty.', posted: 0, deadlineIn: 7 },
  { id: 's12', title: 'Data Analyst (Power BI)', company: 'Boishakhi Retail', cat: 'IT/Telecommunication', loc: 'Gulshan-1, Dhaka', salary: 'Tk. 45,000 – 55,000', exp: '2 to 3 years', edu: 'Bachelor in Statistics / CSE / BBA', req: 'Power BI dashboards, SQL, advanced Excel. Presentation skills for management reporting.', posted: 4, deadlineIn: 10 },
  { id: 's13', title: 'Flutter Developer Intern', company: 'Tepantor Apps', loc: 'Mirpur DOHS, Dhaka', type: 'Internship', salary: 'Tk. 8,000 (allowance)', exp: 'Fresher', edu: 'Final-year student or recent graduate (CSE)', req: 'Flutter, REST API, Git. Three-month internship; the best interns get a full-time offer.', posted: 1, deadlineIn: 9 },
  { id: 's14', title: 'Graphic Designer', company: 'Aalpona Creative', cat: 'Design/Creative', loc: 'Banani, Dhaka', salary: 'Tk. 22,000 – 30,000', exp: '1 to 2 years', edu: 'Any graduate', req: 'Photoshop, Illustrator, social media creatives. Motion graphics (After Effects) is a plus.', posted: 0, deadlineIn: 12 },

  // Sales, marketing, support
  { id: 's15', title: 'Territory Sales Officer', company: 'Modhumoti Consumer Products', cat: 'Marketing/Sales', loc: 'Anywhere in Bangladesh', salary: 'Tk. 18,000 + TA/DA + incentive', exp: '1 to 3 years', edu: 'Bachelor', age: '22 to 32 years', req: 'Field sales through distributors, achieve monthly sales target. Must have a motorcycle with valid driving licence. Only males can apply.', posted: 1, deadlineIn: 14, vacancies: 25 },
  { id: 's16', title: 'Sales Executive (Showroom)', company: 'Rupkotha Lifestyle', loc: 'Bashundhara R/A, Dhaka', salary: 'Tk. 15,000 – 18,000', exp: 'Freshers can apply', edu: 'HSC', req: 'Customer handling in the showroom, daily sales report. Good communication skills. Only females can apply.', posted: 0, deadlineIn: 6, vacancies: 4 },
  { id: 's17', title: 'Business Development Executive', company: 'Shikhor EdTech', cat: 'Marketing/Sales', loc: 'Nadda, Dhaka', salary: 'Tk. 25,000 – 32,000', exp: '1 to 2 years', edu: 'BBA / any graduate', req: 'Lead generation, B2B sales to companies, presentation and negotiation. Good command over English.', posted: 2, deadlineIn: 10 },
  { id: 's18', title: 'Digital Marketing Executive', company: 'Projapoti Fashion', cat: 'Marketing/Sales', loc: 'Dhanmondi, Dhaka', salary: 'Tk. 25,000 – 35,000', exp: '1 to 3 years', edu: 'Bachelor', req: 'Facebook Ads, Google Ads, SEO basics, content writing for the page. Canva for quick creatives.', posted: 0, deadlineIn: 8 },
  { id: 's19', title: 'Content Writer (Bangla & English)', company: 'Chayapoth Media', loc: 'Remote', type: 'Part-time', salary: 'Tk. 12,000 – 15,000', exp: 'Fresher', edu: 'Honours student or graduate', req: 'Content writing, SEO-friendly articles, copywriting for social media. Work from home.', posted: 3, deadlineIn: 11 },
  { id: 's20', title: 'Customer Support Executive', company: 'Durbar Courier', cat: 'Customer Service/Call Centre', loc: 'Tejgaon, Dhaka', salary: 'Tk. 16,000 – 20,000', exp: 'Freshers can apply', edu: 'HSC / Bachelor', req: 'Customer service over phone and live chat, typing speed 30 wpm, MS Office. Roster duty including night shift.', posted: 0, deadlineIn: 7, vacancies: 10 },
  { id: 's21', title: 'Student Support Coordinator', company: 'Shikhor EdTech', loc: 'Nadda–Baridhara Road, Dhaka', salary: 'Tk. 20,000 – 28,000', exp: 'At least 6 months of previous professional work experience', edu: 'Graduation must be completed', req: 'Excellent verbal and written communication skills in English. Fundamentals in programming. Support students with their queries. Working hours 2 PM – 10 PM.', posted: 0, deadlineIn: 9 },
  { id: 's22', title: 'Call Center Agent', company: 'Kotha Connect BPO', cat: 'Customer Service/Call Centre', loc: 'Agrabad, Chattogram', type: 'Part-time', salary: 'Tk. 9,000 – 12,000', exp: 'Not required', edu: 'HSC', req: 'Inbound calls, customer handling, clear Bangla pronunciation. Students can apply.', posted: 2, deadlineIn: 13, vacancies: 30 },

  // HR, admin, office
  { id: 's23', title: 'HR Executive', company: 'Nilachol Knit Composite', cat: 'HR/Org. Development', loc: 'Gazipur', salary: 'Tk. 30,000 – 38,000', exp: '2 to 3 years', edu: 'MBA in HRM', req: 'Recruitment, payroll, Bangladesh Labour Act and compliance in a garments factory.', posted: 1, deadlineIn: 12 },
  { id: 's24', title: 'Admin Officer', company: 'Shimanto Hospital', loc: 'Sylhet', salary: 'Tk. 22,000 – 26,000', exp: '1 to 2 years', edu: 'Bachelor', req: 'Office management, vendor follow-up, MS Office, report writing.', posted: 3, deadlineIn: 9 },
  { id: 's25', title: 'Computer Operator', company: 'Jonaki Printing Press', loc: 'Paltan, Dhaka', salary: 'Tk. 13,000 – 16,000', exp: '1 year', edu: 'HSC', req: 'Bangla typing (Bijoy) and English typing, MS Word and Excel. Age maximum 30 years.', posted: 0, deadlineIn: 5 },
  { id: 's26', title: 'Front Desk Executive', company: 'Hotel Nodi Bangla', cat: 'Hospitality/Travel/Tourism', loc: "Cox's Bazar", salary: 'Tk. 18,000 – 22,000 + accommodation', exp: '1 to 2 years', edu: 'Bachelor', req: 'Guest check-in, reservation, fluent in English. Smart and presentable.', posted: 2, deadlineIn: 10 },
  { id: 's27', title: 'Executive', company: 'Surjomukhi Group', loc: 'Dhaka', salary: 'Negotiable', exp: '1 to 2 years', edu: 'Bachelor', req: 'Follow up with suppliers, prepare purchase orders, inventory management in ERP and vendor management.', posted: 1, deadlineIn: 7 },

  // Garments, engineering, supply chain
  { id: 's28', title: 'Merchandizer (Knit)', company: 'Tista Apparels', cat: 'Garments/Textile', loc: 'Uttara, Dhaka', salary: 'Tk. 35,000 – 45,000', exp: '2 to 4 years', edu: 'B.Sc in Textile / Bachelor', req: 'Buyer communication, costing, fabric knowledge and follow-up from order to shipment.', posted: 0, deadlineIn: 11 },
  { id: 's29', title: 'Quality Controller', company: 'Nilachol Knit Composite', cat: 'Garments/Textile', loc: 'Gazipur', salary: 'Tk. 16,000 – 20,000', exp: '1 to 3 years', edu: 'SSC / HSC', req: 'Inline and final inspection, AQL, quality control reports.', posted: 2, deadlineIn: 8, vacancies: 6 },
  { id: 's30', title: 'Sub-Assistant Engineer (Civil)', company: 'Dighi Builders', cat: 'Engineer/Architects', loc: 'Narayanganj', salary: 'Tk. 22,000 – 28,000', exp: '1 to 3 years', edu: 'Diploma in Civil Engineering', req: 'Site supervision, estimation and BOQ, AutoCAD drawing review.', posted: 1, deadlineIn: 14 },
  { id: 's31', title: 'Electrician', company: 'Rongdhonu Electronics', loc: 'Chattogram', salary: 'Tk. 14,000 – 18,000', exp: '2 years', edu: 'SSC (Vocational)', req: 'Electrical wiring, generator and AC maintenance at showrooms.', posted: 0, deadlineIn: 9, vacancies: 3 },
  { id: 's32', title: 'Store Keeper', company: 'Modhumoti Consumer Products', cat: 'Supply Chain/Procurement', loc: 'Savar, Dhaka', salary: 'Tk. 15,000 – 18,000', exp: '1 to 2 years', edu: 'HSC', req: 'Inventory management, stock register, basic Excel. Warehouse management of finished goods.', posted: 3, deadlineIn: 6 },
  { id: 's33', title: 'Procurement Officer', company: 'Meghdoot Logistics', cat: 'Supply Chain/Procurement', loc: 'Tejgaon, Dhaka', salary: 'Tk. 30,000 – 36,000', exp: '2 to 3 years', edu: 'BBA (SCM preferred)', req: 'Vendor management, negotiation, procurement through ERP, LC documentation.', posted: 1, deadlineIn: 12 },

  // Bank, NGO, education, health
  { id: 's34', title: 'Trainee Assistant Officer', company: 'Agrodut Bank PLC', cat: 'Bank/Non-Bank Fin. Institution', loc: 'Anywhere in Bangladesh', salary: 'Tk. 28,000 (during probation)', exp: 'Fresher', edu: 'Bachelor (Honours) with no third division', age: 'Maximum 30 years', req: 'Customer service at branches, cash handling, KYC. Posting in any district.', posted: 0, deadlineIn: 15, vacancies: 40 },
  { id: 's35', title: 'Credit Officer', company: 'Agrodut Bank PLC', cat: 'Bank/Non-Bank Fin. Institution', loc: 'Khulna, Jessore', salary: 'Tk. 35,000 – 42,000', exp: '2 to 4 years', edu: 'BBA / MBA', req: 'Credit analysis of SME loans, field visit, recovery follow-up.', posted: 2, deadlineIn: 10 },
  { id: 's36', title: 'Field Officer', company: 'Alor Dishari Foundation', cat: 'NGO/Development', loc: 'Kurigram, Gaibandha', salary: 'Tk. 18,500 + field allowance', exp: '1 year', edu: 'HSC / Bachelor', req: 'Community mobilization, data collection and field work in char areas. Must ride a motorcycle.', posted: 1, deadlineIn: 9, vacancies: 8 },
  { id: 's37', title: 'Program Officer (Education)', company: 'Alor Dishari Foundation', cat: 'NGO/Development', loc: 'Rangpur', salary: 'Tk. 38,000 – 45,000', exp: '3 to 5 years', edu: 'Masters in Social Science', req: 'Project management, monitoring & evaluation, report writing for donors.', posted: 4, deadlineIn: 13 },
  { id: 's38', title: 'Assistant Teacher (English)', company: 'Sonar Tori Model School', cat: 'Education/Training', loc: 'Mymensingh', salary: 'Tk. 15,000 – 20,000', exp: '1 to 2 years', edu: 'Honours in English', req: 'Classroom teaching for classes 6–10, lesson planning, fluent in English.', posted: 0, deadlineIn: 12 },
  { id: 's39', title: 'Course Instructor (Digital Marketing)', company: 'Shikhor EdTech', loc: 'Remote', type: 'Part-time', salary: 'Tk. 2,000 per class', exp: '3+ years', edu: 'Bachelor', req: 'Teach live online classes: Facebook Ads, Google Ads, SEO. Presentation skills.', posted: 2, deadlineIn: 10 },
  { id: 's40', title: 'Medical Promotion Officer', company: 'Arogyo Pharmaceuticals', cat: 'Medical/Pharma', loc: 'Bogra, Rajshahi, Pabna', salary: 'Tk. 25,000 + TA/DA', exp: 'Freshers can apply', edu: 'B.Sc / Bachelor (Science preferred)', age: 'Maximum 30 years', req: 'Visit doctors and chemists, achieve sales target. Motorcycle with valid licence.', posted: 0, deadlineIn: 14, vacancies: 15 },
  { id: 's41', title: 'Staff Nurse', company: 'Shimanto Hospital', cat: 'Medical/Pharma', loc: 'Sylhet', salary: 'Tk. 20,000 – 24,000', exp: '1 year', edu: 'Diploma in Nursing', req: 'Patient care in the ICU, nursing registration required. Shift duty.', posted: 1, deadlineIn: 8, vacancies: 5 },

  // Delivery, driving, service
  { id: 's42', title: 'Delivery Rider', company: 'Durbar Courier', loc: 'Mirpur, Uttara, Mohammadpur (Dhaka)', salary: 'Tk. 15,000 – 25,000 (with commission)', exp: 'Not required', edu: 'Class 8', req: 'Own bike or bicycle and a smartphone. Parcel delivery in your own area.', posted: 0, deadlineIn: 10, vacancies: 50 },
  { id: 's43', title: 'ড্রাইভার (প্রাইভেট কার)', company: 'মেঘদূত লজিস্টিকস', loc: 'গুলশান, ঢাকা', salary: '২০,০০০ টাকা', exp: '৩ বছর', edu: 'অষ্টম শ্রেণি', req: 'বৈধ ড্রাইভিং লাইসেন্স থাকতে হবে। ঢাকার রাস্তা চেনা থাকতে হবে। বয়স ২৫ থেকে ৪০ বছর।', posted: 1, deadlineIn: 7 },
  { id: 's44', title: 'Security Guard', company: 'Prohori Services', loc: 'Chattogram EPZ', salary: 'Tk. 12,500 + overtime', exp: 'Not required', edu: 'SSC', req: 'Gate duty in 8-hour shifts. Height at least 5 feet 6 inches. Age 20 to 40 years.', posted: 3, deadlineIn: 12, vacancies: 20 },

  // Posts the matcher has to be careful with
  { id: 's45', title: 'Data Entry Operator (Work From Home)', company: 'Quick Income BD', loc: 'Remote', type: 'Part-time', salary: 'Earn Tk. 2,000 per day', exp: 'Not required', edu: 'SSC', req: 'Typing work from home. Registration fee Tk. 550 by bKash number before joining. No interview.', posted: 0, deadlineIn: 20 },
  { id: 's46', title: 'Office Assistant', company: 'Jonaki Printing Press', salary: 'Tk. 11,000', exp: 'Not required', edu: 'SSC', req: 'Filing, photocopy and delivery of documents between offices.', posted: 2, deadlineIn: 6 },
  { id: 's47', title: 'Junior Accountant', company: 'Shapla Agro Foods Ltd.', cat: 'Accounting/Finance', loc: 'Mirpur, Dhaka', salary: 'Tk. 20,000 – 25,000', exp: 'Freshers can apply', edu: 'BBA in Accounting', req: 'Same post, seen on a second source.', posted: 0, deadlineIn: 12, source: 'Example portal B' },
];

/* Invented marks for the example companies, so the examples show how a logo sits on a job.
   A real post carries `logo` (a picture's address) or `site` (the company's website: its icon is used). */
(() => {
  const MARKS = [
    '<circle cx="32" cy="32" r="14" fill="none" stroke="#fff" stroke-width="7"/><circle cx="32" cy="32" r="4" fill="#fff"/>',
    '<rect x="15" y="34" width="8" height="14" rx="2" fill="#fff"/><rect x="28" y="25" width="8" height="23" rx="2" fill="#fff"/><rect x="41" y="16" width="8" height="32" rx="2" fill="#fff"/>',
    '<circle cx="25" cy="32" r="12" fill="#fff" fill-opacity=".95"/><circle cx="39" cy="32" r="12" fill="#fff" fill-opacity=".55"/>',
    '<path d="M12 46 27 19l9 15 5-7 11 19z" fill="#fff"/>',
    '<path d="M32 13c13 7 17 19 0 38C15 32 19 20 32 13z" fill="#fff"/>',
    '<rect x="15" y="15" width="15" height="15" rx="4" fill="#fff"/><rect x="34" y="15" width="15" height="15" rx="4" fill="#fff" fill-opacity=".55"/><rect x="15" y="34" width="15" height="15" rx="4" fill="#fff" fill-opacity=".55"/><rect x="34" y="34" width="15" height="15" rx="4" fill="#fff"/>',
    '<path d="M13 26c6-6 12-6 19 0s13 6 19 0M13 40c6-6 12-6 19 0s13 6 19 0" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
    '<path d="M32 12l18 20-18 20-18-20z" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>',
  ];
  const HUES = [222, 262, 190, 150, 24, 340, 45, 290, 205, 12];
  const made = {};
  SAMPLE_JOBS.forEach(j => {
    if (!j.company) return;
    if (!made[j.company]) {
      let h = 0; for (const c of j.company) h = (h * 31 + c.codePointAt(0)) % 9973;
      const hue = HUES[h % HUES.length], mark = MARKS[(h >> 3) % MARKS.length];
      made[j.company] = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="hsl(${hue} 70% 46%)"/>${mark}</svg>`);
    }
    j.logo = made[j.company];
  });
})();

