/**
 * Rapid Report Analyzer - Main Application Logic
 */

// Helper: Query selector shortcut
const $ = s => document.querySelector(s);

// Application State
let L = 'en';         // Active language: 'en' (English) | 'ta' (Tamil)
let cur = 'home';     // Currently active view id
let uploads = [];     // Stored user upload records
let custom = [];      // Custom test values entered by the user
let chat = [];        // Chat history messages [sender, text]

// Translation helper: looks up key in dictionary S
const t = k => S[k][L === 'en' ? 0 : 1];

// Evaluation helper: returns 'below', 'above', or 'inr' (inside range)
const status = (v, lo, hi) => v < lo ? 'below' : v > hi ? 'above' : 'inr';

/**
 * Generates the interactive visual card for a single medical parameter
 * @param {Array} p - Parameter data: [name, value, unit, lowRef, highRef]
 * @param {Object} rep - Optional report metadata object: { date, lab, ... }
 */
function story(p, rep) {
  const [n, v, u, lo, hi] = p;
  const st = status(v, lo, hi);
  const ex = EX[n] || GEN;
  const span = hi - lo;
  const mn = lo - span * 0.7;
  const mx = hi + span * 0.7;
  const pos = x => Math.max(2, Math.min(98, ((x - mn) / (mx - mn)) * 100));

  return `<div class="card">
    <div class="top" style="margin:0">
      <h3>${n}</h3>
      <span class="pill ${st === 'inr' ? 'in' : 'out'}">${t(st)}</span>
    </div>
    <p class="mute" style="margin:0">${rep ? rep.date + ' · ' + rep.lab : ''}</p>
    <div class="bar" role="img" aria-label="${n} ${v} ${u}">
      <i style="left:${pos(lo)}%;width:${pos(hi) - pos(lo)}%"></i>
      <b style="left:${pos(v)}%"></b>
      <em style="left:${pos(v)}%">${v} ${u}</em>
    </div>
    <div class="scale">
      <span>${mn.toFixed(1)}</span>
      <span>${t('ref')}: ${lo}–${hi} ${u}</span>
      <span>${mx.toFixed(1)}</span>
    </div>
    <details open>
      <summary>${t('measured')}</summary>
      <p>${ex[0][L === 'en' ? 0 : 1]}</p>
    </details>
    <details>
      <summary>${t('why')}</summary>
      <p>${ex[1][L === 'en' ? 0 : 1]}</p>
    </details>
    <details>
      <summary>${t('res')}</summary>
      <p><b>${v} ${u}</b> — ${t(st)} (${lo}–${hi} ${u}).</p>
    </details>
    <details>
      <summary>${t('askdoc')}</summary>
      <p>${st === 'inr' ? t('askin') : t('askout')}</p>
    </details>
    <details>
      <summary>${t('note')}</summary>
      <p>${t('notetxt')}</p>
    </details>
  </div>`;
}

// Get all unique parameter test names from reports
const params = () => [...new Set(R.flatMap(r => r.p.map(x => x[0])))];

// Retrieve historical time series for a test
function series(n) {
  return R
    .filter(r => r.p.some(x => x[0] === n))
    .map(r => ({ r, x: r.p.find(x => x[0] === n) }))
    .sort((a, b) => a.r.date.localeCompare(b.r.date));
}

/**
 * Generates an SVG timeline chart for a specific test parameter
 * @param {string} n - Parameter name
 */
function chart(n) {
  const s = series(n);
  if (s.length < 2) return '';
  const vals = s.flatMap(o => [o.x[1], o.x[3], o.x[4]]);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const W = 520;
  const H = 200;
  const X = i => 50 + i * (W - 80) / (s.length - 1);
  const Y = v => H - 30 - ((v - mn) / (mx - mn || 1)) * (H - 60);
  const lo = s[s.length - 1].x[3];
  const hi = s[s.length - 1].x[4];

  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${n} history">
    <rect x="50" y="${Y(hi)}" width="${W - 80}" height="${Y(lo) - Y(hi)}" fill="#9fdcc5" opacity=".45"/>
    <polyline fill="none" stroke="var(--blue)" stroke-width="3" points="${s.map((o, i) => X(i) + ',' + Y(o.x[1])).join(' ')}"/>
    ${s.map((o, i) => `
      <circle cx="${X(i)}" cy="${Y(o.x[1])}" r="5" fill="var(--blue)"/>
      <text x="${X(i)}" y="${Y(o.x[1]) - 10}" text-anchor="middle">${o.x[1]}</text>
      <text x="${X(i)}" y="${H - 8}" text-anchor="middle">${o.r.date}</text>
    `).join('')}
  </svg>
  <p class="mute" style="font-size:13px">
    ${L === 'en' ? 'Green band: range from the latest report. Compare only when labs, units and methods match.' : 'பச்சை பகுதி: சமீபத்திய அறிக்கையின் வரம்பு. ஆய்வகம், அலகு, முறை ஒன்றாக இருந்தால் மட்டுமே ஒப்பிடவும்.'}
  </p>`;
}

// Views Dictionary: HTML templates for each page
const V = {
  home: () => `
    <div class="hero">
      <div>
        <h1>${t('tag')}</h1>
        <p>${t('intro')}</p>
        <p style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" data-go="upload">${t('up')}</button>
          <button class="btn alt" data-go="story">${t('try')}</button>
        </p>
      </div>
      <div style="text-align:center">
        <img src="${LOGO}" alt="Rapid Report Analyzer: One Platform. Every Report. Smarter Analysis." style="width:min(100%,300px);border-radius:28px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.25)">
      </div>
    </div>
    <div class="card">
      <div class="flow">
        ${S.flow[0].map((_, i) => S.flow[L === 'en' ? 0 : 1][i]).map((x, i, a) => `<span>${x}</span>${i < a.length - 1 ? '<b>›</b>' : ''}`).join('')}
      </div>
    </div>
    <div class="grid">
      ${[
        ['📊', L === 'en' ? 'Visual story for every result' : 'ஒவ்வொரு முடிவுக்கும் காட்சிக் கதை'],
        ['🌐', L === 'en' ? 'Tamil and English' : 'தமிழ் மற்றும் ஆங்கிலம்'],
        ['📈', L === 'en' ? 'Timeline and comparison' : 'காலவரிசை மற்றும் ஒப்பீடு'],
        ['🔒', L === 'en' ? 'Privacy first: no data leaves your browser in this demo' : 'தனியுரிமை முதன்மை: இந்த டெமோவில் தரவு உலாவியை விட்டு வெளியேறாது']
      ].map(f => `
        <div class="card">
          <div style="font-size:30px">${f[0]}</div>
          <h3>${f[1]}</h3>
        </div>
      `).join('')}
    </div>`,

  dash: () => {
    return `<h2>${L === 'en' ? 'Welcome, Demo User' : 'வணக்கம், டெமோ பயனர்'}</h2>
    <p class="mute">${new Date().toLocaleDateString(L === 'en' ? 'en-IN' : 'ta-IN', { dateStyle: 'full' })}</p>
    <div class="grid">
      <div class="card"><h3>${R.length + uploads.length}</h3><span class="mute">${L === 'en' ? 'Reports' : 'அறிக்கைகள்'}</span></div>
      <div class="card"><h3>3</h3><span class="mute">${L === 'en' ? 'Categories' : 'வகைகள்'}</span></div>
      <div class="card"><h3>${L === 'en' ? 'Demo – complete' : 'டெமோ – முடிந்தது'}</h3><span class="mute">${L === 'en' ? 'Latest status' : 'சமீபத்திய நிலை'}</span></div>
    </div>
    <h2>${L === 'en' ? 'Latest results' : 'சமீபத்திய முடிவுகள்'}</h2>
    <div class="card">
      <table>
        <tr>
          <th>${L === 'en' ? 'Test' : 'பரிசோதனை'}</th>
          <th>${L === 'en' ? 'Latest' : 'தற்போது'}</th>
          <th>${L === 'en' ? 'Previous' : 'முந்தையது'}</th>
          <th>${L === 'en' ? 'Range' : 'வரம்பு'}</th>
        </tr>
        ${params().map(n => {
          const s = series(n), a = s[s.length - 1].x, b = s[s.length - 2];
          return `<tr><td>${n}</td><td>${a[1]} ${a[2]}</td><td>${b ? b.x[1] : '–'}</td><td>${a[3]}–${a[4]}</td></tr>`;
        }).join('')}
      </table>
    </div>
    <p style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn" data-go="upload">${L === 'en' ? 'Upload new report' : 'புதிய அறிக்கை'}</button>
      <button class="btn alt" data-go="timeline">${L === 'en' ? 'View timeline' : 'காலவரிசை'}</button>
      <button class="btn alt" data-go="compare">${L === 'en' ? 'Compare reports' : 'ஒப்பிடுக'}</button>
      <button class="btn alt" data-go="story">${L === 'en' ? 'Open visual story' : 'காட்சிக் கதை'}</button>
    </p>`;
  },

  upload: () => `
    <h2>${t('up')}</h2>
    <div class="card">
      <div class="drop" id="drop">
        <p><b>${L === 'en' ? 'Drag and drop PDF, JPG or PNG files here' : 'PDF, JPG, PNG கோப்புகளை இழுத்து விடவும்'}</b></p>
        <input type="file" id="file" multiple accept=".pdf,.jpg,.jpeg,.png">
      </div>
      <div class="form" style="margin-top:14px">
        <label>${L === 'en' ? 'Category' : 'வகை'}
          <select id="cat">
            <option>Blood</option>
            <option>Sugar</option>
            <option>Thyroid</option>
            <option>X-ray</option>
            <option>CT scan</option>
            <option>Other</option>
          </select>
        </label>
        <label>${L === 'en' ? 'Report date' : 'அறிக்கை தேதி'}
          <input type="date" id="rdate">
        </label>
        <label>${L === 'en' ? 'Lab (optional)' : 'ஆய்வகம் (விருப்பம்)'}
          <input id="lab">
        </label>
      </div>
    </div>
    <div id="ulist"></div>
    <div class="card">
      <h3>${L === 'en' ? 'Automatic extraction: setup required' : 'தானியங்கி பிரித்தெடுப்பு: அமைப்பு தேவை'}</h3>
      <p class="mute">${L === 'en' ? 'Reading values from files needs a backend (Flask + Tesseract OCR + PyMuPDF + an AI API with secure keys). It is not connected in this demo, so no values are invented. Meanwhile, type values from your report in the Visual Story page.' : 'கோப்புகளிலிருந்து மதிப்புகளைப் படிக்க பின்புறம் (Flask + Tesseract OCR + PyMuPDF + AI API) தேவை. இந்த டெமோவில் இணைக்கப்படவில்லை; எனவே மதிப்புகள் உருவாக்கப்படாது. அதுவரை, காட்சிக் கதை பக்கத்தில் உங்கள் அறிக்கை மதிப்புகளை உள்ளிடவும்.'}</p>
      <button class="btn" data-go="story">${t('own')}</button>
    </div>`,

  story: () => {
    const r = R[3];
    return `<h2>${t('measured').replace('?', '')} → ${L === 'en' ? 'Visual story' : 'காட்சிக் கதை'}</h2>
    <div class="card">
      <h3>${t('own')}</h3>
      <div class="form">
        <label>${L === 'en' ? 'Test name' : 'பரிசோதனை'}<input id="n" value="Haemoglobin"></label>
        <label>${t('res')}<input id="v" type="number" step="any" style="width:100px"></label>
        <label>${L === 'en' ? 'Unit' : 'அலகு'}<input id="u" style="width:90px" value="g/dL"></label>
        <label>${L === 'en' ? 'Range low' : 'குறைந்த'}<input id="lo" type="number" step="any" style="width:90px"></label>
        <label>${L === 'en' ? 'Range high' : 'அதிகபட்சம்'}<input id="hi" type="number" step="any" style="width:90px"></label>
        <button class="btn" id="mk">${L === 'en' ? 'Create story' : 'கதை உருவாக்கு'}</button>
      </div>
      <p class="mute" style="font-size:13px;margin:8px 0 0">${L === 'en' ? 'Use the range printed on your lab report.' : 'உங்கள் ஆய்வக அறிக்கையில் உள்ள வரம்பைப் பயன்படுத்தவும்.'}</p>
    </div>
    <div id="mine">${custom.map(c => story(c)).join('')}</div>
    <p class="demo" style="display:inline-block">${t('demo')}</p>
    <div class="grid">${[...r.p, ...R[4].p, ...R[5].p].map(p => story(p, R.find(x => x.p.includes(p)))).join('')}</div>
    <p class="noprint"><button class="btn" onclick="window.print()">${L === 'en' ? 'Download summary (Print → Save as PDF)' : 'சுருக்கம் பதிவிறக்கு (அச்சு → PDF)'}</button></p>`;
  },

  timeline: () => `
    <h2>${L === 'en' ? 'Health timeline' : 'உடல்நல காலவரிசை'}</h2>
    <div class="card">
      <label>${L === 'en' ? 'Test' : 'பரிசோதனை'}
        <select id="tp">${params().map(n => `<option>${n}</option>`).join('')}</select>
      </label>
      <div id="tc">${chart(params()[0])}</div>
    </div>
    <div class="card">
      ${[...R].sort((a, b) => b.date.localeCompare(a.date)).map(r => `<p><b>${r.date}</b> · ${r.cat} · ${r.p.map(x => x[0] + ' ' + x[1]).join(', ')}</p>`).join('')}
    </div>`,

  compare: () => {
    const opts = R.map(r => `<option value="${r.id}">${r.date} · ${r.cat}</option>`).join('');
    return `<h2>${L === 'en' ? 'Compare reports' : 'அறிக்கை ஒப்பீடு'}</h2>
    <div class="card form">
      <label>A<select id="ca">${opts}</select></label>
      <label>B<select id="cb">${opts}</select></label>
      <button class="btn" id="cmp">${L === 'en' ? 'Compare' : 'ஒப்பிடு'}</button>
    </div>
    <div id="cres"></div>`;
  },

  insights: () => {
    const latest = params().map(n => { const s = series(n); return s[s.length - 1]; });
    const outs = latest.filter(o => status(o.x[1], o.x[3], o.x[4]) !== 'inr');
    return `<h2>${L === 'en' ? 'Health insights' : 'உடல்நல தகவல்கள்'}</h2>
    <div class="grid">
      <div class="card">
        <h3>${L === 'en' ? 'Outside printed range (latest)' : 'வரம்பிற்கு வெளியே (சமீபத்தியது)'}</h3>
        ${outs.map(o => `<p>${o.x[0]}: ${o.x[1]} ${o.x[2]} (${o.x[3]}–${o.x[4]})</p>`).join('') || '–'}
      </div>
      <div class="card">
        <h3>${L === 'en' ? 'Changes across reports' : 'அறிக்கைகளுக்கிடையே மாற்றங்கள்'}</h3>
        ${params().map(n => { const s = series(n); return `<p>${n}: ${s[0].x[1]} → ${s[s.length - 1].x[1]}</p>`; }).join('')}
      </div>
      <div class="card">
        <h3>${L === 'en' ? 'Limitations' : 'வரம்புகள்'}</h3>
        <p>${L === 'en' ? 'Based only on demo values. No diagnosis or risk score is given.' : 'டெமோ மதிப்புகளை மட்டுமே சார்ந்தது. நோய் கண்டறிதல் அல்லது ஆபத்து மதிப்பெண் இல்லை.'}</p>
      </div>
      <div class="card">
        <h3>${L === 'en' ? 'Questions for your doctor' : 'மருத்துவரிடம் கேள்விகள்'}</h3>
        <p>${t('askout')}</p>
      </div>
    </div>`;
  },

  diet: () => `
    <h2>${L === 'en' ? 'Diet & nutrition' : 'உணவு & ஊட்டச்சத்து'}</h2>
    <p class="mute">${L === 'en' ? 'General education only. Ask a qualified dietitian for condition-specific advice, and consider your allergies.' : 'பொதுவான கல்வித் தகவல் மட்டுமே. நிலைக்கேற்ற ஆலோசனைக்கு தகுதியான உணவியல் நிபுணரை அணுகவும்; ஒவ்வாமைகளை கவனிக்கவும்.'}</p>
    <div class="grid">
      ${[
        ['🥣', 'Idli & sambar', 'இட்லி & சாம்பார்', 'Steamed, light, with lentils and vegetables.', 'ஆவியில் வேகவைத்த, பருப்பு மற்றும் காய்கறிகளுடன்.'],
        ['🥞', 'Dosa & chutney', 'தோசை & சட்னி', 'Pair with vegetable sides.', 'காய்கறி பக்க உணவுடன்.'],
        ['🍜', 'Idiyappam & kurma', 'இடியாப்பம் & குருமா', 'Good with vegetable kurma.', 'காய்கறி குருமாவுடன்.'],
        ['🍲', 'Vegetable upma', 'காய்கறி உப்புமா', 'Adds vegetables to a morning meal.', 'காலை உணவில் காய்கறிகள்.'],
        ['🥗', 'Vegetable meals', 'காய்கறி சாப்பாடு', 'Rice, dal, 2 vegetables, curd.', 'சாதம், பருப்பு, 2 காய்கறிகள், தயிர்.'],
        ['🫘', 'Sundal', 'சுண்டல்', 'Chickpea or lentil snack.', 'கொண்டைக்கடலை சிற்றுண்டி.'],
        ['🍌', 'Fruits', 'பழங்கள்', 'Papaya, guava, banana, apple.', 'பப்பாளி, கொய்யா, வாழை, ஆப்பிள்.'],
        ['💧', 'Hydration', 'நீர்', 'Water through the day.', 'நாள் முழுவதும் தண்ணீர்.']
      ].map(f => `
        <div class="card">
          <div style="font-size:34px">${f[0]}</div>
          <h3>${L === 'en' ? f[1] : f[2]}</h3>
          <span class="mute">${L === 'en' ? f[3] : f[4]}</span>
        </div>
      `).join('')}
    </div>`,

  move: () => `
    <h2>${L === 'en' ? 'Exercise & lifestyle' : 'உடற்பயிற்சி & வாழ்க்கைமுறை'}</h2>
    <div class="grid">
      ${[
        ['🚶', 'Walking', 'நடைப்பயிற்சி', 'Start with 10–15 easy minutes.', '10–15 நிமிடங்கள் எளிதாக தொடங்குங்கள்.'],
        ['🧘', 'Yoga & stretching', 'யோகா & நீட்சி', 'Gentle, beginner-friendly poses.', 'மென்மையான தொடக்கநிலை ஆசனங்கள்.'],
        ['🚴', 'Cycling', 'சைக்கிள்', 'Relaxed pace on flat roads.', 'சமமான சாலையில் மெதுவாக.'],
        ['🌬️', 'Breathing', 'சுவாசப் பயிற்சி', 'Slow breathing for relaxation.', 'ஓய்வுக்கு மெதுவான சுவாசம்.'],
        ['😴', 'Sleep', 'தூக்கம்', 'Keep a regular bedtime.', 'ஒரே நேரத்தில் தூங்குங்கள்.'],
        ['🧠', 'Stress', 'மன அழுத்தம்', 'Short breaks, time outdoors.', 'சிறு இடைவெளி, வெளியில் நேரம்.']
      ].map(f => `
        <div class="card">
          <div style="font-size:34px">${f[0]}</div>
          <h3>${L === 'en' ? f[1] : f[2]}</h3>
          <span class="mute">${L === 'en' ? f[3] : f[4]}</span>
        </div>
      `).join('')}
    </div>
    <p class="mute">${L === 'en' ? 'Stop if you feel unwell. Check with a professional if your report or health condition may affect exercise safety.' : 'உடல்நலம் சரியில்லை எனில் நிறுத்துங்கள். அறிக்கை அல்லது உடல்நிலை பாதிக்கலாம் எனில் நிபுணரிடம் கேளுங்கள்.'}</p>`,

  chat: () => `
    <h2>${t('measured').length ? NAV[9][L === 'en' ? 1 : 2] : ''}</h2>
    <p class="demo" style="display:inline-block">${L === 'en' ? 'Demo: rule-based, not a live AI. Text only.' : 'டெமோ: விதி அடிப்படையிலானது, நேரடி AI அல்ல. உரை மட்டும்.'}</p>
    <div class="card">
      <div class="chat" id="cl" aria-live="polite">
        ${chat.map(m => `<div class="msg ${m[0]}">${m[1]}</div>`).join('') || `
          <div class="msg a">${L === 'en' ? 'Ask about a test in the demo reports, e.g. “Explain my haemoglobin” or “What changed in my TSH?”' : 'டெமோ அறிக்கைகளில் உள்ள பரிசோதனை பற்றி கேளுங்கள்: “என் ஹீமோகுளோபினை விளக்கு”'}</div>
        `}
      </div>
      <div class="form" style="margin-top:10px">
        <input id="q" style="flex:1;min-width:180px" placeholder="${L === 'en' ? 'Type your question' : 'கேள்வியை தட்டச்சு செய்க'}">
        <button class="btn" id="send">${L === 'en' ? 'Send' : 'அனுப்பு'}</button>
      </div>
    </div>`,

  history: () => `
    <h2>${L === 'en' ? 'Report history' : 'அறிக்கை வரலாறு'}</h2>
    <div class="card form">
      <input id="hs" placeholder="${L === 'en' ? 'Search' : 'தேடு'}">
      <select id="hc">
        <option value="">${L === 'en' ? 'All' : 'அனைத்தும்'}</option>
        <option>Blood</option>
        <option>Sugar</option>
        <option>Thyroid</option>
      </select>
    </div>
    <div id="hl"></div>`,

  profile: () => `
    <h2>${NAV[11][L === 'en' ? 1 : 2]}</h2>
    <div class="card">
      <p><b>Demo User</b> · demo@example.com</p>
      <div class="form">
        <label>${L === 'en' ? 'Preferred language' : 'மொழி'}
          <select id="pl">
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
          </select>
        </label>
      </div>
    </div>
    <div class="card">
      <h3>${L === 'en' ? 'Privacy' : 'தனியுரிமை'}</h3>
      <p>${L === 'en' ? 'In this demo, files you add stay in your browser and are never uploaded. Login, secure storage and per-user access control need the Firebase and Flask setup. Delete reports any time from Report history.' : 'இந்த டெமோவில் நீங்கள் சேர்க்கும் கோப்புகள் உலாவியிலேயே இருக்கும்; பதிவேற்றப்படாது. உள்நுழைவு, பாதுகாப்பான சேமிப்பு Firebase மற்றும் Flask அமைப்பு தேவை. அறிக்கை வரலாற்றில் எப்போதும் நீக்கலாம்.'}</p>
      <button class="btn alt" disabled>${L === 'en' ? 'Log out (needs auth setup)' : 'வெளியேறு (அங்கீகார அமைப்பு தேவை)'}</button>
    </div>`
};

/**
 * Binds DOM event listeners for the active view
 */
function bind() {
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));

  const f = $('#file');
  if (f) {
    const add = fs => {
      [...fs].forEach(x => {
        if (!/\.(pdf|jpe?g|png)$/i.test(x.name)) {
          return alert(x.name + (L === 'en' ? ': unsupported format' : ': ஆதரிக்கப்படாத வடிவம்'));
        }
        uploads.push({
          file: x.name,
          cat: $('#cat').value,
          date: $('#rdate').value || '–',
          lab: $('#lab').value,
          url: URL.createObjectURL(x),
          img: x.type.startsWith('image')
        });
      });
      ul();
    };
    f.onchange = e => add(e.target.files);
    const d = $('#drop');
    d.ondragover = e => e.preventDefault();
    d.ondrop = e => {
      e.preventDefault();
      add(e.dataTransfer.files);
    };
    ul();
  }

  if ($('#mk')) {
    $('#mk').onclick = () => {
      const v = parseFloat($('#v').value);
      const lo = parseFloat($('#lo').value);
      const hi = parseFloat($('#hi').value);
      if ([v, lo, hi].some(isNaN) || lo >= hi) {
        return alert(L === 'en' ? 'Enter a value and a valid range.' : 'மதிப்பு மற்றும் சரியான வரம்பை உள்ளிடவும்.');
      }
      custom.unshift([$('#n').value || 'Test', v, $('#u').value, lo, hi]);
      $('#mine').innerHTML = custom.map(c => story(c)).join('');
    };
  }

  if ($('#tp')) {
    $('#tp').onchange = e => $('#tc').innerHTML = chart(e.target.value);
  }

  if ($('#cmp')) {
    $('#cmp').onclick = () => {
      const a = R.find(r => r.id == $('#ca').value);
      const b = R.find(r => r.id == $('#cb').value);
      let h = `<div class="card"><table><tr><th>${L === 'en' ? 'Test' : 'பரிசோதனை'}</th><th>${a.date}</th><th>${b.date}</th><th>Δ</th><th>${L === 'en' ? 'Note' : 'குறிப்பு'}</th></tr>`;
      let any = false;
      a.p.forEach(x => {
        const y = b.p.find(z => z[0] === x[0]);
        if (!y) return;
        any = true;
        const d = +(y[1] - x[1]).toFixed(2);
        const same = x[2] === y[2] && x[3] === y[3] && x[4] === y[4];
        h += `<tr><td>${x[0]}</td><td>${x[1]} ${x[2]}<br><small>${x[3]}–${x[4]}</small></td><td>${y[1]} ${y[2]}<br><small>${y[3]}–${y[4]}</small></td><td>${d > 0 ? '▲ +' : d < 0 ? '▼ ' : '＝ '}${d}</td><td>${same ? (L === 'en' ? 'Units and ranges match' : 'அலகு, வரம்பு ஒன்றே') : (L === 'en' ? 'Verify: units or ranges differ' : 'சரிபார்க்கவும்: வேறுபாடு')}</td></tr>`;
      });
      $('#cres').innerHTML = any ? h + `</table><p class="mute">${L === 'en' ? 'A higher or lower number is not automatically better or worse; it depends on the test and your situation.' : 'அதிகமோ குறைவோ தானாக நல்லது/கெட்டது அல்ல; பரிசோதனை மற்றும் உங்கள் நிலையைப் பொறுத்தது.'}</p></div>` : `<div class="card">${L === 'en' ? 'No matching tests in these two reports.' : 'பொருந்தும் பரிசோதனைகள் இல்லை.'}</div>`;
    };
  }

  if ($('#send')) $('#send').onclick = ask;
  if ($('#q')) {
    $('#q').onkeydown = e => {
      if (e.key === 'Enter') ask();
    };
  }

  if ($('#hl')) {
    const draw = () => {
      const s = $('#hs').value.toLowerCase();
      const c = $('#hc').value;
      const all = [...uploads.map((u, i) => ({ ...u, up: i })), ...R.map(r => ({ ...r }))].filter(r => (!c || r.cat === c) && r.file.toLowerCase().includes(s));
      $('#hl').innerHTML = all.length ? all.map(r => `
        <div class="card top">
          <div>
            <b>${r.file}</b><br>
            <span class="mute">${r.cat} · ${r.date}</span>
          </div>
          <div>
            ${r.id ? `<button class="btn sm" data-go="story">${L === 'en' ? 'Visual story' : 'காட்சிக் கதை'}</button> ` : ''}
            ${r.up !== undefined ? `<button class="btn sm alt" data-del="${r.up}">${L === 'en' ? 'Delete' : 'நீக்கு'}</button>` : ''}
          </div>
        </div>
      `).join('') : `<div class="card">${L === 'en' ? 'No reports found. Upload one to begin.' : 'அறிக்கைகள் இல்லை. பதிவேற்றம் செய்யவும்.'}</div>`;

      document.querySelectorAll('#hl [data-go]').forEach(b => b.onclick = () => go('story'));
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        uploads.splice(+b.dataset.del, 1);
        draw();
      });
    };
    $('#hs').oninput = draw;
    $('#hc').onchange = draw;
    draw();
  }

  if ($('#pl')) {
    $('#pl').value = L;
    $('#pl').onchange = e => setL(e.target.value);
  }
}

/**
 * Render the uploaded files list in the Upload view
 */
function ul() {
  const e = $('#ulist');
  if (!e) return;
  e.innerHTML = uploads.map((u, i) => `
    <div class="card top">
      <div>
        ${u.img ? `<img src="${u.url}" alt="" height="60" style="border-radius:8px;vertical-align:middle"> ` : '📄 '}
        <b>${u.file}</b> · ${u.cat} · ${u.date}<br>
        <span class="mute">${L === 'en' ? 'Uploaded locally. Not analysed: extraction backend not connected.' : 'உள்ளூரில் சேர்க்கப்பட்டது. பகுப்பாய்வு இல்லை: பின்புறம் இணைக்கப்படவில்லை.'}</span>
      </div>
      <button class="btn sm alt" data-rm="${i}">${L === 'en' ? 'Remove' : 'நீக்கு'}</button>
    </div>
  `).join('');
  e.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
    uploads.splice(+b.dataset.rm, 1);
    ul();
  });
}

/**
 * Handle AI Health Assistant question answering
 */
function ask() {
  const q = $('#q').value.trim();
  if (!q) return;
  chat.push(['u', q]);
  const lq = q.toLowerCase();
  let key = params().find(n => lq.includes(n.toLowerCase())) ||
    (lq.includes('haem') || lq.includes('ஹீமோ') ? 'Haemoglobin' :
      lq.includes('sugar') || lq.includes('சர்க்கரை') ? 'FBS' :
        lq.includes('thyroid') || lq.includes('தைராய்டு') ? 'TSH' : null);
  let a;

  if (key) {
    const s = series(key);
    const x = s[s.length - 1];
    const ex = EX[key] || GEN;
    const i = L === 'en' ? 0 : 1;
    const pr = s.length > 1 ? ` ${L === 'en' ? 'Earlier' : 'முன்பு'}: ${s[0].x[1]} (${s[0].r.date}).` : '';
    a = `${ex[0][i]} ${L === 'en' ? 'In the demo report dated' : 'டெமோ அறிக்கை தேதி'} ${x.r.date}: ${x[0] || x.x[0]} ${x.x[1]} ${x.x[2]}, ${t(status(x.x[1], x.x[3], x.x[4])).toLowerCase()} (${x.x[3]}–${x.x[4]}).${pr} ${L === 'en' ? 'This is not a diagnosis. Please discuss with your doctor.' : 'இது நோய் கண்டறிதல் அல்ல. மருத்துவரிடம் பேசுங்கள்.'}`;
  } else {
    a = L === 'en' ? 'I can’t find that in the demo reports, so I won’t guess. Try naming a test such as haemoglobin, sugar or TSH, and please ask a healthcare professional about anything else.' : 'டெமோ அறிக்கைகளில் அது இல்லை, எனவே ஊகிக்க மாட்டேன். ஹீமோகுளோபின், சர்க்கரை, TSH போன்ற பரிசோதனையைக் குறிப்பிடுங்கள்; மற்றவற்றை மருத்துவரிடம் கேளுங்கள்.';
  }

  chat.push(['a', a]);
  render();
}

/**
 * Render Sidebar Navigation
 */
function renderNav() {
  $('#nav').innerHTML = `
    <div class="logo">
      <img src="${LOGO}" alt="RRA logo">
      <span>Rapid Report Analyzer</span>
    </div>
    ${NAV.map(n => `<button data-go="${n[0]}" class="${n[0] === cur ? 'on' : ''}">${L === 'en' ? n[1] : n[2]}</button>`).join('')}
  `;
}

/**
 * Render the full application
 */
function render() {
  document.body.classList.toggle('ta', L === 'ta');
  document.documentElement.lang = L;
  renderNav();
  $('#view').innerHTML = V[cur]();
  $('#demoTag').textContent = t('demo');
  $('#disc').textContent = t('disc');
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.l === L));
  bind();
  const c = $('#cl');
  if (c) c.scrollTop = 1e5;
}

/**
 * Navigate to a view
 * @param {string} v - Target view ID
 */
function go(v) {
  cur = v;
  render();
  window.scrollTo(0, 0);
}

/**
 * Set active language
 * @param {string} l - 'en' or 'ta'
 */
function setL(l) {
  L = l;
  render();
}

// Bind language switcher buttons in header
document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setL(b.dataset.l));

// Initial application bootstrap
render();
