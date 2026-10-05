/* מסך הלקוחה: הזמנה בארבעה שלבים + רשימת הצלמות */
(function () {
  const S = Store, { $, $$, esc, money, dateLong, dateMono, photo, frameNo, typeName, grease, calendar, modal, toast, waLink } = UI;
  UI.demoBar('client');

  const w = { step: 1, typeId: null, date: null, time: null, pid: null, studio: false, lockP: null, area: '', style: '', budget: null, sort: 'match', done: null };
  const wiz = $('#wizard');
  const team = () => S.state.photographers.filter(p => p.active);

  /* ---------- HERO: פילים ---------- */
  function hero() {
    const ps = team();
    $('#heroCount').textContent = ps.length;
    const marks = { 1: 'circle', 4: 'x', 6: 'check' };
    $('#heroSheet').innerHTML = `<div class="hs-strip">${ps.slice(0, 9).map((p, i) => `
      <figure class="hs-frame ${marks[i] ? 'mk-' + marks[i] : ''}" style="--d:${i * 70}ms">
        <img src="${photo(p, 360, 440)}" alt="" loading="eager">
        <figcaption class="mono">${frameNo(i)} <span>▸</span></figcaption>
        ${marks[i] === 'circle' ? grease : ''}
      </figure>`).join('')}</div>
      <p class="hs-note">← כמו שמסמנים פריים על הפילים — כאן מסמנים צלמת.</p>`;
  }

  /* ---------- ניווט שלבים ---------- */
  function canGo(step) {
    if (step >= 2 && !w.typeId) return false;
    if (step >= 3 && !w.date) return false;
    if (step >= 4 && !w.pid && !w.studio) return false;
    return true;
  }
  function go(step) {
    if (!canGo(step)) return;
    w.step = step; w.done = null; render();
    const top = $('#book').getBoundingClientRect().top + scrollY - 10;
    if (Math.abs(scrollY - top) > 200) scrollTo({ top, behavior: 'smooth' });
  }
  function stepsBar() {
    $$('#steps li').forEach(li => {
      const n = Number(li.dataset.step);
      li.className = (n === w.step && !w.done ? 'on ' : '') + (n < w.step || w.done ? 'past ' : '') + (canGo(n) ? 'reach' : '');
      li.onclick = () => !w.done && canGo(n) && go(n);
    });
  }
  function navRow(nextOk, nextLabel = 'המשך') {
    return `<div class="wz-nav">
      ${w.step > 1 ? '<button class="btn btn-ghost-l" data-act="back">→ חזרה</button>' : '<span></span>'}
      <button class="btn btn-red" data-act="next" ${nextOk ? '' : 'disabled'}>${nextLabel} ←</button></div>`;
  }
  function bindNav() {
    const b = $('[data-act=back]', wiz), n = $('[data-act=next]', wiz);
    b && (b.onclick = () => go(w.step - 1));
    n && !n.onclick && (n.onclick = () => go(w.step + 1));
  }
  function lockNote() {
    if (!w.lockP) return '';
    const p = S.getP(w.lockP);
    return `<div class="lock-note"><img src="${photo(p, 80, 80)}" alt=""><span>מזמינים את <b>${esc(p.name)}</b></span><button class="link" data-act="unlock">לראות את כל הצלמות</button></div>`;
  }
  function bindLock() { const u = $('[data-act=unlock]', wiz); u && (u.onclick = () => { w.lockP = null; if (w.pid && !w.studio) w.pid = null; render(); }); }

  function render() {
    stepsBar();
    if (w.done) return renderDone();
    [null, step1, step2, step3, step4][w.step]();
    bindNav(); bindLock();
  }

  /* ---------- שלב 1: סוג צילום ---------- */
  function step1() {
    const allowed = w.lockP ? S.getP(w.lockP).types : null;
    wiz.innerHTML = `${lockNote()}<h3 class="wz-q">מה מצלמים?</h3>
      <div class="types">${S.SHOOT_TYPES.filter(t => !allowed || allowed.includes(t.id)).map((t, i) => {
        const prices = team().filter(p => p.types.includes(t.id)).map(p => p.prices[t.id]);
        const from = w.lockP ? S.getP(w.lockP).prices[t.id] : Math.min(...prices);
        return `<button class="type ${w.typeId === t.id ? 'is-sel' : ''}" data-t="${t.id}">
          <span class="type-n mono">${frameNo(i)}</span>
          <span class="type-name">${t.name}</span>
          <span class="type-desc">${t.desc}</span>
          <span class="type-from mono">${w.lockP ? '' : 'החל מ־'}${money(from)}</span>
          ${w.typeId === t.id ? grease : ''}</button>`;
      }).join('')}</div>${navRow(!!w.typeId)}`;
    $$('.type', wiz).forEach(b => b.onclick = () => {
      w.typeId = b.dataset.t; w.budget = null;
      if (w.date && !dayOk(w.date)) w.date = null;
      go(2);
    });
  }

  /* ---------- שלב 2: תאריך ---------- */
  function dayOk(ds) {
    if (!S.isBookableDate(ds)) return false;
    if (w.lockP) return S.canTake(S.getP(w.lockP), ds, w.typeId);
    return S.availableFor(ds, w.typeId).length > 0;
  }
  function step2() {
    const t = S.typeOf(w.typeId);
    wiz.innerHTML = `${lockNote()}<h3 class="wz-q">באיזה תאריך? <small>${t.name}${t.fullDay ? ' · אירוע של יום מלא' : ''}</small></h3>
      <div class="wz-split">
        <div id="cal"></div>
        <aside class="wz-side">
          <div class="legend"><span><i class="lg lg-many"></i>הרבה פנויות</span><span><i class="lg lg-few"></i>מעט</span><span><i class="lg lg-none"></i>מלא</span></div>
          <div id="dayPeek" class="day-peek">${w.date ? '' : '<p class="muted">בחרו יום בלוח כדי לראות מי פנויה.</p>'}</div>
          <h4 class="side-h">מתי ביום?</h4>
          <div class="chips chips-dark">${S.TIMES.map(x => `<button class="chip ${w.time === x ? 'on' : ''}" data-time="${x}">${x}</button>`).join('')}</div>
        </aside>
      </div>${navRow(!!w.date)}`;
    const cal = calendar($('#cal', wiz), {
      selected: w.date, month: w.date ? S.parse(w.date) : null,
      dayInfo: ds => {
        if (S.parse(ds).getDay() === 6) return { disabled: true, cls: 'is-shabbat', html: '<span class="cal-tag">שבת</span>' };
        if (ds < S.todayStr()) return { disabled: true, cls: 'is-past' };
        if (w.lockP) {
          const ok = S.canTake(S.getP(w.lockP), ds, w.typeId);
          return ok ? { cls: 'lvl-many', html: '<span class="cal-tag">פנויה</span>' } : { disabled: true, cls: 'lvl-none', html: '<span class="cal-tag">—</span>' };
        }
        const n = S.availableFor(ds, w.typeId).length;
        if (!n) return { disabled: true, cls: 'lvl-none', html: '<span class="cal-tag">מלא</span>' };
        return { cls: n >= 3 ? 'lvl-many' : 'lvl-few', html: `<span class="cal-tag">${n} פנויות</span>` };
      },
      onPick: ds => { w.date = ds; cal.setSelected(ds); peek(); $('[data-act=next]', wiz).disabled = false; stepsBar(); }
    });
    $$('[data-time]', wiz).forEach(b => b.onclick = () => { w.time = w.time === b.dataset.time ? null : b.dataset.time; $$('[data-time]', wiz).forEach(x => x.classList.toggle('on', x.dataset.time === w.time)); });
    if (w.date) peek();
  }
  function peek() {
    const av = w.lockP ? [S.getP(w.lockP)] : S.availableFor(w.date, w.typeId);
    $('#dayPeek', wiz).innerHTML = `<p class="mono peek-date">${dateMono(w.date)}</p><p class="peek-title">${dateLong(w.date)}</p>
      <div class="peek-faces">${av.slice(0, 7).map(p => `<img src="${photo(p, 80, 80)}" alt="${esc(p.name)}" title="${esc(p.name)}">`).join('')}</div>
      <p class="muted">${w.lockP ? 'פנויה בתאריך הזה' : `${av.length} צלמות פנויות לצילום ${typeName(w.typeId)}`}</p>`;
  }

  /* ---------- שלב 3: בחירת צלמת ---------- */
  function step3() {
    const t = S.typeOf(w.typeId);
    const offer = team().filter(p => p.types.includes(w.typeId));
    const prices = offer.map(p => p.prices[w.typeId]);
    const lo = Math.min(...prices), hi = Math.max(...prices);
    if (w.budget == null) w.budget = hi;
    const avail = S.availableFor(w.date, w.typeId);
    const ok = p => avail.includes(p);
    const fits = p => (!w.area || p.areas.includes(w.area)) && (!w.style || p.styles.includes(w.style)) && p.prices[w.typeId] <= w.budget;
    let list = offer.filter(p => ok(p) && fits(p));
    if (w.lockP) list = list.filter(p => p.id === w.lockP);
    const sorters = { match: (a, b) => (b.owner ? 1 : 0) - (a.owner ? 1 : 0) || b.rating - a.rating, cheap: (a, b) => a.prices[w.typeId] - b.prices[w.typeId], rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews };
    list.sort(sorters[w.sort]);
    const busy = offer.filter(p => !ok(p) && (!w.lockP || p.id === w.lockP));
    const filteredOut = offer.filter(p => ok(p) && !fits(p)).length;

    wiz.innerHTML = `${lockNote()}<h3 class="wz-q">מי תצלם? <small>${t.name} · ${dateLong(w.date)}</small></h3>
      ${w.lockP ? '' : `<div class="filters">
        <label class="f"><span>אזור</span><select id="fArea"><option value="">כל הארץ</option>${S.AREAS.map(a => `<option ${w.area === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
        <label class="f"><span>סגנון</span><select id="fStyle"><option value="">כל הסגנונות</option>${S.STYLES.map(s => `<option value="${s.id}" ${w.style === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
        <label class="f f-range"><span>תקציב עד <b class="mono" id="bOut">${money(w.budget)}</b></span><input type="range" id="fBudget" min="${lo}" max="${hi}" step="50" value="${w.budget}"></label>
        <label class="f"><span>מיון</span><select id="fSort"><option value="match">מומלצות</option><option value="cheap" ${w.sort === 'cheap' ? 'selected' : ''}>מחיר — מהזול</option><option value="rating" ${w.sort === 'rating' ? 'selected' : ''}>דירוג</option></select></label>
      </div>`}
      <div class="results">
        ${list.map(p => card(p)).join('')}
        ${w.lockP ? '' : `<button class="frame-card studio-card ${w.studio ? 'is-sel' : ''}" data-studio="1">
          <div class="studio-inner"><span class="mono">??A</span><h4>תבחרו בשבילי</h4><p>הבקשה עוברת לצלמת הראשית, שמתאימה לכם את הצלמת הנכונה לאירוע, לאזור ולתקציב.</p><span class="btn btn-line-l btn-sm">שליחה לסטודיו</span></div>${w.studio ? grease : ''}</button>`}
      </div>
      ${!list.length ? `<p class="empty">אין צלמת פנויה שמתאימה לכל הסינונים${filteredOut ? ` — ${filteredOut} פנויות מחוץ לסינון. <button class="link" data-act="clear">ניקוי סינון</button>` : '.'}</p>` : ''}
      ${busy.length ? `<details class="busy" ${w.lockP ? 'open' : ''}><summary>${busy.length} צלמות תפוסות בתאריך הזה — תאריכים פנויים קרובים</summary>
        <ul>${busy.map(p => { const nx = S.nextFreeDates(p, w.typeId, w.date, 3); return `<li><img src="${photo(p, 60, 60)}" alt=""><b>${esc(p.name)}</b><span class="muted">${money(p.prices[w.typeId])}</span>
          <span class="nx">${nx.map(ds => `<button class="chip chip-sm" data-jump="${ds}" data-p="${p.id}">${UI.dateShort(ds)}</button>`).join('') || '<span class="muted">אין בקרוב</span>'}</span></li>`; }).join('')}</ul></details>` : ''}
      ${navRow(w.pid || w.studio)}`;

    $$('.frame-card[data-pid]', wiz).forEach(c => {
      c.onclick = e => { if (e.target.closest('[data-profile]')) return; w.pid = c.dataset.pid; w.studio = false; render(); };
      const pr = $('[data-profile]', c); pr && (pr.onclick = () => profile(S.getP(c.dataset.pid)));
    });
    const sc = $('[data-studio]', wiz); sc && (sc.onclick = () => { w.studio = true; w.pid = null; render(); });
    $$('[data-jump]', wiz).forEach(b => b.onclick = () => { w.date = b.dataset.jump; w.pid = b.dataset.p; w.studio = false; render(); toast(`התאריך עודכן ל־${dateLong(w.date)}`); });
    const cl = $('[data-act=clear]', wiz); cl && (cl.onclick = () => { w.area = ''; w.style = ''; w.budget = null; render(); });
    const on = (id, fn) => { const el = $(id, wiz); el && (el.oninput = fn); };
    on('#fArea', e => { w.area = e.target.value; render(); });
    on('#fStyle', e => { w.style = e.target.value; render(); });
    on('#fSort', e => { w.sort = e.target.value; render(); });
    const fb = $('#fBudget', wiz);
    fb && (fb.oninput = e => { $('#bOut', wiz).textContent = money(e.target.value); }, fb.onchange = e => { w.budget = Number(e.target.value); render(); });
    if (w.pid && !list.find(p => p.id === w.pid)) { w.pid = null; $('[data-act=next]', wiz).disabled = !w.studio; }
  }
  function card(p, i) {
    const idx = S.state.photographers.indexOf(p);
    const sel = w.pid === p.id;
    return `<article class="frame-card ${sel ? 'is-sel' : ''}" data-pid="${p.id}" tabindex="0">
      <div class="fc-img"><img src="${photo(p)}" alt="${esc(p.name)}" loading="lazy">${p.owner ? '<span class="fc-badge">הצלמת הראשית</span>' : ''}</div>
      <div class="fc-edge mono"><span>${frameNo(idx)}</span><span>▸</span><span>${p.rating.toFixed(1)}★</span></div>
      <div class="fc-body">
        <h4>${esc(p.name)}</h4><p class="fc-tag">${esc(p.tagline)}</p>
        <p class="fc-meta">${p.areas.slice(0, 3).join(' · ')}</p>
        <div class="fc-foot"><span class="fc-price mono">${money(p.prices[w.typeId])}</span><button class="link" data-profile>פרופיל</button></div>
      </div>${sel ? grease : ''}</article>`;
  }

  /* ---------- שלב 4: פרטים ---------- */
  function step4() {
    const p = w.pid ? S.getP(w.pid) : null;
    const c = w.client || {};
    wiz.innerHTML = `<h3 class="wz-q">כמעט שם. איך חוזרים אליכם?</h3>
      <div class="wz-split">
        <form id="det" class="det" autocomplete="on">
          <label class="fld"><span>שם מלא</span><input name="name" required value="${esc(c.name || '')}" placeholder="למשל: דנה לוי"></label>
          <label class="fld"><span>טלפון</span><input name="phone" required inputmode="tel" pattern="[0-9\\-\\s+]{9,}" value="${esc(c.phone || '')}" placeholder="050-0000000"></label>
          <label class="fld"><span>אימייל <i>(לא חובה)</i></span><input name="email" type="email" value="${esc(c.email || '')}"></label>
          <label class="fld"><span>אזור / מיקום הצילום</span><select name="area">${S.AREAS.map(a => `<option ${(w.area || (p && p.areas[0])) === a ? 'selected' : ''}>${a}</option>`).join('')}</select></label>
          <label class="fld fld-wide"><span>משהו שכדאי שהצלמת תדע?</span><textarea name="notes" rows="3" placeholder="כמה אנשים, לוקיישן, השראה…">${esc(c.notes || '')}</textarea></label>
        </form>
        <aside class="ticket">
          <p class="mono ticket-h">REQUEST · ${dateMono(w.date)}</p>
          ${p ? `<div class="ticket-p"><img src="${photo(p, 120, 120)}" alt=""><div><b>${esc(p.name)}</b><span>${esc(p.tagline)}</span></div></div>` : `<div class="ticket-p"><span class="ticket-q">?</span><div><b>הסטודיו יבחר</b><span>הצלמת הראשית תשבץ עבורכם</span></div></div>`}
          <dl>
            <div><dt>צילום</dt><dd>${typeName(w.typeId)}</dd></div>
            <div><dt>תאריך</dt><dd>${dateLong(w.date)}</dd></div>
            ${w.time ? `<div><dt>שעה</dt><dd>${w.time}</dd></div>` : ''}
            <div class="tot"><dt>מחיר</dt><dd class="mono">${p ? money(p.prices[w.typeId]) : 'יתואם'}</dd></div>
          </dl>
          <p class="ticket-fine">אין תשלום עכשיו. התאריך נשמר לכם עד אישור הצלמת (עד 24 שעות).</p>
        </aside>
      </div>${navRow(true, 'שליחת הבקשה')}`;
    const f = $('#det', wiz);
    f.oninput = () => { w.client = Object.fromEntries(new FormData(f)); };
    $('[data-act=next]', wiz).onclick = () => {
      if (!f.reportValidity()) return;
      const d = Object.fromEntries(new FormData(f));
      w.client = d;
      if (p && !S.canTake(p, w.date, w.typeId)) { toast('אופס — התאריך נתפס הרגע. בחרו צלמת אחרת.'); return go(3); }
      w.done = S.createBooking({ date: w.date, typeId: w.typeId, time: w.time, photographerId: p ? p.id : null, area: d.area, viaStudio: !p, client: { name: d.name, phone: d.phone, email: d.email, notes: d.notes } });
      render();
    };
  }

  /* ---------- סיום ---------- */
  function renderDone() {
    const b = w.done, p = b.photographerId ? S.getP(b.photographerId) : null;
    const msg = `שלום, שלחתי בקשה לצילום באתר פריים.\nמספר בקשה: ${b.id}\n${typeName(b.typeId)} · ${dateLong(b.date)}${b.time ? ' · ' + b.time : ''}\n${p ? 'צלמת: ' + p.name : 'ביקשתי שתבחרו עבורי צלמת'}\nשם: ${b.client.name}`;
    wiz.innerHTML = `<div class="done">
      <div class="print">
        <div class="print-img">${p ? `<img src="${photo(p, 500, 380)}" alt="">` : '<div class="print-blank">?</div>'}</div>
        <p class="print-cap">${esc(b.client.name)} · ${typeName(b.typeId)}<br><span class="mono">${b.id} · ${dateMono(b.date)}</span></p>
      </div>
      <div class="done-text">
        <p class="kicker mono safelight">● נשלח</p>
        <h3>הבקשה בדרך ${p ? `ל${esc(p.name)}` : 'לסטודיו'}.</h3>
        <p>${p ? `התאריך נשמר עבורכם. ${esc(p.name)} תאשר תוך 24 שעות, ותקבלו הודעה.` : 'הצלמת הראשית תעבור על הבקשה ותחזור אליכם עם הצעה לצלמת מתאימה — בדרך כלל באותו יום.'}</p>
        <p class="muted">מספר הבקשה שלכם: <b class="mono">${b.id}</b></p>
        <div class="hero-cta">
          <a class="btn btn-red" target="_blank" rel="noopener" href="${waLink(S.state.settings.studioPhone, msg)}">לשלוח גם בוואטסאפ</a>
          <button class="btn btn-ghost-l" data-act="again">בקשה חדשה</button>
        </div>
        <p class="demo-hint">בדמו: פתחו את <a href="admin.html">מסך הניהול</a>${p ? ` או את <a href="portal.html?p=${p.id}">הפורטל של ${esc(p.name)}</a>` : ''} — הבקשה כבר מחכה שם.</p>
      </div></div>`;
    $('[data-act=again]', wiz).onclick = () => { Object.assign(w, { step: 1, typeId: null, date: null, time: null, pid: null, studio: false, lockP: null, done: null, client: null, budget: null }); render(); };
  }

  /* ---------- הצלמות ---------- */
  let teamType = '';
  function renderTeam() {
    $('#teamFilter').innerHTML = `<button class="chip ${!teamType ? 'on' : ''}" data-tt="">כולן</button>` + S.SHOOT_TYPES.map(t => `<button class="chip ${teamType === t.id ? 'on' : ''}" data-tt="${t.id}">${t.name}</button>`).join('');
    $$('#teamFilter .chip').forEach(b => b.onclick = () => { teamType = b.dataset.tt; renderTeam(); });
    const ps = team().filter(p => !teamType || p.types.includes(teamType));
    $('#teamGrid').innerHTML = ps.map(p => {
      const idx = S.state.photographers.indexOf(p);
      const prices = p.types.map(t => p.prices[t]);
      return `<article class="print-card" data-pid="${p.id}" tabindex="0">
        <div class="pc-img"><img src="${photo(p)}" alt="${esc(p.name)}" loading="lazy"></div>
        <div class="pc-cap">
          <span class="mono pc-n">${frameNo(idx)}</span>
          <h3>${esc(p.name)}${p.owner ? ' <em>· הראשית</em>' : ''}</h3>
          <p>${esc(p.tagline)}</p>
          <p class="pc-meta">${p.rating.toFixed(1)}★ · ${p.years} שנים · מ־${money(teamType ? p.prices[teamType] : Math.min(...prices))}</p>
        </div></article>`;
    }).join('');
    $$('#teamGrid .print-card').forEach(c => { const open = () => profile(S.getP(c.dataset.pid)); c.onclick = open; c.onkeydown = e => e.key === 'Enter' && open(); });
  }

  function profile(p) {
    const m = modal(`<div class="profile">
      <div class="pf-img"><img src="${photo(p, 700, 880)}" alt="${esc(p.name)}"></div>
      <div class="pf-body">
        <p class="kicker mono">${p.owner ? 'הצלמת הראשית' : 'צלמת בצוות'} · ${p.years} שנות ניסיון</p>
        <h2>${esc(p.name)}</h2>
        <p class="pf-tag">${esc(p.tagline)}</p>
        <p>${esc(p.bio)}</p>
        <p class="pf-meta"><b>${p.rating.toFixed(1)}★</b> מתוך ${p.reviews} ביקורות · ${p.areas.join(', ')}</p>
        <p class="pf-meta">סגנון: ${p.styles.map(s => S.STYLES.find(x => x.id === s).name).join(' · ')}</p>
        <table class="prices">${p.types.map(t => `<tr><td>${typeName(t)}</td><td class="mono">${money(p.prices[t])}</td></tr>`).join('')}</table>
        <h4 class="side-h">ימים פנויים</h4>
        <div id="pfCal"></div>
        <button class="btn btn-red" data-book>להזמין את ${esc(p.name)}</button>
      </div></div>`, { wide: true });
    calendar($('#pfCal', m.el), {
      compact: true, dayInfo: ds => {
        if (ds < S.todayStr()) return { disabled: true, cls: 'is-past' };
        const st = S.dayState(p, ds);
        return { disabled: true, cls: 'pd-' + st };
      }
    });
    $('[data-book]', m.el).onclick = () => {
      m.close();
      Object.assign(w, { lockP: p.id, pid: p.id, studio: false, done: null });
      if (w.typeId && !p.types.includes(w.typeId)) w.typeId = null;
      if (w.date && w.typeId && !S.canTake(p, w.date, w.typeId)) w.date = null;
      go(w.typeId ? 2 : 1);
    };
  }

  document.addEventListener('store:changed', () => { hero(); renderTeam(); if (!w.done) render(); });
  hero(); render(); renderTeam();
})();
