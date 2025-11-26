// Interview history page logic

let interviews = [];
let filteredInterviews = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadInterviews();
  setupEventListeners();
  displayInterviews();

  // Check if we should open the latest interview
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('openLatest') === 'true' && filteredInterviews.length > 0) {
    openInterview(0); // Open most recent (already sorted by newest first)
  }
});

async function loadInterviews() {
  const data = await chrome.storage.local.get(['interviews']);
  interviews = data.interviews || [];
  filteredInterviews = [...interviews];

  // Sort by timestamp, most recent first
  filteredInterviews.sort((a, b) => b.timestamp - a.timestamp);

  // Update stats
  document.getElementById('totalCount').textContent = interviews.length;

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
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('sortSelect').addEventListener('change', handleSort);
  document.getElementById('closeModal').addEventListener('click', closeModal);

  document.getElementById('clearBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all interview history? This cannot be undone.')) {
      await chrome.storage.local.set({ interviews: [] });
      interviews = [];
      filteredInterviews = [];
      displayInterviews();
      document.getElementById('totalCount').textContent = '0';
      document.getElementById('avgGrade').textContent = '-';
    }
  });

  // Close modal when clicking outside
  document.getElementById('detailModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
      closeModal();
    }
  });
}

function handleSearch(e) {
  const query = e.target.value.toLowerCase();
  filteredInterviews = interviews.filter(interview =>
    interview.question.toLowerCase().includes(query) ||
    interview.response.toLowerCase().includes(query)
  );
  displayInterviews();
}

function handleSort(e) {
  const sortBy = e.target.value;

  switch(sortBy) {
    case 'newest':
      filteredInterviews.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case 'oldest':
      filteredInterviews.sort((a, b) => a.timestamp - b.timestamp);
      break;
    case 'highest':
      filteredInterviews.sort((a, b) => b.grading.grade - a.grading.grade);
      break;
    case 'lowest':
      filteredInterviews.sort((a, b) => a.grading.grade - b.grading.grade);
      break;
  }

  displayInterviews();
}

function displayInterviews() {
  const grid = document.getElementById('interviewGrid');

  if (filteredInterviews.length === 0) {
    grid.innerHTML = '<p class="no-data">No interviews found.</p>';
    return;
  }

  grid.innerHTML = filteredInterviews.map((interview, index) => {
    const date = new Date(interview.timestamp);
    const gradeClass = interview.grading.grade >= 70 ? 'grade-good' :
                       interview.grading.grade >= 50 ? 'grade-medium' : 'grade-poor';

    // Truncate question for preview
    const questionPreview = interview.question.length > 80
      ? interview.question.substring(0, 80) + '...'
      : interview.question;

    return `
      <div class="interview-card" data-index="${index}">
        <div class="card-header">
          <div class="card-date">${date.toLocaleDateString()}</div>
          <div class="grade-badge ${gradeClass}">${interview.grading.grade}</div>
        </div>
        <div class="card-question">${questionPreview}</div>
        <div class="card-footer">
          <span class="card-time">${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
          <button class="view-btn" data-index="${index}">Review Interview</button>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to all view buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      openInterview(index);
    });
  });
}

function openInterview(index) {
  const interview = filteredInterviews[index];
  const date = new Date(interview.timestamp);

  // Check if grading is complete (has feedback)
  const isGradingComplete = interview.grading && interview.grading.feedback;

  const gradeClass = isGradingComplete && interview.grading.grade >= 70 ? 'grade-good' :
                     isGradingComplete && interview.grading.grade >= 50 ? 'grade-medium' : 'grade-poor';

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div class="interview-detail">
      <div class="detail-header">
        <div class="detail-date">${date.toLocaleString()}</div>
        ${isGradingComplete ? `
          <div class="grade-badge-large ${gradeClass}">${interview.grading.grade}/100</div>
        ` : `
          <div class="grade-badge-large grade-pending">Grading...</div>
        `}
      </div>

      <div class="detail-section">
        <h2>Question</h2>
        <p class="question-text">${interview.question}</p>
      </div>

      <div class="detail-section">
        <h2>Your Response</h2>
        <p class="response-text">${interview.response || 'Transcribing...'}</p>
      </div>

      ${isGradingComplete ? `
        <div class="detail-section">
          <h2>Feedback</h2>
          <p class="feedback-text">${interview.grading.feedback}</p>
        </div>

        ${interview.grading.strengths && interview.grading.strengths.length > 0 ? `
          <div class="detail-section">
            <h2>Strengths</h2>
            <ul class="strengths-list">
              ${interview.grading.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${interview.grading.improvements && interview.grading.improvements.length > 0 ? `
          <div class="detail-section">
            <h2>Areas for Improvement</h2>
            <ul class="improvements-list">
              ${interview.grading.improvements.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      ` : `
        <div class="detail-section">
          <h2>Feedback</h2>
          <div class="loading-feedback">
            <div class="spinner"></div>
            <p>Generating detailed feedback...</p>
            <p class="loading-subtext">This may take a moment</p>
          </div>
        </div>
      `}
    </div>
  `;

  document.getElementById('detailModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('detailModal').style.display = 'none';
}
