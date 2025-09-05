import {
  demoModal,
  demoVideo,
  demoTitle,
  startButton,
  stopButton,
  resetButton
} from './elements.js';

import {
  setRepCount,
  setSessionCalories,
  setFormScore,
  setAngleHistory,
  setExercisePhase,
  clearAllTimeouts,
  setWorkoutState,
  getCamera,
  getCurrentExercise,
  getWorkoutState
} from './state.js';

import { demoVideos, exerciseData } from './constants.js';
import { speak } from './utils.js';
import { updateStats, updateFeedback } from './ui.js';
import { setReadyTimeoutId } from './state.js';
import { startCamera } from './camera.js';

// Start workout flow with demo
export function startWorkoutFlow() {
  showDemoModal();
}

// Start the workout after the demo or skip
export function startWorkout() {
  closeDemoModal();
  startCountdown();
}

// 5-second countdown
function startCountdown() {
  setWorkoutState('preparing');
  updateFeedback("Get Ready!", "Workout starting soon...", "fas fa-hourglass-start");

  let count = 5;

  const countdownInterval = setInterval(() => {
    if (count > 0) {
      updateFeedback(`Get Ready! ${count}`, "Prepare your form", "fas fa-stopwatch");
      speak(String(count));
      count--;
    } else {
      clearInterval(countdownInterval);
      setWorkoutState('active');
      updateFeedback("Go!", "Your workout has started!", "fas fa-play-circle");
      speak("Start!");
      startCamera();
    }
  }, 1000);

  setReadyTimeoutId(countdownInterval);
}

// Show demo modal
export function showDemoModal() {
  const exercise = getCurrentExercise();
  const exerciseName = exerciseData[exercise].name;
  
  if (demoTitle) {
    demoTitle.textContent = `${exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1)} Demo`;
  }
  
  if (demoVideo) {
    demoVideo.src = demoVideos[exercise];
  }
  
  if (demoModal) {
    demoModal.classList.add('active');
  }
  
  speak(`Let's watch the demo for ${exerciseName}.`);
}

// Close demo modal
export function closeDemoModal() {
  if (demoModal) {
    demoModal.classList.remove('active');
  }
  
  if (demoVideo) {
    demoVideo.src = "";
  }
}

// Reset workout session
export function resetSession() {
  // Reset counters
  setRepCount(0);
  setSessionCalories(0);
  setFormScore(100);
  
  // Reset tracking arrays
  setAngleHistory({ left: [], right: [] });
  
  // Reset exercise phases based on current exercise
  const exercise = getCurrentExercise();
  const initialPhase = exercise === 'shoulderpress' ? 'up' : 'down';
  
  setExercisePhase({
    left: { phase: initialPhase },
    right: { phase: initialPhase },
    main: { phase: initialPhase }
  });

  // Clear timeouts
  clearAllTimeouts();

  // Update workout state
  const camera = getCamera();
  setWorkoutState(camera ? 'preparing' : 'idle');
  
  // Update button states
  updateButtonStates();
  
  // Update display
  updateStats();
}

// Update button states based on workout state
function updateButtonStates() {
  const workoutState = getWorkoutState();
  const camera = getCamera();
  
  if (startButton) {
    startButton.disabled = workoutState !== 'idle';
    if (workoutState === 'preparing') {
      startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Starting...</span>';
    } else {
      startButton.innerHTML = '<i class="fas fa-play"></i><span>Start Workout</span>';
    }
  }
  
  if (stopButton) {
    stopButton.disabled = !camera;
  }
  
  if (resetButton) {
    resetButton.disabled = !camera;
  }
}