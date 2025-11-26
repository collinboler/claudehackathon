// Content script that runs on every page to check if blocking is needed

(async function() {
  // Don't run on extension pages
  if (window.location.href.startsWith('chrome-extension://')) {
    return;
  }

  // Check if we just came from an interview (session storage flag)
  const justCompletedInterview = sessionStorage.getItem('preppal_interview_completed');
  if (justCompletedInterview) {
    // Clear the flag and allow access
    sessionStorage.removeItem('preppal_interview_completed');
    return;
  }

  const url = new URL(window.location.href);
  const hostname = url.hostname.replace('www.', '');

  // Get settings from storage
  const data = await chrome.storage.local.get([
    'problemSites',
    'openaiKey',
    'claudeKey',
    'resumeText',
    'jobRole',
    'cooldownUntil'
  ]);

  // Check if we're in cooldown period
  if (data.cooldownUntil && Date.now() < data.cooldownUntil) {
    return; // Don't block during cooldown
  }

  // Check if this is a problem site
  const problemSites = data.problemSites || [];
  const isProblemSite = problemSites.some(site => {
    if (!site.enabled) return false;
    const siteHostname = site.value.replace('www.', '');
    return hostname.includes(siteHostname) || siteHostname.includes(hostname);
  });

  if (!isProblemSite) return;

  // Check if setup is complete
  if (!data.openaiKey || !data.claudeKey || !data.resumeText || !data.jobRole) {
    return; // Don't block if setup incomplete
  }

  // Redirect to interview page
  const interviewUrl = chrome.runtime.getURL('interview.html') +
                      `?redirect=${encodeURIComponent(window.location.href)}&questions=1`;
  window.location.replace(interviewUrl);
})();
