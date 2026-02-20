// Shared utilities
window.App = window.App || {};

App.api = async function(url, opts) {
  var res = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
  if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
  var text = await res.text();
  return text ? JSON.parse(text) : null;
};

App.esc = function(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
};

App.relativeTime = function(dateStr) {
  var diff = Date.now() - new Date(dateStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return mins + '분 전';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + '시간 전';
  var days = Math.floor(hrs / 24);
  if (days < 30) return days + '일 전';
  var months = Math.floor(days / 30);
  return months + '개월 전';
};

App.statusBadge = function(status) {
  if (!status) return '';
  var s = status.toLowerCase();
  var colors = 'bg-gry-dim text-gry';
  if (s.indexOf('progress') > -1 || s.indexOf('진행') > -1) colors = 'bg-blu-dim text-blu';
  else if (s.indexOf('done') > -1 || s.indexOf('완료') > -1 || s.indexOf('close') > -1) colors = 'bg-grn-dim text-grn';
  else if (s.indexOf('review') > -1 || s.indexOf('검토') > -1) colors = 'bg-org-dim text-org';
  else if (s.indexOf('todo') > -1 || s.indexOf('to do') > -1 || s.indexOf('할') > -1 || s.indexOf('open') > -1) colors = 'bg-gry-dim text-gry';
  return '<span class="text-[.68rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap ' + colors + '">' + App.esc(status) + '</span>';
};

App.priorityDot = function(p) {
  if (!p) return 'bg-yel shadow-[0_0_6px_#ffd54f40]';
  var s = p.toLowerCase();
  if (s === 'highest' || s === 'critical' || s === 'blocker') return 'bg-[#ef5350] shadow-[0_0_6px_#ef535060]';
  if (s === 'high' || s === 'major') return 'bg-org shadow-[0_0_6px_#ffb74d60]';
  if (s === 'low' || s === 'minor') return 'bg-grn shadow-[0_0_6px_#3ddc8440]';
  if (s === 'lowest' || s === 'trivial') return 'bg-gry';
  return 'bg-yel shadow-[0_0_6px_#ffd54f40]';
};
