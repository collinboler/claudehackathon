// Background script for intercepting navigation to problem sites

const PRACTICE_LEVELS = {
  light: 5,    // 1 question per 5 visits
  medium: 3,   // 1 question per 3 visits
  heavy: 1,    // 1 question per visit
  intense: 1   // 2 questions per visit (handled separately)
};

let visitCounter = 0;

// Open settings page on installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Extension was just installed
    chrome.runtime.openOptionsPage();
  }
});

// Listen for navigation events
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only process main frame navigation
  if (details.frameId !== 0) return;

  const url = new URL(details.url);
  const hostname = url.hostname.replace('www.', '');

  // Get settings from storage
  const data = await chrome.storage.local.get([
    'problemSites',
    'practiceLevel',
    'openaiKey',
    'claudeKey',
    'resumeText',
    'jobRole',
    'customRole',
    'cooldownUntil'
  ]);

  // Check if we're in cooldown period
  if (data.cooldownUntil && Date.now() < data.cooldownUntil) {
    return; // Don't prompt during cooldown
  }

  // Check if this is a problem site
  const problemSites = data.problemSites || [];
  const isProblemSite = problemSites.some(site => {
    const siteHostname = site.value.replace('www.', '');
    return hostname.includes(siteHostname) || siteHostname.includes(hostname);
  });

  if (!isProblemSite) return;

  // Check if setup is complete
  if (!data.openaiKey || !data.claudeKey || !data.resumeText || !data.jobRole) {
    return; // Don't block if setup incomplete
  }

  const practiceLevel = data.practiceLevel || 'medium';
  const threshold = PRACTICE_LEVELS[practiceLevel];

  visitCounter++;

  // Determine if we should show interview prompt
  let shouldPrompt = false;
  let questionsCount = 1;

  if (practiceLevel === 'intense') {
    shouldPrompt = true;
    questionsCount = 2;
  } else if (visitCounter >= threshold) {
    shouldPrompt = true;
    visitCounter = 0; // Reset counter
  }

  if (shouldPrompt) {
    // Redirect to interview page
    const interviewUrl = chrome.runtime.getURL('interview.html') +
                        `?redirect=${encodeURIComponent(details.url)}&questions=${questionsCount}`;
    chrome.tabs.update(details.tabId, { url: interviewUrl });
  }
});

// Listen for messages from interview page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'allowNavigation') {
    // Reset counter for this session
    visitCounter = 0;
    sendResponse({ success: true });
  } else if (message.type === 'transcribe') {
    handleTranscription(message.audioBlob, sendResponse);
    return true; // Will respond asynchronously
  } else if (message.type === 'grade') {
    handleGrading(message.data, sendResponse);
    return true; // Will respond asynchronously
  } else if (message.type === 'processInterview') {
    // Process interview in background (no response needed)
    processInterviewInBackground(message.data);
    sendResponse({ success: true });
  } else if (message.type === 'generateResumeQuestions') {
    generateResumeQuestions(message.resume, sendResponse);
    return true; // Will respond asynchronously
  } else if (message.type === 'quickGradeHaiku') {
    quickGradeWithHaiku(message.data, sendResponse);
    return true; // Will respond asynchronously
  }
});

async function handleTranscription(audioDataUrl, sendResponse) {
  try {
    const data = await chrome.storage.local.get(['openaiKey']);
    if (!data.openaiKey) {
      sendResponse({ error: 'OpenAI API key not configured' });
      return;
    }

    // Convert data URL to blob
    const response = await fetch(audioDataUrl);
    const blob = await response.blob();

    // Create form data for Whisper API
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Calling OpenAI Whisper API...');
    const apiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.openaiKey}`
      },
      body: formData
    });

    console.log('OpenAI Response status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('OpenAI API error:', errorText);
      sendResponse({ error: `Transcription failed: ${apiResponse.status} - ${errorText}` });
      return;
    }

    const result = await apiResponse.json();

    if (result.text) {
      sendResponse({ success: true, transcription: result.text });
    } else {
      sendResponse({ error: result.error?.message || 'Transcription failed - no text returned' });
    }
  } catch (error) {
    console.error('Transcription error:', error);
    sendResponse({ error: `Transcription error: ${error.message}` });
  }
}

async function handleGrading(gradingData, sendResponse) {
  try {
    const data = await chrome.storage.local.get(['claudeKey']);
    if (!data.claudeKey) {
      sendResponse({ error: 'Claude API key not configured' });
      return;
    }

    const { question, response, resume, jobRole } = gradingData;

    const prompt = `You are an expert interview coach. Grade the following behavioral interview response on a scale of 0-100.

Job Role: ${jobRole}

Question: ${question}

Candidate's Response: ${response}

Candidate's Resume:
${resume}

Provide:
1. A numerical grade (0-100)
2. Detailed feedback on what was good and what could be improved
3. Specific suggestions for improvement

Format your response as JSON:
{
  "grade": <number 0-100>,
  "feedback": "<detailed feedback string>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...]
}`;

    console.log('Calling Claude API...');
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': data.claudeKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    console.log('Claude Response status:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Claude API error:', errorText);
      sendResponse({ error: `Grading failed: ${apiResponse.status} - ${errorText}` });
      return;
    }

    const result = await apiResponse.json();

    if (result.content && result.content[0]?.text) {
      const gradingText = result.content[0].text;

      // Try to extract JSON from the response
      const jsonMatch = gradingText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const grading = JSON.parse(jsonMatch[0]);
        sendResponse({ success: true, grading });
      } else {
        // Fallback if no JSON found
        sendResponse({
          success: true,
          grading: {
            grade: 50,
            feedback: gradingText,
            strengths: [],
            improvements: []
          }
        });
      }
    } else {
      console.error('Unexpected Claude response:', result);
      sendResponse({ error: result.error?.message || 'Grading failed - no content returned' });
    }
  } catch (error) {
    console.error('Grading error:', error);
    sendResponse({ error: `Grading error: ${error.message}` });
  }
}

async function processInterviewInBackground(data) {
  try {
    console.log('Processing interview in background...');

    // Step 1: Transcribe
    const transcriptionResult = await new Promise((resolve) => {
      handleTranscription(data.audioBlob, resolve);
    });

    if (transcriptionResult.error) {
      console.error('Background transcription failed:', transcriptionResult.error);
      return;
    }

    const transcription = transcriptionResult.transcription;
    console.log('Transcription complete:', transcription);

    // Step 2: Grade
    const gradingResult = await new Promise((resolve) => {
      handleGrading({
        question: data.question,
        response: transcription,
        resume: data.resume,
        jobRole: data.jobRole
      }, resolve);
    });

    if (gradingResult.error) {
      console.error('Background grading failed:', gradingResult.error);
      return;
    }

    console.log('Grading complete:', gradingResult.grading);

    // Step 3: Save to storage
    const storageData = await chrome.storage.local.get(['interviews']);
    const interviews = storageData.interviews || [];

    interviews.push({
      question: data.question,
      response: transcription,
      grading: gradingResult.grading,
      timestamp: Date.now()
    });

    await chrome.storage.local.set({ interviews });
    console.log('Interview saved successfully');

  } catch (error) {
    console.error('Background processing error:', error);
  }
}

async function generateResumeQuestions(resumeText, sendResponse) {
  try {
    const data = await chrome.storage.local.get(['claudeKey']);
    if (!data.claudeKey) {
      sendResponse({ error: 'Claude API key not configured' });
      return;
    }

    const prompt = `Based on this resume, generate 5 specific behavioral interview questions that relate directly to the candidate's experiences, projects, or skills mentioned. Make them challenging and relevant.

Resume:
${resumeText}

Return ONLY a JSON array of question strings, nothing else. Example format:
["Question 1 here", "Question 2 here", "Question 3 here", "Question 4 here", "Question 5 here"]`;

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': data.claudeKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20250929',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Claude API error:', errorText);
      sendResponse({ error: `Question generation failed: ${apiResponse.status}` });
      return;
    }

    const result = await apiResponse.json();
    if (result.content && result.content[0]?.text) {
      const responseText = result.content[0].text;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);

        // Store the questions
        await chrome.storage.local.set({ customQuestions: questions });

        sendResponse({ success: true, questions });
      } else {
        sendResponse({ error: 'Could not parse questions from response' });
      }
    } else {
      sendResponse({ error: 'No questions generated' });
    }
  } catch (error) {
    console.error('Question generation error:', error);
    sendResponse({ error: error.message });
  }
}

async function quickGradeWithHaiku(gradingData, sendResponse) {
  try {
    const data = await chrome.storage.local.get(['claudeKey']);
    if (!data.claudeKey) {
      sendResponse({ error: 'Claude API key not configured' });
      return;
    }

    const { question, response } = gradingData;

    const prompt = `Grade this behavioral interview response on a scale of 0-100. Provide a quick assessment.

Question: ${question}

Response: ${response}

Return ONLY a JSON object with this format:
{
  "grade": <number 0-100>,
  "category": "<poor|fair|good|excellent>",
  "feedback": "<brief 1-2 sentence feedback>"
}

Grade ranges:
- poor: 0-39
- fair: 40-59
- good: 60-79
- excellent: 80-100`;

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': data.claudeKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20250929',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Claude API error:', errorText);
      sendResponse({ error: `Quick grading failed: ${apiResponse.status}` });
      return;
    }

    const result = await apiResponse.json();
    if (result.content && result.content[0]?.text) {
      const gradingText = result.content[0].text;
      const jsonMatch = gradingText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const quickGrade = JSON.parse(jsonMatch[0]);
        sendResponse({ success: true, quickGrade });
      } else {
        sendResponse({ error: 'Could not parse grade from response' });
      }
    } else {
      sendResponse({ error: 'No grade returned' });
    }
  } catch (error) {
    console.error('Quick grading error:', error);
    sendResponse({ error: error.message });
  }
}
