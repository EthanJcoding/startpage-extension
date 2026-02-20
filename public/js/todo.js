// Todo timeline
(function() {
  var esc = App.esc;
  var api = App.api;

  // Resize handle hover style
  var _rs = document.createElement('style');
  _rs.textContent = '.todo-block:hover .resize-indicator{opacity:1}';
  document.head.appendChild(_rs);

  var SLOT_H = 56;
  var DEFAULT_DURATION = 60;
  var LABEL_W = 44;
  var RAIL_LEFT = LABEL_W + 1;
  var SNAP_MIN = 15;
  var DRAG_THRESHOLD = 4;

  var todoCache = { inProgress: [], done: [] };
  var timelineState = { startH: 7, endH: 22, startMin: 420 };

  function getTodoObj(item) {
    if (typeof item === 'string') return { text: item };
    return item;
  }

  function escTodoText(t) { return esc(t.replace(/'/g, "\\'")); }

  function timeToMin(t) { var p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); }
  function minToTime(m) { return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  function durationToMin(d) { if (!d) return DEFAULT_DURATION; var p = d.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); }
  function itemDuration(it) { return it.duration ? durationToMin(it.duration) : DEFAULT_DURATION; }
  function formatDuration(d) { if (!d) return ''; var p = d.split(':'); var h = parseInt(p[0]), m = parseInt(p[1]); if (h > 0 && m > 0) return h + 'h ' + m + 'm'; if (h > 0) return h + 'h'; return m + 'm'; }
  function endTime(t, dur) { return minToTime(timeToMin(t) + (dur || DEFAULT_DURATION)); }
  function snapMin(m) { return Math.round(m / SNAP_MIN) * SNAP_MIN; }
  function clampMin(m) { return Math.max(0, Math.min(23 * 60 + 45, m)); }

  // Column layout for overlapping blocks
  function layoutColumns(items) {
    var result = [];
    for (var i = 0; i < items.length; i++) {
      var aStart = timeToMin(items[i].time);
      var aEnd = aStart + itemDuration(items[i]);
      var group = [i];
      for (var j = 0; j < items.length; j++) {
        if (j === i) continue;
        var bStart = timeToMin(items[j].time);
        var bEnd = bStart + itemDuration(items[j]);
        if (aStart < bEnd && aEnd > bStart) group.push(j);
      }
      group.sort(function(a, b) { return a - b; });
      var col = group.indexOf(i);
      result.push({ col: col, total: group.length });
    }
    return result;
  }

  function dragAttrs(it) {
    return ' data-drag-todo="' + esc(it.text) + '" data-drag-section="' + it.section + '" data-drag-time="' + (it.time ? esc(it.time) : '') + '" data-drag-duration="' + (it.duration ? esc(it.duration) : '') + '"';
  }

  function renderTodoBlock(it) {
    var dur = itemDuration(it);
    var end = endTime(it.time, dur);
    if (it.done) {
      return '<div' + dragAttrs(it) + ' class="group h-full rounded-lg overflow-hidden flex flex-col justify-center px-2.5 py-1.5 transition-colors duration-150 bg-grn-dim/60 border border-grn/15 hover:bg-grn-dim cursor-grab active:cursor-grabbing">' +
        '<div class="flex items-center gap-2 min-w-0">' +
          '<button class="w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 p-0 text-[8px] bg-grn border-[1.5px] border-grn text-white cursor-default" data-no-drag>✓</button>' +
          '<span class="flex-1 text-[.78rem] text-grn/50 line-through leading-tight truncate">' + esc(it.text) + '</span>' +
          '<button class="opacity-0 group-hover:opacity-100 w-4 h-4 border-none bg-transparent text-grn/30 cursor-pointer rounded flex items-center justify-center transition-all duration-200 text-[9px] shrink-0 p-0 hover:text-accent" data-no-drag onclick="window.__deleteTodo(\'' + escTodoText(it.text) + '\',\'done\')">✕</button>' +
        '</div>' +
        '<span class="text-[.6rem] tabular-nums text-grn/35 mt-0.5 line-through">' + esc(it.time) + ' – ' + esc(end) + '</span>' +
      '</div>';
    }
    return '<div' + dragAttrs(it) + ' class="group h-full rounded-lg overflow-hidden flex flex-col justify-center px-2.5 py-1.5 transition-colors duration-150 bg-blu-dim border border-blu/15 hover:border-blu/30 cursor-grab active:cursor-grabbing">' +
      '<div class="flex items-center gap-2 min-w-0">' +
        '<button class="w-[14px] h-[14px] border-[1.5px] border-blu/30 rounded-[3px] cursor-pointer flex items-center justify-center transition-all duration-200 shrink-0 bg-transparent p-0 text-transparent text-[8px] hover:border-accent hover:bg-accent-dim" data-no-drag onclick="window.__completeTodo(\'' + escTodoText(it.text) + '\')">✓</button>' +
        '<span class="flex-1 text-[.78rem] text-txt-primary leading-tight truncate font-medium">' + esc(it.text) + '</span>' +
        '<button class="opacity-0 group-hover:opacity-100 w-4 h-4 border-none bg-transparent text-txt-tertiary cursor-pointer rounded flex items-center justify-center transition-all duration-200 text-[9px] shrink-0 p-0 hover:text-accent" data-no-drag onclick="window.__deleteTodo(\'' + escTodoText(it.text) + '\',\'inProgress\')">✕</button>' +
      '</div>' +
      '<span class="text-[.6rem] tabular-nums text-blu/60 mt-0.5">' + esc(it.time) + ' – ' + esc(end) + '</span>' +
    '</div>';
  }

  function renderNoTimeItem(it) {
    var durBadge = it.duration ? '<span class="text-[.68rem] tabular-nums text-txt-tertiary bg-deep rounded px-1.5 py-0.5 border border-border/50 shrink-0">' + formatDuration(it.duration) + '</span>' : '';
    if (it.done) {
      return '<div' + dragAttrs(it) + ' class="group flex items-center gap-2.5 py-[5px] px-2.5 rounded-lg transition-colors duration-150 bg-grn-dim/50 hover:bg-grn-dim cursor-grab active:cursor-grabbing">' +
        '<button class="w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 p-0 text-[8px] bg-grn border-[1.5px] border-grn text-white cursor-default" data-no-drag>✓</button>' +
        '<span class="flex-1 text-[.8rem] text-grn/50 line-through leading-snug">' + esc(it.text) + '</span>' +
        (it.duration ? '<span class="text-[.68rem] tabular-nums text-grn/40 bg-grn-dim rounded px-1.5 py-0.5 border border-grn/10 shrink-0 line-through">' + formatDuration(it.duration) + '</span>' : '') +
        '<button class="opacity-0 group-hover:opacity-100 w-4 h-4 border-none bg-transparent text-grn/30 cursor-pointer rounded flex items-center justify-center transition-all duration-200 text-[9px] shrink-0 p-0 hover:text-accent" data-no-drag onclick="window.__deleteTodo(\'' + escTodoText(it.text) + '\',\'done\')">✕</button>' +
      '</div>';
    }
    return '<div' + dragAttrs(it) + ' class="group flex items-center gap-2.5 py-[5px] px-2.5 rounded-lg transition-colors duration-150 bg-input/80 border border-border/50 hover:bg-input cursor-grab active:cursor-grabbing">' +
      '<button class="w-[14px] h-[14px] border-[1.5px] border-border-h rounded-[3px] cursor-pointer flex items-center justify-center transition-all duration-200 shrink-0 bg-transparent p-0 text-transparent text-[8px] hover:border-accent hover:bg-accent-dim" data-no-drag onclick="window.__completeTodo(\'' + escTodoText(it.text) + '\')">✓</button>' +
      '<span class="flex-1 text-[.8rem] text-txt-primary leading-snug">' + esc(it.text) + '</span>' +
      durBadge +
      '<button class="opacity-0 group-hover:opacity-100 w-4 h-4 border-none bg-transparent text-txt-tertiary cursor-pointer rounded flex items-center justify-center transition-all duration-200 text-[9px] shrink-0 p-0 hover:text-accent" data-no-drag onclick="window.__deleteTodo(\'' + escTodoText(it.text) + '\',\'inProgress\')">✕</button>' +
    '</div>';
  }

  function renderTimeline(inProg, done) {
    var container = document.getElementById('todoContent');
    var total = inProg.length + done.length;
    document.getElementById('todoCount').textContent = total;

    var timed = [], noTime = [];
    for (var i = 0; i < inProg.length; i++) {
      var o = getTodoObj(inProg[i]);
      var it = { text: o.text || o.title || '', time: o.time, duration: o.duration, done: false, section: 'inProgress' };
      if (it.time) timed.push(it); else noTime.push(it);
    }
    for (var j = 0; j < done.length; j++) {
      var od = getTodoObj(done[j]);
      var dt = { text: od.text || od.title || '', time: od.time, duration: od.duration, done: true, section: 'done' };
      if (dt.time) timed.push(dt); else noTime.push(dt);
    }
    timed.sort(function(a, b) { return a.time.localeCompare(b.time); });

    var now = new Date();
    var currentHour = now.getHours();
    var currentMin = now.getMinutes();
    var nowMin = currentHour * 60 + currentMin;

    var startH = 7, endH = 22;
    for (var ti = 0; ti < timed.length; ti++) {
      var h = parseInt(timed[ti].time.split(':')[0]);
      if (h < startH) startH = h;
      var eh = parseInt(endTime(timed[ti].time, itemDuration(timed[ti])).split(':')[0]);
      if (eh > endH) endH = Math.min(23, eh);
    }
    if (currentHour < startH) startH = currentHour;
    if (currentHour > endH) endH = currentHour;
    startH = Math.max(0, startH - 1);
    endH = Math.min(23, endH + 1);

    timelineState.startH = startH;
    timelineState.endH = endH;
    timelineState.startMin = startH * 60;

    var totalH = (endH - startH + 1) * SLOT_H;
    var startMin = timelineState.startMin;
    var cols = layoutColumns(timed);

    var html = '<div id="timelineGrid" class="relative" style="height:' + totalH + 'px">';

    // Hour grid
    for (var h = startH; h <= endH; h++) {
      var y = (h - startH) * SLOT_H;
      var isCurrent = (h === currentHour);
      var isPast = (h < currentHour);
      var hourStr = String(h).padStart(2, '0') + ':00';
      html += '<div class="absolute select-none" style="top:' + y + 'px;left:0;width:' + LABEL_W + 'px">';
      html += '<span class="text-[.68rem] tabular-nums leading-none block text-right pr-2.5 -mt-[5px] ' + (isCurrent ? 'text-accent font-bold' : isPast ? 'text-txt-tertiary/40' : 'text-txt-tertiary') + '">' + hourStr + '</span>';
      html += '</div>';
      html += '<div class="absolute h-px ' + (isCurrent ? 'bg-accent/15' : isPast ? 'bg-border/40' : 'bg-border/70') + '" style="top:' + y + 'px;left:' + (RAIL_LEFT + 4) + 'px;right:0"></div>';
    }

    // Rail
    html += '<div class="absolute top-0 w-[2px] bg-border/60 rounded-full" style="left:' + RAIL_LEFT + 'px;height:' + totalH + 'px"></div>';

    // Blocks
    var contentLeft = RAIL_LEFT + 10;
    for (var bi = 0; bi < timed.length; bi++) {
      var b = timed[bi];
      var bMin = timeToMin(b.time);
      var topPx = (bMin - startMin) / 60 * SLOT_H;
      var heightPx = itemDuration(b) / 60 * SLOT_H;
      var col = cols[bi];
      var colFrac = col.col / col.total;
      var widFrac = 1 / col.total;
      var oLeft = 'calc(' + contentLeft + 'px + (100% - ' + (contentLeft + 4) + 'px)*' + colFrac + ')';
      var oWidth = 'calc((100% - ' + (contentLeft + 4) + 'px)*' + widFrac + ' - 2px)';
      html += '<div class="absolute z-10 todo-block" style="top:' + topPx + 'px;height:' + heightPx + 'px;left:' + oLeft + ';width:' + oWidth + '">';
      html += renderTodoBlock(b);
      var rhColor = b.done ? 'bg-grn/30' : 'bg-blu/30';
      html += '<div data-no-drag data-resize-handle data-resize-todo="' + esc(b.text) + '" data-resize-section="' + b.section + '" data-resize-time="' + esc(b.time) + '" data-resize-duration="' + (b.duration ? esc(b.duration) : '') + '" class="absolute -bottom-[3px] left-1 right-1 h-[8px] cursor-ns-resize z-20 flex items-center justify-center rounded-b-lg"><div class="resize-indicator w-6 h-[3px] rounded-full ' + rhColor + ' opacity-0 transition-opacity"></div></div>';
      html += '</div>';
    }

    if (nowMin >= startMin && nowMin <= (endH + 1) * 60) {
      var nowPx = (nowMin - startMin) / 60 * SLOT_H;
      html += '<div id="nowIndicator" class="absolute flex items-center z-30 pointer-events-none transition-[top] duration-[60s] linear" style="top:' + nowPx + 'px;left:' + (RAIL_LEFT - 4) + 'px;right:0">';
      html += '<div class="w-[10px] h-[10px] rounded-full bg-accent border-2 border-card shrink-0"></div>';
      html += '<div class="flex-1 h-[2px] bg-accent/60"></div>';
      html += '</div>';
    }

    html += '</div>';

    // Unscheduled
    if (noTime.length) {
      html += '<div id="unscheduledZone" class="mt-3 pt-3 border-t border-border transition-colors duration-150">';
      html += '<div class="text-[.68rem] font-semibold uppercase tracking-widest text-txt-tertiary mb-2 pl-1 flex items-center gap-2">';
      html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      html += '<span class="unscheduled-label">미배정</span><span class="flex-1 h-px bg-border"></span></div>';
      for (var n = 0; n < noTime.length; n++) {
        html += renderNoTimeItem(noTime[n]);
      }
      html += '</div>';
    }

    container.innerHTML = html;

    var scrollTarget = (nowMin - startMin) / 60 * SLOT_H - 80;
    if (scrollTarget > 0) container.scrollTop = scrollTarget;
  }

  var drag = { active: false, started: false, text: '', section: '', origTime: '', origDuration: '', el: null, ghost: null, tooltip: null, dropLine: null, startX: 0, startY: 0, offsetY: 0, snapTime: null };
  var resize = { active: false, started: false, text: '', section: '', time: '', origDur: 0, newDur: 0, el: null, tooltip: null, startY: 0 };

  function pxToMin(px) { return px / SLOT_H * 60 + timelineState.startMin; }
  function minToPx(m) { return (m - timelineState.startMin) / 60 * SLOT_H; }

  function createGhost(srcEl) {
    var rect = srcEl.getBoundingClientRect();
    var g = srcEl.cloneNode(true);
    g.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:.85;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);transform:scale(1.02);width:' + rect.width + 'px;height:' + rect.height + 'px;left:' + rect.left + 'px;top:' + rect.top + 'px';
    document.body.appendChild(g);
    return g;
  }

  function createTooltip() {
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;z-index:10000;pointer-events:none;opacity:0;transition:opacity .1s';
    t.className = 'bg-txt-primary text-white text-[.72rem] font-semibold tabular-nums px-2.5 py-1 rounded-md shadow-lg';
    document.body.appendChild(t);
    return t;
  }

  function createDropLine() {
    var l = document.createElement('div');
    l.style.cssText = 'position:absolute;z-index:20;pointer-events:none;left:' + (RAIL_LEFT + 4) + 'px;right:0;height:2px;background:rgb(var(--c-blu));border-radius:1px;opacity:0;transition:opacity .15s';
    return l;
  }

  function startDrag(e) {
    var rh = e.target.closest('[data-resize-handle]');
    if (rh) {
      e.preventDefault();
      resize.active = true;
      resize.started = false;
      resize.text = rh.getAttribute('data-resize-todo');
      resize.section = rh.getAttribute('data-resize-section');
      resize.time = rh.getAttribute('data-resize-time');
      resize.origDur = rh.getAttribute('data-resize-duration') ? durationToMin(rh.getAttribute('data-resize-duration')) : DEFAULT_DURATION;
      resize.newDur = resize.origDur;
      resize.el = rh.closest('.todo-block');
      resize.startY = e.clientY;
      return;
    }
    var target = e.target.closest('[data-drag-todo]');
    if (!target || e.target.closest('[data-no-drag]')) return;
    drag.active = true;
    drag.started = false;
    drag.text = target.getAttribute('data-drag-todo');
    drag.section = target.getAttribute('data-drag-section');
    drag.origTime = target.getAttribute('data-drag-time');
    drag.origDuration = target.getAttribute('data-drag-duration');
    drag.el = target.closest('.todo-block') || target;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    drag.offsetY = e.clientY - drag.el.getBoundingClientRect().top;
    e.preventDefault();
  }

  function moveResize(e) {
    var dy = e.clientY - resize.startY;
    if (!resize.started) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      resize.started = true;
      resize.tooltip = createTooltip();
      document.body.style.cursor = 'ns-resize';
      document.body.classList.add('select-none');
    }
    var grid = document.getElementById('timelineGrid');
    if (!grid) return;
    var gridRect = grid.getBoundingClientRect();
    var startMin = timeToMin(resize.time);
    var relY = e.clientY - gridRect.top;
    var endMin = snapMin(clampMin(pxToMin(relY)));
    var newDur = endMin - startMin;
    if (newDur < SNAP_MIN) newDur = SNAP_MIN;
    resize.newDur = newDur;
    resize.el.style.height = (newDur / 60 * SLOT_H) + 'px';
    resize.tooltip.textContent = minToTime(startMin) + ' – ' + minToTime(startMin + newDur) + '  ' + formatDuration(minToTime(newDur));
    resize.tooltip.style.opacity = '1';
    resize.tooltip.style.left = (e.clientX + 14) + 'px';
    resize.tooltip.style.top = (e.clientY - 10) + 'px';
  }

  function endResize() {
    var didResize = resize.started;
    var newDur = resize.newDur;
    var text = resize.text;
    var section = resize.section;
    var origDur = resize.origDur;
    if (resize.tooltip) resize.tooltip.remove();
    resize.tooltip = null;
    document.body.style.cursor = '';
    document.body.classList.remove('select-none');
    resize.active = false;
    resize.started = false;
    if (!didResize || newDur === origDur) return;
    var durStr = minToTime(newDur);
    api('/api/todos/duration', { method: 'PATCH', body: JSON.stringify({ text: text, section: section, duration: durStr }) })
      .then(function() { App.loadTodos(); })
      .catch(function() { App.loadTodos(); });
  }

  function moveDrag(e) {
    if (resize.active) { moveResize(e); return; }
    if (!drag.active) return;
    var dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    if (!drag.started) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      drag.started = true;
      drag.ghost = createGhost(drag.el);
      drag.tooltip = createTooltip();
      drag.el.style.opacity = '0.25';
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('select-none');
      var grid = document.getElementById('timelineGrid');
      if (grid) { drag.dropLine = createDropLine(); grid.appendChild(drag.dropLine); }
    }
    drag.ghost.style.left = (drag.startX + dx - drag.ghost.offsetWidth / 2) + 'px';
    drag.ghost.style.top = (e.clientY - drag.offsetY) + 'px';

    var grid = document.getElementById('timelineGrid');
    if (grid) {
      var gridRect = grid.getBoundingClientRect();
      var dragDur = drag.origDuration ? durationToMin(drag.origDuration) : DEFAULT_DURATION;
      var relY = e.clientY - gridRect.top;
      var rawMin = pxToMin(relY) - dragDur / 2;
      var snapped = clampMin(snapMin(rawMin));
      drag.snapTime = minToTime(snapped);
      drag.tooltip.textContent = drag.snapTime + ' – ' + minToTime(snapped + dragDur);
      drag.tooltip.style.opacity = '1';
      drag.tooltip.style.left = (e.clientX + 14) + 'px';
      drag.tooltip.style.top = (e.clientY - 10) + 'px';
      if (drag.dropLine) { drag.dropLine.style.top = minToPx(snapped) + 'px'; drag.dropLine.style.opacity = '1'; }
    }

    var uz = document.getElementById('unscheduledZone');
    if (uz) {
      var uzRect = uz.getBoundingClientRect();
      var over = e.clientY >= uzRect.top && e.clientY <= uzRect.bottom;
      var label = uz.querySelector('.unscheduled-label');
      if (over && drag.origTime) {
        uz.style.background = 'rgb(var(--c-blu)/.06)';
        uz.style.borderRadius = '8px';
        if (label) label.textContent = '여기에 놓으면 시간 해제';
        drag.snapTime = '';
        if (drag.tooltip) drag.tooltip.style.opacity = '0';
        if (drag.dropLine) drag.dropLine.style.opacity = '0';
      } else {
        uz.style.background = '';
        uz.style.borderRadius = '';
        if (label) label.textContent = '미배정';
      }
    }
  }

  function endDrag() {
    if (resize.active) { endResize(); return; }
    if (!drag.active) return;
    var didDrag = drag.started, newTime = drag.snapTime, text = drag.text, section = drag.section, origTime = drag.origTime;
    if (drag.ghost) drag.ghost.remove();
    if (drag.tooltip) drag.tooltip.remove();
    if (drag.dropLine) drag.dropLine.remove();
    if (drag.el) drag.el.style.opacity = '';
    drag.ghost = null; drag.tooltip = null; drag.dropLine = null;
    document.body.style.cursor = '';
    document.body.classList.remove('select-none');
    var uz = document.getElementById('unscheduledZone');
    if (uz) { uz.style.background = ''; uz.style.borderRadius = ''; var lb = uz.querySelector('.unscheduled-label'); if (lb) lb.textContent = '미배정'; }
    drag.active = false; drag.started = false;
    if (!didDrag || newTime === null || newTime === undefined) return;
    var changed = (newTime === '' && origTime !== '') || (newTime !== '' && newTime !== origTime);
    if (!changed) return;
    var body = { text: text, section: section };
    if (newTime !== '') body.time = newTime;
    api('/api/todos/time', { method: 'PATCH', body: JSON.stringify(body) }).then(function() { App.loadTodos(); }).catch(function() { App.loadTodos(); });
  }

  document.getElementById('todoContent').addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', moveDrag);
  document.addEventListener('mouseup', endDrag);

  setInterval(function() {
    var el = document.getElementById('nowIndicator');
    if (!el) return;
    var n = new Date();
    var px = (n.getHours() * 60 + n.getMinutes() - timelineState.startMin) / 60 * SLOT_H;
    el.style.top = px + 'px';
  }, 30000);

  App.loadTodos = async function() {
    var container = document.getElementById('todoContent');
    try {
      var data = await api('/api/todos');
      var inProg = data.inProgress || data.in_progress || [];
      var done = data.done || data.completed || [];
      todoCache = { inProgress: inProg, done: done };
      renderTimeline(inProg, done);
    } catch (e) {
      container.innerHTML = '<div class="text-center py-6 px-5 text-accent text-[.85rem]">할 일을 불러올 수 없습니다<br><button class="mt-2.5 bg-accent-dim text-accent border border-accent-dim px-4 py-1.5 rounded-md cursor-pointer text-[.8rem] font-sans transition-all duration-200 hover:bg-accent hover:text-white" onclick="window.__retryTodos()">다시 시도</button></div>';
    }
  };
  window.__retryTodos = App.loadTodos;

  window.__completeTodo = async function(text) {
    try { await api('/api/todos/complete', { method: 'PATCH', body: JSON.stringify({ text: text }) }); } catch (e) {}
    App.loadTodos();
  };

  window.__deleteTodo = async function(text, section) {
    try { await api('/api/todos', { method: 'DELETE', body: JSON.stringify({ text: text, section: section }) }); } catch (e) {}
    App.loadTodos();
  };

  (function initTimeInput() {
    var hhInput = document.getElementById('todoTimeHH');
    var mmInput = document.getElementById('todoTimeMM');
    var clearBtn = document.getElementById('todoTimeClear');
    var wrapper = document.getElementById('todoTimeInput');
    var state = { hh: '', mm: '' };

    function pad(n) { return String(n).padStart(2, '0'); }
    function clamp(v, max) { var n = parseInt(v, 10); return isNaN(n) ? 0 : Math.max(0, Math.min(max, n)); }

    function updateClear() {
      var has = hhInput.value !== '' || mmInput.value !== '';
      clearBtn.classList.toggle('hidden', !has);
    }

    function updateFocus() {
      var a = document.activeElement;
      hhInput.classList.toggle('bg-accent-dim', a === hhInput);
      mmInput.classList.toggle('bg-accent-dim', a === mmInput);
    }

    function onKey(e, input, bufKey, isHH) {
      if (e.key === 'Enter') { e.preventDefault(); addTodo(); return; }

      var max = isHH ? 12 : 59;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        var v = parseInt(input.value, 10);
        if (isNaN(v)) v = isHH ? 1 : 0;
        v = e.key === 'ArrowUp' ? (v >= max ? 0 : v + 1) : (v <= 0 ? max : v - 1);
        input.value = pad(v);
        input.select();
        state[bufKey] = '';
        if (isHH && mmInput.value === '') mmInput.value = '00';
        updateClear();
        return;
      }

      if (e.key === 'ArrowRight' && isHH && input.selectionStart >= input.value.length) {
        e.preventDefault(); mmInput.focus(); return;
      }
      if (e.key === 'ArrowLeft' && !isHH && input.selectionStart === 0) {
        e.preventDefault(); hhInput.focus(); return;
      }

      if (e.key === 'Tab') {
        if (isHH && !e.shiftKey) {
          e.preventDefault();
          state[bufKey] = '';
          if (input.value !== '') input.value = pad(clamp(input.value, max));
          mmInput.focus();
        } else if (!isHH && e.shiftKey) {
          e.preventDefault();
          state[bufKey] = '';
          if (input.value !== '') input.value = pad(clamp(input.value, max));
          hhInput.focus();
        }
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (input.value === '' || input.value === '0' || input.value === '00') {
          input.value = '';
          state[bufKey] = '';
          if (!isHH && hhInput.value === '') { }
        } else {
          input.value = '';
          state[bufKey] = '';
        }
        input.placeholder = isHH ? 'H' : 'M';
        updateClear();
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        var buf = state[bufKey] + e.key;
        var threshold = isHH ? 1 : 5;

        if (buf.length === 1) {
          if (parseInt(e.key) > threshold) {
            input.value = pad(parseInt(e.key));
            state[bufKey] = '';
            if (isHH) { if (mmInput.value === '') mmInput.value = '00'; mmInput.focus(); }
          } else {
            input.value = e.key;
            state[bufKey] = buf;
          }
        } else {
          input.value = pad(Math.min(parseInt(buf, 10), max));
          state[bufKey] = '';
          if (isHH) { if (mmInput.value === '') mmInput.value = '00'; mmInput.focus(); }
        }
        updateClear();
        return;
      }

      e.preventDefault();
    }

    hhInput.addEventListener('keydown', function(e) { onKey(e, hhInput, 'hh', true); });
    mmInput.addEventListener('keydown', function(e) { onKey(e, mmInput, 'mm', false); });

    hhInput.addEventListener('focus', function() { state.hh = ''; if (hhInput.value) hhInput.select(); updateFocus(); });
    mmInput.addEventListener('focus', function() { state.mm = ''; if (mmInput.value) mmInput.select(); updateFocus(); });
    hhInput.addEventListener('blur', function() {
      if (hhInput.value !== '') hhInput.value = pad(clamp(hhInput.value, 12));
      state.hh = '';
      updateFocus();
    });
    mmInput.addEventListener('blur', function() {
      if (mmInput.value !== '') mmInput.value = pad(clamp(mmInput.value, 59));
      state.mm = '';
      updateFocus();
    });

    hhInput.addEventListener('mouseup', function(e) { e.preventDefault(); });
    mmInput.addEventListener('mouseup', function(e) { e.preventDefault(); });

    clearBtn.addEventListener('click', function() {
      hhInput.value = '';
      mmInput.value = '';
      state.hh = '';
      state.mm = '';
      updateClear();
    });
  })();

  function getDurationValue() {
    var hh = document.getElementById('todoTimeHH').value.trim();
    var mm = document.getElementById('todoTimeMM').value.trim();
    if (hh === '' && mm === '') return undefined;
    hh = String(Math.max(0, Math.min(12, parseInt(hh, 10) || 0))).padStart(2, '0');
    mm = String(Math.max(0, Math.min(59, parseInt(mm, 10) || 0))).padStart(2, '0');
    return hh + ':' + mm;
  }

  function clearTimeInput() {
    document.getElementById('todoTimeHH').value = '';
    document.getElementById('todoTimeMM').value = '';
    document.getElementById('todoTimeClear').classList.add('hidden');
  }

  async function addTodo() {
    var input = document.getElementById('todoInput');
    var text = input.value.trim();
    if (!text) return;
    var duration = getDurationValue();
    input.value = '';
    clearTimeInput();
    try {
      var body = { text: text };
      if (duration) body.duration = duration;
      await api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
    } catch (e) {}
    App.loadTodos();
  }

  document.getElementById('todoAddBtn').addEventListener('click', addTodo);
  document.getElementById('todoInput').addEventListener('keydown', function(e) { if (e.key === 'Enter') addTodo(); });
})();
