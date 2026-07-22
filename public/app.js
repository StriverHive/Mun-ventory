/* Mun-ventory — simple mobile-first inventory & product mix app */
(function () {
  'use strict';

  var UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'pack', 'bottle', 'can', 'tray', 'dozen', 'bag', 'carton'];
  var OTHER = '__other__';

  var ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4m0 0 4 4m-4-4L8 8"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4m0 0 4 4m-4-4L8 8"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 13.3 12.7 21a1.5 1.5 0 0 1-2.1 0l-7-7A1.5 1.5 0 0 1 3.2 13V5.2A2 2 0 0 1 5.2 3.2H13a1.5 1.5 0 0 1 1 .4l6.5 6.5a1.5 1.5 0 0 1 0 2.1Z"/><circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 5 5L19.5 7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.2v.1"/></svg>',
    select: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12 2.5 2.5L16 9"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><path d="M9 12h6M9 16h4"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2Z"/><path d="M12 6.5v13"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 6.5l4 4"/><path d="M4 20l1.2-4.2L16 5a2.1 2.1 0 0 1 3 3L8.2 18.8 4 20z"/></svg>',
    archive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1.5"/><path d="M5 8v10.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V8"/><path d="M12 11v6m0 0 2.5-2.5M12 17l-2.5-2.5"/></svg>',
    restore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1.5"/><path d="M5 8v10.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V8"/><path d="M12 17v-6m0 0 2.5 2.5M12 11l-2.5 2.5"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-3M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4"/></svg>',
  };

  var S = {
    tab: 'mix',
    stock: [],            // server-filtered stock list (current view)
    menu: [],             // server-filtered menu list (current view)
    mixList: [],          // server-filtered [{_id,name,category,status,itemCount}]
    mixCounts: { all: 0, not_done: 0, draft: 0, confirmed: 0 },
    cats: { stock: [], menu: [] }, // all categories (with .count and .archived)
    search: { mix: '', stock: '', menu: '' },
    catFilter: { mix: '', stock: '', menu: '' }, // '' = all categories
    mixFilter: 'all',     // status filter
    editor: null,          // { menuItem, items:[{stockItemId, qty}], allStock, status, notes, dirty, stockSearch }
    select: { active: false, kind: null, ids: {} }, // multi-select bulk-edit mode
    deferredPrompt: null,
    pin: '',
  };

  var $ = function (sel) { return document.querySelector(sel); };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg, isError) {
    var t = $('#toast');
    t.className = isError ? 'error' : 'ok';
    t.innerHTML = '<span class="toast-ic">' + (isError ? ICON.alert : ICON.check) + '</span><span>' + esc(msg) + '</span>';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.add('hidden'); }, 2500);
  }

  /* ---------- centered confirm dialog ---------- */

  function confirmDialog(opts, onYes) {
    var d = $('#dialog');
    d.innerHTML =
      '<div class="dialog-title">' + esc(opts.title) + '</div>' +
      (opts.body ? '<div class="dialog-body">' + esc(opts.body) + '</div>' : '') +
      '<div class="dialog-actions">' +
        '<button class="btn btn-outline" data-dlg="cancel">' + esc(opts.cancel || 'Cancel') + '</button>' +
        '<button class="btn ' + (opts.danger ? 'btn-danger-solid' : 'btn-primary') + '" data-dlg="ok">' + esc(opts.confirm || 'OK') + '</button>' +
      '</div>';
    d.classList.remove('hidden');
    $('#dialog-backdrop').classList.remove('hidden');
    function close() {
      d.classList.add('hidden');
      $('#dialog-backdrop').classList.add('hidden');
      d.innerHTML = '';
      $('#dialog-backdrop').onclick = null;
    }
    d.querySelector('[data-dlg="cancel"]').onclick = close;
    d.querySelector('[data-dlg="ok"]').onclick = function () { close(); onYes(); };
    $('#dialog-backdrop').onclick = close;
  }

  function promptDialog(opts, onSubmit) {
    var d = $('#dialog');
    d.innerHTML =
      '<div class="dialog-title">' + esc(opts.title) + '</div>' +
      '<input type="text" id="dlg-input" maxlength="' + (opts.maxlength || 60) + '" placeholder="' + esc(opts.placeholder || '') + '" value="' + esc(opts.value || '') + '" style="margin-top:14px">' +
      '<div class="dialog-actions">' +
        '<button class="btn btn-outline" data-dlg="cancel">Cancel</button>' +
        '<button class="btn btn-primary" data-dlg="ok">' + esc(opts.confirm || 'Save') + '</button>' +
      '</div>';
    d.classList.remove('hidden');
    $('#dialog-backdrop').classList.remove('hidden');
    var input = $('#dlg-input');
    setTimeout(function () { input.focus(); input.select(); }, 40);
    function close() {
      d.classList.add('hidden');
      $('#dialog-backdrop').classList.add('hidden');
      d.innerHTML = '';
      $('#dialog-backdrop').onclick = null;
    }
    function submit() { var v = input.value.trim(); close(); onSubmit(v); }
    d.querySelector('[data-dlg="cancel"]').onclick = close;
    d.querySelector('[data-dlg="ok"]').onclick = submit;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    $('#dialog-backdrop').onclick = close;
  }

  /* ---------- api ---------- */

  function api(path, opts) {
    opts = opts || {};
    return fetch('/api' + path, {
      method: opts.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }).then(function (res) {
      if (res.status === 401 && path !== '/login') {
        showLogin();
        throw new Error('Locked');
      }
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Something went wrong');
        return data;
      });
    });
  }

  /* ---------- login ---------- */

  var PIN_LEN = 4;

  function showLogin() {
    $('#app').classList.add('hidden');
    $('#login-screen').classList.remove('hidden');
    S.pin = '';
    clearPinError();
    renderPinDots();
  }

  function clearPinError() {
    $('#login-error').textContent = '';
    $('#pin-dots').classList.remove('err');
  }

  function renderPinDots() {
    var html = '';
    for (var i = 0; i < PIN_LEN; i++) {
      html += '<span class="dot' + (i < S.pin.length ? ' filled' : '') + '"></span>';
    }
    $('#pin-dots').innerHTML = html;
  }

  function pinInput(k) {
    if (k === 'back') { S.pin = S.pin.slice(0, -1); clearPinError(); renderPinDots(); return; }
    if (S.pin.length >= PIN_LEN) return;
    S.pin += k;
    clearPinError();
    renderPinDots();
    if (S.pin.length === PIN_LEN) tryUnlock();
  }

  function tryUnlock() {
    if (!S.pin || tryUnlock._busy) return;
    tryUnlock._busy = true;
    $('#unlock-btn').disabled = true;
    api('/login', { method: 'POST', body: { pin: S.pin } })
      .then(function () {
        S.pin = '';
        boot();
      })
      .catch(function (err) {
        var dots = $('#pin-dots');
        dots.classList.add('err');
        renderPinDots();
        dots.classList.remove('shake');
        void dots.offsetWidth;
        dots.classList.add('shake');
        $('#login-error').textContent = err.message === 'Locked' ? 'Wrong PIN — try again' : err.message;
        setTimeout(function () { S.pin = ''; renderPinDots(); }, 500);
      })
      .then(function () {
        tryUnlock._busy = false;
        $('#unlock-btn').disabled = false;
      });
  }

  document.querySelector('.keypad').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-key]');
    if (!btn) return;
    pinInput(btn.getAttribute('data-key'));
  });
  $('#unlock-btn').addEventListener('click', tryUnlock);
  document.addEventListener('keydown', function (e) {
    if ($('#login-screen').classList.contains('hidden')) return;
    if (/^[0-9]$/.test(e.key)) pinInput(e.key);
    else if (e.key === 'Backspace') pinInput('back');
    else if (e.key === 'Enter') tryUnlock();
  });

  /* ---------- boot / data ---------- */

  function boot() {
    return refreshAll().then(function () {
      $('#login-screen').classList.add('hidden');
      $('#app').classList.remove('hidden');
      render();
    }).catch(function (err) {
      if (err.message !== 'Locked') toast(err.message, true);
    });
  }

  function qstr(params) {
    var parts = [];
    Object.keys(params).forEach(function (k) {
      if (params[k]) parts.push(k + '=' + encodeURIComponent(params[k]));
    });
    return parts.length ? '?' + parts.join('&') : '';
  }

  // Monotonic token so a slow/out-of-order list response never overwrites a newer one
  var loadSeq = 0;

  function loadCats() {
    return Promise.all([api('/categories?type=stock'), api('/categories?type=menu')])
      .then(function (r) { S.cats.stock = r[0]; S.cats.menu = r[1]; });
  }
  function loadStock() {
    var t = ++loadSeq;
    return api('/stock-items' + qstr({ category: S.catFilter.stock, q: S.search.stock }))
      .then(function (items) { if (t === loadSeq) S.stock = items; });
  }
  function loadMenu() {
    var t = ++loadSeq;
    return api('/menu-items' + qstr({ category: S.catFilter.menu, q: S.search.menu }))
      .then(function (items) { if (t === loadSeq) S.menu = items; });
  }
  function loadMixList() {
    var t = ++loadSeq;
    return api('/mix-list' + qstr({ category: S.catFilter.mix, q: S.search.mix, status: S.mixFilter === 'all' ? '' : S.mixFilter }))
      .then(function (r) { if (t === loadSeq) { S.mixList = r.items; S.mixCounts = r.counts; } });
  }
  function loadCurrent() {
    if (S.tab === 'mix') return loadMixList();
    if (S.tab === 'stock') return loadStock();
    return loadMenu();
  }
  // categories + the current tab's list
  function refreshAll() {
    return loadCats().then(loadCurrent);
  }

  // reload the current list from the server, then update only the list body
  function reloadList(after) {
    return loadCurrent().then(function () {
      if (S.editor) return;
      if (S.tab === 'mix') renderMixMain();
      else if (S.select.active && S.select.kind === S.tab) renderSelectMain(S.tab);
      else renderItemMain(S.tab);
      if (after) after();
    }).catch(function (err) { toast(err.message, true); });
  }

  function filtersActive(kind) {
    if (kind === 'mix') return !!(S.search.mix || S.catFilter.mix || S.mixFilter !== 'all');
    return !!(S.search[kind] || S.catFilter[kind]);
  }

  var STATUS_LABEL = { draft: 'Draft', confirmed: 'Confirmed', not_done: 'Not done' };
  var STATUS_BADGE = { draft: 'b-draft', confirmed: 'b-confirmed', not_done: 'b-notdone' };
  var STATUS_CARD = { draft: 'st-draft', confirmed: 'st-confirmed', not_done: '' };

  /* ---------- render ---------- */

  function render() {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === S.tab);
    });
    if (S.editor) return renderEditor();
    if (S.tab === 'mix') renderMixList();
    else renderItemList(S.tab);
  }

  // Category filter chips (only categories that have items are shown).
  // The mix page filters menu items, so it uses the menu category list.
  function catChipsHtml(kind) {
    var catKey = kind === 'mix' ? 'menu' : kind;
    var cats = S.cats[catKey].filter(function (c) { return c.count > 0; });
    if (!cats.length) return '';
    var active = S.catFilter[kind];
    var chips = '<button class="chip cat-chip' + (active === '' ? ' active' : '') + '" data-action="cat-filter" data-kind="' + kind + '" data-val="">All categories</button>';
    chips += cats.map(function (c) {
      return '<button class="chip cat-chip' + (active === c.name ? ' active' : '') + '" data-action="cat-filter" data-kind="' + kind + '" data-val="' + esc(c.name) + '">' +
        esc(c.name) + '</button>';
    }).join('');
    return '<div class="chips cat-chips">' + chips + '</div>';
  }

  /* ----- product mix list ----- */

  function renderMixList() {
    $('#view').innerHTML =
      searchbarHtml('mix-search', 'Search menu items…', S.search.mix) +
      '<div id="list-main"></div>';
    bindSearch('mix-search', 'mix');
    renderMixMain();
  }

  function renderMixMain() {
    var c = S.mixCounts;
    var statusChips = [
      ['all', 'All', c.all],
      ['not_done', 'Not done', c.not_done],
      ['draft', 'Drafts', c.draft],
      ['confirmed', 'Confirmed', c.confirmed],
    ].map(function (x) {
      return '<button class="chip' + (S.mixFilter === x[0] ? ' active' : '') + '" data-action="mix-filter" data-val="' + x[0] + '">' +
        x[1] + ' <span class="n">' + x[2] + '</span></button>';
    }).join('');

    var cards = S.mixList.map(function (m) {
      var st = m.status;
      var sub = [m.category, m.itemCount ? m.itemCount + ' ingredient' + (m.itemCount > 1 ? 's' : '') : null]
        .filter(Boolean).join(' • ') || 'Tap to build the mix';
      return '<button class="item-card mix-card ' + STATUS_CARD[st] + '" data-action="open-mix" data-id="' + m._id + '">' +
        '<div class="ic-main"><div class="ic-name">' + esc(m.name) + '</div><div class="ic-sub">' + esc(sub) + '</div></div>' +
        '<span class="badge ' + STATUS_BADGE[st] + '">' + STATUS_LABEL[st] + '</span></button>';
    }).join('');

    var empty = '';
    if (!S.mixList.length) {
      empty = filtersActive('mix')
        ? emptyState('search', 'Nothing matches', 'Try a different search, category or status.')
        : emptyState('clipboard', 'No product mixes yet', 'Add menu items in the Menu tab — each one shows up here, ready to fill in.');
    }

    $('#list-main').innerHTML =
      '<div class="chips">' + statusChips + '</div>' +
      catChipsHtml('mix') +
      cards + empty;
  }

  function searchbarHtml(id, placeholder, value) {
    return '<div class="searchbar">' + ICON.search +
      '<input type="search" id="' + id + '" placeholder="' + placeholder + '" value="' + esc(value) + '"></div>';
  }

  function emptyState(icon, title, sub) {
    return '<div class="empty"><div class="empty-ic">' + ICON[icon] + '</div>' +
      '<div class="empty-title">' + esc(title) + '</div>' +
      '<div class="empty-sub">' + esc(sub) + '</div></div>';
  }

  /* ----- mix editor ----- */

  function openMix(menuItemId) {
    var mi = S.mixList.find(function (m) { return String(m._id) === String(menuItemId); });
    if (!mi) return;
    Promise.all([
      api('/product-mixes/' + menuItemId),
      api('/stock-items'), // full stock catalog for the editor's ingredient search
    ]).then(function (r) {
      var mix = r[0];
      S.editor = {
        menuItem: { _id: mi._id, name: mi.name, category: mi.category },
        allStock: r[1],
        items: mix ? mix.items.map(function (i) { return { stockItemId: String(i.stockItemId), qty: String(i.qty) }; }) : [],
        status: mix ? mix.status : 'not_done',
        notes: mix && mix.notes ? mix.notes : '',
        stockSearch: '',
        dirty: false,
      };
      render();
      window.scrollTo(0, 0);
    }).catch(function (err) { toast(err.message, true); });
  }

  function stockById(id) {
    var arr = (S.editor && S.editor.allStock) || [];
    return arr.find(function (s) { return String(s._id) === String(id); });
  }

  function renderEditor() {
    var ed = S.editor;
    var st = ed.status;

    var rows = ed.items.map(function (it, idx) {
      var s = stockById(it.stockItemId);
      return '<div class="mix-row">' +
        '<div class="mr-name">' + esc(s ? s.name : '(deleted item)') + '</div>' +
        '<input type="number" inputmode="decimal" min="0" step="any" placeholder="Qty" value="' + esc(it.qty) + '" data-action="mix-qty" data-idx="' + idx + '">' +
        '<span class="mr-unit">' + esc(s ? s.consumptionUnit : '') + '</span>' +
        '<button class="mr-del" data-action="mix-remove" data-idx="' + idx + '" aria-label="Remove">' + ICON.x + '</button>' +
        '</div>';
    }).join('');

    var q = ed.stockSearch.trim().toLowerCase();
    var results = '';
    if (q) {
      var chosen = {};
      ed.items.forEach(function (i) { chosen[i.stockItemId] = true; });
      var found = ed.allStock.filter(function (s) {
        return !chosen[String(s._id)] && s.name.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 12);
      results = '<div class="stock-results">' + (found.length
        ? found.map(function (s) {
            return '<button data-action="mix-add" data-id="' + s._id + '">' +
              '<span class="sr-plus">' + ICON.plus + '</span>' +
              '<span class="sr-main"><span class="sr-name">' + esc(s.name) + '</span>' +
              '<div class="sr-sub">' + esc([s.category, s.consumptionUnit ? 'used in ' + s.consumptionUnit : ''].filter(Boolean).join(' · ')) + '</div></span></button>';
          }).join('')
        : '<div class="sr-empty">No stock items found</div>') + '</div>';
    }

    var shareBtn = st !== 'not_done' && !ed.dirty
      ? '<button class="share-btn" data-action="share-card" title="Share as image" aria-label="Share">' + ICON.share + '</button>' : '';

    var emptyMix = '<div class="mix-empty"><div class="empty-ic">' + ICON.search + '</div>' +
      '<div class="empty-title">No ingredients yet</div>' +
      '<div class="empty-sub">Search below to add the first stock item to this mix.</div></div>';

    $('#view').innerHTML =
      '<div class="editor-head">' +
        '<button class="back-btn" data-action="mix-back" aria-label="Back">' + ICON.chevronLeft + '</button>' +
        '<div class="editor-title"><h2>' + esc(ed.menuItem.name) + '</h2>' +
        '<div class="ic-sub">' + esc(ed.menuItem.category || 'Product mix') + '</div></div>' +
        '<span class="badge ' + STATUS_BADGE[st] + '">' + STATUS_LABEL[st] + '</span>' + shareBtn +
      '</div>' +
      (rows ? '<div class="mix-rows">' + rows + '</div>' : emptyMix) +
      '<div class="section-label">Add ingredient</div>' +
      searchbarHtml('stock-search', 'Search stock items…', ed.stockSearch) +
      results +
      '<label class="mix-note-label">Note (optional)</label>' +
      '<textarea id="mix-notes" data-action="mix-notes" maxlength="1000" placeholder="e.g. prep steps, cooking tips, allergen info…">' + esc(ed.notes || '') + '</textarea>' +
      '<div style="height:72px"></div>' +
      '<div class="editor-actions">' +
        '<button class="btn btn-yellow" data-action="mix-save" data-status="draft">Save Draft</button>' +
        '<button class="btn btn-green" data-action="mix-save" data-status="confirmed"' + (ed.items.length ? '' : ' disabled') + '>Confirm</button>' +
      '</div>';

    var si = $('#stock-search');
    si.addEventListener('input', function () {
      S.editor.stockSearch = si.value;
      var pos = si.selectionStart;
      renderEditor();
      var nsi = $('#stock-search');
      nsi.focus();
      try { nsi.setSelectionRange(pos, pos); } catch (e) {}
    });
  }

  function saveMix(status) {
    var ed = S.editor;
    var items = [];
    for (var i = 0; i < ed.items.length; i++) {
      var qty = Number(ed.items[i].qty);
      if (!ed.items[i].qty || !isFinite(qty) || qty <= 0) {
        var s = stockById(ed.items[i].stockItemId);
        return toast('Enter a quantity for "' + (s ? s.name : 'item') + '"', true);
      }
      items.push({ stockItemId: ed.items[i].stockItemId, qty: qty });
    }
    if (items.length === 0 && ed.status === 'not_done') return toast('Add at least one stock item', true);

    api('/product-mixes/' + ed.menuItem._id, { method: 'PUT', body: { items: items, status: status, notes: ed.notes || '' } })
      .then(function (r) {
        return loadMixList().then(function () {
          if (r.cleared) {
            toast('Mix cleared');
            S.editor = null;
          } else {
            toast(status === 'confirmed' ? 'Confirmed' : 'Saved as draft');
            S.editor.status = status;
            S.editor.dirty = false;
          }
          render();
        });
      })
      .catch(function (err) { toast(err.message, true); });
  }

  /* ----- stock / menu lists ----- */

  function itemCardHtml(kind, i) {
    var bits = [i.category];
    if (kind === 'stock') bits.push('Buy: ' + (i.purchaseUnit || '—'), 'Use: ' + (i.consumptionUnit || '—'));
    else bits.push(i.consumptionUnit ? 'Unit: ' + i.consumptionUnit : null);
    var sub = esc(bits.filter(Boolean).join(' • '));
    return '<button class="item-card" data-action="edit-item" data-kind="' + kind + '" data-id="' + i._id + '">' +
      '<div class="ic-main"><div class="ic-name">' + esc(i.name) + '</div><div class="ic-sub">' + sub + '</div></div>' +
      '<span class="ic-chev">' + ICON.chevronRight + '</span></button>';
  }

  function renderItemList(kind) {
    if (S.select.active && S.select.kind === kind) return renderSelectMode(kind);
    var label = kind === 'stock' ? 'stock' : 'menu';
    $('#view').innerHTML =
      searchbarHtml(kind + '-search', 'Search ' + label + ' items…', S.search[kind]) +
      '<div class="list-actions">' +
        '<button class="btn btn-outline btn-sm" data-action="bulk-open" data-kind="' + kind + '">' + ICON.upload + ' Bulk Upload</button>' +
        '<button class="btn btn-outline btn-sm" data-action="bulk-export" data-kind="' + kind + '">' + ICON.download + ' Export</button>' +
        '<button class="btn btn-outline btn-sm" data-action="cats-open" data-kind="' + kind + '">' + ICON.tag + ' Categories</button>' +
        '<button class="btn btn-outline btn-sm" data-action="select-start" data-kind="' + kind + '">' + ICON.select + ' Select</button>' +
      '</div>' +
      '<div id="list-main"></div>' +
      '<button class="fab" data-action="add-item" data-kind="' + kind + '" aria-label="Add">' + ICON.plus + '</button>';
    bindSearch(kind + '-search', kind);
    renderItemMain(kind);
  }

  function renderItemMain(kind) {
    var items = kind === 'stock' ? S.stock : S.menu;
    var label = kind === 'stock' ? 'stock' : 'menu';
    var cards = items.map(function (i) { return itemCardHtml(kind, i); }).join('');
    var empty = '';
    if (!items.length) {
      empty = filtersActive(kind)
        ? emptyState('search', 'Nothing matches', 'Try a different search or category.')
        : emptyState(kind === 'stock' ? 'box' : 'book', 'No ' + label + ' items yet', 'Tap + to add one, or use Bulk Upload to import many.');
    }
    $('#list-main').innerHTML = catChipsHtml(kind) + cards + empty;
  }

  function renderSelectMode(kind) {
    var label = kind === 'stock' ? 'stock' : 'menu';
    var fieldBtns = kind === 'stock'
      ? '<button class="btn btn-outline btn-sm" data-action="bulk-field" data-kind="stock" data-field="category">' + ICON.tag + ' Category</button>' +
        '<button class="btn btn-outline btn-sm" data-action="bulk-field" data-kind="stock" data-field="purchaseUnit">Buy unit</button>' +
        '<button class="btn btn-outline btn-sm" data-action="bulk-field" data-kind="stock" data-field="consumptionUnit">Use unit</button>'
      : '<button class="btn btn-outline btn-sm" data-action="bulk-field" data-kind="menu" data-field="category">' + ICON.tag + ' Category</button>' +
        '<button class="btn btn-outline btn-sm" data-action="bulk-field" data-kind="menu" data-field="consumptionUnit">Unit</button>';
    $('#view').innerHTML =
      searchbarHtml(kind + '-search', 'Search ' + label + ' items…', S.search[kind]) +
      '<div id="list-main"></div>' +
      '<div style="height:80px"></div>' +
      '<div class="select-actions">' + fieldBtns +
        '<button class="btn btn-danger btn-sm" data-action="bulk-del" data-kind="' + kind + '">' + ICON.trash + ' Delete</button>' +
      '</div>';
    bindSearch(kind + '-search', kind);
    renderSelectMain(kind);
  }

  function renderSelectMain(kind) {
    var items = kind === 'stock' ? S.stock : S.menu;
    var n = Object.keys(S.select.ids).length;
    var allOn = items.length > 0 && items.every(function (i) { return S.select.ids[i._id]; });
    var cards = items.map(function (i) {
      var bits = [i.category];
      if (kind === 'stock') bits.push('Buy: ' + (i.purchaseUnit || '—'), 'Use: ' + (i.consumptionUnit || '—'));
      else bits.push(i.consumptionUnit ? 'Unit: ' + i.consumptionUnit : null);
      var sub = esc(bits.filter(Boolean).join(' • '));
      var on = !!S.select.ids[i._id];
      return '<button class="item-card select-card' + (on ? ' selected' : '') + '" data-action="toggle-select" data-id="' + i._id + '">' +
        '<span class="check' + (on ? ' on' : '') + '"></span>' +
        '<div class="ic-main"><div class="ic-name">' + esc(i.name) + '</div><div class="ic-sub">' + sub + '</div></div></button>';
    }).join('');
    var empty = items.length === 0 ? emptyState('search', 'Nothing matches', 'Try a different search or category.') : '';
    $('#list-main').innerHTML =
      '<div class="select-toolbar">' +
        '<button class="link-btn" data-action="select-cancel">Cancel</button>' +
        '<span id="select-count">' + n + ' selected</span>' +
        '<button class="link-btn" data-action="select-all" data-kind="' + kind + '">' + (allOn ? 'Clear all' : 'Select all') + '</button>' +
      '</div>' +
      catChipsHtml(kind) +
      cards + empty;
  }

  var searchTimer;
  function bindSearch(id, keyName) {
    var el = document.getElementById(id);
    el.addEventListener('input', function () {
      S.search[keyName] = el.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { reloadList(); }, 250);
    });
  }

  /* ---------- bottom sheet ---------- */

  function openSheet(html) {
    $('#sheet').innerHTML = '<div class="sheet-handle"></div>' + html;
    $('#sheet').classList.remove('hidden');
    $('#backdrop').classList.remove('hidden');
  }
  function closeSheet() {
    $('#sheet').classList.add('hidden');
    $('#backdrop').classList.add('hidden');
    $('#sheet').innerHTML = '';
  }
  $('#backdrop').addEventListener('click', closeSheet);

  /* ---------- item form (add / edit) ---------- */

  function unitSelect(name, value) {
    var isOther = value && UNITS.indexOf(value) === -1;
    var opts = '<option value="">— select —</option>' + UNITS.map(function (u) {
      return '<option value="' + u + '"' + (u === value ? ' selected' : '') + '>' + u + '</option>';
    }).join('') + '<option value="' + OTHER + '"' + (isOther ? ' selected' : '') + '>Other…</option>';
    return '<select id="f-' + name + '" data-role="unit-select">' + opts + '</select>' +
      '<input type="text" id="f-' + name + '-other" placeholder="Type the unit" value="' + esc(isOther ? value : '') + '"' +
      ' style="margin-top:8px" class="' + (isOther ? '' : 'hidden') + '" maxlength="30">';
  }

  function catSelect(kind, value) {
    var cats = S.cats[kind].filter(function (c) { return !c.archived; });
    var known = cats.some(function (c) { return c.name === value; });
    var opts = '<option value="">— none —</option>' + cats.map(function (c) {
      return '<option value="' + esc(c.name) + '"' + (c.name === value ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
    if (value && !known) opts += '<option value="' + esc(value) + '" selected>' + esc(value) + '</option>';
    return '<select id="f-category">' + opts + '</select>';
  }

  function readUnit(name) {
    var sel = $('#f-' + name).value;
    if (sel === OTHER) return $('#f-' + name + '-other').value.trim();
    return sel;
  }

  function openItemForm(kind, item) {
    var isEdit = !!item;
    item = item || {};
    var title = (isEdit ? 'Edit ' : 'New ') + (kind === 'stock' ? 'Stock Item' : 'Menu Item');

    openSheet(
      '<div class="sheet-title">' + title + '</div>' +
      '<label>Name</label><input type="text" id="f-name" value="' + esc(item.name || '') + '" maxlength="120" placeholder="e.g. ' + (kind === 'stock' ? 'Chicken Thigh' : 'Boss Burger') + '">' +
      '<label>Category</label>' + catSelect(kind, item.category || '') +
      (kind === 'stock' ? '<label>Purchase Unit</label>' + unitSelect('purchaseUnit', item.purchaseUnit || '') : '') +
      '<label>Consumption Unit</label>' + unitSelect('consumptionUnit', item.consumptionUnit || '') +
      '<label>Notes</label><textarea id="f-notes" maxlength="1000" placeholder="Optional">' + esc(item.notes || '') + '</textarea>' +
      '<div class="sheet-actions">' +
        (isEdit ? '<button class="btn btn-danger" data-action="item-delete" data-kind="' + kind + '" data-id="' + item._id + '">Delete</button>' : '') +
        '<button class="btn btn-primary" data-action="item-save" data-kind="' + kind + '" data-id="' + (item._id || '') + '">Save</button>' +
      '</div>'
    );

    document.querySelectorAll('#sheet select[data-role="unit-select"]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var other = document.getElementById(sel.id + '-other');
        other.classList.toggle('hidden', sel.value !== OTHER);
        if (sel.value === OTHER) other.focus();
      });
    });
  }

  function saveItem(kind, id) {
    var body = {
      name: $('#f-name').value.trim(),
      category: $('#f-category').value,
      consumptionUnit: readUnit('consumptionUnit'),
      notes: $('#f-notes').value.trim(),
    };
    if (kind === 'stock') body.purchaseUnit = readUnit('purchaseUnit');
    if (!body.name) return toast('Name is required', true);

    var base = kind === 'stock' ? '/stock-items' : '/menu-items';
    var req = id ? api(base + '/' + id, { method: 'PUT', body: body }) : api(base, { method: 'POST', body: body });
    req.then(function () {
      closeSheet();
      return refreshAll().then(function () { render(); toast('Saved'); });
    }).catch(function (err) { toast(err.message, true); });
  }

  function deleteItem(kind, id) {
    var name = kind === 'stock' ? 'stock item' : 'menu item';
    confirmDialog({
      title: 'Delete this ' + name + '?',
      body: kind === 'menu' ? 'Its product mix will be removed too. This can’t be undone.' : 'This can’t be undone.',
      danger: true, confirm: 'Delete',
    }, function () {
      api((kind === 'stock' ? '/stock-items/' : '/menu-items/') + id, { method: 'DELETE' })
        .then(function () {
          closeSheet();
          return refreshAll().then(function () { render(); toast('Deleted'); });
        })
        .catch(function (err) { toast(err.message, true); });
    });
  }

  /* ---------- categories ---------- */

  function openCatSheet(kind) {
    var cats = S.cats[kind];
    var rows = cats.length
      ? cats.map(function (c) {
          var n = c.count || 0;
          var archived = !!c.archived;
          var name = esc(c.name);
          var acts = '<button class="cat-act" data-action="cat-edit" data-kind="' + kind + '" data-id="' + c._id + '" data-name="' + name + '" aria-label="Rename">' + ICON.pencil + '</button>';
          if (archived) {
            acts += '<button class="cat-act" data-action="cat-restore" data-kind="' + kind + '" data-id="' + c._id + '" aria-label="Restore">' + ICON.restore + '</button>';
          } else if (n > 0) {
            acts += '<button class="cat-act" data-action="cat-archive" data-kind="' + kind + '" data-id="' + c._id + '" data-name="' + name + '" aria-label="Archive">' + ICON.archive + '</button>';
          }
          if (n === 0) {
            acts += '<button class="cat-act danger" data-action="cat-del" data-kind="' + kind + '" data-id="' + c._id + '" data-name="' + name + '" aria-label="Delete">' + ICON.trash + '</button>';
          }
          return '<div class="cat-row' + (archived ? ' archived' : '') + '">' +
            '<span class="cat-name">' + name + (archived ? '<span class="cat-tag">Archived</span>' : '') +
            '<span class="cat-count"> · ' + n + ' item' + (n === 1 ? '' : 's') + '</span></span>' +
            '<span class="cat-actions">' + acts + '</span></div>';
        }).join('')
      : emptyState('tag', 'No categories yet', 'Add one below, then pick it from the dropdown when you create items.');

    openSheet(
      '<div class="sheet-title">' + (kind === 'stock' ? 'Stock' : 'Menu') + ' Categories</div>' +
      rows +
      '<div class="cat-add"><input type="text" id="cat-new" placeholder="New category…" maxlength="60">' +
      '<button class="btn btn-primary btn-sm" data-action="cat-add" data-kind="' + kind + '">Add</button></div>'
    );
  }

  // reload data, refresh the list underneath, and re-render the open categories sheet
  function refreshCats(kind) {
    return refreshAll().then(function () { render(); openCatSheet(kind); });
  }

  function addCategory(kind) {
    var name = $('#cat-new').value.trim();
    if (!name) return;
    api('/categories', { method: 'POST', body: { name: name, type: kind } })
      .then(function () { return refreshCats(kind); })
      .then(function () { toast('Category added'); })
      .catch(function (err) { toast(err.message, true); });
  }

  function renameCategory(kind, id, current) {
    promptDialog({ title: 'Rename category', value: current, placeholder: 'Category name', confirm: 'Save' }, function (name) {
      if (!name || name === current) return;
      api('/categories/' + id, { method: 'PUT', body: { name: name } })
        .then(function (r) {
          if (S.catFilter[kind] === current) S.catFilter[kind] = name; // keep the active filter pointing at the renamed category
          return refreshCats(kind).then(function () {
            toast('Renamed' + (r.updated ? ' · ' + r.updated + ' item' + (r.updated === 1 ? '' : 's') + ' updated' : ''));
          });
        })
        .catch(function (err) { toast(err.message, true); });
    });
  }

  function archiveCategory(kind, id, name, archived) {
    function run() {
      api('/categories/' + id + '/archive', { method: 'POST', body: { archived: archived } })
        .then(function () { return refreshCats(kind); })
        .then(function () { toast(archived ? 'Archived' : 'Restored'); })
        .catch(function (err) { toast(err.message, true); });
    }
    if (archived) {
      confirmDialog({
        title: 'Archive “' + name + '”?',
        body: 'It will be hidden from the category dropdowns. Items already using it keep it, and you can restore it any time.',
        confirm: 'Archive',
      }, run);
    } else { run(); }
  }

  function deleteCategory(kind, id, name) {
    confirmDialog({
      title: 'Delete “' + name + '”?',
      body: 'This category isn’t used by any item. This can’t be undone.',
      danger: true, confirm: 'Delete',
    }, function () {
      api('/categories/' + id, { method: 'DELETE' })
        .then(function () {
          if (S.catFilter[kind] === name) S.catFilter[kind] = '';
          return refreshCats(kind);
        })
        .then(function () { toast('Deleted'); })
        .catch(function (err) { toast(err.message, true); });
    });
  }

  /* ---------- multi-select bulk edit ---------- */

  function exitSelect() { S.select = { active: false, kind: null, ids: {} }; }

  function selectedIds() { return Object.keys(S.select.ids); }

  function openBulkFieldSheet(kind, field) {
    var ids = selectedIds();
    if (!ids.length) return toast('Select some items first', true);
    var label = field === 'category' ? 'Category' : (field === 'purchaseUnit' ? 'Purchase Unit' : 'Consumption Unit');
    var control = field === 'category' ? catSelect(kind, '') : unitSelect(field, '');
    openSheet(
      '<div class="sheet-title">Set ' + label + '</div>' +
      '<p class="preview-note">Applies to <b>' + ids.length + '</b> selected item' + (ids.length > 1 ? 's' : '') + '.</p>' +
      '<label>' + label + '</label>' + control +
      '<div class="sheet-actions"><button class="btn btn-primary" data-action="bulk-field-apply" data-kind="' + kind + '" data-field="' + field + '">Apply to ' + ids.length + '</button></div>'
    );
    document.querySelectorAll('#sheet select[data-role="unit-select"]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var other = document.getElementById(sel.id + '-other');
        other.classList.toggle('hidden', sel.value !== OTHER);
        if (sel.value === OTHER) other.focus();
      });
    });
  }

  function applyBulkField(kind, field) {
    var value = field === 'category' ? $('#f-category').value : readUnit(field);
    if (!value) return toast('Pick a value first', true);
    var ids = selectedIds();
    if (!ids.length) return toast('Select some items first', true);
    var base = kind === 'stock' ? '/stock-items' : '/menu-items';
    api(base + '/bulk-update', { method: 'POST', body: { ids: ids, field: field, value: value } })
      .then(function (r) {
        closeSheet();
        exitSelect();
        return refreshAll().then(function () {
          render();
          toast('Updated ' + r.updated + ' item' + (r.updated === 1 ? '' : 's'));
        });
      })
      .catch(function (err) { toast(err.message, true); });
  }

  function bulkDelete(kind) {
    var ids = selectedIds();
    if (!ids.length) return toast('Select some items first', true);
    var noun = ids.length + ' item' + (ids.length > 1 ? 's' : '');
    confirmDialog({
      title: 'Delete ' + noun + '?',
      body: kind === 'menu'
        ? 'Their product mixes will be removed too. This can’t be undone.'
        : 'This can’t be undone. Any item used in a product mix is kept.',
      danger: true, confirm: 'Delete',
    }, function () {
      var base = kind === 'stock' ? '/stock-items' : '/menu-items';
      api(base + '/bulk-delete', { method: 'POST', body: { ids: ids } })
        .then(function (r) {
          exitSelect();
          return refreshAll().then(function () {
            render();
            toast('Deleted ' + r.deleted + (r.skipped ? ', ' + r.skipped + ' skipped (in use)' : ''));
          });
        })
        .catch(function (err) { toast(err.message, true); });
    });
  }

  // Export the FULL catalog (unfiltered), regardless of the current on-screen filter
  function exportItems(kind) {
    var base = kind === 'stock' ? '/stock-items' : '/menu-items';
    api(base).then(function (items) {
      if (!items.length) return toast('Nothing to export yet', true);
      var headers = kind === 'stock'
        ? ['id', 'Name', 'Category', 'Purchase Unit', 'Consumption Unit', 'Notes']
        : ['id', 'Name', 'Category', 'Consumption Unit', 'Notes'];
      var aoa = [headers];
      items.forEach(function (i) {
        aoa.push(kind === 'stock'
          ? [i._id, i.name, i.category || '', i.purchaseUnit || '', i.consumptionUnit || '', i.notes || '']
          : [i._id, i.name, i.category || '', i.consumptionUnit || '', i.notes || '']);
      });
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = headers.map(function (h) { return { wch: h === 'id' ? 26 : 18 }; });
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, kind === 'stock' ? 'Stock Items' : 'Menu Items');
      XLSX.writeFile(wb, 'munventory-' + kind + '-items.xlsx');
      toast('Exported ' + items.length + ' item' + (items.length === 1 ? '' : 's'));
    }).catch(function (err) { toast(err.message, true); });
  }

  /* ---------- bulk upload ---------- */

  var bulkState = null; // { kind, rows }

  function openBulkSheet(kind) {
    bulkState = { kind: kind, rows: null };
    var cols = kind === 'stock'
      ? 'Name, Category, Purchase Unit, Consumption Unit, Notes'
      : 'Name, Category, Consumption Unit, Notes';
    openSheet(
      '<div class="sheet-title">Bulk Upload — ' + (kind === 'stock' ? 'Stock' : 'Menu') + ' Items</div>' +
      '<div class="info-box">Expected columns: <b>' + cols + '</b><br>Items with the same name are updated; new names are added.</div>' +
      '<div class="info-box tip">💡 <b>To bulk-update:</b> tap <b>Export</b> on the list, edit the file, then upload it here. Keep the <b>id</b> column — rows with an id update that exact item, so you can even rename them.</div>' +
      '<button class="btn btn-soft btn-block btn-sm" data-action="bulk-template" data-kind="' + kind + '" style="margin-top:12px">' + ICON.download + ' Download Template</button>' +
      '<label class="file-drop" for="bulk-file">' + ICON.upload + 'Tap to choose a file<span class="fd-hint">.xlsx or .csv</span>' +
      '<input type="file" id="bulk-file" accept=".csv,.xlsx,.xls" class="hidden"></label>' +
      '<div id="bulk-preview"></div>' +
      '<div class="sheet-actions"><button class="btn btn-primary" id="bulk-import" data-action="bulk-import" disabled>Import</button></div>'
    );
    $('#bulk-file').addEventListener('change', handleBulkFile);
  }

  function normKey(k) { return String(k).toLowerCase().replace(/[^a-z]/g, ''); }

  var COL_MAP = {
    id: 'id', itemid: 'id',
    name: 'name', itemname: 'name', stockitemname: 'name', menuitemname: 'name', stockitem: 'name', menuitem: 'name',
    category: 'category', cat: 'category',
    purchaseunit: 'purchaseUnit', purchase: 'purchaseUnit',
    consumptionunit: 'consumptionUnit', consumption: 'consumptionUnit', unit: 'consumptionUnit',
    notes: 'notes', note: 'notes', remarks: 'notes',
  };

  var BULK_MAX_ROWS = 2000;

  function handleBulkFile(e) {
    var file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same (fixed) file
    if (!file) return;
    file.arrayBuffer().then(function (buf) {
      var wb = XLSX.read(buf, { type: 'array' });
      var sheet = wb.Sheets[wb.SheetNames[0]];
      var raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      var rows = raw.map(function (r) {
        var out = {};
        Object.keys(r).forEach(function (k) {
          var mapped = COL_MAP[normKey(k)];
          if (mapped && !out[mapped]) out[mapped] = String(r[k]).trim();
        });
        return out;
      }).filter(function (r) { return r.name || r.id; });

      if (!rows.length) {
        errPreview('No usable rows found', 'Check that the headers match the template, then try again.');
        return;
      }
      if (rows.length > BULK_MAX_ROWS) {
        errPreview('Too many rows (' + rows.length + ')', 'The maximum is ' + BULK_MAX_ROWS + ' per upload. Please split the file.');
        return;
      }
      bulkState.rows = rows;
      var cols = bulkState.kind === 'stock'
        ? [['name', 'Name'], ['category', 'Category'], ['purchaseUnit', 'Buy'], ['consumptionUnit', 'Use']]
        : [['name', 'Name'], ['category', 'Category'], ['consumptionUnit', 'Unit']];
      var prev = rows.slice(0, 5).map(function (r) {
        return '<tr>' + cols.map(function (h) { return '<td>' + esc(r[h[0]] || '') + '</td>'; }).join('') + '</tr>';
      }).join('');
      var more = rows.length > 5 ? '<div class="preview-more">+ ' + (rows.length - 5) + ' more row' + (rows.length - 5 > 1 ? 's' : '') + '</div>' : '';
      $('#bulk-preview').innerHTML =
        '<div class="ready-row"><span class="ready-ic">' + ICON.check + '</span>' +
        '<span class="ready-txt">' + rows.length + ' row' + (rows.length > 1 ? 's' : '') + ' ready</span>' +
        '<span class="ready-file">' + esc(file.name) + '</span></div>' +
        '<div class="table-scroll"><table class="preview-table"><thead><tr>' +
        cols.map(function (h) { return '<th>' + h[1] + '</th>'; }).join('') + '</tr></thead><tbody>' + prev + '</tbody></table>' + more + '</div>';
      var b = $('#bulk-import');
      b.textContent = 'Import ' + rows.length + ' item' + (rows.length > 1 ? 's' : '');
      b.disabled = false;
    }).catch(function () {
      toast('Could not read that file', true);
    });
  }

  function errPreview(title, sub) {
    $('#bulk-preview').innerHTML = '<div class="err-box">' + ICON.alert +
      '<div><div class="err-title">' + esc(title) + '</div><div class="err-sub">' + esc(sub) + '</div></div></div>';
    $('#bulk-import').disabled = true;
  }

  function bulkImport() {
    if (!bulkState || !bulkState.rows) return;
    $('#bulk-import').disabled = true;
    $('#bulk-import').innerHTML = '<span class="spin"></span> Importing…';
    var base = bulkState.kind === 'stock' ? '/stock-items' : '/menu-items';
    api(base + '/bulk', { method: 'POST', body: { items: bulkState.rows } })
      .then(function (r) {
        closeSheet();
        return refreshAll().then(function () {
          render();
          toast('Imported: ' + r.inserted + ' new, ' + r.updated + ' updated' + (r.skipped ? ', ' + r.skipped + ' skipped' : ''));
        });
      })
      .catch(function (err) {
        toast(err.message, true);
        var b = $('#bulk-import');
        if (b) { b.disabled = false; b.textContent = 'Import'; }
      });
  }

  function downloadTemplate(kind) {
    var headers = kind === 'stock'
      ? ['Name', 'Category', 'Purchase Unit', 'Consumption Unit', 'Notes']
      : ['Name', 'Category', 'Consumption Unit', 'Notes'];
    var example = kind === 'stock'
      ? ['Chicken Fillet', 'Meat', 'box', 'g', '']
      : ['Boss Burger', 'Burgers', 'pcs', ''];
    var ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws['!cols'] = headers.map(function () { return { wch: 18 }; });
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'munventory-' + kind + '-template.xlsx');
  }

  /* ---------- excel report ---------- */

  function openReportSheet() {
    var canShare = !!(navigator.canShare && navigator.share);
    openSheet(
      '<div class="sheet-title">Report</div>' +
      '<p class="preview-note">One Excel file with every product mix, its status and full ingredient quantities.</p>' +
      '<div class="sheet-actions" style="flex-direction:column">' +
      '<button class="btn btn-primary btn-block" data-action="report-download">' + ICON.download + ' Download Excel</button>' +
      (canShare ? '<button class="btn btn-soft btn-block" data-action="report-share">' + ICON.share + ' Share Excel</button>' : '') +
      '</div>'
    );
  }

  function buildReportWb() {
    return api('/report').then(function (rows) {
      var aoa = [['Menu Item', 'Category', 'Status', 'Stock Item', 'Qty', 'Unit', 'Note']];
      rows.forEach(function (m) {
        var label = STATUS_LABEL[m.status] || m.status;
        var note = m.notes || '';
        if (!m.items.length) {
          aoa.push([m.name, m.category, label, '—', '', '', note]);
        } else {
          m.items.forEach(function (it, i) {
            aoa.push([i === 0 ? m.name : '', i === 0 ? m.category : '', i === 0 ? label : '', it.stockName, it.qty, it.unit, i === 0 ? note : '']);
          });
        }
      });
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 26 }, { wch: 8 }, { wch: 8 }, { wch: 34 }];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Product Mix');
      return wb;
    });
  }

  function reportFileName() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'product-mix-report-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.xlsx';
  }

  function downloadReport() {
    buildReportWb().then(function (wb) {
      XLSX.writeFile(wb, reportFileName());
      closeSheet();
    }).catch(function (err) { toast(err.message, true); });
  }

  function shareReport() {
    buildReportWb().then(function (wb) {
      var out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      var file = new File([out], reportFileName(), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      if (navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: 'Product Mix Report' });
      }
      XLSX.writeFile(wb, reportFileName());
    }).then(closeSheet).catch(function (err) {
      if (err && err.name !== 'AbortError') toast(err.message || 'Could not share', true);
    });
  }

  /* ---------- recipe card image ---------- */

  var RC_STATUS_CLASS = { draft: 'draft', confirmed: '', not_done: 'notdone' };

  function buildRecipeCard() {
    var ed = S.editor;
    var rows = ed.items.map(function (it) {
      var s = stockById(it.stockItemId);
      return '<div class="rc-row"><span class="rc-name">' + esc(s ? s.name : '(deleted)') + '</span>' +
        '<span class="rc-lead"></span>' +
        '<span class="rc-qty">' + esc(it.qty) + '<span class="u">' + esc(s ? s.consumptionUnit : '') + '</span></span></div>';
    }).join('');
    var d = new Date();
    var dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    var pills = (ed.menuItem.category ? '<span class="rc-pill">' + esc(ed.menuItem.category) + '</span>' : '') +
      '<span class="rc-pill status ' + RC_STATUS_CLASS[ed.status] + '"><span class="dot"></span>' + STATUS_LABEL[ed.status] + '</span>';
    $('#card-stage').innerHTML =
      '<div class="recipe-card" id="recipe-card">' +
        '<div class="rc-head">' +
          '<div class="rc-brand"><img src="/icons/icon-192.png" alt=""><span>Mun-ventory</span></div>' +
          '<h2>' + esc(ed.menuItem.name) + '</h2>' +
          '<div class="rc-pills">' + pills + '</div>' +
        '</div>' +
        '<div class="rc-body">' + rows + '</div>' +
        (ed.notes ? '<div class="rc-note"><span class="rc-note-label">Note</span>' + esc(ed.notes) + '</div>' : '') +
        '<div class="rc-foot"><span>' + dateStr + '</span><span class="rc-mark">mun-ventory</span></div>' +
      '</div>';
    return document.getElementById('recipe-card');
  }

  function shareCard() {
    if (!S.editor) return;
    if (S.editor.dirty) return toast('Save the mix before sharing', true);
    toast('Preparing image…');
    var el = buildRecipeCard();
    html2canvas(el, { scale: 2, backgroundColor: '#ffffff' }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        $('#card-stage').innerHTML = '';
        if (!blob) return toast('Could not create image', true);
        var name = S.editor.menuItem.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'product-mix';
        var file = new File([blob], name + '-mix.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
          navigator.share({ files: [file], title: S.editor.menuItem.name + ' — Product Mix' })
            .catch(function (err) { if (err.name !== 'AbortError') downloadBlob(blob, file.name); });
        } else {
          downloadBlob(blob, file.name);
          toast('Image saved');
        }
      }, 'image/png');
    }).catch(function () {
      $('#card-stage').innerHTML = '';
      toast('Could not create image', true);
    });
  }

  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ---------- global event delegation ---------- */

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    var kind = el.getAttribute('data-kind');
    var id = el.getAttribute('data-id');

    switch (action) {
      case 'mix-filter': S.mixFilter = el.getAttribute('data-val'); reloadList(); break;
      case 'cat-filter':
        S.catFilter[kind] = el.getAttribute('data-val');
        reloadList();
        break;
      case 'open-mix': openMix(id); break;
      case 'mix-back':
        if (S.editor && S.editor.dirty) {
          confirmDialog({ title: 'Discard changes?', body: 'Your unsaved edits to this mix will be lost.', confirm: 'Discard' },
            function () { S.editor = null; render(); });
        } else { S.editor = null; render(); }
        break;
      case 'mix-add':
        S.editor.items.push({ stockItemId: id, qty: '' });
        S.editor.stockSearch = '';
        S.editor.dirty = true;
        renderEditor();
        break;
      case 'mix-remove':
        S.editor.items.splice(Number(el.getAttribute('data-idx')), 1);
        S.editor.dirty = true;
        renderEditor();
        break;
      case 'mix-save': saveMix(el.getAttribute('data-status')); break;
      case 'share-card': shareCard(); break;
      case 'add-item': openItemForm(kind, null); break;
      case 'edit-item':
        var items = kind === 'stock' ? S.stock : S.menu;
        openItemForm(kind, items.find(function (i) { return String(i._id) === id; }));
        break;
      case 'item-save': saveItem(kind, id || null); break;
      case 'item-delete': deleteItem(kind, id); break;
      case 'cats-open': openCatSheet(kind); break;
      case 'cat-add': addCategory(kind); break;
      case 'cat-edit': renameCategory(kind, id, el.getAttribute('data-name')); break;
      case 'cat-archive': archiveCategory(kind, id, el.getAttribute('data-name'), true); break;
      case 'cat-restore': archiveCategory(kind, id, null, false); break;
      case 'cat-del': deleteCategory(kind, id, el.getAttribute('data-name')); break;
      case 'select-start':
        if ((kind === 'stock' ? S.stock : S.menu).length === 0) { toast('Add some items first', true); break; }
        S.select = { active: true, kind: kind, ids: {} };
        render(); window.scrollTo(0, 0); break;
      case 'select-cancel': exitSelect(); render(); break;
      case 'toggle-select': {
        var nowOn = !S.select.ids[id];
        if (nowOn) S.select.ids[id] = true; else delete S.select.ids[id];
        el.classList.toggle('selected', nowOn);
        var chk = el.querySelector('.check');
        if (chk) chk.classList.toggle('on', nowOn);
        var cnt = document.getElementById('select-count');
        if (cnt) cnt.textContent = selectedIds().length + ' selected';
        // keep the Select all / Clear all label in sync with live selection
        var allBtn = document.querySelector('[data-action="select-all"]');
        if (allBtn) {
          var vis0 = S.select.kind === 'stock' ? S.stock : S.menu;
          var allOn0 = vis0.length > 0 && vis0.every(function (i) { return S.select.ids[i._id]; });
          allBtn.textContent = allOn0 ? 'Clear all' : 'Select all';
        }
        break;
      }
      case 'select-all': {
        var vis = kind === 'stock' ? S.stock : S.menu;
        var everyOn = vis.length > 0 && vis.every(function (i) { return S.select.ids[i._id]; });
        S.select.ids = {};
        if (!everyOn) vis.forEach(function (i) { S.select.ids[i._id] = true; });
        renderSelectMain(kind); break;
      }
      case 'bulk-field': openBulkFieldSheet(kind, el.getAttribute('data-field')); break;
      case 'bulk-field-apply': applyBulkField(kind, el.getAttribute('data-field')); break;
      case 'bulk-del': bulkDelete(kind); break;
      case 'bulk-export': exportItems(kind); break;
      case 'bulk-open': openBulkSheet(kind); break;
      case 'bulk-template': downloadTemplate(kind); break;
      case 'bulk-import': bulkImport(); break;
      case 'report-download': downloadReport(); break;
      case 'report-share': shareReport(); break;
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-action="mix-qty"]')) {
      var idx = Number(e.target.getAttribute('data-idx'));
      if (S.editor && S.editor.items[idx]) {
        S.editor.items[idx].qty = e.target.value;
        S.editor.dirty = true;
        var sb = document.querySelector('[data-action="share-card"]');
        if (sb) sb.remove(); // unsaved changes: hide share until saved again
      }
    } else if (e.target.matches('[data-action="mix-notes"]')) {
      if (S.editor) {
        S.editor.notes = e.target.value;
        S.editor.dirty = true;
        var sb2 = document.querySelector('[data-action="share-card"]');
        if (sb2) sb2.remove();
      }
    }
  });

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      var tab = t.getAttribute('data-tab');
      function go() {
        S.editor = null; exitSelect(); S.tab = tab;
        document.querySelectorAll('.tab').forEach(function (t2) { t2.classList.toggle('active', t2.getAttribute('data-tab') === S.tab); });
        window.scrollTo(0, 0);
        loadCurrent().then(render).catch(function (err) { toast(err.message, true); render(); });
      }
      if (S.editor && S.editor.dirty) {
        confirmDialog({ title: 'Discard changes?', body: 'Your unsaved edits to this mix will be lost.', confirm: 'Discard' }, go);
      } else { go(); }
    });
  });

  $('#refresh-btn').addEventListener('click', function () {
    var btn = $('#refresh-btn');
    if (btn.classList.contains('spinning')) return;
    btn.classList.add('spinning');
    refreshAll().then(function () { render(); toast('Refreshed'); })
      .catch(function (err) { toast(err.message, true); })
      .then(function () { btn.classList.remove('spinning'); });
  });
  $('#report-btn').addEventListener('click', openReportSheet);
  $('#logout-btn').addEventListener('click', function () {
    api('/logout', { method: 'POST' }).catch(function () {}).then(showLogin);
  });

  /* ---------- PWA ---------- */

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    S.deferredPrompt = e;
    $('#install-btn').classList.remove('hidden');
  });
  $('#install-btn').addEventListener('click', function () {
    if (!S.deferredPrompt) return;
    S.deferredPrompt.prompt();
    S.deferredPrompt.userChoice.then(function () {
      S.deferredPrompt = null;
      $('#install-btn').classList.add('hidden');
    });
  });
  window.addEventListener('appinstalled', function () {
    $('#install-btn').classList.add('hidden');
  });

  /* ---------- start ---------- */

  api('/me').then(boot).catch(function () { showLogin(); });
})();
