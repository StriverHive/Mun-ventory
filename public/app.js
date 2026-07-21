/* Mun-ventory — simple mobile-first inventory & product mix app */
(function () {
  'use strict';

  var UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'box', 'pack', 'bottle', 'can', 'tray', 'dozen', 'bag', 'carton'];
  var OTHER = '__other__';

  var S = {
    tab: 'mix',
    stock: [],
    menu: [],
    mixes: [],            // [{menuItemId, status, itemCount}]
    cats: { stock: [], menu: [] },
    search: { mix: '', stock: '', menu: '' },
    mixFilter: 'all',
    editor: null,          // { menuItem, items:[{stockItemId, qty}], status, dirty, stockSearch }
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
    t.textContent = msg;
    t.className = isError ? 'error' : '';
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.add('hidden'); }, 2600);
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

  function showLogin() {
    $('#app').classList.add('hidden');
    $('#login-screen').classList.remove('hidden');
    S.pin = '';
    renderPinDots();
    $('#login-error').textContent = '';
  }

  function renderPinDots() {
    var el = $('#pin-dots');
    var n = Math.max(4, S.pin.length);
    var html = '';
    for (var i = 0; i < n; i++) {
      html += '<span class="dot' + (i < S.pin.length ? ' filled' : '') + '"></span>';
    }
    el.innerHTML = html;
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
        S.pin = '';
        renderPinDots();
        var card = document.querySelector('.login-card');
        card.classList.remove('shake');
        void card.offsetWidth;
        card.classList.add('shake');
        $('#login-error').textContent = err.message === 'Locked' ? 'Wrong PIN' : err.message;
      })
      .then(function () {
        tryUnlock._busy = false;
        $('#unlock-btn').disabled = false;
      });
  }

  document.querySelector('.keypad').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-key]');
    if (!btn) return;
    var k = btn.getAttribute('data-key');
    if (k === 'back') S.pin = S.pin.slice(0, -1);
    else if (S.pin.length < 8) S.pin += k;
    $('#login-error').textContent = '';
    renderPinDots();
  });
  $('#unlock-btn').addEventListener('click', tryUnlock);
  document.addEventListener('keydown', function (e) {
    if ($('#login-screen').classList.contains('hidden')) return;
    if (/^[0-9]$/.test(e.key) && S.pin.length < 8) { S.pin += e.key; renderPinDots(); }
    else if (e.key === 'Backspace') { S.pin = S.pin.slice(0, -1); renderPinDots(); }
    else if (e.key === 'Enter') tryUnlock();
  });

  /* ---------- boot / data ---------- */

  function boot() {
    return loadAll().then(function () {
      $('#login-screen').classList.add('hidden');
      $('#app').classList.remove('hidden');
      render();
    }).catch(function (err) {
      if (err.message !== 'Locked') toast(err.message, true);
    });
  }

  function loadAll() {
    return Promise.all([
      api('/stock-items'),
      api('/menu-items'),
      api('/product-mixes'),
      api('/categories?type=stock'),
      api('/categories?type=menu'),
    ]).then(function (r) {
      S.stock = r[0]; S.menu = r[1]; S.mixes = r[2];
      S.cats.stock = r[3]; S.cats.menu = r[4];
    });
  }

  function mixByMenuId(id) {
    for (var i = 0; i < S.mixes.length; i++) {
      if (String(S.mixes[i].menuItemId) === String(id)) return S.mixes[i];
    }
    return null;
  }

  function statusOf(menuItem) {
    var m = mixByMenuId(menuItem._id);
    return m ? m.status : 'not_done';
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
    else if (S.tab === 'stock') renderItemList('stock');
    else renderItemList('menu');
  }

  /* ----- product mix list ----- */

  function renderMixList() {
    var q = S.search.mix.toLowerCase();
    var counts = { all: S.menu.length, not_done: 0, draft: 0, confirmed: 0 };
    S.menu.forEach(function (m) { counts[statusOf(m)]++; });

    var list = S.menu.filter(function (m) {
      if (q && m.name.toLowerCase().indexOf(q) === -1) return false;
      if (S.mixFilter !== 'all' && statusOf(m) !== S.mixFilter) return false;
      return true;
    });

    var chips = [
      ['all', 'All ' + counts.all],
      ['not_done', 'Not done ' + counts.not_done],
      ['draft', 'Drafts ' + counts.draft],
      ['confirmed', 'Confirmed ' + counts.confirmed],
    ].map(function (c) {
      return '<button class="chip' + (S.mixFilter === c[0] ? ' active' : '') + '" data-action="mix-filter" data-val="' + c[0] + '">' + c[1] + '</button>';
    }).join('');

    var cards = list.map(function (m) {
      var st = statusOf(m);
      var mix = mixByMenuId(m._id);
      var sub = [m.category, mix && mix.itemCount ? mix.itemCount + ' ingredient' + (mix.itemCount > 1 ? 's' : '') : null]
        .filter(Boolean).join(' • ') || 'Tap to build the mix';
      return '<button class="item-card ' + STATUS_CARD[st] + '" data-action="open-mix" data-id="' + m._id + '">' +
        '<div class="ic-main"><div class="ic-name">' + esc(m.name) + '</div><div class="ic-sub">' + esc(sub) + '</div></div>' +
        '<span class="badge ' + STATUS_BADGE[st] + '">' + STATUS_LABEL[st] + '</span></button>';
    }).join('');

    var empty = S.menu.length === 0
      ? '<div class="empty"><span class="emoji">🍔</span>No menu items yet.<br>Add them in the <b>Menu</b> tab first.</div>'
      : (list.length === 0 ? '<div class="empty"><span class="emoji">🔍</span>Nothing matches.</div>' : '');

    $('#view').innerHTML =
      '<div class="searchbar"><input type="search" id="mix-search" placeholder="Search menu items…" value="' + esc(S.search.mix) + '"></div>' +
      '<div class="chips">' + chips + '</div>' +
      cards + empty;

    bindSearch('mix-search', 'mix');
  }

  /* ----- mix editor ----- */

  function openMix(menuItemId) {
    var menuItem = S.menu.find(function (m) { return String(m._id) === String(menuItemId); });
    if (!menuItem) return;
    api('/product-mixes/' + menuItemId).then(function (mix) {
      S.editor = {
        menuItem: menuItem,
        items: mix ? mix.items.map(function (i) { return { stockItemId: String(i.stockItemId), qty: String(i.qty) }; }) : [],
        status: mix ? mix.status : 'not_done',
        stockSearch: '',
        dirty: false,
      };
      render();
      window.scrollTo(0, 0);
    }).catch(function (err) { toast(err.message, true); });
  }

  function stockById(id) {
    return S.stock.find(function (s) { return String(s._id) === String(id); });
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
        '<button class="mr-del" data-action="mix-remove" data-idx="' + idx + '" aria-label="Remove">×</button>' +
        '</div>';
    }).join('');

    var q = ed.stockSearch.trim().toLowerCase();
    var results = '';
    if (q) {
      var chosen = {};
      ed.items.forEach(function (i) { chosen[i.stockItemId] = true; });
      var found = S.stock.filter(function (s) {
        return !chosen[String(s._id)] && s.name.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 12);
      results = '<div class="stock-results">' + (found.length
        ? found.map(function (s) {
            return '<button data-action="mix-add" data-id="' + s._id + '">' + esc(s.name) +
              ' <span class="sr-sub">' + esc([s.category, s.consumptionUnit].filter(Boolean).join(' • ')) + '</span></button>';
          }).join('')
        : '<button disabled style="color:#9ca3af">No stock items found</button>') + '</div>';
    }

    var shareBtn = st !== 'not_done' && !ed.dirty
      ? '<button class="icon-btn" data-action="share-card" title="Share as image">🖼️</button>' : '';

    $('#view').innerHTML =
      '<div class="editor-head">' +
        '<button class="back-btn" data-action="mix-back" aria-label="Back">←</button>' +
        '<div class="editor-title"><h2>' + esc(ed.menuItem.name) + '</h2>' +
        '<div class="ic-sub">' + esc(ed.menuItem.category || 'Product mix') + '</div></div>' +
        '<span class="badge ' + STATUS_BADGE[st] + '">' + STATUS_LABEL[st] + '</span>' + shareBtn +
      '</div>' +
      '<div class="mix-rows">' + (rows || '<div class="empty" style="padding:26px 10px"><span class="emoji">🧺</span>No stock items in this mix yet.<br>Search below to add.</div>') + '</div>' +
      '<input type="search" id="stock-search" placeholder="Search stock items…" value="' + esc(ed.stockSearch) + '">' +
      results +
      '<div style="height:70px"></div>' +
      '<div class="editor-actions">' +
        '<button class="btn btn-yellow" data-action="mix-save" data-status="draft">Save Draft</button>' +
        '<button class="btn btn-green" data-action="mix-save" data-status="confirmed">Confirm</button>' +
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

    api('/product-mixes/' + ed.menuItem._id, { method: 'PUT', body: { items: items, status: status } })
      .then(function (r) {
        return api('/product-mixes').then(function (mixes) {
          S.mixes = mixes;
          if (r.cleared) {
            toast('Mix cleared');
            S.editor = null;
          } else {
            toast(status === 'confirmed' ? 'Confirmed ✓' : 'Saved as draft');
            S.editor.status = status;
            S.editor.dirty = false;
          }
          render();
        });
      })
      .catch(function (err) { toast(err.message, true); });
  }

  /* ----- stock / menu lists ----- */

  function renderItemList(kind) {
    var items = kind === 'stock' ? S.stock : S.menu;
    var q = S.search[kind].toLowerCase();
    var list = items.filter(function (i) {
      return !q || i.name.toLowerCase().indexOf(q) !== -1 || (i.category || '').toLowerCase().indexOf(q) !== -1;
    });

    var cards = list.map(function (i) {
      var bits = [i.category];
      if (kind === 'stock') bits.push('Buy: ' + (i.purchaseUnit || '—'), 'Use: ' + (i.consumptionUnit || '—'));
      else bits.push(i.consumptionUnit ? 'Unit: ' + i.consumptionUnit : null);
      return '<button class="item-card" data-action="edit-item" data-kind="' + kind + '" data-id="' + i._id + '">' +
        '<div class="ic-main"><div class="ic-name">' + esc(i.name) + '</div>' +
        '<div class="ic-sub">' + esc(bits.filter(Boolean).join(' • ')) + '</div></div>' +
        '<span style="color:#d1d5db;font-size:18px">›</span></button>';
    }).join('');

    var label = kind === 'stock' ? 'stock' : 'menu';
    var empty = items.length === 0
      ? '<div class="empty"><span class="emoji">' + (kind === 'stock' ? '📦' : '🍔') + '</span>No ' + label + ' items yet.<br>Tap <b>+</b> to add one, or use Bulk Upload.</div>'
      : (list.length === 0 ? '<div class="empty"><span class="emoji">🔍</span>Nothing matches.</div>' : '');

    $('#view').innerHTML =
      '<div class="searchbar"><input type="search" id="' + kind + '-search" placeholder="Search ' + label + ' items…" value="' + esc(S.search[kind]) + '"></div>' +
      '<div class="list-actions">' +
        '<button class="btn btn-outline btn-sm" data-action="bulk-open" data-kind="' + kind + '">⬆ Bulk Upload</button>' +
        '<button class="btn btn-outline btn-sm" data-action="cats-open" data-kind="' + kind + '">🏷 Categories</button>' +
      '</div>' +
      cards + empty +
      '<button class="fab" data-action="add-item" data-kind="' + kind + '" aria-label="Add">+</button>';

    bindSearch(kind + '-search', kind);
  }

  function bindSearch(id, keyName) {
    var el = document.getElementById(id);
    el.addEventListener('input', function () {
      S.search[keyName] = el.value;
      var pos = el.selectionStart;
      render();
      var nel = document.getElementById(id);
      nel.focus();
      try { nel.setSelectionRange(pos, pos); } catch (e) {}
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
    var cats = S.cats[kind];
    var known = cats.some(function (c) { return c.name === value; });
    var opts = '<option value="">— none —</option>' + cats.map(function (c) {
      return '<option value="' + esc(c.name) + '"' + (c.name === value ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
    if (value && !known) opts += '<option value="' + esc(value) + '" selected>' + esc(value) + '</option>';
    return '<select id="f-category">' + opts + '</select>' +
      '<div class="ic-sub" style="margin-top:6px">Manage categories from the list screen (🏷 button).</div>';
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
      '<label>Name *</label><input type="text" id="f-name" value="' + esc(item.name || '') + '" maxlength="120" placeholder="e.g. ' + (kind === 'stock' ? 'Chicken Fillet' : 'Boss Burger') + '">' +
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
      return loadAll().then(function () { render(); toast('Saved ✓'); });
    }).catch(function (err) { toast(err.message, true); });
  }

  function deleteItem(kind, id) {
    var name = kind === 'stock' ? 'stock item' : 'menu item';
    var warn = kind === 'menu' ? ' Its product mix will also be deleted.' : '';
    if (!confirm('Delete this ' + name + '?' + warn)) return;
    api((kind === 'stock' ? '/stock-items/' : '/menu-items/') + id, { method: 'DELETE' })
      .then(function () {
        closeSheet();
        return loadAll().then(function () { render(); toast('Deleted'); });
      })
      .catch(function (err) { toast(err.message, true); });
  }

  /* ---------- categories ---------- */

  function openCatSheet(kind) {
    var cats = S.cats[kind];
    var rows = cats.length
      ? cats.map(function (c) {
          return '<div class="cat-row"><span>' + esc(c.name) + '</span>' +
            '<button class="btn btn-danger btn-sm" data-action="cat-del" data-kind="' + kind + '" data-id="' + c._id + '">Delete</button></div>';
        }).join('')
      : '<div class="empty" style="padding:20px"><span class="emoji">🏷</span>No categories yet.</div>';

    openSheet(
      '<div class="sheet-title">' + (kind === 'stock' ? 'Stock' : 'Menu') + ' Categories</div>' +
      rows +
      '<div class="cat-add"><input type="text" id="cat-new" placeholder="New category name" maxlength="60">' +
      '<button class="btn btn-primary btn-sm" data-action="cat-add" data-kind="' + kind + '" style="flex:0 0 auto">Add</button></div>'
    );
  }

  function addCategory(kind) {
    var name = $('#cat-new').value.trim();
    if (!name) return;
    api('/categories', { method: 'POST', body: { name: name, type: kind } })
      .then(function () { return loadAll(); })
      .then(function () { openCatSheet(kind); toast('Category added'); })
      .catch(function (err) { toast(err.message, true); });
  }

  function deleteCategory(kind, id) {
    api('/categories/' + id, { method: 'DELETE' })
      .then(function () { return loadAll(); })
      .then(function () { openCatSheet(kind); })
      .catch(function (err) { toast(err.message, true); });
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
      '<p class="preview-note">Upload a CSV or Excel file with these columns:<br><b>' + cols + '</b><br>Existing items with the same name will be updated.</p>' +
      '<button class="btn btn-outline btn-block btn-sm" data-action="bulk-template" data-kind="' + kind + '">⬇ Download Template</button>' +
      '<label class="file-drop" for="bulk-file">📄 Tap to choose a CSV / Excel file' +
      '<input type="file" id="bulk-file" accept=".csv,.xlsx,.xls" class="hidden"></label>' +
      '<div id="bulk-preview"></div>' +
      '<div class="sheet-actions"><button class="btn btn-primary" id="bulk-import" data-action="bulk-import" disabled>Import</button></div>'
    );
    $('#bulk-file').addEventListener('change', handleBulkFile);
  }

  function normKey(k) { return String(k).toLowerCase().replace(/[^a-z]/g, ''); }

  var COL_MAP = {
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
      }).filter(function (r) { return r.name; });

      if (!rows.length) {
        $('#bulk-preview').innerHTML = '<p class="preview-note" style="color:var(--red)">No usable rows found. Make sure the first row has column headers (e.g. "Name").</p>';
        $('#bulk-import').disabled = true;
        return;
      }
      if (rows.length > BULK_MAX_ROWS) {
        $('#bulk-preview').innerHTML = '<p class="preview-note" style="color:var(--red)">This file has ' + rows.length + ' rows — the maximum is ' + BULK_MAX_ROWS + ' per upload. Please split the file.</p>';
        $('#bulk-import').disabled = true;
        return;
      }
      bulkState.rows = rows;
      var headers = bulkState.kind === 'stock'
        ? ['name', 'category', 'purchaseUnit', 'consumptionUnit']
        : ['name', 'category', 'consumptionUnit'];
      var prev = rows.slice(0, 5).map(function (r) {
        return '<tr>' + headers.map(function (h) { return '<td>' + esc(r[h] || '') + '</td>'; }).join('') + '</tr>';
      }).join('');
      $('#bulk-preview').innerHTML =
        '<p class="preview-note"><b>' + rows.length + '</b> row' + (rows.length > 1 ? 's' : '') + ' ready to import' + (rows.length > 5 ? ' (showing first 5)' : '') + ':</p>' +
        '<div class="table-scroll"><table class="preview-table"><tr>' +
        headers.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + prev + '</table></div>';
      $('#bulk-import').disabled = false;
    }).catch(function () {
      toast('Could not read that file', true);
    });
  }

  function bulkImport() {
    if (!bulkState || !bulkState.rows) return;
    $('#bulk-import').disabled = true;
    $('#bulk-import').textContent = 'Importing…';
    var base = bulkState.kind === 'stock' ? '/stock-items' : '/menu-items';
    api(base + '/bulk', { method: 'POST', body: { items: bulkState.rows } })
      .then(function (r) {
        closeSheet();
        return loadAll().then(function () {
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
      '<div class="sheet-title">Product Mix Report</div>' +
      '<p class="preview-note">Excel report of every menu item with its stock items, quantities and status.</p>' +
      '<div class="sheet-actions" style="flex-direction:column">' +
      '<button class="btn btn-primary btn-block" data-action="report-download">⬇ Download Excel</button>' +
      (canShare ? '<button class="btn btn-outline btn-block" data-action="report-share">📤 Share Excel</button>' : '') +
      '</div>'
    );
  }

  function buildReportWb() {
    return api('/report').then(function (rows) {
      var aoa = [['Menu Item', 'Category', 'Status', 'Stock Item', 'Qty', 'Unit']];
      rows.forEach(function (m) {
        var label = STATUS_LABEL[m.status] || m.status;
        if (!m.items.length) {
          aoa.push([m.name, m.category, label, '—', '', '']);
        } else {
          m.items.forEach(function (it, i) {
            aoa.push([i === 0 ? m.name : '', i === 0 ? m.category : '', i === 0 ? label : '', it.stockName, it.qty, it.unit]);
          });
        }
      });
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 12 }, { wch: 26 }, { wch: 8 }, { wch: 8 }];
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

  function buildRecipeCard() {
    var ed = S.editor;
    var rows = ed.items.map(function (it) {
      var s = stockById(it.stockItemId);
      return '<div class="rc-row"><span>' + esc(s ? s.name : '(deleted)') + '</span>' +
        '<span class="rc-qty">' + esc(it.qty) + ' ' + esc(s ? s.consumptionUnit : '') + '</span></div>';
    }).join('');
    var d = new Date();
    $('#card-stage').innerHTML =
      '<div class="recipe-card" id="recipe-card">' +
        '<div class="rc-head"><div class="rc-app">Mun-ventory · Product Mix</div>' +
        '<h2>' + esc(ed.menuItem.name) + '</h2>' +
        (ed.menuItem.category ? '<div class="rc-meta">' + esc(ed.menuItem.category) + '</div>' : '') +
        '<span class="rc-status">' + STATUS_LABEL[ed.status] + '</span></div>' +
        '<div class="rc-body">' + rows + '</div>' +
        '<div class="rc-foot">' + d.toLocaleDateString() + '</div>' +
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
      case 'mix-filter': S.mixFilter = el.getAttribute('data-val'); render(); break;
      case 'open-mix': openMix(id); break;
      case 'mix-back':
        if (S.editor && S.editor.dirty && !confirm('Discard unsaved changes?')) return;
        S.editor = null; render(); break;
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
      case 'cat-del': deleteCategory(kind, id); break;
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
    }
  });

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      var tab = t.getAttribute('data-tab');
      if (S.editor && S.editor.dirty && !confirm('Discard unsaved changes?')) return;
      S.editor = null;
      S.tab = tab;
      render();
      window.scrollTo(0, 0);
    });
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
