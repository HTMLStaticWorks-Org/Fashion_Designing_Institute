/*
  Fashion Designing Institute - Interactive Atelier Tools

  Three self-contained modules:
    #matchFinder       (index.html)  live fashion program recommender
    #costEstimator     (home2.html)  tuition & studio kit estimator
    #milestoneTimeline (about.html)  institute heritage milestones
*/

(function () {
  'use strict';

  // ---------------------------------------------------------------- helpers

  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');

  const escapeHTML = (str) => String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const readouts = (root) => {
    const map = {};
    root.querySelectorAll('[data-readout]').forEach(el => {
      map[el.dataset.readout] = el;
    });
    return map;
  };

  function chipGroups(root, onChange) {
    const state = {};

    root.querySelectorAll('[data-group]').forEach(row => {
      const group = row.dataset.group;
      const multi = row.dataset.mode === 'multi';
      const chips = Array.from(row.querySelectorAll('[data-value]'));

      state[group] = multi
        ? chips.filter(c => c.getAttribute('aria-pressed') === 'true').map(c => c.dataset.value)
        : (chips.find(c => c.getAttribute('aria-pressed') === 'true') || chips[0]).dataset.value;

      row.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-value]');
        if (!chip || !chips.includes(chip)) return;

        if (multi) {
          const on = chip.getAttribute('aria-pressed') !== 'true';
          chip.setAttribute('aria-pressed', String(on));
          state[group] = chips
            .filter(c => c.getAttribute('aria-pressed') === 'true')
            .map(c => c.dataset.value);
        } else {
          chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
          state[group] = chip.dataset.value;
        }

        onChange(state);
      });
    });

    return state;
  }

  function rangeControl(input, onChange) {
    if (!input) return;

    const paint = () => {
      const min = Number(input.min);
      const pct = ((Number(input.value) - min) / (Number(input.max) - min)) * 100;
      input.style.setProperty('--fill', pct + '%');
    };

    input.addEventListener('input', () => { paint(); onChange(Number(input.value)); });
    paint();
  }

  function animateNumber(el, from, to, format, duration) {
    if (el._raf) cancelAnimationFrame(el._raf);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = format(to);
      return;
    }

    const start = performance.now();
    const span = duration || 550;

    const tick = (now) => {
      const p = Math.min((now - start) / span, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(from + (to - from) * eased);
      if (p < 1) el._raf = requestAnimationFrame(tick);
    };

    el._raf = requestAnimationFrame(tick);
  }

  // ------------------------------------------------- 1. Fashion Program Recommender

  function initMatchFinder() {
    const root = document.getElementById('matchFinder');
    if (!root) return;

    const img = (id, w) => id.startsWith('http') ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

    const PROGRAMS = [
      { name: 'B.Des in Fashion Design & Couture', area: 'Main Atelier Campus', board: 'Couture', fee: 4200, grades: ['early', 'primary', 'middle', 'senior'], strengths: ['academics', 'arts', 'boarding'], rating: 4.95, photo: 'photo-1558769132-cb1aea458c5e' },
      { name: 'Textile Design & Sustainable Weaving', area: 'Textile Research Wing', board: 'Textile', fee: 3600, grades: ['early', 'primary', 'middle'], strengths: ['academics', 'arts'], rating: 4.9, photo: 'photo-1524275539700-cf51138f679b' },
      { name: 'Pattern Making & Garment Construction', area: 'Tailoring Studio B', board: 'Pattern', fee: 3100, grades: ['primary', 'middle', 'senior'], strengths: ['sports', 'arts', 'boarding'], rating: 4.88, photo: 'photo-1556905055-8f358a7a47b2' },
      { name: 'Luxury Fashion Styling & Editorial', area: 'Runway & Media Wing', board: 'Styling', fee: 2950, grades: ['early', 'primary', 'middle', 'senior'], strengths: ['arts', 'academics'], rating: 4.92, photo: 'photo-1509631179647-0177331693ae' },
      { name: 'Fashion Illustration & 3D CLO CAD', area: 'Digital Design Lab', board: 'Couture', fee: 2450, grades: ['early', 'primary'], strengths: ['academics', 'transport'], rating: 4.82, photo: 'photo-1512436991641-6745cdb1723f' },
      { name: 'Bridal & Eveningwear Atelier Diploma', area: 'Main Atelier Campus', board: 'Couture', fee: 3900, grades: ['middle', 'senior'], strengths: ['sports', 'boarding'], rating: 4.91, photo: 'photo-1490481651871-ab68de25d43d' }
    ];

    const out = readouts(root);
    const budgetInput = root.querySelector('#budgetRange');
    let budget = Number(budgetInput.value);

    const score = (program, state) => {
      let points = 68;
      if (state.board.length) points += state.board.includes(program.board) ? 22 : -12;
      const headroom = (budget - program.fee) / budget;
      points += Math.max(-15, Math.min(15, headroom * 20));
      points += (program.rating - 4.5) * 10;
      return Math.max(25, Math.min(99, Math.round(points)));
    };

    const render = (state) => {
      const matches = PROGRAMS
        .filter(s => s.fee <= budget)
        .filter(s => !state.board.length || state.board.includes(s.board))
        .map(s => ({ program: s, match: score(s, state) }))
        .sort((a, b) => b.match - a.match);

      out.board.textContent = state.board.length ? state.board.join(', ') : 'All Disciplines';
      out.priorities.textContent = state.priority.length
        ? state.priority.length + ' selected'
        : 'Pick any';
      out.budget.textContent = money(budget);
      out.count.textContent = matches.length === 1
        ? '1 Program Match'
        : matches.length + ' Program Matches';

      if (!matches.length) {
        out.stage.innerHTML =
          '<div class="empty-state"><i class="ph ph-scissors" style="font-size:1.75rem;display:block;margin-bottom:.5rem;"></i>' +
          'No fashion programs fit that semester tuition ceiling. Increase your tuition budget slider.</div>';
        return;
      }

      const [top, ...rest] = matches;

      const hero = `
        <a class="match-hero" href="services.html">
          <img src="${img(top.program.photo, 800)}" alt="${escapeHTML(top.program.name)}">
          <div class="match-hero-top">
            <span class="match-hero-board">${escapeHTML(top.program.board)}</span>
            <div class="match-score" style="--score:${top.match};">
              <span>${top.match}%<small>MATCH</small></span>
            </div>
          </div>
          <div class="match-hero-body">
            <h3>${escapeHTML(top.program.name)}</h3>
            <div class="match-hero-meta">
              <span><i class="ph-fill ph-map-pin"></i> ${escapeHTML(top.program.area)}</span>
              <span><i class="ph-fill ph-star" style="color:#C5A46D;"></i> ${top.program.rating}</span>
              <span><i class="ph ph-graduation-cap"></i> ${money(top.program.fee)}/term</span>
            </div>
          </div>
        </a>`;

      const runners = rest.slice(0, 2).map(({ program, match }) => `
        <a class="match-runner" href="services.html">
          <img src="${img(program.photo, 200)}" alt="${escapeHTML(program.name)}" loading="lazy">
          <div class="match-runner-main">
            <div class="name">${escapeHTML(program.name)}</div>
            <div class="meta">${escapeHTML(program.board)} &middot; ${escapeHTML(program.area)} &middot; ${money(program.fee)}</div>
          </div>
          <span class="pct">${match}%</span>
        </a>
      `).join('');

      out.stage.innerHTML = hero + (runners ? `<div class="match-runners">${runners}</div>` : '');
    };

    const state = chipGroups(root, render);
    rangeControl(budgetInput, (value) => { budget = value; render(state); });
    render(state);
  }

  // ---------------------------------------------- 2. Tuition & Studio Fee Estimator

  function initCostEstimator() {
    const root = document.getElementById('costEstimator');
    if (!root) return;

    const BOARDS = {
      cbse: { label: 'Couture Design', tuition: 3800 },
      icse: { label: 'Textile & Print', tuition: 3400 },
      ib: { label: 'Pattern & Draping', tuition: 3100 },
      state: { label: 'Fashion Styling', tuition: 2800 }
    };

    const GRADES = {
      primary: { label: 'Certificate (6 Mo)', factor: 1.00 },
      middle: { label: 'Diploma (1 Yr)', factor: 1.25 },
      senior: { label: 'B.Des Degree (3 Yr)', factor: 1.50 }
    };

    const CITIES = {
      metro: { label: 'Full-Time Studio', factor: 1.00 },
      tier2: { label: 'Hybrid Atelier', factor: 0.88 },
      tier3: { label: 'Weekend Intensive', factor: 0.72 }
    };

    const ADDONS = {
      transport: { label: 'CLO 3D & CAD Suite', cost: 240 },
      meals: { label: 'Runway Jury Pass', cost: 180 },
      boarding: { label: 'Lookbook Shoot', cost: 150 }
    };

    const SEGMENTS = [
      { key: 'tuition', label: 'Program Tuition', color: '#651C32' },
      { key: 'admission', label: 'Atelier Sewing Kit', color: '#C5A46D' },
      { key: 'materials', label: 'Textile Allowance', color: '#D9A6A8' },
      { key: 'addons', label: 'Studio Add-ons', color: '#292326' }
    ];

    const out = readouts(root);
    const siblingInput = root.querySelector('#siblingRange');
    let semesters = Number(siblingInput ? siblingInput.value : 1);
    let lastTotal = 0;

    const render = (state) => {
      const board = BOARDS[state.board] || BOARDS.cbse;
      const grade = GRADES[state.grade] || GRADES.primary;
      const city = CITIES[state.city] || CITIES.metro;
      const scale = grade.factor * city.factor;

      const parts = {
        tuition: board.tuition * scale,
        admission: 320,
        materials: 260,
        addons: state.addon ? state.addon.reduce((sum, key) => sum + (ADDONS[key] ? ADDONS[key].cost : 0), 0) : 0
      };

      const perSemester = Object.values(parts).reduce((a, b) => a + b, 0);

      const multipliers = [1, 0.92, 0.86, 0.80].slice(0, semesters);
      const gross = perSemester * semesters;
      const total = perSemester * multipliers.reduce((a, b) => a + b, 0);
      const savings = gross - total;

      out.board.textContent = board.label;
      out.grade.textContent = grade.label;
      out.city.textContent = city.label;
      if (out.children) out.children.textContent = String(semesters);
      if (out.addons) out.addons.textContent = state.addon && state.addon.length
        ? state.addon.map(k => ADDONS[k] ? ADDONS[k].label : k).join(', ')
        : 'None';

      animateNumber(out.total, lastTotal, total, money, 600);
      lastTotal = total;

      if (out.permonth) out.permonth.textContent = `Includes industrial sewing lab access, dress forms & textile library across ${semesters} semester(s).`;

      out.bar.innerHTML = SEGMENTS
        .map(seg => `<div class="cost-seg" style="background:${seg.color};" data-key="${seg.key}"></div>`)
        .join('');

      requestAnimationFrame(() => {
        out.bar.querySelectorAll('.cost-seg').forEach(el => {
          const share = gross ? (parts[el.dataset.key] * semesters / gross) * 100 : 0;
          el.style.width = share + '%';
        });
      });

      out.legend.innerHTML = SEGMENTS.map(seg => `
        <div class="cost-legend-item">
          <span class="cost-swatch" style="background:${seg.color};"></span>
          <span>${seg.label}</span>
          <span class="amount">${money(parts[seg.key] * semesters)}</span>
        </div>
      `).join('');

      out.savings.textContent = '−' + money(savings);
      out.savingsnote.textContent = semesters > 1
        ? `${semesters - 1} multi-term merit grant applied`
        : 'Enroll in multiple terms to unlock up to 20% merit grant';
    };

    const state = chipGroups(root, render);
    rangeControl(siblingInput, (value) => { semesters = value; render(state); });
    render(state);
  }

  // ------------------------------------------------ 3. Institute Heritage Milestones

  function initMilestoneTimeline() {
    const root = document.getElementById('milestoneTimeline');
    if (!root) return;

    const MILESTONES = {
      2019: {
        title: 'Founding of the Fashion Atelier',
        body: 'Master couturiers and textile educators established Fashion Designing Institute with two draping studios, dedicating the curriculum to hands-on craftsmanship and contemporary silhouette innovation.',
        stats: [['2', 'draping studios'], ['45', 'founding fellows']],
        img: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80',
        alt: 'Fashion design atelier studio'
      },
      2021: {
        title: 'International Runway & Milan Exchange',
        body: 'Launched our annual student runway showcase and international studio exchange, connecting graduating designers with European pattern houses and luxury editorial directors.',
        stats: [['18', 'runway collections'], ['100%', 'jury placement']],
        img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
        alt: 'Student fashion runway showcase'
      },
      2023: {
        title: 'Sustainable Textile & 3D CLO Lab',
        body: 'Opened our zero-waste textile dye laboratory and digital 3D garment simulation suite, empowering students to prototype couture silhouettes sustainably.',
        stats: [['1,200+', 'graduates placed'], ['4.96/5', 'industry rating']],
        img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80',
        alt: 'Garment construction and textile workshop'
      },
      2026: {
        title: 'Global Fashion Design Campus',
        body: 'Today Fashion Designing Institute hosts six specialized studios, an archival textile library, and an integrated student portfolio and runway registration portal.',
        stats: [['6', 'specialized ateliers'], ['96%', 'career placement']],
        img: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
        alt: 'Contemporary fashion exhibition gallery'
      }
    };

    const nodes = Array.from(root.querySelectorAll('.milestone-node'));
    const out = readouts(root);

    const select = (year, focus) => {
      const data = MILESTONES[year];
      if (!data) return;

      nodes.forEach(n => {
        const on = n.dataset.year === String(year);
        n.setAttribute('aria-selected', String(on));
        n.tabIndex = on ? 0 : -1;
        if (on && focus) n.focus();
      });

      out.copy.innerHTML = `
        <span class="eyebrow">${year}</span>
        <h3>${escapeHTML(data.title)}</h3>
        <p style="color: var(--color-text-secondary); font-size: 1.05rem; line-height: 1.7;">${escapeHTML(data.body)}</p>
        <div class="milestone-stats">
          ${data.stats.map(([num, cap]) => `
            <div class="milestone-stat">
              <div class="num">${escapeHTML(num)}</div>
              <div class="cap">${escapeHTML(cap)}</div>
            </div>
          `).join('')}
        </div>
      `;

      out.figure.innerHTML =
        `<img src="${data.img}" alt="${escapeHTML(data.alt)}" loading="lazy">`;

      out.copy.style.animation = 'none';
      void out.copy.offsetWidth;
      out.copy.style.animation = '';
    };

    nodes.forEach(node => {
      node.addEventListener('click', () => select(node.dataset.year, false));

      node.addEventListener('keydown', (e) => {
        const i = nodes.indexOf(node);
        let next = null;

        if (e.key === 'ArrowRight') next = nodes[(i + 1) % nodes.length];
        else if (e.key === 'ArrowLeft') next = nodes[(i - 1 + nodes.length) % nodes.length];
        else if (e.key === 'Home') next = nodes[0];
        else if (e.key === 'End') next = nodes[nodes.length - 1];
        else return;

        e.preventDefault();
        select(next.dataset.year, true);
      });
    });

    const initial = nodes.find(n => n.getAttribute('aria-selected') === 'true') || nodes[0];
    if (initial) select(initial.dataset.year, false);
  }

  // ------------------------------------------------------------------ boot

  document.addEventListener('DOMContentLoaded', () => {
    initMatchFinder();
    initCostEstimator();
    initMilestoneTimeline();
  });
})();
