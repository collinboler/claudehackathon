// Popup logic

document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();
  setupEventListeners();
  setupTabNavigation();
  updateCooldownDisplay();

  // Update cooldown every second
  setInterval(updateCooldownDisplay, 1000);
});

async function loadStatus() {
  const data = await chrome.storage.local.get([
    'practiceLevel',
    'jobRole',
    'customRole',
    'problemSites',
    'interviews',
    'openaiKey',
    'claudeKey',
    'resumeText'
  ]);

  // Check if setup is complete
  const isSetupComplete = data.openaiKey && data.claudeKey && data.resumeText && data.jobRole;

  if (!isSetupComplete) {
    document.getElementById('setupWarning').classList.remove('hidden');
  } else {
    document.getElementById('setupWarning').classList.add('hidden');
  }

  // Update practice level
  const practiceLevel = data.practiceLevel || 'medium';
  document.getElementById('practiceLevel').textContent = practiceLevel.charAt(0).toUpperCase() + practiceLevel.slice(1);

  // Update job role
  const jobRole = data.jobRole === 'Custom' ? data.customRole : data.jobRole;
  document.getElementById('targetRole').textContent = jobRole || 'Not set';

  // Update blocked sites count
  const problemSites = data.problemSites || [];
  const enabledSites = problemSites.filter(s => s.enabled).length;
  document.getElementById('blockedSites').textContent = enabledSites;

  // Update interview stats
  const interviews = data.interviews || [];
  document.getElementById('totalInterviews').textContent = interviews.length;

  if (interviews.length > 0) {
    const avgGrade = Math.round(
      interviews.reduce((sum, i) => sum + i.grading.grade, 0) / interviews.length
    );
    document.getElementById('avgGrade').textContent = avgGrade;
  } else {
    document.getElementById('avgGrade').textContent = '-';
  }
}

function setupEventListeners() {
  document.getElementById('fullSettingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('viewHistoryBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
  });
}

function setupTabNavigation() {
  // No tab navigation needed anymore - history opens in new page
}

async function updateCooldownDisplay() {
  const data = await chrome.storage.local.get(['cooldownUntil']);
  const cooldownStatus = document.getElementById('cooldownStatus');
  const cooldownTime = document.getElementById('cooldownTime');

  if (!data.cooldownUntil) {
    cooldownStatus.style.display = 'none';
    return;
  }

  const now = Date.now();
  const timeRemaining = data.cooldownUntil - now;

  if (timeRemaining <= 0) {
    // Cooldown expired
    cooldownStatus.style.display = 'none';
    // Clear the cooldown
    await chrome.storage.local.remove('cooldownUntil');
    return;
  }

  // Show cooldown status
  cooldownStatus.style.display = 'flex';

  // Calculate time remaining
  const totalSeconds = Math.floor(timeRemaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    cooldownTime.textContent = `${minutes}m ${seconds}s`;
  } else {
    cooldownTime.textContent = `${seconds}s`;
  }
}

