// Date, time, work-time tracking
(function() {
  var DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  var workCheckOutMs = null;

  function fmtHM(d) {
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function updateDateTime() {
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
    document.getElementById('dateMain').textContent = y + '년 ' + m + '월 ' + d + '일 ' + DAYS[now.getDay()];
    var season = m >= 3 && m <= 5 ? '봄' : m >= 6 && m <= 8 ? '여름' : m >= 9 && m <= 11 ? '가을' : '겨울';
    var week = Math.ceil((now - new Date(y, 0, 1)) / 604800000);
    document.getElementById('dateSub').textContent = season + ' · ' + y + '년 제' + week + '주';
    var h = String(now.getHours()).padStart(2, '0');
    var mi = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('timeDisplay').textContent = h + ':' + mi + ':' + s;
    updateRemainingTime();
  }

  function updateRemainingTime() {
    if (!workCheckOutMs) return;
    var diff = workCheckOutMs - Date.now();
    var el = document.getElementById('remainingTime');
    if (diff <= 0) {
      el.textContent = '퇴근!';
      el.className = 'text-grn font-semibold text-[.85rem]';
    } else {
      var hrs = Math.floor(diff / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      el.textContent = hrs + '시간 ' + mins + '분 남음';
      el.className = 'text-blu font-medium text-[.85rem]';
    }
  }

  function showWorkTime(checkInMs) {
    document.getElementById('checkInBtn').style.display = 'none';
    document.getElementById('workTimeInfo').style.display = 'flex';
    var ciEl = document.getElementById('checkInTime');
    ciEl.textContent = fmtHM(new Date(checkInMs));
    ciEl.style.cursor = 'pointer';
    ciEl.title = '클릭하여 출근 시간 변경';
    ciEl.onclick = window.__editCheckIn;
    workCheckOutMs = checkInMs + 9 * 3600000;
    document.getElementById('checkOutTime').textContent = fmtHM(new Date(workCheckOutMs));
    updateRemainingTime();
  }

  window.__checkIn = function() {
    var now = Date.now();
    var key = 'checkIn_' + new Date().toISOString().slice(0, 10);
    localStorage.setItem(key, String(now));
    showWorkTime(now);
  };

  window.__editCheckIn = function() {
    var ciEl = document.getElementById('checkInTime');
    var parts = ciEl.textContent.split(':');
    var origHH = parts[0] || '09';
    var origMM = parts[1] || '00';

    var wrapper = document.createElement('span');
    wrapper.id = 'checkInTime';
    wrapper.className = 'inline-flex items-center bg-input border border-border rounded-lg px-1.5 py-px gap-0 transition-colors duration-200';

    var hhInput = document.createElement('input');
    hhInput.type = 'text';
    hhInput.inputMode = 'numeric';
    hhInput.maxLength = 2;
    hhInput.value = origHH;
    hhInput.autocomplete = 'off';
    hhInput.className = 'w-[24px] h-auto bg-transparent border-0 outline-none text-[.9rem] font-medium tabular-nums text-txt-primary text-center rounded p-0 leading-normal caret-blu transition-colors duration-150';

    var colon = document.createElement('span');
    colon.className = 'text-txt-tertiary text-[.9rem] select-none leading-normal';
    colon.textContent = ':';

    var mmInput = document.createElement('input');
    mmInput.type = 'text';
    mmInput.inputMode = 'numeric';
    mmInput.maxLength = 2;
    mmInput.value = origMM;
    mmInput.autocomplete = 'off';
    mmInput.className = 'w-[24px] h-auto bg-transparent border-0 outline-none text-[.9rem] font-medium tabular-nums text-txt-primary text-center rounded p-0 leading-normal caret-blu transition-colors duration-150';

    wrapper.appendChild(hhInput);
    wrapper.appendChild(colon);
    wrapper.appendChild(mmInput);
    ciEl.replaceWith(wrapper);
    hhInput.focus();
    hhInput.select();

    var state = { hh: '', mm: '', done: false };

    function pad(n) { return String(n).padStart(2, '0'); }
    function clamp(v, max) { var n = parseInt(v, 10); return isNaN(n) ? 0 : Math.max(0, Math.min(max, n)); }

    function updateFocus() {
      var a = document.activeElement;
      hhInput.classList.toggle('bg-blu-dim', a === hhInput);
      mmInput.classList.toggle('bg-blu-dim', a === mmInput);
      wrapper.classList.toggle('border-blu', a === hhInput || a === mmInput);
      wrapper.classList.toggle('border-border', a !== hhInput && a !== mmInput);
    }

    function teardown() {
      var span = document.createElement('span');
      span.id = 'checkInTime';
      span.className = 'text-txt-primary font-medium tabular-nums';
      wrapper.replaceWith(span);
    }

    function commit() {
      if (state.done) return;
      state.done = true;
      var hh = clamp(hhInput.value, 23);
      var mm = clamp(mmInput.value, 59);
      var today = new Date();
      today.setHours(hh, mm, 0, 0);
      var newMs = today.getTime();
      var key = 'checkIn_' + new Date().toISOString().slice(0, 10);
      localStorage.setItem(key, String(newMs));
      teardown();
      showWorkTime(newMs);
    }

    function revert() {
      if (state.done) return;
      state.done = true;
      teardown();
      var key = 'checkIn_' + new Date().toISOString().slice(0, 10);
      var stored = localStorage.getItem(key);
      if (stored) showWorkTime(parseInt(stored));
    }

    function onKey(e, input, bufKey, isHH) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); return; }
      if (e.key === 'Escape') { e.preventDefault(); revert(); return; }

      var max = isHH ? 23 : 59;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        var v = parseInt(input.value, 10) || 0;
        v = e.key === 'ArrowUp' ? (v >= max ? 0 : v + 1) : (v <= 0 ? max : v - 1);
        input.value = pad(v);
        input.select();
        state[bufKey] = '';
        return;
      }

      if (e.key === 'ArrowRight' && isHH && input.selectionStart >= input.value.length) {
        e.preventDefault(); mmInput.focus(); return;
      }
      if (e.key === 'ArrowLeft' && !isHH && input.selectionStart === 0) {
        e.preventDefault(); hhInput.focus(); return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        state[bufKey] = '';
        input.value = pad(clamp(input.value, max));
        if (isHH && !e.shiftKey) mmInput.focus();
        else if (!isHH && e.shiftKey) hhInput.focus();
        else commit();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        state[bufKey] = '';
        input.value = pad(0);
        input.select();
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        var buf = state[bufKey] + e.key;
        var threshold = isHH ? 2 : 5;

        if (buf.length === 1) {
          if (parseInt(e.key) > threshold) {
            input.value = pad(parseInt(e.key));
            state[bufKey] = '';
            if (isHH) mmInput.focus();
          } else {
            input.value = e.key;
            state[bufKey] = buf;
          }
        } else {
          input.value = pad(Math.min(parseInt(buf, 10), max));
          state[bufKey] = '';
          if (isHH) mmInput.focus();
        }
        return;
      }

      e.preventDefault();
    }

    hhInput.addEventListener('keydown', function(e) { onKey(e, hhInput, 'hh', true); });
    mmInput.addEventListener('keydown', function(e) { onKey(e, mmInput, 'mm', false); });

    hhInput.addEventListener('focus', function() { state.hh = ''; hhInput.select(); updateFocus(); });
    mmInput.addEventListener('focus', function() { state.mm = ''; mmInput.select(); updateFocus(); });
    hhInput.addEventListener('blur', function() { hhInput.value = pad(clamp(hhInput.value, 23)); state.hh = ''; });
    mmInput.addEventListener('blur', function() { mmInput.value = pad(clamp(mmInput.value, 59)); state.mm = ''; });

    hhInput.addEventListener('mouseup', function(e) { e.preventDefault(); });
    mmInput.addEventListener('mouseup', function(e) { e.preventDefault(); });

    wrapper.addEventListener('focusout', function() {
      setTimeout(function() {
        if (!state.done && !wrapper.contains(document.activeElement)) commit();
      }, 80);
    });
  };

  window.__resetCheckIn = function() {
    var key = 'checkIn_' + new Date().toISOString().slice(0, 10);
    localStorage.removeItem(key);
    workCheckOutMs = null;
    document.getElementById('checkInBtn').style.display = 'inline-block';
    document.getElementById('workTimeInfo').style.display = 'none';
  };

  function dismissOverlay() {
    var overlay = document.getElementById('checkInOverlay');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity .25s ease';
      setTimeout(function() { overlay.style.display = 'none'; }, 250);
    }
  }

  var origCheckIn = window.__checkIn;
  window.__checkIn = function() {
    origCheckIn();
    dismissOverlay();
  };

  document.getElementById('overlayCheckInBtn').addEventListener('click', function() {
    window.__checkIn();
  });

  document.getElementById('overlaySkipBtn').addEventListener('click', function() {
    dismissOverlay();
  });

  updateDateTime();
  setInterval(updateDateTime, 1000);

  var key = 'checkIn_' + new Date().toISOString().slice(0, 10);
  var stored = localStorage.getItem(key);
  if (stored) {
    showWorkTime(parseInt(stored));
  } else {
    var overlay = document.getElementById('checkInOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
    }
  }
})();
