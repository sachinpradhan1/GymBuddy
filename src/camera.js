import { 
  video, 
  canvas, 
  ctx, 
  poseIndicator 
} from './elements.js';

import {
  getWorkoutState,
  setWorkoutState,
  getCamera,
  setCamera,
  getPauseTimeoutId,
  setPauseTimeoutId,
  getResumeTimeoutId,
  setResumeTimeoutId,
  getReadyTimeoutId,
  setReadyTimeoutId,
  clearAllTimeouts,
  getCurrentExercise
} from './state.js';

import { exerciseData } from './constants.js';
import { speak } from './utils.js';
import { updateFeedback } from './ui.js';
import { processExercise } from './workoutLogic.js';

// Initialize MediaPipe Pose
export function initializePose() {
  const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
  });

  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  pose.onResults(handlePoseResults);
  
  return pose;
}

// Handle pose detection results
function handlePoseResults(results) {
  // Clear and redraw canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    handlePoseDetected(results.poseLandmarks);
  } else {
    handlePoseLost();
  }
}

// Handle when pose is detected
export function handlePoseDetected(landmarks) {
  const pauseTimeoutId = getPauseTimeoutId();
  const resumeTimeoutId = getResumeTimeoutId();
  const workoutState = getWorkoutState();
  
  // Clear pause timeout if pose is back
  if (pauseTimeoutId) {
    clearTimeout(pauseTimeoutId);
    setPauseTimeoutId(null);
  }
  
  // Handle resuming from pause
  if (workoutState === 'resuming') {
    clearTimeout(resumeTimeoutId);
    setWorkoutState('active');
    updateFeedback("Workout Resumed", "Let's keep going!", "fas fa-play");
    speak("Let's go!");
  }

  // Draw pose landmarks
  drawConnectors(ctx, landmarks, POSE_CONNECTIONS, { 
    color: "rgba(99, 102, 241, 0.8)", 
    lineWidth: 3 
  });
  drawLandmarks(ctx, landmarks, { 
    color: "rgba(16, 185, 129, 0.9)", 
    radius: 4 
  });

  // Update pose indicator
  poseIndicator.style.background = "rgba(16, 185, 129, 0.9)";
  poseIndicator.innerHTML = '<i class="fas fa-user-check"></i>';

  // Process based on workout state
  if (workoutState === 'preparing') {
    checkReadyState(landmarks);
  } else if (workoutState === 'active') {
    processExercise(landmarks);
  }
}

// Handle when pose is lost
export function handlePoseLost() {
  const workoutState = getWorkoutState();
  const pauseTimeoutId = getPauseTimeoutId();
  
  // Update pose indicator
  poseIndicator.style.background = "rgba(239, 68, 68, 0.9)";
  poseIndicator.innerHTML = '<i class="fas fa-user-slash"></i>';

  // Handle pausing workout when pose is lost
  if (workoutState === 'active' && !pauseTimeoutId) {
    const timeoutId = setTimeout(() => {
      setWorkoutState('paused');
      updateFeedback("Workout Paused", "Step back in front of the camera to resume", "fas fa-pause-circle");
      speak("Workout paused.");
    }, 3000);
    setPauseTimeoutId(timeoutId);
  } else if (workoutState === 'paused') {
    // If already paused, start resume countdown once pose is back
    setWorkoutState('resuming');
    resumeWorkout();
  }
}

// Check if user is ready to start workout
export function checkReadyState(landmarks) {
  const readyTimeoutId = getReadyTimeoutId();
  
  if (!readyTimeoutId) {
    updateFeedback("Ready!", "Hold position to start...", "fas fa-check-circle");
    speak("Hold this position to begin.");
    
    const timeoutId = setTimeout(() => {
      setWorkoutState('active');
      const exerciseName = exerciseData[getCurrentExercise()].name;
      updateFeedback("Workout Started!", `Let's go! First rep of ${exerciseName}!`, "fas fa-play-circle");
      speak("Workout started! Let's go!");
      setReadyTimeoutId(null);
    }, 2000);
    
    setReadyTimeoutId(timeoutId);
  }
}

// Resume workout with countdown
function resumeWorkout() {
  let countdown = 3;
  
  const doResumeCountdown = () => {
    if (countdown > 0) {
      updateFeedback("Resuming...", `Get ready to continue in ${countdown}`, "fas fa-play-circle");
      speak(countdown.toString());
      countdown--;
      const timeoutId = setTimeout(doResumeCountdown, 1000);
      setResumeTimeoutId(timeoutId);
    }
  };
  
  doResumeCountdown();
}

// Start camera
export function startCamera() {
  const existingCamera = getCamera();
  if (existingCamera) return Promise.resolve();

  setWorkoutState('preparing');
  updateFeedback("Initializing Camera", "Getting your workout ready...", "fas fa-camera");

  const camera = new Camera(video, {
    onFrame: async () => {
      const pose = window.poseInstance;
      if (pose) {
        await pose.send({ image: video });
      }
    },
    width: 640,
    height: 480
  });

  return camera.start().then(() => {
    setCamera(camera);
    const exerciseName = exerciseData[getCurrentExercise()].name;
    updateFeedback("Get Ready", `Prepare for ${exerciseName}.`, "fas fa-user-clock");
    speak(`Camera is ready. Get into position for ${exerciseName}.`);
  }).catch((error) => {
    console.error('Camera error:', error);
    updateFeedback("Camera Error", "Please allow camera access.", "fas fa-exclamation-triangle");
    speak("I need camera access to track your workout. Please grant permission and try again.");
    stopCamera();
    throw error;
  });
}

// Stop camera
export function stopCamera() {
  const camera = getCamera();
  
  setWorkoutState('idle');
  clearAllTimeouts();

  if (camera) {
    camera.stop();
    setCamera(null);
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Reset pose indicator
  poseIndicator.style.background = "rgba(107, 114, 128, 0.9)";
  poseIndicator.innerHTML = '<i class="fas fa-user"></i>';
}