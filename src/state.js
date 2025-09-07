import { DEFAULT_TARGET_REPS, DEFAULT_CALORIE_GOAL } from './constants.js';

// Workout state
let repCount = 0;
let sessionCalories = 0;
let totalReps = 0;
let totalCalories = 0;
let currentExercise = "curl";
let workoutState = 'idle'; // 'idle', 'preparing', 'active', 'paused', 'resuming', 'finished'
let targetReps = DEFAULT_TARGET_REPS;
let calorieGoal = DEFAULT_CALORIE_GOAL;
let formScore = 100;
let repsPerSet = 10;
let numberOfSets = 3;
let currentSet = 1;

// UI state
let isMuted = false;
let isFocusMode = false;

// Camera state
let camera = null;

// Timeout IDs
let readyTimeoutId = null;
let pauseTimeoutId = null;
let resumeTimeoutId = null;

// Rep tracking state for each arm/leg
let exercisePhase = {};

// Smoothing arrays for better accuracy
let angleHistory = { left: [], right: [] };

// Form tracking
let lastRepTime = 0;
let formFeedbackHistory = [];

// Goals and achievements
let dailyStats = {
  reps: 0,
  calories: 0,
  workouts: 0,
  date: new Date().toDateString()
};

// Getters
export const getRepCount = () => repCount;
export const getSessionCalories = () => sessionCalories;
export const getTotalReps = () => totalReps;
export const getTotalCalories = () => totalCalories;
export const getCurrentExercise = () => currentExercise;
export const getWorkoutState = () => workoutState;
export const getTargetReps = () => targetReps;
export const getCalorieGoal = () => calorieGoal;
export const getFormScore = () => formScore;
export const getRepsPerSet = () => repsPerSet;
export const getNumberOfSets = () => numberOfSets;
export const getCurrentSet = () => currentSet;
export const getIsMuted = () => isMuted;
export const getIsFocusMode = () => isFocusMode;
export const getCamera = () => camera;
export const getExercisePhase = () => exercisePhase;
export const getAngleHistory = () => angleHistory;
export const getLastRepTime = () => lastRepTime;
export const getFormFeedbackHistory = () => formFeedbackHistory;
export const getDailyStats = () => dailyStats;

// Setters
export const setRepCount = (value) => { repCount = value; };
export const setSessionCalories = (value) => { sessionCalories = value; };
export const setTotalReps = (value) => { totalReps = value; };
export const setTotalCalories = (value) => { totalCalories = value; };
export const setCurrentExercise = (value) => { currentExercise = value; };
export const setWorkoutState = (value) => { workoutState = value; };
export const setTargetReps = (value) => { targetReps = value; };
export const setCalorieGoal = (value) => { calorieGoal = value; };
export const setFormScore = (value) => { formScore = value; };
export const setRepsPerSet = (value) => { repsPerSet = value; };
export const setNumberOfSets = (value) => { numberOfSets = value; };
export const setCurrentSet = (value) => { currentSet = value; };
export const setIsMuted = (value) => { isMuted = value; };
export const setIsFocusMode = (value) => { isFocusMode = value; };
export const setCamera = (value) => { camera = value; };
export const setExercisePhase = (value) => { exercisePhase = value; };
export const setAngleHistory = (value) => { angleHistory = value; };
export const setLastRepTime = (value) => { lastRepTime = value; };
export const setFormFeedbackHistory = (value) => { formFeedbackHistory = value; };
export const setDailyStats = (value) => { dailyStats = value; };

// Increment functions
export const incrementRepCount = () => { repCount++; };
export const incrementTotalReps = () => { totalReps++; };
export const addSessionCalories = (amount) => { sessionCalories += amount; };
export const addTotalCalories = (amount) => { totalCalories += amount; };
export const addDailyReps = (amount) => { dailyStats.reps += amount; };
export const addDailyCalories = (amount) => { dailyStats.calories += amount; };
export const incrementDailyWorkouts = () => { dailyStats.workouts++; };

// Timeout management
export const getReadyTimeoutId = () => readyTimeoutId;
export const getPauseTimeoutId = () => pauseTimeoutId;
export const getResumeTimeoutId = () => resumeTimeoutId;
export const setReadyTimeoutId = (id) => { readyTimeoutId = id; };
export const setPauseTimeoutId = (id) => { pauseTimeoutId = id; };
export const setResumeTimeoutId = (id) => { resumeTimeoutId = id; };

// Clear all timeouts
export const clearAllTimeouts = () => {
  if (readyTimeoutId) {
    clearTimeout(readyTimeoutId);
    readyTimeoutId = null;
  }
  if (pauseTimeoutId) {
    clearTimeout(pauseTimeoutId);
    pauseTimeoutId = null;
  }
  if (resumeTimeoutId) {
    clearTimeout(resumeTimeoutId);
    resumeTimeoutId = null;
  }
};