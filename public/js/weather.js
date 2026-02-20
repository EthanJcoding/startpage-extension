// Weather widget (merged into clock block)
(function() {
  var esc = App.esc;

  var WMO_CODES = { 0: '맑음', 1: '대체로 맑음', 2: '부분적 흐림', 3: '흐림', 45: '안개', 48: '짙은 안개', 51: '가벼운 이슬비', 53: '이슬비', 55: '짙은 이슬비', 61: '약한 비', 63: '비', 65: '강한 비', 66: '약한 진눈깨비', 67: '강한 진눈깨비', 71: '약한 눈', 73: '눈', 75: '강한 눈', 77: '싸라기눈', 80: '약한 소나기', 81: '소나기', 82: '강한 소나기', 85: '약한 눈소나기', 86: '강한 눈소나기', 95: '뇌우', 96: '약한 우박 뇌우', 99: '강한 우박 뇌우' };
  var WMO_ICONS = { 0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️', 45: '🌫', 48: '🌫', 51: '🌦', 53: '🌦', 55: '🌧', 61: '🌧', 63: '🌧', 65: '🌧', 66: '🌨', 67: '🌨', 71: '🌨', 73: '❄️', 75: '❄️', 77: '🌨', 80: '🌦', 81: '🌧', 82: '⛈', 85: '🌨', 86: '❄️', 95: '⛈', 96: '⛈', 99: '⛈' };

  async function getLocation() {
    return { lat: 37.5446, lng: 127.0560, city: '성수동', ts: Date.now() };
  }

  async function fetchWeather(lat, lng) {
    var res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng +
      '&current=temperature_2m,weather_code' +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto&forecast_days=7'
    );
    var data = await res.json();
    var current = {
      temp: Math.round(data.current.temperature_2m),
      code: data.current.weather_code,
      description: WMO_CODES[data.current.weather_code] || '',
      icon: WMO_ICONS[data.current.weather_code] || ''
    };
    var daily = data.daily.time.map(function(date, i) {
      return {
        date: date,
        code: data.daily.weather_code[i],
        high: Math.round(data.daily.temperature_2m_max[i]),
        low: Math.round(data.daily.temperature_2m_min[i]),
        description: WMO_CODES[data.daily.weather_code[i]] || '',
        icon: WMO_ICONS[data.daily.weather_code[i]] || ''
      };
    });
    return { current: current, daily: daily };
  }

  App.loadWeather = async function() {
    var inlineEl = document.getElementById('weatherInline');
    var forecastEl = document.getElementById('weatherForecast');
    var errEl = document.getElementById('weatherError');

    try {
      var location = await getLocation();
      if (!location) { errEl.style.display = 'block'; errEl.textContent = '위치 권한이 필요합니다'; return; }

      var weather = await fetchWeather(location.lat, location.lng);
      document.getElementById('weatherRefresh').style.display = 'flex';

      // Inline current weather next to dateSub
      inlineEl.innerHTML = '· ' + weather.current.icon + ' ' + weather.current.temp + '°C ' + esc(weather.current.description);

      // 7-day forecast (vertical layout)
      var todayStr = new Date().toISOString().slice(0, 10);
      var dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      var html = '<div class="flex flex-col gap-0.5">';
      for (var i = 0; i < weather.daily.length; i++) {
        var day = weather.daily[i];
        var d = new Date(day.date + 'T00:00:00');
        var isToday = day.date === todayStr;
        var dayName = isToday ? '오늘' : dayNames[d.getDay()];
        html += '<div class="flex items-center gap-2.5 py-0.5 px-2 rounded-md' + (isToday ? ' bg-card-hover' : '') + '">' +
          '<span class="text-[.72rem] font-medium w-6 text-center ' + (isToday ? 'text-blu' : 'text-txt-tertiary') + '">' + dayName + '</span>' +
          '<span class="text-[.9rem]">' + day.icon + '</span>' +
          '<span class="text-[.72rem] text-txt-secondary font-medium w-7 text-right">' + day.high + '°</span>' +
          '<span class="text-[.72rem] text-txt-tertiary w-7 text-right">' + day.low + '°</span>' +
        '</div>';
      }
      html += '</div>';
      forecastEl.className = 'pl-8 ml-8 border-l border-border flex flex-col justify-center';
      forecastEl.innerHTML = html;
    } catch (e) {
      errEl.style.display = 'block';
      errEl.textContent = '날씨 정보를 불러올 수 없습니다';
    }
  };

  window.__refreshWeather = function() {
    localStorage.removeItem('weatherLocation');
    document.getElementById('weatherRefresh').style.display = 'none';
    document.getElementById('weatherInline').innerHTML = '';
    document.getElementById('weatherForecast').className = 'hidden pl-8 ml-8 border-l border-border flex flex-col justify-center';
    document.getElementById('weatherError').style.display = 'none';
    App.loadWeather();
  };
})();
