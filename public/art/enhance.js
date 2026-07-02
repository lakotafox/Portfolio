/* ==========================================================================
   CONTROL ROOM — enhancement chrome layer
   --------------------------------------------------------------------------
   OWNED BY THE PORTFOLIO REPO, NOT THE ART-APP BUILD (see theme.css header).
   Vanilla JS, no dependencies, no build step. Injects:
     - a header bar (back link / brand / piece count) into grid mode,
     - a live title plate into viewer mode (piece name + index), driven by
       the rail's .pub-thumb.active aria-label (present in the DOM even on
       mobile, where the rail is display:none).
   If the app's markup ever changes, every query below just misses and the
   page degrades to its un-enhanced look — never an error.
   ========================================================================== */
(function () {
  'use strict';

  var BASE_TITLE = document.title;
  var lastTitle = null;
  var isSyncing = false;
  var rafPending = false;

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function buildHeader(count) {
    var header = document.createElement('header');
    header.className = 'xa-header';

    var back = document.createElement('a');
    back.className = 'xa-back';
    back.href = '/';
    back.textContent = '← Portfolio';

    var brand = document.createElement('span');
    brand.className = 'xa-brand';
    brand.textContent = '◇ Control Room';

    var tally = document.createElement('span');
    tally.className = 'xa-header-count';
    tally.textContent = count + ' live pieces';

    header.appendChild(back);
    header.appendChild(brand);
    header.appendChild(tally);
    return header;
  }

  function buildPlate() {
    var plate = document.createElement('div');
    plate.className = 'xa-plate';
    plate.setAttribute('aria-live', 'polite');

    var index = document.createElement('span');
    index.className = 'xa-plate-index';
    var title = document.createElement('h1');
    title.className = 'xa-plate-title';

    plate.appendChild(index);
    plate.appendChild(title);
    return plate;
  }

  function retrigger(el) {
    el.classList.remove('xa-swap');
    void el.offsetWidth; /* flush so the animation restarts */
    el.classList.add('xa-swap');
  }

  function syncGrid(grid) {
    /* React morphs the same root div between grid and viewer mode, so
       chrome injected in one mode survives into the other — evict it. */
    var stalePlate = grid.querySelector('.xa-plate');
    if (stalePlate) stalePlate.remove();
    if (!grid.querySelector(':scope > .xa-header')) {
      var count = grid.querySelectorAll('.pub-card').length;
      if (count > 0) grid.prepend(buildHeader(count));
    }
    lastTitle = null;
    if (document.title !== BASE_TITLE) document.title = BASE_TITLE;
  }

  function syncViewer(viewer) {
    var staleHeader = viewer.querySelector('.xa-header');
    if (staleHeader) staleHeader.remove();
    var stage = viewer.querySelector('.pub-stage');
    var active = viewer.querySelector('.pub-thumb.active');
    var title = active && active.getAttribute('aria-label');
    var plate = stage && stage.querySelector('.xa-plate');

    if (!stage || !active || !title) {
      if (plate) plate.remove();
      return;
    }

    var firstPaint = !plate;
    if (firstPaint) {
      plate = buildPlate();
      stage.appendChild(plate);
    }

    if (title !== lastTitle) {
      var total = viewer.querySelectorAll('.pub-thumb').length;
      var i = Number(active.getAttribute('data-i'));
      plate.querySelector('.xa-plate-index').textContent = isFinite(i)
        ? pad2(i + 1) + ' / ' + pad2(total)
        : '';
      plate.querySelector('.xa-plate-title').textContent = title;
      document.title = title + ' — CONTROL ROOM';
      retrigger(plate);
      if (!firstPaint) {
        var canvas = stage.querySelector('.pub-stage-canvas');
        if (canvas) retrigger(canvas);
      }
      lastTitle = title;
    }
  }

  function sync() {
    isSyncing = true;
    try {
      var grid = document.querySelector('.pub-grid');
      var viewer = document.querySelector('.pub-viewer');
      if (grid) syncGrid(grid);
      if (viewer) syncViewer(viewer);
    } catch (_) {
      /* enhancement layer must never break the app */
    } finally {
      isSyncing = false;
    }
  }

  function schedule() {
    if (isSyncing || rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      sync();
    });
  }

  var root = document.getElementById('root');
  if (!root || typeof MutationObserver === 'undefined') return;

  new MutationObserver(function (mutations) {
    for (var m = 0; m < mutations.length; m++) {
      var t = mutations[m].target;
      /* ignore churn inside our own injected chrome */
      if (t && t.closest && t.closest('.xa-header, .xa-plate')) continue;
      schedule();
      return;
    }
  }).observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  sync();
})();
