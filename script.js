// Get all elements
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
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const muteBtn = document.getElementById("mute-btn");

// Variables for rep counting
let repCount = 0;
let sessionCalories = 0;
let totalReps = 0;
let totalCalories = 0;
let direction = "down";
let camera = null;
let currentExercise = "curl";
let workoutState = 'idle'; // 'idle', 'preparing', 'active', 'paused', 'resuming'
let readyTimeoutId = null;
let pauseTimeoutId = null;
let resumeTimeoutId = null;
let resumeCountdown = 3;
let targetReps = 20;
let formScore = 100;
let isMuted = false;

// Demo video URLs for each exercise
const demoVideos = {
  curl: "https://www.youtube.com/embed/ykJmrZ5v0Oo",
  squat: "https://www.youtube.com/embed/aclHkVaku9U",
  pushup: "https://www.youtube.com/embed/IODxDxX7oi4",
  shoulderpress: "https://www.youtube.com/embed/qEwKCR5JCog",
  jumpingjack: "https://www.youtube.com/embed/c4DAnQ6DtF8"
};

// Exercise names and calorie values
const exerciseData = {
  curl: { name: "bicep curls", calories: 0.5 },
  squat: { name: "squats", calories: 0.8 },
  pushup: { name: "push-ups", calories: 0.7 },
  shoulderpress: { name: "shoulder press", calories: 0.6 },
  jumpingjack: { name: "jumping jacks", calories: 0.9 }
};

// Exercise selection
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

// Demo modal functions
function showDemoModal() {
  const exerciseName = exerciseData[currentExercise].name;
  demoTitle.textContent = `${exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1)} Demo`;
  demoVideo.src = demoVideos[currentExercise];
  demoModal.classList.add('active');
  speak(`Here's how to perform ${exerciseName} with perfect form. Study the movement carefully!`);
}

function closeDemoModal() {
  demoModal.classList.remove('active');
  demoVideo.src = "";
}

// Demo modal event listeners
closeDemoBtn.addEventListener('click', closeDemoModal);
skipDemoBtn.addEventListener('click', () => {
  closeDemoModal();
  startCamera();
});
startAfterDemoBtn.addEventListener('click', () => {
  closeDemoModal();
  startCamera();
});

// Load MediaPipe Pose model
const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// Enhanced pose detection and drawing
pose.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.image) {
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      if (pauseTimeoutId) {
        clearTimeout(pauseTimeoutId);
        pauseTimeoutId = null;
      }

      // Always draw skeleton if landmarks are detected
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "var(--primary)", lineWidth: 3 });
      drawLandmarks(ctx, results.poseLandmarks, { color: "var(--success)", radius: 4 });

      poseIndicator.style.background = "rgba(16, 185, 129, 0.9)";
      poseIndicator.innerHTML = '<i class="fas fa-user-check"></i>';

      if (workoutState === 'preparing') {
        checkReadyState(results.poseLandmarks);
      } else if (workoutState === 'active') {
        processExercise(results.poseLandmarks);
      } else if (workoutState === 'paused') {
        resumeWorkout();
      }
    } else {
      poseIndicator.style.background = "rgba(239, 68, 68, 0.9)";
      poseIndicator.innerHTML = '<i class="fas fa-user-slash"></i>';

      if (workoutState === 'active' && !pauseTimeoutId) {
        pauseTimeoutId = setTimeout(() => {
          workoutState = 'paused';
          updateFeedback("Workout Paused", "Step back in front of the camera to resume", "fas fa-pause-circle");
          speak("Workout paused.");
        }, 3000); // 3 seconds to pause
      }
    }
  }
});

function resumeWorkout() {
  if (workoutState !== 'paused') return;

  workoutState = 'resuming';
  let countdown = 3;

  const doResumeCountdown = () => {
    if (countdown > 0) {
      updateFeedback("Resuming...", `Get ready to continue in ${countdown}`, "fas fa-play-circle");
      speak(countdown);
      countdown--;
      resumeTimeoutId = setTimeout(doResumeCountdown, 1000);
    } else {
      workoutState = 'active';
      updateFeedback("Workout Resumed", "Let's keep going!", "fas fa-play");
      speak("Let's go!");
    }
  };

  doResumeCountdown();
}

function checkReadyState(landmarks) {
  const lm = landmarks;
  let startPoseCorrect = false;
  let feedbackMessage = "";

  switch (currentExercise) {
    case "curl":
      const curlAngle = calculateAngle(lm[11], lm[13], lm[15]);
      if (curlAngle > 160) {
        startPoseCorrect = true;
        feedbackMessage = "Hold this position to begin.";
      } else {
        feedbackMessage = "Stand straight with arms down to begin.";
      }
      break;
    case "squat":
      const squatAngle = calculateAngle(lm[23], lm[25], lm[27]);
      if (squatAngle > 160) {
        startPoseCorrect = true;
        feedbackMessage = "Hold this position to begin.";
      } else {
        feedbackMessage = "Stand up straight to begin.";
      }
      break;
    case "pushup":
      const bodyAngle = calculateAngle(lm[11], lm[23], lm[25]);
      const armAngle = calculateAngle(lm[11], lm[13], lm[15]);
      if (bodyAngle > 160 && armAngle > 160) {
        startPoseCorrect = true;
        feedbackMessage = "Hold this plank position to begin.";
      } else {
        feedbackMessage = "Get into a straight-arm plank position.";
      }
      break;
    case "shoulderpress":
      const spArmAngle = calculateAngle(lm[11], lm[13], lm[15]);
      if (spArmAngle > 160) {
        startPoseCorrect = true;
        feedbackMessage = "Hold this position with arms down to begin.";
      } else {
        feedbackMessage = "Stand with your arms down to begin.";
      }
      break;
    case "jumpingjack":
      const jjShoulderAngle = calculateAngle(lm[13], lm[11], lm[23]);
      if (jjShoulderAngle < 45) { // Arms down by side
        startPoseCorrect = true;
        feedbackMessage = "Hold this position to begin.";
      } else {
        feedbackMessage = "Stand with your arms down by your sides.";
      }
      break;
  }

  if (startPoseCorrect) {
    if (!readyTimeoutId) {
      updateFeedback("Ready!", "Hold this position to start the workout.", "fas fa-check-circle");
      speak("Hold this position to begin.");
      readyTimeoutId = setTimeout(() => {
        workoutState = 'active';
        const exerciseName = exerciseData[currentExercise].name;
        updateFeedback("Workout Started!", `Let's go! First rep of ${exerciseName}!`, "fas fa-play-circle");
        speak(`Workout started! Let's go!`);
        readyTimeoutId = null;
      }, 2000); // 2-second hold to start
    }
  } else {
    if (readyTimeoutId) {
      clearTimeout(readyTimeoutId);
      readyTimeoutId = null;
    }
    updateFeedback("Get Ready", feedbackMessage, "fas fa-user-clock");
  }
}

function processExercise(landmarks) {
  const lm = landmarks;

  if (currentExercise === "curl") {
    const shoulder = lm[11];
    const elbow = lm[13];
    const wrist = lm[15];
    const angle = calculateAngle(shoulder, elbow, wrist);

    if (angle < 160 && angle > 60) {
      updateFeedback("Performing Curl", `Perfect form! Angle: ${Math.round(angle)}°`, "fas fa-muscle");
      formScore = Math.min(100, formScore + 0.5);
    }

    if (angle > 160 && direction === "up") {
      direction = "down";
    }
    if (angle < 60 && direction === "down") {
      direction = "up";
      incrementRep();
      updateFeedback("Excellent Curl!", "Perfect bicep contraction!", "fas fa-check-circle");
    }

    if (elbow.y > shoulder.y - 0.1) {
      updateFeedback("Form Check", "Keep elbow stable!", "fas fa-exclamation");
      formScore = Math.max(60, formScore - 1);
    }

  } else if (currentExercise === "squat") {
    const hip = lm[23];
    const knee = lm[25];
    const ankle = lm[27];
    const angle = calculateAngle(hip, knee, ankle);

    if (angle < 160 && angle > 90) {
      updateFeedback("Performing Squat", `Great depth! Angle: ${Math.round(angle)}°`, "fas fa-walking");
      formScore = Math.min(100, formScore + 0.5);
    }

    if (angle > 160 && direction === "up") {
      direction = "down";
    }
    if (angle < 90 && direction === "down") {
      direction = "up";
      incrementRep();
      updateFeedback("Perfect Squat!", "Excellent depth and form!", "fas fa-check-circle");
    }

    if (angle > 120 && direction === "down") {
      updateFeedback("Go Deeper", "Lower those hips!", "fas fa-arrow-down");
      formScore = Math.max(70, formScore - 0.5);
    }

  } else if (currentExercise === "pushup") {
    const shoulder = lm[11];
    const elbow = lm[13];
    const wrist = lm[15];
    const hip = lm[23];

    const elbowAngle = calculateAngle(shoulder, elbow, wrist);
    const bodyAlignment = Math.abs(shoulder.y - hip.y);

    if (elbowAngle < 140 && elbowAngle > 60 && bodyAlignment < 0.2) {
      updateFeedback("Performing Push-up", `Excellent form! Depth: ${Math.round(elbowAngle)}°`, "fas fa-hand-point-up");
      formScore = Math.min(100, formScore + 0.5);
    }

    if (elbowAngle > 140 && direction === "up") {
      direction = "down";
    }
    if (elbowAngle < 90 && direction === "down") {
      direction = "up";
      incrementRep();
      updateFeedback("Amazing Push-up!", "Perfect chest engagement!", "fas fa-check-circle");
    }

    if (bodyAlignment > 0.3) {
      updateFeedback("Form Check", "Keep your body straight!", "fas fa-exclamation");
      formScore = Math.max(60, formScore - 1);
    }

  } else if (currentExercise === "shoulderpress") {
    const shoulder = lm[11];
    const elbow = lm[13];
    const wrist = lm[15];

    // Calculate angle for shoulder press (elbow to shoulder to hip)
    const hip = lm[23];
    const shoulderAngle = calculateAngle(elbow, shoulder, hip);

    // Also check arm extension (shoulder to elbow to wrist)
    const armAngle = calculateAngle(shoulder, elbow, wrist);

    if (shoulderAngle > 60 && shoulderAngle < 120 && armAngle > 90) {
      updateFeedback("Performing Shoulder Press", `Great form! Extension: ${Math.round(armAngle)}°`, "fas fa-angle-up");
      formScore = Math.min(100, formScore + 0.5);
    }

    if (armAngle < 90 && direction === "up") {
      direction = "down";
    }
    if (armAngle > 160 && direction === "down") {
      direction = "up";
      incrementRep();
      updateFeedback("Perfect Press!", "Excellent shoulder strength!", "fas fa-check-circle");
    }

    if (shoulderAngle < 45) {
      updateFeedback("Form Check", "Lift your arms higher!", "fas fa-arrow-up");
      formScore = Math.max(70, formScore - 0.5);
    }
  } else if (currentExercise === "jumpingjack") {
    const leftShoulder = lm[11];
    const rightShoulder = lm[12];
    const leftHip = lm[23];
    const rightHip = lm[24];
    const leftAnkle = lm[27];
    const rightAnkle = lm[28];

    const leftShoulderAngle = calculateAngle(lm[13], leftShoulder, leftHip);
    const rightShoulderAngle = calculateAngle(lm[14], rightShoulder, rightHip);

    const feetDistance = Math.abs(leftAnkle.x - rightAnkle.x);
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    // Arms are up and feet are apart
    if (leftShoulderAngle > 130 && rightShoulderAngle > 130 && feetDistance > shoulderWidth * 1.5 && direction === "down") {
      direction = "up"; // "up" state for jumping jacks means arms are up
    }

    // Arms are down and feet are together
    if (leftShoulderAngle < 45 && rightShoulderAngle < 45 && feetDistance < shoulderWidth * 1.2 && direction === "up") {
      direction = "down";
      incrementRep();
      updateFeedback("Great Jack!", "Keep the rhythm!", "fas fa-star");
    }
  }

  updateStats();
}

function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

function incrementRep() {
  repCount++;
  totalReps++;
  const caloriesPerRep = exerciseData[currentExercise].calories;
  sessionCalories += caloriesPerRep;
  totalCalories += caloriesPerRep;

  // Add rep animation
  currentRepsElement.parentElement.classList.add('rep-animation');
  setTimeout(() => {
    currentRepsElement.parentElement.classList.remove('rep-animation');
  }, 400);

  // Speak encouragement message every 5 reps
  if (repCount > 0 && repCount % 5 === 0) {
    speak(`${repCount} reps! ${getEncouragementMessage()}`);
  }
}

function getEncouragementMessage() {
  const messages = [
    "Outstanding! Keep that energy up!",
    "Perfect form! You're absolutely crushing it!",
    "Incredible rep! Your hard work shows!",
    "Amazing technique! Push through the burn!",
    "Fantastic! You're getting stronger every rep!",
    "Brilliant execution! Stay focused and strong!",
    "Superb form! You're a natural athlete!",
    "Exceptional work! Feel that muscle activation!",
    "Outstanding dedication! Keep the momentum going!",
    "Perfect! Your consistency is paying off!"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function updateStats() {
  currentRepsElement.textContent = repCount;
  currentCaloriesElement.textContent = Math.round(sessionCalories * 10) / 10;
  totalRepsElement.textContent = totalReps;
  totalCaloriesElement.textContent = Math.round(totalCalories * 10) / 10;
  formScoreElement.textContent = Math.round(formScore);

  const progress = Math.min((repCount / targetReps) * 100, 100);
  progressFillElement.style.width = progress + '%';
  progressTextElement.textContent = `${repCount}/${targetReps}`;

  if (repCount >= targetReps) {
    updateFeedback("Workout Complete!", `🎉 Amazing! ${targetReps} reps completed!`, "fas fa-trophy");
    speak(`Congratulations! Workout completed! You absolutely dominated those ${targetReps} reps and burned ${Math.round(sessionCalories * 10) / 10} calories! You're a fitness champion!`);
  }
}

function updateFeedback(title, message, iconClass) {
  feedbackTitleElement.textContent = title;
  feedbackMessageElement.textContent = message;
  feedbackIconElement.innerHTML = `<i class="${iconClass}"></i>`;

  // Update icon color based on feedback type
  if (iconClass.includes('check') || iconClass.includes('trophy')) {
    feedbackIconElement.style.background = "linear-gradient(135deg, var(--success), #059669)";
  } else if (iconClass.includes('exclamation')) {
    feedbackIconElement.style.background = "linear-gradient(135deg, var(--warning), #d97706)";
  } else {
    feedbackIconElement.style.background = "linear-gradient(135deg, var(--primary), var(--secondary))";
  }
}

function resetSession() {
  repCount = 0;
  sessionCalories = 0;
  direction = "down";
  formScore = 100;

  clearTimeout(readyTimeoutId);
  clearTimeout(pauseTimeoutId);
  clearTimeout(resumeTimeoutId);
  readyTimeoutId = null;
  pauseTimeoutId = null;
  resumeTimeoutId = null;

  workoutState = camera ? 'preparing' : 'idle';
  updateStats();
}

function resetAll() {
  resetSession();
  totalReps = 0;
  totalCalories = 0;
  updateStats();
}

function resetReps() {
    repCount = 0;
    sessionCalories = 0;
    updateStats();
    updateFeedback("Rep Count Reset", "Your reps for this session have been cleared.", "fas fa-undo");
    speak("Rep count reset.");
}

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
    onFrame: async () => {
      await pose.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start().then(() => {
    const exerciseName = exerciseData[currentExercise].name;
    updateFeedback("Get Ready", `Prepare for ${exerciseName}.`, "fas fa-user-clock");
    speak(`Camera is ready. Get into position for ${exerciseName}.`);
    startButton.innerHTML = '<i class="fas fa-play"></i><span>Start Workout</span>';
  }).catch((error) => {
    console.error("Failed to acquire camera feed:", error);
    updateFeedback("Camera Error", "Please allow camera access", "fas fa-exclamation-triangle");
    speak("I need camera access to track your workout. Please allow camera permission and try again.");

    workoutState = 'idle';
    startButton.disabled = false;
    stopButton.disabled = true;
    startButton.innerHTML = '<i class="fas fa-play"></i><span>Start Workout</span>';
  });
}

function stopCamera() {
  if (!camera) return;

  workoutState = 'idle';
  clearTimeout(readyTimeoutId);
  clearTimeout(pauseTimeoutId);
  clearTimeout(resumeTimeoutId);
  readyTimeoutId = null;
  pauseTimeoutId = null;
  resumeTimeoutId = null;

  startButton.disabled = false;
  stopButton.disabled = true;
  resetButton.disabled = true;

  if (camera.stop) {
    camera.stop();
  }
  camera = null;

  if (video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset pose indicator
  poseIndicator.style.background = "rgba(107, 114, 128, 0.9)";
  poseIndicator.innerHTML = '<i class="fas fa-user"></i>';

  const exerciseName = exerciseData[currentExercise].name;
  updateFeedback("Workout Ended", `Great session! ${repCount} reps completed`, "fas fa-flag-checkered");
  speak(`Outstanding workout! You completed ${repCount} ${exerciseName} and burned ${Math.round(sessionCalories * 10) / 10} calories! Your dedication is inspiring!`);
}

function speak(text) {
  if (isMuted || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.volume = 0.9;
  utter.rate = 0.85;
  utter.pitch = 1.1;

  // Try to use a more expressive voice
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice =>
    voice.name.includes('Google') ||
    voice.name.includes('Enhanced') ||
    voice.name.includes('Premium') ||
    voice.name.includes('Neural')
  );
  if (preferredVoice) {
    utter.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utter);
}

// Event listeners
startButton.addEventListener('click', startWorkoutFlow);
stopButton.addEventListener('click', stopCamera);
resetButton.addEventListener('click', resetReps);

focusModeBtn.addEventListener('click', () => {
  document.body.classList.toggle('focus-mode');
  const icon = focusModeBtn.querySelector('i');
  if (document.body.classList.contains('focus-mode')) {
    icon.classList.remove('fa-expand');
    icon.classList.add('fa-compress');
  } else {
    icon.classList.remove('fa-compress');
    icon.classList.add('fa-expand');
  }
});

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  const icon = themeToggleBtn.querySelector('i');
  if (isDarkMode) {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  } else {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  }
});

muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  localStorage.setItem('muted', isMuted ? 'true' : 'false');
  const icon = muteBtn.querySelector('i');
  if (isMuted) {
    icon.classList.remove('fa-volume-up');
    icon.classList.add('fa-volume-mute');
    window.speechSynthesis.cancel();
  } else {
    icon.classList.remove('fa-volume-mute');
    icon.classList.add('fa-volume-up');
  }
});

// Initialize voices when available
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    // Voices are now loaded
  };
}

// Initialize
updateFeedback("Welcome to FitTracker AI", "Choose an exercise and start your journey!", "fas fa-rocket");
speak("Welcome to FitTracker AI! Your personal trainer is ready to help you achieve your fitness goals! Choose an exercise and let's get started!");

// Load saved theme from localStorage
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggleBtn.querySelector('i').classList.remove('fa-moon');
  themeToggleBtn.querySelector('i').classList.add('fa-sun');
}

// Load saved mute state from localStorage
const savedMuteState = localStorage.getItem('muted');
if (savedMuteState === 'true') {
  isMuted = true;
  muteBtn.querySelector('i').classList.remove('fa-volume-up');
  muteBtn.querySelector('i').classList.add('fa-volume-mute');
}

// Load saved stats from localStorage
const savedStats = localStorage.getItem('fittracker-stats');
if (savedStats) {
  const stats = JSON.parse(savedStats);
  totalReps = stats.totalReps || 0;
  totalCalories = stats.totalCalories || 0;
  updateStats();
}

// Save stats on page unload
window.addEventListener('beforeunload', () => {
  localStorage.setItem('fittracker-stats', JSON.stringify({
    totalReps: totalReps,
    totalCalories: totalCalories
  }));
});

console.log("🚀 FitTracker AI loaded and ready!");
