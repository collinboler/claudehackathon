// Content script to monitor cooldown and refresh page when expired

let cooldownCheckInterval;

// Start monitoring cooldown
function startCooldownMonitoring() {
  // Check every second
  cooldownCheckInterval = setInterval(async () => {
    const data = await chrome.storage.local.get(['cooldownUntil']);

    if (!data.cooldownUntil) {
      // No cooldown, stop monitoring
      return;
    }

    const now = Date.now();
    const timeRemaining = data.cooldownUntil - now;

    if (timeRemaining <= 0) {
      // Cooldown expired - clear it and refresh the page
      await chrome.storage.local.remove('cooldownUntil');
      console.log('Cooldown expired - refreshing page');
      window.location.reload();
    }
  }, 1000);
}

// Check if current site is a problem site
async function checkIfProblemSite() {
  const url = new URL(window.location.href);
  const hostname = url.hostname.replace('www.', '');

  const data = await chrome.storage.local.get(['problemSites']);
  const problemSites = data.problemSites || [];

  const isProblemSite = problemSites.some(site => {
    if (!site.enabled) return false;
    const siteHostname = site.value.replace('www.', '');
    return hostname.includes(siteHostname) || siteHostname.includes(hostname);
  });

  if (isProblemSite) {
    startCooldownMonitoring();
  }
}

// Initialize
checkIfProblemSite();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (cooldownCheckInterval) {
    clearInterval(cooldownCheckInterval);
  }
});
