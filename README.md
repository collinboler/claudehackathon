# Interview Practice Assistant

A Chrome extension that helps you practice behavioral interview questions by requiring you to answer questions before accessing distracting websites.

## Features

- **Smart Site Blocking**: Intercepts visits to "problem sites" (YouTube, Instagram, etc.) and prompts interview questions
- **Audio Recording**: Record your responses using your microphone with a built-in timer
- **AI-Powered Transcription**: Uses OpenAI Whisper to transcribe your spoken responses
- **Intelligent Grading**: Claude analyzes your responses and provides detailed feedback (0-100 scale)
- **Practice Intensity Levels**: Choose how often you want to practice
  - Light: 1 question per 5 visits
  - Medium: 1 question per 3 visits
  - Heavy: 1 question per visit
  - Intense: 2 questions per visit
- **Interview History**: Track your progress with detailed analytics and grade trends
- **Personalized Feedback**: Grading considers your resume and target job role

## Installation

1. **Clone or download this repository**

2. **Get API Keys**:
   - OpenAI API Key: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Anthropic API Key (Claude): [https://console.anthropic.com/](https://console.anthropic.com/)

3. **Create Icons** (temporary step until you add real icons):
   ```bash
   # You'll need to convert the icon.svg to PNG files or use placeholder PNGs
   # For now, you can create simple placeholder images at:
   # icons/icon16.png (16x16)
   # icons/icon48.png (48x48)
   # icons/icon128.png (128x128)
   ```

4. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `claudehackathon` folder

5. **Configure the extension**:
   - Click the extension icon in your toolbar
   - Click the settings (gear) icon
   - Enter your OpenAI and Claude API keys
   - Upload or paste your resume
   - Select your target job role
   - Choose your practice intensity
   - Customize your problem sites list

## Usage

1. After setup, whenever you try to visit a "problem site" (YouTube, Instagram, or sites you've added), you'll be redirected to an interview question page

2. Click the microphone button to start recording your response

3. Speak your answer (aim for 1-3 minutes using the STAR method: Situation, Task, Action, Result)

4. Click stop when finished - your response will be:
   - Transcribed using OpenAI Whisper
   - Graded by Claude (0-100) with detailed feedback
   - Saved to your history

5. After completing all required questions, you'll be redirected to your original destination

6. View your progress, grades, and feedback anytime in the settings page under "Past Interviews"

## Privacy & Data Storage

- All data is stored locally in Chrome's local storage
- Your API keys never leave your browser except to call the respective APIs
- Resume and interview responses are only sent to Claude for grading
- Audio recordings are only sent to OpenAI for transcription
- No data is collected or stored by this extension on any external server

## Behavioral Questions

The extension includes 20 common behavioral interview questions covering topics like:
- Working under pressure
- Conflict resolution
- Goal achievement
- Learning from failure
- Adaptability
- Leadership
- Problem-solving
- And more...

## Tips for Success

1. **Use the STAR Method**:
   - **S**ituation: Set the context
   - **T**ask: Describe your responsibility
   - **A**ction: Explain what you did
   - **R**esult: Share the outcome

2. **Be Specific**: Use concrete examples from your resume

3. **Practice Regularly**: Set your intensity to a level that challenges you without being overwhelming

4. **Review Feedback**: Check the "Past Interviews" section to see your improvement areas

5. **Aim for 1-3 Minutes**: Brief enough to stay focused, detailed enough to demonstrate competence

## Troubleshooting

- **Microphone not working**: Check Chrome permissions at `chrome://settings/content/microphone`
- **API errors**: Verify your API keys are correct and have available credits
- **Sites not blocking**: Make sure the site is enabled in your problem sites list
- **Extension not loading**: Check the Console in `chrome://extensions/` for errors

## Development

To modify the extension:

1. Make changes to the source files
2. Click the refresh icon in `chrome://extensions/` for your extension
3. Reload any open tabs to see changes

## Cost Considerations

- **OpenAI Whisper API**: ~$0.006 per minute of audio
- **Claude API (Sonnet 3.5)**: ~$0.003 per request for typical grading

Example: 10 interviews/day = ~$0.09/day or ~$2.70/month

## License

MIT License - feel free to modify and distribute

## Support

If you encounter issues or have suggestions, please open an issue in the GitHub repository.
