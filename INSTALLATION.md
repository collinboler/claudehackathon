# Quick Installation Guide

## Step 1: Get Your API Keys

1. **OpenAI API Key** (for Whisper transcription):
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy and save your key (starts with `sk-`)

2. **Anthropic API Key** (for Claude grading):
   - Go to [https://console.anthropic.com/](https://console.anthropic.com/)
   - Sign in or create an account
   - Navigate to API Keys
   - Click "Create Key"
   - Copy and save your key (starts with `sk-ant-`)

## Step 2: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to and select this folder: `claudehackathon`
5. The extension should now appear in your extensions list

## Step 3: Pin the Extension (Optional)

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Interview Practice Assistant"
3. Click the pin icon to pin it to your toolbar

## Step 4: Configure Your Settings

1. Click the extension icon in your toolbar
2. Click the **Settings** (gear) icon
3. Fill in the required information:

   **API Keys:**
   - Paste your OpenAI API key
   - Paste your Claude API key

   **Resume:**
   - Click "Choose File" and upload a .txt file, OR
   - Copy and paste your resume text directly into the text area

   **Job Target:**
   - Select your target role from the dropdown, OR
   - Select "Custom Role" and type your specific role

   **Practice Intensity:**
   - Light: 1 question per 5 visits
   - Medium: 1 question per 3 visits (recommended)
   - Heavy: 1 question per visit
   - Intense: 2 questions per visit

   **Problem Sites:**
   - YouTube and Instagram are enabled by default
   - Add more sites by typing the domain (e.g., `reddit.com`) and clicking "Add Site"
   - Uncheck any sites you don't want to block

4. Click **Save Settings**

## Step 5: Test It Out!

1. Try visiting YouTube or Instagram
2. You should be redirected to an interview question page
3. Click the microphone button to start recording
4. Answer the question (aim for 1-3 minutes)
5. Click stop when done
6. Your response will be transcribed and graded automatically!

## Troubleshooting

### Microphone Permission Error
- Go to `chrome://settings/content/microphone`
- Make sure Chrome has microphone access
- Add the extension to allowed sites if needed

### API Key Errors
- Double-check your API keys are copied correctly
- Ensure you have credits/quota available in your OpenAI and Anthropic accounts
- OpenAI: Check at [https://platform.openai.com/account/usage](https://platform.openai.com/account/usage)
- Anthropic: Check at [https://console.anthropic.com/](https://console.anthropic.com/)

### Extension Not Blocking Sites
- Make sure you've saved your settings
- Check that the sites are enabled in your problem sites list
- Try refreshing the page or reloading the extension

### Icons Not Showing
- If icons appear broken, you may need to regenerate them
- Run: `python3 create_icons.py`
- Then reload the extension

## Next Steps

- Practice regularly! The more you use it, the better you'll get
- Review your past interviews in the Settings page
- Adjust your practice intensity as needed
- Add more problem sites to maximize practice opportunities

## Privacy Note

All your data (API keys, resume, interview responses) is stored **locally** on your computer in Chrome's storage. Nothing is sent to any server except:
- Audio to OpenAI for transcription
- Questions and responses to Claude for grading

Your API keys are used directly from your browser and are never stored on any external server.

Enjoy practicing! 🎤
