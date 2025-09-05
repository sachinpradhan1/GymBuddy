import {
  exerciseCards,
  startButton,
  stopButton,
  resetButton,
  themeToggleBtn,
  muteBtn,
  closeDemoBtn,
  skipDemoBtn,
  startAfterDemoBtn
} from './elements.js';

import {
  getWorkoutState,
  setCurrentExercise,
  getCurrentExercise,
  getRepCount
} from './state.js';

import { exerciseData } from './constants.js';
import { speak } from './utils.js';
import { updateFeedback, toggleTheme, toggleMute } from './ui.js';
import { startCamera, stopCamera } from './camera.js';
import { resetSession, startWorkoutFlow, startWorkout } from './workoutFlow.js';
import { initializeFocusMode } from './focusMode.js';
import { initializeSettingsListeners } from './settings.js';

// Initialize all event listeners
export function initializeEventListeners() {
  initializeExerciseSelection();
  initializeWorkoutControls();
  initializeUIControls();
  initializeModalControls();
  initializeFocusMode();
  initializeSettingsListeners();
  initializeBeforeUnload();
}

// Exercise selection event listeners
function initializeExerciseSelection() {
  exerciseCards.forEach(card => {
    card.addEventListener('click', () => {
      if (getWorkoutState() !== 'idle') return;
      
      // Update UI
      exerciseCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      // Update state
      const newExercise = card.dataset.exercise;
      setCurrentExercise(newExercise);
      resetSession();
      
      // Provide feedback
      const exerciseName = exerciseData[newExercise].name;
      updateFeedback("Exercise Selected", `Ready to start ${exerciseName}`, "fas fa-check-circle");
      speak(`Exercise changed to ${exerciseName}. Let me show you the proper form!`);
    });
  });
}

// Workout control event listeners
function initializeWorkoutControls() {
  if (startButton) {
    startButton.addEventListener('click', startWorkoutFlow);
  }
  
  if (stopButton) {
    stopButton.addEventListener('click', () => {
      stopCamera();
      const repCount = getRepCount();
      updateFeedback("Workout Ended", `Great session! ${repCount} reps completed.`, "fas fa-flag-checkered");
      if (repCount > 0) {
        speak(`Outstanding workout! You completed ${repCount} reps!`);
      }
    });
  }
  
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetSession();
      updateFeedback("Session Reset", "Ready for a fresh start!", "fas fa-undo");
      speak("Session reset. Ready to go again!");
    });
  }
}

// UI control event listeners
function initializeUIControls() {
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  
  if (muteBtn) {
    muteBtn.addEventListener('click', toggleMute);
  }
}

// Modal control event listeners
function initializeModalControls() {
  if (closeDemoBtn) {
    closeDemoBtn.addEventListener('click', () => {
      const { closeDemoModal } = require('./workoutFlow.js');
      closeDemoModal();
    });
  }
  
  if (skipDemoBtn) {
    skipDemoBtn.addEventListener('click', startWorkout);
  }
  
  if (startAfterDemoBtn) {
    startAfterDemoBtn.addEventListener('click', startWorkout);
  }
}

// Save data before page unload
function initializeBeforeUnload() {
  window.addEventListener('beforeunload', () => {
    const { saveStats } = require('./ui.js');
    saveStats();
  });
}