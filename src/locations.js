/* ───────── Bangladesh: 8 divisions, 64 districts, areas of the big cities ───────── */
const DIVISIONS = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Kishoreganj', 'Madaripur', 'Gopalganj', 'Rajbari', 'Shariatpur'],
  Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Lakshmipur', 'Chandpur', 'Rangamati', 'Khagrachhari', 'Bandarban'],
  Rajshahi: ['Rajshahi', 'Bogura', 'Pabna', 'Sirajganj', 'Naogaon', 'Natore', 'Chapainawabganj', 'Joypurhat'],
  Khulna: ['Khulna', 'Jashore', 'Satkhira', 'Bagerhat', 'Kushtia', 'Jhenaidah', 'Magura', 'Narail', 'Chuadanga', 'Meherpur'],
  Barishal: ['Barishal', 'Bhola', 'Patuakhali', 'Pirojpur', 'Jhalokathi', 'Barguna'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Lalmonirhat', 'Thakurgaon', 'Panchagarh'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
};

/* Areas inside a district, in groups of neighbours: a job in the same group counts as “near”. */
const AREA_GROUPS = {
  Dhaka: [
    ['Uttara', 'Khilkhet', 'Nikunja', 'Bashundhara', 'Vatara', 'Airport', 'Turag'],
    ['Mirpur', 'Pallabi', 'Kafrul', 'Agargaon', 'Shyamoli', 'Kallyanpur', 'Gabtoli'],
    ['Gulshan', 'Banani', 'Baridhara', 'Badda', 'Mohakhali', 'Niketan', 'Nadda'],
    ['Tejgaon', 'Farmgate', 'Karwan Bazar', 'Mogbazar', 'Malibagh', 'Rampura', 'Banasree', 'Panthapath'],
    ['Dhanmondi', 'Mohammadpur', 'Lalmatia', 'Kalabagan', 'New Market', 'Elephant Road'],
    ['Motijheel', 'Paltan', 'Old Dhaka', 'Jatrabari', 'Khilgaon', 'Demra', 'Wari', 'Shantinagar'],
    ['Savar', 'Ashulia', 'Keraniganj', 'Dhamrai'],
  ],
  Chattogram: [
    ['Agrabad', 'Halishahar', 'EPZ', 'Patenga', 'Bandar'],
    ['GEC', 'Nasirabad', 'Khulshi', 'Panchlaish', 'Chawkbazar', 'Muradpur'],
    ['Pahartali', 'Oxygen', 'Bayezid', 'Hathazari'],
  ],
  Gazipur: [['Tongi', 'Board Bazar', 'Chowrasta', 'Konabari', 'Kaliakair', 'Sreepur']],
  Narayanganj: [['Fatullah', 'Siddhirganj', 'Rupganj', 'Sonargaon']],
};

/* Other spellings, old names and Bangla names → the name used above (keys lower case). */
const PLACE_ALIASES = {
  'chittagong': 'Chattogram', 'ctg': 'Chattogram', 'chattagram': 'Chattogram', 'চট্টগ্রাম': 'Chattogram',
  'comilla': 'Cumilla', 'কুমিল্লা': 'Cumilla', 'barisal': 'Barishal', 'বরিশাল': 'Barishal',
  'jessore': 'Jashore', 'যশোর': 'Jashore', 'bogra': 'Bogura', 'বগুড়া': 'Bogura',
  'coxs bazar': "Cox's Bazar", 'cox’s bazar': "Cox's Bazar", 'coxsbazar': "Cox's Bazar", 'কক্সবাজার': "Cox's Bazar",
  'ঢাকা': 'Dhaka', 'dacca': 'Dhaka', 'গাজীপুর': 'Gazipur', 'নারায়ণগঞ্জ': 'Narayanganj', 'n.ganj': 'Narayanganj', "n'ganj": 'Narayanganj', 'narayangonj': 'Narayanganj',
  'রাজশাহী': 'Rajshahi', 'খুলনা': 'Khulna', 'সিলেট': 'Sylhet', 'রংপুর': 'Rangpur', 'ময়মনসিংহ': 'Mymensingh', 'mymensing': 'Mymensingh',
  'টাঙ্গাইল': 'Tangail', 'ফরিদপুর': 'Faridpur', 'দিনাজপুর': 'Dinajpur', 'পাবনা': 'Pabna', 'কুষ্টিয়া': 'Kushtia', 'নোয়াখালী': 'Noakhali', 'ফেনী': 'Feni',
  'brahmanbaria': 'Brahmanbaria', 'b.baria': 'Brahmanbaria', 'moulvi bazar': 'Moulvibazar', 'maulvibazar': 'Moulvibazar', 'chapai nawabganj': 'Chapainawabganj', 'jhalakathi': 'Jhalokathi', 'netrakona': 'Netrokona', 'lakshmipur': 'Lakshmipur', 'laxmipur': 'Lakshmipur', 'jhenidah': 'Jhenaidah', 'sirajgonj': 'Sirajganj', 'munshigonj': 'Munshiganj', 'manikgonj': 'Manikganj', 'kishoregonj': 'Kishoreganj',
  'মিরপুর': 'Mirpur', 'উত্তরা': 'Uttara', 'গুলশান': 'Gulshan', 'বনানী': 'Banani', 'ধানমন্ডি': 'Dhanmondi', 'মোহাম্মদপুর': 'Mohammadpur', 'মতিঝিল': 'Motijheel', 'বাড্ডা': 'Badda', 'সাভার': 'Savar', 'তেজগাঁও': 'Tejgaon',
  // every district in Bangla, and the spellings posts use
  'মানিকগঞ্জ': 'Manikganj', 'মুন্সিগঞ্জ': 'Munshiganj', 'মুন্সীগঞ্জ': 'Munshiganj', 'নরসিংদী': 'Narsingdi', 'কিশোরগঞ্জ': 'Kishoreganj', 'মাদারীপুর': 'Madaripur', 'গোপালগঞ্জ': 'Gopalganj', 'রাজবাড়ী': 'Rajbari', 'শরীয়তপুর': 'Shariatpur',
  'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria', 'লক্ষ্মীপুর': 'Lakshmipur', 'চাঁদপুর': 'Chandpur', 'রাঙ্গামাটি': 'Rangamati', 'রাঙামাটি': 'Rangamati', 'খাগড়াছড়ি': 'Khagrachhari', 'বান্দরবান': 'Bandarban',
  'সিরাজগঞ্জ': 'Sirajganj', 'নওগাঁ': 'Naogaon', 'নাটোর': 'Natore', 'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj', 'জয়পুরহাট': 'Joypurhat',
  'সাতক্ষীরা': 'Satkhira', 'বাগেরহাট': 'Bagerhat', 'ঝিনাইদহ': 'Jhenaidah', 'মাগুরা': 'Magura', 'নড়াইল': 'Narail', 'চুয়াডাঙ্গা': 'Chuadanga', 'মেহেরপুর': 'Meherpur',
  'ভোলা': 'Bhola', 'পটুয়াখালী': 'Patuakhali', 'পিরোজপুর': 'Pirojpur', 'ঝালকাঠি': 'Jhalokathi', 'বরগুনা': 'Barguna',
  'মৌলভীবাজার': 'Moulvibazar', 'হবিগঞ্জ': 'Habiganj', 'সুনামগঞ্জ': 'Sunamganj',
  'কুড়িগ্রাম': 'Kurigram', 'গাইবান্ধা': 'Gaibandha', 'নীলফামারী': 'Nilphamari', 'লালমনিরহাট': 'Lalmonirhat', 'ঠাকুরগাঁও': 'Thakurgaon', 'পঞ্চগড়': 'Panchagarh',
  'জামালপুর': 'Jamalpur', 'নেত্রকোণা': 'Netrokona', 'নেত্রকোনা': 'Netrokona', 'শেরপুর': 'Sherpur',
  'narsinghdi': 'Narsingdi', 'narshingdi': 'Narsingdi', 'borguna': 'Barguna', 'bagura': 'Bogura', 'cumilla city': 'Cumilla', 'chattogram city': 'Chattogram', 'jhalokati': 'Jhalokathi', 'khagrachari': 'Khagrachhari', 'kustia': 'Kushtia', 'mymenshingh': 'Mymensingh', 'maymensingh': 'Mymensingh',
  'chapai': 'Chapainawabganj', 'chapainababganj': 'Chapainawabganj', 'habigonj': 'Habiganj', 'sunamgonj': 'Sunamganj', 'gopalgonj': 'Gopalganj', 'thakurgoan': 'Thakurgaon', 'tangile': 'Tangail', 'faridpur sadar': 'Faridpur',
  // towns, upazilas and industrial areas that posts name instead of the district
  'ashuganj': 'Brahmanbaria', 'bhairab': 'Kishoreganj', 'sreemangal': 'Moulvibazar', 'srimangal': 'Moulvibazar', 'trishal': 'Mymensingh', 'bhaluka': 'Mymensingh', 'valuka': 'Mymensingh',
  'ishwardi': 'Pabna', 'ishurdi': 'Pabna', 'rooppur': 'Pabna', 'saidpur': 'Nilphamari', 'syedpur': 'Nilphamari', 'mongla': 'Bagerhat', 'benapole': 'Jashore', 'teknaf': "Cox's Bazar", 'ukhiya': "Cox's Bazar", 'matarbari': "Cox's Bazar", 'maheshkhali': "Cox's Bazar",
  'chandina': 'Cumilla', 'laksham': 'Cumilla', 'daudkandi': 'Cumilla', 'mirzapur': 'Tangail', 'ghorashal': 'Narsingdi', 'madhabdi': 'Narsingdi', 'maijdee': 'Noakhali', 'chowmuhani': 'Noakhali', 'kuakata': 'Patuakhali', 'payra': 'Patuakhali',
  'bhanga': 'Faridpur', 'tungipara': 'Gopalganj', 'shibchar': 'Madaripur', 'singair': 'Manikganj', 'sreenagar': 'Munshiganj', 'gazaria': 'Munshiganj', 'shayestaganj': 'Habiganj',
  'sitakunda': 'Chattogram', 'sitakund': 'Chattogram', 'mirsarai': 'Chattogram', 'mirsharai': 'Chattogram', 'patiya': 'Chattogram', 'anwara': 'Chattogram', 'kalurghat': 'Chattogram', 'kepz': 'Chattogram', 'karnaphuli': 'Chattogram',
  'joydebpur': 'Gazipur', 'kashimpur': 'Gazipur', 'rajendrapur': 'Gazipur', 'mawna': 'Sreepur', 'mouchak': 'Kaliakair', 'chandra': 'Kaliakair', 'tongi industrial area': 'Tongi', 'টঙ্গী': 'Tongi', 'কোনাবাড়ী': 'Konabari', 'শ্রীপুর': 'Sreepur',
  'kanchpur': 'Sonargaon', 'bhulta': 'Rupganj', 'adamjee': 'Siddhirganj', 'araihazar': 'Narayanganj', 'bscic narayanganj': 'Narayanganj',
  // more of Dhaka
  'basundhara': 'Bashundhara', 'basundhara ra': 'Bashundhara', 'basundhara r/a': 'Bashundhara', 'bashundhara residential area': 'Bashundhara', 'bhatara': 'Vatara', 'ভাটারা': 'Vatara', 'বসুন্ধরা': 'Bashundhara',
  'uttarkhan': 'Uttara', 'dakshinkhan': 'Uttara', 'abdullahpur': 'Uttara', 'hemayetpur': 'Savar', 'jamgora': 'Ashulia', 'baipayl': 'Ashulia', 'baipail': 'Ashulia', 'zirabo': 'Ashulia', 'আশুলিয়া': 'Ashulia', 'depz': 'Savar', 'dhaka epz': 'Savar',
  'mohakhali dohs': 'Mohakhali', 'baridhara dohs': 'Baridhara', 'banani dohs': 'Banani', 'tejgaon industrial area': 'Tejgaon', 'tejgaon i/a': 'Tejgaon', 'nayapaltan': 'Paltan', 'naya paltan': 'Paltan', 'purana paltan': 'Paltan', 'dilkusha': 'Motijheel',
  'eskaton': 'Mogbazar', 'bangla motor': 'Mogbazar', 'banglamotor': 'Mogbazar', 'kazipara': 'Mirpur', 'shewrapara': 'Mirpur', 'mirpur-13': 'Mirpur', 'mirpur-14': 'Mirpur', 'mirpur 1': 'Mirpur', 'mirpur 10': 'Mirpur', 'mirpur 12': 'Mirpur',
  'মহাখালী': 'Mohakhali', 'ফার্মগেট': 'Farmgate', 'পল্টন': 'Paltan', 'রামপুরা': 'Rampura', 'খিলগাঁও': 'Khilgaon', 'যাত্রাবাড়ী': 'Jatrabari', 'কেরানীগঞ্জ': 'Keraniganj', 'বারিধারা': 'Baridhara', 'খিলক্ষেত': 'Khilkhet', 'শ্যামলী': 'Shyamoli', 'আগারগাঁও': 'Agargaon',
  'আগ্রাবাদ': 'Agrabad', 'হালিশহর': 'Halishahar', 'পতেঙ্গা': 'Patenga', 'নাসিরাবাদ': 'Nasirabad',
  'mirpur-1': 'Mirpur', 'mirpur-2': 'Mirpur', 'mirpur-10': 'Mirpur', 'mirpur-11': 'Mirpur', 'mirpur-12': 'Mirpur', 'mirpur dohs': 'Mirpur', 'bashundhara r/a': 'Bashundhara', 'bashundhara ra': 'Bashundhara', 'kawran bazar': 'Karwan Bazar', 'kawranbazar': 'Karwan Bazar', 'karwanbazar': 'Karwan Bazar', 'moghbazar': 'Mogbazar', 'mohammedpur': 'Mohammadpur', 'dhanmondi r/a': 'Dhanmondi', 'motijhil': 'Motijheel', 'puran dhaka': 'Old Dhaka', 'gulshan-1': 'Gulshan', 'gulshan-2': 'Gulshan', 'gulshan 1': 'Gulshan', 'gulshan 2': 'Gulshan', 'uttara sector': 'Uttara', 'tongi': 'Tongi', 'agrabad c/a': 'Agrabad', 'gec circle': 'GEC', 'cepz': 'EPZ',
};

