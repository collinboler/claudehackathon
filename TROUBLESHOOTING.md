# Troubleshooting Guide

## "Failed to fetch" Error After Interview

This error typically occurs during API calls. Here's how to debug:

### Step 1: Check the Browser Console

1. While on the interview page, press `F12` or right-click → "Inspect"
2. Go to the "Console" tab
3. Look for error messages - they should show whether it's the OpenAI or Claude API failing
4. You should see logs like:
   - "Calling OpenAI Whisper API..."
   - "OpenAI Response status: XXX"
   - "Calling Claude API..."
   - "Claude Response status: XXX"

### Step 2: Check API Keys

**OpenAI:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Verify your key is valid and active
3. Check you have credits at [https://platform.openai.com/account/usage](https://platform.openai.com/account/usage)

**Claude:**
1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Verify your key is valid
3. Check you have credits available

### Step 3: Verify API Key Format

- OpenAI keys start with: `sk-proj-` or `sk-`
- Claude keys start with: `sk-ant-`

Make sure there are no extra spaces when you paste them.

### Step 4: Check Network Issues

1. In browser DevTools, go to the "Network" tab
2. Record a test interview
3. Look for failed requests to:
   - `api.openai.com`
   - `api.anthropic.com`
4. Click on failed requests to see the error details

### Common Issues:

#### 1. "401 Unauthorized"
- **Cause**: Invalid API key
- **Fix**: Double-check your API keys in settings

#### 2. "429 Too Many Requests"
- **Cause**: Rate limit exceeded or no credits
- **Fix**: Wait a few minutes or add credits to your account

#### 3. "403 Forbidden"
- **Cause**: API key doesn't have proper permissions
- **Fix**: Regenerate your API key

#### 4. "Network Error" or "Failed to fetch"
- **Cause**: Could be:
  - Browser blocking the request
  - Extension permissions issue
  - Internet connection problem
- **Fix**:
  - Reload the extension
  - Check your internet connection
  - Try in an Incognito window

### Step 5: Test APIs Manually

You can test if your API keys work by running these in the browser console (F12):

**Test OpenAI (replace YOUR_KEY):**
```javascript
fetch('https://api.openai.com/v1/models', {
  headers: {
    'Authorization': 'Bearer YOUR_OPENAI_KEY'
  }
}).then(r => r.json()).then(console.log)
```

**Test Claude (replace YOUR_KEY):**
```javascript
fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_CLAUDE_KEY',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 100,
    messages: [{role: 'user', content: 'Hello'}]
  })
}).then(r => r.json()).then(console.log)
```

### Step 6: Check Extension Permissions

1. Go to `chrome://extensions/`
2. Find "Interview Practice Assistant"
3. Click "Details"
4. Make sure "Site access" is set to "On all sites"

### Step 7: Reload Extension

1. Go to `chrome://extensions/`
2. Click the refresh icon on the Interview Practice Assistant card
3. Try recording again

### Still Having Issues?

1. Clear all extension data:
   - Open settings
   - Click "Clear All Data"
   - Re-enter your configuration

2. Check background script errors:
   - Go to `chrome://extensions/`
   - Click "service worker" under the extension
   - Look for errors in the console

3. Try a shorter recording (5-10 seconds) to rule out file size issues

## Other Common Issues

### Microphone Permission Denied
- Go to `chrome://settings/content/microphone`
- Ensure Chrome has microphone access
- Check that the extension URL is allowed

### Sites Not Being Blocked
- Verify settings are saved
- Check that sites are enabled in the problem sites list
- Try visiting the exact domain (e.g., `youtube.com` not `m.youtube.com`)

### Recording Timer Not Starting
- Browser might not support MediaRecorder API
- Try updating Chrome to the latest version

### Grades Not Showing in History
- Check browser console for errors
- Verify interview was completed (not just recorded)
- Try refreshing the settings page
