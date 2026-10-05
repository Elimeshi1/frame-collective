/* שולחן העבודה של מנהלת פריים */
(function () {
  const S = Store, { $, $$, esc, money, dateLong, dateShort, dateMono, ago, photo, typeName, waLink, calendar, modal, toast, statusChip, monthNames } = UI;
  UI.demoBar('admin');

  /* ---------- כניסה ---------- */
  const AUTH = 'frame-admin-ok';
  function enter() { $('#gate').hidden = true; $('#desk').hidden = false; boot(); }
  $('#gateForm').onsubmit = e => {
    e.preventDefault();
    if ($('#pin').value === '1234') { try { sessionStorage.setItem(AUTH, 1); } catch (er) { } enter(); }
    else { $('#pin').value = ''; $('.gate-box').classList.add('shake'); setTimeout(() => $('.gate-box').classList.remove('shake'), 400); }
  };

  let view = 'desk', inboxFilter = 'open', q = '', calMonth = null;
  const main = $('#main');
  const owner = () => S.state.photographers.find(p => p.owner);
  const B = () => S.state.bookings;
  const P = () => S.state.photographers;
  const postWho = b => { const o = S.postOwner(b); return o === 'studio' ? 'אצלך' : o ? 'אצל ' + pName(o).split(' ')[0] : ''; };
  const payLabel = p => p.owner ? 'את' : p.payType === 'salary' ? `משכורת ${money(p.salary)}` : `${p.commission}% עמלה`;
  const scopeLabel = p => p.owner || p.scope === 'full' ? 'תהליך מלא' : 'צילום בלבד';
  const pName = id => id ? (S.getP(id) || {}).name || '—' : 'לא שובצה';
  const needsAction = b => S.isLate(b) || b.status === 'new' || b.status === 'declined' || (b.status === 'sent' && (Date.now() - new Date(b.history[b.history.length - 1].at)) > 864e5 && b.date >= S.todayStr());

  function boot() {
    const me = owner();
    $('#meImg').src = photo(me, 80, 80); $('#meName').textContent = me.name;
    $$('#nav button').forEach(b => b.onclick = () => show(b.dataset.view));
    const h = location.hash.slice(1); show(['desk', 'inbox', 'cal', 'post', 'team', 'money', 'settings'].includes(h) ? h : 'desk');
    document.addEventListener('store:changed', () => { show(view); toast('התקבל עדכון חדש'); });
  }
  function show(v) {
    view = v; history.replaceState(null, '', '#' + v);
    $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
    const on = $('#nav button.on'); if (on && innerWidth < 860) on.scrollIntoView({ inline: 'center', block: 'nearest' });
    const n = B().filter(needsAction).length; $('#badge').textContent = n || ''; $('#badge').hidden = !n;
    ({ desk, inbox, cal, post, team, money: moneyView, settings })[v]();
    const mineLate = B().filter(b => S.postOwner(b) === 'studio').length; $('#badgePost').textContent = mineLate || ''; $('#badgePost').hidden = !mineLate;
    main.scrollTop = 0;
  }
  const head = (k, title, extra = '') => `<header class="m-head"><div><p class="kicker mono">${k}</p><h1>${title}</h1></div>${extra}</header>`;

  /* ---------- לוח בקרה ---------- */
  function desk() {
    const t = S.today(), st = S.monthStats(t.getFullYear(), t.getMonth());
    const prev = S.monthStats(t.getMonth() ? t.getFullYear() : t.getFullYear() - 1, (t.getMonth() + 11) % 12);
    const todo = B().filter(needsAction).sort((a, b) => a.date.localeCompare(b.date));
    const week = B().filter(b => ['confirmed', 'sent'].includes(b.status) && b.date >= S.todayStr() && b.date <= S.ymd(S.addDays(t, 7))).sort((a, b) => a.date.localeCompare(b.date));
    const freeToday = S.availableFor(S.todayStr()).length;
    const hello = t.getHours() < 12 ? 'בוקר טוב' : t.getHours() < 18 ? 'צהריים טובים' : 'ערב טוב';
    const delta = prev.commission ? Math.round((st.commission - prev.commission) / prev.commission * 100) : 0;

    main.innerHTML = head(`${dateMono(S.todayStr())} · ${monthNames[t.getMonth()]}`, `${hello}, ${esc(owner().name.split(' ')[0])}.`) + `
      <section class="kpis">
        <div class="kpi kpi-hero"><span>הרווח שלך · ${monthNames[t.getMonth()]}</span><b class="mono">${money(st.net)}</b><small>עמלות + צלמות בשכר + הצילומים שלך, אחרי משכורות</small></div>
        <div class="kpi"><span>עמלות מצלמות באחוזים</span><b class="mono">${money(st.commission)}</b><small>${st.referred} צילומים · ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}% מהחודש שעבר</small></div>
        <div class="kpi"><span>צלמות בשכר</span><b class="mono ${st.salariedGross - st.salaries < 0 ? 'red' : ''}">${money(st.salariedGross - st.salaries)}</b><small>${st.salariedCount} צילומים ${money(st.salariedGross)} − משכורות ${money(st.salaries)}</small></div>
        <div class="kpi ${todo.length ? 'kpi-alert' : ''}"><span>דורש טיפול</span><b class="mono">${todo.length}</b><small>${freeToday} צלמות פנויות היום</small></div>
      </section>
      <div class="desk-grid">
        <section class="panel">
          <h2 class="p-h">דורש טיפול <span class="mono">${todo.length}</span></h2>
          ${todo.length ? `<ul class="rows">${todo.map(row).join('')}</ul>` : '<p class="muted pad">הכל מטופל. ☕</p>'}
        </section>
        <section class="panel">
          <h2 class="p-h">השבוע הקרוב <span class="mono">${week.length}</span></h2>
          ${week.length ? `<ul class="rows">${week.map(row).join('')}</ul>` : '<p class="muted pad">אין צילומים השבוע.</p>'}
        </section>
      </div>
      <section class="panel insight">
        <p class="mono kicker">לפני פריים</p>
        <p>החודש הפנית <b>${st.referred + st.salariedCount}</b> לקוחות לצלמות אחרות. פעם זה היה שווה <b>₪0</b>. עכשיו זה <b class="red">${money(st.net - st.own)}</b> — בלי לצלם פריים אחד.</p>
      </section>`;
    bindRows();
  }

  function row(b) {
    const p = b.photographerId ? S.getP(b.photographerId) : null;
    const why = b.status === 'new' ? 'ממתינה לשיבוץ' : b.status === 'declined' ? 'צריך צלמת חלופית' : b.status === 'sent' && needsAction(b) ? 'אין תשובה מעל יממה' : S.isLate(b) ? `${S.postOf(b.post).short} באיחור · ${postWho(b)}` : '';
    return `<li class="r" data-b="${b.id}">
      <span class="r-date"><b class="mono">${dateShort(b.date)}</b><small>${UI.dayNames[S.parse(b.date).getDay()]}</small></span>
      <span class="r-main"><b>${esc(b.client.name)}</b> · ${typeName(b.typeId)}<small>${p ? `<i class="dot" style="--c:${p.color}"></i>${esc(p.name)}` : '<i class="dot dot-empty"></i>לא שובצה'} · ${esc(b.area || '')}${why ? ` · <em>${why}</em>` : ''}</small></span>
      ${statusChip(b.status)}
    </li>`;
  }
  function bindRows(root = main) { $$('[data-b]', root).forEach(r => r.onclick = () => openBooking(r.dataset.b)); }

  /* ---------- בקשות ---------- */
  function inbox() {
    const groups = {
      open: { name: 'פתוחות', f: b => ['new', 'sent', 'declined'].includes(b.status) && b.date >= S.todayStr() },
      action: { name: 'דורש טיפול', f: needsAction },
      confirmed: { name: 'מאושרות', f: b => b.status === 'confirmed' },
      done: { name: 'בוצעו', f: b => b.status === 'done' },
      all: { name: 'הכל', f: () => true }
    };
    const query = b => !q || [b.id, b.client.name, b.client.phone, pName(b.photographerId), typeName(b.typeId)].join(' ').includes(q);
    const list = B().filter(groups[inboxFilter].f).filter(query).sort((a, b) => inboxFilter === 'done' || inboxFilter === 'all' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    main.innerHTML = head('INBOX', 'בקשות', `<input class="search" id="q" placeholder="חיפוש לפי שם, טלפון, מספר…" value="${esc(q)}">`) + `
      <div class="tabs">${Object.entries(groups).map(([k, g]) => `<button class="${k === inboxFilter ? 'on' : ''}" data-g="${k}">${g.name} <span class="mono">${B().filter(g.f).length}</span></button>`).join('')}</div>
      <section class="panel">${list.length ? `<ul class="rows rows-full">${list.map(row).join('')}</ul>` : '<p class="muted pad">אין בקשות כאן.</p>'}</section>`;
    $$('[data-g]').forEach(b => b.onclick = () => { inboxFilter = b.dataset.g; inbox(); });
    const qi = $('#q'); qi.oninput = () => { q = qi.value.trim(); const pos = qi.selectionStart; inbox(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); };
    bindRows();
  }

  function openBooking(id) {
    const b = S.getB(id); if (!b) return;
    const p = b.photographerId ? S.getP(b.photographerId) : null;
    const mm = S.money(b);
    const avail = S.availableFor(b.date, b.typeId, b.id).filter(x => !p || x.id !== p.id);
    const canReassign = b.date >= S.todayStr() && !['done', 'cancelled'].includes(b.status);
    const pMsg = x => `היי ${x.name.split(' ')[0]}, יש לי בשבילך צילום דרך פריים 📷\n${typeName(b.typeId)} · ${dateLong(b.date)}${b.time ? ' · ' + b.time : ''}\nאזור: ${b.area}\nלקוח/ה: ${b.client.name}\n${b.client.notes ? 'הערות: ' + b.client.notes + '\n' : ''}מחיר: ${money(x.prices[b.typeId])}\nאפשר לאשר בפורטל: ${location.origin}${location.pathname.replace('admin.html', '')}portal.html?p=${x.id}`;
    const m = modal(`<div class="bk">
      <header class="bk-head">
        <p class="mono kicker">${b.id} · נוצרה ${ago(b.createdAt)}${b.viaStudio ? ' · דרך הסטודיו' : ''}</p>
        <h2>${esc(b.client.name)}</h2>
        <p class="bk-sub">${typeName(b.typeId)} · ${dateLong(b.date)}${b.time ? ' · ' + b.time : ''} · ${esc(b.area || '')}</p>
        ${statusChip(b.status)}
      </header>
      <div class="bk-grid">
        <section>
          <h4 class="side-h">לקוח/ה</h4>
          <p class="bk-line"><span>טלפון</span><a href="tel:${esc(b.client.phone)}" class="mono">${esc(b.client.phone)}</a></p>
          ${b.client.email ? `<p class="bk-line"><span>אימייל</span><span>${esc(b.client.email)}</span></p>` : ''}
          ${b.client.notes ? `<p class="bk-notes">“${esc(b.client.notes)}”</p>` : ''}
          <a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${waLink(b.client.phone, `היי ${b.client.name}, כאן ${owner().name} מפריים, לגבי בקשת הצילום שלך (${b.id})`)}">וואטסאפ ללקוח/ה</a>
          <h4 class="side-h">היסטוריה</h4>
          <ol class="hist">${b.history.slice().reverse().map(h => `<li><span class="mono">${ago(h.at)}</span>${esc(h.text)}</li>`).join('')}</ol>
        </section>
        <section>
          <h4 class="side-h">צלמת</h4>
          ${p ? `<div class="bk-p"><img src="${photo(p, 100, 100)}" alt=""><div><b>${esc(p.name)}</b><span>${money(b.price)}${mm.own ? ' · הצילום שלך' : mm.salaried ? ' · צלמת בשכר — כל ההכנסה שלך' : ` · עמלה ${b.commissionPct}% = <b class="red">${money(mm.mine)}</b>`}<br><small>${scopeLabel(p)}</small></span></div></div>` : '<p class="muted">עדיין לא שובצה צלמת.</p>'}
          ${b.post ? `<h4 class="side-h">עריכה ומסירה</h4>${postTrack(b)}
            <p class="small ${S.isLate(b) ? 'red' : 'muted'}">${b.post === 'delivered' ? 'נמסר ללקוחות' : `${postWho(b)} · מסירה עד ${dateShort(S.dueDate(b))}${S.isLate(b) ? ' — באיחור' : ''}`}</p>
            ${b.post !== 'delivered' ? `<button class="btn btn-ink btn-sm" data-adv>${nextPostLabel(b)}</button>` : ''}` : ''}
          <div class="bk-actions">
            ${p && b.status === 'sent' ? `<button class="btn btn-ink btn-sm" data-st="confirmed">סימון כמאושרת</button>` : ''}
            ${p && b.status === 'sent' ? `<a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${waLink(p.phone, pMsg(p))}">תזכורת לצלמת</a>` : ''}
            ${b.status === 'confirmed' && b.date <= S.todayStr() ? `<button class="btn btn-ink btn-sm" data-st="done">סימון כבוצעה</button>` : ''}
            ${!['cancelled', 'done'].includes(b.status) ? `<button class="btn btn-ghost btn-sm" data-st="cancelled">ביטול בקשה</button>` : ''}
          </div>
          ${canReassign ? `<h4 class="side-h">${p && b.status !== 'declined' ? 'העברה לצלמת אחרת' : 'שיבוץ'} · פנויות ב־${dateShort(b.date)}</h4>
            ${avail.length ? `<ul class="assign">${avail.sort((a, c) => (a.owner ? 1 : 0) - (c.owner ? 1 : 0) || (c.areas.includes(b.area) ? 1 : 0) - (a.areas.includes(b.area) ? 1 : 0)).map(x => `
              <li><img src="${photo(x, 60, 60)}" alt=""><span><b>${esc(x.name)}</b><small>${x.areas.includes(b.area) ? '✓ ' + esc(b.area) : esc(x.areas[0])} · ${money(x.prices[b.typeId])}${x.owner ? ' · את' : x.payType === 'salary' ? ' · בשכר' : ` · עמלה ${money(Math.round(x.prices[b.typeId] * x.commission / 100))}`} · ${scopeLabel(x)}</small></span>
              <button class="btn btn-red btn-sm" data-assign="${x.id}">שיבוץ</button></li>`).join('')}</ul>` : '<p class="muted">אף צלמת לא פנויה בתאריך הזה לסוג הצילום הזה.</p>'}` : ''}
        </section>
      </div></div>`, { wide: true });
    const adv = $('[data-adv]', m.el); adv && (adv.onclick = () => { S.advancePost(b.id, 'עודכן על ידך'); m.close(); toast(`${b.id}: ${S.postOf(S.getB(b.id).post).name}`); show(view); });
    $$('[data-st]', m.el).forEach(x => x.onclick = () => { S.setStatus(b.id, x.dataset.st); m.close(); toast(`${b.id}: ${S.STATUS[x.dataset.st].name}`); show(view); });
    $$('[data-assign]', m.el).forEach(x => x.onclick = () => {
      const np = S.getP(x.dataset.assign);
      S.assign(b.id, np.id);
      m.close(); show(view);
      const m2 = modal(`<div class="sent-note"><p class="kicker mono safelight">● שובץ</p><h2>הבקשה נשלחה ל${esc(np.name)}</h2>
        <p>היא תראה אותה בפורטל שלה. רוצה לשלוח לה גם הודעה?</p>
        <div class="hero-cta"><a class="btn btn-red" target="_blank" rel="noopener" href="${waLink(np.phone, pMsg(np))}">שליחה בוואטסאפ</a><a class="btn btn-line" href="portal.html?p=${np.id}">לפורטל שלה (דמו)</a></div></div>`);
    });
  }

  /* ---------- יומן ---------- */
  function cal() {
    main.innerHTML = head('SCHEDULE', 'היומן המשותף') + `
      <div class="legend legend-light">${P().filter(p => p.active).map(p => `<span><i class="dot" style="--c:${p.color}"></i>${esc(p.name.split(' ')[0])}</span>`).join('')}</div>
      <section class="panel cal-big" id="bigCal"></section>`;
    const c = calendar($('#bigCal'), {
      month: calMonth,
      onMonth: mth => calMonth = mth,
      dayInfo: ds => {
        const day = B().filter(b => b.date === ds && ['new', 'sent', 'confirmed', 'done', 'declined'].includes(b.status));
        const free = S.isBookableDate(ds) ? S.availableFor(ds).length : 0;
        const shab = S.parse(ds).getDay() === 6;
        return {
          cls: shab ? 'is-shabbat' : ds < S.todayStr() ? 'is-pastday' : '',
          html: `<span class="cd-list">${day.slice(0, 4).map(b => { const p = S.getP(b.photographerId); return `<span class="cd-b st-${b.status}" style="--c:${p ? p.color : '#999'}">${p ? esc(p.name.split(' ')[0]) : '?'} · ${typeName(b.typeId).split(' ')[0]}</span>`; }).join('')}${day.length > 4 ? `<span class="cd-more">+${day.length - 4}</span>` : ''}</span>
            ${!shab && ds >= S.todayStr() ? `<span class="cd-free">${free} פנויות</span>` : ''}`
        };
      },
      onPick: ds => openDay(ds, () => c.render())
    });
  }
  function openDay(ds, after) {
    const draw = () => {
      const day = B().filter(b => b.date === ds && !['cancelled'].includes(b.status));
      return `<p class="kicker mono">${dateMono(ds)}</p><h2 class="day-h">${dateLong(ds)}</h2>
        ${day.length ? `<h4 class="side-h">צילומים ביום הזה</h4><ul class="rows">${day.map(row).join('')}</ul>` : ''}
        <h4 class="side-h">מצב הצלמות · לחיצה משנה זמינות</h4>
        <ul class="daylist">${P().filter(p => p.active).map(p => {
          const s = S.dayState(p, ds);
          const lbl = { free: 'פנויה', partial: 'חצי יום תפוס', full: 'תפוסה', off: 'לא עובדת' }[s];
          return `<li class="ds-${s}"><i class="dot" style="--c:${p.color}"></i><b>${esc(p.name)}</b><span class="mono">${lbl}</span>
            ${s === 'full' || s === 'partial' ? '' : `<button class="btn btn-sm ${s === 'off' ? 'btn-line' : 'btn-ghost'}" data-tog="${p.id}">${s === 'off' ? 'לפתוח יום' : 'לחסום יום'}</button>`}</li>`;
        }).join('')}</ul>`;
    };
    const m = modal(draw());
    const bind = () => {
      $$('[data-tog]', m.el).forEach(x => x.onclick = () => { S.toggleDay(x.dataset.tog, ds); m.el.innerHTML = draw(); bind(); after(); });
      $$('[data-b]', m.el).forEach(r => r.onclick = () => { m.close(); openBooking(r.dataset.b); });
    };
    bind();
  }

  /* ---------- צלמות ---------- */
  function team() {
    const t = S.today(), st = S.monthStats(t.getFullYear(), t.getMonth());
    main.innerHTML = head('ROSTER', 'הצלמות', '<button class="btn btn-red" id="addP">+ צלמת חדשה</button>') + `
      <section class="roster">${P().map(p => {
        const s = st.per[p.id] || { count: 0, mine: 0 };
        const pending = B().filter(b => b.photographerId === p.id && b.status === 'sent').length;
        const next14 = Array.from({ length: 14 }, (_, i) => S.ymd(S.addDays(t, i)));
        return `<article class="ro ${p.active ? '' : 'is-off'}" data-p="${p.id}">
          <img src="${photo(p, 200, 240)}" alt="">
          <div class="ro-body">
            <h3><i class="dot" style="--c:${p.color}"></i>${esc(p.name)}${p.owner ? ' <em>· את</em>' : ''}${p.active ? '' : ' <em>· מושהית</em>'}</h3>
            <p class="muted">${p.areas.join(' · ')}</p>
            <p class="ro-types">${p.types.map(typeName).join(' · ')}</p>
            <p class="ro-tags"><span class="tag ${p.payType === 'salary' ? 'tag-salary' : ''}">${payLabel(p)}</span><span class="tag ${p.scope === 'shoot' && !p.owner ? 'tag-shoot' : ''}">${scopeLabel(p)}</span></p>
            <div class="strip14" title="14 הימים הקרובים">${next14.map(ds => `<i class="pd-${S.parse(ds).getDay() === 6 ? 'off' : S.dayState(p, ds)}" title="${dateShort(ds)}"></i>`).join('')}</div>
            <p class="ro-stats mono">${s.count} החודש · ${p.owner ? `הכנסה ${money(s.mine)}` : p.payType === 'salary' ? `הכניסה ${money(s.gross || 0)} מול משכורת ${money(p.salary)}` : `עמלה ${money(s.mine)}`}${pending ? ` · <span class="red">${pending} ממתינות</span>` : ''}</p>
          </div>
          <div class="ro-act"><button class="btn btn-line btn-sm" data-edit="${p.id}">עריכה</button>${p.owner ? '' : `<a class="btn btn-ghost btn-sm" href="portal.html?p=${p.id}">פורטל</a>`}</div>
        </article>`;
      }).join('')}</section>`;
    $$('[data-edit]').forEach(b => b.onclick = () => editP(S.getP(b.dataset.edit)));
    $('#addP').onclick = () => editP(null);
  }
  function editP(p) {
    const isNew = !p;
    p = p ? JSON.parse(JSON.stringify(p)) : { id: S.newPhotographerId(), name: '', tagline: '', areas: [], types: [], styles: ['natural'], weekdays: [0, 1, 2, 3, 4], commission: 15, payType: 'commission', salary: 0, scope: 'full', rating: 5, reviews: 0, years: 1, color: '#' + Math.floor(0x404040 + Math.random() * 0x8f8f8f).toString(16).slice(0, 6), photo: 'new-' + Date.now(), bio: '', prices: {}, exceptions: {}, phone: '', active: true };
    const m = modal(`<form class="pe" id="pe">
      <p class="kicker mono">${isNew ? 'NEW' : p.id}</p><h2>${isNew ? 'צלמת חדשה' : esc(p.name)}</h2>
      <div class="pe-grid">
        <label class="fld"><span>שם</span><input name="name" required value="${esc(p.name)}"></label>
        <label class="fld"><span>טלפון</span><input name="phone" value="${esc(p.phone)}"></label>
        <label class="fld fld-wide"><span>שורת תיאור</span><input name="tagline" value="${esc(p.tagline)}"></label>
        ${p.owner ? '' : `<div class="fld fld-wide"><span>מודל העסקה</span>
          <div class="seg">${Object.entries(S.PAY_TYPES).map(([k, v]) => `<label class="chk"><input type="radio" name="payType" value="${k}" ${p.payType === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
        <label class="fld" data-pay="commission"><span>אחוז עמלה שלך (%)</span><input name="commission" type="number" min="0" max="60" value="${p.commission}"></label>
        <label class="fld" data-pay="salary"><span>משכורת חודשית (₪)</span><input name="salary" type="number" min="0" step="100" value="${p.salary || 5000}"></label>
        <div class="fld fld-wide"><span>מה היא עושה</span>
          <div class="seg">${Object.entries(S.SCOPES).map(([k, v]) => `<label class="chk"><input type="radio" name="scope" value="${k}" ${p.scope === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>`}
        <label class="fld"><span>צבע ביומן</span><input name="color" type="color" value="${p.color}"></label>
      </div>
      <h4 class="side-h">ימי עבודה קבועים</h4>
      <div class="chips">${UI.dayFull.slice(0, 6).map((d, i) => `<label class="chk"><input type="checkbox" name="wd" value="${i}" ${p.weekdays.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</div>
      <h4 class="side-h">אזורים</h4>
      <div class="chips">${S.AREAS.map(a => `<label class="chk"><input type="checkbox" name="area" value="${a}" ${p.areas.includes(a) ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div>
      <h4 class="side-h">סגנון</h4>
      <div class="chips">${S.STYLES.map(s => `<label class="chk"><input type="checkbox" name="style" value="${s.id}" ${p.styles.includes(s.id) ? 'checked' : ''}><span>${s.name}</span></label>`).join('')}</div>
      <h4 class="side-h">סוגי צילום ומחירון</h4>
      <div class="pe-prices">${S.SHOOT_TYPES.map(t => `<label class="pp ${p.types.includes(t.id) ? 'on' : ''}"><input type="checkbox" name="type" value="${t.id}" ${p.types.includes(t.id) ? 'checked' : ''}><span>${t.name}</span><input type="number" name="price_${t.id}" step="50" min="0" value="${p.prices[t.id] || Math.round(t.base * .7 / 50) * 50}"></label>`).join('')}</div>
      <label class="chk chk-big"><input type="checkbox" name="active" ${p.active ? 'checked' : ''}><span>פעילה — מופיעה ללקוחות</span></label>
      <div class="wz-nav"><button type="button" class="btn btn-ghost" data-x>ביטול</button><button class="btn btn-red">שמירה</button></div>
    </form>`, { wide: true });
    const f = $('#pe', m.el);
    const syncPay = () => { const v = (f.querySelector('[name=payType]:checked') || {}).value; $$('[data-pay]', f).forEach(x => x.hidden = x.dataset.pay !== v); };
    $$('[name=payType]', f).forEach(r => r.onchange = syncPay); syncPay();
    $$('.pp input[type=checkbox]', f).forEach(c => c.onchange = () => c.closest('.pp').classList.toggle('on', c.checked));
    $('[data-x]', f).onclick = m.close;
    f.onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(f);
      Object.assign(p, {
        name: fd.get('name').trim(), phone: fd.get('phone'), tagline: fd.get('tagline'), color: fd.get('color'),
        commission: p.owner ? 0 : Number(fd.get('commission')) || 0,
        payType: p.owner ? 'commission' : fd.get('payType') || 'commission', salary: Number(fd.get('salary')) || 0,
        scope: p.owner ? 'full' : fd.get('scope') || 'full',
        weekdays: fd.getAll('wd').map(Number), areas: fd.getAll('area'), styles: fd.getAll('style'), types: fd.getAll('type'),
        active: !!fd.get('active')
      });
      if (!p.types.length) return toast('צריך לבחור לפחות סוג צילום אחד');
      p.prices = {}; p.types.forEach(t => p.prices[t] = Number(fd.get('price_' + t)) || 0);
      if (!p.bio) p.bio = p.tagline;
      S.savePhotographer(p); m.close(); toast('נשמר'); team();
    };
  }

  /* ---------- עמלות ---------- */
  function moneyView() {
    const t = S.today();
    const months = [-1, 0, 1].map(o => { const d = new Date(t.getFullYear(), t.getMonth() + o, 1); return { d, s: S.monthStats(d.getFullYear(), d.getMonth()) }; });
    const max = Math.max(...months.map(x => x.s.commission + x.s.own + x.s.salariedGross), 1);
    const cur = months[1].s;
    const rows = P().filter(p => !p.owner).map(p => {
      const s = cur.per[p.id] || { count: 0, mine: 0, gross: 0 };
      const net = p.payType === 'salary' ? s.gross - (p.active ? p.salary : 0) : s.mine;
      return { p, s, net };
    }).sort((a, b) => b.net - a.net);
    const topNet = Math.max(...rows.map(r => Math.abs(r.net)), 1);
    main.innerHTML = head('LEDGER', 'הכנסות, עמלות ומשכורות') + `
      <section class="panel">
        <h2 class="p-h">שלושה חודשים · הרווח נטו מתחת לכל עמודה</h2>
        <div class="bars">${months.map(({ d, s }) => `<div class="bar-col">
          <div class="bar-stack" style="--h:${(s.commission + s.own + s.salariedGross) / max * 100}%">
            <span class="bar-own" style="flex:${s.own}"></span><span class="bar-sal" style="flex:${s.salariedGross}"></span><span class="bar-com" style="flex:${s.commission}"></span></div>
          <b class="mono">${money(s.net)}</b><span>${monthNames[d.getMonth()]}${d.getMonth() === t.getMonth() ? ' · עכשיו' : ''}</span></div>`).join('')}</div>
        <div class="legend legend-light"><span><i class="lg" style="background:var(--red)"></i>עמלות</span><span><i class="lg" style="background:var(--amber)"></i>צילומים של צלמות בשכר</span><span><i class="lg" style="background:var(--ink)"></i>הצילומים שלך</span><span>נטו = אחרי משכורות</span></div>
      </section>
      <section class="panel">
        <h2 class="p-h">לפי צלמת · ${monthNames[t.getMonth()]}</h2>
        <table class="ledger"><thead><tr><th>צלמת</th><th>מודל</th><th>צילומים</th><th>מחזור</th><th>נשאר לך</th><th></th></tr></thead><tbody>
        ${rows.map(({ p, s, net }) => `<tr><td><i class="dot" style="--c:${p.color}"></i>${esc(p.name)}</td><td>${payLabel(p)}</td><td class="mono">${s.count}</td><td class="mono">${money(s.gross)}</td><td class="mono"><b class="${net < 0 ? 'red' : ''}">${money(net)}</b></td><td class="lbar"><i class="${net < 0 ? 'neg' : ''}" style="width:${Math.abs(net) / topNet * 100}%"></i></td></tr>`).join('')}
        </tbody><tfoot><tr><td>סה״כ</td><td></td><td class="mono">${cur.referred + cur.salariedCount}</td><td></td><td class="mono"><b class="red">${money(cur.net - cur.own)}</b></td><td></td></tr></tfoot></table>
        <p class="muted small">צלמת באחוזים: הלקוחות משלמות לה ואת מקבלת עמלה. צלמת בשכר: כל ההכנסה מהצילומים שלה אצלך, ומשכורת החודש יורדת ממנה. הכל מחושב על צילומים מאושרים ושבוצעו, לפי תאריך הצילום.</p>
      </section>`;
  }

  /* ---------- עריכה ומסירה ---------- */
  const postTrack = b => { const i = S.POST.findIndex(x => x.id === b.post); return `<ol class="ptrack">${S.POST.map((x, k) => `<li class="${k < i ? 'past' : k === i ? 'on' : ''}">${x.short}</li>`).join('')}</ol>`; };
  const nextPostLabel = b => ({ raw: 'החומרים התקבלו ←', editing: 'העריכה הסתיימה ←', design: 'נמסר ללקוחות ✓' })[b.post];
  let postMine = false;
  function post() {
    const list = B().filter(b => b.post && (!postMine || S.postOwner(b) === 'studio'));
    const recent = d => d >= S.ymd(S.addDays(S.today(), -30));
    main.innerHTML = head('POST', 'עריכה ומסירה', `<label class="chk"><input type="checkbox" id="pm" ${postMine ? 'checked' : ''}><span>רק מה שאצלי</span></label>`) + `
      <p class="muted post-intro">צלמות בתהליך מלא עורכות ומעצבות לבד, ואת רק עוקבת. צלמות שרק מצלמות מעבירות לך חומרים, והעריכה והעיצוב עוברים אלייך.</p>
      <div class="kanban">${S.POST.map(col => {
        const items = list.filter(b => b.post === col.id && (col.id !== 'delivered' || recent(b.date))).sort((a, b) => S.dueDate(a).localeCompare(S.dueDate(b)));
        return `<section class="kcol"><h2 class="p-h">${col.name} <span class="mono">${items.length}</span></h2>
          ${items.map(b => { const p = S.getP(b.photographerId); const late = S.isLate(b); const who = S.postOwner(b);
            return `<article class="kcard ${late ? 'is-late' : ''} ${who === 'studio' ? 'is-mine' : ''}" data-b="${b.id}">
              <b>${esc(b.client.name)}</b><span>${typeName(b.typeId)} · צולם ${dateShort(b.date)}</span>
              <span><i class="dot" style="--c:${p ? p.color : '#999'}"></i>${p ? esc(p.name) : ''} · ${p ? scopeLabel(p) : ''}</span>
              ${col.id === 'delivered' ? '' : `<span class="kc-foot"><em>${postWho(b)}</em><span class="mono">${late ? 'באיחור' : 'עד ' + dateShort(S.dueDate(b))}</span></span>`}
            </article>`; }).join('') || '<p class="muted pad small">ריק</p>'}
        </section>`;
      }).join('')}</div>`;
    $('#pm').onchange = e => { postMine = e.target.checked; post(); };
    bindRows();
  }

  /* ---------- הגדרות ---------- */
  function settings() {
    const s = S.state.settings;
    main.innerHTML = head('SETTINGS', 'הגדרות') + `
      <section class="panel pad">
        <form id="setf" class="pe-grid">
          <label class="fld"><span>שם הסטודיו</span><input name="studioName" value="${esc(s.studioName)}"></label>
          <label class="fld"><span>הוואטסאפ שלך (לקבלת בקשות)</span><input name="studioPhone" value="${esc(s.studioPhone)}"></label>
          <div><button class="btn btn-ink">שמירה</button></div>
        </form>
      </section>
      <section class="panel pad">
        <h2 class="p-h">נתוני הדמו</h2>
        <p class="muted">כל הנתונים באתר הזה הם לדוגמה ונשמרים רק בדפדפן הזה. איפוס מחזיר את הצלמות והבקשות לדוגמה.</p>
        <button class="btn btn-line" id="rst">איפוס נתוני דמו</button>
      </section>`;
    $('#setf').onsubmit = e => { e.preventDefault(); Object.assign(s, Object.fromEntries(new FormData(e.target))); S.save(); toast('נשמר'); };
    $('#rst').onclick = () => { S.reset(); toast('הנתונים אופסו'); show('desk'); };
  }

  /* כניסה אוטומטית אם כבר הוזן קוד בלשונית הזו */
  try { if (sessionStorage.getItem(AUTH)) enter(); } catch (e) { }
})();
