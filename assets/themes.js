/* עיצובים: רשימת העיצובים, טעינת הפונטים שלהם, ובחירה שנשמרת בדפדפן.
   נטען ב־<head> לפני הגוף, כדי שהדף ייפתח מיד בעיצוב שנבחר בלי הבהוב. */
window.Themes = (function () {
  const KEY = 'frame-theme';
  const GF = 'https://fonts.googleapis.com/css2?display=swap&';
  /* לוגואים: תוכן SVG על משטח 32×32. currentColor = צבע הטקסט סביב הלוגו,
     ו־var(--x, #fallback) כדי שגם ה־favicon (שאין לו משתני CSS) יקבל צבע. */
  const C = (v, hex) => `style="fill:var(--${v},${hex})"`;
  const S = (v, hex) => `style="stroke:var(--${v},${hex})"`;
  const burst = (() => { let d = ''; for (let i = 0; i < 24; i++) { const a = Math.PI * i / 12, r = i % 2 ? 10.5 : 15; d += (i ? 'L' : 'M') + (16 + r * Math.sin(a)).toFixed(1) + ' ' + (16 - r * Math.cos(a)).toFixed(1); } return d + 'Z'; })();
  const leaf = (x, y, deg) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="1.4" transform="rotate(${deg} ${x} ${y})" ${C('amber', '#A9D8FF')}/>`;
  const list = [
    { id: 'darkroom', name: 'חדר חושך', sw: ['#EEE7DA', '#141110', '#C8371D'], bar: '#141110', fav: ['#15120F', '#EEE7DA'],
      brand: 'פריים',
      logo: `<rect x="4" y="8" width="24" height="16" fill="none" stroke-width="3.2" ${S('red', '#C8371D')}/><rect x="9" y="13" width="14" height="6" fill="currentColor"/>` },
    { id: 'polaroid', name: 'פולרואיד', sw: ['#FFFFFF', '#F6C445', '#E2412E'], bar: '#232220', fav: ['#F3F0EA', '#232220'], fonts: 'family=Playpen+Sans+Hebrew:wght@400;600;800&family=Rubik:wght@400;500;700',
      brand: 'קליק',
      logo: `<rect x="5" y="2.5" width="22" height="27" rx="2" fill="#fff" stroke="currentColor" stroke-width="1.6"/><rect x="8.5" y="6" width="15" height="14" rx=".5" ${C('ink', '#232220')}/>` +
        ['#E2412E', '#F28C28', '#F6C445', '#4CA35A', '#2B7BBF'].map((c, i) => `<rect x="${8.5 + i * 3}" y="23" width="3" height="2.4" fill="${c}"/>`).join('') },
    { id: 'magazine', name: 'מגזין', sw: ['#FFFFFF', '#0A0A0A', '#1D3BD1'], bar: '#0A0A0A', fav: ['#FFFFFF', '#0A0A0A'], fonts: 'family=Noto+Serif+Hebrew:wght@300;500;800;900&family=Heebo:wght@300;400;500;700',
      brand: 'שער',
      logo: `<rect x="6" y="2.5" width="20" height="27" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="9.5" y="6.5" width="13" height="3.6" ${C('red', '#1D3BD1')}/><rect x="9.5" y="13" width="13" height="13" fill="currentColor"/><rect x="9.5" y="23" width="6" height="1.6" fill="#fff"/>` },
    { id: 'retro', name: 'רטרו 70', sw: ['#F0A830', '#D9531E', '#3A2212'], bar: '#3A2212', fav: ['#F4E4C1', '#3A2212'], fonts: 'family=Secular+One&family=Rubik:wght@400;500;700',
      brand: 'סופר 8',
      logo: `<rect x="1" y="8" width="30" height="16" rx="8" fill="#8E2E1A"/><rect x="1" y="8" width="24" height="16" rx="8" fill="#D9531E"/><rect x="1" y="8" width="18" height="16" rx="8" fill="#E57B26"/><rect x="1" y="8" width="12" height="16" rx="8" fill="#F0A830"/><circle cx="24" cy="16" r="3.4" fill="none" stroke="#FFF6E3" stroke-width="1.6"/>` },
    { id: 'noir', name: 'פילם נואר', sw: ['#0E0E0E', '#ECE9E2', '#D4AF5A'], bar: '#050505', fav: ['#0E0E0E', '#ECE9E2'], fonts: 'family=Suez+One&family=Heebo:wght@300;400;500;700',
      brand: 'צללית',
      logo: `<defs><clipPath id="noirLens"><circle cx="16" cy="16" r="11"/></clipPath></defs><circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" stroke-width="2"/><g clip-path="url(#noirLens)" transform="rotate(-14 16 16)">${[5, 10, 15, 20, 25].map(y => `<rect x="2" y="${y}" width="28" height="2.6" ${C('red', '#D4AF5A')}/>`).join('')}</g>` },
    { id: 'wedding', name: 'חתונה', sw: ['#FBF7F3', '#A86B5C', '#B8975A'], bar: '#4B3A36', fav: ['#FBF7F3', '#4B3A36'], fonts: 'family=Bellefair&family=Assistant:wght@300;400;600;700',
      brand: 'חופה',
      logo: `<path d="M3.5 11 Q16 1.5 28.5 11" fill="none" stroke-width="1.8" stroke-linecap="round" ${S('amber', '#B8975A')}/><path d="M6.5 9 V29 M25.5 9 V29" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 13 L17.3 18.7 L23 20 L17.3 21.3 L16 27 L14.7 21.3 L9 20 L14.7 18.7 Z" ${C('red', '#A86B5C')}/>` },
    { id: 'cyanotype', name: 'ציאנוטייפ', sw: ['#1B4F8A', '#F3F8FD', '#A9D8FF'], bar: '#0E2F55', fav: ['#1B4F8A', '#F3F8FD'], fonts: 'family=Heebo:wght@200;300;400;500;800',
      brand: 'תכלת',
      logo: `<rect x="2.5" y="2.5" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.2 1.8"/><path d="M15 28 C15.5 20 15 13 19 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>` +
        leaf(11.5, 23, -25) + leaf(19, 21.5, 25) + leaf(11.5, 17, -35) + leaf(19.5, 15.5, 20) + leaf(13, 11, -45) + leaf(20.5, 10, 10) + leaf(17, 6.5, -60) },
    { id: 'neon', name: 'ניאון', sw: ['#0C0716', '#FF2E88', '#22E4FF'], bar: '#07030E', fav: ['#0C0716', '#F5EEFF'], fonts: 'family=Rubik:wght@400;500;700;800;900',
      brand: 'לילה',
      logo: `<path d="M19 4 A12 12 0 1 0 28.5 21 A9.5 9.5 0 1 1 19 4 Z" fill="none" stroke-width="2.2" stroke-linejoin="round" ${S('red', '#FF2E88')}/><path d="M24 6 l.9 2.3 2.3 .9 -2.3 .9 -.9 2.3 -.9 -2.3 -2.3 -.9 2.3 -.9 Z" ${C('amber', '#22E4FF')}/><circle cx="28" cy="13.5" r="1.1" ${C('amber', '#22E4FF')}/>` },
    { id: 'zine', name: 'זין', sw: ['#FFE500', '#111111', '#FF3EA5'], bar: '#111111', fav: ['#F1EEE3', '#111111'], fonts: 'family=Karantina:wght@400;700&family=Rubik:wght@400;500;700',
      brand: 'גזיר',
      logo: `<path d="${burst}" ${C('amber', '#FFE500')} stroke="#111" stroke-width="1.6" stroke-linejoin="round" transform="rotate(-8 16 16)"/><circle cx="16" cy="16" r="5" ${C('red', '#FF3EA5')} stroke="#111" stroke-width="1.6"/>` },
    { id: 'studio', name: 'סטודיו לבן', sw: ['#FAFAF7', '#1A1A1A', '#C8693A'], bar: '#FAFAF7', fav: ['#FFFFFF', '#1A1A1A'], fonts: 'family=Heebo:wght@300;400;500;700;800',
      brand: 'אור',
      logo: `<circle cx="14" cy="17" r="10" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="23" cy="8.5" r="4.2" ${C('red', '#C8693A')}/>` },
    { id: 'sepia', name: 'ספיה 1900', sw: ['#E8DABD', '#2B1F14', '#7E2F1D'], bar: '#2B1F14', fav: ['#E8DABD', '#3B2A1A'], fonts: 'family=David+Libre:wght@400;500;700',
      brand: 'דיוקן',
      logo: `<ellipse cx="16" cy="16" rx="11" ry="14" fill="none" stroke-width="2.6" ${S('amber', '#B38A45')}/><ellipse cx="16" cy="16" rx="7.6" ry="10.4" ${C('paper-3', '#CDB88F')}/><circle cx="16" cy="12.6" r="3.1" ${C('ink', '#3B2A1A')}/><path d="M10 24.5 Q10.5 17 16 17 Q21.5 17 22 24.5 Q16 27.6 10 24.5 Z" ${C('ink', '#3B2A1A')}/>` }
  ];
  const byId = id => list.find(t => t.id === id);

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function initial() {
    const q = new URLSearchParams(location.search).get('theme');
    if (byId(q)) { try { localStorage.setItem(KEY, q); } catch (e) { } return q; }
    return byId(stored()) ? stored() : 'darkroom';
  }

  let current = null;
  function apply(id) {
    const t = byId(id) || list[0];
    current = t.id;
    const root = document.documentElement;
    if (t.id === 'darkroom') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t.id);
    let link = document.getElementById('themeFonts');
    if (t.fonts) {
      if (!link) { link = document.createElement('link'); link.id = 'themeFonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
      link.href = GF + t.fonts;
    } else if (link) link.remove();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t.bar;
  }
  /* שם האתר והלוגו של העיצוב הנוכחי: בכותרת, בכותרת התחתונה, בניהול, בפורטל, בלשונית ובאייקון */
  let baseTitle = null;
  const markSvg = t => `<svg viewBox="0 0 32 32" aria-hidden="true">${t.logo}</svg>`;
  function applyBrand() {
    const t = byId(current);
    document.querySelectorAll('.logo-mark').forEach(m => { m.innerHTML = markSvg(t); });
    document.querySelectorAll('.logo-word, .brand-name').forEach(e => { e.textContent = t.brand; });
    document.querySelectorAll('.logo').forEach(l => l.setAttribute('aria-label', t.brand));
    if (baseTitle === null) baseTitle = document.title;
    document.title = baseTitle.replace('פריים', t.brand);
    const fav = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${t.fav[0]}"/><g color="${t.fav[1]}" transform="translate(4 4) scale(.75)">${t.logo}</g></svg>`;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
    icon.href = 'data:image/svg+xml,' + encodeURIComponent(fav);
  }
  function set(id) {
    try { localStorage.setItem(KEY, id); } catch (e) { }
    apply(id);
    applyBrand();
    document.dispatchEvent(new CustomEvent('theme:changed'));
  }
  /* מחליף את שם הסטודיו בטקסט חופשי (למשל בתיאור של הצלמת הראשית) */
  const brandify = s => String(s == null ? '' : s).replace(/פריים/g, byId(current).brand);

  apply(initial());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBrand); else applyBrand();
  return { list, set, get current() { return current; }, get brand() { return byId(current).brand; }, byId, brandify, applyBrand };
})();
