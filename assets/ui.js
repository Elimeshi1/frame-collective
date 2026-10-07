/* רכיבי ממשק משותפים: פורמט, לוח שנה, מודאל, טוסט, סרגל דמו */
window.UI = (function () {
  const S = window.Store;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const money = n => '₪' + Number(n || 0).toLocaleString('he-IL');
  const dayNames = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  const dayFull = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  function dateLong(ds) { const d = S.parse(ds); return `יום ${dayFull[d.getDay()]}, ${d.getDate()} ב${monthNames[d.getMonth()]}`; }
  function dateShort(ds) { const d = S.parse(ds); return `${d.getDate()}.${d.getMonth() + 1}`; }
  function dateMono(ds) { const d = S.parse(ds); return `${String(d.getDate()).padStart(2, '0')}·${String(d.getMonth() + 1).padStart(2, '0')}·${String(d.getFullYear()).slice(2)}`; }
  function ago(iso) {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 2) return 'עכשיו'; if (m < 60) return `לפני ${m} דק׳`;
    const h = Math.round(m / 60); if (h < 24) return `לפני ${h} שע׳`;
    const d = Math.round(h / 24); return d === 1 ? 'אתמול' : `לפני ${d} ימים`;
  }
  const photo = (p, w = 600, h = 760) => `https://picsum.photos/seed/${encodeURIComponent(p.photo || p.id)}/${w}/${h}`;
  const frameNo = i => String(i + 1).padStart(2, '0') + 'A';
  const typeName = id => (S.typeOf(id) || {}).name || id;

  function waLink(phone, text) {
    const digits = String(phone || '').replace(/\D/g, '').replace(/^0/, '972');
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  /* ---------- סימון עיפרון שעווה ---------- */
  const grease = `<svg class="grease" viewBox="0 0 200 240" preserveAspectRatio="none" aria-hidden="true"><path d="M104 10 C 162 6, 194 52, 191 120 C 188 192, 148 231, 97 230 C 40 229, 9 186, 10 118 C 11 58, 46 14, 112 12 C 132 12, 150 19, 163 28"/></svg>`;

  /* ---------- לוח שנה ---------- */
  function calendar(el, opts) {
    const o = Object.assign({ month: null, selected: null, dayInfo: () => ({}), onPick: null, compact: false }, opts);
    let cur = o.month ? new Date(o.month) : S.today(); cur.setDate(1);
    function render() {
      const y = cur.getFullYear(), m = cur.getMonth();
      const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
      let cells = '';
      for (let i = 0; i < first.getDay(); i++) cells += '<div class="cal-cell is-blank"></div>';
      for (let d = 1; d <= days; d++) {
        const ds = S.ymd(new Date(y, m, d));
        const info = o.dayInfo(ds) || {};
        const cls = ['cal-cell', info.cls || '', ds === o.selected ? 'is-selected' : '', ds === S.todayStr() ? 'is-today' : '', info.disabled ? 'is-disabled' : ''].join(' ');
        cells += `<button type="button" class="${cls}" data-ds="${ds}" ${info.disabled ? 'disabled' : ''} ${info.title ? `title="${esc(info.title)}"` : ''}>
          <span class="cal-num">${d}</span>${info.html || ''}${ds === o.selected ? grease : ''}</button>`;
      }
      el.innerHTML = `<div class="cal ${o.compact ? 'cal--compact' : ''}">
        <div class="cal-head">
          <button type="button" class="cal-nav" data-nav="-1" aria-label="חודש קודם">→</button>
          <div class="cal-title"><span>${monthNames[m]}</span> <em>${y}</em></div>
          <button type="button" class="cal-nav" data-nav="1" aria-label="חודש הבא">←</button>
        </div>
        <div class="cal-grid">${dayNames.map(n => `<div class="cal-dow">${n}</div>`).join('')}${cells}</div></div>`;
      $$('.cal-nav', el).forEach(b => b.onclick = () => { cur.setMonth(cur.getMonth() + Number(b.dataset.nav)); render(); o.onMonth && o.onMonth(new Date(cur)); });
      $$('.cal-cell[data-ds]', el).forEach(b => b.onclick = () => { if (b.disabled) return; o.onPick && o.onPick(b.dataset.ds); });
    }
    render();
    return { render, setSelected(ds) { o.selected = ds; if (ds) { const d = S.parse(ds); cur = new Date(d.getFullYear(), d.getMonth(), 1); } render(); }, get month() { return new Date(cur); } };
  }

  /* ---------- מודאל ---------- */
  function modal(html, { wide = false, onClose } = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true"><button class="modal-x" aria-label="סגירה">✕</button><div class="modal-body">${html}</div></div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => wrap.classList.add('is-open'));
    function close() { wrap.classList.remove('is-open'); document.body.classList.remove('no-scroll'); setTimeout(() => wrap.remove(), 250); document.removeEventListener('keydown', onKey); onClose && onClose(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    $('.modal-x', wrap).onclick = close;
    return { el: $('.modal-body', wrap), close };
  }

  /* ---------- טוסט ---------- */
  function toast(msg) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  /* ---------- סרגל מצבי דמו ---------- */
  function demoBar(active) {
    const bar = document.createElement('div');
    bar.className = 'demobar';
    bar.innerHTML = `<span class="demobar-tag">דמו</span>
      <a href="index.html" class="${active === 'client' ? 'on' : ''}">מסך לקוחה</a>
      <a href="admin.html" class="${active === 'admin' ? 'on' : ''}">ניהול (את)</a>
      <a href="portal.html" class="${active === 'portal' ? 'on' : ''}">פורטל צלמת</a>`;
    document.body.prepend(bar);
    themeBar();
  }

  /* ---------- סרגל עיצובים (מעל סרגל הדמו) ---------- */
  function themeBar() {
    const T = window.Themes; if (!T) return;
    const bar = document.createElement('div');
    bar.className = 'themebar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'בחירת עיצוב לאתר');
    bar.innerHTML = `<span class="tb-tag">עיצוב <b>${T.list.length}</b></span>
      <div class="tb-list">${T.list.map((t, i) => `<button type="button" class="tb" data-theme-id="${t.id}" aria-pressed="false" style="--a:${t.sw[0]};--b:${t.sw[1]};--c:${t.sw[2]}">
        <i class="tb-sw"></i><span class="tb-n">${String(i + 1).padStart(2, '0')}</span>${esc(t.name)}</button>`).join('')}</div>`;
    document.body.prepend(bar);
    const list = $('.tb-list', bar);
    function mark(scroll) {
      $$('.tb', bar).forEach(b => {
        const on = b.dataset.themeId === T.current;
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
        if (on && scroll) list.scrollLeft += b.getBoundingClientRect().left + b.offsetWidth / 2 - (list.getBoundingClientRect().left + list.clientWidth / 2);
      });
    }
    list.addEventListener('click', e => {
      const b = e.target.closest('.tb'); if (!b || b.dataset.themeId === T.current) return;
      document.documentElement.classList.add('theme-swap');
      T.set(b.dataset.themeId); mark(true);
      setTimeout(() => document.documentElement.classList.remove('theme-swap'), 450);
      toast('עיצוב: ' + T.byId(T.current).name);
    });
    mark(true);
  }

  const statusChip = s => `<span class="chip-status st-${s}">${S.STATUS[s].short}</span>`;

  return { $, $$, esc, money, dateLong, dateShort, dateMono, ago, photo, frameNo, typeName, waLink, grease, calendar, modal, toast, demoBar, statusChip, dayNames, dayFull, monthNames };
})();
