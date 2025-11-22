// Interview page logic with recording and grading

const BEHAVIORAL_QUESTIONS = [
  "Tell me about a time when you had to work under pressure. How did you handle it?",
  "Describe a situation where you had to resolve a conflict with a team member.",
  "Give me an example of a goal you set and how you achieved it.",
  "Tell me about a time when you failed. What did you learn from it?",
  "Describe a situation where you had to adapt to significant changes.",
  "Tell me about a time when you showed leadership.",
  "Describe a challenging project you worked on and how you overcame obstacles.",
  "Give me an example of when you had to make a difficult decision.",
  "Tell me about a time when you had to learn something new quickly.",
  "Describe a situation where you went above and beyond what was expected.",
  "Tell me about a time when you received constructive criticism. How did you respond?",
  "Describe a situation where you had to work with a difficult person.",
  "Give me an example of when you demonstrated creativity or innovation.",
  "Tell me about a time when you had to prioritize multiple tasks.",
  "Describe a situation where you took initiative without being asked.",
  "Tell me about a time when you had to persuade someone to see your point of view.",
  "Describe a project where you had to collaborate with others.",
  "Tell me about a time when you made a mistake and how you handled it.",
  "Give me an example of when you exceeded expectations.",
  "Describe a situation where you had to handle competing priorities."
];

let mediaRecorder;
let audioChunks = [];
let recordingStartTime;
let timerInterval;
let currentQuestionIndex = 0;
let totalQuestions = 1;
let redirectUrl = '';
let allResponses = [];

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
redirectUrl = urlParams.get('redirect') || 'https://www.google.com';
totalQuestions = parseInt(urlParams.get('questions') || '1');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('totalQuestions').textContent = totalQuestions;
  await loadQuestion();
  setupRecordingButton();
});

async function loadQuestion() {
  const data = await chrome.storage.local.get(['jobRole', 'customRole', 'customQuestions']);
  const jobRole = data.jobRole === 'Custom' ? data.customRole : data.jobRole;
  const customQuestions = data.customQuestions || [];

  let question;

  // 30% chance to use a custom resume-specific question if they exist
  if (customQuestions.length > 0 && Math.random() < 0.3) {
    const randomIndex = Math.floor(Math.random() * customQuestions.length);
    question = customQuestions[randomIndex];
  } else {
    // Use regular behavioral question
    const randomIndex = Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length);
    question = BEHAVIORAL_QUESTIONS[randomIndex];
  }

  document.getElementById('question').textContent = question;
  document.getElementById('currentQuestion').textContent = currentQuestionIndex + 1;

  // Store current question
  window.currentQuestion = question;
  window.currentJobRole = jobRole;
}

function setupRecordingButton() {
  const recordBtn = document.getElementById('recordBtn');
  const recordText = document.getElementById('recordText');

  recordBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      await startRecording();
    } else {
      await stopRecording();
    }
  });
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      await handleRecordingComplete(audioBlob);
    };

    mediaRecorder.start();

    // Update UI
    document.getElementById('recordBtn').classList.add('recording');
    document.getElementById('recordText').textContent = 'Stop Recording';
    document.getElementById('timer').classList.add('recording');

    // Start timer
    recordingStartTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);

    document.getElementById('statusMessage').textContent = 'Recording... speak clearly';
  } catch (error) {
    console.error('Error starting recording:', error);
    document.getElementById('statusMessage').textContent = 'Error: Could not access microphone';
  }
}

async function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());

    // Update UI
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordText').textContent = 'Start Recording';
    document.getElementById('timer').classList.remove('recording');

    clearInterval(timerInterval);
  }
}

function updateTimer() {
  const elapsed = Date.now() - recordingStartTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const timeString = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  document.getElementById('timer').textContent = timeString;
}

async function handleRecordingComplete(audioBlob) {
  // Show processing message
  document.getElementById('loadingSection').style.display = 'block';
  document.getElementById('loadingText').textContent = 'Processing your response...';

  // Store current question info
  const currentQuestionData = {
    question: window.currentQuestion,
    audioBlob: null
  };

  // Convert blob to data URL
  const reader = new FileReader();
  reader.readAsDataURL(audioBlob);
  reader.onloadend = async () => {
    currentQuestionData.audioBlob = reader.result;

    // Get settings
    const data = await chrome.storage.local.get([
      'resumeText',
      'jobRole',
      'customRole',
      'cooldownMinutes',
      'gradingMode',
      'earnMinutesThresholds'
    ]);

    const jobRole = data.jobRole === 'Custom' ? data.customRole : data.jobRole;
    const gradingMode = data.gradingMode || 'classic';

    // Update progress
    currentQuestionIndex++;

    if (gradingMode === 'earn-minutes') {
      // Use Haiku for quick grading
      await handleEarnMinutesMode(currentQuestionData, data);
    } else {
      // Classic mode - fixed cooldown
      await handleClassicMode(currentQuestionData, data, jobRole);
    }
  };
}

async function handleClassicMode(questionData, settings, jobRole) {
  const cooldownMinutes = settings.cooldownMinutes || 30;

  // Start full processing in background
  chrome.runtime.sendMessage({
    type: 'processInterview',
    data: {
      question: questionData.question,
      audioBlob: questionData.audioBlob,
      resume: settings.resumeText,
      jobRole: jobRole
    }
  });

  // Show action buttons
  document.getElementById('loadingSection').style.display = 'none';
  document.getElementById('statusMessage').textContent = `Your response is being processed. You can continue browsing for ${cooldownMinutes} minutes.`;

  showActionButtons(cooldownMinutes);
}

async function handleEarnMinutesMode(questionData, settings) {
  // First transcribe
  document.getElementById('loadingText').textContent = 'Transcribing...';

  chrome.runtime.sendMessage(
    { type: 'transcribe', audioBlob: questionData.audioBlob },
    async (response) => {
      if (response.error) {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('statusMessage').textContent = `Error: ${response.error}`;
        return;
      }

      const transcription = response.transcription;

      // Quick grade with Haiku
      document.getElementById('loadingText').textContent = 'Grading performance...';

      chrome.runtime.sendMessage(
        {
          type: 'quickGradeHaiku',
          data: {
            question: questionData.question,
            response: transcription
          }
        },
        async (gradeResponse) => {
          if (gradeResponse.error) {
            document.getElementById('loadingSection').style.display = 'none';
            document.getElementById('statusMessage').textContent = `Error: ${gradeResponse.error}`;
            return;
          }

          const { quickGrade } = gradeResponse;
          const thresholds = settings.earnMinutesThresholds || {
            poor: 0.5,
            fair: 1,
            good: 3,
            excellent: 5
          };

          // Determine earned minutes based on category
          let earnedMinutes = thresholds[quickGrade.category];

          // Set cooldown
          const cooldownUntil = Date.now() + (earnedMinutes * 60 * 1000);
          await chrome.storage.local.set({ cooldownUntil });

          // Hide loading
          document.getElementById('loadingSection').style.display = 'none';

          // Show notification via content script
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                type: 'showGradeNotification',
                data: {
                  category: quickGrade.category,
                  grade: quickGrade.grade,
                  earnedMinutes: earnedMinutes
                }
              });
            }
          });

          // Show action buttons with earned minutes
          document.getElementById('statusMessage').textContent = `${quickGrade.feedback} You earned ${earnedMinutes} ${earnedMinutes === 1 ? 'minute' : 'minutes'}!`;
          showActionButtons(earnedMinutes);

          // Start full detailed grading in background for history
          const jobRole = settings.jobRole === 'Custom' ? settings.customRole : settings.jobRole;
          chrome.runtime.sendMessage({
            type: 'processInterview',
            data: {
              question: questionData.question,
              audioBlob: questionData.audioBlob,
              resume: settings.resumeText,
              jobRole: jobRole
            }
          });
        }
      );
    }
  );
}

function showActionButtons(minutes) {
  const actionsSection = document.getElementById('actionsSection');
  actionsSection.style.display = 'block';

  document.getElementById('continueText').textContent = `Continue for ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;

  // Continue button
  const continueBtn = document.getElementById('continueBtn');
  const newContinueBtn = continueBtn.cloneNode(true);
  continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);

  newContinueBtn.addEventListener('click', () => {
    window.location.href = redirectUrl;
  });

  // View analytics button
  const analyticsBtn = document.getElementById('viewAnalyticsBtn');
  const newAnalyticsBtn = analyticsBtn.cloneNode(true);
  analyticsBtn.parentNode.replaceChild(newAnalyticsBtn, analyticsBtn);

  newAnalyticsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
    window.location.href = redirectUrl;
  });
}

async function saveInterviews() {
  // Get existing interviews
  const data = await chrome.storage.local.get(['interviews']);
  const interviews = data.interviews || [];

  // Add all responses
  interviews.push(...allResponses);

  // Save back to storage
  await chrome.storage.local.set({ interviews });
}
