// Lunch recommendation modal
(function() {
  var esc = App.esc;
  var api = App.api;

  var currentLunchCat = '한식';
  var lunchCache = {};
  var lunchPage = {};
  var lunchHasMore = {};
  var lunchReviews = {};
  var lunchHidden = [];
  var showingHidden = false;
  var currentLunchList = [];
  var reviewRatings = {};

  function updateLunchTabStyles() {
    document.querySelectorAll('#lunchTabs .lunch-tab').forEach(function(btn) {
      if (btn.classList.contains('active')) {
        btn.className = 'focus-ring lunch-tab flex-1 py-1.5 px-2 border-none text-txt-primary text-[.78rem] font-medium cursor-pointer rounded-md transition-all duration-200 font-sans bg-card-hover shadow-[0_1px_3px_rgba(0,0,0,.08)] active';
      } else {
        btn.className = 'focus-ring lunch-tab flex-1 py-1.5 px-2 border-none bg-transparent text-txt-tertiary text-[.78rem] font-medium cursor-pointer rounded-md transition-all duration-200 font-sans hover:text-txt-secondary';
      }
    });
  }

  async function loadLunchReviews() {
    try {
      var data = await api('/api/lunch/reviews');
      lunchReviews = {};
      for (var i = 0; i < data.length; i++) lunchReviews[data[i].name] = data[i];
    } catch (e) {}
  }

  async function loadLunchHidden() {
    try {
      var data = await api('/api/lunch/hidden');
      lunchHidden = Array.isArray(data) ? data : [];
    } catch (e) { lunchHidden = []; }
    updateHiddenBtn();
  }

  function updateHiddenBtn() {
    var btn = document.getElementById('lunchHiddenBtn');
    btn.textContent = '숨김 ' + lunchHidden.length;
    btn.style.display = lunchHidden.length ? 'inline-block' : 'none';
  }

  function getFilteredList() {
    return (lunchCache[currentLunchCat] || []).filter(function(r) { return lunchHidden.indexOf(r.name) === -1; });
  }

  async function ensureEnoughResults() {
    while (getFilteredList().length < 10 && lunchHasMore[currentLunchCat]) {
      await fetchMoreLunch();
    }
  }

  async function fetchMoreLunch() {
    var page = (lunchPage[currentLunchCat] || 1) + 1;
    try {
      var url = '/api/lunch/recommend?category=' + encodeURIComponent(currentLunchCat) + '&page=' + page;
      var data = await api(url);
      var items = data.restaurants || [];
      lunchCache[currentLunchCat] = (lunchCache[currentLunchCat] || []).concat(items);
      lunchPage[currentLunchCat] = page;
      lunchHasMore[currentLunchCat] = !data.is_end && items.length > 0;
    } catch (e) {
      lunchHasMore[currentLunchCat] = false;
    }
  }

  function renderStars(rating) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += (i <= rating ? '★' : '☆');
    return s;
  }

  function renderStarButtons(idx, rating) {
    var html = '';
    for (var s = 1; s <= 5; s++) {
      html += '<button id="star-' + idx + '-' + s + '" class="border-none bg-transparent cursor-pointer text-[1.1rem] p-0 transition-colors duration-150 ' + (s <= rating ? 'text-yel' : 'text-txt-tertiary hover:text-yel') + '" onclick="window.__setLunchRating(' + idx + ',' + s + ')">★</button>';
    }
    return html;
  }

  function updateStarUI(idx) {
    var r = reviewRatings[idx] || 0;
    for (var s = 1; s <= 5; s++) {
      var el = document.getElementById('star-' + idx + '-' + s);
      if (el) el.className = 'border-none bg-transparent cursor-pointer text-[1.1rem] p-0 transition-colors duration-150 ' + (s <= r ? 'text-yel' : 'text-txt-tertiary hover:text-yel');
    }
  }

  async function loadLunchRecommend(category, skipCache) {
    var loading = document.getElementById('lunchLoading');
    var list = document.getElementById('lunchList');
    var empty = document.getElementById('lunchEmpty');
    var errEl = document.getElementById('lunchError');

    currentLunchCat = category || currentLunchCat;

    if (currentLunchCat === '맛집') {
      loading.style.display = 'none';
      errEl.style.display = 'none';
      renderFavoritesList();
      return;
    }

    if (!skipCache && lunchCache[currentLunchCat]) {
      loading.style.display = 'none';
      errEl.style.display = 'none';
      empty.style.display = 'none';
      await ensureEnoughResults();
      renderLunchList(getFilteredList().slice(0, 10));
      return;
    }

    loading.style.display = 'flex';
    list.style.display = 'none';
    empty.style.display = 'none';
    errEl.style.display = 'none';

    try {
      var url = '/api/lunch/recommend?category=' + encodeURIComponent(currentLunchCat);
      var data = await api(url);
      loading.style.display = 'none';
      lunchCache[currentLunchCat] = data.restaurants || [];
      lunchPage[currentLunchCat] = 1;
      lunchHasMore[currentLunchCat] = !data.is_end;
      await ensureEnoughResults();
      renderLunchList(getFilteredList().slice(0, 10));
    } catch (e) {
      loading.style.display = 'none';
      errEl.style.display = 'block';
    }
  }

  function renderFavoritesList() {
    var list = document.getElementById('lunchList');
    var empty = document.getElementById('lunchEmpty');
    document.getElementById('lunchLoading').style.display = 'none';
    document.getElementById('lunchError').style.display = 'none';

    var reviews = [];
    for (var k in lunchReviews) { if (lunchReviews.hasOwnProperty(k)) reviews.push(lunchReviews[k]); }
    reviews.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    currentLunchList = reviews;

    if (!reviews.length) {
      list.style.display = 'none';
      empty.style.display = 'block';
      empty.innerHTML = '<span class="text-[1.6rem] mb-2 block opacity-50">⭐</span>아직 리뷰한 가게가 없습니다';
      return;
    }

    var html = '<div class="flex flex-col gap-0.5">';
    for (var i = 0; i < reviews.length; i++) {
      var r = reviews[i];
      var stars = r.rating ? '<span class="text-[.7rem] text-yel ml-1.5">' + renderStars(r.rating) + '</span>' : '';
      reviewRatings[i] = r.rating || 0;
      html += '<div class="group rounded-lg transition-all duration-200 hover:bg-card-hover">' +
        '<div class="flex items-start gap-3 px-3 py-2.5">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center">' +
              '<span class="text-[.9rem] text-txt-primary leading-relaxed font-medium">' + esc(r.name) + '</span>' +
              stars +
            '</div>' +
            '<div class="flex items-center gap-2 mt-0.5 text-[.75rem] text-txt-tertiary">' +
              '<span>' + esc(r.category || '') + '</span>' +
              (r.date ? ' · <span>' + esc(r.date) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<button class="shrink-0 w-7 h-7 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center transition-all duration-200 mt-0.5 text-yel hover:text-org" onclick="window.__toggleReviewForm(' + i + ')">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
          '</button>' +
        '</div>' +
        (r.review ? '<div class="px-3 pb-2 -mt-1"><div class="text-[.78rem] text-txt-secondary leading-relaxed border-l-2 border-border pl-2.5">' + esc(r.review) + '</div></div>' : '') +
        '<div id="lunch-review-' + i + '" style="display:none" class="px-3 pb-3">' +
          '<div class="flex items-center gap-1 mb-2">' + renderStarButtons(i, r.rating || 0) + '</div>' +
          '<div class="flex gap-2">' +
            '<input id="review-text-' + i + '" class="flex-1 bg-input border border-border rounded-md px-3 py-1.5 text-txt-primary text-[.8rem] font-sans outline-none transition-colors duration-200 placeholder:text-txt-tertiary focus:border-accent" placeholder="한줄 리뷰..." onkeydown="if(event.key===\'Enter\')window.__saveLunchReview(' + i + ')">' +
            '<button class="bg-accent text-white border-none px-3 py-1.5 rounded-md text-[.78rem] font-semibold cursor-pointer transition-all duration-200 font-sans hover:bg-accent-h whitespace-nowrap" onclick="window.__saveLunchReview(' + i + ')">저장</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
  }

  function renderLunchList(restaurants) {
    var list = document.getElementById('lunchList');
    var empty = document.getElementById('lunchEmpty');
    currentLunchList = restaurants;
    if (!restaurants || !restaurants.length) {
      list.style.display = 'none';
      empty.style.display = 'block';
      return;
    }
    var html = '<div class="flex flex-col gap-0.5">';
    for (var i = 0; i < restaurants.length; i++) {
      var r = restaurants[i];
      var rev = lunchReviews[r.name];
      var stars = rev && rev.rating ? '<span class="text-[.7rem] text-yel ml-1.5">' + renderStars(rev.rating) + '</span>' : '';
      var initRating = rev ? rev.rating : 0;
      reviewRatings[i] = initRating;
      html += '<div class="group rounded-lg transition-all duration-200 hover:bg-card-hover">' +
        '<div class="flex items-start gap-3 px-3 py-2.5">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center">' +
              '<a class="text-[.9rem] text-txt-primary leading-relaxed font-medium no-underline hover:text-accent transition-colors" href="' + esc(r.place_url) + '" target="_blank" rel="noopener">' + esc(r.name) + '</a>' +
              stars +
            '</div>' +
            '<div class="flex items-center gap-2 mt-0.5 text-[.75rem] text-txt-tertiary flex-wrap">' +
              '<span>' + esc(r.distance) + 'm</span>' +
              (r.phone ? ' · <span>' + esc(r.phone) + '</span>' : '') +
            '</div>' +
            '<div class="text-[.73rem] text-txt-tertiary mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">' + esc(r.address) + '</div>' +
          '</div>' +
          '<button class="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 border-none bg-transparent text-txt-tertiary cursor-pointer rounded-md flex items-center justify-center transition-all duration-200 mt-0.5 hover:bg-accent-dim hover:text-accent" onclick="window.__hideLunchRestaurant(' + i + ')">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
          '</button>' +
          '<button class="shrink-0 w-7 h-7 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center transition-all duration-200 mt-0.5 ' + (rev ? 'text-yel hover:text-org' : 'text-txt-tertiary hover:text-yel hover:bg-card-hover') + '" onclick="window.__toggleReviewForm(' + i + ')">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' +
          '</button>' +
        '</div>' +
        (rev && rev.review ? '<div class="px-3 pb-2 -mt-1"><div class="text-[.78rem] text-txt-secondary leading-relaxed pl-0.5 border-l-2 border-border pl-2.5">' + esc(rev.review) + '</div></div>' : '') +
        '<div id="lunch-review-' + i + '" style="display:none" class="px-3 pb-3">' +
          '<div class="flex items-center gap-1 mb-2">' + renderStarButtons(i, initRating) + '</div>' +
          '<div class="flex gap-2">' +
            '<input id="review-text-' + i + '" class="flex-1 bg-input border border-border rounded-md px-3 py-1.5 text-txt-primary text-[.8rem] font-sans outline-none transition-colors duration-200 placeholder:text-txt-tertiary focus:border-accent" placeholder="한줄 리뷰..." onkeydown="if(event.key===\'Enter\')window.__saveLunchReview(' + i + ')">' +
            '<button class="bg-accent text-white border-none px-3 py-1.5 rounded-md text-[.78rem] font-semibold cursor-pointer transition-all duration-200 font-sans hover:bg-accent-h whitespace-nowrap" onclick="window.__saveLunchReview(' + i + ')">저장</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
    html += '</div>';
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
  }

  function renderHiddenManageList() {
    var list = document.getElementById('lunchList');
    var empty = document.getElementById('lunchEmpty');
    document.getElementById('lunchLoading').style.display = 'none';
    document.getElementById('lunchError').style.display = 'none';
    if (!lunchHidden.length) {
      list.style.display = 'none';
      empty.style.display = 'block';
      empty.innerHTML = '<span class="text-[1.6rem] mb-2 block opacity-50">👁</span>숨긴 식당이 없습니다';
      return;
    }
    var html = '<div class="flex flex-col gap-1">';
    for (var i = 0; i < lunchHidden.length; i++) {
      var name = lunchHidden[i];
      var rev = lunchReviews[name];
      var stars = rev && rev.rating ? ' <span class="text-[.68rem] text-yel">' + renderStars(rev.rating) + '</span>' : '';
      html += '<div class="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-card-hover transition-all duration-200">' +
        '<div class="flex-1 min-w-0">' +
          '<span class="text-[.88rem] text-txt-secondary">' + esc(name) + '</span>' + stars +
          (rev && rev.review ? '<div class="text-[.73rem] text-txt-tertiary mt-0.5">' + esc(rev.review) + '</div>' : '') +
        '</div>' +
        '<button class="shrink-0 text-[.75rem] text-txt-tertiary bg-input border border-border px-2.5 py-1 rounded-md cursor-pointer font-sans transition-all duration-200 hover:text-grn hover:border-grn" onclick="window.__restoreHidden(' + i + ')">복원</button>' +
      '</div>';
    }
    html += '</div>';
    list.innerHTML = html;
    list.style.display = 'block';
    empty.style.display = 'none';
  }

  // Event handlers
  window.__toggleReviewForm = function(idx) {
    var form = document.getElementById('lunch-review-' + idx);
    if (!form) return;
    var wasHidden = form.style.display === 'none';
    document.querySelectorAll('[id^="lunch-review-"]').forEach(function(el) { el.style.display = 'none'; });
    if (wasHidden) {
      form.style.display = 'block';
      var r = currentLunchList[idx];
      var rev = r && lunchReviews[r.name];
      if (rev) {
        reviewRatings[idx] = rev.rating;
        document.getElementById('review-text-' + idx).value = rev.review || '';
      } else {
        reviewRatings[idx] = 0;
        document.getElementById('review-text-' + idx).value = '';
      }
      updateStarUI(idx);
      document.getElementById('review-text-' + idx).focus();
    }
  };

  window.__setLunchRating = function(idx, rating) {
    reviewRatings[idx] = rating;
    updateStarUI(idx);
  };

  window.__saveLunchReview = async function(idx) {
    var r = currentLunchList[idx];
    if (!r) return;
    var rating = reviewRatings[idx] || 0;
    if (!rating) return;
    var review = document.getElementById('review-text-' + idx).value.trim();
    var cat = currentLunchCat === '맛집' ? (r.category || '기타') : currentLunchCat;
    try {
      await api('/api/lunch/review', { method: 'POST', body: JSON.stringify({ name: r.name, category: cat, rating: rating, review: review }) });
      lunchReviews[r.name] = { name: r.name, category: cat, rating: rating, review: review, date: new Date().toISOString().slice(0, 10) };
      if (currentLunchCat === '맛집') renderFavoritesList();
      else renderLunchList(getFilteredList().slice(0, 10));
    } catch (e) {}
  };

  window.__hideLunchRestaurant = async function(idx) {
    var r = currentLunchList[idx];
    if (!r) return;
    try {
      await api('/api/lunch/hidden', { method: 'POST', body: JSON.stringify({ name: r.name }) });
      lunchHidden.push(r.name);
      updateHiddenBtn();
      await ensureEnoughResults();
      renderLunchList(getFilteredList().slice(0, 10));
    } catch (e) {}
  };

  window.__toggleHiddenView = function() {
    showingHidden = !showingHidden;
    if (showingHidden) {
      renderHiddenManageList();
      document.getElementById('lunchRefreshBtn').style.display = 'none';
      document.getElementById('lunchRandomBtn').style.display = 'none';
      document.getElementById('lunchBackBtn').style.display = 'inline-block';
      document.getElementById('lunchTabs').style.opacity = '0.3';
      document.getElementById('lunchTabs').style.pointerEvents = 'none';
    } else {
      if (currentLunchCat === '맛집') renderFavoritesList();
      else renderLunchList(getFilteredList().slice(0, 10));
      document.getElementById('lunchRefreshBtn').style.display = 'inline-block';
      document.getElementById('lunchRandomBtn').style.display = 'inline-block';
      document.getElementById('lunchBackBtn').style.display = 'none';
      document.getElementById('lunchTabs').style.opacity = '1';
      document.getElementById('lunchTabs').style.pointerEvents = 'auto';
    }
  };

  window.__restoreHidden = async function(idx) {
    var name = lunchHidden[idx];
    if (!name) return;
    try {
      await api('/api/lunch/hidden', { method: 'DELETE', body: JSON.stringify({ name: name }) });
      lunchHidden.splice(idx, 1);
      updateHiddenBtn();
      if (showingHidden) renderHiddenManageList();
    } catch (e) {}
  };

  function activateLunchTab(btn) {
    if (!btn) return;
    var cat = btn.dataset.cat;
    if (cat === currentLunchCat) return;
    if (showingHidden) window.__toggleHiddenView();
    document.querySelectorAll('#lunchTabs .lunch-tab').forEach(function(b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.tabIndex = -1;
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.tabIndex = 0;
    updateLunchTabStyles();
    loadLunchRecommend(cat);
  }

  document.getElementById('lunchTabs').addEventListener('click', function(e) {
    var btn = e.target.closest('.lunch-tab');
    activateLunchTab(btn);
  });

  document.getElementById('lunchTabs').addEventListener('keydown', function(e) {
    var tabs = Array.from(document.querySelectorAll('#lunchTabs .lunch-tab'));
    var idx = tabs.indexOf(document.activeElement);
    if (idx < 0) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    var next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    tabs[next].focus();
    activateLunchTab(tabs[next]);
  });

  window.__openLunchModal = function() {
    showingHidden = false;
    document.getElementById('lunchRefreshBtn').style.display = 'inline-block';
    document.getElementById('lunchRandomBtn').style.display = 'inline-block';
    document.getElementById('lunchBackBtn').style.display = 'none';
    document.getElementById('lunchTabs').style.opacity = '1';
    document.getElementById('lunchTabs').style.pointerEvents = 'auto';
    document.getElementById('lunchBackdrop').style.display = 'flex';
    updateLunchTabStyles();
    setTimeout(function() {
      var activeTab = document.querySelector('#lunchTabs .lunch-tab.active');
      if (activeTab) activeTab.focus();
    }, 0);
    Promise.all([loadLunchReviews(), loadLunchHidden()]).then(function() { loadLunchRecommend(currentLunchCat); });
  };

  window.__closeLunchModal = function() {
    document.getElementById('lunchBackdrop').style.display = 'none';
  };

  var randomCategories = ['한식', '중식', '일식', '양식', '분식'];

  var slotRunning = false;

  function runSlotAnimation(candidates, finalPick, onDone) {
    var list = document.getElementById('lunchList');
    list.style.display = 'block';
    list.innerHTML = '<div id="slotContainer" class="flex flex-col items-center justify-center py-12 gap-4">' +
      '<div class="text-[2rem] mb-2" id="slotEmoji">🎰</div>' +
      '<div id="slotName" class="text-[1.4rem] font-bold text-txt-primary transition-all duration-100 px-6 py-3 rounded-xl bg-input border border-border min-w-[200px] text-center"></div>' +
      '<div id="slotCategory" class="text-[.8rem] text-txt-tertiary"></div>' +
      '</div>';

    var nameEl = document.getElementById('slotName');
    var catEl = document.getElementById('slotCategory');
    var emojiEl = document.getElementById('slotEmoji');
    var totalSteps = 20;
    var step = 0;

    function tick() {
      if (step >= totalSteps) {
        // Final reveal
        nameEl.textContent = finalPick.name;
        catEl.textContent = finalPick.distance ? finalPick.distance + 'm' : '';
        nameEl.style.color = '';
        nameEl.style.transform = 'scale(1.1)';
        nameEl.style.borderColor = 'var(--color-org)';
        emojiEl.textContent = '🎉';
        setTimeout(function() {
          nameEl.style.transform = 'scale(1)';
          onDone();
        }, 600);
        return;
      }

      // Pick a random name to show (not the final one until the end)
      var r = candidates[Math.floor(Math.random() * candidates.length)];
      nameEl.textContent = r.name;
      catEl.textContent = r.distance ? r.distance + 'm' : '';

      // Easing: starts fast (40ms), ends slow (280ms)
      var progress = step / totalSteps;
      var delay = 40 + Math.pow(progress, 2.5) * 260;

      // Visual feedback: blur decreases as it slows
      var blur = Math.max(0, (1 - progress) * 2);
      nameEl.style.filter = 'blur(' + blur + 'px)';

      step++;
      setTimeout(tick, delay);
    }

    tick();
  }

  window.__randomLunchPick = async function() {
    if (slotRunning) return;
    var loading = document.getElementById('lunchLoading');
    var list = document.getElementById('lunchList');
    var empty = document.getElementById('lunchEmpty');
    var errEl = document.getElementById('lunchError');

    // Deselect all tabs
    document.querySelectorAll('#lunchTabs .lunch-tab').forEach(function(b) { b.classList.remove('active'); });
    updateLunchTabStyles();

    loading.style.display = 'flex';
    list.style.display = 'none';
    empty.style.display = 'none';
    errEl.style.display = 'none';

    // Gather candidates from all food categories (excluding 카페, 맛집)
    var allCandidates = [];
    for (var ci = 0; ci < randomCategories.length; ci++) {
      var cat = randomCategories[ci];
      if (!lunchCache[cat]) {
        try {
          var url = '/api/lunch/recommend?category=' + encodeURIComponent(cat);
          var data = await api(url);
          lunchCache[cat] = data.restaurants || [];
          lunchPage[cat] = 1;
          lunchHasMore[cat] = !data.is_end;
        } catch (e) {
          lunchCache[cat] = [];
        }
      }
      var filtered = (lunchCache[cat] || []).filter(function(r) { return lunchHidden.indexOf(r.name) === -1; });
      for (var fi = 0; fi < filtered.length; fi++) allCandidates.push(filtered[fi]);
    }

    loading.style.display = 'none';

    if (!allCandidates.length) {
      empty.style.display = 'block';
      empty.innerHTML = '<span class="text-[1.6rem] mb-2 block opacity-50">🎲</span>추천할 식당이 없습니다';
      return;
    }

    var pick = allCandidates[Math.floor(Math.random() * allCandidates.length)];
    currentLunchCat = '__random__';
    slotRunning = true;
    document.getElementById('lunchRandomBtn').disabled = true;
    document.getElementById('lunchRandomBtn').style.opacity = '0.5';

    runSlotAnimation(allCandidates, pick, function() {
      slotRunning = false;
      document.getElementById('lunchRandomBtn').disabled = false;
      document.getElementById('lunchRandomBtn').style.opacity = '1';
      // After a pause, show the full card
      setTimeout(function() { renderLunchList([pick]); }, 800);
    });
  };

  window.__rerollLunch = function() {
    if (currentLunchCat === '맛집') {
      loadLunchReviews().then(function() { renderFavoritesList(); });
      return;
    }
    lunchCache[currentLunchCat] = null;
    lunchPage[currentLunchCat] = 0;
    lunchHasMore[currentLunchCat] = false;
    loadLunchRecommend(currentLunchCat, true);
  };

  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Escape') return;
    if (document.getElementById('lunchBackdrop').style.display === 'flex') {
      window.__closeLunchModal();
      return;
    }
    if (document.getElementById('historyBackdrop').style.display === 'flex') {
      window.__closeHistoryModal();
    }
  });
})();
