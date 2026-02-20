// 15-minute Pomodoro timer
(function() {
  var DURATION = 15 * 60; // 15 minutes in seconds
  var CIRCUMFERENCE = 2 * Math.PI * 62; // matches SVG circle r=62
  var remaining = DURATION;
  var running = false;
  var interval = null;
  var sessions = parseInt(localStorage.getItem('pomodoroSessions') || '0');

  var timeEl = document.getElementById('pomodoroTime');
  var labelEl = document.getElementById('pomodoroLabel');
  var progressEl = document.getElementById('pomodoroProgress');
  var startBtn = document.getElementById('pomodoroStartBtn');
  var countEl = document.getElementById('pomodoroCount');

  function fmt(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function render() {
    timeEl.textContent = fmt(remaining);
    var progress = 1 - remaining / DURATION;
    progressEl.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE * (1 - progress)));

    // Color transitions: accent(red) -> org -> yel -> grn as progress increases
    if (progress < 0.25) {
      progressEl.setAttribute('stroke', 'var(--color-accent)');
    } else if (progress < 0.5) {
      progressEl.setAttribute('stroke', 'var(--color-org)');
    } else if (progress < 0.75) {
      progressEl.setAttribute('stroke', 'var(--color-yel)');
    } else {
      progressEl.setAttribute('stroke', 'var(--color-grn)');
    }
  }

  function updateCount() {
    countEl.textContent = sessions + '회 완료';
  }

  function tick() {
    if (remaining <= 0) {
      complete();
      return;
    }
    remaining--;
    render();
  }

  function complete() {
    running = false;
    clearInterval(interval);
    interval = null;
    sessions++;
    localStorage.setItem('pomodoroSessions', String(sessions));
    updateCount();

    startBtn.textContent = '시작';
    labelEl.textContent = '완료!';
    labelEl.className = 'text-[.72rem] text-grn font-semibold mt-0.5';
    progressEl.setAttribute('stroke', 'var(--color-grn)');

    // Pulse animation on complete
    timeEl.style.transform = 'scale(1.15)';
    setTimeout(function() { timeEl.style.transform = 'scale(1)'; }, 300);

    // Notification if supported
    if (Notification.permission === 'granted') {
      new Notification('뽀모도로 완료!', { body: '15분 집중 세션을 완료했습니다. (' + sessions + '회)', icon: '🍅' });
    }
  }

  window.__pomodoroToggle = function() {
    if (running) {
      // Pause
      running = false;
      clearInterval(interval);
      interval = null;
      startBtn.textContent = '계속';
      labelEl.textContent = '일시정지';
      labelEl.className = 'text-[.72rem] text-org mt-0.5';
    } else {
      // Start / Resume
      if (remaining <= 0) {
        remaining = DURATION;
        render();
      }
      running = true;
      interval = setInterval(tick, 1000);
      startBtn.textContent = '정지';
      labelEl.textContent = '집중';
      labelEl.className = 'text-[.72rem] text-txt-tertiary mt-0.5';

      // Request notification permission on first start
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  window.__pomodoroReset = function() {
    running = false;
    clearInterval(interval);
    interval = null;
    remaining = DURATION;
    render();
    startBtn.textContent = '시작';
    labelEl.textContent = '집중';
    labelEl.className = 'text-[.72rem] text-txt-tertiary mt-0.5';
  };

  // Reset session count at midnight
  var todayKey = 'pomodoroDate';
  var storedDate = localStorage.getItem(todayKey);
  var today = new Date().toISOString().slice(0, 10);
  if (storedDate !== today) {
    sessions = 0;
    localStorage.setItem('pomodoroSessions', '0');
    localStorage.setItem(todayKey, today);
  }

  // Init
  render();
  updateCount();
  timeEl.style.transition = 'transform .3s ease';
})();
