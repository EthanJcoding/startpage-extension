// Dev card: Jira + GitHub PR
(function() {
  var esc = App.esc;
  var api = App.api;

  var devCache = { jira: null, 'my-pr': null, 'all-pr': null };
  var currentDevTab = 'jira';

  function showDevLoading() {
    document.getElementById('devContent').innerHTML =
      '<div class="flex flex-col gap-2.5 py-2">' +
        '<div class="flex items-center gap-3 px-3.5 py-3"><div class="skel animate-shimmer h-3 rounded w-[70px]"></div><div class="skel animate-shimmer h-3 rounded flex-1"></div></div>' +
        '<div class="flex items-center gap-3 px-3.5 py-3"><div class="skel animate-shimmer h-3 rounded w-[70px]"></div><div class="skel animate-shimmer h-3 rounded flex-1"></div></div>' +
      '</div>';
  }

  function renderJira(issues) {
    var container = document.getElementById('devContent');
    document.getElementById('devCount').textContent = issues.length;
    if (!issues.length) {
      container.innerHTML = '<div class="text-center py-8 px-5 text-txt-tertiary text-[.88rem] leading-relaxed"><span class="text-[1.6rem] mb-2 block opacity-50">□</span>이슈가 없습니다</div>';
      return;
    }
    var html = '<div class="flex flex-col gap-1.5">';
    for (var i = 0; i < issues.length; i++) {
      var is = issues[i];
      html += '<div class="flex items-start gap-3.5 px-3.5 py-3 rounded-lg transition-all duration-200 hover:bg-card-hover">' +
        '<div class="w-2 h-2 rounded-full shrink-0 mt-1.5 ' + App.priorityDot(is.priority) + '"></div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="text-[.88rem] text-txt-primary leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">' + esc(is.summary || is.title || '') + '</div>' +
          '<div class="flex items-center gap-2 mt-1">' +
            '<span class="text-[.78rem] font-bold text-blu tracking-wide">' + esc(is.key || '') + '</span>' +
            App.statusBadge(is.status || '') +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function renderPRs(prs) {
    var container = document.getElementById('devContent');
    document.getElementById('devCount').textContent = prs.length;
    if (!prs.length) {
      container.innerHTML = '<div class="text-center py-8 px-5 text-txt-tertiary text-[.88rem] leading-relaxed"><span class="text-[1.6rem] mb-2 block opacity-50">↙</span>PR이 없습니다</div>';
      return;
    }
    var html = '<div class="flex flex-col gap-1.5">';
    for (var i = 0; i < prs.length; i++) {
      var pr = prs[i];
      var href = pr.html_url || pr.htmlUrl || pr.url || '#';
      var num = pr.number || '';
      var title = pr.title || '';
      var author = pr.author || pr.user && pr.user.login || pr.user || '';
      var date = pr.created_at || pr.createdAt || pr.updated_at || pr.updatedAt || '';
      var draft = pr.draft || false;
      html += '<a class="flex items-start gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-200 cursor-pointer no-underline text-inherit hover:bg-card-hover hover:translate-x-0.5" href="' + esc(href) + '" target="_blank" rel="noopener">' +
        '<span class="text-[.78rem] font-bold text-grn shrink-0 min-w-[52px] tracking-wide pt-px">#' + esc(String(num)) + '</span>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="text-[.88rem] text-txt-primary leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">' + esc(title) + '</div>' +
          '<div class="flex items-center gap-2 mt-1 text-[.75rem] text-txt-tertiary">' +
            '<span>' + esc(typeof author === 'string' ? author : author.login || '') + '</span>' +
            (date ? ' · <span>' + App.relativeTime(date) + '</span>' : '') +
            (draft ? ' <span class="text-[.65rem] font-semibold px-2 py-0.5 rounded-full bg-yel-dim text-yel tracking-wide">DRAFT</span>' : '') +
          '</div>' +
        '</div>' +
      '</a>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  App.loadDevTab = async function(tab) {
    if (devCache[tab]) {
      if (tab === 'jira') renderJira(devCache[tab]);
      else renderPRs(devCache[tab]);
      return;
    }
    showDevLoading();
    try {
      var data;
      if (tab === 'jira') {
        data = await api('/api/jira/issues');
        data = Array.isArray(data) ? data : data.issues || [];
        devCache.jira = data;
        renderJira(data);
      } else {
        var url = tab === 'my-pr' ? '/api/github/my-prs' : '/api/github/prs';
        data = await api(url);
        data = Array.isArray(data) ? data : data.prs || data.pullRequests || [];
        devCache[tab] = data;
        renderPRs(data);
      }
    } catch (e) {
      var label = tab === 'jira' ? 'Jira' : 'GitHub PR';
      document.getElementById('devContent').innerHTML = '<div class="text-center py-6 px-5 text-accent text-[.85rem]">' + esc(label) + ' 연결 실패<br><button class="mt-2.5 bg-accent-dim text-accent border border-accent-dim px-4 py-1.5 rounded-md cursor-pointer text-[.8rem] font-sans transition-all duration-200 hover:bg-accent hover:text-white" onclick="window.__retryDev()">다시 시도</button></div>';
    }
  };
  window.__retryDev = function() { devCache[currentDevTab] = null; App.loadDevTab(currentDevTab); };

  function updateDevTabStyles() {
    document.querySelectorAll('#devTabs .dev-tab').forEach(function(btn) {
      if (btn.classList.contains('active')) {
        btn.className = 'dev-tab flex-1 py-2 px-4 border-none text-txt-primary text-[.82rem] font-medium cursor-pointer rounded-md transition-all duration-200 font-sans bg-card-hover shadow-[0_1px_3px_rgba(0,0,0,.08)] active';
      } else {
        btn.className = 'dev-tab flex-1 py-2 px-4 border-none bg-transparent text-txt-tertiary text-[.82rem] font-medium cursor-pointer rounded-md transition-all duration-200 font-sans hover:text-txt-secondary';
      }
    });
  }
  updateDevTabStyles();

  document.getElementById('devTabs').addEventListener('click', function(e) {
    var btn = e.target.closest('.dev-tab');
    if (!btn) return;
    var tab = btn.dataset.tab;
    if (tab === currentDevTab) return;
    currentDevTab = tab;
    document.querySelectorAll('#devTabs .dev-tab').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    updateDevTabStyles();
    App.loadDevTab(tab);
  });
})();
