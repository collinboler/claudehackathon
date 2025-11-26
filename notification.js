// Content script for showing grade notifications

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'showGradeNotification') {
    showNotification(message.data);
  }
});

function showNotification(data) {
  const { category, grade, earnedMinutes } = data;

  // Remove existing notification if any
  const existing = document.getElementById('interview-grade-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'interview-grade-notification';
  notification.className = `grade-notification ${category}`;

  const categoryLabels = {
    poor: 'Poor Performance',
    fair: 'Fair Performance',
    good: 'Good Job!',
    excellent: 'Excellent Work!'
  };

  notification.innerHTML = `
    <div class="notification-header">
      <span class="notification-icon">${getIcon(category)}</span>
      <span class="notification-title">${categoryLabels[category]}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
    <div class="notification-body">
      <div class="notification-grade">Grade: ${grade}/100</div>
      <div class="notification-time">Earned: ${earnedMinutes} ${earnedMinutes === 1 ? 'minute' : 'minutes'}</div>
      <button class="notification-review-btn" id="reviewNotificationBtn">Review Interview</button>
    </div>
  `;

  // Add styles
  if (!document.getElementById('interview-notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'interview-notification-styles';
    styles.textContent = `
      .grade-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        width: 320px;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .grade-notification.poor {
        border-left: 6px solid #dc3545;
      }

      .grade-notification.fair {
        border-left: 6px solid #ffc107;
      }

      .grade-notification.good {
        border-left: 6px solid #28a745;
      }

      .grade-notification.excellent {
        border-left: 6px solid #667eea;
      }

      .notification-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 16px 12px 16px;
        background: #f8f9fa;
      }

      .notification-icon {
        font-size: 24px;
      }

      .notification-title {
        flex: 1;
        font-size: 16px;
        font-weight: 700;
        color: #333;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 28px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }

      .notification-close:hover {
        background: #e0e0e0;
        color: #333;
      }

      .notification-body {
        padding: 16px;
      }

      .notification-grade {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }

      .notification-time {
        font-size: 16px;
        color: #667eea;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .notification-review-btn {
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .notification-review-btn:hover {
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(styles);
  }

  document.body.appendChild(notification);

  // Add click listener to review button
  document.getElementById('reviewNotificationBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'openReviewPage' });
    notification.remove();
  });

  // Auto-remove after 8 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, 8000);
}

function getIcon(category) {
  const icons = {
    poor: '😞',
    fair: '😐',
    good: '😊',
    excellent: '🎉'
  };
  return icons[category] || '📊';
}

// Add slideOut animation
const slideOutStyle = document.createElement('style');
slideOutStyle.textContent = `
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(slideOutStyle);
