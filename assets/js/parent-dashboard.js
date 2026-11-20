/*
  Fashion Designing Institute - Student Learning & Portfolio Dashboard Scripts

  The dashboard is a single document containing many views. A hash router
  swaps which one is on screen, so each sidebar entry behaves like its own
  page (deep-linkable, back/forward aware) without a separate HTML file.
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- Sidebar Toggle (Mobile) ---
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarClose = document.getElementById('sidebarClose');
  const dashboardSidebar = document.getElementById('dashboardSidebar');

  if (sidebarToggle && dashboardSidebar) {
    sidebarToggle.addEventListener('click', () => {
      dashboardSidebar.classList.toggle('open');
    });

    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        dashboardSidebar.classList.remove('open');
      });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        if (!dashboardSidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
          dashboardSidebar.classList.remove('open');
        }
      }
    });
  }

  // ------------------------------------------------------------- view router

  const views = Array.from(document.querySelectorAll('.dash-view'));

  if (views.length) {
    const navItems = Array.from(document.querySelectorAll('[data-view]'));
    const titleEl = document.getElementById('dashTitle');
    const baseTitle = 'Atelia';
    const names = views.map(v => v.id.replace(/^view-/, ''));
    const DEFAULT_VIEW = names[0];

    const show = (name, opts) => {
      const target = names.includes(name) ? name : DEFAULT_VIEW;
      const section = document.getElementById('view-' + target);

      views.forEach(v => v.classList.toggle('is-active', v === section));

      const navTarget = section.dataset.nav || target;

      navItems.forEach(a => {
        const on = a.dataset.view === navTarget;
        a.classList.toggle('active', on);
        if (on) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });

      const label = section.dataset.title || target;
      const decoded = new DOMParser().parseFromString(label, 'text/html').body.textContent;
      if (titleEl) titleEl.textContent = decoded;
      document.title = decoded + ' | ' + baseTitle;

      if (dashboardSidebar) dashboardSidebar.classList.remove('open');

      if (opts && opts.userInitiated) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        section.focus({ preventScroll: true });
      }
    };

    const fromHash = (userInitiated) => {
      show((location.hash || '').replace(/^#/, ''), { userInitiated: userInitiated });
    };

    window.addEventListener('hashchange', () => fromHash(true));
    fromHash(false);

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const name = link.getAttribute('href').slice(1);
      if (!names.includes(name)) return;

      if (location.hash === '#' + name) {
        e.preventDefault();
        show(name, { userInitiated: true });
      }
    });
  }

  // ------------------------------------------------- course / event filter tabs

  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const key = group.dataset.filterGroup;
    const tabs = Array.from(group.querySelectorAll('.filter-tab'));
    const body = document.querySelector(`[data-filter-target="${key}"]`);
    const empty = document.querySelector(`[data-filter-empty="${key}"]`);
    if (!body) return;

    const rows = Array.from(body.querySelectorAll('tr'));

    group.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;

      tabs.forEach(t => t.setAttribute('aria-pressed', String(t === tab)));

      const want = tab.dataset.filter;
      let shown = 0;

      rows.forEach(row => {
        const match = want === 'all' || row.dataset.status === want;
        row.hidden = !match;
        if (match) shown++;
      });

      if (empty) empty.hidden = shown > 0;
    });
  });

  // ------------------------------------------------------------- faculty & studio messages

  const threadBody = document.querySelector('[data-thread-body]');

  if (threadBody) {
    const THREADS = {
      oakridge: {
        name: 'Prof. Elena Vance — Couture Studio',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        messages: [
          { from: 'them', text: 'Good morning Aria! Your draped silk bodice toile for Module 04 has been reviewed by the atelier faculty.', at: 'Mon 09:14' },
          { from: 'them', text: 'Your neckline balance and bias-cut seam finish are runway-ready. Please upload final lookbook photos before Friday.', at: 'Mon 09:15' },
          { from: 'me', text: 'Thank you Professor! I am photographing the finished look in Studio B today and will upload the high-res plates tonight.', at: 'Mon 11:02' },
          { from: 'them', text: 'Wonderful. I have also nominated your capsule piece for the Autumn Graduate Runway Jury.', at: '2h ago' }
        ]
      },
      stmarys: {
        name: 'Prof. Julian Moreau — Textile Lab',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        messages: [
          { from: 'them', text: 'Welcome to the Sustainable Botanical Dyeing Workshop! Your indigo & madder root swatch kit is ready at Bench 04.', at: 'Oct 15' },
          { from: 'them', text: 'Bring your raw silk organza yardage for tomorrow’s 2:00 PM mordant lab.', at: '1d ago' }
        ]
      },
      dps: {
        name: 'Runway & Events Office',
        avatar: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=200&q=80',
        messages: [
          { from: 'me', text: 'Hello, could you confirm my model fitting slot for the Autumn Couture Showcase?', at: 'Oct 12' },
          { from: 'them', text: 'Confirmed! Your backstage fitting is scheduled for Nov 22 at 3:30 PM in Runway Hall A.', at: 'Oct 13' },
          { from: 'them', text: 'Your digital runway pass has been added to your Event Registrations tab.', at: '3d ago' }
        ]
      }
    };

    const items = Array.from(document.querySelectorAll('.msg-item[data-thread]'));
    const nameEl = document.querySelector('[data-thread-name]');
    const avatarEl = document.querySelector('[data-thread-avatar]');
    const form = document.querySelector('[data-thread-form]');
    const input = document.querySelector('[data-thread-input]');

    let current = 'oakridge';

    const bubble = (msg) => {
      const el = document.createElement('div');
      el.className = 'msg-bubble' + (msg.from === 'me' ? ' is-mine' : '');
      el.textContent = msg.text;

      const stamp = document.createElement('span');
      stamp.className = 'stamp';
      stamp.textContent = msg.at;
      el.appendChild(stamp);

      return el;
    };

    const paint = () => {
      const thread = THREADS[current];
      threadBody.innerHTML = '';
      thread.messages.forEach(m => threadBody.appendChild(bubble(m)));
      threadBody.scrollTop = threadBody.scrollHeight;

      if (nameEl) nameEl.textContent = thread.name;
      if (avatarEl) avatarEl.src = thread.avatar;
    };

    items.forEach(item => {
      item.addEventListener('click', () => {
        current = item.dataset.thread;
        items.forEach(i => i.setAttribute('aria-pressed', String(i === item)));

        const dot = item.querySelector('.msg-unread-dot');
        if (dot) dot.remove();

        paint();
      });
    });

    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        THREADS[current].messages.push({ from: 'me', text: text, at: 'Just now' });
        input.value = '';
        paint();
      });
    }

    paint();
  }

  // ------------------------------------------------------- settings switches

  document.querySelectorAll('.switch[role="switch"]').forEach(sw => {
    sw.addEventListener('click', () => {
      sw.setAttribute('aria-pressed', sw.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    });
  });

  // --------------------------------------------------- saved projects / portfolio fav

  document.querySelectorAll('.shortlist-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.shortlist-card');
      if (!card) return;

      const removed = card.dataset.removed === 'true';
      card.dataset.removed = String(!removed);
      card.style.opacity = removed ? '' : '0.45';
      btn.innerHTML = removed
        ? '<i class="ph-fill ph-heart"></i>'
        : '<i class="ph ph-heart"></i>';
    });
  });

  // --------------------------------------------------- event registration toggle

  document.querySelectorAll('[data-event-register]').forEach(btn => {
    btn.addEventListener('click', () => {
      const registered = btn.getAttribute('data-registered') === 'true';
      btn.setAttribute('data-registered', String(!registered));
      if (!registered) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
        btn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Registered';
      } else {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        btn.innerHTML = 'Register for Event';
      }
    });
  });

  // --------------------------------------------------- course module completion toggle

  document.querySelectorAll('[data-module-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const done = btn.getAttribute('data-done') === 'true';
      btn.setAttribute('data-done', String(!done));
      const row = btn.closest('tr');
      const badge = row ? row.querySelector('.status-badge') : null;
      if (!done) {
        btn.textContent = 'Completed';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
        if (badge) {
          badge.className = 'status-badge status-admitted';
          badge.textContent = 'Completed';
        }
      } else {
        btn.textContent = 'Mark Complete';
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        if (badge) {
          badge.className = 'status-badge status-review';
          badge.textContent = 'In Progress';
        }
      }
    });
  });

  // --------------------------------------------------- portfolio image upload preview

  const portfolioForm = document.getElementById('portfolioUploadForm');
  const portfolioGrid = document.getElementById('portfolioProjectsGrid');
  const portfolioFileInput = document.getElementById('portfolioFileInput');

  if (portfolioForm && portfolioGrid && portfolioFileInput) {
    portfolioForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('portfolioTitleInput');
      const categoryInput = document.getElementById('portfolioCategoryInput');
      const title = (titleInput && titleInput.value.trim()) || 'Untitled Atelier Look';
      const category = (categoryInput && categoryInput.value) || 'Couture & Draping';
      const file = portfolioFileInput.files && portfolioFileInput.files[0];

      const addCard = (imgSrc) => {
        const card = document.createElement('div');
        card.className = 'shortlist-card';
        card.innerHTML = `
          <div class="shortlist-img">
            <img src="${imgSrc}" alt="${title.replace(/"/g, '&quot;')}">
            <button type="button" class="shortlist-fav" aria-label="Toggle favorite"><i class="ph-fill ph-heart"></i></button>
          </div>
          <div class="shortlist-body">
            <span class="badge-chip">${category}</span>
            <h4>${title.replace(/</g, '&lt;')}</h4>
            <p class="text-muted" style="font-size:0.85rem;">Uploaded in current browser session • Pending Faculty Review</p>
          </div>
        `;
        portfolioGrid.prepend(card);
        portfolioForm.reset();
        const existingDisplay = portfolioForm.querySelector('.file-name-display');
        if (existingDisplay) existingDisplay.remove();
      };

      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => addCard(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        addCard('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=700&q=80');
      }
    });
  }

  // --- File Input Filename Preview ---
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => {
    input.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        const fileName = this.files[0].name;
        const formGroup = this.closest('.form-group');
        if (formGroup) {
          let fileNameDisplay = formGroup.querySelector('.file-name-display');
          if (!fileNameDisplay) {
            fileNameDisplay = document.createElement('div');
            fileNameDisplay.className = 'file-name-display';
            fileNameDisplay.style.marginTop = '0.5rem';
            fileNameDisplay.style.fontSize = '0.875rem';
            fileNameDisplay.style.color = 'var(--color-status-admitted)';
            fileNameDisplay.innerHTML = `<i class="ph ph-check-circle"></i> ${fileName} ready for preview`;
            formGroup.appendChild(fileNameDisplay);
          } else {
            fileNameDisplay.innerHTML = `<i class="ph ph-check-circle"></i> ${fileName} ready for preview`;
          }
        }
      }
    });
  });

  // --- Profile Save Feedback ---
  const profileForm = document.getElementById('studentProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = document.getElementById('profileSaveStatus');
      if (note) {
        note.hidden = false;
        setTimeout(() => { note.hidden = true; }, 3500);
      }
    });
  }
});
