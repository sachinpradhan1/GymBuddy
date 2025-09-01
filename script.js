// Get all elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const repCountElement = document.getElementById("rep-count");
const caloriesElement = document.getElementById("calories");
const progressElement = document.getElementById("progress");
const feedbackTitleElement = document.getElementById("feedback-title");
const feedbackMessageElement = document.getElementById("feedback-message");
const feedbackIconElement = document.getElementById("feedback-icon");
const startButton = document.getElementById("start-btn");
const stopButton = document.getElementById("stop-btn");
const exerciseOptions = document.querySelectorAll('.exercise-option');

// Variables for rep counting
let repCount = 0;
let calories = 0;
let direction = "down";
let camera = null;
let currentExercise = "curl";
let isActive = false;
let targetReps = 20;

// Create floating particles
function createParticles() {
  const particlesContainer = document.querySelector('.floating-particles');
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
    particlesContainer.appendChild(particle);
  }
}

createParticles();

// Exercise selection
exerciseOptions.forEach(option => {
  option.addEventListener('click', () => {
    exerciseOptions.forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
    currentExercise = option.dataset.exercise;
    resetStats();
    updateFeedback("Exercise Changed", `Now tracking ${currentExercise === 'curl' ? 'Bicep Curls' : 'Squats'}`, "fas fa-exchange-alt");
    speak(`Now tracking ${currentExercise === 'curl' ? 'bicep curls' : 'squats'}`);
  });
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

    if (results.poseLandmarks && isActive) {
      // Draw enhanced skeleton
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00f5ff",
        lineWidth: 4
      });

      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#ff6b6b",
        radius: 5
      });

      // Exercise logic
      processExercise(results.poseLandmarks);
    }
  }

  if (!results.poseLandmarks && isActive) {
    updateFeedback("No Person Detected", "Please step into view of the camera", "fas fa-exclamation-triangle");
  }
});

function processExercise(landmarks) {
  const lm = landmarks;

  if (currentExercise === "curl") {
    const shoulder = lm[11];
    const elbow = lm[13];
    const wrist = lm[15];
    const angle = calculateAngle(shoulder, elbow, wrist);

    if (angle < 160 && angle > 60) {
      updateFeedback("Performing Curl", `Angle: ${Math.round(angle)}°`, "fas fa-muscle");
    }

    if (angle > 160 && direction === "up") {
      direction = "down";
    }
    if (angle < 60 && direction === "down") {
      direction = "up";
      repCount++;
      calories += 0.5;
      updateStats();
      updateFeedback("Great Rep!", "Keep it up!", "fas fa-check-circle");
      speak("Good rep! Keep going!");
    }

    if (elbow.y > shoulder.y - 0.1 && wrist.y > elbow.y) {
      updateFeedback("Form Check", "Keep elbow close to body!", "fas fa-exclamation");
    }

  } else if (currentExercise === "squat") {
    const hip = lm[23];
    const knee = lm[25];
    const ankle = lm[27];
    const angle = calculateAngle(hip, knee, ankle);

    if (angle < 160 && angle > 90) {
      updateFeedback("Performing Squat", `Depth: ${Math.round(angle)}°`, "fas fa-hiking");
    }

    if (angle > 160 && direction === "up") {
      direction = "down";
    }
    if (angle < 90 && direction === "down") {
      direction = "up";
      repCount++;
      calories += 0.8;
      updateStats();
      updateFeedback("Excellent Squat!", "Perfect depth!", "fas fa-check-circle");
      speak("Good rep! Keep it low!");
    }

    if (angle > 120 && direction === "down") {
      updateFeedback("Go Deeper", "Hips below knees for full rep", "fas fa-arrow-down");
    }
  }
}

function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

function updateStats() {
  repCountElement.textContent = repCount;
  repCountElement.parentElement.classList.add('rep-animation');
  setTimeout(() => {
    repCountElement.parentElement.classList.remove('rep-animation');
  }, 300);

  caloriesElement.textContent = Math.round(calories);

  const progress = Math.min((repCount / targetReps) * 100, 100);
  progressElement.style.width = progress + '%';

  if (repCount >= targetReps) {
    updateFeedback("Workout Complete!", `Amazing! You completed ${targetReps} reps!`, "fas fa-trophy");
    speak("Congratulations! Workout completed!");
  }
}

function updateFeedback(title, message, iconClass) {
  feedbackTitleElement.textContent = title;
  feedbackMessageElement.textContent = message;
  feedbackIconElement.innerHTML = `<i class="${iconClass}"></i>`;
}

function resetStats() {
  repCount = 0;
  calories = 0;
  direction = "down";
  updateStats();
}

function startCamera() {
  if (camera) return;

  isActive = true;
  startButton.disabled = true;
  stopButton.disabled = false;

  updateFeedback("Starting Camera", "Initializing your workout session...", "fas fa-camera");

  camera = new Camera(video, {
    onFrame: async () => {
      await pose.send({ image: video });
    },
    width: 640,
    height: 480
  });

  camera.start().then(() => {
    updateFeedback("Ready to Exercise", "Start your first rep!", "fas fa-play");
    speak(`Welcome to Gym Buddy Pro! Ready for ${currentExercise === 'curl' ? 'bicep curls' : 'squats'}?`);
  });
}

function stopCamera() {
  if (!camera) return;

  isActive = false;
  startButton.disabled = false;
  stopButton.disabled = true;

  camera.stop();
  camera = null;
  video.srcObject = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateFeedback("Workout Ended", `Great job! You completed ${repCount} reps and burned ${Math.round(calories)} calories!`, "fas fa-flag-checkered");
  speak(`Great workout! You completed ${repCount} reps and burned ${Math.round(calories)} calories!`);
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.volume = 0.8;
    utter.rate = 0.9;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }
}

// Event listeners
startButton.addEventListener('click', startCamera);
stopButton.addEventListener('click', stopCamera);

// Initialize
updateFeedback("Ready to Start", "Choose an exercise and press start!", "fas fa-play");
console.log("🚀 GymBuddy Pro loaded and ready!");