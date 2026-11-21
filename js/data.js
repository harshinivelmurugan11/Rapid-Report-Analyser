/**
 * Rapid Report Analyzer - Data, Constants & Translations
 */

// Application Logo Asset Path
const LOGO = 'assets/logo.jpg';

// Navigation Items: [viewId, English label, Tamil label]
const NAV = [
  ['home', 'Home', 'முகப்பு'],
  ['dash', 'Dashboard', 'டாஷ்போர்டு'],
  ['upload', 'Upload Reports', 'அறிக்கை பதிவேற்றம்'],
  ['story', 'Report-to-Visual Story', 'அறிக்கை காட்சிக் கதை'],
  ['timeline', 'Health Timeline', 'உடல்நல காலவரிசை'],
  ['compare', 'Compare Reports', 'அறிக்கை ஒப்பீடு'],
  ['insights', 'Health Insights', 'உடல்நல தகவல்கள்'],
  ['diet', 'Diet & Nutrition', 'உணவு & ஊட்டச்சத்து'],
  ['move', 'Exercise & Lifestyle', 'உடற்பயிற்சி & வாழ்க்கைமுறை'],
  ['chat', 'AI Health Assistant', 'சுகாதார உதவியாளர்'],
  ['history', 'Report History', 'அறிக்கை வரலாறு'],
  ['profile', 'Profile & Settings', 'சுயவிவரம் & அமைப்புகள்']
];

// Static UI Translations: [English, Tamil]
const S = {
  demo: [
    'DEMO DATA – fictional values, not a real patient',
    'டெமோ தரவு – கற்பனை மதிப்புகள், உண்மையான நோயாளி அல்ல'
  ],
  disc: [
    'This platform provides AI-assisted educational explanations of medical reports. It does not provide medical diagnosis or replace professional medical advice. Always consult a qualified healthcare professional for clinical interpretation and decisions.',
    'இந்த தளம் மருத்துவ அறிக்கைகளுக்கு கல்வி நோக்கிலான விளக்கங்களை மட்டுமே வழங்குகிறது. இது நோய் கண்டறிதல் அல்ல; மருத்துவ ஆலோசனைக்கு மாற்றும் அல்ல. முடிவுகளுக்கு தகுதியான மருத்துவரை அணுகவும்.'
  ],
  tag: [
    'Your Health, Clearly Explained.',
    'உங்கள் உடல்நலம், தெளிவாக விளக்கப்படுகிறது.'
  ],
  intro: [
    'Turn a complicated lab report into a simple visual story: what was measured, why, where your result sits against the lab’s own range, and what to ask your doctor.',
    'சிக்கலான ஆய்வக அறிக்கையை எளிய காட்சிக் கதையாக மாற்றுங்கள்: என்ன அளக்கப்பட்டது, ஏன், உங்கள் முடிவு ஆய்வகத்தின் வரம்பில் எங்கே உள்ளது, மருத்துவரிடம் என்ன கேட்பது.'
  ],
  try: [
    'Try the visual story',
    'காட்சிக் கதையைப் பாருங்கள்'
  ],
  up: [
    'Upload your report',
    'அறிக்கையை பதிவேற்றுங்கள்'
  ],
  flow: [
    ['Upload report', 'AI extraction', 'Analysis', 'Visual story', 'Understanding'],
    ['அறிக்கை பதிவேற்றம்', 'AI பிரித்தெடுப்பு', 'பகுப்பாய்வு', 'காட்சிக் கதை', 'புரிதல்']
  ],
  measured: ['What was measured?', 'என்ன அளக்கப்பட்டது?'],
  why: ['Why is it measured?', 'ஏன் அளக்கப்படுகிறது?'],
  res: ['Your result', 'உங்கள் முடிவு'],
  ref: ['Lab reference range (as printed on the report)', 'ஆய்வக வரம்பு (அறிக்கையில் அச்சிடப்பட்டபடி)'],
  inr: ['Inside the range printed on this report', 'இந்த அறிக்கையில் உள்ள வரம்பிற்குள்'],
  below: ['Below the range printed on this report', 'இந்த அறிக்கையின் வரம்பிற்கு கீழ்'],
  above: ['Above the range printed on this report', 'இந்த அறிக்கையின் வரம்பிற்கு மேல்'],
  note: ['Important notes', 'முக்கிய குறிப்புகள்'],
  notetxt: [
    'Ranges differ by laboratory, age, sex and method. This is not a diagnosis. Check the value against your original report.',
    'வரம்புகள் ஆய்வகம், வயது, பாலினம், முறை ஆகியவற்றால் மாறும். இது நோய் கண்டறிதல் அல்ல. அசல் அறிக்கையுடன் மதிப்பைச் சரிபார்க்கவும்.'
  ],
  askdoc: ['Ask your doctor', 'மருத்துவரிடம் கேளுங்கள்'],
  askout: [
    'What could explain this value for me, and does it need a repeat test or follow-up?',
    'இந்த மதிப்பு எனக்கு ஏன் இப்படி இருக்கலாம்? மீண்டும் பரிசோதனை அல்லது தொடர் கவனிப்பு தேவையா?'
  ],
  askin: [
    'Is there anything about my history that makes this result worth tracking over time?',
    'என் வரலாற்றைப் பொறுத்து இந்த முடிவை தொடர்ந்து கண்காணிக்க வேண்டுமா?'
  ],
  own: ['Explain your own value', 'உங்கள் மதிப்பை விளக்குங்கள்']
};

// Medical Parameter Definitions & Explanations: [Description, Clinical Purpose] in [English, Tamil]
const EX = {
  Haemoglobin: [
    [
      'The amount of haemoglobin, the protein in red blood cells that carries oxygen.',
      'இரத்த சிவப்பணுக்களில் ஆக்சிஜனை எடுத்துச் செல்லும் புரதமான ஹீமோகுளோபின் அளவு.'
    ],
    [
      'To understand how well blood can carry oxygen around the body.',
      'உடலில் இரத்தம் ஆக்சிஜனை எவ்வளவு நன்றாக கொண்டு செல்கிறது என்பதை அறிய.'
    ]
  ],
  WBC: [
    [
      'The number of white blood cells, which help the body fight infection.',
      'நோய்த்தொற்றை எதிர்க்கும் வெள்ளை அணுக்களின் எண்ணிக்கை.'
    ],
    [
      'To look at the body’s defence cells.',
      'உடலின் பாதுகாப்பு அணுக்களைப் பார்க்க.'
    ]
  ],
  Platelets: [
    [
      'The number of platelets, small cells that help blood clot.',
      'இரத்தம் உறைய உதவும் சிறிய அணுக்களான பிளேட்லெட் எண்ணிக்கை.'
    ],
    [
      'To check the blood’s clotting cells.',
      'இரத்த உறைவு அணுக்களை சரிபார்க்க.'
    ]
  ],
  FBS: [
    [
      'Blood sugar after at least 8 hours without food.',
      'குறைந்தது 8 மணி நேரம் உணவின்றி இருந்த பின் இரத்த சர்க்கரை அளவு.'
    ],
    [
      'To see how the body handles sugar when not recently eating.',
      'சமீபத்தில் சாப்பிடாதபோது உடல் சர்க்கரையை எப்படி கையாள்கிறது என்பதை அறிய.'
    ]
  ],
  HbA1c: [
    [
      'Average blood sugar over roughly the past 2–3 months.',
      'கடந்த சுமார் 2–3 மாதங்களின் சராசரி இரத்த சர்க்கரை.'
    ],
    [
      'To see longer-term sugar levels, not just one day.',
      'ஒரு நாள் மட்டுமல்ல, நீண்டகால சர்க்கரை நிலையை அறிய.'
    ]
  ],
  TSH: [
    [
      'Thyroid-stimulating hormone, a signal from the brain that guides the thyroid gland.',
      'மூளையிலிருந்து தைராய்டு சுரப்பியை வழிநடத்தும் ஹார்மோனான TSH.'
    ],
    [
      'To understand how the thyroid is being signalled to work.',
      'தைராய்டு எப்படி இயங்கத் தூண்டப்படுகிறது என்பதை அறிய.'
    ]
  ]
};

// Generic Fallback Explanation
const GEN = [
  [
    'The value of this test as printed in your report.',
    'உங்கள் அறிக்கையில் அச்சிடப்பட்ட இந்த பரிசோதனையின் மதிப்பு.'
  ],
  [
    'Ask your healthcare professional why this test was ordered.',
    'இந்த பரிசோதனை ஏன் செய்யப்பட்டது என்று மருத்துவரிடம் கேளுங்கள்.'
  ]
];

// Fictional Demo Reports Dataset
const R = [
  {
    id: 1,
    file: 'demo_cbc_mar.pdf',
    cat: 'Blood',
    date: '2026-03-10',
    lab: 'Demo Lab A',
    p: [
      ['Haemoglobin', 11.2, 'g/dL', 12, 15.5],
      ['WBC', 7.4, '×10³/µL', 4, 11],
      ['Platelets', 240, '×10³/µL', 150, 410]
    ]
  },
  {
    id: 2,
    file: 'demo_sugar_mar.pdf',
    cat: 'Sugar',
    date: '2026-03-10',
    lab: 'Demo Lab A',
    p: [
      ['FBS', 108, 'mg/dL', 70, 100],
      ['HbA1c', 5.9, '%', 4, 5.6]
    ]
  },
  {
    id: 3,
    file: 'demo_thyroid_mar.pdf',
    cat: 'Thyroid',
    date: '2026-03-12',
    lab: 'Demo Lab A',
    p: [
      ['TSH', 4.8, 'µIU/mL', 0.4, 4.2]
    ]
  },
  {
    id: 4,
    file: 'demo_cbc_sep.pdf',
    cat: 'Blood',
    date: '2026-09-12',
    lab: 'Demo Lab A',
    p: [
      ['Haemoglobin', 11.9, 'g/dL', 12, 15.5],
      ['WBC', 6.9, '×10³/µL', 4, 11],
      ['Platelets', 255, '×10³/µL', 150, 410]
    ]
  },
  {
    id: 5,
    file: 'demo_sugar_sep.pdf',
    cat: 'Sugar',
    date: '2026-09-12',
    lab: 'Demo Lab A',
    p: [
      ['FBS', 99, 'mg/dL', 70, 100],
      ['HbA1c', 5.7, '%', 4, 5.6]
    ]
  },
  {
    id: 6,
    file: 'demo_thyroid_sep.pdf',
    cat: 'Thyroid',
    date: '2026-09-14',
    lab: 'Demo Lab A',
    p: [
      ['TSH', 3.9, 'µIU/mL', 0.4, 4.2]
    ]
  }
];
