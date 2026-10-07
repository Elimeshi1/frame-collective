/* מבנים לכל עיצוב: כל עיצוב בונה את אזור הפתיחה של העמוד הראשי עם אלמנטים משלו
   (מצלמת פולרואיד, שער מגזין, גלגל View-Master, מסך קולנוע, הזמנה לחתונה,
   שרטוט טכני, תא צילום, מכתב כופר, תצוגה מתחלפת ואלבום עתיק).
   חדר חושך נשאר עם רצועת הפילים המקורית שב־index.html. */
window.Layouts = (function () {
  const timers = [];
  const every = (ms, fn) => timers.push(setInterval(fn, ms));
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  function stop() { while (timers.length) { const t = timers.pop(); clearInterval(t); clearTimeout(t); } }

  /* ---------- טקסט משותף ---------- */
  const LEAD = 'בוחרים סוג צילום ותאריך — ורואים מיד מי מהצלמות שלנו פנויה, באיזה אזור ובאיזה מחיר. כל הצלמות שלנו נבחרו ונבדקו אישית.';
  const H1 = 'כל הצלמות הטובות.<br><span class="hl">יומן אחד.</span>';
  const FACTS = ['תאריך פנוי? רואים בזמן אמת', 'מכל טווחי המחירים', 'תשובה תוך 24 שעות'];
  const cta = (a = 'btn btn-red', b = 'btn btn-line') => `<div class="hero-cta"><a href="#book" class="${a}">למצוא צלמת לתאריך שלי</a><a href="#team" class="${b}">להכיר את הצלמות</a></div>`;
  const facts = (cls = '') => `<dl class="hero-facts ${cls}">${FACTS.map((f, i) => `<div><dt class="mono">0${i + 1}</dt><dd>${f}</dd></div>`).join('')}</dl>`;

  /* ---------- 02 · פולרואיד: מצלמת פולרואיד שמדפיסה צלמת ---------- */
  function polaroid(c) {
    const pile = c.ps.slice(1, 4);
    return `<div class="hx-pol">
      <div class="hero-text">
        <p class="kicker mono">${c.brand} · ${c.n} צלמות · מצלמות ומפתחות במקום</p>
        <h1>${H1}</h1><p class="lead">${LEAD}</p>${cta()}${facts()}
      </div>
      <div class="hx-pol-stage">
        ${pile.map((p, i) => `<figure class="hx-pol-pile pp${i}"><img src="${c.photo(p, 300, 300)}" alt=""><figcaption>${c.esc(p.name.split(' ')[0])} ♥</figcaption></figure>`).join('')}
        <div class="hx-cam" role="button" tabindex="0" aria-label="ללחוץ כדי לצלם את הצלמת הבאה">
          <div class="hx-cam-print"><img alt=""><span></span></div>
          <div class="hx-cam-body">
            <span class="hx-cam-view"></span><span class="hx-cam-flash"></span>
            <span class="hx-cam-lens"><i></i></span>
            <span class="hx-cam-rainbow"></span>
            <span class="hx-cam-btn"></span>
            <span class="hx-cam-name">${c.brand}</span>
          </div>
          <span class="hx-cam-slot"></span>
        </div>
        <p class="hx-hint">← לחצו על המצלמה</p>
        <div class="hx-flash"></div>
      </div>
    </div>`;
  }
  function polaroidRun(el, c) {
    const cam = el.querySelector('.hx-cam'), pr = el.querySelector('.hx-cam-print'), img = pr.querySelector('img'), cap = pr.querySelector('span'), fl = el.querySelector('.hx-flash');
    let i = 0;
    function shoot() {
      const p = c.ps[i++ % c.ps.length];
      fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
      pr.classList.remove('out'); void pr.offsetWidth;
      img.src = c.photo(p, 360, 360); cap.textContent = p.name;
      pr.classList.add('out');
    }
    cam.onclick = shoot; cam.onkeydown = e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), shoot());
    later(500, shoot); every(6000, shoot);
  }

  /* ---------- 03 · מגזין: שער מגזין ותוכן עניינים ---------- */
  function magazine(c) {
    const o = c.ps[0], d = new Date();
    return `<div class="hx-mag">
      <div class="hx-cover">
        <img src="${c.photo(o, 900, 1120)}" alt="">
        <div class="hx-mast">${c.brand}</div>
        <p class="hx-issue mono">גיליון ${String(d.getMonth() + 1).padStart(2, '0')} · ${c.month} ${d.getFullYear()} · חינם</p>
        <ul class="hx-lines">
          <li><b>${c.n}</b> צלמות.<br>יומן אחד.</li>
          <li>מחירים<br><b>מ־${c.money(c.minPrice)}</b></li>
          <li class="hx-excl"><em>בלעדי</em> ${c.esc(o.name)}:<br>${o.years} שנים מאחורי העדשה</li>
        </ul>
        <p class="hx-cover-h">כל הצלמות<br>הטובות.</p>
        <div class="hx-barcode"><i></i><span class="mono">7 290000 ${String(c.n).padStart(2, '0')}1026</span></div>
      </div>
      <div class="hx-toc">
        <p class="kicker mono">בגיליון הזה</p>
        <h1>${H1}</h1>
        <p class="lead">${LEAD}</p>
        <ol class="hx-toc-list">
          <li><a href="#book"><span class="mono">04</span><b>הזמנת צילום</b><em>בוחרים סוג צילום ותאריך ורואים מי פנויה</em></a></li>
          <li><a href="#team"><span class="mono">12</span><b>הצלמות</b><em>${c.n} פורטרטים, אזורים ומחירים</em></a></li>
          <li><a href="#how"><span class="mono">20</span><b>איך זה עובד</b><em>שלושה צעדים, תשובה תוך יממה</em></a></li>
        </ol>
        ${cta()}
      </div>
    </div>`;
  }

  /* ---------- 04 · רטרו 70: גלגל View-Master מסתובב ---------- */
  function retro(c) {
    const ps = c.ps.slice(0, 7);
    return `<div class="hx-retro">
      <div class="hero-text">
        <p class="kicker mono">${c.brand} · מופע שקופיות · ${c.n} צלמות</p>
        <h1>${H1}</h1><p class="lead">${LEAD}</p>${cta()}${facts()}
      </div>
      <div class="hx-vm">
        <div class="hx-vm-sun"></div>
        <div class="hx-reel" style="--n:${ps.length}">
          <svg class="hx-reel-txt" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="reelArc" d="M100 100 m-63 0 a63 63 0 1 1 126 0 a63 63 0 1 1 -126 0"/></defs><text><textPath href="#reelArc">${c.brand} · ${ps.length} שקופיות · תלת־ממד · ${c.brand} · צבע מלא ·</textPath></text></svg>
          ${ps.map((p, i) => `<span class="hx-slide" style="--i:${i}"><img src="${c.photo(p, 200, 200)}" alt=""></span>`).join('')}
          <i class="hx-reel-hole"></i>
        </div>
        <div class="hx-vm-window"><span class="mono">עכשיו בעינית</span><b></b><small></small></div>
      </div>
    </div>`;
  }
  function retroRun(el, c) {
    const reel = el.querySelector('.hx-reel'), n = Math.min(7, c.ps.length), b = el.querySelector('.hx-vm-window b'), s = el.querySelector('.hx-vm-window small');
    let k = 0;
    function step() {
      reel.style.setProperty('--turn', `${-k * 360 / n}deg`);
      const p = c.ps[k % n]; b.textContent = p.name; s.textContent = p.tagline;
      el.querySelectorAll('.hx-slide').forEach((x, i) => x.classList.toggle('on', i === k % n));
      k++;
    }
    step(); every(2800, step);
    reel.onclick = step;
  }

  /* ---------- 05 · פילם נואר: מסך קולנוע, ספירה לאחור וכתוביות ---------- */
  function noir(c) {
    const ps = c.ps.slice(0, 6);
    return `<div class="hx-noir">
      <div class="hx-screen">
        ${ps.map((p, i) => `<figure class="hx-shot ${i ? '' : 'on'}"><img src="${c.photo(p, 1400, 600)}" alt=""></figure>`).join('')}
        <div class="hx-blinds"></div>
        <p class="hx-subs"><span></span></p>
        <div class="hx-leader" aria-hidden="true"><i></i><b>3</b></div>
        <span class="hx-reel-no mono">סליל 1 · סצנה <em>01</em></span>
      </div>
      <div class="hx-poster">
        <p class="hx-presents">${c.brand} מציגה</p>
        <h1>${H1}</h1>
        <p class="lead">${LEAD}</p>
        ${cta()}
        <p class="hx-billing">בכיכוב <b>${c.ps.map(p => c.esc(p.name)).join(' · ')}</b><br>צילום ובימוי: צוות ${c.brand} · מבוסס על יומן אחד משותף · תשובה תוך 24 שעות · <b>בקרוב בתאריך שלכם</b></p>
      </div>
    </div>`;
  }
  function noirRun(el, c) {
    const shots = el.querySelectorAll('.hx-shot'), subs = el.querySelector('.hx-subs span'), no = el.querySelector('.hx-reel-no em'), lead = el.querySelector('.hx-leader b'), leader = el.querySelector('.hx-leader');
    let k = 0, n = 3;
    const say = () => { const p = c.ps[k]; subs.textContent = `— ${p.name}: «${p.tagline}»`; no.textContent = String(k + 1).padStart(2, '0'); };
    say();
    every(1000, () => { if (n > 1) lead.textContent = --n; else leader.classList.add('hx-gone'); });
    every(4500, () => { shots[k].classList.remove('on'); k = (k + 1) % shots.length; shots[k].classList.add('on'); say(); });
  }

  /* ---------- 06 · חתונה: הזמנה בין שתי קשתות ופרחים נושרים ---------- */
  function wedding(c) {
    const [a, b] = [c.ps[2] || c.ps[0], c.ps[5] || c.ps[1]];
    return `<div class="hx-wed">
      <figure class="hx-arch a1"><img src="${c.photo(a, 420, 640)}" alt=""><figcaption>${c.esc(a.name)}</figcaption></figure>
      <div class="hx-invite">
        <p class="hx-orn" aria-hidden="true">✦ ✦ ✦</p>
        <p class="kicker mono">בשמחה רבה</p>
        <p class="hx-inv-sm">צוות הצלמות של ${c.brand} מזמין אתכם</p>
        <h1>${H1}</h1>
        <p class="lead">${LEAD}</p>
        <div class="hx-save"><span>שמרו את התאריך</span><b>${c.n} צלמות · יומן משותף</b></div>
        ${cta()}
        <p class="hx-rsvp">${FACTS.join(' · ')}</p>
      </div>
      <figure class="hx-arch a2"><img src="${c.photo(b, 420, 640)}" alt=""><figcaption>${c.esc(b.name)}</figcaption></figure>
      <div class="hx-petals" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i * 0.9) % 9}s;--s:${0.6 + (i % 4) * 0.2}"></i>`).join('')}</div>
    </div>`;
  }

  /* ---------- 07 · ציאנוטייפ: שרטוט טכני של מצלמה ---------- */
  function cyanotype(c) {
    const o = c.ps[0], s1 = c.ps[3] || o;
    const call = (x, y, tx, ty, l, t) => `<a href="#book"><path class="hx-ld" d="M${x} ${y} L${tx} ${ty} H${tx + (tx > 260 ? 40 : -40)}"/><circle cx="${x}" cy="${y}" r="3"/><text x="${tx + (tx > 260 ? 46 : -46)}" y="${ty + 4}" text-anchor="${tx > 260 ? 'start' : 'end'}"><tspan class="hx-l">${l}</tspan> ${t}</text></a>`;
    return `<div class="hx-cyan">
      <div class="hero-text">
        <p class="kicker mono">גיליון ${c.n}/${c.n} · שרטוט מס׳ 01</p>
        <h1>${H1}</h1><p class="lead">${LEAD}</p>${cta()}${facts()}
      </div>
      <div class="hx-bp">
        <svg viewBox="0 0 520 380" class="hx-cam-svg" aria-label="שרטוט של מצלמה עם ארבעת שלבי ההזמנה">
          <defs><clipPath id="cyLens"><circle cx="260" cy="200" r="62"/></clipPath></defs>
          <g class="hx-draw">
            <rect x="120" y="120" width="280" height="170" rx="14"/>
            <rect x="150" y="96" width="70" height="24" rx="4"/>
            <rect x="330" y="104" width="44" height="16" rx="3"/>
            <circle cx="260" cy="200" r="84"/><circle cx="260" cy="200" r="72"/>
            <circle cx="365" cy="150" r="10"/>
            <path d="M120 150 H400 M120 260 H400" class="hx-thin"/>
          </g>
          <image href="${c.photo(o, 300, 300)}" x="198" y="138" width="124" height="124" clip-path="url(#cyLens)" class="hx-lens-img"/>
          <circle cx="260" cy="200" r="62" class="hx-draw-c"/>
          <g class="hx-dim">
            <path d="M120 330 H400 M120 322 V338 M400 322 V338"/><text x="260" y="350" text-anchor="middle">${c.n} צלמות · יומן אחד</text>
            <path d="M440 120 V290 M432 120 H448 M432 290 H448"/><text x="452" y="210">Ø 24h</text>
          </g>
          <g class="hx-calls">
            ${call(185, 108, 120, 50, 'A', 'סוג צילום')}
            ${call(352, 112, 400, 50, 'B', 'תאריך')}
            ${call(200, 250, 90, 300, 'C', 'צלמת')}
            ${call(365, 150, 470, 90, 'D', 'פרטים')}
          </g>
        </svg>
        <figure class="hx-spec s1"><img src="${c.photo(s1, 260, 320)}" alt=""><figcaption class="mono">FIG. 2 — ${c.esc(s1.name)}</figcaption></figure>
        <table class="hx-tblock mono"><tr><td>שם</td><td>${c.brand} · יומן צלמות</td></tr><tr><td>קנ״מ</td><td>1:1</td></tr><tr><td>תאריך</td><td>${c.today}</td></tr><tr><td>שרטט</td><td>${c.esc(o.name)}</td></tr></table>
      </div>
    </div>`;
  }

  /* ---------- 08 · ניאון: שלט ניאון, תא צילום וקו רקיע ---------- */
  function neon(c) {
    const sky = Array.from({ length: 22 }, (_, i) => { const h = 40 + ((i * 53) % 110), w = 34 + ((i * 17) % 30); return { h, w }; });
    let x = 0;
    const city = sky.map((b, i) => { const r = `<rect x="${x}" y="${200 - b.h}" width="${b.w}" height="${b.h}"/>` + Array.from({ length: Math.floor(b.h / 18) }, (_, j) => ((i + j) % 3 ? `<rect class="w" x="${x + 6 + (j % 2) * 12}" y="${210 - b.h + j * 16}" width="5" height="6"/>` : '')).join(''); x += b.w + 3; return r; }).join('');
    return `<div class="hx-neon">
      <div class="hx-neon-text">
        <span class="hx-open" aria-hidden="true">פתוח</span>
        <p class="kicker mono">${c.brand} · צילום אירועים עד הבוקר</p>
        <h1 class="hx-tube">${H1}</h1>
        <p class="lead">${LEAD}</p>${cta()}${facts()}
      </div>
      <div class="hx-booth">
        <div class="hx-booth-top"><span>תא צילום</span><small class="mono">4 פוזות · ${c.n} צלמות</small></div>
        <div class="hx-booth-win"><div class="hx-curtain"></div><span class="hx-booth-cnt mono">3</span></div>
        <div class="hx-booth-slot"></div>
        <div class="hx-strip"></div>
      </div>
      <svg class="hx-city" viewBox="0 0 ${x} 200" preserveAspectRatio="none" aria-hidden="true">${city}</svg>
    </div>`;
  }
  function neonRun(el, c) {
    const strip = el.querySelector('.hx-strip'), cnt = el.querySelector('.hx-booth-cnt');
    let k = 0;
    function print() {
      const four = [0, 1, 2, 3].map(j => c.ps[(k + j) % c.ps.length]); k += 4;
      strip.classList.remove('out'); void strip.offsetWidth;
      strip.innerHTML = four.map(p => `<img src="${c.photo(p, 220, 180)}" alt="">`).join('') + `<span class="mono">${c.brand} · ${c.today}</span>`;
      strip.classList.add('out');
    }
    let n = 3;
    every(900, () => { cnt.textContent = n > 0 ? n : '★'; if (n === 0) { el.querySelector('.hx-booth-win').classList.add('pop'); setTimeout(() => el.querySelector('.hx-booth-win').classList.remove('pop'), 300); print(); n = 7; } else n--; });
  }

  /* ---------- 09 · קולאז׳: כותרת של מכתב כופר וגזירים מודבקים ---------- */
  function collage(c) {
    let r = 0;
    const word = t => `<span class="hx-w">${[...t].map(ch => `<span class="rn r${(r = (r * 7 + 3) % 6)}">${ch}</span>`).join('')}</span>`;
    const line = t => t.split(' ').map(word).join(' ');
    const cut = c.ps.slice(0, 5);
    return `<div class="hx-col">
      <div class="hx-col-text">
        <p class="kicker mono">${c.brand} · גיליון 01 · נגזר ביד</p>
        <h1 class="hx-ransom" aria-label="כל הצלמות הטובות. יומן אחד."><span aria-hidden="true">${line('כל הצלמות הטובות.')}<br>${line('יומן אחד.')}</span></h1>
        <p class="lead hx-torn">${LEAD}</p>
        ${cta()}
        <div class="hx-stickers">${FACTS.map((f, i) => `<span class="st${i}">${f}</span>`).join('')}</div>
      </div>
      <div class="hx-board">
        ${cut.map((p, i) => `<figure class="hx-cut c${i}"><img src="${c.photo(p, 380, 440)}" alt=""><figcaption>${c.esc(p.name)}</figcaption></figure>`).join('')}
        <span class="hx-bubble">${c.n} צלמות!<br>יומן אחד!</span>
        <span class="hx-stamp">חדש</span>
        <svg class="hx-arrow" viewBox="0 0 120 80" aria-hidden="true"><path d="M110 10 C 70 0, 30 20, 18 60 M18 60 l-6 -16 M18 60 l14 -9"/></svg>
      </div>
    </div>`;
  }

  /* ---------- 10 · סטודיו לבן: תמונה גדולה מתחלפת ורצועת תמונות ממוזערות ---------- */
  function studio(c) {
    const ps = c.ps.slice(0, 6);
    return `<div class="hx-studio">
      <div class="hx-st-head">
        <p class="kicker mono">${c.brand} · ${c.n} צלמות · יומן אחד</p>
        <h1>${H1}</h1>
        <p class="lead">${LEAD}</p>
        ${cta()}
      </div>
      <div class="hx-st-show">
        <div class="hx-st-main">${ps.map((p, i) => `<figure class="${i ? '' : 'on'}"><img src="${c.photo(p, 1400, 760)}" alt=""><figcaption><b>${c.esc(p.name)}</b><span>${c.esc(c.brandify(p.tagline))}</span><em class="mono">מ־${c.money(Math.min(...Object.values(p.prices)))}</em></figcaption></figure>`).join('')}</div>
        <div class="hx-st-thumbs">${ps.map((p, i) => `<button type="button" class="${i ? '' : 'on'}" data-i="${i}" aria-label="${c.esc(p.name)}"><img src="${c.photo(p, 160, 120)}" alt=""><i></i></button>`).join('')}</div>
      </div>
      ${facts('hx-st-facts')}
    </div>`;
  }
  function studioRun(el) {
    const figs = el.querySelectorAll('.hx-st-main figure'), th = el.querySelectorAll('.hx-st-thumbs button');
    let k = 0;
    const show = i => { figs[k].classList.remove('on'); th[k].classList.remove('on'); k = i; figs[k].classList.add('on'); void th[k].offsetWidth; th[k].classList.add('on'); };
    th.forEach(b => b.onclick = () => show(Number(b.dataset.i)));
    every(5000, () => show((k + 1) % figs.length));
  }

  /* ---------- 11 · ספיה 1900: דף אלבום עם כרטיסי קבינט ומודעה עתיקה ---------- */
  function sepia(c) {
    const cards = c.ps.slice(0, 3);
    return `<div class="hx-sep">
      <div class="hx-album">
        ${cards.map((p, i) => `<figure class="hx-cab k${i}">
          <div class="hx-cab-card"><span class="hx-corner a"></span><span class="hx-corner b"></span><span class="hx-corner c"></span><span class="hx-corner d"></span><img src="${c.photo(p, 300, 400)}" alt=""><p>${c.brand} · בית צילום</p></div>
          <figcaption>${c.esc(p.name)}, ${p.years} שנים בצילום</figcaption></figure>`).join('')}
      </div>
      <div class="hx-ad">
        <p class="hx-ad-orn" aria-hidden="true">❦</p>
        <p class="hx-ad-top">הודעה לקהל הנכבד</p>
        <p class="hx-ad-name">בית הצילום ${c.brand}</p>
        <h1>${H1}</h1>
        <p class="hx-ad-list">חתונות · בר מצוה · ברית · דיוקנאות משפחה · תינוקות</p>
        <p class="lead">${LEAD}</p>
        <p class="hx-ad-price">מחירים הוגנים לכל כיס! החל מ־${c.money(c.minPrice)}</p>
        ${cta()}
        <p class="hx-ad-foot">${FACTS.join(' ❧ ')}</p>
      </div>
    </div>`;
  }

  const heroes = { polaroid, magazine, retro, noir, wedding, cyanotype, neon, collage, studio, sepia };
  const runs = { polaroid: polaroidRun, retro: retroRun, noir: noirRun, neon: neonRun, studio: studioRun };

  /* מחזיר true אם העיצוב בנה את אזור הפתיחה בעצמו */
  function hero(el, ctx) {
    stop();
    const id = window.Themes ? Themes.current : 'darkroom';
    if (!heroes[id]) return false;
    el.innerHTML = heroes[id](ctx);
    el.className = 'hero hero--x hero--' + id;
    runs[id] && runs[id](el, ctx);
    return true;
  }
  return { hero, stop };
})();
