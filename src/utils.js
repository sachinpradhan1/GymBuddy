import { HISTORY_SIZE, formFeedback, exerciseData } from './constants.js';
import { 
  getIsMuted, 
  incrementRepCount, 
  incrementTotalReps, 
  addSessionCalories, 
  addTotalCalories,
  addDailyReps,
  addDailyCalories,
  getCurrentExercise,
  getLastRepTime,
  setLastRepTime,
  getFormScore,
  setFormScore,
  getFormFeedbackHistory,
  setFormFeedbackHistory
} from './state.js';

// Calculate angle between three points
export function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  return angle > 180 ? 360 - angle : angle;
}

// Smooth angle using moving average
export function smoothAngle(angle, side, angleHistory) {
  angleHistory[side].push(angle);
  if (angleHistory[side].length > HISTORY_SIZE) {
    angleHistory[side].shift();
  }
  return angleHistory[side].reduce((sum, a) => sum + a, 0) / angleHistory[side].length;
}

// Enhanced rep increment with form analysis
export function incrementRep() {
  const currentTime = Date.now();
  const exercise = getCurrentExercise();
  const exerciseInfo = exerciseData[exercise];
  
  incrementRepCount();
  incrementTotalReps();
  addDailyReps(1);
  
  const caloriesPerRep = exerciseInfo.calories;
  addSessionCalories(caloriesPerRep);
  addTotalCalories(caloriesPerRep);
  addDailyCalories(caloriesPerRep);

  // Analyze form and timing
  const formAnalysis = analyzeRepForm(currentTime, exercise);
  updateFormScore(formAnalysis);
  
  // Trigger UI animation
  const statBox = document.getElementById('current-reps')?.parentElement;
  if (statBox) {
    statBox.classList.add('rep-animation');
    setTimeout(() => statBox.classList.remove('rep-animation'), 400);
  }

  // Provide feedback every 5 reps or on form issues
  const repCount = getRepCount();
  if (repCount > 0 && (repCount % 5 === 0 || formAnalysis.needsFeedback)) {
    const message = formAnalysis.needsFeedback ? 
      formAnalysis.message : 
      `${repCount} reps! ${getEncouragementMessage()}`;
    speak(message);
  }

  setLastRepTime(currentTime);
}

// Analyze form for the current rep
function analyzeRepForm(currentTime, exercise) {
  const exerciseInfo = exerciseData[exercise];
  const lastTime = getLastRepTime();
  const timeBetweenReps = currentTime - lastTime;
  
  let formAnalysis = {
    score: 100,
    needsFeedback: false,
    message: "",
    category: "excellent"
  };

  // Check rep speed
  if (lastTime > 0) {
    if (timeBetweenReps < exerciseInfo.formThresholds.speedThreshold * 0.5) {
      formAnalysis.score -= 20;
      formAnalysis.needsFeedback = true;
      formAnalysis.message = getRandomMessage(formFeedback.tooFast);
      formAnalysis.category = "tooFast";
    } else if (timeBetweenReps > exerciseInfo.formThresholds.speedThreshold * 2) {
      formAnalysis.score -= 10;
      formAnalysis.needsFeedback = true;
      formAnalysis.message = getRandomMessage(formFeedback.tooSlow);
      formAnalysis.category = "tooSlow";
    }
  }

  return formAnalysis;
}

// Update form score with smoothing
function updateFormScore(formAnalysis) {
  const currentScore = getFormScore();
  const history = getFormFeedbackHistory();
  
  history.push(formAnalysis.score);
  if (history.length > 10) {
    history.shift();
  }
  
  // Calculate smoothed score
  const averageScore = history.reduce((sum, score) => sum + score, 0) / history.length;
  const newScore = Math.max(60, Math.min(100, Math.round(averageScore)));
  
  setFormScore(newScore);
  setFormFeedbackHistory(history);
}

// Get random encouragement message
export function getEncouragementMessage() {
  const messages = ["Great work!", "Keep it up!", "You're doing great!", "Amazing!", "Fantastic!", "Excellent!", "Outstanding!", "Perfect!"];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get random message from category
function getRandomMessage(messageArray) {
  return messageArray[Math.floor(Math.random() * messageArray.length)];
}

// Text-to-speech function
export function speak(text) {
  if (getIsMuted() || !('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.volume = 0.8;
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

// Format time for display
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate calories burned per minute for exercise
export function getCaloriesPerMinute(exercise) {
  const baseCalories = exerciseData[exercise].calories;
  return baseCalories * 12; // Assuming 12 reps per minute average
}

// Check if daily goal is achieved
export function checkDailyGoals(dailyStats, calorieGoal) {
  return {
    calorieGoalMet: dailyStats.calories >= calorieGoal,
    workoutStreak: dailyStats.workouts > 0
  };
}