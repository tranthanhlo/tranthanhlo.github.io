import { stops, ui } from './content.js';

// DOM side of the page: intro card, content panel, bottom nav, language and day/night buttons.
const $ = (id) => document.getElementById(id);

export function initUI({ onSelect, onHome, onToggleLights, onAction, onLangChange }) {
  let lang = 'vi';
  try { if (localStorage.getItem('lang') === 'en') lang = 'en'; } catch {}
  let current = -1;
  const panel = $('panel');
  const nav = $('stops');

  stops.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', () => onSelect(i));
    nav.appendChild(b);
  });

  function fillPanel() {
    if (current < 0) return;
    const stop = stops[current];
    const t = stop[lang];
    $('p-landmark').textContent = t.landmark;
    $('p-section').textContent = t.section;
    $('p-fact').textContent = t.fact;
    $('p-body').innerHTML = t.body;
    $('p-count').textContent = `${current + 1} / ${stops.length}`;
    const action = $('p-action');
    action.hidden = !stop.action;
    if (stop.action) action.textContent = t.action;
  }

  function applyLang() {
    document.documentElement.lang = lang;
    const strings = ui[lang];
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = strings[el.dataset.i18n];
    for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = strings[el.dataset.i18nHtml];
    $('close').setAttribute('aria-label', strings.close);
    [...nav.children].forEach((b, i) => {
      b.innerHTML = `<span class="num">${String(i + 1).padStart(2, '0')}</span>${stops[i][lang].section}`;
    });
    fillPanel();
    onLangChange(lang);
  }

  $('lang').addEventListener('click', () => {
    lang = lang === 'vi' ? 'en' : 'vi';
    try { localStorage.setItem('lang', lang); } catch {}
    applyLang();
  });
  $('start').addEventListener('click', () => onSelect(0));
  $('close').addEventListener('click', onHome);
  $('home').addEventListener('click', onHome);
  $('next').addEventListener('click', () => onSelect((current + 1) % stops.length));
  $('prev').addEventListener('click', () => onSelect((current - 1 + stops.length) % stops.length));
  $('p-action').addEventListener('click', () => onAction(stops[current].action));
  $('lights').addEventListener('click', onToggleLights);

  return {
    applyLang,
    open(i) {
      current = i;
      $('intro').classList.add('hide');
      fillPanel();
      panel.scrollTop = 0;
      panel.classList.add('open');
      document.body.classList.add('panel-open');
      [...nav.children].forEach((b, k) => b.classList.toggle('active', k === i));
    },
    close() {
      current = -1;
      panel.classList.remove('open');
      document.body.classList.remove('panel-open');
      for (const b of nav.children) b.classList.remove('active');
    },
    setLights(on) {
      document.body.classList.toggle('lights-on', on);
      $('lights').setAttribute('aria-pressed', String(on));
    },
  };
}
