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
    ['Uttara', 'Khilkhet', 'Nikunja', 'Bashundhara', 'Airport', 'Turag'],
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
  'mirpur-1': 'Mirpur', 'mirpur-2': 'Mirpur', 'mirpur-10': 'Mirpur', 'mirpur-11': 'Mirpur', 'mirpur-12': 'Mirpur', 'mirpur dohs': 'Mirpur', 'bashundhara r/a': 'Bashundhara', 'bashundhara ra': 'Bashundhara', 'kawran bazar': 'Karwan Bazar', 'kawranbazar': 'Karwan Bazar', 'karwanbazar': 'Karwan Bazar', 'moghbazar': 'Mogbazar', 'mohammedpur': 'Mohammadpur', 'dhanmondi r/a': 'Dhanmondi', 'motijhil': 'Motijheel', 'puran dhaka': 'Old Dhaka', 'gulshan-1': 'Gulshan', 'gulshan-2': 'Gulshan', 'gulshan 1': 'Gulshan', 'gulshan 2': 'Gulshan', 'uttara sector': 'Uttara', 'tongi': 'Tongi', 'agrabad c/a': 'Agrabad', 'gec circle': 'GEC', 'cepz': 'EPZ',
};

