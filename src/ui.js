import { 
  currentRepsElement,
  currentCaloriesElement,
  totalRepsElement,
  totalCaloriesElement,
  formScoreElement,
  progressFillElement,
  progressTextElement,
  feedbackTitleElement,
  feedbackMessageElement,
  feedbackIconElement,
  focusCurrentReps,
  focusCurrentCalories,
  focusFormScore,
  focusProgressFill,
  focusProgressText,
  focusFeedbackTitle,
  focusFeedbackMessage,
  themeToggleBtn,
  muteBtn
} from './elements.js';

import {
  getRepCount,
  getSessionCalories,
  getTotalReps,
  getTotalCalories,
  getFormScore,
  getTargetReps,
  getIsFocusMode,
  getIsMuted,
  setIsMuted,
  getDailyStats,
  getCalorieGoal
} from './state.js';

import { checkDailyGoals } from './utils.js';

// Update all stats displays
export function updateStats() {
  const repCount = getRepCount();
  const sessionCalories = getSessionCalories();
  const totalReps = getTotalReps();
  const totalCalories = getTotalCalories();
  const formScore = getFormScore();
  const targetReps = getTargetReps();
  
  const roundedSessionCalories = Math.round(sessionCalories * 10) / 10;
  const roundedTotalCalories = Math.round(totalCalories * 10) / 10;
  const roundedFormScore = Math.round(formScore);
  const progress = Math.min((repCount / targetReps) * 100, 100);

  // Main UI updates
  if (currentRepsElement) currentRepsElement.textContent = repCount;
  if (currentCaloriesElement) currentCaloriesElement.textContent = roundedSessionCalories;
  if (totalRepsElement) totalRepsElement.textContent = totalReps;
  if (totalCaloriesElement) totalCaloriesElement.textContent = roundedTotalCalories;
  if (formScoreElement) formScoreElement.textContent = roundedFormScore;
  if (progressFillElement) progressFillElement.style.width = `${progress}%`;
  if (progressTextElement) progressTextElement.textContent = `${repCount}/${targetReps}`;

  // Focus Mode UI updates
  if (getIsFocusMode()) {
    if (focusCurrentReps) focusCurrentReps.textContent = repCount;
    if (focusCurrentCalories) focusCurrentCalories.textContent = roundedSessionCalories;
    if (focusFormScore) focusFormScore.textContent = roundedFormScore;
    if (focusProgressFill) focusProgressFill.style.width = `${progress}%`;
    if (focusProgressText) focusProgressText.textContent = `${repCount}/${targetReps}`;
  }

  // Update form score color based on value
  updateFormScoreColor(roundedFormScore);
  
  // Check for goal achievements
  checkGoalAchievements();
}

// Update form score color
function updateFormScoreColor(score) {
  const elements = [formScoreElement, focusFormScore].filter(el => el);
  
  elements.forEach(element => {
    element.classList.remove('score-excellent', 'score-good', 'score-needs-work');
    
    if (score >= 90) {
      element.classList.add('score-excellent');
    } else if (score >= 75) {
      element.classList.add('score-good');
    } else {
      element.classList.add('score-needs-work');
    }
  });
}

// Check and display goal achievements
function checkGoalAchievements() {
  const dailyStats = getDailyStats();
  const calorieGoal = getCalorieGoal();
  const goals = checkDailyGoals(dailyStats, calorieGoal);
  
  // Update daily progress indicator (we'll add this to HTML)
  const dailyProgressElement = document.getElementById('daily-progress');
  if (dailyProgressElement) {
    const progressPercent = Math.min((dailyStats.calories / calorieGoal) * 100, 100);
    dailyProgressElement.style.width = `${progressPercent}%`;
  }
}

// Update feedback display
export function updateFeedback(title, message, iconClass) {
  if (feedbackTitleElement) feedbackTitleElement.textContent = title;
  if (feedbackMessageElement) feedbackMessageElement.textContent = message;
  
  if (feedbackIconElement) {
    feedbackIconElement.innerHTML = `<i class="${iconClass}"></i>`;
    
    // Update icon background based on type
    if (iconClass.includes('check') || iconClass.includes('trophy')) {
      feedbackIconElement.style.background = "linear-gradient(135deg, var(--success), #059669)";
    } else if (iconClass.includes('exclamation')) {
      feedbackIconElement.style.background = "linear-gradient(135deg, var(--warning), #d97706)";
    } else {
      feedbackIconElement.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
    }
  }

  // Update focus mode feedback
  if (getIsFocusMode()) {
    updateFocusModeFeedback(title, message);
  }
}

// Update focus mode feedback
export function updateFocusModeFeedback(title, message) {
  if (!getIsFocusMode()) return;
  if (focusFeedbackTitle) focusFeedbackTitle.textContent = title;
  if (focusFeedbackMessage) focusFeedbackMessage.textContent = message;
}

// Initialize theme from localStorage or system preference
export function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeToggleBtn) {
      themeToggleBtn.querySelector('i').className = 'fas fa-sun';
    }
  }
}

// Initialize mute state from localStorage
export function initializeMuteState() {
  const savedMuteState = localStorage.getItem('muted') === 'true';
  setIsMuted(savedMuteState);
  
  if (savedMuteState && muteBtn) {
    muteBtn.querySelector('i').className = 'fas fa-volume-mute';
  }
}

// Initialize stats from localStorage
export function initializeStats() {
  const savedStats = localStorage.getItem('fittracker-stats');
  if (savedStats) {
    try {
      const stats = JSON.parse(savedStats);
      // We'll update state through setters
      if (stats.totalReps !== undefined) {
        const { setTotalReps } = await import('./state.js');
        setTotalReps(stats.totalReps);
      }
      if (stats.totalCalories !== undefined) {
        const { setTotalCalories } = await import('./state.js');
        setTotalCalories(stats.totalCalories);
      }
    } catch (error) {
      console.warn('Failed to parse saved stats:', error);
    }
  }
  
  // Initialize daily stats
  initializeDailyStats();
}

// Initialize daily stats
function initializeDailyStats() {
  const savedDailyStats = localStorage.getItem('fittracker-daily-stats');
  const today = new Date().toDateString();
  
  if (savedDailyStats) {
    try {
      const dailyStats = JSON.parse(savedDailyStats);
      if (dailyStats.date === today) {
        const { setDailyStats } = await import('./state.js');
        setDailyStats(dailyStats);
      }
    } catch (error) {
      console.warn('Failed to parse daily stats:', error);
    }
  }
}

// Toggle theme
export function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.classList.toggle('dark-mode');
  
  if (themeToggleBtn) {
    themeToggleBtn.querySelector('i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
  
  localStorage.setItem('theme', newTheme);
}

// Toggle mute
export function toggleMute() {
  const currentMuteState = getIsMuted();
  const newMuteState = !currentMuteState;
  
  setIsMuted(newMuteState);
  
  if (muteBtn) {
    muteBtn.querySelector('i').className = newMuteState ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  }
  
  if (newMuteState) {
    window.speechSynthesis.cancel();
  }
  
  localStorage.setItem('muted', newMuteState);
}

// Save stats to localStorage
export function saveStats() {
  const stats = {
    totalReps: getTotalReps(),
    totalCalories: getTotalCalories()
  };
  localStorage.setItem('fittracker-stats', JSON.stringify(stats));
  
  const dailyStats = getDailyStats();
  localStorage.setItem('fittracker-daily-stats', JSON.stringify(dailyStats));
}