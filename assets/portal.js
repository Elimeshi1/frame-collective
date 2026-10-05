/* פורטל הצלמת: אישור בקשות, יומן זמינות, הכנסות */
(function () {
  const S = Store, { $, $$, esc, money, dateLong, dateShort, photo, typeName, waLink, calendar, toast, monthNames } = UI;
  UI.demoBar('portal');

  const params = new URLSearchParams(location.search);
  let pid = params.get('p');
  if (!S.getP(pid)) pid = S.state.photographers.find(p => !p.owner).id;
  let month = null;

  const who = $('#who');
  who.innerHTML = '<option disabled>— דמו: צפייה בתור —</option>' + S.state.photographers.filter(p => !p.owner).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  who.value = pid;
  who.onchange = () => { pid = who.value; history.replaceState(null, '', '?p=' + pid); render(); };

  function render() {
    const p = S.getP(pid), t = S.today();
    const mine = S.state.bookings.filter(b => b.photographerId === pid);
    const pending = mine.filter(b => b.status === 'sent' && b.date >= S.todayStr()).sort((a, b) => a.date.localeCompare(b.date));
    const upcoming = mine.filter(b => b.status === 'confirmed' && b.date >= S.todayStr()).sort((a, b) => a.date.localeCompare(b.date));
    const sal = p.payType === 'salary';
    const myPost = mine.filter(b => S.postOwner(b) === pid).sort((a, b) => S.dueDate(a).localeCompare(S.dueDate(b)));
    const st = S.monthStats(t.getFullYear(), t.getMonth()).per[pid] || { count: 0, gross: 0, mine: 0 };

    $('#portal').innerHTML = `
      <div class="pt-hello"><img src="${photo(p, 200, 200)}" alt=""><div><p class="kicker mono">הפורטל שלך</p><h1>היי ${esc(p.name.split(' ')[0])}.</h1>
        <p class="muted">${pending.length ? `יש לך <b class="red">${pending.length}</b> בקשות שמחכות לתשובה.` : 'אין בקשות שמחכות לך כרגע.'}</p></div></div>
      <section class="panel pt-earn">
        <div><span>צילומים ב${monthNames[t.getMonth()]}</span><b>${st.count}</b></div>
        ${sal ? `<div><span>המשכורת החודשית שלך</span><b>${money(p.salary)}</b></div>
        <div><span>מה את עושה</span><b class="pt-scope">${S.SCOPES[p.scope]}</b></div>` : `<div><span>הכנסה ברוטו</span><b>${money(st.gross)}</b></div>
        <div><span>נטו אחרי עמלת פריים (${p.commission}%)</span><b>${money(st.gross - st.mine)}</b></div>`}
      </section>
      <div class="pt-grid">
        <div>
          <section class="panel"><h2 class="p-h">מחכות לאישור <span class="mono">${pending.length}</span></h2>
            ${pending.length ? pending.map(b => `<article class="req">
              <h3>${typeName(b.typeId)} · ${esc(b.client.name)}</h3>
              <p>${dateLong(b.date)}${b.time ? ' · ' + b.time : ''} · ${esc(b.area || '')}</p>
              ${b.client.notes ? `<p><i>“${esc(b.client.notes)}”</i></p>` : ''}
              <p class="req-money">${sal ? 'במסגרת המשכורת' : `${money(b.price)} · עמלה ${b.commissionPct}% · נטו לך ${money(b.price - Math.round(b.price * b.commissionPct / 100))}`}${p.scope === 'shoot' ? ' · צילום בלבד, העריכה בסטודיו' : ''}</p>
              <div class="req-act"><button class="btn btn-red btn-sm" data-ok="${b.id}">מאשרת ✓</button><button class="btn btn-ghost btn-sm" data-no="${b.id}">לא יכולה</button></div>
            </article>`).join('') : '<p class="muted pad">הכל נקי.</p>'}
          </section>
          <section class="panel"><h2 class="p-h">הצילומים הקרובים שלי <span class="mono">${upcoming.length}</span></h2>
            ${upcoming.length ? upcoming.map(b => `<article class="req">
              <h3>${dateShort(b.date)} · ${typeName(b.typeId)}</h3>
              <p>${esc(b.client.name)} · <a href="tel:${esc(b.client.phone)}" class="mono">${esc(b.client.phone)}</a> · ${esc(b.area || '')}${b.time ? ' · ' + b.time : ''}</p>
              <div class="req-act"><a class="btn btn-line btn-sm" target="_blank" rel="noopener" href="${waLink(b.client.phone, `היי ${b.client.name}, כאן ${p.name} מפריים 📷 רציתי לתאם איתך את הצילום ב${dateLong(b.date)}`)}">וואטסאפ ללקוח/ה</a></div>
            </article>`).join('') : '<p class="muted pad">אין צילומים מאושרים בקרוב.</p>'}
          </section>
        </div>
        <div>
        <section class="panel"><h2 class="p-h">${p.scope === 'shoot' ? 'חומרים להעביר לסטודיו' : 'עריכה ומסירה'} <span class="mono">${myPost.length}</span></h2>
          ${myPost.length ? myPost.map(b => `<article class="req">
            <h3>${esc(b.client.name)} · ${typeName(b.typeId)}</h3>
            <p>צולם ${dateShort(b.date)} · ${S.postOf(b.post).name} · <span class="${S.isLate(b) ? 'red' : ''}">${S.isLate(b) ? 'באיחור' : 'מסירה עד ' + dateShort(S.dueDate(b))}</span></p>
            <div class="req-act"><button class="btn btn-ink btn-sm" data-adv="${b.id}">${{ raw: 'העברתי את החומרים לסטודיו', editing: 'סיימתי לערוך', design: 'מסרתי ללקוחות ✓' }[b.post]}</button></div>
          </article>`).join('') : `<p class="muted pad">${p.scope === 'shoot' ? 'אין חומרים שמחכים להעברה. את רק מצלמת, ורחל אחראית על העריכה והעיצוב.' : 'אין עבודות פתוחות.'}</p>`}
        </section>
        <section class="panel">
          <h2 class="p-h">הזמינות שלי</h2>
          <div class="pt-cal">
            <p class="muted small">לחיצה על יום פותחת או חוסמת אותו. הלקוחות רואות את השינוי מיד.</p>
            <div class="legend legend-light"><span><i class="lg lg-free"></i>פנויה</span><span><i class="lg lg-full"></i>תפוסה</span><span><i class="lg lg-off"></i>לא עובדת</span></div>
            <div id="ptCal"></div>
          </div>
        </section>
        </div>
      </div>`;

    const cal = calendar($('#ptCal'), {
      month, onMonth: m => month = m,
      dayInfo: ds => {
        if (S.parse(ds).getDay() === 6) return { disabled: true, cls: 'is-shabbat' };
        if (ds < S.todayStr()) return { disabled: true, cls: 'is-past' };
        const s = S.dayState(p, ds);
        const n = mine.filter(b => b.date === ds && S.BLOCKING.includes(b.status)).length;
        return { cls: 'pd-' + s, html: `<span class="cal-tag">${{ free: 'פנויה', partial: 'חצי', full: 'מלא', off: '—' }[s]}${n ? ` · ${n}` : ''}</span>` };
      },
      onPick: ds => {
        const s = S.dayState(p, ds);
        if (s === 'full' || s === 'partial') return toast('יש לך צילום ביום הזה — לביטול פני למנהלת');
        const on = S.toggleDay(pid, ds);
        toast(on ? `${dateShort(ds)} נפתח ללקוחות` : `${dateShort(ds)} נחסם`);
        cal.render();
      }
    });

    $$('[data-adv]').forEach(b => b.onclick = () => { S.advancePost(b.dataset.adv, p.name); toast('עודכן. רחל רואה את זה אצלה'); render(); });
    $$('[data-ok]').forEach(b => b.onclick = () => { S.setStatus(b.dataset.ok, 'confirmed', `${p.name} אישרה`); toast('אישרת! הלקוח/ה והמנהלת יקבלו עדכון'); render(); });
    $$('[data-no]').forEach(b => b.onclick = () => { S.setStatus(b.dataset.no, 'declined', `${p.name} דחתה — דרוש שיבוץ מחדש`); toast('הבקשה חזרה למנהלת לשיבוץ מחדש'); render(); });
  }

  document.addEventListener('store:changed', render);
  render();
})();
