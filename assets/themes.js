/* עיצובים: רשימת העיצובים, טעינת הפונטים שלהם, ובחירה שנשמרת בדפדפן.
   נטען ב־<head> לפני הגוף, כדי שהדף ייפתח מיד בעיצוב שנבחר בלי הבהוב. */
window.Themes = (function () {
  const KEY = 'frame-theme';
  const GF = 'https://fonts.googleapis.com/css2?display=swap&';
  const list = [
    { id: 'darkroom', name: 'חדר חושך', sw: ['#EEE7DA', '#141110', '#C8371D'], bar: '#141110' },
    { id: 'polaroid', name: 'פולרואיד', sw: ['#FFFFFF', '#F6C445', '#E2412E'], bar: '#232220', fonts: 'family=Playpen+Sans+Hebrew:wght@400;600;800&family=Rubik:wght@400;500;700' },
    { id: 'magazine', name: 'מגזין', sw: ['#FFFFFF', '#0A0A0A', '#1D3BD1'], bar: '#0A0A0A', fonts: 'family=Noto+Serif+Hebrew:wght@300;500;800;900&family=Heebo:wght@300;400;500;700' },
    { id: 'retro', name: 'רטרו 70', sw: ['#F0A830', '#D9531E', '#3A2212'], bar: '#3A2212', fonts: 'family=Secular+One&family=Rubik:wght@400;500;700' },
    { id: 'noir', name: 'פילם נואר', sw: ['#0E0E0E', '#ECE9E2', '#D4AF5A'], bar: '#050505', fonts: 'family=Suez+One&family=Heebo:wght@300;400;500;700' },
    { id: 'wedding', name: 'חתונה', sw: ['#FBF7F3', '#A86B5C', '#B8975A'], bar: '#4B3A36', fonts: 'family=Bellefair&family=Assistant:wght@300;400;600;700' },
    { id: 'cyanotype', name: 'ציאנוטייפ', sw: ['#1B4F8A', '#F3F8FD', '#A9D8FF'], bar: '#0E2F55', fonts: 'family=Heebo:wght@200;300;400;500;800' },
    { id: 'neon', name: 'ניאון', sw: ['#0C0716', '#FF2E88', '#22E4FF'], bar: '#07030E', fonts: 'family=Rubik:wght@400;500;700;800;900' },
    { id: 'zine', name: 'זין', sw: ['#FFE500', '#111111', '#FF3EA5'], bar: '#111111', fonts: 'family=Karantina:wght@400;700&family=Rubik:wght@400;500;700' },
    { id: 'studio', name: 'סטודיו לבן', sw: ['#FAFAF7', '#1A1A1A', '#C8693A'], bar: '#FAFAF7', fonts: 'family=Heebo:wght@300;400;500;700;800' },
    { id: 'sepia', name: 'ספיה 1900', sw: ['#E8DABD', '#2B1F14', '#7E2F1D'], bar: '#2B1F14', fonts: 'family=David+Libre:wght@400;500;700' }
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
  function set(id) {
    try { localStorage.setItem(KEY, id); } catch (e) { }
    apply(id);
  }

  apply(initial());
  return { list, set, get current() { return current; }, byId };
})();
