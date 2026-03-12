// Settings modal
(function() {
  var api = App.api;
  var esc = App.esc;

  window.__openSettingsModal = async function() {
    var backdrop = document.getElementById('settingsBackdrop');
    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');
    document.getElementById('settingsModal').focus();
    await loadSettings();
  };

  window.__closeSettingsModal = function() {
    var backdrop = document.getElementById('settingsBackdrop');
    backdrop.classList.add('hidden');
    backdrop.classList.remove('flex');
  };

  async function loadSettings() {
    var form = document.getElementById('settingsForm');
    form.classList.add('opacity-50');
    try {
      var data = await api('/api/settings');
      document.getElementById('setJiraBaseUrl').value = data.jira.baseUrl || '';
      document.getElementById('setJiraEmail').value = data.jira.email || '';
      document.getElementById('setJiraToken').value = data.jira.apiToken || '';
      document.getElementById('setJiraProject').value = data.jira.projectKey || '';
      document.getElementById('setGhToken').value = data.github.token || '';
      document.getElementById('setGhOrg').value = data.github.org || '';
      document.getElementById('setGhRepo').value = data.github.repo || '';
      document.getElementById('settingsMsg').textContent = '';
    } catch (e) {
      document.getElementById('settingsMsg').textContent = '설정을 불러올 수 없습니다';
      document.getElementById('settingsMsg').className = 'text-[.82rem] text-accent mt-3';
    }
    form.classList.remove('opacity-50');
  }

  window.__saveSettings = async function() {
    var btn = document.getElementById('settingsSaveBtn');
    btn.disabled = true;
    btn.textContent = '저장 중...';
    try {
      var body = {
        jira: {
          baseUrl: document.getElementById('setJiraBaseUrl').value.trim(),
          email: document.getElementById('setJiraEmail').value.trim(),
          apiToken: document.getElementById('setJiraToken').value.trim(),
          projectKey: document.getElementById('setJiraProject').value.trim(),
        },
        github: {
          token: document.getElementById('setGhToken').value.trim(),
          org: document.getElementById('setGhOrg').value.trim(),
          repo: document.getElementById('setGhRepo').value.trim(),
        },
      };
      await api('/api/settings', { method: 'PUT', body: JSON.stringify(body) });
      document.getElementById('settingsMsg').textContent = '저장 완료';
      document.getElementById('settingsMsg').className = 'text-[.82rem] text-grn mt-3';
    } catch (e) {
      document.getElementById('settingsMsg').textContent = '저장 실패';
      document.getElementById('settingsMsg').className = 'text-[.82rem] text-accent mt-3';
    }
    btn.disabled = false;
    btn.textContent = '저장';
  };
})();
