// Settings page logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  const data = await chrome.storage.local.get([
    'openaiKey',
    'claudeKey',
    'resumeText',
    'jobRole',
    'customRole',
    'practiceLevel',
    'cooldownMinutes',
    'gradingMode',
    'earnMinutesThresholds',
    'problemSites'
  ]);

  // Load API keys
  if (data.openaiKey) document.getElementById('openaiKey').value = data.openaiKey;
  if (data.claudeKey) document.getElementById('claudeKey').value = data.claudeKey;

  // Load resume
  if (data.resumeText) {
    document.getElementById('resumeText').value = data.resumeText;
    document.getElementById('resumeStatus').textContent = 'Resume loaded';
  }

  // Load job role
  if (data.jobRole) {
    document.getElementById('jobRole').value = data.jobRole;
    if (data.jobRole === 'Custom') {
      document.getElementById('customRoleGroup').style.display = 'block';
      document.getElementById('customRole').value = data.customRole || '';
    }
  }

  // Load practice level
  if (data.practiceLevel) {
    document.getElementById('practiceLevel').value = data.practiceLevel;
  }

  // Load cooldown minutes
  if (data.cooldownMinutes) {
    document.getElementById('cooldownMinutes').value = data.cooldownMinutes;
  }

  // Load grading mode
  const gradingMode = data.gradingMode || 'classic';
  document.getElementById('gradingMode').value = gradingMode;
  toggleGradingMode(gradingMode);

  // Load difficulty level (1-5, where 3 is balanced)
  const difficultyLevel = data.difficultyLevel || 3;
  document.getElementById('difficultySlider').value = difficultyLevel;
  updateDifficultyDisplay(difficultyLevel);

  // Load problem sites
  const problemSites = data.problemSites || [
    { id: 'youtube', value: 'youtube.com', enabled: true },
    { id: 'instagram', value: 'instagram.com', enabled: true }
  ];

  renderProblemSites(problemSites);
}

function renderProblemSites(sites) {
  const container = document.getElementById('problemSites');
  container.innerHTML = '';

  sites.forEach((site, index) => {
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    siteItem.innerHTML = `
      <input type="checkbox" id="site-${site.id}" value="${site.value}" ${site.enabled ? 'checked' : ''}>
      <label for="site-${site.id}">${site.value}</label>
      ${index >= 2 ? '<button class="remove-btn" data-site="' + site.id + '">×</button>' : ''}
    `;
    container.appendChild(siteItem);
  });

  // Add remove button listeners
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const siteId = e.target.getAttribute('data-site');
      removeSite(siteId);
    });
  });
}

function setupEventListeners() {
  // Job role change
  document.getElementById('jobRole').addEventListener('change', (e) => {
    if (e.target.value === 'Custom') {
      document.getElementById('customRoleGroup').style.display = 'block';
    } else {
      document.getElementById('customRoleGroup').style.display = 'none';
    }
  });

  // Grading mode change
  document.getElementById('gradingMode').addEventListener('change', (e) => {
    toggleGradingMode(e.target.value);
  });

  // Difficulty slider
  document.getElementById('difficultySlider').addEventListener('input', (e) => {
    updateDifficultyDisplay(parseInt(e.target.value));
  });

  // Resume upload
  document.getElementById('resumeUpload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const text = await file.text();
      document.getElementById('resumeText').value = text;
      document.getElementById('resumeStatus').textContent = 'Resume uploaded successfully - generating personalized questions...';

      // Generate resume-specific questions
      await generateResumeQuestions(text);
    } else if (file.type === 'application/pdf') {
      document.getElementById('resumeStatus').textContent = 'PDF support: Please copy and paste your resume text';
    }
  });

  // Add site
  document.getElementById('addSiteBtn').addEventListener('click', async () => {
    const newSite = document.getElementById('newSite').value.trim();
    if (!newSite) return;

    const data = await chrome.storage.local.get(['problemSites']);
    const sites = data.problemSites || [];

    const siteId = 'custom-' + Date.now();
    sites.push({
      id: siteId,
      value: newSite,
      enabled: true
    });

    await chrome.storage.local.set({ problemSites: sites });
    renderProblemSites(sites);
    document.getElementById('newSite').value = '';
  });

  // Save button
  document.getElementById('saveBtn').addEventListener('click', async () => {
    const settings = {
      openaiKey: document.getElementById('openaiKey').value,
      claudeKey: document.getElementById('claudeKey').value,
      resumeText: document.getElementById('resumeText').value,
      jobRole: document.getElementById('jobRole').value,
      customRole: document.getElementById('customRole').value,
      practiceLevel: document.getElementById('practiceLevel').value,
      cooldownMinutes: parseInt(document.getElementById('cooldownMinutes').value) || 30,
      gradingMode: document.getElementById('gradingMode').value,
      earnMinutesThresholds: {
        poor: parseFloat(document.getElementById('poorMinutes').value),
        fair: parseFloat(document.getElementById('fairMinutes').value),
        good: parseFloat(document.getElementById('goodMinutes').value),
        excellent: parseFloat(document.getElementById('excellentMinutes').value)
      }
    };

    // Get problem sites
    const siteCheckboxes = document.querySelectorAll('#problemSites input[type="checkbox"]');
    const problemSites = [];
    siteCheckboxes.forEach(checkbox => {
      const siteId = checkbox.id.replace('site-', '');
      problemSites.push({
        id: siteId,
        value: checkbox.value,
        enabled: checkbox.checked
      });
    });

    settings.problemSites = problemSites;

    await chrome.storage.local.set(settings);
    alert('Settings saved successfully!');
  });

  // Clear data button
  document.getElementById('clearDataBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all data including interview history?')) {
      await chrome.storage.local.clear();
      location.reload();
    }
  });
}

async function removeSite(siteId) {
  const data = await chrome.storage.local.get(['problemSites']);
  const sites = data.problemSites || [];

  const filtered = sites.filter(s => s.id !== siteId);
  await chrome.storage.local.set({ problemSites: filtered });
  renderProblemSites(filtered);
}

function toggleGradingMode(mode) {
  const classicSettings = document.getElementById('classicModeSettings');
  const earnSettings = document.getElementById('earnMinutesSettings');

  if (mode === 'classic') {
    classicSettings.style.display = 'block';
    earnSettings.style.display = 'none';
  } else {
    classicSettings.style.display = 'none';
    earnSettings.style.display = 'block';
  }
}

async function generateResumeQuestions(resumeText) {
  try {
    // Send message to background script to generate questions
    chrome.runtime.sendMessage({
      type: 'generateResumeQuestions',
      resume: resumeText
    }, (response) => {
      if (response.error) {
        document.getElementById('resumeStatus').textContent = `Resume uploaded - couldn't generate questions: ${response.error}`;
      } else if (response.questions) {
        document.getElementById('resumeStatus').textContent = `Resume uploaded - ${response.questions.length} personalized questions generated!`;
      }
    });
  } catch (error) {
    console.error('Error generating resume questions:', error);
  }
}
