/* ============================================================
   פריים · סטודיו צילום — שכבת נתונים (דמו, נשמר ב-localStorage)
   בגרסה אמיתית השכבה הזו מוחלפת ב-Supabase / Firebase.
   ============================================================ */
window.Store = (function () {
  const KEY = 'frame-studio-v7';

  /* ---------- תאריכים ---------- */
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const todayStr = () => ymd(today());

  /* ---------- קטלוגים ---------- */
  const SHOOT_TYPES = [
    { id: 'wedding', name: 'חתונה', desc: 'יום מלא — מההתארגנות ועד הריקודים', fullDay: true, base: 6500 },
    { id: 'barmitzvah', name: 'בר / בת מצווה', desc: 'אירוע ערב וצילומי משפחה', fullDay: true, base: 4200 },
    { id: 'newborn', name: 'ניו בורן', desc: 'סטודיו ביתי, תינוקות עד גיל חודש', base: 1100 },
    { id: 'family', name: 'משפחה בטבע', desc: 'שעת זהב, שדה פתוח, כולם יחד', base: 850 },
    { id: 'maternity', name: 'הריון', desc: 'אור רך, בד זורם, רגע של שקט', base: 800 },
    { id: 'brit', name: 'ברית / בריתה', desc: 'אירוע בוקר קצר ומרגש', base: 1300 },
    { id: 'book', name: 'בוק בת מצווה', desc: 'לוקיישן חוץ, החלפות בגדים', base: 900 },
    { id: 'business', name: 'תדמית לעסק', desc: 'פורטרטים, מוצרים, לינקדאין', base: 950 }
  ];
  const AREAS = ['צפון', 'חיפה והקריות', 'שרון', 'מרכז', 'ירושלים', 'שפלה', 'דרום'];
  const STYLES = [
    { id: 'natural', name: 'טבעי ואוורירי' },
    { id: 'moody', name: 'דרמטי וכהה' },
    { id: 'classic', name: 'קלאסי ונקי' },
    { id: 'bw', name: 'דוקומנטרי' }
  ];
  const TIMES = ['בוקר', 'צהריים', 'שעת זהב', 'ערב'];
  const STATUS = {
    new:       { name: 'חדשה — לשיבוץ', short: 'חדשה' },
    sent:      { name: 'נשלחה לצלמת', short: 'ממתינה' },
    confirmed: { name: 'מאושרת', short: 'מאושרת' },
    declined:  { name: 'הצלמת דחתה', short: 'נדחתה' },
    done:      { name: 'בוצעה', short: 'בוצעה' },
    cancelled: { name: 'בוטלה', short: 'בוטלה' }
  };
  const BLOCKING = ['sent', 'confirmed', 'done'];
  /* מודל העסקה: עמלה באחוזים (הלקוחה משלמת לצלמת, את מקבלת אחוז) או משכורת (ההכנסה שלך, את משלמת לה) */
  const PAY_TYPES = { commission: 'עובדת לפי אחוזים', salary: 'מקבלת משכורת' };
  /* היקף עבודה: תהליך מלא (מצלמת, עורכת ומעצבת לבד) או צילום בלבד (העריכה והעיצוב אצלך) */
  const SCOPES = { full: 'תהליך מלא — צילום, עריכה ועיצוב', shoot: 'צילום בלבד — עריכה ועיצוב בסטודיו' };
  /* שלבי עריכה ומסירה אחרי הצילום */
  const POST = [
    { id: 'raw', name: 'ממתין לחומרים', short: 'חומרים' },
    { id: 'editing', name: 'בעריכה', short: 'עריכה' },
    { id: 'design', name: 'עיצוב אלבום / גלריה', short: 'עיצוב' },
    { id: 'delivered', name: 'נמסר ללקוחות', short: 'נמסר' }
  ];
  const DELIVERY_DAYS = { wedding: 45, barmitzvah: 30 };
  const DAY_SLOTS = 2; // צילום קצר תופס חצי יום, אירוע תופס יום מלא

  /* ---------- PRNG דטרמיניסטי לדמו ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- נתוני דמו ---------- */
  function seed() {
    const rnd = mulberry32(20261005);
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const P = [
      { id: 'p0', owner: true, name: 'רחל פרלמוטר', tagline: 'הצלמת הראשית · מנהלת פריים', areas: ['מרכז', 'שרון', 'ירושלים', 'שפלה'], types: ['wedding', 'barmitzvah', 'newborn', 'maternity', 'family'], styles: ['moody', 'classic'], factor: 1, weekdays: [0, 1, 2, 3, 4], commission: 0, rating: 5.0, reviews: 212, years: 14, color: '#C8371D', photo: 'meirav', bio: 'מצלמת אנשים כבר ארבע־עשרה שנה. בניתי את פריים כדי שאף לקוחה לא תישאר בלי צלמת טובה — גם כשאני תפוסה.' },
      { id: 'p1', name: 'תמר כהן', tagline: 'אור טבעי, ילדים אמיתיים', areas: ['מרכז', 'שרון'], types: ['family', 'newborn', 'maternity', 'book'], styles: ['natural'], factor: 0.72, weekdays: [0, 1, 2, 3, 4, 5], commission: 15, rating: 4.9, reviews: 87, years: 6, color: '#D9962B', photo: 'tamar-c', bio: 'רגעים לא מבוימים. אני נותנת לילדים לרוץ ומצלמת את מה שקורה ביניהם.' },
      { id: 'p2', name: 'אביטל רוזן', tagline: 'חתונות בגובה העיניים', areas: ['ירושלים', 'שפלה', 'מרכז'], types: ['wedding', 'barmitzvah', 'brit'], styles: ['bw', 'classic'], factor: 0.8, weekdays: [0, 1, 2, 3, 4], commission: 12, rating: 4.8, reviews: 64, years: 8, color: '#5B6E8C', photo: 'avital-r', bio: 'צילום דוקומנטרי לאירועים. מעט הכוונה, הרבה עיניים פתוחות.' },
      { id: 'p3', name: 'הדס מזרחי', tagline: 'ניו בורן בסטודיו מחומם', areas: ['שרון', 'מרכז'], types: ['newborn', 'maternity', 'family'], styles: ['natural', 'classic'], factor: 0.65, weekdays: [0, 1, 2, 3], commission: 15, rating: 4.9, reviews: 143, years: 7, color: '#7A8C5B', photo: 'hadas-m', bio: 'סטודיו ביתי ברעננה, ציוד חימום ותנוחות בטוחות. סבלנות אינסופית.' },
      { id: 'p4', name: 'רוני אברהם', tagline: 'בוקים ותדמית עם אופי', areas: ['חיפה והקריות', 'צפון'], types: ['book', 'business', 'family', 'maternity'], styles: ['moody', 'natural'], factor: 0.6, weekdays: [0, 1, 2, 3, 4, 5], commission: 15, rating: 4.7, reviews: 41, years: 4, color: '#8C5B7A', photo: 'roni-a', bio: 'צלמת צעירה מחיפה. אוהבת עיר, בטון ושקיעות מעל הים.' },
      { id: 'p5', name: 'יעל שטרן', tagline: 'בר מצוות ואירועי משפחה', areas: ['מרכז', 'שפלה', 'דרום'], types: ['barmitzvah', 'brit', 'family', 'wedding'], styles: ['classic', 'natural'], factor: 0.68, weekdays: [0, 1, 2, 3, 4], commission: 12, rating: 4.8, reviews: 96, years: 9, color: '#3F7F7A', photo: 'yael-s', bio: 'אירועים בסטנדרט גבוה במחיר הוגן. מגיעה עם עוזרת ותאורה.' },
      { id: 'p6', name: 'ליאת בן דוד', tagline: 'דרום, מדבר ושעת זהב', areas: ['דרום'], types: ['family', 'maternity', 'book', 'brit', 'business'], styles: ['natural', 'moody'], factor: 0.55, weekdays: [0, 1, 3, 4, 5], commission: 18, rating: 4.6, reviews: 29, years: 3, color: '#B07A3E', photo: 'liat-bd', bio: 'מבאר שבע. המדבר הוא הסטודיו שלי.' },
      { id: 'p7', name: 'מעיין גולן', tagline: 'צפון ירוק ואור רך', areas: ['צפון', 'חיפה והקריות'], types: ['family', 'newborn', 'maternity', 'wedding'], styles: ['natural', 'bw'], factor: 0.7, weekdays: [1, 2, 3, 4, 5], commission: 15, rating: 4.9, reviews: 58, years: 5, color: '#4E7F55', photo: 'maayan-g', bio: 'מצלמת בגליל ובגולן. משפחות, שדות וחתונות קטנות בחוץ.' },
      { id: 'p8', name: 'נוי פרץ', tagline: 'תדמית לעסקים קטנים', areas: ['מרכז', 'שרון', 'ירושלים'], types: ['business', 'book', 'family'], styles: ['classic', 'moody'], factor: 0.58, weekdays: [0, 1, 2, 3, 4], commission: 15, rating: 4.7, reviews: 37, years: 4, color: '#6A5B8C', photo: 'noy-p', bio: 'עוזרת לעסקים להיראות כמו שהם באמת. סשנים קצרים וממוקדים.' }
    ];
    const model = {
      p3: { payType: 'salary', salary: 3000 },
      p4: { scope: 'shoot' },
      p5: { payType: 'salary', salary: 4000, scope: 'shoot' },
      p6: { scope: 'shoot' },
      p8: { payType: 'salary', salary: 2500, scope: 'shoot' }
    };
    P.forEach(p => Object.assign(p, { payType: 'commission', salary: 0, scope: 'full' }, model[p.id] || {}));
    const t = today();
    P.forEach((p, i) => {
      p.phone = '05' + (2 + (i % 6)) + '-' + String(1000000 + Math.floor(rnd() * 8999999)).slice(0, 7);
      p.active = true;
      p.prices = {};
      p.types.forEach(tid => {
        const base = SHOOT_TYPES.find(s => s.id === tid).base;
        p.prices[tid] = Math.round(base * p.factor / 50) * 50;
      });
      p.exceptions = {};
      for (let k = 0; k < 4; k++) p.exceptions[ymd(addDays(t, 2 + Math.floor(rnd() * 55)))] = 'off';
    });

    const clients = ['משפחת אזולאי', 'דנה ויוסי', 'רחלי כהנא', 'אורית שמעוני', 'משפחת לוינסון', 'נגה ואלון', 'חן מלכה', 'שני ברק', 'משפחת דהן', 'עדי ואורי', 'מיכל טל', 'סיוון ונדב', 'משפחת פרידמן', 'אלה גבאי', 'הילה ושחר', 'רותם קליין'];
    const state = { photographers: P, bookings: [], seq: 1040, settings: { studioPhone: '0500000000', studioName: 'פריים' } };
    for (let i = 0; i < 170; i++) {
      const off = Math.floor(rnd() * 84) - 40;
      const d = addDays(t, off);
      if (d.getDay() === 6) continue;
      const p = pick(P.slice(1)) ;
      const useP = rnd() < 0.12 ? P[0] : (p.payType === 'salary' || rnd() < 0.7) ? p : pick(P.filter(x => x.payType === 'salary'));
      const typeId = pick(useP.types);
      const ds = ymd(d);
      if (!canTake(state, useP, ds, typeId)) continue;
      const status = off < 0 ? (rnd() < 0.92 ? 'done' : 'cancelled') : (off < 3 || rnd() < 0.62 ? 'confirmed' : 'sent');
      const created = addDays(d, -(4 + Math.floor(rnd() * 40)));
      state.bookings.push(mkBooking(state, {
        date: ds, typeId, photographerId: useP.id, status, area: pick(useP.areas), time: pick(TIMES),
        client: { name: pick(clients), phone: '05' + Math.floor(rnd() * 9) + '-' + Math.floor(1000000 + rnd() * 8999999), email: '', notes: '' },
        createdAt: status === 'sent' ? new Date(Date.now() - rnd() * 30 * 36e5).toISOString() : (created < t ? created : t).toISOString(), viaStudio: rnd() < 0.3
      }));
    }
    // בקשות שמחכות לשיבוץ / תגובה
    const extra = [
      { off: 9, typeId: 'family', area: 'שרון', name: 'קרן אלמוג', notes: 'שלושה ילדים + כלב. מעדיפים חוף.', status: 'new' },
      { off: 16, typeId: 'newborn', area: 'מרכז', name: 'ליהי ועומר', notes: 'התינוקת נולדה לפני שבוע', status: 'new' },
      { off: 23, typeId: 'barmitzvah', area: 'ירושלים', name: 'משפחת ויס', notes: 'אולם בגבעת שאול, 180 איש', status: 'new' },
      { off: 12, typeId: 'maternity', area: 'צפון', name: 'גלית חורי', notes: '', status: 'declined', pid: 'p7' }
    ];
    extra.forEach(x => {
      let d = addDays(t, x.off); if (d.getDay() === 6) d = addDays(d, 1);
      state.bookings.push(mkBooking(state, {
        date: ymd(d), typeId: x.typeId, photographerId: x.pid || null, status: x.status, area: x.area, time: 'שעת זהב',
        client: { name: x.name, phone: '050-' + Math.floor(1000000 + rnd() * 8999999), email: '', notes: x.notes },
        createdAt: addDays(t, -1).toISOString(), viaStudio: !x.pid
      }));
    });
    // שלבי עריכה לצילומים שכבר בוצעו
    state.bookings.filter(b => b.status === 'done').forEach(b => {
      const age = Math.round((t - parse(b.date)) / 864e5);
      const p = P.find(x => x.id === b.photographerId);
      const first = firstPost(p);
      const order = POST.map(x => x.id).slice(POST.findIndex(x => x.id === first));
      b.post = age > (DELIVERY_DAYS[b.typeId] || 21) - 3 ? (rnd() < 0.92 ? 'delivered' : 'design') : order[Math.min(order.length - 2, Math.floor(rnd() * (order.length - 1)))];
    });
    state.bookings.sort((a, b) => a.date.localeCompare(b.date));
    return state;
  }

  function mkBooking(state, b) {
    const p = b.photographerId ? state.photographers.find(x => x.id === b.photographerId) : null;
    const price = p ? (p.prices[b.typeId] || 0) : null;
    const id = 'F-' + (++state.seq);
    const history = [{ at: b.createdAt || new Date().toISOString(), text: b.viaStudio || !p ? 'הבקשה נכנסה לסטודיו' : `הבקשה נשלחה ישירות ל${p.name}` }];
    if (b.status === 'confirmed' || b.status === 'done') history.push({ at: b.createdAt, text: 'הצלמת אישרה' });
    if (b.status === 'declined') history.push({ at: b.createdAt, text: `${p.name} דחתה — דרוש שיבוץ מחדש` });
    return Object.assign({ id, price, commissionPct: p ? pctOf(p) : null, post: null, history, createdAt: new Date().toISOString() }, b);
  }

  function pctOf(p) { return p.owner || p.payType === 'salary' ? 0 : p.commission; }
  function firstPost(p) { return p && p.scope === 'shoot' && !p.owner ? 'raw' : 'editing'; }

  /* ---------- טעינה ושמירה ---------- */
  let state;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state || !state.photographers) { state = seed(); save(); }
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { } }
  function reset() { state = seed(); save(); return state; }
  window.addEventListener('storage', e => { if (e.key === KEY) { load(); document.dispatchEvent(new CustomEvent('store:changed')); } });

  /* ---------- זמינות ---------- */
  const typeOf = id => SHOOT_TYPES.find(t => t.id === id);
  const slotsFor = typeId => (typeOf(typeId) && typeOf(typeId).fullDay ? DAY_SLOTS : 1);

  function worksOn(p, ds) {
    const ex = p.exceptions && p.exceptions[ds];
    if (ex === 'off') return false;
    if (ex === 'on') return true;
    return p.weekdays.includes(parse(ds).getDay());
  }
  function loadOn(st, pid, ds, ignoreId) {
    return st.bookings.filter(b => b.photographerId === pid && b.date === ds && BLOCKING.includes(b.status) && b.id !== ignoreId)
      .reduce((s, b) => s + slotsFor(b.typeId), 0);
  }
  function canTake(st, p, ds, typeId, ignoreId) {
    if (!p.active || !worksOn(p, ds)) return false;
    if (typeId && !p.types.includes(typeId)) return false;
    return loadOn(st, p.id, ds, ignoreId) + (typeId ? slotsFor(typeId) : 1) <= DAY_SLOTS;
  }
  /** מצב יום לצלמת: off | free | partial | full */
  function dayState(p, ds) {
    if (!worksOn(p, ds)) return 'off';
    const l = loadOn(state, p.id, ds);
    return l === 0 ? 'free' : l >= DAY_SLOTS ? 'full' : 'partial';
  }
  function isBookableDate(ds) {
    return ds >= todayStr() && parse(ds).getDay() !== 6;
  }
  function availableFor(ds, typeId, ignoreId) {
    if (!isBookableDate(ds)) return [];
    return state.photographers.filter(p => canTake(state, p, ds, typeId, ignoreId));
  }
  function nextFreeDates(p, typeId, fromDs, n = 3) {
    const out = []; let d = parse(fromDs);
    for (let i = 0; i < 90 && out.length < n; i++) {
      d = addDays(d, 1); const ds = ymd(d);
      if (isBookableDate(ds) && canTake(state, p, ds, typeId)) out.push(ds);
    }
    return out;
  }

  /* ---------- פעולות ---------- */
  const now = () => new Date().toISOString();
  const getP = id => state.photographers.find(p => p.id === id);
  const getB = id => state.bookings.find(b => b.id === id);

  function createBooking(data) {
    const p = data.photographerId ? getP(data.photographerId) : null;
    const b = mkBooking(state, Object.assign({}, data, { status: p ? 'sent' : 'new', createdAt: now() }));
    state.bookings.push(b); save(); return b;
  }
  function setStatus(id, status, note) {
    const b = getB(id); if (!b) return;
    b.status = status;
    b.history.push({ at: now(), text: note || STATUS[status].name });
    if (status === 'done' && !b.post) b.post = firstPost(getP(b.photographerId));
    save(); return b;
  }
  function assign(id, pid, note) {
    const b = getB(id), p = getP(pid); if (!b || !p) return;
    b.photographerId = pid; b.price = p.prices[b.typeId] || b.price; b.commissionPct = pctOf(p);
    b.status = 'sent';
    b.history.push({ at: now(), text: note || `שובצה ל${p.name} ונשלחה לאישור` });
    save(); return b;
  }
  function toggleDay(pid, ds) {
    const p = getP(pid); if (!p) return;
    const base = p.weekdays.includes(parse(ds).getDay());
    const cur = worksOn(p, ds);
    if (cur) { if (base) p.exceptions[ds] = 'off'; else delete p.exceptions[ds]; }
    else { if (base) delete p.exceptions[ds]; else p.exceptions[ds] = 'on'; }
    save(); return worksOn(p, ds);
  }
  function savePhotographer(p) {
    const i = state.photographers.findIndex(x => x.id === p.id);
    if (i >= 0) state.photographers[i] = p; else state.photographers.push(p);
    save(); return p;
  }
  function newPhotographerId() { return 'p' + (Date.now() % 1e7).toString(36); }

  /* ---------- עריכה ומסירה ---------- */
  const postOf = id => POST.find(x => x.id === id);
  function dueDate(b) { return ymd(addDays(parse(b.date), DELIVERY_DAYS[b.typeId] || 21)); }
  /** מי אחראית כרגע: מזהה צלמת, 'studio' (את), או null אם נמסר */
  function postOwner(b) {
    if (!b.post || b.post === 'delivered') return null;
    const p = getP(b.photographerId);
    if (!p || p.owner) return 'studio';
    if (p.scope === 'shoot') return b.post === 'raw' ? p.id : 'studio';
    return p.id;
  }
  function isLate(b) { return !!b.post && b.post !== 'delivered' && dueDate(b) < todayStr(); }
  function advancePost(id, by) {
    const b = getB(id); if (!b || !b.post) return;
    const i = POST.findIndex(x => x.id === b.post);
    if (i >= POST.length - 1) return b;
    b.post = POST[i + 1].id;
    b.history.push({ at: now(), text: `${POST[i + 1].name}${by ? ' · ' + by : ''}` });
    save(); return b;
  }

  /* ---------- כסף ---------- */
  function money(b) {
    if (!b.photographerId || !b.price) return { gross: 0, mine: 0, own: false };
    const p = getP(b.photographerId);
    if (p && p.owner) return { gross: b.price, mine: b.price, own: true };
    if (p && p.payType === 'salary') return { gross: b.price, mine: b.price, own: false, salaried: true };
    return { gross: b.price, mine: Math.round(b.price * (b.commissionPct || 0) / 100), own: false };
  }
  function monthStats(y, m) {
    const pre = `${y}-${pad(m + 1)}`;
    const list = state.bookings.filter(b => b.date.startsWith(pre) && (b.status === 'confirmed' || b.status === 'done'));
    let commission = 0, own = 0, referred = 0, volume = 0, salariedGross = 0, salariedCount = 0;
    const per = {};
    list.forEach(b => {
      const mm = money(b); volume += mm.gross;
      if (mm.own) own += mm.mine;
      else if (mm.salaried) { salariedGross += mm.gross; salariedCount++; }
      else { commission += mm.mine; referred++; }
      per[b.photographerId] = per[b.photographerId] || { count: 0, mine: 0, gross: 0 };
      per[b.photographerId].count++; per[b.photographerId].mine += mm.mine; per[b.photographerId].gross += mm.gross;
    });
    const salaries = state.photographers.filter(p => p.active && p.payType === 'salary').reduce((s, p) => s + (p.salary || 0), 0);
    return { count: list.length, commission, own, referred, volume, per, salariedGross, salariedCount, salaries, net: commission + own + salariedGross - salaries };
  }

  load();
  return {
    get state() { return state; }, load, save, reset,
    SHOOT_TYPES, AREAS, STYLES, TIMES, STATUS, BLOCKING, PAY_TYPES, SCOPES, POST,
    postOf, dueDate, postOwner, isLate, advancePost,
    ymd, parse, addDays, today, todayStr, typeOf,
    getP, getB, worksOn, dayState, canTake: (p, ds, t, ig) => canTake(state, p, ds, t, ig),
    availableFor, isBookableDate, nextFreeDates,
    createBooking, setStatus, assign, toggleDay, savePhotographer, newPhotographerId,
    money, monthStats
  };
})();
