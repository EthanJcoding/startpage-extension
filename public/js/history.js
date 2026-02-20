(function() {
  var esc = App.esc;
  var api = App.api;
  var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  var historyData = [];
  var currentDateView = null;

  function escText(t) { return esc(t.replace(/'/g, "\\'")); }

  function fmtDateLabel(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var m = d.getMonth() + 1, day = d.getDate(), dow = DAYS[d.getDay()];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var diff = Math.round((today - d) / 86400000);
    var prefix = diff === 0 ? '오늘' : diff === 1 ? '어제' : diff + '일 전';
    return m + '/' + day + ' (' + dow + ') · ' + prefix;
  }

  function renderHistoryList() {
    var loading = document.getElementById('historyLoading');
    var content = document.getElementById('historyContent');
    var empty = document.getElementById('historyEmpty');
    loading.classList.add('hidden');

    if (!historyData.length) {
      empty.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }

    empty.classList.add('hidden');
    content.classList.remove('hidden');

    var html = '';
    for (var i = 0; i < historyData.length; i++) {
      var h = historyData[i];
      var total = h.inProgress + h.done;
      var pct = total ? Math.round(h.done / total * 100) : 0;
      var barColor = pct === 100 ? 'bg-grn' : pct >= 50 ? 'bg-blu' : 'bg-org';
      html += '<button class="w-full flex items-center gap-4 px-3.5 py-3 rounded-lg border-none bg-transparent text-left cursor-pointer transition-colors duration-150 font-sans hover:bg-card-hover group" onclick="window.__viewHistoryDate(\'' + h.date + '\')">';
      html += '<div class="flex-1 min-w-0">';
      html += '<div class="text-[.85rem] font-medium text-txt-primary">' + fmtDateLabel(h.date) + '</div>';
      html += '<div class="text-[.72rem] text-txt-tertiary mt-0.5">' + h.done + '/' + total + ' 완료</div>';
      html += '</div>';
      html += '<div class="w-[80px] flex items-center gap-2 shrink-0">';
      html += '<div class="flex-1 h-[4px] bg-input rounded-full overflow-hidden"><div class="h-full rounded-full ' + barColor + '" style="width:' + pct + '%"></div></div>';
      html += '<span class="text-[.68rem] tabular-nums text-txt-tertiary w-[28px] text-right">' + pct + '%</span>';
      html += '</div>';
      html += '<svg class="w-4 h-4 text-txt-tertiary/40 group-hover:text-txt-tertiary shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
      html += '</button>';
    }
    content.innerHTML = html;
  }

  function renderDateDetail(data) {
    var content = document.getElementById('historyContent');
    content.classList.remove('hidden');
    document.getElementById('historyLoading').classList.add('hidden');
    document.getElementById('historyEmpty').classList.add('hidden');

    var html = '<button class="flex items-center gap-1.5 text-[.78rem] text-txt-tertiary bg-transparent border-none cursor-pointer font-sans mb-4 px-0 transition-colors duration-150 hover:text-txt-secondary" onclick="window.__backToHistoryList()">';
    html += '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    html += '전체 목록</button>';

    html += '<div class="text-[.95rem] font-semibold text-txt-primary mb-4">' + fmtDateLabel(data.date) + '</div>';

    var allItems = [];
    for (var i = 0; i < data.done.length; i++) allItems.push({ t: data.done[i], done: true });
    for (var j = 0; j < data.inProgress.length; j++) allItems.push({ t: data.inProgress[j], done: false });

    if (!allItems.length) {
      html += '<div class="text-center py-6 text-txt-tertiary text-[.85rem]">항목이 없습니다</div>';
      content.innerHTML = html;
      return;
    }

    for (var k = 0; k < allItems.length; k++) {
      var item = allItems[k];
      var todo = item.t;
      var escaped = escText(todo.text);
      var timeStr = todo.time ? '<span class="text-[.68rem] tabular-nums text-txt-tertiary mr-2">' + esc(todo.time) + '</span>' : '';

      if (item.done) {
        html += '<div class="group flex items-center gap-2.5 py-[6px] px-2.5 rounded-lg bg-grn-dim/50 hover:bg-grn-dim transition-colors duration-150">';
        html += '<div class="w-[14px] h-[14px] rounded-[3px] flex items-center justify-center shrink-0 text-[8px] bg-grn border-[1.5px] border-grn text-white">✓</div>';
        html += '<div class="flex-1 min-w-0">' + timeStr + '<span class="text-[.8rem] text-grn/50 line-through">' + esc(todo.text) + '</span></div>';
        html += '<button class="opacity-0 group-hover:opacity-100 w-4 h-4 border-none bg-transparent text-grn/30 cursor-pointer rounded flex items-center justify-center transition-all duration-200 text-[9px] shrink-0 p-0 hover:text-accent" onclick="window.__deleteHistoryTodo(\'' + escaped + '\',\'done\')">✕</button>';
        html += '</div>';
      } else {
        html += '<div class="group flex items-center gap-2.5 py-[6px] px-2.5 rounded-lg bg-input/80 border border-border/50 hover:bg-input transition-colors duration-150">';
        html += '<button class="w-[14px] h-[14px] border-[1.5px] border-border-h rounded-[3px] cursor-pointer flex items-center justify-center transition-all duration-200 shrink-0 bg-transparent p-0 text-transparent text-[8px] hover:border-accent hover:bg-accent-dim" onclick="window.__completeHistoryTodo(\'' + escaped + '\')">✓</button>';
        html += '<div class="flex-1 min-w-0">' + timeStr + '<span class="text-[.8rem] text-txt-primary">' + esc(todo.text) + '</span></div>';
        html += '<button class="opacity-0 group-hover:opacity-100 w-4 h-4 border-none bg-transparent text-txt-tertiary cursor-pointer rounded flex items-center justify-center transition-all duration-200 text-[9px] shrink-0 p-0 hover:text-accent" onclick="window.__deleteHistoryTodo(\'' + escaped + '\',\'inProgress\')">✕</button>';
        html += '</div>';
      }
    }

    content.innerHTML = html;
  }

  window.__openHistoryModal = async function() {
    currentDateView = null;
    var backdrop = document.getElementById('historyBackdrop');
    backdrop.style.display = 'flex';
    document.getElementById('historyLoading').classList.remove('hidden');
    document.getElementById('historyContent').classList.add('hidden');
    document.getElementById('historyEmpty').classList.add('hidden');

    try {
      historyData = await api('/api/todos/history');
      renderHistoryList();
    } catch (e) {
      document.getElementById('historyLoading').classList.add('hidden');
      document.getElementById('historyEmpty').classList.remove('hidden');
    }
  };

  window.__closeHistoryModal = function() {
    document.getElementById('historyBackdrop').style.display = 'none';
  };

  window.__viewHistoryDate = async function(date) {
    currentDateView = date;
    document.getElementById('historyLoading').classList.remove('hidden');
    document.getElementById('historyContent').classList.add('hidden');

    try {
      var data = await api('/api/todos/history/date?date=' + date);
      renderDateDetail(data);
    } catch (e) {
      document.getElementById('historyLoading').classList.add('hidden');
      document.getElementById('historyContent').innerHTML = '<div class="text-center py-6 text-accent text-[.85rem]">불러올 수 없습니다</div>';
      document.getElementById('historyContent').classList.remove('hidden');
    }
  };

  window.__backToHistoryList = function() {
    currentDateView = null;
    renderHistoryList();
  };

  window.__completeHistoryTodo = async function(text) {
    if (!currentDateView) return;
    try {
      var data = await api('/api/todos/history/complete', { method: 'PATCH', body: JSON.stringify({ date: currentDateView, text: text }) });
      updateHistoryEntry(data);
      renderDateDetail(data);
    } catch (e) {}
  };

  window.__deleteHistoryTodo = async function(text, section) {
    if (!currentDateView) return;
    try {
      var data = await api('/api/todos/history', { method: 'DELETE', body: JSON.stringify({ date: currentDateView, text: text, section: section }) });
      updateHistoryEntry(data);
      renderDateDetail(data);
    } catch (e) {}
  };

  function updateHistoryEntry(data) {
    for (var i = 0; i < historyData.length; i++) {
      if (historyData[i].date === data.date) {
        historyData[i].inProgress = data.inProgress.length;
        historyData[i].done = data.done.length;
        break;
      }
    }
  }
})();
