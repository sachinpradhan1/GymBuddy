import { exerciseData } from './constants.js';
import { 
  getWorkoutState,
  getCurrentExercise,
  getExercisePhase,
  setWorkoutState,
  getTargetReps,
  getRepCount
} from './state.js';
import { calculateAngle, smoothAngle, incrementRep, speak } from './utils.js';
import { updateFeedback, updateStats } from './ui.js';

// Process exercise based on current selection
export function processExercise(landmarks) {
  const exercise = getCurrentExercise();
  
  switch (exercise) {
    case "curl": 
      processBicepCurl(landmarks); 
      break;
    case "squat": 
      processSquat(landmarks); 
      break;
    case "pushup": 
      processPushup(landmarks); 
      break;
    case "shoulderpress": 
      processShoulderPress(landmarks); 
      break;
  }
  
  updateStats();
  checkWorkoutCompletion();
}

// Check if workout is complete
function checkWorkoutCompletion() {
  const repCount = getRepCount();
  const targetReps = getTargetReps();
  
  if (repCount >= targetReps && getWorkoutState() === 'active') {
    setWorkoutState('finished');
    updateFeedback("Workout Complete!", `Amazing! ${targetReps} reps completed!`, "fas fa-trophy");
    speak(`Congratulations! Workout completed! You dominated those ${targetReps} reps.`);
  }
}

// Process bicep curl exercise
export function processBicepCurl(lm) {
  const leftAngle = smoothAngle(calculateAngle(lm[11], lm[13], lm[15]), 'left', getAngleHistory());
  const rightAngle = smoothAngle(calculateAngle(lm[12], lm[14], lm[16]), 'right', getAngleHistory());

  // Process each arm independently
  detectRep({ angle: leftAngle, phase: 'down', minAngle: 30, maxAngle: 160 }, 'left');
  detectRep({ angle: rightAngle, phase: 'down', minAngle: 30, maxAngle: 160 }, 'right');

  // Enhanced feedback with form analysis
  const formFeedback = analyzeCurlForm(leftAngle, rightAngle);
  updateFeedback("Bicep Curls", `L: ${Math.round(leftAngle)}° R: ${Math.round(rightAngle)}° | ${formFeedback}`, "fas fa-dumbbell");
}

// Process shoulder press exercise
export function processShoulderPress(lm) {
  const leftAngle = smoothAngle(calculateAngle(lm[11], lm[13], lm[15]), 'left', getAngleHistory());
  const rightAngle = smoothAngle(calculateAngle(lm[12], lm[14], lm[16]), 'right', getAngleHistory());
  const avgAngle = (leftAngle + rightAngle) / 2;

  // Use average of both arms to count rep only once
  detectRep({ angle: avgAngle, phase: 'up', minAngle: 80, maxAngle: 160 }, 'main');

  const formFeedback = analyzeShoulderPressForm(leftAngle, rightAngle, avgAngle);
  updateFeedback("Shoulder Press", `L: ${Math.round(leftAngle)}° R: ${Math.round(rightAngle)}° | ${formFeedback}`, "fas fa-angle-up");
}

// Process squat exercise
export function processSquat(lm) {
  const leftAngle = smoothAngle(calculateAngle(lm[23], lm[25], lm[27]), 'left', getAngleHistory());
  const rightAngle = smoothAngle(calculateAngle(lm[24], lm[26], lm[28]), 'right', getAngleHistory());
  const avgAngle = (leftAngle + rightAngle) / 2;

  detectRep({ angle: avgAngle, phase: 'down', minAngle: 90, maxAngle: 170 }, 'main');
  
  const formFeedback = analyzeSquatForm(avgAngle, leftAngle, rightAngle);
  updateFeedback("Squats", `Depth: ${Math.round(avgAngle)}° | ${formFeedback}`, "fas fa-walking");
}

// Process push-up exercise
export function processPushup(lm) {
  const leftAngle = smoothAngle(calculateAngle(lm[11], lm[13], lm[15]), 'left', getAngleHistory());
  const rightAngle = smoothAngle(calculateAngle(lm[12], lm[14], lm[16]), 'right', getAngleHistory());
  const avgAngle = (leftAngle + rightAngle) / 2;

  detectRep({ angle: avgAngle, phase: 'down', minAngle: 90, maxAngle: 160 }, 'main');
  
  const formFeedback = analyzePushupForm(avgAngle, leftAngle, rightAngle);
  updateFeedback("Push-ups", `Depth: ${Math.round(avgAngle)}° | ${formFeedback}`, "fas fa-hand-point-up");
}

// Generic rep detection logic
export function detectRep(options, side) {
  const { angle, phase, minAngle, maxAngle } = options;
  const exercisePhase = getExercisePhase();
  const state = exercisePhase[side];

  if (!state) return;

  if (phase === 'down') { // For exercises starting in a down/extended state
    if (state.phase === 'down' && angle < minAngle) {
      state.phase = 'up';
    } else if (state.phase === 'up' && angle > maxAngle) {
      state.phase = 'down';
      incrementRep();
    }
  } else if (phase === 'up') { // For exercises starting in an up/flexed state
    if (state.phase === 'up' && angle > maxAngle) {
      state.phase = 'down';
    } else if (state.phase === 'down' && angle < minAngle) {
      state.phase = 'up';
      incrementRep();
    }
  }
}

// Enhanced form analysis functions
function analyzeCurlForm(leftAngle, rightAngle) {
  const exercise = exerciseData.curl;
  const avgAngle = (leftAngle + rightAngle) / 2;
  const angleDiff = Math.abs(leftAngle - rightAngle);
  
  if (angleDiff > 30) {
    return "Balance both arms";
  } else if (avgAngle < exercise.formThresholds.optimalMinAngle) {
    return "Great depth!";
  } else if (avgAngle > exercise.formThresholds.optimalMaxAngle) {
    return "Full extension";
  } else {
    return "Perfect form";
  }
}

function analyzeShoulderPressForm(leftAngle, rightAngle, avgAngle) {
  const exercise = exerciseData.shoulderpress;
  const angleDiff = Math.abs(leftAngle - rightAngle);
  
  if (angleDiff > 25) {
    return "Keep arms even";
  } else if (avgAngle > exercise.formThresholds.optimalMaxAngle) {
    return "Excellent extension!";
  } else if (avgAngle < exercise.formThresholds.optimalMinAngle) {
    return "Press higher";
  } else {
    return "Great form";
  }
}

function analyzeSquatForm(avgAngle, leftAngle, rightAngle) {
  const exercise = exerciseData.squat;
  const legBalance = Math.abs(leftAngle - rightAngle);
  
  if (legBalance > 20) {
    return "Balance your stance";
  } else if (avgAngle < exercise.formThresholds.optimalMinAngle) {
    return "Excellent depth!";
  } else if (avgAngle > exercise.formThresholds.optimalMaxAngle) {
    return "Go deeper";
  } else {
    return "Perfect squat";
  }
}

function analyzePushupForm(avgAngle, leftAngle, rightAngle) {
  const exercise = exerciseData.pushup;
  const armBalance = Math.abs(leftAngle - rightAngle);
  
  if (armBalance > 25) {
    return "Even arm position";
  } else if (avgAngle < exercise.formThresholds.optimalMinAngle) {
    return "Great depth!";
  } else if (avgAngle > exercise.formThresholds.optimalMaxAngle) {
    return "Lower down more";
  } else {
    return "Excellent form";
  }
}

// Get angle history from state (helper function)
function getAngleHistory() {
  return getAngleHistory();
}