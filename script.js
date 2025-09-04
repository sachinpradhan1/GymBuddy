// ---
// Element Selectors
// ---
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const currentRepsElement = document.getElementById("current-reps");
const currentCaloriesElement = document.getElementById("current-calories");
const totalRepsElement = document.getElementById("total-reps");
const totalCaloriesElement = document.getElementById("total-calories");
const formScoreElement = document.getElementById("form-score");
const progressFillElement = document.getElementById("progress-fill");
const progressTextElement = document.getElementById("progress-text");
const feedbackTitleElement = document.getElementById("feedback-title");
const feedbackMessageElement = document.getElementById("feedback-message");
const feedbackIconElement = document.getElementById("feedback-icon");
const startButton = document.getElementById("start-btn");
const stopButton = document.getElementById("stop-btn");
const resetButton = document.getElementById("reset-reps-btn");
const exerciseCards = document.querySelectorAll('.exercise-card');
const demoModal = document.getElementById("demo-modal");
const demoVideo = document.getElementById("demo-video");
const demoTitle = document.getElementById("demo-title");
const closeDemoBtn = document.getElementById("close-demo");
const startAfterDemoBtn = document.getElementById("start-after-demo");
const skipDemoBtn = document.getElementById("skip-demo");
const poseIndicator = document.getElementById("pose-indicator");
const focusModeBtn = document.getElementById("focus-mode-btn");
const focusExitBtn = document.getElementById("focus-exit-btn");
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const muteBtn = document.getElementById("mute-btn");
const appElement = document.querySelector('.app');

// Focus mode elements
const focusModeOverlay = document.getElementById("focus-mode-overlay");
const focusCurrentReps = document.getElementById("focus-current-reps");
const focusCurrentCalories = document.getElementById("focus-current-calories");
const focusFormScore = document.getElementById("focus-form-score");
const focusProgressFill = document.getElementById("focus-progress-fill");
const focusProgressText = document.getElementById("focus-progress-text");
const focusFeedbackTitle = document.getElementById("focus-feedback-title");
const focusFeedbackMessage = document.getElementById("focus-feedback-message");

// ---
// State Variables
// ---
let repCount = 0;
let sessionCalories = 0;
let totalReps = 0;
let totalCalories = 0;
let camera = null;
let currentExercise = "curl";
let workoutState = 'idle'; // 'idle', 'preparing', 'active', 'paused', 'resuming'
let readyTimeoutId = null;
let pauseTimeoutId = null;
let resumeTimeoutId = null;
let targetReps = 20;
let formScore = 100;
let isMuted = false;
let isFocusMode = false;

// Rep tracking state for each arm/leg
let exercisePhase = {};

// Smoothing arrays for better accuracy
let angleHistory = { left: [], right: [] };
const HISTORY_SIZE = 5;

// ---
// Constants & Configuration
// ---
const demoVideos = {
  curl: "https://www.youtube.com/embed/ykJmrZ5v0Oo",
  squat: "https://www.youtube.com/embed/aclHkVaku9U",
  pushup: "https://www.youtube.com/embed/IODxDxX7oi4",
  shoulderpress: "https://www.youtube.com/embed/qEwKCR5JCog"
};

const exerciseData = {
  curl: { name: "bicep curls", calories: 0.5 },
  squat: { name: "squats", calories: 0.8 },
  pushup: { name: "push up", calories: 0.7 },
  shoulderpress: { name: "shoulder press", calories: 0.6 }
};

// ---
// Initialization
// ---
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeMuteState();
    initializeStats();
    resetSession(); // Initialize the default exercise state

    updateFeedback("Welcome to FitTracker AI", "Choose an exercise and start your journey!", "fas fa-rocket");
    speak("Welcome to FitTracker AI! Your personal trainer is ready to help you achieve your fitness goals! Choose an exercise and let's get started!");
});

// ---
// Event Listeners
// ---
exerciseCards.forEach(card => {
  card.addEventListener('click', () => {
    if (workoutState !== 'idle') return;
    exerciseCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    currentExercise = card.dataset.exercise;
    resetSession();
    const exerciseName = exerciseData[currentExercise].name;
    updateFeedback("Exercise Selected", `Ready to start ${exerciseName}`, "fas fa-check-circle");
    speak(`Exercise changed to ${exerciseName}. Let me show you the proper form!`);
  });
});

startButton.addEventListener('click', startWorkoutFlow);
stopButton.addEventListener('click', stopCamera);
resetButton.addEventListener('click', resetReps);
themeToggleBtn.addEventListener('click', toggleTheme);
muteBtn.addEventListener('click', toggleMute);

// Modal listeners
closeDemoBtn.addEventListener('click', closeDemoModal);
skipDemoBtn.addEventListener('click', () => { closeDemoModal(); startCamera(); });
startAfterDemoBtn.addEventListener('click', () => { closeDemoModal(); startCamera(); });

// Focus mode listeners
focusModeBtn.addEventListener('click', () => isFocusMode ? exitFocusMode() : enterFocusMode());
focusExitBtn.addEventListener('click', exitFocusMode);

// Fullscreen change handling
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && isFocusMode) {
    exitFocusMode();
  }
});


// ---
// MediaPipe Pose Setup
// ---
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

pose.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    handlePoseDetected(results.poseLandmarks);
  } else {
    handlePoseLost();
  }
});

function handlePoseDetected(landmarks) {
  if (pauseTimeoutId) {
    clearTimeout(pauseTimeoutId);
    pauseTimeoutId = null;
  }
  if (workoutState === 'resuming') {
      clearTimeout(resumeTimeoutId);
      workoutState = 'active';
      updateFeedback("Workout Resumed", "Let's keep going!", "fas fa-play");
      speak("Let's go!");
  }

  drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { color: "rgba(99, 102, 241, 0.8)", lineWidth: 3 });
  drawLandmarks(ctx, landmarks, { color: "rgba(16, 185, 129, 0.9)", radius: 4 });

  poseIndicator.style.background = "rgba(16, 185, 129, 0.9)";
  poseIndicator.innerHTML = '<i class="fas fa-user-check"></i>';

  if (workoutState === 'preparing') checkReadyState(landmarks);
  else if (workoutState === 'active') processExercise(landmarks);
}

function handlePoseLost() {
    poseIndicator.style.background = "rgba(239, 68, 68, 0.9)";
    poseIndicator.innerHTML = '<i class="fas fa-user-slash"></i>';

    if (workoutState === 'active' && !pauseTimeoutId) {
        pauseTimeoutId = setTimeout(() => {
            workoutState = 'paused';
            updateFeedback("Workout Paused", "Step back in front of the camera to resume", "fas fa-pause-circle");
            speak("Workout paused.");
        }, 3000);
    } else if (workoutState === 'paused') {
        // If already paused, start resume countdown once pose is back
        workoutState = 'resuming';
        resumeWorkout();
    }
}

function resumeWorkout() {
    let countdown = 3;
    const doResumeCountdown = () => {
        if (countdown > 0) {
            updateFeedback("Resuming...", `Get ready to continue in ${countdown}`, "fas fa-play-circle");
            speak(countdown);
            countdown--;
            resumeTimeoutId = setTimeout(doResumeCountdown, 1000);
        } else {
            // This part is now handled in handlePoseDetected
        }
    };
    doResumeCountdown();
}


// ---
// Core Workout Logic
// ---
function processExercise(landmarks) {
  switch (currentExercise) {
    case "curl": processBicepCurl(landmarks); break;
    case "squat": processSquat(landmarks); break;
    case "pushup": processPushup(landmarks); break;
    case "shoulderpress": processShoulderPress(landmarks); break;
  }
  updateStats();
}

function checkReadyState(landmarks) {
  // Simplified for brevity, can be expanded like original
  if (!readyTimeoutId) {
    updateFeedback("Ready!", "Hold position to start...", "fas fa-check-circle");
    speak("Hold this position to begin.");
    readyTimeoutId = setTimeout(() => {
      workoutState = 'active';
      const exerciseName = exerciseData[currentExercise].name;
      updateFeedback("Workout Started!", `Let's go! First rep of ${exerciseName}!`, "fas fa-play-circle");
      speak(`Workout started! Let's go!`);
      readyTimeoutId = null;
    }, 2000);
  }
}

// ---
// Rep Counting for Specific Exercises
// ---
function processBicepCurl(lm) {
  const leftAngle = smoothAngle(calculateAngle(lm[11], lm[13], lm[15]), 'left');
  const rightAngle = smoothAngle(calculateAngle(lm[12], lm[14], lm[16]), 'right');

  // Process each arm independently
  detectRep({ angle: leftAngle, phase: 'down', minAngle: 30, maxAngle: 160 }, 'left');
  detectRep({ angle: rightAngle, phase: 'down', minAngle: 30, maxAngle: 160 }, 'right');

  updateFeedback("Curl", `L: ${Math.round(leftAngle)}° R: ${Math.round(rightAngle)}°`, "fas fa-dumbbell");
}

function processShoulderPress(lm) {
  const leftAngle = smoothAngle(calculateAngle(lm[11], lm[13], lm[15]), 'left');
  const rightAngle = smoothAngle(calculateAngle(lm[12], lm[14], lm[16]), 'right');
  const avgAngle = (leftAngle + rightAngle) / 2;

  // Use average of both arms to count rep only once
  detectRep({ angle: avgAngle, phase: 'up', minAngle: 80, maxAngle: 160 }, 'main');

  updateFeedback("Shoulder Press", `L: ${Math.round(leftAngle)}° R: ${Math.round(rightAngle)}°`, "fas fa-angle-up");
}

function processSquat(lm) {
    const leftAngle = smoothAngle(calculateAngle(lm[23], lm[25], lm[27]), 'left');
    const rightAngle = smoothAngle(calculateAngle(lm[24], lm[26], lm[28]), 'right');
    const avgAngle = (leftAngle + rightAngle) / 2;

    detectRep({ angle: avgAngle, phase: 'down', minAngle: 90, maxAngle: 170 }, 'main');
    updateFeedback("Squat", `Depth: ${Math.round(avgAngle)}°`, "fas fa-walking");
}

function processPushup(lm) {
    const leftAngle = smoothAngle(calculateAngle(lm[11], lm[13], lm[15]), 'left');
    const rightAngle = smoothAngle(calculateAngle(lm[12], lm[14], lm[16]), 'right');
    const avgAngle = (leftAngle + rightAngle) / 2;

    detectRep({ angle: avgAngle, phase: 'down', minAngle: 90, maxAngle: 160 }, 'main');
    updateFeedback("Push-up", `Depth: ${Math.round(avgAngle)}°`, "fas fa-hand-point-up");
}


/**
 * Generic Rep Detection Logic.
 * @param {object} options - { angle, phase, minAngle, maxAngle }
 * @param {string} side - 'left', 'right', or 'main' for single metric exercises
 */
function detectRep(options, side) {
  const { angle, phase, minAngle, maxAngle } = options;
  const state = exercisePhase[side];

  if (phase === 'down') { // For exercises starting in a down/extended state (e.g., curls)
    if (state.phase === 'down' && angle < minAngle) {
      state.phase = 'up';
    } else if (state.phase === 'up' && angle > maxAngle) {
      state.phase = 'down';
      incrementRep();
    }
  } else if (phase === 'up') { // For exercises starting in an up/flexed state (e.g., shoulder press)
    if (state.phase === 'up' && angle > maxAngle) {
      state.phase = 'down';
    } else if (state.phase === 'down' && angle < minAngle) {
      state.phase = 'up';
      incrementRep();
    }
  }
}

// ---
// Utility Functions
// ---
function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

function smoothAngle(angle, side) {
  angleHistory[side].push(angle);
  if (angleHistory[side].length > HISTORY_SIZE) {
    angleHistory[side].shift();
  }
  return angleHistory[side].reduce((sum, a) => sum + a, 0) / angleHistory[side].length;
}

function incrementRep() {
  repCount++;
  totalReps++;
  const caloriesPerRep = exerciseData[currentExercise].calories;
  sessionCalories += caloriesPerRep;
  totalCalories += caloriesPerRep;

  const statBox = document.getElementById('current-reps').parentElement;
  statBox.classList.add('rep-animation');
  setTimeout(() => statBox.classList.remove('rep-animation'), 400);

  if (repCount > 0 && repCount % 5 === 0) {
    speak(`${repCount} reps! ${getEncouragementMessage()}`);
  }
}

function getEncouragementMessage() {
  const messages = ["Great work!", "Keep it up!", "You're doing great!", "Amazing!", "Fantastic!"];
  return messages[Math.floor(Math.random() * messages.length)];
}

// ---
// UI & State Management
// ---
function updateStats() {
  const roundedSessionCalories = Math.round(sessionCalories * 10) / 10;
  const roundedTotalCalories = Math.round(totalCalories * 10) / 10;
  const roundedFormScore = Math.round(formScore);
  const progress = Math.min((repCount / targetReps) * 100, 100);

  // Main UI
  currentRepsElement.textContent = repCount;
  currentCaloriesElement.textContent = roundedSessionCalories;
  totalRepsElement.textContent = totalReps;
  totalCaloriesElement.textContent = roundedTotalCalories;
  formScoreElement.textContent = roundedFormScore;
  progressFillElement.style.width = `${progress}%`;
  progressTextElement.textContent = `${repCount}/${targetReps}`;

  // Focus Mode UI
  if (isFocusMode) {
    focusCurrentReps.textContent = repCount;
    focusCurrentCalories.textContent = roundedSessionCalories;
    focusFormScore.textContent = roundedFormScore;
    focusProgressFill.style.width = `${progress}%`;
    focusProgressText.textContent = `${repCount}/${targetReps}`;
  }

  if (repCount >= targetReps && workoutState === 'active') {
    workoutState = 'finished';
    updateFeedback("Workout Complete!", `Amazing! ${targetReps} reps completed!`, "fas fa-trophy");
    speak(`Congratulations! Workout completed! You dominated those ${targetReps} reps.`);
  }
}

function updateFeedback(title, message, iconClass) {
  feedbackTitleElement.textContent = title;
  feedbackMessageElement.textContent = message;
  feedbackIconElement.innerHTML = `<i class="${iconClass}"></i>`;

  if (iconClass.includes('check') || iconClass.includes('trophy')) {
    feedbackIconElement.style.background = "linear-gradient(135deg, var(--success), #059669)";
  } else if (iconClass.includes('exclamation')) {
    feedbackIconElement.style.background = "linear-gradient(135deg, var(--warning), #d97706)";
  } else {
    feedbackIconElement.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
  }

  if (isFocusMode) {
    updateFocusModeFeedback(title, message);
  }
}

function resetSession() {
  repCount = 0;
  sessionCalories = 0;
  formScore = 100;
  angleHistory = { left: [], right: [] };

  // A more robust reset for exercise phases
  exercisePhase = {
    left: { phase: currentExercise === 'shoulderpress' ? 'up' : 'down' },
    right: { phase: currentExercise === 'shoulderpress' ? 'up' : 'down' },
    main: { phase: currentExercise === 'shoulderpress' ? 'up' : 'down', state: 'closed' } // For squat/pushup/shoulderpress
  };

  clearTimeout(readyTimeoutId);
  clearTimeout(pauseTimeoutId);
  clearTimeout(resumeTimeoutId);
  readyTimeoutId = null;
  pauseTimeoutId = null;
  resumeTimeoutId = null;

  workoutState = camera ? 'preparing' : 'idle';
  updateStats();
}

function resetReps() {
    repCount = 0;
    sessionCalories = 0;
    updateStats();
    updateFeedback("Rep Count Reset", "Session reps cleared.", "fas fa-undo");
    speak("Rep count reset.");
}

// ---
// Camera & Workout Flow
// ---
function startWorkoutFlow() {
  showDemoModal();
}

function startCamera() {
  if (camera) return;

  workoutState = 'preparing';
  startButton.disabled = true;
  stopButton.disabled = false;
  resetButton.disabled = false;
  startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Starting...</span>';
  updateFeedback("Initializing Camera", "Getting your workout ready...", "fas fa-camera");

  camera = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 640,
    height: 480
  });

  camera.start().then(() => {
    const exerciseName = exerciseData[currentExercise].name;
    updateFeedback("Get Ready", `Prepare for ${exerciseName}.`, "fas fa-user-clock");
    speak(`Camera is ready. Get into position for ${exerciseName}.`);
    startButton.innerHTML = '<i class="fas fa-play"></i><span>Start Workout</span>';
  }).catch(() => {
    updateFeedback("Camera Error", "Please allow camera access.", "fas fa-exclamation-triangle");
    speak("I need camera access to track your workout. Please grant permission and try again.");
    stopCamera(); // Reset state
  });
}

function stopCamera() {
  workoutState = 'idle';
  clearTimeout(readyTimeoutId);
  clearTimeout(pauseTimeoutId);
  clearTimeout(resumeTimeoutId);

  startButton.disabled = false;
  stopButton.disabled = true;
  resetButton.disabled = true;

  if (camera) {
    camera.stop();
    camera = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  poseIndicator.style.background = "rgba(107, 114, 128, 0.9)";
  poseIndicator.innerHTML = '<i class="fas fa-user"></i>';

  updateFeedback("Workout Ended", `Great session! ${repCount} reps completed.`, "fas fa-flag-checkered");
  if (repCount > 0) {
      speak(`Outstanding workout! You completed ${repCount} reps!`);
  }
}

// ---
// Focus Mode
// ---
function enterFocusMode() {
  isFocusMode = true;
  document.body.classList.add('focus-mode');
  focusModeOverlay.classList.add('active');
  if (appElement.requestFullscreen) {
    appElement.requestFullscreen().catch(err => console.log(err));
  }
  updateFocusModeStats();
}

function exitFocusMode() {
  isFocusMode = false;
  document.body.classList.remove('focus-mode');
  focusModeOverlay.classList.remove('active');
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function updateFocusModeStats() {
    // This is now handled within the main updateStats() function
}

function updateFocusModeFeedback(title, message) {
  if (!isFocusMode) return;
  focusFeedbackTitle.textContent = title;
  focusFeedbackMessage.textContent = message;
}

// ---
// Modal & Theming & Speech
// ---
function showDemoModal() {
  const exerciseName = exerciseData[currentExercise].name;
  demoTitle.textContent = `${exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1)} Demo`;
  demoVideo.src = demoVideos[currentExercise];
  demoModal.classList.add('active');
  speak(`Let's watch the demo for ${exerciseName}.`);
}

function closeDemoModal() {
  demoModal.classList.remove('active');
  demoVideo.src = "";
}

function speak(text) {
  if (isMuted || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.volume = 0.8;
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('dark-mode');
    themeToggleBtn.querySelector('i').className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('theme', newTheme);
}

function toggleMute() {
    isMuted = !isMuted;
    muteBtn.querySelector('i').className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    if (isMuted) window.speechSynthesis.cancel();
    localStorage.setItem('muted', isMuted);
}

// ---
// Local Storage Persistence
// ---
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleBtn.querySelector('i').className = 'fas fa-sun';
    }
}

function initializeMuteState() {
    isMuted = localStorage.getItem('muted') === 'true';
    if (isMuted) muteBtn.querySelector('i').className = 'fas fa-volume-mute';
}

function initializeStats() {
    const savedStats = localStorage.getItem('fittracker-stats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        totalReps = stats.totalReps || 0;
        totalCalories = stats.totalCalories || 0;
        updateStats();
    }
}

window.addEventListener('beforeunload', () => {
  localStorage.setItem('fittracker-stats', JSON.stringify({ totalReps, totalCalories }));
});

console.log("🚀 Enhanced FitTracker AI loaded and ready!");
